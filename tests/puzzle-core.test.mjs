import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game, PIECES, SIZE, Rng, at, fits, fullLines, points, addScore } from '../puzzle-core.js';

const DOT = Object.values(PIECES).find(p => p.cells.length === 1).key;
const emptyBoard = () => new Array(SIZE * SIZE).fill(0);
// A game with a chosen tray, on a chosen board.
const gameWith = (tray, board = emptyBoard(), extra = {}) =>
  new Game({ seed: 1, board, tray, ...extra });

test('every piece is well formed and fits on an empty board', () => {
  for (const p of Object.values(PIECES)) {
    assert.ok(p.cells.length >= 1 && p.cells.length <= 9, p.key);
    assert.ok(p.w <= 5 && p.h <= 5, p.key);
    assert.ok(p.color >= 1 && p.color <= 7, p.key);
    assert.ok(fits(emptyBoard(), p, 0, 0), p.key);
    assert.ok(!fits(emptyBoard(), p, SIZE - p.h + 1, 0), `${p.key} must not stick out at the bottom`);
  }
});

test('the same seed deals the same pieces', () => {
  assert.deepEqual(Game.create(42).tray, Game.create(42).tray);
  const a = new Rng(7), b = new Rng(7);
  for (let i = 0; i < 20; i++) assert.equal(a.next(), b.next());
});

test('placing a piece scores one point per block and empties its slot', () => {
  const g = gameWith([DOT, DOT, DOT]);
  const r = g.place(0, 3, 4);
  assert.equal(r.gained, 1);
  assert.equal(g.score, 1);
  assert.equal(g.board[at(3, 4)], PIECES[DOT].color);
  assert.equal(g.tray[0], null);
  assert.equal(g.place(1, 3, 4), null, 'cannot place on a filled cell');
  assert.equal(g.place(0, 0, 0), null, 'an empty slot has nothing to place');
});

test('a full row and a full column clear together, with a line bonus', () => {
  const board = emptyBoard();
  for (let j = 0; j < SIZE; j++) if (j !== 5) board[at(2, j)] = 2;
  for (let i = 0; i < SIZE; i++) if (i !== 2) board[at(i, 5)] = 3;
  const g = gameWith([DOT, DOT, DOT], board);
  const r = g.place(0, 2, 5);
  assert.deepEqual([r.rows, r.cols], [[2], [5]]);
  assert.equal(r.lines, 2);
  assert.equal(r.cleared.length, 15, 'the crossing cell counts once');
  assert.ok(r.allClear);
  assert.equal(r.gained, points(1, 2, 1, true));
  assert.equal(r.gained, 1 + 30 + 300);
  assert.ok(!g.board.some(Boolean));
  assert.deepEqual(fullLines(g.board), { rows: [], cols: [] });
});

test('combo grows while each placement clears a line and resets otherwise', () => {
  const board = emptyBoard();
  for (let j = 1; j < SIZE; j++) { board[at(0, j)] = 1; board[at(1, j)] = 1; }
  board[at(7, 7)] = 4;
  const g = gameWith([DOT, DOT, DOT], board);
  assert.equal(g.place(0, 0, 0).combo, 1);
  const second = g.place(1, 1, 0);
  assert.equal(second.combo, 2);
  assert.equal(second.gained, 1 + 10 * 2);
  assert.equal(g.place(2, 5, 5).combo, 0);
});

test('a new set of three is dealt once the tray is empty', () => {
  const g = gameWith([DOT, null, null]);
  const r = g.place(0, 0, 0);
  assert.ok(r.dealt);
  assert.ok(g.tray.every(k => PIECES[k]));
});

test('stuck when no piece fits; items and the end of the game', () => {
  const board = emptyBoard().fill(1);
  board[at(0, 0)] = 0;
  const big = Object.values(PIECES).find(p => p.cells.length === 9).key;
  const g = gameWith([big, big, null], board);
  assert.ok(g.stuck());
  assert.ok(!g.canUse('undo'), 'nothing to undo yet');
  assert.ok(g.canUse('star'));
  const s = g.star(4, 4);
  assert.equal(s.cleared.length, 9);
  assert.equal(g.items.star, 0);
  assert.ok(!g.canUse('star'), 'used up');
  assert.ok(!g.stuck(), 'the 3×3 piece fits where the star landed');
  g.end();
  assert.ok(g.over && !g.canUse('reroll') && !g.place(0, 3, 3));
});

test('undo takes back exactly one placement and restores the dealt pieces', () => {
  const g = gameWith([DOT, null, null]);
  const before = JSON.stringify({ board: g.board, tray: g.tray, score: g.score, rng: g.rng.state });
  g.place(0, 0, 0);
  const dealt = [...g.tray];
  assert.ok(g.undo());
  assert.equal(JSON.stringify({ board: g.board, tray: g.tray, score: g.score, rng: g.rng.state }), before);
  assert.equal(g.items.undo, 0);
  assert.ok(!g.undo(), 'only one step');
  g.place(0, 0, 0);
  assert.deepEqual(g.tray, dealt, 'the same pieces come again after undoing');
});

test('reroll swaps the tray; ad rewards add items up to the cap', () => {
  const g = Game.create(9);
  assert.ok(g.reroll());
  assert.equal(g.items.reroll, 0);
  assert.ok(!g.reroll());
  assert.ok(g.reward('reroll', 2));
  assert.ok(g.reward('star', 2));
  assert.ok(!g.reward('undo', 2), 'cap reached');
  assert.ok(!g.reward('coins', 5), 'only known items');
  assert.deepEqual(g.items, { undo: 1, reroll: 1, star: 2 });
});

test('a saved game resumes exactly where it was', () => {
  const g = Game.create(123);
  for (let n = 0; n < 30 && !g.stuck(); n++) {
    let done = false;
    for (let slot = 0; slot < 3 && !done; slot++) {
      for (let r = 0; r < SIZE && !done; r++) for (let c = 0; c < SIZE && !done; c++) done = Boolean(g.place(slot, r, c));
    }
  }
  const copy = new Game(JSON.parse(JSON.stringify(g)));
  assert.deepEqual(copy.toJSON(), g.toJSON());
  assert.equal(copy.rng.next(), g.rng.next());
});

test('a whole game always ends, and the score adds up', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const g = Game.create(seed);
    let total = 0, guard = 0;
    while (!g.stuck() && guard++ < 2000) {
      let r = null;
      for (let slot = 0; slot < 3 && !r; slot++) {
        for (let i = 0; i < SIZE * SIZE && !r; i++) r = g.place(slot, Math.floor(i / SIZE), i % SIZE);
      }
      total += r.gained;
    }
    assert.ok(guard < 2000, `seed ${seed} never ended`);
    assert.equal(g.score, total);
  }
});

test('ranking keeps the best ten and reports the new rank', () => {
  let list = [];
  for (let i = 1; i <= 10; i++) list = addScore(list, { s: i * 100, t: i }).list;
  const mid = addScore(list, { s: 550, t: 11 });
  assert.equal(mid.rank, 6);
  assert.equal(mid.list.length, 10);
  assert.equal(mid.list.at(-1).s, 200);
  assert.equal(addScore(mid.list, { s: 1, t: 12 }).rank, 0, 'outside the top ten');
  assert.equal(addScore([{ s: 500, t: 1 }], { s: 500, t: 2 }).rank, 2, 'earlier score wins a tie');
});
