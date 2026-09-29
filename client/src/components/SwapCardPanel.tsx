import React, { useState, useEffect, useRef } from 'react';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../store/gameStore';
import { emitSwapConfirm } from '../socket';
import { useTurnClock } from '../hooks/useTurnClock';
import { TIMING } from '@liars-bar/shared';
import { useT } from '../i18n';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
export const SwapCardPanel: React.FC = () => {
  const { swapPoolCards, setSwapPool, gameState, currentRoomId, isConnected } =
    useGameStore();
  const t = useT();
  const turnSeconds = useTurnClock();
  const [handIndex, setHandIndex] = useState<number | null>(null),
    [drawnIndex, setDrawnIndex] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    TIMING.SWAP_TIME_LIMIT
  );
  const [swapping, setSwapping] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!swapPoolCards) return;
    setHandIndex(null);
    setDrawnIndex(null);
    setSwapping(false);
    const deadline = Date.now() + TIMING.SWAP_TIME_LIMIT * 1000;
    setSecondsLeft(TIMING.SWAP_TIME_LIMIT);
    const timer = setInterval(
      () =>
        setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      250
    );
    return () => {
      clearInterval(timer);
      clearTimeout(confirmTimer.current);
    };
  }, [swapPoolCards]);
  const remaining = Math.min(secondsLeft, turnSeconds);
  useEffect(() => {
    if (swapPoolCards && remaining <= 0) setSwapPool(null);
  }, [remaining, swapPoolCards, setSwapPool]);
  if (!swapPoolCards) return null;
  const confirm = () => {
    if (handIndex === null || drawnIndex === null || swapping || !isConnected)
      return;
    setSwapping(true);
    // The short exchange finishes before submission; no successful result is invented locally.
    confirmTimer.current = setTimeout(() => {
      emitSwapConfirm(currentRoomId, handIndex, drawnIndex);
      setSwapPool(null);
    }, 450);
  };
  const close = () => {
    if (!swapping) setSwapPool(null);
  };
  const [introA, introB] = t('swap.p').split('\n');
  const board = gameState?.communityCards ?? [];
  return (
    <Dialog
      label={t('swap.title')}
      className={`swap-dialog ${swapping ? 'is-swapping' : ''}`}
      onClose={close}
    >
      <button
        className="dialog-close icon-button"
        disabled={swapping}
        aria-label={t('swap.keepClose')}
        onClick={close}
      >
        <Icon name="close" />
      </button>
      <span className="eyebrow">{t('swap.eyebrow')}</span>
      <h2>
        {t('swap.h')}
        <br />
        <em>{t('swap.h2')}</em>
      </h2>
      <div className="swap-intro">
        <p>
          {introA}
          <br />
          {introB}
        </p>
        <span className={`swap-timer ${remaining <= 5 ? 'urgent' : ''}`}>
          <Icon name="clock" size={16} />
          {remaining}s
        </span>
      </div>
      {/* The board stays in view while choosing, so the decision is informed. */}
      {board.length > 0 && (
        <div className="swap-zone swap-board" aria-label={t('swap.board')}>
          <div className="section-heading">
            <h3>
              <span>♠</span> {t('swap.board')}
            </h3>
          </div>
          <div className="swap-cards-row swap-board-row">
            {board.map((c, i) => (
              <PlayingCard key={i} card={c} />
            ))}
          </div>
        </div>
      )}
      <div className="swap-zone swap-hand">
        <div className="section-heading">
          <h3>
            <span>01</span> {t('swap.give')}
          </h3>
          <span>{handIndex !== null ? t('swap.picked') : t('swap.pick')}</span>
        </div>
        <div className="swap-cards-row">
          {gameState?.me.cards.map((c, i) => (
            <PlayingCard
              key={i}
              card={c}
              selectable={!swapping}
              selected={handIndex === i}
              onClick={() => setHandIndex(i)}
            />
          ))}
        </div>
      </div>
      <div className="swap-divider">
        <span />
        <Icon name="swap" />
        <span />
      </div>
      <div className="swap-zone swap-draw">
        <div className="section-heading">
          <h3>
            <span>02</span> {t('swap.take')}
          </h3>
          <span>{drawnIndex !== null ? t('swap.picked') : t('swap.pick')}</span>
        </div>
        <div className="swap-cards-row">
          {swapPoolCards.map((c, i) => (
            <PlayingCard
              key={i}
              card={c}
              selectable={!swapping}
              selected={drawnIndex === i}
              onClick={() => setDrawnIndex(i)}
              delay={i * 90}
            />
          ))}
        </div>
      </div>
      <button
        className="btn-primary"
        disabled={
          handIndex === null ||
          drawnIndex === null ||
          swapping ||
          !isConnected ||
          remaining < 1
        }
        onClick={confirm}
      >
        {swapping ? t('swap.swapping') : t('swap.confirm')}
        <Icon name="swap" />
      </button>
      <button className="text-button" disabled={swapping} onClick={close}>
        {t('swap.keep')}
      </button>
    </Dialog>
  );
};
