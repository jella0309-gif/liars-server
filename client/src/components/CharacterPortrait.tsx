import React from 'react';
import { t } from '../i18n';
export type CharacterMood = 'idle' | 'thinking' | 'win' | 'dead';
export const CHARACTERS = [
  {
    id: 'monkey',
    avatar: '🐵',
    name: 'MONKEY',
    accent: '#d26948',
  },
  {
    id: 'fox',
    avatar: '🦊',
    name: 'FOX',
    accent: '#dc684a',
  },
  {
    id: 'boar',
    avatar: '🐗',
    name: 'BOAR',
    accent: '#bb7782',
  },
  {
    id: 'dog',
    avatar: '🐶',
    name: 'DOG',
    accent: '#dfb78b',
  },
  {
    id: 'cat',
    avatar: '🐱',
    name: 'CAT',
    accent: '#e8ad50',
  },
  {
    id: 'bear',
    avatar: '🐻',
    name: 'BEAR',
    accent: '#af8167',
  },
] as const;
export const MOODS: CharacterMood[] = ['idle', 'thinking', 'win', 'dead'];
/** Localized mood label (usable outside React). */
export const moodLabel = (mood: CharacterMood) => t(`mood.${mood}`);
export function getCharacter(avatar: string) {
  if (avatar === '🤠') return CHARACTERS[0];
  if (avatar === '🐺') return CHARACTERS[5];
  return (
    CHARACTERS.find((c) => c.avatar === avatar || c.id === avatar) ??
    CHARACTERS[0]
  );
}
// Viewports reference the original sheets. Source artwork is unmodified.
const lineupFrames = [
  [12, 13, 344, 448],
  [377, 14, 307, 447],
  [706, 15, 306, 446],
  [1034, 15, 312, 446],
  [1370, 15, 308, 446],
  [1705, 15, 328, 446],
];
const stateFrames = [
  [90, 211],
  [328, 198],
  [549, 226],
  [800, 218],
  [1045, 218],
  [1290, 229],
];
const stateRows: Record<CharacterMood, [number, number]> = {
  idle: [83, 243],
  thinking: [342, 210],
  win: [571, 208],
  dead: [797, 190],
};
export function CharacterPortrait({
  avatar,
  mood = 'idle',
  lineup = false,
  alignTop = false,
  className = '',
}: {
  avatar: string;
  mood?: CharacterMood;
  lineup?: boolean;
  alignTop?: boolean;
  className?: string;
}) {
  const character = getCharacter(avatar);
  const index = CHARACTERS.indexOf(character);
  const [x, w] = stateFrames[index],
    [y, h] = stateRows[mood];
  const frame = lineup ? lineupFrames[index] : [x, y, w, h];
  return (
    <div
      className={`character-art ${className}`}
      data-character={character.id}
      data-mood={mood}
      style={{ '--character-accent': character.accent } as React.CSSProperties}
    >
      <svg
        key={lineup ? 'lineup' : mood}
        viewBox={frame.join(' ')}
        preserveAspectRatio={alignTop ? 'xMidYMin slice' : 'xMidYMid slice'}
        role="img"
        aria-label={`${character.name} — ${moodLabel(mood)}`}
      >
        <image
          href={`/art/character-${lineup ? 'lineup' : 'states'}.png`}
          width={lineup ? 2048 : 1536}
          height={lineup ? 683 : 1024}
        />
      </svg>
    </div>
  );
}
