import React from 'react';
import { Seat } from './Seat';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../store/gameStore';

export const PokerTable: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const tableLog = useGameStore((state) => state.tableLog);

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
        </div>

        {/* 4 Seats */}
        <Seat seatIndex={0} />
        <Seat seatIndex={1} />
        <Seat seatIndex={2} />
        <Seat seatIndex={3} />
      </div>
    </div>
  );
};
