import React, { useState } from 'react';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { TableSurface } from './TableSurface';
import { ShowdownSummary } from './ShowdownSummary';
import { PlayerControls } from './PlayerControls';
import { useGameStore } from '../store/gameStore';
import { useT } from '../i18n';
import { Icon } from './Icon';
import { STAGES } from '@liars-bar/shared';
import { seatPosition } from '../utils/seating';

export const PokerTable: React.FC = () => {
  const {
    gameState,
    tableLog,
    showdownResults,
    isRoundOver,
    roomMaxPlayers,
    mySeatIndex,
    playersInfo,
    roundNumber,
    currentRoomId,
  } = useGameStore();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const count = gameState?.maxPlayers ?? roomMaxPlayers;
  const seats = Array.from({ length: count }, (_, i) => i);
  const cards = gameState?.communityCards || [];
  const stage = showdownResults ? 4 : (gameState?.stage ?? 0);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoomId);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };
  const [waitingA, waitingB] = t('table.waiting.title').split('\n');
  return (
    <main className="game-page game-table-scene">
      <div className="game-toolbar">
        <div>
          <span className="eyebrow">
            <span className="tiny-diamond" /> THE LAST SEAT STANDING
          </span>
          <h1>
            {t('table.title')}
            <span>{t('table.round', { n: String(roundNumber || 1).padStart(2, '0') })}</span>
          </h1>
        </div>
        <div className="table-meta">
          <span className="table-capacity">
            <Icon name="users" size={17} />
            {t('table.players', { n: count })}
          </span>
          <button
            className="room-code-button"
            onClick={copyCode}
            aria-label={t('table.copy')}
          >
            <span>
              {t('table.room')} <b>{currentRoomId}</b>
            </span>
            <Icon name={copied ? 'check' : 'copy'} size={17} />
            {copied && <small>{t('table.copied')}</small>}
          </button>
        </div>
      </div>
      {copyError && (
        <p className="copy-fallback" role="status">
          {t('table.copyFallback', { code: currentRoomId })}
        </p>
      )}
      <div className="game-layout">
        <section className="game-arena" aria-label={t('table.aria')}>
          <nav className="stage-track" aria-label={t('table.stages')}>
            {STAGES.map((name, i) => (
              <span
                key={name}
                className={
                  stage === i && gameState
                    ? 'current'
                    : stage > i
                      ? 'complete'
                      : ''
                }
                aria-current={stage === i ? 'step' : undefined}
              >
                <i>{stage > i ? <Icon name="check" size={10} /> : i + 1}</i>
                {name}
              </span>
            ))}
          </nav>
          <div className={`poker-table seats-${count}`} data-seat-count={count}>
            <TableSurface />
            <div className="table-center">
              {!gameState ? (
                <div className="waiting-table">
                  <span className="eyebrow">{t('table.waiting.eyebrow')}</span>
                  <h2>
                    {waitingA}
                    <br />
                    {waitingB}
                  </h2>
                  <p>{t('table.waiting.count', { have: playersInfo.length, need: count })}</p>
                  <button className="btn-secondary" onClick={copyCode}>
                    <Icon name="copy" size={16} />
                    {copied ? t('table.copiedCode') : t('table.invite', { code: currentRoomId })}
                  </button>
                </div>
              ) : (
                <>
                  <CommunityCards cards={cards} roundNumber={roundNumber} />
                  <div className="table-log" role="status">
                    <span className="tiny-diamond" />
                    {isRoundOver ? t('table.roundOverLog') : tableLog}
                  </div>
                  <div
                    key={`${roundNumber}-${stage}`}
                    className="stage-announcement"
                    aria-hidden="true"
                  >
                    {stage === 0 ? t('table.deal') : STAGES[stage]}
                  </div>
                </>
              )}
            </div>
            {seats.map((i) => (
              <div
                key={i}
                className={`seat-position pos-${seatPosition(i, mySeatIndex, count)} ${i === mySeatIndex ? 'local-seat' : ''}`}
                data-position={seatPosition(i, mySeatIndex, count)}
              >
                <Seat seatIndex={i} />
              </div>
            ))}
            <ShowdownSummary />
            <div className="table-edge-label" aria-hidden="true">
              ONE TABLE. DIFFERENT MASKS.
            </div>
          </div>
        </section>
      </div>
      <PlayerControls />
    </main>
  );
};
