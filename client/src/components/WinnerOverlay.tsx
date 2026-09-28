import React from 'react';
import { useGameStore } from '../store/gameStore';

export const WinnerOverlay: React.FC = () => {
  const winnerName = useGameStore((state) => state.winnerName);

  if (!winnerName) return null;

  return (
    <div className="winner-overlay" style={{ display: 'flex' }}>
      <div className="winner-box">
        <div className="winner-text">🏆 {winnerName.toUpperCase()} WON!</div>
        <div className="winner-sub">Người sống sót duy nhất tại Liar's Bar</div>
        <button
          type="button"
          className="btn-top"
          onClick={() => location.reload()}
          style={{ padding: '10px 24px', fontSize: '1rem', marginTop: '10px' }}
        >
          CHƠI TRẬN MỚI
        </button>
      </div>
    </div>
  );
};
