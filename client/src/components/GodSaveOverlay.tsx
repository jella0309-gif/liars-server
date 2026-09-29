import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Icon } from './Icon';
export const GodSaveOverlay: React.FC = () => {
  const name = useGameStore((s) => s.godSavePlayerName),
    setGodSave = useGameStore((s) => s.setGodSave);
  useEffect(() => {
    if (name) {
      const timer = setTimeout(() => setGodSave(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [name, setGodSave]);
  if (!name) return null;
  return (
    <div className="god-save-toast" role="status">
      <Icon name="shield" size={30} />
      <div>
        <strong>PHÉP MÀU. MỘT MẠNG NỮA.</strong>
        <p>{name} thoát nạn nhờ lép đạn.</p>
      </div>
    </div>
  );
};
