// ============================================================
// Liar's Bar Poker — Shared Constants
// ============================================================

/** Card values in ascending order (index = rank) */
export const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

/** Card suits */
export const SUITS = ['♠', '♣', '♦', '♥'] as const;

/** Red suits for display color */
export const RED_SUITS: readonly string[] = ['♦', '♥'];

/** Game stages in order */
export const STAGES = ['PRE-FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'] as const;

/** Timing constants (in seconds) */
export const TIMING = {
  TURN_TIME_LIMIT: 20,
  SWAP_TIME_LIMIT: 13,
  COUNTDOWN_BEFORE_START: 3,
  ROULETTE_ANIMATION_DURATION: 4.5,
  GOD_SAVE_DISPLAY_DURATION: 3.5,
  STAGE_TRANSITION_DELAY: 1.0,
  ACTION_BUBBLE_DURATION: 1.4,
  NEXT_ROUND_DELAY: 2.5,
} as const;

/** Revolver configuration */
export const REVOLVER = {
  CHAMBER_COUNT: 6,
  INITIAL_BULLETS: 1,
  GOD_SAVE_CHANCE: 0.02,
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
export const AVATARS = ['🤠', '🦊', '🐗', '🐶', '🐱', '🐻'] as const;

/** Bot avatar */
export const BOT_AVATAR = '🐺';
export const BOT_NAME = 'Sói Bạc (Bot)';

/** Socket event names */
export const SOCKET_EVENTS = {
  // Client → Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  PLAYER_ACTION: 'player_action',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Server → Client
  JOINED_SUCCESS: 'joined_success',
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  ROOM_UPDATE: 'room_update',
  GAME_STATE: 'game_state',
  GAME_EVENT: 'game_event',
  ROULETTE_RESULT: 'roulette_result',
  MATCH_OVER: 'match_over',
  PLAYER_DISCONNECTED: 'player_disconnected',
  ERROR: 'game_error',
} as const;
