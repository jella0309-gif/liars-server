import React from 'react';
import { Seat } from './Seat';
import { PlayingCard } from './PlayingCard';
import { RouletteModal } from './RouletteModal';
import { useGameStore } from '../store/gameStore';

export const PokerTable: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const tableLog = useGameStore((state) => state.tableLog);
  const showdownResults = useGameStore((state) => state.showdownResults);
  const isRoundOver = useGameStore((state) => state.isRoundOver);

  const stageName = gameState?.stageName || 'PRE-FLOP';
  const communityCards = gameState?.communityCards || [];

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'PRE-FLOP':
        return 'PRE-FLOP (Vòng bài tẩy)';
      case 'FLOP':
        return 'FLOP (3 lá bài chung)';
      case 'TURN':
        return 'TURN (4 lá bài chung)';
      case 'RIVER':
        return 'RIVER (5 lá bài chung)';
      case 'SHOWDOWN':
        return 'SHOWDOWN (Ngửa bài & Phân định)';
      default:
        return stage;
    }
  };

  return (
    <div className="table-stage">
      <div className="poker-table">
        <div className="table-center">
          <div className="phase-badge">{getStageDescription(stageName)}</div>

          <div className="comm-cards-wrapper">
            <div className="comm-cards-label">BÀI CHUNG TRÊN BÀN</div>
            <div className="comm-cards">
              {Array.from({ length: 5 }).map((_, i) => {
                if (i < communityCards.length) {
                  return <PlayingCard key={i} card={communityCards[i]} />;
                }
                return (
                  <div key={i} className="card back comm-card-empty">
                    ?
                  </div>
                );
              })}
            </div>
          </div>

          <div className="table-log-box">
            <span className="table-log-icon">📢</span>
            <span className="table-log-text">{tableLog}</span>
          </div>

          {showdownResults && !isRoundOver && (
            <div className="table-showdown-banner">
              👀 <strong>SHOWDOWN:</strong> Quan sát bài và điểm số các người chơi...
            </div>
          )}

          {isRoundOver && (
            <div className="table-roundover-banner pulse">
              🏁 <strong>VÁN ĐÃ KẾT THÚC:</strong> Bấm [TIẾP TỤC VÁN TIẾP THEO] bên dưới!
            </div>
          )}
        </div>

        {/* 4 Seats around table */}
        <Seat seatIndex={0} />
        <Seat seatIndex={1} />
        <Seat seatIndex={2} />
        <Seat seatIndex={3} />

        {/* Russian Roulette Spinner beside shooter seat */}
        <RouletteModal />
      </div>
    </div>
  );
};
