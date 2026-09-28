import React, { useState, useEffect } from 'react';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../store/gameStore';
import { emitSwapConfirm } from '../socket';
import { unlockAudioContext } from '../utils/audio';
import { TIMING } from '@liars-bar/shared';

export const SwapCardPanel: React.FC = () => {
  const swapPoolCards = useGameStore((state) => state.swapPoolCards);
  const setSwapPool = useGameStore((state) => state.setSwapPool);
  const gameState = useGameStore((state) => state.gameState);
  const currentRoomId = useGameStore((state) => state.currentRoomId);

  const [handIndex, setHandIndex] = useState<number | null>(null);
  const [drawnIndex, setDrawnIndex] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMING.SWAP_TIME_LIMIT);

  // Reset when opened
  useEffect(() => {
    if (swapPoolCards) {
      setHandIndex(null);
      setDrawnIndex(null);
      setSecondsLeft(TIMING.SWAP_TIME_LIMIT);

      const timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSwapPool(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [swapPoolCards, setSwapPool]);

  if (!swapPoolCards) return null;

  const myCards = gameState?.me?.cards || [];

  const handleConfirm = () => {
    if (handIndex === null || drawnIndex === null) return;
    unlockAudioContext();
    emitSwapConfirm(currentRoomId, handIndex, drawnIndex);
    setSwapPool(null);
  };

  return (
    <div className="swap-card-panel" style={{ display: 'flex' }}>
      <div className="swap-header-bar">
        <div className="swap-title">CHỌN 1 LÁ TẨY & 1 LÁ MỚI ĐỂ ĐỔI</div>
        <div className={`swap-timer-tag ${secondsLeft <= 4 ? 'danger' : ''}`}>
          ⏳ {secondsLeft}s
        </div>
      </div>

      {/* Hand selection */}
      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>
        Lá tẩy của bạn (Chọn 1 lá để đổi):
      </div>
      <div className="swap-cards-row">
        {myCards.map((c, i) => (
          <PlayingCard
            key={i}
            card={c}
            selectable
            selected={handIndex === i}
            onClick={() => {
              unlockAudioContext();
              setHandIndex(i);
            }}
          />
        ))}
      </div>

      {/* Pool selection */}
      <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 'bold', marginTop: '4px' }}>
        Lá mới từ bộ bài (Chọn 1 lá nhận về):
      </div>
      <div className="swap-cards-row">
        {swapPoolCards.map((c, i) => (
          <PlayingCard
            key={i}
            card={c}
            selectable
            selected={drawnIndex === i}
            onClick={() => {
              unlockAudioContext();
              setDrawnIndex(i);
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="btn-confirm-swap"
        disabled={handIndex === null || drawnIndex === null}
        onClick={handleConfirm}
        style={{ marginTop: '6px' }}
      >
        XÁC NHẬN ĐỔI BÀI
      </button>
    </div>
  );
};
