import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './GameEngine.js';
import { AVATARS, type ServerPlayer } from '@liars-bar/shared';

function table(count = 2) {
  const players: ServerPlayer[] = Array.from(
    { length: count },
    (_, seatIndex) => ({
      id: String(seatIndex),
      seatIndex,
      name: `Player ${seatIndex}`,
      avatar: AVATARS[seatIndex],
      cards: [],
      bullets: 1,
      folded: false,
      isDead: false,
      isAllIn: false,
      hasUsedSwap: false,
      matchRank: null,
      isBot: false,
    })
  );
  const engine = new GameEngine(players, count);
  engine.initRound();
  return { engine, players };
}
function flop(engine: GameEngine) {
  engine.handleAction(0, 'call');
  engine.handleAction(1, 'call');
}

test('private hands stay hidden until showdown', () => {
  const { engine } = table(4);
  for (let seat = 0; seat < 4; seat++) {
    const state = engine.getStateForPlayer(seat);
    assert.equal(state.me.cards.length, 2);
    assert.equal(state.opponents.length, 3);
    assert.ok(
      state.opponents.every(
        (p) => p.cardCount === 2 && !Object.hasOwn(p, 'cards')
      )
    );
  }
});
test('reopening the swap panel returns the same pool and only one swap is accepted', () => {
  const { engine, players } = table();
  assert.equal(engine.handleSwapRequest(0), null);
  flop(engine);
  assert.equal(engine.handleSwapRequest(1), null);
  const pool = engine.handleSwapRequest(0)!;
  assert.equal(pool.drawnCards.length, 3);
  assert.deepEqual(engine.handleSwapRequest(0), pool);
  assert.equal(engine.handleSwapConfirm(0, -1, 0), false);
  assert.equal(engine.handleSwapConfirm(0, 0, -1), false);
  assert.equal(engine.handleSwapConfirm(0, 0, 99), false);
  assert.equal(engine.handleSwapConfirm(0, 0, 1), true);
  assert.deepEqual(players[0].cards[0], pool.drawnCards[1]);
  assert.equal(engine.handleSwapRequest(0), null);
  assert.equal(engine.handleSwapConfirm(0, 1, 0), false);
  assert.equal(engine.getStateForPlayer(0).canSwap, false);
});
test('a successful swap blocks all-in only for the rest of that turn', () => {
  const { engine, players } = table();
  flop(engine);
  engine.handleSwapRequest(0);
  assert.equal(engine.handleSwapConfirm(0, 0, 0), true);
  assert.equal(engine.getStateForPlayer(0).canAllIn, false);

  assert.deepEqual(engine.handleAction(0, 'allin'), []);
  assert.equal(players[0].isAllIn, false);
  assert.equal(engine.getStateForPlayer(0).currentTurnSeat, 0);

  engine.handleAction(0, 'call');
  engine.handleAction(1, 'call');
  assert.equal(engine.getStateForPlayer(0).canAllIn, true);
  engine.handleAction(0, 'allin');
  assert.equal(players[0].isAllIn, true);
});
test('a previous turn cannot confirm a stale swap selection', () => {
  const { engine } = table();
  flop(engine);
  engine.handleSwapRequest(0);
  engine.handleAction(0, 'call');
  assert.equal(engine.handleSwapConfirm(0, 0, 0), false);
  engine.handleAction(1, 'call');
  assert.equal(engine.handleSwapConfirm(0, 0, 0), false);
  assert.equal(engine.handleSwapRequest(0)!.drawnCards.length, 2);
});
test('all-in reveals the full board and closes turn actions during showdown', () => {
  const { engine } = table();
  assert.deepEqual(engine.handleAction(0, 'allin'), []);
  flop(engine);
  engine.handleAction(0, 'allin');
  assert.deepEqual(engine.handleAction(1, 'call'), []);
  assert.equal(engine.handleSwapRequest(1), null);
  const events = engine.handleAction(1, 'allin');
  const showdown = events.find((e) => e.type === 'showdown');
  assert.ok(showdown);
  assert.equal(showdown.results.length, 2);
  assert.ok(
    showdown.results.every(
      (result) => result.cards.length === 2 && result.rank >= 1
    )
  );
  const state = engine.getStateForPlayer(0);
  assert.equal(state.communityCards.length, 5);
  assert.equal(state.currentTurnSeat, -1);
  assert.deepEqual(engine.handleAction(1, 'fold'), []);
  assert.equal(engine.handleSwapRequest(0), null);
});
test('turn time reflects the server deadline without resetting after a state update', (t) => {
  const { engine } = table();
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  try {
    engine.startTurnTimer(0, () => {});
    now += 12000;
    assert.equal(engine.getStateForPlayer(0).turnTimeRemaining, 18);
    now += 2000;
    assert.equal(engine.getStateForPlayer(0).turnTimeRemaining, 16);
  } finally {
    engine.clearTurnTimer();
  }
});
test('match ranks follow elimination order from last place to winner', (t) => {
  const { engine, players } = table(4);
  t.mock.method(Math, 'random', () => 0.5);

  players[0].bullets = 6;
  players[1].bullets = 6;
  players[2].bullets = 6;
  assert.equal(engine.dispatchRoulette(players[0]).isDead, true);
  assert.equal(engine.dispatchRoulette(players[1]).isDead, true);
  assert.equal(engine.dispatchRoulette(players[2]).isDead, true);

  assert.deepEqual(
    players.map((player) => player.matchRank),
    [4, 3, 2, 1]
  );
  const finalState = engine.getStateForPlayer(3);
  assert.equal(finalState.me.matchRank, 1);
  assert.deepEqual(
    finalState.opponents.map((player) => player.matchRank),
    [4, 3, 2]
  );
});
test('game state carries the active roulette so reconnecting clients can recover it', (t) => {
  const { engine, players } = table();
  const startedAt = 123456;
  t.mock.method(Date, 'now', () => startedAt);

  const result = engine.dispatchRoulette(players[0]);
  const activeState = engine.getStateForPlayer(1);
  assert.equal(result.startedAt, startedAt);
  assert.deepEqual(activeState.activeRoulette, result);
  assert.equal(activeState.serverTime, startedAt);

  engine.clearActiveRoulette(startedAt - 1);
  assert.deepEqual(engine.getStateForPlayer(1).activeRoulette, result);
  engine.clearActiveRoulette(startedAt);
  assert.equal(engine.getStateForPlayer(1).activeRoulette, null);
});
test('new rounds reset swap eligibility and survivor expressions can return to idle', () => {
  const { engine, players } = table();
  flop(engine);
  engine.handleSwapRequest(0);
  engine.handleSwapConfirm(0, 0, 0);
  players[1].isDead = true;
  engine.initRound();
  assert.equal(players[0].hasUsedSwap, false);
  assert.equal(players[0].folded, false);
  assert.equal(players[0].bullets, 1);
  assert.equal(players[1].isDead, true);
});
