import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
export function useTurnClock() {
  const deadline = useGameStore((s) => s.turnDeadline);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!deadline) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
