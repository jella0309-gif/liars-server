import { ServerPlayer, ClientGameState, PlayerActionType } from '@liars-bar/shared';
import { evaluateBestHand } from './HandEvaluator.js';

export function decideBotAction(bot: ServerPlayer, gameState: ClientGameState): PlayerActionType {
  const cards = [...bot.cards, ...gameState.communityCards];
  const handEval = evaluateBestHand(cards);
  
  // Basic heuristic
  const hasOpponentAllIn = gameState.hasAnyAllIn;
  const isDanger = bot.bullets >= 3;
  const stage = gameState.stage;
  
  const score = handEval.score;

  // Simple logic
  // When opponent is all-in, only fold or allin allowed (no call)
  if (hasOpponentAllIn) {
    if (bot.bullets >= 5) return 'fold'; // Too dangerous to all-in
    if (score > 1000000) return 'allin'; // Pair or better, go for it
    if (Math.random() < 0.3) return 'allin'; // Bluff sometimes
    return 'fold';
  }

  if (isDanger) {
    if (score > 2000000) return 'allin';
    return 'fold';
  }

  if (score > 3000000 && Math.random() < 0.5) {
    return 'allin';
  }

  if (Math.random() < 0.8) {
    return 'call';
  }

  return 'fold';
}

export function decideBotSwap(bot: ServerPlayer, drawnCardsCount: number): { handIdx: number, drawnIdx: number } | null {
  if (Math.random() > 0.5) return null; // 50% chance to not swap
  return {
    handIdx: Math.floor(Math.random() * 2),
    drawnIdx: Math.floor(Math.random() * drawnCardsCount)
  };
}
