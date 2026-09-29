import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { emitPlayAgain, leaveRoom } from '../socket';
import { CharacterPortrait } from './CharacterPortrait';
import { useT } from '../i18n';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
export const WinnerOverlay: React.FC = () => {
  const {
    winnerName,
    winnerSeatIndex,
    currentRoomId,
    gameState,
    playersInfo,
    isConnected,
  } = useGameStore();
  const t = useT();
  const [pending, setPending] = useState(false);
  React.useEffect(() => {
    setPending(false);
  }, [winnerName, isConnected]);
  React.useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => setPending(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [pending]);
  if (!winnerName) return null;
  const player =
    gameState?.me.seatIndex === winnerSeatIndex
      ? gameState.me
      : gameState?.opponents.find((p) => p.seatIndex === winnerSeatIndex);
  const avatar =
    player?.avatar ||
    playersInfo.find((p) => p.seatIndex === winnerSeatIndex)?.avatar ||
    '🐵';
  const standings = gameState
    ? [gameState.me, ...gameState.opponents]
        .filter((entry) => entry.matchRank !== null)
        .sort((a, b) => a.matchRank! - b.matchRank!)
    : [];
  const [lineA, lineB] = t('win.p').split('\n');
  return (
    <Dialog className="winner-dialog" label={t('win.aria')}>
      <div className="winner-art">
        <CharacterPortrait avatar={avatar} mood="win" />
        <span className="winner-crown">
          <Icon name="crown" size={32} />
        </span>
      </div>
      <span className="eyebrow">THE LAST ONE STANDING</span>
      <h2>{winnerName}</h2>
      <div className="winner-caption">{t('win.caption')}</div>
      <p>
        {lineA}
        <br />
        {lineB}
      </p>
      <ol className="match-standings" aria-label={t('win.standings')}>
        {standings.map((entry) => (
          <li key={entry.seatIndex} className={`rank-${entry.matchRank}`}>
            <b>{t('seat.rank', { n: entry.matchRank! })}</b>
            <strong>{entry.name}</strong>
          </li>
        ))}
      </ol>
      <button
        className="btn-primary"
        disabled={!isConnected || pending}
        onClick={() => {
          setPending(true);
          emitPlayAgain(currentRoomId);
        }}
      >
        {pending ? t('win.preparing') : t('win.again')}
        <Icon name="arrow" />
      </button>
      <button className="text-button" onClick={leaveRoom}>
        {t('win.lobby')}
      </button>
    </Dialog>
  );
};
