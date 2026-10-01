import React, { useEffect } from 'react';
import { socket, rememberSeat, rememberedSeat, forgetSeat } from './socket';
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
import { t, useT } from './i18n';
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
  const tr = useT();
  useEffect(() => {
    const store = useGameStore.getState();
    const onConnect = () => {
      store.setConnected(true);
      // A reload loses the in-memory room; the remembered seat rejoins it.
      const roomId = useGameStore.getState().currentRoomId;
      const remembered = rememberedSeat();
      if (roomId && remembered)
        socket.emit(SOCKET_EVENTS.RECONNECT_ATTEMPT, {
          roomId,
          token: remembered.token,
        });
      else if (remembered)
        socket.emit(SOCKET_EVENTS.RECONNECT_ATTEMPT, remembered);
    };
    const onDisconnect = () => store.setConnected(false);
    const onJoined = (p: JoinedSuccessPayload) => {
      store.setJoinedSuccess(p.roomId, p.seatIndex, p.maxPlayers);
      rememberSeat(p.roomId, p.token);
    };
    const onRoom = (p: RoomUpdatePayload) =>
      store.setRoomUpdate(p.players, p.maxPlayers);
    const onMatch = (p: { winnerName: string; winnerSeatIndex: number }) => {
      store.setWinner(p.winnerName, p.winnerSeatIndex);
      store.setRoundOver(true);
    };
    const onRound = () => {
      store.setRoundOver(true, t('log.roundOver'));
      store.setTableLog(t('log.roundOver'));
    };
    const onEvent = (event: GameEvent) => {
      const playerName = (seat: number) => {
        const state = useGameStore.getState();
        return (
          state.playersInfo.find((player) => player.seatIndex === seat)?.name ||
          t('seat.playerN', { n: seat + 1 })
        );
      };
      switch (event.type) {
        case 'action_bubble': {
          const bubbleKey = `bubble.${event.action}` as const;
          const logKey = `log.${event.action}` as const;
          const isKnown = ['call', 'fold', 'allin'].includes(event.action);
          store.showActionBubble(
            event.seatIndex,
            isKnown ? t(bubbleKey as 'bubble.call') : event.action.toUpperCase(),
            `bubble-${event.action}`
          );
          store.setTableLog(
            t('log.action', {
              name: playerName(event.seatIndex),
              action: isKnown ? t(logKey as 'log.call') : event.action,
            })
          );
          void speakActionVoice(event.action);
          playActionSound(event.action);
          break;
        }
        case 'roulette': {
          store.setFoldVoicePending(false);
          store.setRouletteResult(event.result);
          break;
        }
        case 'showdown':
          store.setShowdownResults(event.results);
          store.setTableLog(
            event.winnerHand === 'Invalid'
              ? t('log.winFold', { name: event.winnerName })
              : t('log.winHand', {
                  name: event.winnerName,
                  hand: handName(event.winnerHand),
                })
          );
          break;
        case 'match_over':
          onMatch(event);
          break;
        case 'round_over':
          onRound();
          break;
        case 'swap_available':
          store.setSwapPool(event.drawnCards);
          break;
        case 'swap_used':
          store.setSwapPool(null);
          store.showActionBubble(event.seatIndex, t('bubble.swap'), 'bubble-swap');
          store.setTableLog(t('log.swapUsed', { name: playerName(event.seatIndex) }));
          playActionSound('swap');
          break;
        case 'player_left':
          store.setTableLog(t('log.left', { name: event.name }));
          break;
        case 'log':
          store.setTableLog(
            event.key === 'roulette_turn' && event.name
              ? t('log.roulette', { name: event.name })
              : event.message
          );
          break;
        case 'stage_change':
          store.setTableLog(
            t('log.stage', {
              stage: event.stageName,
              n: event.newCommunityCards.length,
            })
          );
          break;
        case 'round_start':
          store.startRound();
          break;
      }
    };
    const onMissing = () => store.setError(t('err.notFound'));
    const onFull = () => store.setError(t('err.full'));
    const onError = (p: { message?: string }) => {
      if (p.message === 'Reconnect failed') {
        // The seat is gone (grace period passed or room closed): stay in the lobby.
        forgetSeat();
        if (!useGameStore.getState().isLobbyOpen) store.setError(t('err.reconnect'));
        return;
      }
      store.setError(
        p.message === 'Invalid payload'
          ? t('err.payload')
          : p.message || t('err.generic')
      );
    };
    store.setConnected(socket.connected);
    if (socket.connected) onConnect();
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
              {tr('conn.lost')}
            </div>
          )}
          {errorMessage && (
            <div className="connection-banner" role="alert">
              {errorMessage}
              <button onClick={() => useGameStore.getState().setError(null)}>
                {tr('dialog.close')}
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
