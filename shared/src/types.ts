// ============================================================
// Liar's Bar Poker — Shared Type Definitions
// ============================================================

import { VALUES, SUITS, STAGES } from './constants';

// ---------- Card Types ----------

export type CardValue = typeof VALUES[number];
export type CardSuit = typeof SUITS[number];

export interface Card {
  val: CardValue;
  suit: CardSuit;
  isRed: boolean;
}

// ---------- Game Enums ----------

export type StageName = typeof STAGES[number];

export type PlayerActionType = 'fold' | 'call' | 'allin';

// ---------- Server-Side Player (FULL state, never sent to client raw) ----------

export interface ServerPlayer {
  id: string;         // socket ID
  seatIndex: number;
  name: string;
  avatar: string;
  cards: Card[];
  bullets: number;
  folded: boolean;
  isDead: boolean;
  isAllIn: boolean;
  hasUsedSwap: boolean;
  matchRank: number | null;
  isBot: boolean;
}

// ---------- Client-Side Views (what each client receives) ----------

/** My own player info — includes my cards */
export interface MyPlayerView {
  seatIndex: number;
  name: string;
  avatar: string;
  cards: Card[];           // Only MY cards
  bullets: number;
  folded: boolean;
  isDead: boolean;
  isAllIn: boolean;
  hasUsedSwap: boolean;
  matchRank: number | null;
}

/** Opponent info — NO card details */
export interface OpponentView {
  seatIndex: number;
  name: string;
  avatar: string;
  cardCount: number;       // Only how many cards, not what they are
  bullets: number;
  folded: boolean;
  isDead: boolean;
  isAllIn: boolean;
  hasUsedSwap: boolean;
  matchRank: number | null;
}

/** Full game state sent to a specific client */
export interface ClientGameState {
  roomId: string;
  stage: number;
  stageName: StageName;
  communityCards: Card[];
  currentTurnSeat: number;
  me: MyPlayerView;
  opponents: OpponentView[];
  isProcessingRoulette: boolean;
  maxPlayers: number;
  canSwap: boolean;
  canAllIn: boolean;
  hasAnyAllIn: boolean;
  turnTimeRemaining: number;
  /** The server-authoritative roulette currently being presented, if any. */
  activeRoulette: RouletteResult | null;
  /** Current server time, used to translate server timelines to the client clock. */
  serverTime: number;
}

// ---------- Showdown ----------

export interface HandEvaluation {
  score: number;
  name: string;
}

export interface ShowdownResult {
  seatIndex: number;
  name: string;
  avatar: string;
  cards: Card[];
  handName: string;
  rank: number;        // 1 = winner
}

// ---------- Roulette ----------

export interface RouletteResult {
  seatIndex: number;
  name: string;
  avatar: string;
  bullets: number;
  stopIndex: number;
  isDead: boolean;
  isGodSave: boolean;
  /** Server timestamp used by every client to follow the same animation timeline. */
  startedAt: number;
}

// ---------- Game Events (Server → Client) ----------

export type GameEvent =
  | { type: 'action_bubble'; seatIndex: number; action: string }
  | { type: 'stage_change'; stage: number; stageName: StageName; newCommunityCards: Card[] }
  | { type: 'roulette'; result: RouletteResult }
  | { type: 'showdown'; results: ShowdownResult[]; winnerName: string; winnerHand: string }
  | { type: 'god_save'; seatIndex: number; name: string }
  | { type: 'match_over'; winnerSeatIndex: number; winnerName: string }
  | { type: 'round_start' }
  | { type: 'round_over'; message: string }
  | { type: 'swap_available'; drawnCards: Card[] }
  | { type: 'swap_used'; seatIndex: number }
  | { type: 'all_allin_fast_forward' }
  | { type: 'player_left'; seatIndex: number; name: string }
  | { type: 'log'; message: string; key?: 'roulette_turn'; name?: string };

// ---------- Client → Server Payloads ----------

export interface CreateRoomPayload {
  playerName: string;
  avatar: string;
  maxPlayers: number;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  avatar: string;
}

export interface PlayerActionPayload {
  action: PlayerActionType;
}

export interface SwapCardPayload {
  handCardIndex: number;   // 0 or 1
  drawnCardIndex: number;  // Index in the drawn pool
}

export interface ReconnectPayload {
  token: string;
  roomId: string;
}

// ---------- Server → Client Responses ----------

export interface JoinedSuccessPayload {
  seatIndex: number;
  roomId: string;
  maxPlayers: number;
  token: string;         // For reconnection
}

export interface RoomUpdatePayload {
  players: Array<{
    seatIndex: number;
    name: string;
    avatar: string;
    connected: boolean;
  }>;
  maxPlayers: number;
  roomId: string;
}
