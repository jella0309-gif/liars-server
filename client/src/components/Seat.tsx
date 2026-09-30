import React from 'react';
import { PlayerHand } from './PlayerHand';
import { LocalPlayerArea } from './LocalPlayerArea';
import { CharacterFigure } from './CharacterFigure';
import { PlayerHud } from './PlayerHud';
import {
  CharacterPortrait,
  getCharacter,
  type CharacterMood,
} from './CharacterPortrait';
import { useGameStore } from '../store/gameStore';
import { useTurnClock } from '../hooks/useTurnClock';
import { useT } from '../i18n';
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
foldVoicePending,
roundNumber,
  } = useGameStore();
  const t = useT();
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
        <span>{t('seat.waiting')}</span>
        <small>{t('seat.label', { n: seatIndex + 1 })}</small>
      </div>
    );
  const name = player?.name || fallback?.name || t('seat.player');
  const avatar = player?.avatar || fallback?.avatar || '🐵';
  const matchRank = player?.matchRank;
  const offline = !isMe && fallback ? fallback.connected === false : false;
  const shooting = rouletteResult?.seatIndex === seatIndex;

// Ẩn trạng thái chết trong lúc tiếng Fold đang đọc
// và trong lúc bảng roulette chưa lộ kết quả.
const isDead = rouletteResult
  ? shooting
    ? rouletteRevealed && rouletteResult.isDead
    : !!player?.isDead
  : foldVoicePending && player?.folded
    ? false
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
  const stateLabel = shooting && !rouletteRevealed
    ? t('seat.shooting')
    : isDead ? t('seat.dead')
      : won ? t('seat.won')
        : folded ? t('seat.folded')
          : active ? t('seat.thinking')
            : getCharacter(avatar).name;
  const portrait = (
    <div className="seat-portrait-wrap">
      <CharacterPortrait avatar={avatar} mood={mood} alignTop />
      <span className={`seat-state-label ${active ? 'thinking-label' : ''}`}>
        {stateLabel}
      </span>
    </div>
  );
  const status = (
    <PlayerHud
      name={name} isMe={isMe} won={won} matchRank={matchRank}
      bullets={bullets} isAllIn={player?.isAllIn}
      stateLabel={shooting || isDead || won || folded ? stateLabel : undefined}
      active={active} seconds={seconds} offline={offline && !isDead}
    />
  );
  const hand = (reachedShowdown || !isDead) && cards.length > 0
    ? <PlayerHand cards={cards} hidden={hidden} roundNumber={roundNumber} />
    : null;
  const result = (
    <>
      {reachedShowdown && (
        <div className={`hand-eval ${won ? 'winning-hand' : ''}`}>
          <div className="hand-eval-row">
            <strong>{handName(showdown.handName)}</strong>
            <span className="hand-rank">{t('seat.hand', { n: showdown.rank })}</span>
          </div>
          <span className="hand-result">
            {won ? t('seat.wonRound') : isDead ? t('seat.eliminated') : t('seat.result')}
          </span>
        </div>
      )}
      {isDead && (
        <div className="seat-eliminated">
          {t('seat.outLuck')}<span>{t('seat.spectating')}</span>
        </div>
      )}
    </>
  );
  return (
    <article
      className={`seat ${isMe ? 'seat-is-me' : 'opponent-seat'} ${active ? 'active-turn' : ''} ${isDead ? 'dead' : ''} ${folded ? 'folded' : ''} ${won ? 'seat-winner' : ''} ${offline ? 'offline' : ''} ${bubble ? bubble.cls.replace('bubble-', 'acting-') : ''}`}
      data-seat={seatIndex}
      data-active={active || undefined}
    >
      {bubble && <div className={`action-bubble ${bubble.cls}`} role="status">{bubble.text}</div>}
      {bubble && <span className="seat-action-trail" aria-hidden="true">♠</span>}
      {isMe ? (
        <LocalPlayerArea portrait={portrait} status={status} hand={hand} result={result} />
      ) : (
        <>
          <CharacterFigure avatar={avatar} mood={mood} label={stateLabel} />
          <div className="seat-details">{status}{hand}{result}</div>
        </>
      )}
    </article>
  );
};
