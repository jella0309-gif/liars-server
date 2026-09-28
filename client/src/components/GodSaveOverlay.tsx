import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { speakActionVoice } from '../utils/audio';

export const GodSaveOverlay: React.FC = () => {
  const godSavePlayerName = useGameStore((state) => state.godSavePlayerName);
  const setGodSave = useGameStore((state) => state.setGodSave);

  useEffect(() => {
    if (godSavePlayerName) {
      speakActionVoice("God save!");
      const timer = setTimeout(() => {
        setGodSave(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [godSavePlayerName, setGodSave]);

  if (!godSavePlayerName) return null;

  return (
    <div className="god-save-overlay" style={{ display: 'flex' }}>
      <div className="god-save-title">✨ GOD'S SAVE! ✨</div>
      <div className="god-save-sub">
        PHÉP MÀU! [{godSavePlayerName.toUpperCase()}] ĐÃ ĐƯỢC CHÚA CỨU SỐNG KHỎI 6 VIÊN ĐẠN!
      </div>
    </div>
  );
};
