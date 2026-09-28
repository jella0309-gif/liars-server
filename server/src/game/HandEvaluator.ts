import { Card, HandEvaluation, CardValue, VALUES } from '@liars-bar/shared';

function getRank(val: CardValue): number {
  return VALUES.indexOf(val) + 2; // '2' is 2, ..., 'A' is 14
}

function evaluate5Cards(hand: Card[]): { score: number, name: string } {
  const sorted = [...hand].sort((a, b) => getRank(b.val) - getRank(a.val));
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  
  const ranks = sorted.map(c => getRank(c.val));
  let isStraight = true;
  for (let i = 0; i < 4; i++) {
    if (ranks[i] - 1 !== ranks[i + 1]) {
      isStraight = false;
      break;
    }
  }
  
  // Handle A-2-3-4-5
  let isLowStraight = false;
  if (!isStraight && ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
    isLowStraight = true;
    isStraight = true;
    // Ranks array reordered to put A at bottom for scoring comparison
    ranks[0] = 5; ranks[1] = 4; ranks[2] = 3; ranks[3] = 2; ranks[4] = 1;
  }

  const counts: Record<number, number> = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }
  
  const countGroups: Record<number, number[]> = { 4: [], 3: [], 2: [], 1: [] };
  for (const [r, c] of Object.entries(counts)) {
    countGroups[c].push(Number(r));
  }
  for (const k of [4, 3, 2, 1]) {
    countGroups[k].sort((a, b) => b - a);
  }

  if (isStraight && isFlush) {
    if (ranks[0] === 14) return { score: 8000000 + ranks[0], name: 'Royal Flush' };
    return { score: 8000000 + ranks[0], name: 'Straight Flush' };
  }
  
  if (countGroups[4].length > 0) {
    const p1 = countGroups[4][0];
    const k1 = countGroups[1][0];
    return { score: 7000000 + p1 * 100 + k1, name: 'Four of a Kind' };
  }
  
  if (countGroups[3].length > 0 && countGroups[2].length > 0) {
    const p1 = countGroups[3][0];
    const p2 = countGroups[2][0];
    return { score: 6000000 + p1 * 100 + p2, name: 'Full House' };
  }
  
  if (isFlush) {
    const score = 5000000 + ranks[0] * 10000 + ranks[1] * 1000 + ranks[2] * 100 + ranks[3] * 10 + ranks[4];
    return { score, name: 'Flush' };
  }
  
  if (isStraight) {
    return { score: 4000000 + ranks[0], name: 'Straight' };
  }
  
  if (countGroups[3].length > 0) {
    const p1 = countGroups[3][0];
    const k1 = countGroups[1][0];
    const k2 = countGroups[1][1];
    return { score: 3000000 + p1 * 10000 + k1 * 100 + k2, name: 'Three of a Kind' };
  }
  
  if (countGroups[2].length >= 2) {
    const p1 = countGroups[2][0];
    const p2 = countGroups[2][1];
    const k1 = countGroups[1][0];
    return { score: 2000000 + p1 * 10000 + p2 * 100 + k1, name: 'Two Pair' };
  }
  
  if (countGroups[2].length === 1) {
    const p1 = countGroups[2][0];
    const k1 = countGroups[1][0];
    const k2 = countGroups[1][1];
    const k3 = countGroups[1][2];
    return { score: 1000000 + p1 * 10000 + k1 * 1000 + k2 * 100 + k3, name: 'One Pair' };
  }
  
  const score = ranks[0] * 10000 + ranks[1] * 1000 + ranks[2] * 100 + ranks[3] * 10 + ranks[4];
  return { score, name: 'High Card' };
}

function getCombinations(arr: Card[], n: number): Card[][] {
  const result: Card[][] = [];
  function combine(start: number, combo: Card[]) {
    if (combo.length === n) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

export function evaluateBestHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) return { score: 0, name: 'Invalid' };
  
  const combos = getCombinations(cards, 5);
  let bestScore = -1;
  let bestName = '';
  
  for (const combo of combos) {
    const { score, name } = evaluate5Cards(combo);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }
  
  return { score: bestScore, name: bestName };
}
