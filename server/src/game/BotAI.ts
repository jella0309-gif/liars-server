import {
  VALUES,
  SUITS,
  REVOLVER,
  type Card,
  type ServerPlayer,
  type ClientGameState,
  type PlayerActionType,
} from '@liars-bar/shared';
import { evaluateBestHand } from './HandEvaluator.js';

// So lan thu cac kha nang bai chua duoc lat.
const SIMULATIONS = 120;

function estimateWinChance(
  bot: ServerPlayer,
  gameState: ClientGameState
): number {
  const opponents = gameState.opponents.filter(
    (player) => !player.isDead && !player.folded
  );

  if (opponents.length === 0) return 1;

  // Chi loai nhung la Bot thuc su duoc phep biet.
  const knownCards = [...bot.cards, ...gameState.communityCards];
  const unseenCards: Card[] = [];

  for (const suit of SUITS) {
    for (const val of VALUES) {
      const alreadyKnown = knownCards.some(
        (card) => card.val === val && card.suit === suit
      );

      if (!alreadyKnown) {
        unseenCards.push({
          val,
          suit,
          isRed: suit === '♦' || suit === '♥',
        });
      }
    }
  }

  let safeResults = 0;

  for (let attempt = 0; attempt < SIMULATIONS; attempt++) {
    const pool = [...unseenCards];

    function drawCard(): Card {
      const index = Math.floor(Math.random() * pool.length);
      return pool.splice(index, 1)[0]!;
    }

    // Thu lat tiep nhung la bai chung con thieu.
    const board = [...gameState.communityCards];

    while (board.length < 5) {
      board.push(drawCard());
    }

    const botScore = evaluateBestHand([...bot.cards, ...board]).score;
    let beaten = false;

    // Thu cac bai doi thu co the cam, khong doc bai that.
    for (const opponent of opponents) {
      const opponentCards: Card[] = [];

      for (let index = 0; index < opponent.cardCount; index++) {
        opponentCards.push(drawCard());
      }

      const opponentScore = evaluateBestHand([
        ...opponentCards,
        ...board,
      ]).score;

      if (opponentScore > botScore) {
        beaten = true;
        break;
      }
    }

    // Theo luat hien tai, dong hang nhat cung khong phai ban.
    if (!beaten) safeResults++;
  }

  return safeResults / SIMULATIONS;
}

function rouletteSurvival(bullets: number): number {
  if (bullets >= REVOLVER.CHAMBER_COUNT) {
    return REVOLVER.GOD_SAVE_CHANCE;
  }

  return 1 - bullets / REVOLVER.CHAMBER_COUNT;
}

export function decideBotAction(
  bot: ServerPlayer,
  gameState: ClientGameState
): PlayerActionType {
   // Luot dau: Call de xem 3 la bai chung.
  if (gameState.stage === 0 && !gameState.hasAnyAllIn) {
    return 'call';
  }

  const winChance = estimateWinChance(bot, gameState);

  // Fold phai co quay ngay voi so dan hien tai.
  const foldSurvival = rouletteSurvival(bot.bullets);

  // All-in: thang thi an toan; thua chi con God Save.
  const allInSurvival =
    winChance + (1 - winChance) * REVOLVER.GOD_SAVE_CHANCE;

  // Dao dong nho de Bot khong lan nao cung quyet dinh giong nhau.
  const caution = 0.02 + Math.random() * 0.03;

  if (gameState.hasAnyAllIn) {
    if (
      gameState.canAllIn &&
      allInSurvival > foldSurvival + caution
    ) {
      return 'allin';
    }

    return 'fold';
  }

  // Chi chu dong All-in khi bai du manh va luat cho phep.
  if (
    gameState.canAllIn &&
    winChance >= 0.65 + caution &&
    allInSurvival > foldSurvival + caution
  ) {
    return 'allin';
  }

  const nextBullets = Math.min(
    REVOLVER.CALL_BULLET_CAP,
    bot.bullets + 1
  );

  // Uoc luong rui ro neu Call roi theo den luc so bai.
  const callSurvival =
    winChance +
    (1 - winChance) * rouletteSurvival(nextBullets);

  if (callSurvival > foldSurvival + caution) {
    return 'call';
  }

  return 'fold';
}

// Giu ham cu de tuong thich; ban nay chua nang cap doi bai.
export function decideBotSwap(
  bot: ServerPlayer,
  drawnCardsCount: number
): { handIdx: number; drawnIdx: number } | null {
  if (drawnCardsCount <= 0 || bot.cards.length === 0) return null;
  if (Math.random() > 0.5) return null;

  return {
    handIdx: Math.floor(Math.random() * bot.cards.length),
    drawnIdx: Math.floor(Math.random() * drawnCardsCount),
  };
}
