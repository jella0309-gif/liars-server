import React from 'react';
import type { Card } from '@liars-bar/shared';
import { PlayingCard } from './PlayingCard';

/** Visibility is decided by Seat using the existing server/showdown data. */
export function PlayerHand({
  cards,
  hidden,
  roundNumber,
}: {
  cards: (Card | null)[];
  hidden: boolean;
  roundNumber: number;
}) {
  return (
    <div className="seat-cards-container" key={roundNumber}>
      {cards.map((card, i) => (
        <PlayingCard key={i} card={card} hidden={hidden} delay={i * 100} />
      ))}
    </div>
  );
}
