import React from 'react';
import { TIMING } from '@liars-bar/shared';
import { useT } from '../i18n';
import { Icon } from './Icon';

/** Receives already-derived seat information. No store, clock or permissions. */
export function PlayerHud({
  name, isMe, won, matchRank, bullets, isAllIn, stateLabel, active, seconds, offline,
}: {
  name: string;
  isMe: boolean;
  won: boolean;
  matchRank?: number | null;
  bullets: number;
  isAllIn?: boolean;
  stateLabel?: string;
  active: boolean;
  seconds: number;
  offline?: boolean;
}) {
  const t = useT();
  // The current public player view carries the server's "(Bot)" name suffix,
  // not an isBot field. Restyle that existing label, without inferring identity.
  const hasBotLabel = !isMe && name.endsWith(' (Bot)');
  return (
    <div className="seat-status player-hud">
      <div className="seat-name-row">
        <h3 title={name}>{hasBotLabel ? name.slice(0, -6) : name}</h3>
        {hasBotLabel && <span className="bot-badge">{t('seat.bot')}</span>}
        {isMe && <span className="you-badge">{t('seat.you')}</span>}
        {won && <Icon name="crown" size={16} />}
        {matchRank && (
          <span className={`match-rank rank-${matchRank}`}>
            {t('seat.rank', { n: matchRank })}
          </span>
        )}
      </div>
      <div
        className="seat-bullets"
        title={t('seat.bullets', { n: bullets, pct: Math.round((bullets / 6) * 100) })}
      >
        <div className={`bullet-dots ${bullets >= 4 ? 'danger' : ''}`} aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} className={i < bullets ? 'filled' : ''} />
          ))}
        </div>
        <span>{bullets}/6{isAllIn && <b> ALL-IN</b>}</span>
      </div>
      {(stateLabel || offline) && (
        <span className="seat-hud-state">{offline ? t('seat.offline') : stateLabel}</span>
      )}
      {active && (
        <div className="seat-timer">
          <span
            style={{
              width: `${Math.min((seconds / TIMING.TURN_TIME_LIMIT) * 100, 100)}%`,
            }}
          />
          <small>{seconds}s</small>
        </div>
      )}
    </div>
  );
}
