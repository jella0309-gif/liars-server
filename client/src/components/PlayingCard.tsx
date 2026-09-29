import React from 'react';
import type { Card } from '@liars-bar/shared';
interface PlayingCardProps {
  card?: Card | null;
  hidden?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  delay?: number;
}
const suitNames: Record<string, string> = {
  '♠': 'bích',
  '♣': 'tép',
  '♦': 'rô',
  '♥': 'cơ',
};
export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  hidden = false,
  selectable = false,
  selected = false,
  onClick,
  delay = 0,
}) => {
  const faceUp = !!card && !hidden;
  const label = faceUp ? `${card.val} ${suitNames[card.suit]}` : 'Bài úp';
  const content = (
    <span
      className={`card-motion ${faceUp ? 'face-up' : ''}`}
      key={faceUp ? `${card.val}${card.suit}` : 'back'}
    >
      <span className="card-face card-back">
        <span className="card-back-border">
          <span>♠</span>
          <small>
            LIAR'S
            <br />
            BAR
          </small>
          <i>◆</i>
        </span>
      </span>
      <span className={`card-face card-front ${card?.isRed ? 'red' : 'black'}`}>
        <span className="card-corner">
          <b>{card?.val}</b>
          <span>{card?.suit}</span>
        </span>
        <span className="card-suit">{card?.suit}</span>
        <span className="card-corner bottom">
          <b>{card?.val}</b>
          <span>{card?.suit}</span>
        </span>
      </span>
    </span>
  );
  const className = `card ${faceUp ? 'revealed' : 'hidden-card'} ${selectable ? 'selectable' : ''} ${selected ? 'selected-gold' : ''}`;
  const style = { '--deal-delay': `${delay}ms` } as React.CSSProperties;
  return selectable ? (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
    >
      {content}
      {selected && <span className="card-selected-tick">✓</span>}
    </button>
  ) : (
    <div className={className} style={style} role="img" aria-label={label}>
      {content}
    </div>
  );
};
