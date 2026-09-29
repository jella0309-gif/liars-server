import {
  ServerPlayer,
  Card,
  GameEvent,
  PlayerActionType,
  ClientGameState,
  MyPlayerView,
  OpponentView,
  RouletteResult,
  STAGES,
  REVOLVER,
  SWAP_DRAW_COUNT,
  TIMING,
} from '@liars-bar/shared';
import { Deck } from './Deck.js';
import { resolveRoulette } from './Roulette.js';
import { evaluateBestHand } from './HandEvaluator.js';

export class GameEngine {
  private players: ServerPlayer[];
  private maxPlayers: number;

  private deck!: Deck;
  private communityCards: Card[] = [];
  private currentStageIndex: number = 0;
  private currentTurnSeat: number = -1;
  private roundActionsCount: number = 0;
  private isProcessingRoulette: boolean = false;
  private activeSeats: number[] = [];
  private turnTimer: NodeJS.Timeout | null = null;
  private turnDeadline = 0;
  private swapDrawnCards: Map<number, Card[]> = new Map();
  private swappedThisTurnSeat: number | null = null;

  constructor(players: ServerPlayer[], maxPlayers: number) {
    this.players = players;
    this.maxPlayers = maxPlayers;
  }

  public initRound(): void {
    this.clearTurnTimer();
    this.deck = new Deck();
    this.communityCards = [];
    this.currentStageIndex = 0;
    this.roundActionsCount = 0;
    this.isProcessingRoulette = false;
    this.swapDrawnCards.clear();
    this.swappedThisTurnSeat = null;

    this.players.forEach((p) => {
      if (!p.isDead) {
        p.cards = this.deck.draw(2);
        p.bullets = REVOLVER.INITIAL_BULLETS;
        p.folded = false;
        p.isAllIn = false;
        p.hasUsedSwap = false;
      }
    });

    this.activeSeats = this.players
      .filter((p) => !p.isDead)
      .map((p) => p.seatIndex);
    this.currentTurnSeat = this.activeSeats[0];
  }

  public handleAction(
    seatIndex: number,
    action: PlayerActionType
  ): GameEvent[] {
    const events: GameEvent[] = [];
    if (this.currentTurnSeat !== seatIndex || this.isProcessingRoulette)
      return events;

    const player = this.players.find((p) => p.seatIndex === seatIndex);
    if (!player || player.isDead || player.folded || player.isAllIn)
      return events;
    const facingAllIn = this.players.some(
      (p) => p.isAllIn && !p.isDead && !p.folded
    );
    if (
      (action === 'call' && facingAllIn) ||
      (action === 'allin' &&
        (this.currentStageIndex === 0 || this.swappedThisTurnSeat === seatIndex))
    )
      return events;

    this.clearTurnTimer();
    this.swapDrawnCards.delete(seatIndex);
    this.swappedThisTurnSeat = null;

    events.push({ type: 'action_bubble', seatIndex, action });

    if (action === 'fold') {
      player.folded = true;
      this.isProcessingRoulette = true;
      const rouletteResult = this.dispatchRoulette(player);
      events.push({ type: 'roulette', result: rouletteResult });

      if (rouletteResult.isGodSave) {
        events.push({ type: 'god_save', seatIndex, name: player.name });
      }

      // Next turn handled after roulette animation typically, but returning events here
    } else if (action === 'call') {
      player.bullets = Math.min(REVOLVER.CHAMBER_COUNT, player.bullets + 1);
      this.roundActionsCount++;
      events.push(...this.nextTurn());
    } else if (action === 'allin') {
      player.bullets = REVOLVER.CHAMBER_COUNT;
      player.isAllIn = true;
      this.roundActionsCount++;
      events.push(...this.nextTurn());
    }

    return events;
  }

  public nextTurnAfterRoulette(): GameEvent[] {
    this.isProcessingRoulette = false;
    return this.nextTurn();
  }

  private nextTurn(): GameEvent[] {
    const aliveNonFolded = this.getAlivePlayers().filter((p) => !p.folded);

    if (aliveNonFolded.length <= 1) {
      return this.handleShowdown();
    }

    const allInCount = aliveNonFolded.filter((p) => p.isAllIn).length;
    if (
      allInCount === aliveNonFolded.length ||
      (allInCount > 0 && this.roundActionsCount >= aliveNonFolded.length)
    ) {
      return this.fastForwardAllIn();
    }

    if (this.roundActionsCount >= aliveNonFolded.length) {
      return this.finishStage();
    }

    // Find next seat
    let nextIdx = this.activeSeats.indexOf(this.currentTurnSeat) + 1;
    while (true) {
      if (nextIdx >= this.activeSeats.length) nextIdx = 0;
      const p = this.players.find(
        (p) => p.seatIndex === this.activeSeats[nextIdx]
      );
      if (p && !p.isDead && !p.folded && !p.isAllIn) {
        this.currentTurnSeat = p.seatIndex;
        break;
      }
      nextIdx++;
    }

    return [];
  }

  private finishStage(): GameEvent[] {
    this.currentStageIndex++;
    this.roundActionsCount = 0;
    const events: GameEvent[] = [];

    if (this.currentStageIndex === 1) {
      this.communityCards.push(...this.deck.draw(3));
    } else if (this.currentStageIndex === 2 || this.currentStageIndex === 3) {
      this.communityCards.push(...this.deck.draw(1));
    } else if (this.currentStageIndex >= 4) {
      return this.handleShowdown();
    }

    events.push({
      type: 'stage_change',
      stage: this.currentStageIndex,
      stageName: STAGES[this.currentStageIndex],
      newCommunityCards: [...this.communityCards],
    });

    // Reset turn to first alive non-folded
    let nextIdx = 0;
    while (true) {
      if (nextIdx >= this.activeSeats.length) break;
      const p = this.players.find(
        (p) => p.seatIndex === this.activeSeats[nextIdx]
      );
      if (p && !p.isDead && !p.folded && !p.isAllIn) {
        this.currentTurnSeat = p.seatIndex;
        break;
      }
      nextIdx++;
    }

    return events;
  }

  private fastForwardAllIn(): GameEvent[] {
    const events: GameEvent[] = [];
    events.push({ type: 'all_allin_fast_forward' });

    // Draw remaining community cards
    const totalCardsNeeded = 5 - this.communityCards.length;
    if (totalCardsNeeded > 0) {
      this.communityCards.push(...this.deck.draw(totalCardsNeeded));
    }
    this.currentStageIndex = 4; // Showdown

    events.push({
      type: 'stage_change',
      stage: this.currentStageIndex,
      stageName: STAGES[this.currentStageIndex],
      newCommunityCards: [...this.communityCards],
    });

    events.push(...this.handleShowdown());
    return events;
  }

  private handleShowdown(): GameEvent[] {
    this.currentTurnSeat = -1;
    this.clearTurnTimer();
    const alivePlayers = this.getAlivePlayers();
    let winner = null;
    let bestScore = -1;
    let bestHandName = '';

    const results = alivePlayers.map((p) => {
      if (p.folded) {
        return {
          seatIndex: p.seatIndex,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          handName: 'Folded',
          rank: -1,
          score: -1,
        };
      }
      const evalResult = evaluateBestHand([...p.cards, ...this.communityCards]);
      return {
        seatIndex: p.seatIndex,
        name: p.name,
        avatar: p.avatar,
        cards: p.cards,
        handName: evalResult.name,
        rank: 0,
        score: evalResult.score,
      };
    });

    // Sort to find ranks
    const nonFolded = results
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score);
    nonFolded.forEach((result, index) => {
      const previous = nonFolded[index - 1];
      result.rank =
        previous && previous.score === result.score
          ? previous.rank
          : index + 1;
    });

    if (nonFolded.length > 0) {
      winner = nonFolded[0];
      bestScore = winner.score;
      bestHandName = winner.handName;
    }

    // Losers pull trigger
    const events: GameEvent[] = [];
    events.push({
      type: 'showdown',
      results: results.map((r) => ({
        seatIndex: r.seatIndex,
        name: r.name,
        avatar: r.avatar,
        cards: r.cards,
        handName: r.handName,
        rank: r.rank,
      })),
      winnerName: winner ? winner.name : '',
      winnerHand: bestHandName,
    });

    // Handle roulettes for losers (not fully implemented the sequential delay here, should be handled via room orchestration)

    return events;
  }

  public dispatchRoulette(player: ServerPlayer): RouletteResult {
    const res = resolveRoulette(player.bullets);
    if (res.isDead && !player.isDead) {
      player.matchRank = this.getAlivePlayers().length;
      player.isDead = true;

      const survivors = this.getAlivePlayers();
      if (survivors.length === 1 && survivors[0].matchRank === null) {
        survivors[0].matchRank = 1;
      }
    }
    return {
      seatIndex: player.seatIndex,
      name: player.name,
      avatar: player.avatar,
      bullets: player.bullets,
      stopIndex: res.stopIndex!,
      isDead: res.isDead!,
      isGodSave: res.isGodSave!,
    };
  }

  public handleSwapRequest(seatIndex: number): { drawnCards: Card[] } | null {
    const p = this.players.find((p) => p.seatIndex === seatIndex);
    if (
      !p ||
      p.hasUsedSwap ||
      p.isDead ||
      p.folded ||
      p.isAllIn ||
      this.currentTurnSeat !== seatIndex ||
      this.isProcessingRoulette ||
      this.players.some(
        (player) => player.isAllIn && !player.isDead && !player.folded
      )
    )
      return null;

    const drawCount = SWAP_DRAW_COUNT[this.currentStageIndex] || 0;
    if (drawCount === 0) return null;

    const existing = this.swapDrawnCards.get(seatIndex);
    if (existing) return { drawnCards: existing };

    const drawn = this.deck.draw(drawCount);
    this.swapDrawnCards.set(seatIndex, drawn);
    return { drawnCards: drawn };
  }

  public handleSwapConfirm(
    seatIndex: number,
    handIdx: number,
    drawnIdx: number
  ): boolean {
    const p = this.players.find((p) => p.seatIndex === seatIndex);
    if (
      !p ||
      p.hasUsedSwap ||
      p.isDead ||
      p.folded ||
      p.isAllIn ||
      this.currentTurnSeat !== seatIndex ||
      this.isProcessingRoulette ||
      !SWAP_DRAW_COUNT[this.currentStageIndex]
    )
      return false;
    const drawn = this.swapDrawnCards.get(seatIndex);
    if (
      !drawn ||
      !Number.isInteger(handIdx) ||
      !Number.isInteger(drawnIdx) ||
      drawnIdx < 0 ||
      drawnIdx >= drawn.length ||
      handIdx < 0 ||
      handIdx > 1
    )
      return false;

    p.cards[handIdx] = drawn[drawnIdx];
    p.hasUsedSwap = true;
    this.swappedThisTurnSeat = seatIndex;
    this.swapDrawnCards.delete(seatIndex);
    return true;
  }

  public handleSwapCancel(seatIndex: number): void {
    this.swapDrawnCards.delete(seatIndex);
  }

  public getStateForPlayer(seatIndex: number): ClientGameState {
    const me = this.players.find((p) => p.seatIndex === seatIndex);
    const opponents = this.players.filter((p) => p.seatIndex !== seatIndex);

    const hasAnyAllIn = this.players.some(
      (p) => p.isAllIn && !p.isDead && !p.folded
    );
    const drawCount = SWAP_DRAW_COUNT[this.currentStageIndex] || 0;

    return {
      roomId: '', // Set by room
      stage: this.currentStageIndex,
      stageName: STAGES[this.currentStageIndex],
      communityCards: this.communityCards,
      currentTurnSeat: this.currentTurnSeat,
      me: me
        ? {
            seatIndex: me.seatIndex,
            name: me.name,
            avatar: me.avatar,
            cards: me.cards,
            bullets: me.bullets,
            folded: me.folded,
            isDead: me.isDead,
            isAllIn: me.isAllIn,
            hasUsedSwap: me.hasUsedSwap,
            matchRank: me.matchRank,
          }
        : ({} as MyPlayerView),
      opponents: opponents.map((p) => ({
        seatIndex: p.seatIndex,
        name: p.name,
        avatar: p.avatar,
        cardCount: p.cards.length,
        bullets: p.bullets,
        folded: p.folded,
        isDead: p.isDead,
        isAllIn: p.isAllIn,
        hasUsedSwap: p.hasUsedSwap,
        matchRank: p.matchRank,
      })),
      isProcessingRoulette: this.isProcessingRoulette,
      maxPlayers: this.maxPlayers,
      canSwap: me ? !me.hasUsedSwap && drawCount > 0 : false,
      canAllIn: me
        ? this.currentStageIndex > 0 && this.swappedThisTurnSeat !== me.seatIndex
        : false,
      hasAnyAllIn,
      turnTimeRemaining: this.turnDeadline
        ? Math.max(0, (this.turnDeadline - Date.now()) / 1000)
        : TIMING.TURN_TIME_LIMIT,
    };
  }

  public getAlivePlayers(): ServerPlayer[] {
    return this.players.filter((p) => !p.isDead);
  }

  public isMatchOver(): boolean {
    return this.getAlivePlayers().length <= 1;
  }

  public getWinner(): ServerPlayer | null {
    if (this.isMatchOver()) {
      return this.getAlivePlayers()[0] || null;
    }
    return null;
  }

  public startTurnTimer(seatIndex: number, onTimeout: () => void): void {
    this.clearTurnTimer();
    this.turnDeadline = Date.now() + TIMING.TURN_TIME_LIMIT * 1000;
    this.turnTimer = setTimeout(() => {
      onTimeout();
    }, TIMING.TURN_TIME_LIMIT * 1000);
  }

  public clearTurnTimer(): void {
    this.turnDeadline = 0;
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }
}
