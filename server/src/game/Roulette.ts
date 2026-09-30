import { RouletteResult, REVOLVER } from '@liars-bar/shared';

const NORMAL_VIRTUAL_CHAMBER_COUNT = 8;

export function resolveRoulette(bullets: number): Partial<RouletteResult> {
  // Cò quay trên giao diện vẫn chỉ có 6 vị trí
  const stopIndex = Math.floor(
    Math.random() * REVOLVER.CHAMBER_COUNT
  );

  let isDead = false;
  let isGodSave = false;

  // All-in: giữ nguyên luật cũ
  if (bullets >= REVOLVER.CHAMBER_COUNT) {
    if (Math.random() < REVOLVER.GOD_SAVE_CHANCE) {
      isDead = false;
      isGodSave = true;
    } else {
      isDead = true;
    }
  } else {
    // Người thường: tính xác suất như thể có 8 vị trí
    const virtualChamberIndex = Math.floor(
      Math.random() * NORMAL_VIRTUAL_CHAMBER_COUNT
    );

    isDead = virtualChamberIndex < bullets;
  }

  return {
    stopIndex,
    isDead,
    isGodSave,
  };
}
