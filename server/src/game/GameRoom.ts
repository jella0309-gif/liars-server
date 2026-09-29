import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  ServerPlayer,
  GameEvent,
  PlayerActionType,
  ShowdownResult,
  SOCKET_EVENTS,
  ROOM,
  TIMING,
  AVATARS,
} from '@liars-bar/shared';
import { GameEngine } from './GameEngine.js';
import { logger } from '../utils/logger.js';
import { decideBotAction } from './BotAI.js';

export class GameRoom {
  public id: string;
  public maxPlayers: number;
  public players: ServerPlayer[] = [];
  public connections: Map<string, string> = new Map(); // token -> socketId
  private io: Server;
  private engine: GameEngine;
  private gameStarted: boolean = false;
  private isRoundOverState: boolean = false;

  constructor(id: string, maxPlayers: number, io: Server) {
    this.id = id;
    this.maxPlayers = Math.max(
      ROOM.MIN_PLAYERS,
      Math.min(ROOM.MAX_PLAYERS, maxPlayers)
    );
    this.io = io;
    this.engine = new GameEngine(this.players, this.maxPlayers);
  }

  public addPlayer(
    socketId: string,
    name: string,
    avatar: string,
    isBot: boolean = false
  ): { token: string; seatIndex: number } | null {
    if (this.players.length >= this.maxPlayers) return null;

    const seatIndex = this.players.length;
    const token = uuidv4();

    const player: ServerPlayer = {
      id: isBot ? `bot-${uuidv4()}` : socketId,
      seatIndex,
      name,
      avatar,
      cards: [],
      bullets: 1,
      folded: false,
      isDead: false,
      isAllIn: false,
      hasUsedSwap: false,
      isBot,
    };

    this.players.push(player);
    if (!isBot) {
      this.connections.set(token, socketId);
    }

    this.broadcastRoomUpdate();

    if (this.players.length === this.maxPlayers && !this.gameStarted) {
      this.startGame();
    }

    return { token, seatIndex };
  }

  public addBot() {
    const avatar =
      AVATARS.find((a) => !this.players.some((p) => p.avatar === a)) ??
      AVATARS[5];
    const names = ['Monkey', 'Fox', 'Boar', 'Dog', 'Cat', 'Bear'];
    this.addPlayer('', `${names[AVATARS.indexOf(avatar)]} (Bot)`, avatar, true);
  }

  public reconnect(token: string, newSocketId: string): boolean {
    if (this.connections.has(token)) {
      const oldSocketId = this.connections.get(token);
      const player = this.players.find((p) => p.id === oldSocketId);
      if (player) {
        player.id = newSocketId;
        this.connections.set(token, newSocketId);
        this.broadcastRoomUpdate();
        this.sendGameState(player);
        return true;
      }
    }
    return false;
  }

  public disconnect(socketId: string): void {
    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      // In a full game we might fold them or wait for reconnect.
      // For now, let's just log and they can reconnect if they have token.
      logger.info(`Player ${player.name} disconnected from room ${this.id}`);
      this.broadcastRoomUpdate();
    }
  }

  public broadcastRoomUpdate() {
    this.io.to(this.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
      roomId: this.id,
      maxPlayers: this.maxPlayers,
      players: this.players.map((p) => ({
        seatIndex: p.seatIndex,
        name: p.name,
        avatar: p.avatar,
        connected: p.isBot
          ? true
          : Array.from(this.connections.values()).includes(p.id),
      })),
    });
  }

  private startGame() {
    this.gameStarted = true;
    logger.info(`Room ${this.id} starting game...`);
    setTimeout(() => {
      this.startRound();
    }, TIMING.COUNTDOWN_BEFORE_START * 1000);
  }

  private startRound() {
    if (this.engine.isMatchOver()) {
      const winner = this.engine.getWinner();
      if (winner) {
        this.io.to(this.id).emit(SOCKET_EVENTS.MATCH_OVER, {
          winnerSeatIndex: winner.seatIndex,
          winnerName: winner.name,
        });
        this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
          type: 'match_over',
          winnerSeatIndex: winner.seatIndex,
          winnerName: winner.name,
        });
      }
      return;
    }

    this.isRoundOverState = false;
    this.engine.initRound();
    this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, { type: 'round_start' });
    this.broadcastGameState();
    this.processTurn();
  }

  private processTurn() {
    const state = this.engine.getStateForPlayer(-1);
    const turnSeat = state.currentTurnSeat;
    if (turnSeat === -1) return; // Stage ended or showdown

    const player = this.players.find((p) => p.seatIndex === turnSeat);
    if (!player) return;

    if (player.isBot) {
      setTimeout(() => {
        const action = decideBotAction(
          player,
          this.engine.getStateForPlayer(player.seatIndex)
        );
        this.handleAction(player.seatIndex, action);
      }, 1200); // 1.2s delay for bot
    } else {
      this.engine.startTurnTimer(turnSeat, () => {
        this.handleAction(turnSeat, 'fold'); // Auto fold on timeout
      });
    }
  }

  public handleAction(seatIndex: number, action: PlayerActionType) {
    if (this.isRoundOverState || this.engine.isMatchOver()) return;
    const events = this.engine.handleAction(seatIndex, action);
    this.dispatchEvents(events);
  }

  private dispatchEvents(events: GameEvent[]) {
    if (events.length === 0) return;

    // Process events sequentially if needed, but for simplicity emit them and broadcast state
    for (const event of events) {
      this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, event);

      if (event.type === 'roulette') {
        this.broadcastGameState();
        // Wait for roulette animation, then continue
        setTimeout(() => {
          if (event.result.isDead) {
            // Player died
          }
          const nextEvents = this.engine.nextTurnAfterRoulette();
          this.broadcastGameState();
          this.dispatchEvents(nextEvents);
          if (nextEvents.length === 0) this.processTurn();
        }, TIMING.ROULETTE_ANIMATION_DURATION * 1000);
        return; // Stop processing further events in this batch until roulette is done
      }

      if (event.type === 'showdown') {
        this.broadcastGameState();
        this.handleShowdownResolution(event.results as ShowdownResult[]);
        return;
      }
    }

    this.broadcastGameState();
    this.processTurn();
  }

  private handleShowdownResolution(results: ShowdownResult[]) {
    // Determine losers and let them pull the trigger
    const losers = results.filter((r) => r.rank > 1);
    const aliveLosers = losers
      .map((l) => this.players.find((p) => p.seatIndex === l.seatIndex))
      .filter((p): p is ServerPlayer => !!p && !p.isDead && !p.folded);

    // Task 4: Give players full inspection duration (7s) to see everyone's cards before shooting
    let delay = TIMING.SHOWDOWN_INSPECT_DURATION * 1000;
    aliveLosers.forEach((loser) => {
      setTimeout(() => {
        if (loser) {
          const r = this.engine.dispatchRoulette(loser);
          this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
            type: 'log',
            message: `☠ Đến lượt [${loser.name}] bóp cò Russian Roulette!`,
          });
          this.io
            .to(this.id)
            .emit(SOCKET_EVENTS.GAME_EVENT, { type: 'roulette', result: r });
          if (r.isGodSave) {
            this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
              type: 'god_save',
              seatIndex: r.seatIndex,
              name: r.name,
            });
          }
          this.broadcastGameState();
        }
      }, delay);
      delay += TIMING.ROULETTE_ANIMATION_DURATION * 1000 + 1000;
    });

    setTimeout(() => {
      this.isRoundOverState = true;
      if (this.engine.isMatchOver()) {
        const winner = this.engine.getWinner();
        if (winner) {
          this.io.to(this.id).emit(SOCKET_EVENTS.MATCH_OVER, {
            winnerSeatIndex: winner.seatIndex,
            winnerName: winner.name,
          });
          this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
            type: 'match_over',
            winnerSeatIndex: winner.seatIndex,
            winnerName: winner.name,
          });
        }
      } else {
        // Round ended, do not auto-restart! Let the user decide to click next round!
        this.io.to(this.id).emit(SOCKET_EVENTS.ROUND_OVER, {
          message: 'Ván bài đã kết thúc! Bấm [TIẾP TỤC VÁN MỚI] để bắt đầu.',
        });
        this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
          type: 'round_over',
          message: 'Ván bài đã kết thúc! Bấm [TIẾP TỤC VÁN MỚI] để bắt đầu.',
        });
      }
      this.broadcastGameState();
    }, delay + 1000);
  }

  public handleNextRound(): void {
    if (!this.isRoundOverState || this.engine.isMatchOver()) return;
    logger.info(`Room ${this.id} user requested next round...`);
    this.startRound();
  }

  public restartMatch(): void {
    if (!this.isRoundOverState || !this.engine.isMatchOver()) return;
    logger.info(`Room ${this.id} restarting match for play again...`);
    this.isRoundOverState = false;
    this.gameStarted = true;
    this.players.forEach((p) => {
      p.isDead = false;
      p.bullets = 1;
      p.cards = [];
      p.folded = false;
      p.isAllIn = false;
      p.hasUsedSwap = false;
    });
    this.engine = new GameEngine(this.players, this.maxPlayers);
    this.broadcastRoomUpdate();
    setTimeout(() => {
      this.startRound();
    }, 1500);
  }

  public handleSwapRequest(seatIndex: number): void {
    if (this.isRoundOverState || this.engine.isMatchOver()) return;
    const res = this.engine.handleSwapRequest(seatIndex);
    if (res) {
      const player = this.players.find((p) => p.seatIndex === seatIndex);
      if (player && !player.isBot) {
        this.io.to(player.id).emit(SOCKET_EVENTS.GAME_EVENT, {
          type: 'swap_available',
          drawnCards: res.drawnCards,
        });
      }
    }
  }

  public handleSwapConfirm(
    seatIndex: number,
    handIdx: number,
    drawnIdx: number
  ): void {
    const success = this.engine.handleSwapConfirm(seatIndex, handIdx, drawnIdx);
    if (success) {
      this.io
        .to(this.id)
        .emit(SOCKET_EVENTS.GAME_EVENT, { type: 'swap_used', seatIndex });
      this.broadcastGameState();
    }
  }

  public broadcastGameState() {
    this.players.forEach((p) => {
      if (!p.isBot) {
        this.sendGameState(p);
      }
    });
  }

  private sendGameState(player: ServerPlayer) {
    const state = this.engine.getStateForPlayer(player.seatIndex);
    state.roomId = this.id;
    this.io.to(player.id).emit(SOCKET_EVENTS.GAME_STATE, state);
  }
}
