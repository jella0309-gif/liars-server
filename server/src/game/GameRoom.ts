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
  private offlineSeats = new Set<number>();
  private dropTimers = new Map<number, NodeJS.Timeout>();
  /** Set by the socket layer; called once no human is left in the room. */
  public onEmpty?: () => void;

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
      matchRank: null,
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

  /** Seat held by a token, or null when the token is unknown / dropped. */
  public seatForToken(token: string): number | null {
    const socketId = this.connections.get(token);
    const player = socketId
      ? this.players.find((p) => p.id === socketId)
      : undefined;
    return player ? player.seatIndex : null;
  }

  public reconnect(token: string, newSocketId: string): boolean {
    if (this.connections.has(token)) {
      const oldSocketId = this.connections.get(token);
      const player = this.players.find((p) => p.id === oldSocketId);
      if (player) {
        player.id = newSocketId;
        this.connections.set(token, newSocketId);
        this.cancelDrop(player.seatIndex);
        logger.info(`Player ${player.name} reconnected to room ${this.id}`);
        this.broadcastRoomUpdate();
        this.sendGameState(player);
        return true;
      }
    }
    return false;
  }

  public disconnect(socketId: string): void {
    const player = this.players.find((p) => p.id === socketId);
    if (!player || player.isBot) return;
    logger.info(`Player ${player.name} disconnected from room ${this.id}`);
    this.offlineSeats.add(player.seatIndex);
    this.broadcastRoomUpdate();
    // Give them a grace period (page reload, brief network loss) before the
    // seat is given up, so the other players are never left waiting.
    this.cancelDrop(player.seatIndex);
    this.dropTimers.set(
      player.seatIndex,
      setTimeout(
        () => this.removePlayer(player.seatIndex),
        TIMING.RECONNECT_GRACE * 1000
      )
    );
  }

  private cancelDrop(seatIndex: number) {
    this.offlineSeats.delete(seatIndex);
    const timer = this.dropTimers.get(seatIndex);
    if (timer) clearTimeout(timer);
    this.dropTimers.delete(seatIndex);
  }

  private removePlayer(seatIndex: number) {
    const player = this.players.find((p) => p.seatIndex === seatIndex);
    this.dropTimers.delete(seatIndex);
    this.offlineSeats.delete(seatIndex);
    if (!player) return;
    for (const [token, socketId] of this.connections) {
      if (socketId === player.id) this.connections.delete(token);
    }
    logger.info(`Player ${player.name} left room ${this.id}`);
    this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
      type: 'player_left',
      seatIndex,
      name: player.name,
    });

    if (!this.gameStarted) {
      // Free the seat: compact the table and tell everyone their new seat.
      this.players.splice(this.players.indexOf(player), 1);
      this.players.forEach((p, index) => (p.seatIndex = index));
      for (const [token, socketId] of this.connections) {
        const p = this.players.find((x) => x.id === socketId);
        if (p)
          this.io.to(socketId).emit(SOCKET_EVENTS.JOINED_SUCCESS, {
            seatIndex: p.seatIndex,
            roomId: this.id,
            maxPlayers: this.maxPlayers,
            token,
          });
      }
      this.broadcastRoomUpdate();
    } else {
      const wasTheirTurn = this.engine.getCurrentTurnSeat() === seatIndex;
      const events = this.engine.dropPlayer(seatIndex);
      this.broadcastRoomUpdate();
      if (this.isRoundOverState) {
        if (this.engine.isMatchOver()) this.announceMatchOver();
        else this.broadcastGameState();
      } else if (events.length > 0) {
        this.dispatchEvents(events);
      } else {
        this.broadcastGameState();
        if (wasTheirTurn) this.processTurn();
      }
    }

    if (!this.players.some((p) => !p.isBot)) {
      this.destroy();
      this.onEmpty?.();
    }
  }

  private announceMatchOver() {
    const winner = this.engine.getWinner();
    if (!winner) return;
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

  public destroy() {
    this.dropTimers.forEach((t) => clearTimeout(t));
    this.dropTimers.clear();
    this.engine.clearTurnTimer();
    logger.info(`Room ${this.id} closed`);
  }

  public broadcastRoomUpdate() {
    this.io.to(this.id).emit(SOCKET_EVENTS.ROOM_UPDATE, {
      roomId: this.id,
      maxPlayers: this.maxPlayers,
      players: this.players.map((p) => ({
        seatIndex: p.seatIndex,
        name: p.name,
        avatar: p.avatar,
        connected: p.isBot ? true : !this.offlineSeats.has(p.seatIndex),
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
            key: 'roulette_turn',
            name: loser.name,
            message: `${loser.name} pulls the trigger.`,
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
          setTimeout(() => {
            this.engine.clearActiveRoulette(r.startedAt);
            this.broadcastGameState();
          }, TIMING.ROULETTE_ANIMATION_DURATION * 1000);
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
          message: 'Round over.',
        });
        this.io.to(this.id).emit(SOCKET_EVENTS.GAME_EVENT, {
          type: 'round_over',
          message: 'Round over.',
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
      p.matchRank = null;
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
