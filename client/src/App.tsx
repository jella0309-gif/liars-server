import React, { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore } from './store/gameStore';
import { Header } from './components/Header';
import { TavernAtmosphere } from './components/TavernAtmosphere';
import { PokerTable } from './components/PokerTable';
import { RouletteModal } from './components/RouletteModal';
import { Lobby } from './components/Lobby';
import { SwapCardPanel } from './components/SwapCardPanel';
import { GodSaveOverlay } from './components/GodSaveOverlay';
import { WinnerOverlay } from './components/WinnerOverlay';
import {
  unlockAudioContext,
  speakActionVoice,
  playActionSound,
} from './utils/audio';
import { handName } from './utils/handNames';
import {
  SOCKET_EVENTS,
  type GameEvent,
  type JoinedSuccessPayload,
  type RoomUpdatePayload,
} from '@liars-bar/shared';

export const App: React.FC = () => {
  const isLobbyOpen = useGameStore((s) => s.isLobbyOpen);
  const connected = useGameStore((s) => s.isConnected);
  const errorMessage = useGameStore((s) => s.errorMessage);
  useEffect(() => {
    const store = useGameStore.getState();
    const onConnect = () => {
      store.setConnected(true);
      const roomId = useGameStore.getState().currentRoomId;
      const token = sessionStorage.getItem('liars_token');
      if (roomId && token)
        socket.emit(SOCKET_EVENTS.RECONNECT_ATTEMPT, { roomId, token });
    };
    const onDisconnect = () => store.setConnected(false);
    const onJoined = (p: JoinedSuccessPayload) => {
      store.setJoinedSuccess(p.roomId, p.seatIndex, p.maxPlayers);
      sessionStorage.setItem('liars_token', p.token);
    };
    const onRoom = (p: RoomUpdatePayload) =>
      store.setRoomUpdate(p.players, p.maxPlayers);
    const onMatch = (p: { winnerName: string; winnerSeatIndex: number }) => {
      store.setWinner(p.winnerName, p.winnerSeatIndex);
      store.setRoundOver(true);
    };
    const onRound = (p: { message: string }) => {
      store.setRoundOver(true, p.message);
      store.setTableLog(p.message);
    };
    const onEvent = (event: GameEvent) => {
      const playerName = (seat: number) => {
        const state = useGameStore.getState();
        return (
          state.playersInfo.find((player) => player.seatIndex === seat)?.name ||
          `Người chơi ${seat + 1}`
        );
      };
      switch (event.type) {
        case 'action_bubble': {
          const labels: Record<string, string> = {
            call: 'THEO BÀI',
            fold: 'BỎ BÀI',
            allin: 'TẤT TAY',
          };
          store.showActionBubble(
            event.seatIndex,
            labels[event.action] || event.action.toUpperCase(),
            `bubble-${event.action}`
          );
          store.setTableLog(
            `${playerName(event.seatIndex)} ${(labels[event.action] || event.action).toLocaleLowerCase('vi')}.`
          );
          speakActionVoice(event.action);
          playActionSound(event.action);
          break;
        }
        case 'roulette':
          store.setRouletteResult(event.result);
          break;
        case 'showdown':
          store.setShowdownResults(event.results);
          store.setTableLog(
            event.winnerHand === 'Invalid'
              ? `${event.winnerName} thắng do các đối thủ bỏ bài.`
              : `${event.winnerName} thắng với ${handName(event.winnerHand)}.`
          );
          break;
        case 'match_over':
          onMatch(event);
          break;
        case 'round_over':
          onRound(event);
          break;
        case 'swap_available':
          store.setSwapPool(event.drawnCards);
          break;
        case 'swap_used':
          store.setSwapPool(null);
          store.showActionBubble(event.seatIndex, 'ĐÃ ĐỔI BÀI', 'bubble-swap');
          store.setTableLog(
            `${playerName(event.seatIndex)} đã đổi một lá tẩy.`
          );
          playActionSound('swap');
          break;
        case 'log':
          store.setTableLog(event.message);
          break;
        case 'stage_change':
          store.setTableLog(
            `Vòng ${event.stageName} — ${event.newCommunityCards.length} lá bài chung.`
          );
          break;
        case 'round_start':
          store.startRound();
          break;
      }
    };
    const onMissing = () =>
      store.setError('Không tìm thấy phòng. Kiểm tra lại mã phòng nhé.');
    const onFull = () =>
      store.setError('Bàn này đã đủ người. Hãy thử một phòng khác.');
    const onError = (p: { message?: string }) =>
      store.setError(
        p.message === 'Invalid payload'
          ? 'Thông tin chưa hợp lệ. Hãy kiểm tra lại.'
          : p.message || 'Có lỗi kết nối. Hãy thử lại.'
      );
    store.setConnected(socket.connected);
    window.addEventListener('pointerdown', unlockAudioContext);
    socket.on('connect', onConnect).on('disconnect', onDisconnect);
    socket
      .on(SOCKET_EVENTS.JOINED_SUCCESS, onJoined)
      .on(SOCKET_EVENTS.ROOM_UPDATE, onRoom);
    socket
      .on(SOCKET_EVENTS.GAME_STATE, store.setGameState)
      .on(SOCKET_EVENTS.GAME_EVENT, onEvent);
    socket
      .on(SOCKET_EVENTS.MATCH_OVER, onMatch)
      .on(SOCKET_EVENTS.ROUND_OVER, onRound);
    socket
      .on(SOCKET_EVENTS.ROOM_NOT_FOUND, onMissing)
      .on(SOCKET_EVENTS.ROOM_FULL, onFull)
      .on(SOCKET_EVENTS.ERROR, onError);
    return () => {
      window.removeEventListener('pointerdown', unlockAudioContext);
      socket.off('connect', onConnect).off('disconnect', onDisconnect);
      socket
        .off(SOCKET_EVENTS.JOINED_SUCCESS, onJoined)
        .off(SOCKET_EVENTS.ROOM_UPDATE, onRoom);
      socket
        .off(SOCKET_EVENTS.GAME_STATE, store.setGameState)
        .off(SOCKET_EVENTS.GAME_EVENT, onEvent);
      socket
        .off(SOCKET_EVENTS.MATCH_OVER, onMatch)
        .off(SOCKET_EVENTS.ROUND_OVER, onRound);
      socket
        .off(SOCKET_EVENTS.ROOM_NOT_FOUND, onMissing)
        .off(SOCKET_EVENTS.ROOM_FULL, onFull)
        .off(SOCKET_EVENTS.ERROR, onError);
    };
  }, []);
  return (
    <div className={`game-root ${isLobbyOpen ? 'in-lobby' : 'in-game'}`}>
      <TavernAtmosphere />
      <Header />
      {isLobbyOpen ? (
        <Lobby />
      ) : (
        <>
          {!connected && (
            <div className="connection-banner" role="status">
              Mất kết nối. Đang kết nối lại với bàn chơi…
            </div>
          )}
          {errorMessage && (
            <div className="connection-banner" role="alert">
              {errorMessage}
              <button onClick={() => useGameStore.getState().setError(null)}>
                Đóng
              </button>
            </div>
          )}
          <PokerTable />
          <RouletteModal />
          <SwapCardPanel />
          <GodSaveOverlay />
          <WinnerOverlay />
        </>
      )}
    </div>
  );
};
