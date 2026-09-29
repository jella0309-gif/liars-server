import { t, type Key } from '../i18n';

const KNOWN = new Set([
  'Royal Flush',
  'Straight Flush',
  'Four of a Kind',
  'Full House',
  'Flush',
  'Straight',
  'Three of a Kind',
  'Two Pair',
  'One Pair',
  'High Card',
  'Folded',
  'Invalid',
]);

/** Localized poker hand name (server sends the English evaluator name). */
export function handName(name: string) {
  return KNOWN.has(name) ? t(`hand.${name}` as Key) : name;
}
