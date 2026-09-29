import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useT } from '../i18n';
import { handName } from '../utils/handNames';
import { Icon } from './Icon';
import type { Card } from '@liars-bar/shared';

const MiniCards = ({ cards }: { cards: Card[] }) => (
  <span className="sd-cards" aria-hidden="true">
    {cards.map((c, i) => (
      <i key={i} className={c.isRed ? 'red' : ''}>
        {c.val}
        {c.suit}
      </i>
    ))}
  </span>
);

/** One readable results card for the showdown: every live hand, ranked,
 * with the board it was made on. Presentation only — it reads the same
 * showdown data the seats already use, and can be dismissed locally. */
export function ShowdownSummary() {
  const showdownResults = useGameStore((s) => s.showdownResults);
  const mySeatIndex = useGameStore((s) => s.mySeatIndex);
  const board = useGameStore((s) => s.gameState?.communityCards ?? []);
  const t = useT();
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [showdownResults]);
  if (!showdownResults || hidden) return null;
  const ranked = showdownResults
    .filter((r) => r.rank > 0)
    .sort((a, b) => a.rank - b.rank);
  const folded = showdownResults.filter((r) => r.rank <= 0);
  return (
    <section className="showdown-summary" role="status" aria-label={t('sd.title')}>
      <header>
        <span className="eyebrow">{t('sd.title')}</span>
        <button
          type="button"
          className="sd-close"
          aria-label={t('sd.close')}
          onClick={() => setHidden(true)}
        >
          <Icon name="close" size={14} />
        </button>
      </header>
      {board.length > 0 && (
        <div className="sd-board">
          <span>{t('sd.board')}</span>
          <MiniCards cards={board} />
        </div>
      )}
      <ol className="sd-rows">
        {ranked.map((r) => (
          <li key={r.seatIndex} className={r.rank === 1 ? 'winner' : ''}>
            <b className="sd-rank">{r.rank === 1 ? <Icon name="crown" size={14} /> : `#${r.rank}`}</b>
            <span className="sd-name">
              {r.name}
              {r.seatIndex === mySeatIndex && <small>{t('seat.you')}</small>}
            </span>
            <MiniCards cards={r.cards} />
            <strong className="sd-hand">{handName(r.handName)}</strong>
          </li>
        ))}
        {folded.map((r) => (
          <li key={r.seatIndex} className="folded">
            <b className="sd-rank">—</b>
            <span className="sd-name">
              {r.name}
              {r.seatIndex === mySeatIndex && <small>{t('seat.you')}</small>}
            </span>
            <span className="sd-cards" />
            <strong className="sd-hand">{handName('Folded')}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
