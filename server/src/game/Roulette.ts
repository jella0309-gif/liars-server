import { RouletteResult, REVOLVER } from '@liars-bar/shared';

export function resolveRoulette(bullets: number): Partial<RouletteResult> {
  let stopIndex = 0;
  let isDead = false;
  let isGodSave = false;

  // All-in: giữ nguyên luật cũ
  if (bullets >= REVOLVER.CHAMBER_COUNT) {
    stopIndex = Math.floor(
      Math.random() * REVOLVER.CHAMBER_COUNT
    );

    if (Math.random() < REVOLVER.GOD_SAVE_CHANCE) {
      isDead = false;
      isGodSave = true;
    } else {
      isDead = true;
    }
  } else {
    // Người thường: tính như ổ có 8 vị trí ảo
    const virtualIndex = Math.floor(
      Math.random() * REVOLVER.VIRTUAL_CHAMBER_COUNT
    );

    if (virtualIndex < bullets) {
      // Trúng đạn: vị trí hiển thị chắc chắn là một ô đạn
      isDead = true;
      stopIndex = virtualIndex;
    } else {
      // Không trúng: vị trí hiển thị chắc chắn là ô trống
      const visibleEmptyCount = REVOLVER.CHAMBER_COUNT - bullets;
      const emptyIndex = Math.floor(
        Math.random() * visibleEmptyCount
      );

      stopIndex = bullets + emptyIndex;
    }
  }

  return {
    stopIndex,
    isDead,
    isGodSave,
  };
}
