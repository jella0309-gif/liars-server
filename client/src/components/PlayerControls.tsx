import React from 'react';
import { useGameStore } from '../store/gameStore';
import { emitAction, emitSwapRequest } from '../socket';
import { unlockAudioContext } from '../utils/audio';

export const PlayerControls: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const mySeatIndex = useGameStore((state) => state.mySeatIndex);
  const currentRoomId = useGameStore((state) => state.currentRoomId);

  const me = gameState?.me;
  const isMyTurn = gameState?.currentTurnSeat === mySeatIndex && !gameState?.isProcessingRoulette;
  const hasAnyAllIn = gameState?.hasAnyAllIn || false;
  const canSwap = gameState?.canSwap || false;

  const myBullets = me?.isAllIn ? 6 : (me?.bullets || 1);
  const nextBullet = Math.min(6, myBullets + 1);
  const nextOdds = Math.round((nextBullet / 6) * 100);

  const handleAction = (action: 'fold' | 'call' | 'allin') => {
    unlockAudioContext();
    emitAction(currentRoomId, action);
  };

  const handleRequestSwap = () => {
    unlockAudioContext();
    emitSwapRequest(currentRoomId);
  };

  const isControlsDisabled = !isMyTurn || !me || me.isDead;

  return (
    <div className="player-controls">
      {/* FOLD BUTTON */}
      <button
        type="button"
        className="btn-act"
        disabled={isControlsDisabled}
        onClick={() => handleAction('fold')}
      >
        BỎ BÀI (FOLD)
        <span className="sub">Chấp nhận bóp cò</span>
      </button>

      {/* CALL BUTTON */}
      {!hasAnyAllIn && (
        <button
          type="button"
          className="btn-act btn-call"
          disabled={isControlsDisabled}
          onClick={() => handleAction('call')}
        >
          THEO (+1 VIÊN)
          <span className="sub">
            Lên {nextBullet} viên ({nextOdds}% nổ)
          </span>
        </button>
      )}

      {/* SWAP CARD BUTTON */}
      {!hasAnyAllIn && canSwap && (
        <button
          type="button"
          className="btn-act btn-swap"
          disabled={isControlsDisabled}
          onClick={handleRequestSwap}
        >
          🔄 ĐỔI BÀI
          <span className="sub">1 lần duy nhất</span>
        </button>
      )}

      {/* ALL-IN BUTTON */}
      {hasAnyAllIn ? (
        <button
          type="button"
          className="btn-act btn-allin"
          disabled={isControlsDisabled}
          onClick={() => handleAction('allin')}
        >
          ALL-IN (6 VIÊN)
          <span className="sub">Bắt buộc All-in theo!</span>
        </button>
      ) : gameState?.stage && gameState.stage > 0 ? (
        <button
          type="button"
          className="btn-act btn-allin"
          disabled={isControlsDisabled}
          onClick={() => handleAction('allin')}
        >
          ALL-IN (6 VIÊN)
          <span className="sub">100% buồng có đạn</span>
        </button>
      ) : null}
    </div>
  );
};
