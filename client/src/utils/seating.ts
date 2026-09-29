export type SeatPosition =
  | 'bottom'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right';

/** Relative clockwise order keeps the local player nearest the controls. */
const POSITIONS: Record<number, readonly SeatPosition[]> = {
  2: ['bottom', 'top'],
  3: ['bottom', 'top-left', 'top-right'],
  4: ['bottom', 'left', 'top', 'right'],
};

export function seatPosition(
  seatIndex: number,
  localSeat: number,
  count: number
): SeatPosition {
  const positions = POSITIONS[count] ?? POSITIONS[2];
  const relativeIndex =
    (((seatIndex - Math.max(0, localSeat)) % positions.length) +
      positions.length) %
    positions.length;
  return positions[relativeIndex];
}
