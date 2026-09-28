import { create } from 'zustand';
import type { ClientGameState, Card, RouletteResult, ShowdownResult } from '@liars-bar/shared';

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
  // Connection & Room
  isConnected: boolean;
  currentRoomId: string;
  mySeatIndex: number;
  isLobbyOpen: boolean;
  playersInfo: PlayerInfo[];

  // Game state
  gameState: ClientGameState | null;
  tableLog: string;
  activeBubble: ActionBubble | null;

  // Modals & Overlays
  rouletteResult: RouletteResult | null;
  godSavePlayerName: string | null;
  winnerName: string | null;
  swapPoolCards: Card[] | null;
  showdownResults: ShowdownResult[] | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setJoinedSuccess: (roomId: string, seatIndex: number) => void;
  setRoomUpdate: (players: PlayerInfo[]) => void;
  setGameState: (state: ClientGameState) => void;
  setTableLog: (log: string) => void;
  showActionBubble: (seatIndex: number, text: string, cls?: string) => void;
  setRouletteResult: (result: RouletteResult | null) => void;
  setGodSave: (name: string | null) => void;
  setWinner: (name: string | null) => void;
  setSwapPool: (cards: Card[] | null) => void;
  setShowdownResults: (results: ShowdownResult[] | null) => void;
  setLobbyOpen: (open: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  currentRoomId: '',
  mySeatIndex: -1,
  isLobbyOpen: true,
  playersInfo: [],

  gameState: null,
  tableLog: 'Đang kết nối Server...',
  activeBubble: null,

  rouletteResult: null,
  godSavePlayerName: null,
  winnerName: null,
  swapPoolCards: null,
  showdownResults: null,

  setConnected: (isConnected) => set({ isConnected }),

  setJoinedSuccess: (currentRoomId, mySeatIndex) => set({
    currentRoomId,
    mySeatIndex,
    isLobbyOpen: false,
    tableLog: `Đã vào phòng [${currentRoomId}]! Chờ bắt đầu...`
  }),

  setRoomUpdate: (playersInfo) => set({ playersInfo }),

  setGameState: (gameState) => set({ gameState }),

  setTableLog: (tableLog) => set({ tableLog }),

  showActionBubble: (seatIndex, text, cls = 'bubble-call') => {
    set({ activeBubble: { seatIndex, text, cls } });
    setTimeout(() => {
      set((state) => (state.activeBubble?.seatIndex === seatIndex ? { activeBubble: null } : {}));
    }, 1500);
  },

  setRouletteResult: (rouletteResult) => set({ rouletteResult }),

  setGodSave: (godSavePlayerName) => set({ godSavePlayerName }),

  setWinner: (winnerName) => set({ winnerName }),

  setSwapPool: (swapPoolCards) => set({ swapPoolCards }),

  setShowdownResults: (showdownResults) => set({ showdownResults }),

  setLobbyOpen: (isLobbyOpen) => set({ isLobbyOpen })
}));
