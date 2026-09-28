import React from 'react';
import { useGameStore } from '../store/gameStore';
import { emitPlayAgain } from '../socket';
import { unlockAudioContext } from '../utils/audio';

export const WinnerOverlay: React.FC = () => {
  const winnerName = useGameStore((state) => state.winnerName);
  const setWinner = useGameStore((state) => state.setWinner);
  const currentRoomId = useGameStore((state) => state.currentRoomId);

  if (!winnerName) return null;

  const handlePlayAgain = () => {
    unlockAudioContext();
    setWinner(null);
    emitPlayAgain(currentRoomId);
  };

  return (
    <div className="winner-overlay" style={{ display: 'flex' }}>
      <div className="winner-box">
        <div className="winner-text">🏆 {winnerName.toUpperCase()} CHIẾN THẮNG!</div>
        <div className="winner-sub">Người sống sót duy nhất tại Liar's Bar</div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-top"
            onClick={handlePlayAgain}
            style={{
              padding: '10px 20px',
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              border: '1.5px solid #34d399',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              cursor: 'pointer'
            }}
          >
            🔄 CHƠI TIẾP VÁN MỚI
          </button>

          <button
            type="button"
            className="btn-top"
            onClick={() => location.reload()}
            style={{
              padding: '10px 18px',
              fontSize: '0.95rem',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #475569',
              cursor: 'pointer'
            }}
          >
            🚪 RỜI PHÒNG
          </button>
        </div>
      </div>
    </div>
  );
};
