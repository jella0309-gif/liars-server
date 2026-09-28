import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { setBgmVolume, setSfxVolume, toggleBgm } from '../utils/audio';

export const Header: React.FC = () => {
  const currentRoomId = useGameStore((state) => state.currentRoomId);
  const mySeatIndex = useGameStore((state) => state.mySeatIndex);

  const [bgmVal, setBgmVal] = useState(20);
  const [sfxVal, setSfxVal] = useState(80);
  const [isBgmOn, setIsBgmOn] = useState(false);

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setBgmVal(val);
    setBgmVolume(val);
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVal(val);
    setSfxVolume(val);
  };

  const handleToggleBgm = () => {
    const active = toggleBgm();
    setIsBgmOn(active);
  };

  return (
    <header>
      <div className="title">
        🔫 Liar's Bar{' '}
        {currentRoomId && (
          <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
            [{currentRoomId}] (Ghế #{mySeatIndex + 1})
          </span>
        )}
      </div>

      <div className="header-controls">
        <div className="vol-control">
          <span>🎵 BGM:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={bgmVal}
            onChange={handleBgmChange}
          />
          <span className="val">{bgmVal}%</span>
        </div>

        <div className="vol-control">
          <span>💥 SFX:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVal}
            onChange={handleSfxChange}
          />
          <span className="val">{sfxVal}%</span>
        </div>

        <button
          className="btn-top btn-bgm"
          onClick={handleToggleBgm}
          style={{ color: isBgmOn ? '#38bdf8' : '#cbd5e1' }}
        >
          🎵 {isBgmOn ? 'ON' : 'OFF'}
        </button>

        <button className="btn-top" onClick={() => location.reload()}>
          Đổi Phòng
        </button>
      </div>
    </header>
  );
};
