import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { playGunshot, playEmptyClick, playGodSaveSound } from '../utils/audio';
import { CharacterPortrait } from './CharacterPortrait';
import { TIMING } from '@liars-bar/shared';
export const RouletteModal: React.FC = () => {
  const {
    rouletteResult: result,
    setRouletteResult,
    setGodSave,
    revealRoulette,
  } = useGameStore();
  const [phase, setPhase] = useState<'load' | 'spin' | 'result'>('load');
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    if (!result) return;
    setPhase('load');
    setLoaded(0);
    const bullets = Math.min(result.bullets, 6);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= bullets; i++)
      timers.push(setTimeout(() => setLoaded(i), i * 65));
    timers.push(setTimeout(() => setPhase('spin'), 500));
    timers.push(
      setTimeout(() => {
        setPhase('result');
        revealRoulette();
        if (result.isGodSave) {
          playGodSaveSound();
          setGodSave(result.name);
        } else if (result.isDead) playGunshot();
        else playEmptyClick();
      }, 3100)
    );
    timers.push(
      setTimeout(
        () => {
          if (useGameStore.getState().rouletteResult === result)
            setRouletteResult(null);
        },
        TIMING.ROULETTE_ANIMATION_DURATION * 1000 - 100
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [result, setRouletteResult, setGodSave, revealRoulette]);
  if (!result) return null;
  const revealed = phase === 'result';
  const rotation =
    phase === 'load' ? 0 : 1440 + ((6 - (result.stopIndex % 6)) % 6) * 60;
  const label = !revealed
    ? phase === 'load'
      ? 'Nạp đạn. Nín thở.'
      : 'Vận may đang xoay…'
    : result.isGodSave
      ? 'PHÉP MÀU XẢY RA!'
      : result.isDead
        ? 'VẬN MAY ĐÃ HẾT.'
        : 'BẠN CÒN MỘT CƠ HỘI.';
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
          <p>{result.bullets}/6 viên đạn · Một lần bóp cò</p>
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
                    : 'transform 2.5s cubic-bezier(.13,.7,.1,1)',
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
