import React from 'react';
import type { Card } from '@liars-bar/shared';
import { PlayingCard } from './PlayingCard';
import { useT } from '../i18n';

export function CommunityCards({
  cards,
  roundNumber,
}: {
  cards: Card[];
  roundNumber: number;
}) {
  const t = useT();
  return (
    <>
      <div className="board-label">
        <span />{t('table.board')}<span />
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
