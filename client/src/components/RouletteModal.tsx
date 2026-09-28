import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { playGunshot, playEmptyClick, playGodSaveSound } from '../utils/audio';

export const RouletteModal: React.FC = () => {
  const rouletteResult = useGameStore((state) => state.rouletteResult);
  const setRouletteResult = useGameStore((state) => state.setRouletteResult);
  const setGodSave = useGameStore((state) => state.setGodSave);

  const [subText, setSubText] = useState('Nạp đạn...');
  const [statusHtml, setStatusHtml] = useState<React.ReactNode>(null);
  const [loadedBullets, setLoadedBullets] = useState(0);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [hasTransition, setHasTransition] = useState(false);
  const [showBloodFlash, setShowBloodFlash] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rouletteResult) return;

    const { name, avatar, bullets, stopIndex, isDead, isGodSave } = rouletteResult;
    setSubText(`Nạp ${bullets} viên vào 6 buồng...`);
    setStatusHtml(null);
    setLoadedBullets(0);
    setRotationDeg(0);
    setHasTransition(false);

    // Step 1: Load bullets sequentially
    let currentLoaded = 0;
    const loadInterval = setInterval(() => {
      currentLoaded++;
      setLoadedBullets(currentLoaded);
      if (currentLoaded >= bullets) {
        clearInterval(loadInterval);

        // Step 2: Spin cylinder after loading
        setTimeout(() => {
          setSubText('Đang quay ổ đạn...');
          const targetDeg = ((6 - stopIndex) % 6) * 60;
          const totalDegree = 360 * 4 + targetDeg;

          setHasTransition(true);
          setRotationDeg(totalDegree);

          // Step 3: Reveal result after spin finishes (2.2s)
          setTimeout(() => {
            if (isGodSave) {
              setStatusHtml(<span className="text-god">✨ GOD'S SAVE!</span>);
              setSubText('LÉP ĐẠN THẦN KỲ!');
              playGodSaveSound();
              setGodSave(name);
            } else if (isDead) {
              setStatusHtml(<span className="text-dead">☠ NỔ ĐẠN!</span>);
              setSubText('BỊ HẠ GỤC!');
              playGunshot();
              setShowBloodFlash(true);
              document.body.classList.add('shake');
              setTimeout(() => {
                setShowBloodFlash(false);
                document.body.classList.remove('shake');
              }, 600);
            } else {
              setStatusHtml(<span className="text-life">✔ RỖNG (CLICK)</span>);
              setSubText('THOÁT CHẾT THÀNH CÔNG!');
              playEmptyClick();
            }

            // Close modal after showing result
            setTimeout(
              () => {
                setRouletteResult(null);
              },
              isGodSave ? 3500 : 2200
            );
          }, 2300);
        }, 350);
      }
    }, 200);

    return () => clearInterval(loadInterval);
  }, [rouletteResult, setRouletteResult, setGodSave]);

  if (!rouletteResult) return null;

  return (
    <>
      {showBloodFlash && <div className="blood-flash" />}

      <div
        ref={modalRef}
        className="center-roulette-modal"
        style={{ display: 'flex' }}
      >
        <div className="roulette-player-tag">
          <span>{rouletteResult.avatar}</span> <span>{rouletteResult.name}</span>
        </div>
        <div className="roulette-header-tag">RUSSIAN ROULETTE</div>
        <div className="roulette-sub-tag">{subText}</div>
        <div className="mini-barrel"></div>

        <div
          className="cylinder-spinner-wrap"
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transition: hasTransition
              ? 'transform 2.2s cubic-bezier(0.12, 0.88, 0.2, 1)'
              : 'none'
          }}
        >
          <svg className="revolver-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#181a20" stroke="#3f4555" strokeWidth="4" />
            <line x1="50" y1="4" x2="50" y2="16" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="84" x2="50" y2="96" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="4" y1="50" x2="16" y2="50" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="84" y1="50" x2="96" y2="50" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

            {/* 6 Chambers */}
            <g>
              {Array.from({ length: 6 }).map((_, i) => {
                const rad = (-90 + i * 60) * (Math.PI / 180);
                const cx = 50 + 29 * Math.cos(rad);
                const cy = 50 + 29 * Math.sin(rad);
                const isBulletLoaded = i < loadedBullets;

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill={isBulletLoaded ? '#f59e0b' : '#0c0d11'}
                    stroke={isBulletLoaded ? '#fbbf24' : '#2d3340'}
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>

            <circle cx="50" cy="50" r="11" fill="#1e222b" stroke="#64748b" strokeWidth="2" />
            <circle cx="50" cy="50" r="4" fill="#090a0d" />
          </svg>
        </div>

        <div className="mini-status">{statusHtml}</div>
      </div>
    </>
  );
};
