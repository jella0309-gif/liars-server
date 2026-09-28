import React from 'react';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../store/gameStore';
import type { Card } from '@liars-bar/shared';

interface SeatProps {
  seatIndex: number;
}

export const Seat: React.FC<SeatProps> = ({ seatIndex }) => {
  const gameState = useGameStore((state) => state.gameState);
  const mySeatIndex = useGameStore((state) => state.mySeatIndex);
  const playersInfo = useGameStore((state) => state.playersInfo);
  const activeBubble = useGameStore((state) => state.activeBubble);
  const showdownResults = useGameStore((state) => state.showdownResults);

  // If room max players is less than seat index + 1, don't show
  const maxPlayers = gameState?.maxPlayers || 2;
  if (seatIndex >= maxPlayers) return null;

  // Resolve player info from gameState or playersInfo
  const isMe = seatIndex === mySeatIndex;
  const meView = isMe ? gameState?.me : null;
  const oppView = !isMe ? gameState?.opponents.find((o) => o.seatIndex === seatIndex) : null;
  const fallbackInfo = playersInfo.find((p) => p.seatIndex === seatIndex);

  const name = meView?.name || oppView?.name || fallbackInfo?.name || `Ghế ${seatIndex + 1}`;
  const avatar = meView?.avatar || oppView?.avatar || fallbackInfo?.avatar || '👤';
  const bullets = meView?.bullets ?? oppView?.bullets ?? 1;
  const isDead = meView?.isDead || oppView?.isDead || false;
  const folded = meView?.folded || oppView?.folded || false;
  const isAllIn = meView?.isAllIn || oppView?.isAllIn || false;

  const isCurrentTurn = gameState?.currentTurnSeat === seatIndex && !gameState?.isProcessingRoulette;

  // Status classes
  let seatClass = `seat seat-${seatIndex}`;
  if (isDead) seatClass += ' dead';
  else if (folded) seatClass += ' folded';
  else if (isCurrentTurn) seatClass += ' active-turn';

  // Bullets count
  const effectiveBullets = isAllIn ? 6 : Math.min(bullets, 6);

  // Cards
  let cardsToRender: Card[] = [];
  let hideCards = !isMe;

  // If showdown results are available, show all cards
  const showdownData = showdownResults?.find((r) => r.seatIndex === seatIndex);
  if (showdownData) {
    cardsToRender = showdownData.cards;
    hideCards = false;
  } else if (isMe && meView?.cards) {
    cardsToRender = meView.cards;
    hideCards = false;
  } else if (oppView) {
    cardsToRender = Array(oppView.cardCount || 2).fill(null);
    hideCards = true;
  }

  // Bubble
  const bubble = activeBubble?.seatIndex === seatIndex ? activeBubble : null;

  return (
    <div className={seatClass}>
      {bubble && (
        <div className={`action-bubble ${bubble.cls}`} style={{ display: 'block' }}>
          {bubble.text}
        </div>
      )}

      <div className="seat-avatar">{avatar}</div>
      <div className="seat-name">{name}</div>

      {!isDead && (
        <div className="seat-bullets">
          {Array.from({ length: effectiveBullets }).map((_, i) => (
            <span key={i} className="bullet-dot">
              ●
            </span>
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--bullet)', marginLeft: '2px' }}>
            ({effectiveBullets}/6)
          </span>
        </div>
      )}

      {isCurrentTurn && (
        <div className="seat-timer-bar" style={{ display: 'block' }}>
          <div className="seat-timer-fill" style={{ width: '100%' }}></div>
        </div>
      )}

      <div className="comm-cards">
        {!isDead &&
          cardsToRender.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={hideCards} />
          ))}
      </div>

      {showdownData && (
        <>
          <div className="hand-eval-box" style={{ display: 'flex' }}>
            <span>🃏 {showdownData.handName}</span>
          </div>
          <div className="rank-badge" style={{ display: 'flex' }}>
            {showdownData.rank === 1 ? (
              <span className="rank-number r-1">#1 WINNER 🏆</span>
            ) : (
              <span className="rank-number r-lost">LOST</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
