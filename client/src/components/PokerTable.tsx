import React from 'react';
import { Seat } from './Seat';
import { PlayingCard } from './PlayingCard';
import { RouletteModal } from './RouletteModal';
import { useGameStore } from '../store/gameStore';

export const PokerTable: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const tableLog = useGameStore((state) => state.tableLog);
  const showdownResults = useGameStore((state) => state.showdownResults);

  const stageName = gameState?.stageName || 'PRE-FLOP';
  const communityCards = gameState?.communityCards || [];

  return (
    <div className="table-stage">
      <div className="poker-table">
        <div className="table-center">
          <div className="phase-badge">{stageName}</div>
          <div className="comm-cards">
            {Array.from({ length: 5 }).map((_, i) => {
              if (i < communityCards.length) {
                return <PlayingCard key={i} card={communityCards[i]} />;
              }
              return (
                <div key={i} className="card back" style={{ opacity: 0.3 }}>
                  ?
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)', color: '#94a3b8' }}>
            {tableLog}
          </div>

          {showdownResults && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(220, 38, 38, 0.25))',
              border: '1.5px solid var(--gold)',
              borderRadius: '10px',
              padding: '4px 12px',
              marginTop: '6px',
              color: '#fef08a',
              fontWeight: 'bold',
              fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)',
              textAlign: 'center'
            }}>
              👀 KẾT QUẢ SHOWDOWN — Đang xem bài của mọi người...
            </div>
          )}
        </div>

        {/* 4 Seats */}
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
