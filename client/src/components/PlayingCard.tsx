import React from 'react';
import type { Card } from '@liars-bar/shared';

interface PlayingCardProps {
  card?: Card | null;
  hidden?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  hidden = false,
  selectable = false,
  selected = false,
  onClick
}) => {
  if (hidden || !card) {
    return (
      <div 
        className="card back" 
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        ☠
      </div>
    );
  }

  const colorClass = card.isRed ? 'red' : 'black';
  const selectableClass = selectable ? 'selectable' : '';
  const selectedClass = selected ? 'selected-gold' : '';

  return (
    <div
      className={`card ${colorClass} ${selectableClass} ${selectedClass}`}
      onClick={onClick}
    >
      <div>{card.val}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};
