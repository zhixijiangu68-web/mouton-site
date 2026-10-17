// MOUTON・COUNT — the rules, with no screen attached. main.js draws and
// controls the game; tests/core.test.mjs checks these rules in Node.
//
// Flocks of sheep fall into an 8×14 field. Move and turn them as they fall.
// When a row is full, its white sheep jump the fence and are counted. A black
// sheep stays in its row; it leaves only when white sheep surround it on every
// side (the walls and the ground count as fence). After sheep leave, the sheep
// above them drop into the gaps, which can fill more rows (a chain).

export const COLS = 8;
export const ROWS = 14;
export const BLACK = 9;
export const GOLD = 8;          // a golden sheep: jumps like a white one, counts as three
export const ITEMS = ['dog', 'swap', 'slow', 'whistle'];
export const isWhite = v => (v >= 1 && v <= 4) || v === GOLD;
const START_ITEMS = { dog: 1, swap: 1, slow: 1, whistle: 1 };
const BLACK_BONUS = 5;          // a black sheep that leaves counts as five
const GOLD_BONUS = 3;           // a golden sheep counts as three
const GOLD_CHANCE = 0.05;       // free play: the share of flocks with one golden sheep
const PERFECT_BONUS = 50;       // the field emptied completely
// Clearing with flock after flock: ×1, ×1.5, ×2, ×2.5, then ×3 at most.
export const streakMult = n => Math.min(3, 1 + Math.max(0, n - 1) * 0.5);
const BLACK_FROM = 12;          // no black sheep until this many are counted
const BLACK_CHANCE = 0.22;      // after that, the share of flocks with one black sheep
export const DAWN = 160;        // 22:00 to 6:00, three minutes per sheep

// Flock shapes. None of them is a four-in-a-row piece set; sizes 2 to 5.
const FLOCKS = [
  { weight: 3, cells: [[0, 0], [0, 1]] },
  { weight: 3, cells: [[0, 0], [0, 1], [0, 2]] },
  { weight: 3, cells: [[0, 0], [1, 0], [1, 1]] },
  { weight: 2, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { weight: 1.5, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { weight: 1, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
];
const TOTAL = FLOCKS.reduce((s, f) => s + f.weight, 0);

// Seedable random numbers (mulberry32), so a night can be replayed from its seed.
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

const at = (r, c) => r * COLS + c;
const size = cells => ({ h: Math.max(...cells.map(x => x.r)) + 1, w: Math.max(...cells.map(x => x.c)) + 1 });

// Turn a flock a quarter clockwise, keeping it in the top-left corner of its box.
export function turn(cells) {
  const { h } = size(cells);
  return cells.map(x => ({ r: x.c, c: h - 1 - x.r, v: x.v }));
}

// The clock: 22:00 at the start, three minutes later for every sheep counted.
export function clock(count) {
  const m = (22 * 60 + count * 3) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// How long a flock waits before falling one row, in milliseconds.
export const fallDelay = count => Math.max(110, Math.round(850 * 0.87 ** Math.floor(count / 20)));

export class Game {
  constructor(saved = {}) {
    this.seed = saved.seed >>> 0;
    this.rng = new Rng(saved.rng ?? this.seed);
    this.board = saved.board ? [...saved.board] : new Array(ROWS * COLS).fill(0);
    this.count = saved.count || 0;
    this.rows = saved.rows || 0;
    this.blacks = saved.blacks || 0;
    this.best = saved.bestChain || 0;
    this.items = { ...START_ITEMS, ...(saved.items || {}) };
    this.adRewards = saved.adRewards || 0;
    this.over = Boolean(saved.over);
    this.placed = saved.placed || 0;              // flocks put down so far
    this.blackFrom = saved.blackFrom ?? BLACK_FROM;
    this.blackChance = saved.blackChance ?? BLACK_CHANCE;
    this.quest = saved.quest ?? null;             // quest number, or null in free play
    this.goldChance = saved.goldChance ?? 0;
    this.streak = saved.streak || 0;              // flocks in a row that cleared something
    this.bestStreak = saved.bestStreak || 0;
    this.golds = saved.golds || 0;
    this.moons = saved.moons || 0;
    this.perfects = saved.perfects || 0;
    this.starClears = saved.starClears || 0;
    this.boost = 1;                               // set by the screen during a shooting star
    this.queue = saved.queue ? saved.queue.map(q => q.map(x => ({ ...x }))) : [this.flock(), this.flock()];
    if (saved.piece) this.piece = { ...saved.piece, cells: saved.piece.cells.map(x => ({ ...x })) };
    else this.spawn();
  }

  // Free play: golden sheep appear. Quests keep them out so their flocks stay as designed.
  static create(seed) { return new Game({ seed, goldChance: GOLD_CHANCE }); }

  toJSON() {
    return {
      v: 1, seed: this.seed, rng: this.rng.state, board: this.board, count: this.count, rows: this.rows,
      blacks: this.blacks, bestChain: this.best, items: this.items, adRewards: this.adRewards, over: this.over,
      queue: this.queue, piece: this.piece, placed: this.placed,
      blackFrom: this.blackFrom, blackChance: this.blackChance, quest: this.quest, goldChance: this.goldChance,
      streak: this.streak, bestStreak: this.bestStreak, golds: this.golds, moons: this.moons,
      perfects: this.perfects, starClears: this.starClears,
    };
  }

  // A new flock: a random shape, a random wool tint, sometimes one black sheep.
  flock() {
    let x = this.rng.next() * TOTAL;
    let i = 0;
    while (i < FLOCKS.length - 1 && x >= FLOCKS[i].weight) x -= FLOCKS[i++].weight;
    const tint = 1 + Math.floor(this.rng.next() * 4);
    let cells = FLOCKS[i].cells.map(([r, c]) => ({ r, c, v: tint }));
    for (let n = Math.floor(this.rng.next() * 4); n > 0; n--) cells = turn(cells);
    if (this.count >= this.blackFrom && cells.length >= 3 && this.rng.next() < this.blackChance) {
      cells[Math.floor(this.rng.next() * cells.length)].v = BLACK;
    }
    // Only free play draws for golden sheep, so quest flocks never change.
    if (this.goldChance > 0 && this.rng.next() < this.goldChance) {
      const whites = cells.filter(x => x.v !== BLACK);
      if (whites.length) whites[Math.floor(this.rng.next() * whites.length)].v = GOLD;
    }
    return cells;
  }

  fits(cells, row, col) {
    return cells.every(x => {
      const r = row + x.r, c = col + x.c;
      return r >= 0 && r < ROWS && c >= 0 && c < COLS && !this.board[at(r, c)];
    });
  }

  // The next flock enters at the top, centred. If it cannot, the night is over.
  spawn() {
    const cells = this.queue.shift();
    this.queue.push(this.flock());
    const { w } = size(cells);
    this.piece = { cells, row: 0, col: Math.floor((COLS - w) / 2) };
    if (!this.fits(cells, 0, this.piece.col)) this.over = true;
  }

  move(dc) {
    const p = this.piece;
    if (this.over || !this.fits(p.cells, p.row, p.col + dc)) return false;
    p.col += dc;
    return true;
  }

  // Turn clockwise; if the turned flock hits something, try a small nudge.
  rotate() {
    if (this.over) return false;
    const p = this.piece;
    const cells = turn(p.cells);
    for (const [dr, dc] of [[0, 0], [0, -1], [0, 1], [0, -2], [0, 2], [-1, 0]]) {
      if (this.fits(cells, p.row + dr, p.col + dc)) {
        Object.assign(p, { cells, row: p.row + dr, col: p.col + dc });
        return true;
      }
    }
    return false;
  }

  canFall() { const p = this.piece; return !this.over && this.fits(p.cells, p.row + 1, p.col); }

  fall() {
    if (!this.canFall()) return false;
    this.piece.row += 1;
    return true;
  }

  // The row the flock would land on (for the shadow).
  landingRow() {
    const p = this.piece;
    let r = p.row;
    while (this.fits(p.cells, r + 1, p.col)) r++;
    return r;
  }

  // Put the flock down, count the sheep that leave, then bring in the next flock.
  lock() {
    if (this.over) return null;
    const p = this.piece;
    const placed = p.cells.map(x => at(p.row + x.r, p.col + x.c));
    p.cells.forEach((x, i) => { this.board[placed[i]] = x.v; });
    this.placed += 1;
    const steps = this.resolve();
    // Clearing again right after the last flock cleared grows the multiplier;
    // a flock that clears nothing ends the run. A shooting star doubles it.
    let bonus = null;
    if (steps.length) {
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      const base = steps.reduce((sum, st) => sum + st.gained, 0);
      const mult = streakMult(this.streak) * this.boost;
      const extra = Math.round(base * mult) - base;
      const perfect = !this.board.some(Boolean);
      if (perfect) this.perfects += 1;
      if (this.boost > 1) this.starClears += 1;
      this.count += extra + (perfect ? PERFECT_BONUS : 0);
      bonus = { streak: this.streak, mult, base, extra, perfect, perfectBonus: perfect ? PERFECT_BONUS : 0 };
    } else {
      this.streak = 0;
    }
    this.spawn();
    return { placed, steps, over: this.over, bonus };
  }

  drop() {
    while (this.fall());
    return this.lock();
  }

  // Full rows and surrounded black sheep leave, again and again until nothing does.
  resolve(first = null) {
    const steps = [];
    let chain = 0;
    let removed = first;
    for (;;) {
      if (!removed) {
        const full = [];
        for (let r = 0; r < ROWS; r++) {
          let ok = true;
          for (let c = 0; c < COLS; c++) if (!this.board[at(r, c)]) ok = false;
          if (ok) full.push(r);
        }
        const jumped = [];
        for (const r of full) for (let c = 0; c < COLS; c++) if (isWhite(this.board[at(r, c)])) jumped.push(at(r, c));
        const freed = [];
        for (let i = 0; i < this.board.length; i++) if (this.board[i] === BLACK && this.surrounded(i)) freed.push(i);
        if (!jumped.length && !freed.length) break;
        removed = { rows: full, jumped, freed };
      }
      chain += 1;
      const rowsBonus = Math.max(1, removed.rows.length);
      const golds = removed.jumped.filter(i => this.board[i] === GOLD).length;
      const gained = (removed.jumped.length + golds * (GOLD_BONUS - 1) + removed.freed.length * BLACK_BONUS) * chain * rowsBonus;
      // A big moment: three rows at once, or a chain of three or more.
      const moon = removed.rows.length >= 3 || chain >= 3;
      this.golds += golds;
      if (moon) this.moons += 1;
      const sheep = [...removed.jumped, ...removed.freed].map(i => ({ i, v: this.board[i] }));
      this.count += gained;
      this.rows += removed.rows.length;
      this.blacks += removed.freed.length;
      this.best = Math.max(this.best, chain);
      const moves = this.settle(new Set([...removed.jumped, ...removed.freed]));
      steps.push({ ...removed, sheep, gained, chain, rowsBonus, moves, golds, moon });
      removed = null;
    }
    return steps;
  }

  // Every in-field neighbour is a white sheep; walls and ground count as fence.
  surrounded(i) {
    const r = Math.floor(i / COLS), c = i % COLS;
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].every(([y, x]) =>
      y < 0 || y >= ROWS || x < 0 || x >= COLS || isWhite(this.board[at(y, x)]));
  }

  // Take the leaving sheep out; whatever is above them in the same column
  // drops by that many rows. Gaps that were already there stay.
  // Returns the sheep that moved as [from, to] cell numbers (for the screen
  // to show them dropping).
  settle(gone) {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
      const col = [];
      for (let r = ROWS - 1; r >= 0; r--) if (!gone.has(at(r, c))) col.push([this.board[at(r, c)], r]);
      while (col.length < ROWS) col.push([0, -1]);
      for (let r = ROWS - 1, k = 0; r >= 0; r--, k++) {
        const [v, from] = col[k];
        this.board[at(r, c)] = v;
        if (v && from !== r) moves.push([at(from, c), at(r, c)]);
      }
    }
    return moves;
  }

  canUse(item) {
    if (this.over || !(this.items[item] > 0)) return false;
    if (item === 'dog') return this.board.slice(at(ROWS - 1, 0)).some(Boolean);
    if (item === 'whistle') return this.board.includes(BLACK);
    return true;
  }

  // Sheepdog: every sheep in the bottom row jumps, black ones too.
  dog() {
    if (!this.canUse('dog')) return null;
    this.items.dog -= 1;
    const bottom = [];
    for (let c = 0; c < COLS; c++) if (this.board[at(ROWS - 1, c)]) bottom.push(at(ROWS - 1, c));
    const jumped = bottom.filter(i => isWhite(this.board[i]));
    const freed = bottom.filter(i => this.board[i] === BLACK);
    return this.resolve({ rows: [], jumped, freed });
  }

  // Shepherd's whistle: the black sheep the player picks walks off the field.
  // It is not counted (only a surrounded one is), but the sheep above it drop
  // into its place, which can fill rows. The first step returned is the walk-off
  // (whistle: true, nothing gained); the rest are whatever leaves after it.
  whistle(i) {
    if (!this.canUse('whistle') || this.board[i] !== BLACK) return null;
    this.items.whistle -= 1;
    const sheep = [{ i, v: BLACK }];
    const moves = this.settle(new Set([i]));
    const away = { rows: [], jumped: [], freed: [], sheep, gained: 0, chain: 0, rowsBonus: 1, moves, golds: 0, moon: false, whistle: true };
    return [away, ...this.resolve()];
  }

  // Swap the falling flock for the next one (it starts again from the top).
  swap() {
    if (!this.canUse('swap')) return false;
    const next = this.queue[0];
    const { w } = size(next);
    const col = Math.min(Math.max(this.piece.col, 0), COLS - w);
    if (!this.fits(next, 0, col)) return false;
    this.queue[0] = this.piece.cells;
    this.piece = { cells: next, row: 0, col };
    this.items.swap -= 1;
    return true;
  }

  // Slow night: the screen slows the fall for a while; the rules only count the use.
  slow() {
    if (!this.canUse('slow')) return false;
    this.items.slow -= 1;
    return true;
  }

  reward(item, cap) {
    if (this.over || !ITEMS.includes(item) || this.adRewards >= cap) return false;
    this.items[item] += 1;
    this.adRewards += 1;
    return true;
  }
}

// The device ranking: best ten, highest first (ties: earlier first).
export function addScore(list, entry, keep = 10) {
  const all = [...(list || []), entry].sort((a, b) => b.s - a.s || a.t - b.t);
  const top = all.slice(0, keep);
  const i = top.indexOf(entry);
  return { list: top, rank: i < 0 ? 0 : i + 1 };
}

// How tall the pile is: rows from the ground to the highest sheep.
export function height(board) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[at(r, c)]) return ROWS - r;
  return 0;
}

// Which music fits the night now. The pinch starts when the pile is ten rows
// high and ends only below eight, so the music does not flicker back and forth.
export const PINCH_ON = 10;
export const PINCH_OFF = 8;
export function moodFor(prev, count, h) {
  if (h >= PINCH_ON || (prev === 'pinch' && h >= PINCH_OFF)) return 'pinch';
  if (count >= DAWN) return 'asa';
  if (count >= 60) return 'shinya';
  return 'yoru';
}
