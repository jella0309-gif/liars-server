import React from 'react';
const paths = {
  plus: 'M12 4v16M4 12h16',
  bot: 'M12 3v3m-6 0h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 5h.01M16 11h.01M8 16h8M1 10v6m22-6v6',
  dice: 'm8 2 13 6-6 13L2 15 8 2Zm1 4h.01m7 3h.01m-5 3h.01m-5 2h.01m7 3h.01',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  swap: 'M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4',
  sound: 'M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  help: 'M9.5 9a2.5 2.5 0 1 1 4.3 1.7L12 12.5V14m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  close: 'm6 6 12 12M6 18 18 6',
  copy: 'M9 9h11v11H9V9ZM15 9V4H4v11h5',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  cards: 'M7 3h12v17H7V3ZM7 6 3 7l3 14 6-1m1-12 2 3-2 3-2-3 2-3Z',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
  exit: 'M9 4H4v16h5m-1-8h13m-5-5 5 5-5 5',
  crown: 'm3 6 5 5 4-7 4 7 5-5-2 13H5L3 6Zm3 16h12',
  check: 'm5 12 4 4L19 6',
} as const;
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: keyof typeof paths;
  size?: number;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
