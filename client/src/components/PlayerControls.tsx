import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitAction, emitSwapRequest, emitNextRound } from '../socket';
import { useTurnClock } from '../hooks/useTurnClock';
import { REVOLVER, TIMING } from '@liars-bar/shared';
import { useT } from '../i18n';
import { Icon } from './Icon';
export const PlayerControls: React.FC = () => {
  const {
    gameState,
    mySeatIndex,
    currentRoomId,
    isRoundOver,
    winnerName,
    showdownResults,
    rouletteResult,
    isConnected,
    swapPoolCards,
  } = useGameStore();
  const t = useT();
  const seconds = useTurnClock();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setPending(false);
  }, [gameState, isRoundOver, rouletteResult, swapPoolCards, isConnected]);
  useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => setPending(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pending]);
  if (!gameState || winnerName) return null;
  const me = gameState.me;
  const resolving =
    !!showdownResults || !!rouletteResult || gameState.isProcessingRoulette;
  const isMyTurn =
    gameState.currentTurnSeat === mySeatIndex &&
    !resolving &&
    !isRoundOver &&
    !me.isDead &&
    !me.folded;
  const disabled = !isConnected || !isMyTurn || !!swapPoolCards || pending;
  const nextBullet = Math.min(REVOLVER.CALL_BULLET_CAP, me.bullets + 1);
  const currentPlayer =
    gameState.opponents.find((o) => o.seatIndex === gameState.currentTurnSeat)
      ?.name || t('ctl.s.opponent');
  const act = (action: 'fold' | 'call' | 'allin') => {
    if (disabled) return;
    setPending(true);
    emitAction(currentRoomId, action);
  };
  const status = isRoundOver
    ? t('ctl.s.roundOver')
    : rouletteResult
      ? t('ctl.s.roulette', { name: rouletteResult.name })
      : resolving
        ? t('ctl.s.resolving')
        : me.isDead
          ? t('ctl.s.dead')
          : me.folded
            ? t('ctl.s.folded')
            : isMyTurn
              ? t('ctl.s.yourTurn')
              : t('ctl.s.waiting', { name: currentPlayer });
  return (
    <section
      className={`controls-dock ${isMyTurn ? 'your-turn' : ''}`}
      aria-label={t('ctl.aria')}
    >
      <div className="controls-status">
        <div
          className={`turn-clock ${seconds <= 5 && isMyTurn ? 'urgent' : ''}`}
          role="timer"
          aria-label={isMyTurn ? t('ctl.left', { n: seconds }) : undefined}
          style={
            {
              // Presentation only: remaining-time fraction for the CSS ring.
              '--clock': Math.max(
                0,
                Math.min(1, seconds / TIMING.TURN_TIME_LIMIT)
              ),
            } as React.CSSProperties
          }
        >
          {isMyTurn ? (
            <>
              <b>{seconds}</b>
              <small>{t('ctl.sec')}</small>
            </>
          ) : (
            <Icon name={isRoundOver ? 'cards' : 'clock'} size={23} />
          )}
        </div>
        <div>
          <span className="eyebrow">
            {isRoundOver
              ? t('ctl.roundOver')
              : isMyTurn
                ? t('ctl.yourTurn')
                : t('ctl.atTable')}
          </span>
          <p role="status">{status}</p>
        </div>
        {/* The status line above already announces "your turn"; this only
            fires once when the clock reaches the 5-second threshold. */}
        <span className="sr-only" aria-live="assertive">
          {isMyTurn && seconds <= 5 ? t('ctl.left5') : ''}
        </span>
      </div>
      {isRoundOver ? (
        <button
          className="btn-primary"
          disabled={!isConnected || pending}
          onClick={() => {
            setPending(true);
            emitNextRound(currentRoomId);
          }}
        >
          {t('ctl.next')} <Icon name="arrow" />
        </button>
      ) : !resolving && !me.isDead && !me.folded ? (
        <div className="action-buttons">
          <button
            className="btn-act btn-fold"
            disabled={disabled}
            onClick={() => act('fold')}
          >
            <strong>{t('ctl.fold')}</strong>
            <small>{t('ctl.fold.sub')}</small>
          </button>
          {!gameState.hasAnyAllIn && (
            <button
              className="btn-act btn-swap"
              disabled={disabled || !gameState.canSwap}
              title={me.hasUsedSwap ? t('ctl.swap.title.used') : t('ctl.swap.title')}
              onClick={() => {
                setPending(true);
                emitSwapRequest(currentRoomId);
              }}
            >
              <strong>
                <Icon name="swap" size={16} /> {t('ctl.swap')}
              </strong>
              <small>
                {me.hasUsedSwap
                  ? t('ctl.swap.used')
                  : gameState.canSwap
                    ? t('ctl.swap.once')
                    : t('ctl.swap.fromFlop')}
              </small>
            </button>
          )}
          {!gameState.hasAnyAllIn && (
            <button
              className="btn-act btn-call"
              disabled={disabled}
              onClick={() => act('call')}
            >
              <strong>
                {t('ctl.call')} <span>+1</span>
              </strong>
              <small>
                {t('ctl.call.sub', {
                  n: nextBullet,
                  pct: Math.round((nextBullet / REVOLVER.CHAMBER_COUNT) * 100),
                })}
              </small>
            </button>
          )}
          <button
            className="btn-act btn-allin"
            disabled={disabled || !gameState.canAllIn}
            onClick={() => act('allin')}
          >
            <strong>{t('ctl.allin')}</strong>
            <small>
              {!gameState.canAllIn && me.hasUsedSwap && gameState.stage > 0
                ? t('ctl.allin.blocked')
                : gameState.hasAnyAllIn
                  ? t('ctl.allin.follow')
                  : gameState.stage === 0
                    ? t('ctl.allin.fromFlop')
                    : t('ctl.allin.sub')}
            </small>
          </button>
        </div>
      ) : (
        <span className="controls-passive">
          {resolving ? t('ctl.passive.resolving') : t('ctl.passive.spectate')}
        </span>
      )}
    </section>
  );
};
