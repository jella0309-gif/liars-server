import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  playGunshot,
  playEmptyClick,
  playGodSaveSound,
  playBulletLoadSound,
  playCylinderSpinSound,
  stopCylinderSpinSound,
} from '../utils/audio';
import { CharacterPortrait } from './CharacterPortrait';
import { TIMING } from '@liars-bar/shared';
import { useT } from '../i18n';

const LOAD_END_MS = 500;
const SPIN_END_MS = 3000;
const REVEAL_AT_MS = 3100;
const DISMISS_EARLY_MS = 100;

export const RouletteModal: React.FC = () => {
  const {
    rouletteResult: result,
    rouletteStartedAt,
    setRouletteResult,
    setGodSave,
    revealRoulette,
  } = useGameStore();
  const t = useT();
  const [phase, setPhase] = useState<'load' | 'spin' | 'result'>('load');
  const [loaded, setLoaded] = useState(0);
  const [spinDuration, setSpinDuration] = useState(SPIN_END_MS - LOAD_END_MS);
  useEffect(() => {
    if (!result) return;
    const elapsed = Math.max(0, Date.now() - (rouletteStartedAt ?? Date.now()));
    const dismissAt =
      TIMING.ROULETTE_ANIMATION_DURATION * 1000 - DISMISS_EARLY_MS;
    if (elapsed >= dismissAt) {
      setRouletteResult(null);
      return;
    }

    const bullets = Math.min(result.bullets, 6);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (at: number, callback: () => void) => {
      timers.push(setTimeout(callback, Math.max(0, at - elapsed)));
    };

    setPhase(
      elapsed >= REVEAL_AT_MS
        ? 'result'
        : elapsed >= LOAD_END_MS
          ? 'spin'
          : 'load'
    );
    setLoaded(elapsed >= LOAD_END_MS ? bullets : Math.min(bullets, Math.floor(elapsed / 65)));
    setSpinDuration(Math.max(0, SPIN_END_MS - Math.max(LOAD_END_MS, elapsed)));
    playCylinderSpinSound();

    for (let i = 1; i <= bullets; i++) {
  if (i * 65 > elapsed) {
    schedule(i * 65, () => {
      setLoaded(i);
      playBulletLoadSound();
    });
  }
}
    if (elapsed < LOAD_END_MS) schedule(LOAD_END_MS, () => setPhase('spin'));
    timers.push(
      setTimeout(() => {
        setPhase('result');
stopCylinderSpinSound();
revealRoulette();
        if (result.isGodSave) {
          playGodSaveSound();
          setGodSave(result.name);
        } else if (result.isDead) playGunshot();
        else playEmptyClick();
      }, Math.max(0, REVEAL_AT_MS - elapsed))
    );
    timers.push(
      setTimeout(
        () => {
          if (useGameStore.getState().rouletteResult === result)
            setRouletteResult(null);
        },
        Math.max(0, dismissAt - elapsed)
      )
    );
    return () => {
  timers.forEach(clearTimeout);
  stopCylinderSpinSound();
};
  }, [result, rouletteStartedAt, setRouletteResult, setGodSave, revealRoulette]);
  if (!result) return null;
  const revealed = phase === 'result';
  const rotation =
    phase === 'load' ? 0 : 1440 + ((6 - (result.stopIndex % 6)) % 6) * 60;
  const label = !revealed
    ? phase === 'load'
      ? t('roul.load')
      : t('roul.spin')
    : result.isGodSave
      ? t('roul.godSave')
      : result.isDead
        ? t('roul.dead')
        : t('roul.alive');
  return (
    <div
      className={`roulette-backdrop ${revealed && result.isDead ? 'shot-fired' : ''}`}
    >
      <section className="roulette-dialog" role="status" aria-live="polite">
        <CharacterPortrait
          avatar={result.avatar}
          mood={!revealed ? 'thinking' : result.isDead ? 'dead' : 'idle'}
        />
        <div className="roulette-content">
          <span className="eyebrow">RUSSIAN ROULETTE</span>
          <h2>{result.name}</h2>
          <p>{t('roul.bullets', { n: result.bullets })}</p>
          <div className="cylinder-shell">
            <span className="cylinder-pointer">▼</span>
            <svg
              viewBox="0 0 120 120"
              className="revolver-svg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition:
                  phase === 'load'
                    ? 'none'
                    : `transform ${spinDuration}ms cubic-bezier(.13,.7,.1,1)`,
              }}
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="steel">
                  <stop offset="0" stopColor="#635649" />
                  <stop offset="1" stopColor="#211e1a" />
                </radialGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="56"
                fill="url(#steel)"
                stroke="#9a7954"
                strokeWidth="3"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#b59a6a"
                strokeOpacity=".25"
              />
              {Array.from({ length: 6 }, (_, i) => {
                const r = ((-90 + i * 60) * Math.PI) / 180;
                return (
                  <g key={i}>
                    <circle
                      cx={60 + 34 * Math.cos(r)}
                      cy={60 + 34 * Math.sin(r)}
                      r="12"
                      fill={i < loaded ? '#b68a4a' : '#0e100f'}
                      stroke={i < loaded ? '#e8c685' : '#655544'}
                      strokeWidth="2"
                    />
                    {i < loaded && (
                      <circle
                        cx={60 + 34 * Math.cos(r)}
                        cy={60 + 34 * Math.sin(r)}
                        r="5"
                        fill="#846031"
                        stroke="#dcb878"
                      />
                    )}
                  </g>
                );
              })}
              <circle cx="60" cy="60" r="12" fill="#27251f" stroke="#9a7954" />
              <circle cx="60" cy="60" r="4" fill="#0c0d0b" />
            </svg>
          </div>
          <div
            className={`roulette-result ${revealed ? (result.isDead ? 'result-dead' : 'result-safe') : ''}`}
          >
            {label}
          </div>
        </div>
      </section>
    </div>
  );
};
