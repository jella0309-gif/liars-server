import { t } from '../i18n';
import { create } from 'zustand';
import {
  TIMING,
  type ClientGameState,
  type Card,
  type RouletteResult,
  type ShowdownResult,
} from '@liars-bar/shared';
export interface PlayerInfo {
  seatIndex: number;
  name: string;
  avatar: string;
  connected: boolean;
}
export interface ActionBubble {
  seatIndex: number;
  text: string;
  cls: string;
}
interface GameStore {
  isConnected: boolean;
  currentRoomId: string;
  mySeatIndex: number;
  roomMaxPlayers: number;
  isLobbyOpen: boolean;
  playersInfo: PlayerInfo[];
  errorMessage: string | null;
  gameState: ClientGameState | null;
  tableLog: string;
  history: string[];
  activeBubble: ActionBubble | null;
  roundNumber: number;
  turnDeadline: number;
  rouletteResult: RouletteResult | null;
  rouletteStartedAt: number | null;
  rouletteRevealed: boolean;
  godSavePlayerName: string | null;
  winnerName: string | null;
  winnerSeatIndex: number | null;
  swapPoolCards: Card[] | null;
  showdownResults: ShowdownResult[] | null;
  isRoundOver: boolean;
  roundOverMessage: string | null;
  setConnected: (value: boolean) => void;
  setError: (message: string | null) => void;
  setJoinedSuccess: (roomId: string, seat: number, maxPlayers: number) => void;
  setRoomUpdate: (players: PlayerInfo[], maxPlayers: number) => void;
  setGameState: (state: ClientGameState) => void;
  setTableLog: (log: string) => void;
  showActionBubble: (seat: number, text: string, cls?: string) => void;
  setRouletteResult: (result: RouletteResult | null) => void;
  revealRoulette: () => void;
  setGodSave: (name: string | null) => void;
  setWinner: (name: string | null, seat?: number) => void;
  setSwapPool: (cards: Card[] | null) => void;
  setShowdownResults: (results: ShowdownResult[] | null) => void;
  setRoundOver: (value: boolean, message?: string | null) => void;
  setLobbyOpen: (value: boolean) => void;
  startRound: () => void;
}
export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  currentRoomId: '',
  mySeatIndex: -1,
  roomMaxPlayers: 2,
  isLobbyOpen: true,
  playersInfo: [],
  errorMessage: null,
  gameState: null,
  tableLog: t('log.waiting'),
  history: [],
  activeBubble: null,
  roundNumber: 0,
  turnDeadline: 0,
  rouletteResult: null,
  rouletteStartedAt: null,
  rouletteRevealed: false,
  godSavePlayerName: null,
  winnerName: null,
  winnerSeatIndex: null,
  swapPoolCards: null,
  showdownResults: null,
  isRoundOver: false,
  roundOverMessage: null,
  setConnected: (isConnected) => set({ isConnected }),
  setError: (errorMessage) => set({ errorMessage }),
  setJoinedSuccess: (currentRoomId, mySeatIndex, roomMaxPlayers) =>
    set({
      currentRoomId,
      mySeatIndex,
      roomMaxPlayers,
      isLobbyOpen: false,
      gameState: null,
      isRoundOver: false,
      roundOverMessage: null,
      winnerName: null,
      winnerSeatIndex: null,
      showdownResults: null,
      rouletteResult: null,
      rouletteStartedAt: null,
      swapPoolCards: null,
      errorMessage: null,
      roundNumber: 0,
      history: [],
      tableLog: t('log.ready'),
    }),
  setRoomUpdate: (playersInfo, roomMaxPlayers) =>
    set({ playersInfo, roomMaxPlayers }),
  setGameState: (gameState) =>
    set((state) => {
      const newTurn =
        !state.gameState ||
        state.gameState.currentTurnSeat !== gameState.currentTurnSeat ||
        state.gameState.stage !== gameState.stage ||
        !state.turnDeadline;
      const canAct =
        gameState.currentTurnSeat === state.mySeatIndex &&
        !gameState.me.folded &&
        !gameState.me.isDead &&
        !gameState.isProcessingRoulette;
      const activeRoulette = gameState.activeRoulette;
      const activeRouletteAge = activeRoulette
        ? Math.max(0, gameState.serverTime - activeRoulette.startedAt)
        : 0;
      const shouldRecoverRoulette =
        !!activeRoulette &&
        activeRouletteAge < TIMING.ROULETTE_ANIMATION_DURATION * 1000 &&
        state.rouletteResult?.startedAt !== activeRoulette.startedAt;
      const shouldSyncRouletteClock =
        !!activeRoulette &&
        activeRouletteAge < TIMING.ROULETTE_ANIMATION_DURATION * 1000;
      return {
        gameState,
        turnDeadline: newTurn
          ? Date.now() + gameState.turnTimeRemaining * 1000
          : state.turnDeadline,
        ...(!canAct ? { swapPoolCards: null } : {}),
        ...(shouldRecoverRoulette
          ? {
              rouletteResult: activeRoulette,
              rouletteRevealed: false,
              rouletteStartedAt: Date.now() - activeRouletteAge,
            }
          : shouldSyncRouletteClock
            ? { rouletteStartedAt: Date.now() - activeRouletteAge }
          : {}),
      };
    }),
  setTableLog: (tableLog) =>
    set((state) => ({
      tableLog,
      history:
        state.history[0] === tableLog
          ? state.history
          : [tableLog, ...state.history].slice(0, 30),
    })),
  showActionBubble: (seatIndex, text, cls = 'bubble-call') => {
    const bubble = { seatIndex, text, cls };
    set({ activeBubble: bubble });
    setTimeout(
      () =>
        set((state) =>
          state.activeBubble === bubble ? { activeBubble: null } : {}
        ),
      1800
    );
  },
  setRouletteResult: (rouletteResult) =>
  set({
    rouletteResult,
    rouletteRevealed: false,
    rouletteStartedAt: rouletteResult
      ? rouletteResult.startedAt
      : null,
    ...(rouletteResult ? { swapPoolCards: null } : {}),
  }),
  revealRoulette: () => set({ rouletteRevealed: true }),
  setGodSave: (godSavePlayerName) => set({ godSavePlayerName }),
  setWinner: (winnerName, winnerSeatIndex) =>
    set({
      winnerName,
      winnerSeatIndex: winnerSeatIndex ?? null,
      swapPoolCards: null,
    }),
  setSwapPool: (swapPoolCards) => set({ swapPoolCards }),
  setShowdownResults: (showdownResults) =>
    set({
      showdownResults,
      ...(showdownResults ? { swapPoolCards: null } : {}),
    }),
  setRoundOver: (isRoundOver, roundOverMessage = null) =>
    set({
      isRoundOver,
      roundOverMessage,
      ...(isRoundOver ? { swapPoolCards: null } : {}),
    }),
  setLobbyOpen: (isLobbyOpen) => set({ isLobbyOpen }),
  startRound: () =>
    set((state) => ({
      roundNumber: state.winnerName ? 1 : state.roundNumber + 1,
      turnDeadline: 0,
      winnerName: null,
      winnerSeatIndex: null,
      isRoundOver: false,
      roundOverMessage: null,
      showdownResults: null,
      swapPoolCards: null,
      rouletteResult: null,
      rouletteStartedAt: null,
      rouletteRevealed: false,
      godSavePlayerName: null,
      activeBubble: null,
      tableLog: t('log.newRound'),
      history: [
        t('log.newRound'),
        ...state.history,
      ].slice(0, 30),
    })),
}));
