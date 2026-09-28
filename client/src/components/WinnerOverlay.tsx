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
    <div className="winner-overlay">
      <div className="winner-box">
        <div className="winner-trophy-icon">🏆</div>
        <div className="winner-text">{winnerName.toUpperCase()} CHIẾN THẮNG!</div>
        <div className="winner-sub">
          Đã sống sót qua tất cả vòng Russian Roulette tại Liar's Bar!
        </div>

        <div className="winner-actions">
          <button
            type="button"
            className="btn-modal-playagain pulse"
            onClick={handlePlayAgain}
          >
            🔄 CHƠI LẠI TRẬN MỚI
          </button>

          <button
            type="button"
            className="btn-modal-leave"
            onClick={() => location.reload()}
          >
            🚪 RỜI PHÒNG
          </button>
        </div>
      </div>
    </div>
  );
};
