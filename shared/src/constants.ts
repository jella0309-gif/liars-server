// ============================================================
// Liar's Bar Poker — Shared Constants
// ============================================================

/** Card values in ascending order (index = rank) */
export const VALUES = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;

/** Card suits */
export const SUITS = ['♠', '♣', '♦', '♥'] as const;

/** Red suits for display color */
export const RED_SUITS: readonly string[] = ['♦', '♥'];

/** Game stages in order */
export const STAGES = [
  'PRE-FLOP',
  'FLOP',
  'TURN',
  'RIVER',
  'SHOWDOWN',
] as const;

/** Timing constants (in seconds) */
export const TIMING = {
  TURN_TIME_LIMIT: 60, // 60s thinking time for actions
  SWAP_TIME_LIMIT: 23, // 23s thinking time for card swap
  COUNTDOWN_BEFORE_START: 3,
  ROULETTE_ANIMATION_DURATION: 4.5,
  GOD_SAVE_DISPLAY_DURATION: 3.5,
  STAGE_TRANSITION_DELAY: 1.0,
  ACTION_BUBBLE_DURATION: 1.4,
  SHOWDOWN_INSPECT_DURATION: 12.0, // 12s for players to inspect all hands before shooting
  NEXT_ROUND_DELAY: 2.5,
  RECONNECT_GRACE: 20, // seconds a disconnected player may return before being dropped
} as const;

/** Revolver configuration */
export const REVOLVER = {
  CHAMBER_COUNT: 6,
  INITIAL_BULLETS: 1,
  /** Calling never loads past this many chambers: a loser who only called
   * faces at most a 4-in-6 shot. Only all-in fills the cylinder. */
  CALL_BULLET_CAP: 5,
  /** Chance a full cylinder still misfires (all-in only). */
  GOD_SAVE_CHANCE: 0.05,
} as const;

/** Room configuration limits */
export const ROOM = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  CODE_PREFIX: 'LB',
} as const;

/** Swap card draw counts by stage */
export const SWAP_DRAW_COUNT: Record<number, number> = {
  1: 3, // FLOP: draw 3 cards
  2: 2, // TURN: draw 2 cards
};

/** Available avatar emojis */
export const AVATARS = ['🐵', '🦊', '🐗', '🐶', '🐱', '🐻'] as const;

/** Bot avatar */
export const BOT_AVATAR = '🐻';
export const BOT_NAME = 'Bear (Bot)';

/** Socket event names */
export const SOCKET_EVENTS = {
  // Client → Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  PLAYER_ACTION: 'player_action',
  PLAY_AGAIN: 'play_again',
  NEXT_ROUND: 'next_round',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Server → Client
  JOINED_SUCCESS: 'joined_success',
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  ROOM_UPDATE: 'room_update',
  GAME_STATE: 'game_state',
  GAME_EVENT: 'game_event',
  ROULETTE_RESULT: 'roulette_result',
  ROUND_OVER: 'round_over',
  MATCH_OVER: 'match_over',
  PLAYER_DISCONNECTED: 'player_disconnected',
  ERROR: 'game_error',
} as const;
