import React from 'react';
import { PlayingCard } from './PlayingCard';
import {
  CharacterPortrait,
  getCharacter,
  type CharacterMood,
} from './CharacterPortrait';
import { useGameStore } from '../store/gameStore';
import { useTurnClock } from '../hooks/useTurnClock';
import { Icon } from './Icon';
import { handName } from '../utils/handNames';
import type { Card } from '@liars-bar/shared';

export const Seat: React.FC<{ seatIndex: number }> = ({ seatIndex }) => {
  const {
    gameState,
    mySeatIndex,
    playersInfo,
    activeBubble,
    showdownResults,
    isRoundOver,
    winnerSeatIndex,
    rouletteResult,
    rouletteRevealed,
    roundNumber,
  } = useGameStore();
  const seconds = useTurnClock();
  const isMe = seatIndex === mySeatIndex;
  const player = isMe
    ? gameState?.me
    : gameState?.opponents.find((o) => o.seatIndex === seatIndex);
  const fallback = playersInfo.find((p) => p.seatIndex === seatIndex);
  if (!player && !fallback)
    return (
      <div className="seat empty-seat" data-seat={seatIndex}>
        <Icon name="users" size={28} />
        <span>Đang chờ người chơi</span>
        <small>GHẾ 0{seatIndex + 1}</small>
      </div>
    );
  const name = player?.name || fallback?.name || 'Người chơi';
  const avatar = player?.avatar || fallback?.avatar || '🐵';
  const matchRank = player?.matchRank;
  const shooting = rouletteResult?.seatIndex === seatIndex;
  // Keep the outcome hidden until the cylinder finishes spinning.
  const isDead = shooting
    ? rouletteRevealed && rouletteResult.isDead
    : !!player?.isDead;
  const folded = !!player?.folded;
  const showdown = showdownResults?.find((r) => r.seatIndex === seatIndex);
  const reachedShowdown = !!showdown && showdown.rank > 0;
  const won =
    !isDead && (winnerSeatIndex === seatIndex || showdown?.rank === 1);
  const active =
    gameState?.currentTurnSeat === seatIndex &&
    !gameState.isProcessingRoulette &&
    !rouletteResult &&
    !showdownResults &&
    !isRoundOver &&
    !isDead &&
    !folded;
  const mood: CharacterMood =
    shooting && !rouletteRevealed
      ? 'thinking'
      : isDead
        ? 'dead'
        : won
          ? 'win'
          : active
            ? 'thinking'
            : 'idle';
  const bullets = Math.min(6, player?.isAllIn ? 6 : (player?.bullets ?? 1));
  let cards: (Card | null)[] = [];
  let hidden = !isMe;
  if (showdown && !folded) {
    cards = showdown.cards;
    hidden = false;
  } else if (isMe && gameState) cards = gameState.me.cards;
  else if (player && 'cardCount' in player)
    cards = Array(player.cardCount).fill(null);
  const bubble = activeBubble?.seatIndex === seatIndex ? activeBubble : null;
  return (
    <article
      className={`seat ${isMe ? 'seat-is-me' : ''} ${active ? 'active-turn' : ''} ${isDead ? 'dead' : ''} ${folded ? 'folded' : ''} ${won ? 'seat-winner' : ''} ${bubble ? bubble.cls.replace('bubble-', 'acting-') : ''}`}
      data-seat={seatIndex}
      data-active={active || undefined}
    >
      {bubble && (
        <div className={`action-bubble ${bubble.cls}`} role="status">
          {bubble.text}
        </div>
      )}
      {bubble && (
        <span className="seat-action-trail" aria-hidden="true">
          ♠
        </span>
      )}
      <div className="seat-portrait-wrap">
        <CharacterPortrait avatar={avatar} mood={mood} alignTop />
        <span className={`seat-state-label ${active ? 'thinking-label' : ''}`}>
          {shooting && !rouletteRevealed
            ? 'ĐANG BÓP CÒ'
            : isDead
              ? 'ĐÃ BỊ HẠ'
              : won
                ? 'CHIẾN THẮNG'
                : folded
                  ? 'ĐÃ BỎ BÀI'
                  : active
                    ? 'ĐANG SUY NGHĨ'
                    : getCharacter(avatar).name}
        </span>
      </div>
      <div className="seat-details">
        <div className="seat-name-row">
          <h3 title={name}>{name}</h3>
          {isMe && <span className="you-badge">BẠN</span>}
          {won && <Icon name="crown" size={16} />}
          {matchRank && (
            <span className={`match-rank rank-${matchRank}`}>
              HẠNG {matchRank}
            </span>
          )}
        </div>
        <div
          className="seat-bullets"
          title={`${bullets}/6 viên đạn · ${Math.round((bullets / 6) * 100)}% buồng có đạn`}
        >
          <div
            className={`bullet-dots ${bullets >= 4 ? 'danger' : ''}`}
            aria-hidden="true"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} className={i < bullets ? 'filled' : ''} />
            ))}
          </div>
          <span>
            {bullets}/6{player?.isAllIn && <b> ALL-IN</b>}
          </span>
        </div>
        {active && (
          <div className="seat-timer">
            <span
              style={{ width: `${Math.min((seconds / 30) * 100, 100)}%` }}
            />
            <small>{seconds}s</small>
          </div>
        )}
        {(reachedShowdown || !isDead) && cards.length > 0 && (
          <div className="seat-cards-container" key={roundNumber}>
            {cards.map((card, i) => (
              <PlayingCard
                key={i}
                card={card}
                hidden={hidden}
                delay={i * 100}
              />
            ))}
          </div>
        )}
        {reachedShowdown && (
          <div className={`hand-eval ${won ? 'winning-hand' : ''}`}>
            <div className="hand-eval-row">
              <strong>{handName(showdown.handName)}</strong>
              <span className="hand-rank">BỘ #{showdown.rank}</span>
            </div>
            <span className="hand-result">
              {won ? 'THẮNG VÁN NÀY' : isDead ? 'ĐÃ BỊ LOẠI' : 'KẾT QUẢ CUỐI VÁN'}
            </span>
          </div>
        )}
        {isDead && (
          <div className="seat-eliminated">
            Hết vận may.<span>Đang theo dõi ván chơi</span>
          </div>
        )}
      </div>
    </article>
  );
};
