// MOUTON BLOCKS — the rules, with no screen attached. puzzle.js draws the game;
// tests/puzzle-core.test.mjs checks these rules in Node.
//
// An 8×8 board. Three pieces are dealt at a time; place them anywhere they fit.
// A full row or column disappears. When none of the pieces fits, the game ends,
// unless an item (undo, new pieces, a shooting star that clears 3×3) helps.

export const SIZE = 8;
export const ITEMS = ['undo', 'reroll', 'star'];
const START_ITEMS = { undo: 1, reroll: 1, star: 1 };
// How often a new set of three is re-drawn so that at least one piece fits.
const DEAL_TRIES = 12;

// Piece families. "#" is a block, "." a gap, "/" a new row. Colour = palette
// index in puzzle.css (1 moon, 2 sky, 3 gold, 4 wool, 5 rose, 6 teal, 7 lilac).
const FAMILIES = [
  { color: 1, weight: 2, forms: ['#'] },
  { color: 2, weight: 3, forms: ['##', '#/#'] },
  { color: 2, weight: 3, forms: ['###', '#/#/#'] },
  { color: 2, weight: 2.5, forms: ['####', '#/#/#/#'] },
  { color: 2, weight: 1.5, forms: ['#####', '#/#/#/#/#'] },
  { color: 3, weight: 3, forms: ['##/##'] },
  { color: 3, weight: 1.5, forms: ['###/###', '##/##/##'] },
  { color: 3, weight: 1, forms: ['###/###/###'] },
  { color: 4, weight: 3, forms: ['#./##', '##/#.', '##/.#', '.#/##'] },
  { color: 4, weight: 2, forms: ['#./#./##', '###/#..', '##/.#/.#', '..#/###', '.#/.#/##', '#../###', '##/#./#.', '###/..#'] },
  { color: 5, weight: 1.5, forms: ['#../#../###', '###/#../#..', '###/..#/..#', '..#/..#/###'] },
  { color: 6, weight: 2, forms: ['###/.#.', '.#./###', '#./##/#.', '.#/##/.#'] },
  { color: 7, weight: 1.5, forms: ['.##/##.', '##./.##', '#./##/.#', '.#/##/#.'] },
];

function parse(form) {
  const rows = form.split('/');
  const cells = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
  return { cells, h: rows.length, w: Math.max(...rows.map(row => row.length)) };
}

// Every piece by its key "family-form", e.g. "5-0" is the 2×2 square.
export const PIECES = {};
FAMILIES.forEach((f, i) => f.forms.forEach((form, j) => {
  PIECES[`${i}-${j}`] = { key: `${i}-${j}`, color: f.color, ...parse(form) };
}));
const TOTAL_WEIGHT = FAMILIES.reduce((sum, f) => sum + f.weight, 0);

// Small, seedable random numbers (mulberry32), so a game can be replayed from its seed.
export class Rng {
  constructor(state) { this.state = state | 0; }
  next() {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function randomPiece(rng) {
  let x = rng.next() * TOTAL_WEIGHT;
  let i = 0;
  while (i < FAMILIES.length - 1 && x >= FAMILIES[i].weight) x -= FAMILIES[i++].weight;
  const j = Math.floor(rng.next() * FAMILIES[i].forms.length);
  return `${i}-${j}`;
}

export const at = (r, c) => r * SIZE + c;

export function fits(board, piece, r, c) {
  if (r < 0 || c < 0 || r + piece.h > SIZE || c + piece.w > SIZE) return false;
  return piece.cells.every(([dr, dc]) => board[at(r + dr, c + dc)] === 0);
}

export function fitsAnywhere(board, piece) {
  for (let r = 0; r + piece.h <= SIZE; r++) {
    for (let c = 0; c + piece.w <= SIZE; c++) if (fits(board, piece, r, c)) return true;
  }
  return false;
}

// Rows and columns that are completely filled.
export function fullLines(board) {
  const rows = [], cols = [];
  for (let i = 0; i < SIZE; i++) {
    let row = true, col = true;
    for (let j = 0; j < SIZE; j++) {
      if (!board[at(i, j)]) row = false;
      if (!board[at(j, i)]) col = false;
    }
    if (row) rows.push(i);
    if (col) cols.push(i);
  }
  return { rows, cols };
}

// Points for one placement: one per block, plus a bonus for lines that grows
// with the number of lines cleared at once (10, 30, 60, 100 …) and with the combo.
export function points(blocks, lines, combo, allClear = false) {
  if (!lines) return blocks;
  return blocks + 10 * (lines * (lines + 1) / 2) * combo + (allClear ? 300 : 0);
}

export class Game {
  constructor(saved) {
    const s = saved || {};
    this.seed = s.seed >>> 0;
    this.rng = new Rng(s.rng ?? this.seed);
    this.board = s.board ? [...s.board] : new Array(SIZE * SIZE).fill(0);
    this.tray = s.tray ? [...s.tray] : [null, null, null];
    this.score = s.score || 0;
    this.lines = s.lines || 0;
    this.combo = s.combo || 0;
    this.moves = s.moves || 0;
    this.items = { ...START_ITEMS, ...(s.items || {}) };
    this.adRewards = s.adRewards || 0;
    this.history = s.history || null;
    this.over = Boolean(s.over);
    if (!s.tray) this.deal();
  }

  static create(seed) { return new Game({ seed }); }

  toJSON() {
    return {
      v: 1, seed: this.seed, rng: this.rng.state, board: this.board, tray: this.tray,
      score: this.score, lines: this.lines, combo: this.combo, moves: this.moves,
      items: this.items, adRewards: this.adRewards, history: this.history, over: this.over,
    };
  }

  piece(slot) { return PIECES[this.tray[slot]] || null; }

  // Three new pieces. Re-drawn a few times if none of them would fit, so a game
  // rarely ends on a hopeless set; it still ends when the board is crowded.
  deal() {
    let tray;
    for (let i = 0; i < DEAL_TRIES; i++) {
      tray = [randomPiece(this.rng), randomPiece(this.rng), randomPiece(this.rng)];
      if (tray.some(k => fitsAnywhere(this.board, PIECES[k]))) break;
    }
    this.tray = tray;
  }

  canPlace(slot, r, c) {
    const piece = this.piece(slot);
    return Boolean(piece) && !this.over && fits(this.board, piece, r, c);
  }

  // No piece in the tray fits anywhere.
  stuck() {
    return !this.over && this.tray.every(k => !k || !fitsAnywhere(this.board, PIECES[k]));
  }

  canUse(item) {
    if (this.over || !(this.items[item] > 0)) return false;
    if (item === 'undo') return Boolean(this.history);
    if (item === 'star') return this.board.some(Boolean);
    return true;
  }

  snapshot() {
    return { board: [...this.board], tray: [...this.tray], score: this.score, lines: this.lines, combo: this.combo, moves: this.moves, rng: this.rng.state };
  }

  // Place the piece from a tray slot with its top-left block at (r, c).
  // Returns what happened (for the screen), or null if it does not fit.
  place(slot, r, c) {
    if (!this.canPlace(slot, r, c)) return null;
    const piece = this.piece(slot);
    this.history = this.snapshot();
    const placed = piece.cells.map(([dr, dc]) => at(r + dr, c + dc));
    for (const i of placed) this.board[i] = piece.color;
    const { rows, cols } = fullLines(this.board);
    const cleared = new Map();
    for (const row of rows) for (let j = 0; j < SIZE; j++) cleared.set(at(row, j), this.board[at(row, j)]);
    for (const col of cols) for (let j = 0; j < SIZE; j++) cleared.set(at(j, col), this.board[at(j, col)]);
    for (const i of cleared.keys()) this.board[i] = 0;
    const lines = rows.length + cols.length;
    this.combo = lines ? this.combo + 1 : 0;
    const allClear = lines > 0 && !this.board.some(Boolean);
    const gained = points(piece.cells.length, lines, this.combo, allClear);
    this.score += gained;
    this.lines += lines;
    this.moves += 1;
    this.tray[slot] = null;
    const dealt = this.tray.every(k => !k);
    if (dealt) this.deal();
    return { placed, color: piece.color, rows, cols, cleared: [...cleared], lines, combo: this.combo, gained, allClear, dealt };
  }

  // Take back the last placement (one step).
  undo() {
    if (!this.canUse('undo')) return false;
    const h = this.history;
    this.board = [...h.board];
    this.tray = [...h.tray];
    Object.assign(this, { score: h.score, lines: h.lines, combo: h.combo, moves: h.moves });
    this.rng.state = h.rng;
    this.history = null;
    this.items.undo -= 1;
    return true;
  }

  // Swap the whole tray for three new pieces.
  reroll() {
    if (!this.canUse('reroll')) return false;
    this.deal();
    this.history = null;
    this.items.reroll -= 1;
    return true;
  }

  // Shooting star: clear the 3×3 area around (r, c). No points for it.
  star(r, c) {
    if (!this.canUse('star')) return null;
    const cleared = [];
    for (let i = Math.max(0, r - 1); i <= Math.min(SIZE - 1, r + 1); i++) {
      for (let j = Math.max(0, c - 1); j <= Math.min(SIZE - 1, c + 1); j++) {
        if (this.board[at(i, j)]) { cleared.push([at(i, j), this.board[at(i, j)]]); this.board[at(i, j)] = 0; }
      }
    }
    if (!cleared.length) return null;
    this.history = null;
    this.items.star -= 1;
    return { cleared };
  }

  // A reward for watching an ad: one more of an item.
  reward(item, cap) {
    if (this.over || !ITEMS.includes(item) || this.adRewards >= cap) return false;
    this.items[item] += 1;
    this.adRewards += 1;
    return true;
  }

  end() { this.over = true; this.history = null; }
}

// The device-only ranking: best ten scores, highest first (ties: earlier first).
export function addScore(list, entry, keep = 10) {
  const all = [...(list || []), entry].sort((a, b) => b.s - a.s || a.t - b.t);
  const top = all.slice(0, keep);
  const i = top.indexOf(entry);
  return { list: top, rank: i < 0 ? 0 : i + 1 };
}
