import { useSyncExternalStore } from 'react';
import { CHARACTERS, type CharacterMood } from './CharacterPortrait';

/** Gameplay-only character art. The lobby keeps the original lineup sheet. */
export type CharacterId = (typeof CHARACTERS)[number]['id'];
export const CHARACTER_MOODS: CharacterMood[] = ['idle', 'thinking', 'win', 'dead'];

const ASSET_ROOT = '/assets/characters';
const statePaths = (id: CharacterId): Record<CharacterMood, string> => ({
  idle: `${ASSET_ROOT}/${id}/idle.png`,
  thinking: `${ASSET_ROOT}/${id}/thinking.png`,
  win: `${ASSET_ROOT}/${id}/win.png`,
  dead: `${ASSET_ROOT}/${id}/dead.png`,
});

export const characterAssets: Record<CharacterId, Record<CharacterMood, string>> = {
  monkey: statePaths('monkey'),
  fox: statePaths('fox'),
  boar: statePaths('boar'),
  dog: statePaths('dog'),
  cat: statePaths('cat'),
  bear: statePaths('bear'),
};

type Rect = [x: number, y: number, w: number, h: number];
interface StateFrame {
  /** Row where the painted table was cut; every state is anchored on it. */
  base: number;
  /** Source-pixel areas hidden at display time: the baked-in state caption
   * and slivers of neighbouring sheet cells. The PNGs stay unmodified. */
  hide: Rect[];
  /** Source pixels to raise this state when its pose sits lower in the tile. */
  lift?: number;
}
interface CharacterFrames {
  width: number;
  height: number;
  states: Record<CharacterMood, StateFrame>;
}

// Measured from the alpha channel of the approved PNGs.
export const characterFrames: Record<CharacterId, CharacterFrames> = {
  monkey: {
    width: 724,
    height: 543,
    states: {
      idle: { base: 524, hide: [[45, 46, 198, 94], [687, 301, 37, 82]] },
      thinking: { base: 524, hide: [[38, 46, 251, 105], [0, 270, 30, 61], [0, 348, 31, 66], [0, 475, 7, 53]] },
      win: { base: 499, hide: [[34, 13, 199, 94]] },
      dead: { base: 499, hide: [[37, 12, 210, 102], [0, 114, 15, 42], [0, 383, 6, 120]] },
    },
  },
  fox: {
    width: 768,
    height: 512,
    states: {
      idle: { base: 506, hide: [] },
      thinking: { base: 511, hide: [[0, 420, 13, 56]] },
      win: { base: 454, hide: [[75, 0, 297, 10]], lift: 45 },
      dead: { base: 447, hide: [[66, 0, 339, 17], [574, 0, 134, 16], [0, 225, 53, 219], [0, 437, 22, 32]] },
    },
  },
  boar: {
    width: 724,
    height: 543,
    states: {
      idle: { base: 515, hide: [[34, 46, 201, 100]] },
      thinking: { base: 516, hide: [[14, 52, 271, 102]] },
      win: { base: 520, hide: [[27, 13, 194, 90]] },
      dead: { base: 520, hide: [[18, 8, 221, 104]] },
    },
  },
  dog: {
    width: 724,
    height: 543,
    states: {
      idle: { base: 517, hide: [[37, 40, 211, 95]] },
      thinking: { base: 517, hide: [[19, 36, 272, 104]] },
      win: { base: 521, hide: [[33, 4, 208, 87]] },
      dead: { base: 521, hide: [[29, 0, 225, 103]] },
    },
  },
  cat: {
    width: 724,
    height: 543,
    states: {
      idle: { base: 543, hide: [[47, 46, 197, 95]] },
      thinking: { base: 543, hide: [[16, 50, 253, 108]] },
      win: { base: 523, hide: [[32, 28, 205, 103]] },
      dead: { base: 523, hide: [[1, 0, 719, 7], [19, 27, 225, 102]] },
    },
  },
  bear: {
    width: 724,
    height: 543,
    states: {
      idle: { base: 523, hide: [[29, 47, 189, 84]] },
      thinking: { base: 523, hide: [[34, 54, 239, 99], [0, 487, 6, 30]] },
      win: { base: 503, hide: [[33, 7, 183, 97]] },
      dead: { base: 503, hide: [[15, 15, 195, 94], [0, 327, 10, 68]] },
    },
  },
};

/** Presentation-only alignment. Applied to the artwork, never to the seat.
 * x / y are percentages of the artwork box; scale multiplies it. */
export const characterAlignment: Record<CharacterId, { scale: number; x: number; y: number }> = {
  monkey: { scale: 1, x: 0, y: 0 },
  fox: { scale: 1, x: 0, y: 0 },
  boar: { scale: 1.07, x: 0, y: 0 }, // Reads slightly small/far at the top seat.
  dog: { scale: 1, x: 0, y: 0 },
  cat: { scale: 1, x: 0, y: 0 },
  bear: { scale: 1, x: 0, y: 0 },
};

/** One viewBox per character (tallest state, anchored on each state's base)
 * so every state renders at the same scale and switching never shifts it. */
export function stateViewBox(id: CharacterId, mood: CharacterMood) {
  const { width, states } = characterFrames[id];
  const anchor = (m: CharacterMood) => states[m].base + (states[m].lift ?? 0);
  const frameHeight = Math.max(...CHARACTER_MOODS.map(anchor));
  return [0, anchor(mood) - frameHeight, width, frameHeight] as const;
}

// Load status shared by every figure, so a missing file falls back everywhere.
const failed = new Set<string>();
const requested = new Map<string, HTMLImageElement>();
const listeners = new Set<() => void>();
export function markAssetFailed(url: string) {
  if (failed.has(url)) return;
  failed.add(url);
  listeners.forEach((l) => l());
}
export function useAssetFailed(url: string) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => failed.has(url)
  );
}

/** Warms all four states once per character, so mood changes never flash. */
export function preloadCharacterAssets(id: CharacterId) {
  for (const mood of CHARACTER_MOODS) {
    const url = characterAssets[id][mood];
    if (requested.has(url)) continue;
    const img = new Image();
    img.decoding = 'async';
    img.onerror = () => markAssetFailed(url);
    img.src = url;
    requested.set(url, img); // Kept referenced for the session.
  }
}
