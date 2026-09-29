import React from 'react';
import { Icon } from './Icon';

/** Receives already-derived seat information. No store, clock or permissions. */
export function PlayerHud({
  name, isMe, won, matchRank, bullets, isAllIn, stateLabel, active, seconds,
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
}) {
  // The current public player view carries the server's "(Bot)" name suffix,
  // not an isBot field. Restyle that existing label, without inferring identity.
  const hasBotLabel = !isMe && name.endsWith(' (Bot)');
  return (
    <div className="seat-status player-hud">
      <div className="seat-name-row">
        <h3 title={name}>{hasBotLabel ? name.slice(0, -6) : name}</h3>
        {hasBotLabel && <span className="bot-badge">BOT</span>}
        {isMe && <span className="you-badge">BẠN</span>}
        {won && <Icon name="crown" size={16} />}
        {matchRank && (
          <span className={`match-rank rank-${matchRank}`}>HẠNG {matchRank}</span>
        )}
      </div>
      <div
        className="seat-bullets"
        title={`${bullets}/6 viên đạn · ${Math.round((bullets / 6) * 100)}% buồng có đạn`}
      >
        <div className={`bullet-dots ${bullets >= 4 ? 'danger' : ''}`} aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} className={i < bullets ? 'filled' : ''} />
          ))}
        </div>
        <span>{bullets}/6{isAllIn && <b> ALL-IN</b>}</span>
      </div>
      {stateLabel && <span className="seat-hud-state">{stateLabel}</span>}
      {active && (
        <div className="seat-timer">
          <span style={{ width: `${Math.min((seconds / 30) * 100, 100)}%` }} />
          <small>{seconds}s</small>
        </div>
      )}
    </div>
  );
}
