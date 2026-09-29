import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  type CreateRoomPayload,
  type JoinRoomPayload,
  type PlayerActionPayload,
  type SwapCardPayload,
} from '@liars-bar/shared';

const serverUrl = import.meta.env.VITE_SERVER_URL || '';

export const socket: Socket = io(serverUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  timeout: 20000,
});

export let currentRoomId = '';
export let mySeatIndex = -1;

export function setCurrentRoomId(id: string) {
  currentRoomId = id;
}

export function setMySeatIndex(index: number) {
  mySeatIndex = index;
}

/* The seat token and room id survive a reload so the player can rejoin. */
const TOKEN_KEY = 'liars_token';
const ROOM_KEY = 'liars_room';

export function rememberSeat(roomId: string, token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROOM_KEY, roomId);
  } catch {
    /* storage unavailable */
  }
}

export function rememberedSeat(): { roomId: string; token: string } | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const roomId = sessionStorage.getItem(ROOM_KEY);
    return token && roomId ? { roomId, token } : null;
  } catch {
    return null;
  }
}

export function forgetSeat() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROOM_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Leave deliberately: drop the remembered seat so a reload does not rejoin. */
export function leaveRoom() {
  forgetSeat();
  location.reload();
}

export function emitCreateRoom(
  payload: CreateRoomPayload & { addBots?: boolean }
) {
  socket.emit(SOCKET_EVENTS.CREATE_ROOM, payload);
}

export function emitJoinRoom(payload: JoinRoomPayload) {
  socket.emit(SOCKET_EVENTS.JOIN_ROOM, payload);
}

export function emitAction(roomId: string, action: 'fold' | 'call' | 'allin') {
  const payload: PlayerActionPayload = { action };
  socket.emit(SOCKET_EVENTS.PLAYER_ACTION, { roomId, ...payload });
}

export function emitSwapRequest(roomId: string) {
  socket.emit('swap_request', { roomId });
}

export function emitSwapConfirm(
  roomId: string,
  handCardIndex: number,
  drawnCardIndex: number
) {
  const payload: SwapCardPayload = { handCardIndex, drawnCardIndex };
  socket.emit('swap_confirm', { roomId, ...payload });
}

export function emitPlayAgain(roomId: string) {
  socket.emit(SOCKET_EVENTS.PLAY_AGAIN, { roomId });
}

export function emitNextRound(roomId: string) {
  socket.emit(SOCKET_EVENTS.NEXT_ROUND, { roomId });
}
