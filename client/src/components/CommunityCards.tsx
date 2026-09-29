import React from 'react';
import type { Card } from '@liars-bar/shared';
import { PlayingCard } from './PlayingCard';

export function CommunityCards({
  cards,
  roundNumber,
}: {
  cards: Card[];
  roundNumber: number;
}) {
  return (
    <>
      <div className="board-label">
        <span />BÀI CHUNG<span />
      </div>
      <div className="comm-cards" key={roundNumber}>
        {Array.from({ length: 5 }, (_, i) => (
          <div className="community-slot" key={i}>
            {cards[i] ? (
              <PlayingCard card={cards[i]} delay={i < 3 ? i * 120 : 0} />
            ) : (
              <div className="card-placeholder">
                <span>♠</span>
                <small>{i < 3 ? 'FLOP' : i === 3 ? 'TURN' : 'RIVER'}</small>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
