import { RouletteResult, REVOLVER } from '@liars-bar/shared';

export function resolveRoulette(bullets: number): Partial<RouletteResult> {
  const stopIndex = Math.floor(Math.random() * REVOLVER.CHAMBER_COUNT);
  
  let isDead = stopIndex < bullets;
  let isGodSave = false;

  if (bullets >= REVOLVER.CHAMBER_COUNT) {
    if (Math.random() < REVOLVER.GOD_SAVE_CHANCE) {
      isDead = false;
      isGodSave = true;
    } else {
      isDead = true;
    }
  }

  return {
    stopIndex,
    isDead,
    isGodSave
  };
}
