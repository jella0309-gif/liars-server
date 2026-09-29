import React from 'react';
export type CharacterMood = 'idle' | 'thinking' | 'win' | 'dead';
export const CHARACTERS = [
  {
    id: 'monkey',
    avatar: '🐵',
    name: 'MONKEY',
    title: 'Kẻ liều lĩnh',
    quote: 'Một nụ cười. Một cú cược tất tay.',
    accent: '#d26948',
  },
  {
    id: 'fox',
    avatar: '🦊',
    name: 'FOX',
    title: 'Bậc thầy đánh lừa',
    quote: 'Đừng tin vào đôi mắt vô tội.',
    accent: '#dc684a',
  },
  {
    id: 'boar',
    avatar: '🐗',
    name: 'BOAR',
    title: 'Tay chơi bất khuất',
    quote: 'Không lùi bước. Không chớp mắt.',
    accent: '#bb7782',
  },
  {
    id: 'dog',
    avatar: '🐶',
    name: 'DOG',
    title: 'Gã hiền khó đoán',
    quote: 'Vẻ ngoài hiền lành. Bài trên tay thì khác.',
    accent: '#dfb78b',
  },
  {
    id: 'cat',
    avatar: '🐱',
    name: 'CAT',
    title: 'Chín mạng, một ván',
    quote: 'May mắn luôn đứng về phía kẻ tinh ranh.',
    accent: '#e8ad50',
  },
  {
    id: 'bear',
    avatar: '🐻',
    name: 'BEAR',
    title: 'Ông trùm bàn bài',
    quote: 'Bình thản trước mọi cú bóp cò.',
    accent: '#af8167',
  },
] as const;
export const MOOD_LABELS: Record<CharacterMood, string> = {
  idle: 'Bình thản',
  thinking: 'Suy nghĩ',
  win: 'Chiến thắng',
  dead: 'Bị hạ gục',
};
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
        aria-label={`${character.name} — ${MOOD_LABELS[mood]}`}
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
