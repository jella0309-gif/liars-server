import React, { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore, type PlayerInfo } from './store/gameStore';
import { Header } from './components/Header';
import { PokerTable } from './components/PokerTable';
import { PlayerControls } from './components/PlayerControls';
import { Lobby } from './components/Lobby';
import { SwapCardPanel } from './components/SwapCardPanel';
import { GodSaveOverlay } from './components/GodSaveOverlay';
import { WinnerOverlay } from './components/WinnerOverlay';
import { unlockAudioContext, speakActionVoice, playActionSound } from './utils/audio';
import { SOCKET_EVENTS, type ClientGameState, type GameEvent } from '@liars-bar/shared';

export const App: React.FC = () => {
  const setConnected = useGameStore((state) => state.setConnected);
  const setJoinedSuccess = useGameStore((state) => state.setJoinedSuccess);
  const setRoomUpdate = useGameStore((state) => state.setRoomUpdate);
  const setGameState = useGameStore((state) => state.setGameState);
  const setTableLog = useGameStore((state) => state.setTableLog);
  const showActionBubble = useGameStore((state) => state.showActionBubble);
  const setRouletteResult = useGameStore((state) => state.setRouletteResult);
  const setWinner = useGameStore((state) => state.setWinner);
  const setSwapPool = useGameStore((state) => state.setSwapPool);
  const setShowdownResults = useGameStore((state) => state.setShowdownResults);

  useEffect(() => {
    // Global user click unlock audio
    const handleBodyClick = () => unlockAudioContext();
    window.addEventListener('click', handleBodyClick);

    // Socket connection events
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Joined room success
    socket.on(SOCKET_EVENTS.JOINED_SUCCESS, (payload: { roomId: string; seatIndex: number; token: string }) => {
      setJoinedSuccess(payload.roomId, payload.seatIndex);
      sessionStorage.setItem('liars_token', payload.token);
    });

    // Room player updates
    socket.on(SOCKET_EVENTS.ROOM_UPDATE, (payload: { players: PlayerInfo[] }) => {
      setRoomUpdate(payload.players);
    });

    // Main Game State update
    socket.on(SOCKET_EVENTS.GAME_STATE, (state: ClientGameState) => {
      setGameState(state);
    });

    // Game Events
    socket.on(SOCKET_EVENTS.GAME_EVENT, (event: GameEvent) => {
      switch (event.type) {
        case 'action_bubble':
          showActionBubble(event.seatIndex, event.action.toUpperCase(), `bubble-${event.action}`);
          speakActionVoice(event.action);
          playActionSound(event.action);
          break;

        case 'roulette':
          setRouletteResult(event.result);
          break;

        case 'showdown':
          setShowdownResults(event.results);
          setTableLog(`SHOWDOWN: ${event.winnerName} WINS WITH [${event.winnerHand}]!`);
          break;

        case 'match_over':
          setWinner(event.winnerName);
          speakActionVoice(`${event.winnerName} won!`);
          break;

        case 'swap_available':
          setSwapPool(event.drawnCards);
          break;

        case 'log':
          setTableLog(event.message);
          break;

        case 'round_start':
          setShowdownResults(null);
          setSwapPool(null);
          setTableLog('Ván bài mới bắt đầu! Hãy quan sát bài...');
          break;
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_NOT_FOUND, () => {
      alert('Không tìm thấy phòng!');
    });

    socket.on(SOCKET_EVENTS.ROOM_FULL, () => {
      alert('Phòng đã đầy người chơi!');
    });

    return () => {
      window.removeEventListener('click', handleBodyClick);
      socket.off('connect');
      socket.off('disconnect');
      socket.off(SOCKET_EVENTS.JOINED_SUCCESS);
      socket.off(SOCKET_EVENTS.ROOM_UPDATE);
      socket.off(SOCKET_EVENTS.GAME_STATE);
      socket.off(SOCKET_EVENTS.GAME_EVENT);
      socket.off(SOCKET_EVENTS.ROOM_NOT_FOUND);
      socket.off(SOCKET_EVENTS.ROOM_FULL);
    };
  }, [
    setConnected,
    setJoinedSuccess,
    setRoomUpdate,
    setGameState,
    setTableLog,
    showActionBubble,
    setRouletteResult,
    setWinner,
    setSwapPool,
    setShowdownResults
  ]);

  return (
    <div className="game-root">
      <audio id="lofiBgm" loop preload="auto">
        <source
          src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
          type="audio/mp3"
        />
      </audio>

      <Header />
      <PokerTable />
      <PlayerControls />

      {/* Modals & Overlays */}
      <Lobby />
      <SwapCardPanel />
      <GodSaveOverlay />
      <WinnerOverlay />
    </div>
  );
};
