// Quests: fifteen nights, each with one goal and a limited number of flocks.
// Every quest has its own seed, so everyone gets the same flocks in the same
// order. Rules only; tests/quest.test.mjs checks them and lets a simple bot
// play every quest to prove it can be cleared.
import { Game, COLS, ROWS, BLACK } from './core.js';

// What a goal counts, in the player's words.
export const GOALS = {
  rows: { label: 'そろえた列', text: n => `横の列を${n}回そろえる`, unit: '列' },
  count: { label: '数えた羊', text: n => `羊を${n}匹数える`, unit: '匹' },
  blacks: { label: '帰した黒い羊', text: n => `黒い羊を${n}匹帰す`, unit: '匹' },
  chain: { label: 'れんさ', text: n => `${n}れんさを起こす`, unit: 'れんさ' },
  // The story's long, calm nights: put flocks down without the field overflowing.
  place: { label: '置いた群れ', text: n => `あふれずに、群れを${n}個置く`, unit: '個' },
};

// board: rows of the field from the top of the preset down to the ground.
// "w" a white sheep, "b" a black sheep, "." empty.
// limit: flocks you may put down. stars: flocks left over for ★★ and ★★★.
// black: the chance that a falling flock carries a black sheep.
export const QUESTS = [
  { name: 'はじめての1列', goal: 'rows', target: 1, limit: 5, stars: [2, 3], seed: 101, black: 0,
    board: ['www..www'] },
  { name: '2列いっしょに', goal: 'rows', target: 2, limit: 8, stars: [3, 4], seed: 102, black: 0,
    board: ['ww.wwwww', 'ww.wwwww'] },
  { name: '数えはじめ', goal: 'count', target: 20, limit: 12, stars: [3, 4], seed: 103, black: 0,
    board: [] },
  { name: '黒い羊', goal: 'blacks', target: 1, limit: 6, stars: [3, 4], seed: 104, black: 0,
    board: ['.wbw....'] },
  { name: 'はじめてのれんさ', goal: 'chain', target: 2, limit: 8, stars: [4, 6], seed: 105, black: 0,
    board: ['.ww.wwww', 'bww.wwww'] },
  { name: '30匹の夜', goal: 'count', target: 30, limit: 16, stars: [3, 6], seed: 106, black: 0,
    board: ['w......w'] },
  { name: '2匹の黒い羊', goal: 'blacks', target: 2, limit: 10, stars: [5, 7], seed: 107, black: 0,
    board: ['wbw..wbw'] },
  { name: '4列の夜', goal: 'rows', target: 4, limit: 13, stars: [3, 4], seed: 108, black: 0,
    board: ['w.w..ww.', 'ww.ww.ww'] },
  { name: 'まじる黒', goal: 'count', target: 50, limit: 22, stars: [3, 5], seed: 109, black: 0.15,
    board: [] },
  { name: '高い牧場', goal: 'rows', target: 3, limit: 10, stars: [3, 6], seed: 110, black: 0,
    board: ['..wwwwww', 'w..wwwww', 'ww..wwww', 'www..www', 'wwww..ww', 'wwwww..w', 'wwwwww..'] },
  { name: '3匹の黒い羊', goal: 'blacks', target: 3, limit: 12, stars: [4, 7], seed: 111, black: 0.1,
    board: ['b......b', 'w.b..b.w'] },
  { name: '60匹の夜', goal: 'count', target: 60, limit: 26, stars: [4, 7], seed: 112, black: 0.2,
    board: [] },
  { name: '6列の夜', goal: 'rows', target: 6, limit: 18, stars: [3, 5], seed: 113, black: 0.2,
    board: ['ww.ww.ww'] },
  { name: '黒い羊の群れ', goal: 'blacks', target: 4, limit: 22, stars: [6, 10], seed: 114, black: 0.3,
    board: ['wbw..wbw'] },
  { name: '朝まで', goal: 'count', target: 160, limit: 60, stars: [8, 24], seed: 115, black: 0.22,
    board: [] },
].map((q, i) => ({ ...q, id: i + 1, wool: 10 + i * 4 }));

export const questById = id => QUESTS.find(q => q.id === id) || null;

// A new game set up for a quest.
export function questGame(q) {
  const board = new Array(ROWS * COLS).fill(0);
  q.board.forEach((line, k) => {
    const r = ROWS - q.board.length + k;
    [...line].forEach((ch, c) => {
      if (ch === 'w') board[r * COLS + c] = 1 + ((r + c * 3) % 4);
      else if (ch === 'b') board[r * COLS + c] = BLACK;
    });
  });
  return new Game({ seed: q.seed, board, blackFrom: 0, blackChance: q.black, quest: q.id });
}

export function progress(q, game) {
  const value = { rows: game.rows, count: game.count, blacks: game.blacks, chain: game.best, place: game.placed }[q.goal];
  return { value, target: q.target, done: value >= q.target };
}

// extra: flocks added by watching an ad after running out.
export const flocksLeft = (q, game, extra = 0) => q.limit + extra - game.placed;

// How the quest ended, if it has: cleared (with stars), failed, or still going.
export function outcome(q, game, extra = 0) {
  const left = flocksLeft(q, game, extra);
  if (progress(q, game).done) {
    const stars = 1 + (extra === 0 && left >= q.stars[0] ? 1 : 0) + (extra === 0 && left >= q.stars[1] ? 1 : 0);
    return { state: 'clear', stars, left };
  }
  if (game.over || left <= 0) return { state: 'fail', left };
  return { state: 'play', left };
}

// Saved results: { [id]: best stars }. Each star earned for the first time
// gives the quest's wool.
export function record(results, q, stars) {
  const before = results[q.id] || 0;
  const after = Math.max(before, stars);
  return { results: { ...results, [q.id]: after }, wool: (after - before) * q.wool, isNew: after > before };
}

export const unlocked = (results, q) => q.id === 1 || (results[q.id - 1] || 0) > 0;
