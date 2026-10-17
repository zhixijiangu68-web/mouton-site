// MOUTON・LEAP rules. No screen code here, so a whole run can be played in
// Node (tests/leap-core.test.mjs).
//
// The sheep runs "up" a three-lane meadow. Things come towards it along z
// (z = 0 is the sheep). Lanes are -1, 0, 1. Swipe sideways to change lane,
// tap to jump. A rock has to be dodged; a fence can be jumped (or dodged).
//
// Fairness is built into the generator: every row keeps a `path` lane that
// is free of rocks, and the path never moves more than one lane from one
// row to the next, with enough time between rows to get there.

export const STEP = 1 / 120;          // fixed step; the screen loop feeds this many
export const SPAWN_Z = 70;            // rows appear this far ahead
export const FIRST_Z = 46;            // the first row of a run starts closer
export const LANES = [-1, 0, 1];

export const JUMP_TIME = 0.56;        // seconds in the air
export const JUMP_PEAK = 1;           // height at the top (the screen scales it)
export const CLEAR_H = 0.4;           // above this a fence passes underneath
const HIT_Z = 0.5;                    // half the depth a thing occupies at the sheep
const HIT_X = 0.6;                    // how close in lane to touch a rock or fence
const STAR_Z = 0.8;
const STAR_X = 0.7;
const LANE_SPEED = 9;                 // lanes per second while changing lane
const BUFFER = 0.14;                  // a tap this soon before landing still jumps
export const STAR_POINTS = 10;

export function rng(seed) {           // mulberry32: small, fast, repeatable
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// How far into the run we are, 0 to 1. Rows get denser and rockier with it.
export const level = dist => Math.min(1, dist / 2200);
// World units per second: 12 at the start, settling towards 28.
export const speedAt = dist => 12 + 16 * (1 - Math.exp(-dist / 1400));

// kind: what a row is made of. hard = has rocks. jumpy = needs a jump.
// Weights move from w0 (start) to w1 (level 1); a kind is not used before `from`.
const KINDS = [
  { kind: 'empty',     from: 0,    w0: 2, w1: 0.6, hard: false, jumpy: false },
  { kind: 'fenceAll',  from: 0,    w0: 3, w1: 2,   hard: false, jumpy: true },
  { kind: 'fenceSome', from: 0,    w0: 2, w1: 2,   hard: false, jumpy: false },
  { kind: 'rock1',     from: 0,    w0: 3, w1: 2,   hard: true,  jumpy: false },
  { kind: 'rock2',     from: 0.12, w0: 1, w1: 3,   hard: true,  jumpy: false },
  { kind: 'mix',       from: 0.3,  w0: 1, w1: 2.5, hard: true,  jumpy: true },
];
const KIND = Object.fromEntries(KINDS.map(k => [k.kind, k]));

// Every run starts the same way, so the first fence teaches the jump and the
// first rock teaches the swipe.
export const INTRO = ['fenceAll', 'rock1', 'rock1', 'fenceAll', 'empty'];

function pickKind(r, L, prev) {
  const ws = KINDS.map(k => (L < k.from || (k.kind === 'empty' && prev === 'empty')) ? 0 : lerp(k.w0, k.w1, L));
  let x = r() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < KINDS.length; i++) { x -= ws[i]; if (x < 0) return KINDS[i].kind; }
  return 'rock1';
}

// Seconds to give between a row and the next one. Rows that need a jump
// leave time to land, and harder rows leave a little more to line up.
export function gapTime(r, L, kind, nextKind, intro) {
  const base = intro ? 1.5 : lerp(1.25, 0.8, L) * (0.9 + 0.3 * r());
  let g = base;
  if (KIND[kind].jumpy && (KIND[nextKind].hard || KIND[nextKind].jumpy)) g += 0.2;
  if (nextKind === 'rock2' || nextKind === 'mix') g += 0.1;
  return Math.max(g, 0.8);
}

function shuffled(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// One row: which lane is the safe path, and what stands in the other lanes.
// Returns { path, things } where each thing is { type, lane }.
export function makeRow(kind, r, prevPath, L = 0) {
  const near = LANES.filter(l => Math.abs(l - prevPath) <= 1);
  const path = near[Math.floor(r() * near.length)];
  const others = LANES.filter(l => l !== path);
  const fence = lane => ({ type: 'fence', lane });
  const rock = lane => ({ type: 'rock', lane });
  let things = [];
  switch (kind) {
    case 'fenceAll': things = LANES.map(fence); break;
    case 'fenceSome': things = shuffled(LANES, r).slice(0, r() < 0.5 ? 1 : 2).map(fence); break;
    case 'rock1': things = [rock(others[Math.floor(r() * others.length)])]; break;
    case 'rock2': things = others.map(rock); break;
    case 'mix': {
      const n = r() < 0.4 + 0.4 * L ? 2 : 1;
      things = [fence(path), ...shuffled(others, r).slice(0, n).map(rock)];
      break;
    }
    default: break;
  }
  return { path, things };
}

export class Run {
  constructor(seed = (Math.random() * 2 ** 32) >>> 0) {
    this.seed = seed;
    this.r = rng(seed);
    this.t = 0;
    this.dist = 0;
    this.speed = speedAt(0);
    this.x = 0;               // lane position, -1 to 1 (smooth while changing lane)
    this.target = 0;          // lane being moved to
    this.jumpT = -1;          // seconds since take-off; -1 on the ground
    this.height = 0;
    this.buffer = 0;
    this.things = [];
    this.stars = 0;
    this.fences = 0;          // fences jumped
    this.over = false;
    this.cause = null;        // 'rock' | 'fence'
    this.events = [];         // { type } for sound and effects; the screen drains it
    this.intro = INTRO.slice();
    this.path = 0;
    this.rows = 0;
    this.kind = null;         // the kind of the row spawned last
    this.lastZ = 0;           // where the newest row is now
    this.nextIn = 0;          // how far beyond the newest row the next one goes
    this.nextKind = this.intro.shift();
    this.spawn(FIRST_Z);
  }

  get score() { return Math.floor(this.dist) + this.stars * STAR_POINTS; }
  get airborne() { return this.jumpT >= 0; }

  swipe(dir) {
    if (this.over) return false;
    const t = clamp(this.target + Math.sign(dir), -1, 1);
    if (t === this.target) return false;
    this.target = t;
    this.events.push({ type: 'lane', dir: Math.sign(dir) });
    return true;
  }

  jump() {
    if (this.over) return false;
    if (this.airborne) { this.buffer = BUFFER; return false; }
    this.jumpT = 0;
    this.events.push({ type: 'jump' });
    return true;
  }

  // Put the next row at z. Rows sit exactly `nextIn` apart.
  spawn(z) {
    const L = level(this.dist);
    const kind = this.nextKind;
    const row = makeRow(kind, this.r, this.path, L);
    this.rows++;
    // A trail of stars halfway between the last row and this one, on the safe path.
    if (this.rows > 1 && this.r() < 0.55) {
      const mid = z - this.nextIn / 2;
      for (const dz of [-2.2, 0, 2.2]) this.things.push({ type: 'star', lane: row.path, z: mid + dz });
    }
    for (const th of row.things) this.things.push({ ...th, z, path: row.path, row: this.rows, kind });
    this.path = row.path;
    this.kind = kind;
    const wasIntro = this.intro.length > 0;
    this.nextKind = wasIntro ? this.intro.shift() : pickKind(this.r, L, kind);
    this.nextIn = this.speed * gapTime(this.r, L, kind, this.nextKind, wasIntro);
    this.lastZ = z;
  }

  die(cause) {
    this.over = true;
    this.cause = cause;
    this.events.push({ type: 'hit', cause });
  }

  step(dt = STEP) {
    if (this.over) return;
    this.t += dt;
    this.speed = speedAt(this.dist);
    const dz = this.speed * dt;
    this.dist += dz;

    const d = this.target - this.x;
    const m = LANE_SPEED * dt;
    this.x = Math.abs(d) <= m ? this.target : this.x + Math.sign(d) * m;

    if (this.airborne) {
      this.jumpT += dt;
      if (this.jumpT >= JUMP_TIME) {
        this.jumpT = -1;
        this.height = 0;
        this.events.push({ type: 'land' });
        if (this.buffer > 0) this.jump();
      } else {
        const u = this.jumpT / JUMP_TIME;
        this.height = 4 * JUMP_PEAK * u * (1 - u);
      }
    }
    if (this.buffer > 0) this.buffer = Math.max(0, this.buffer - dt);

    for (const th of this.things) th.z -= dz;
    this.lastZ -= dz;
    while (this.lastZ + this.nextIn <= SPAWN_Z) this.spawn(this.lastZ + this.nextIn);

    for (const th of this.things) {
      if (th.gone) continue;
      const dx = Math.abs(th.lane - this.x);
      if (th.type === 'star') {
        if (Math.abs(th.z) < STAR_Z && dx < STAR_X) {
          th.gone = true;
          this.stars++;
          this.events.push({ type: 'star' });
        }
      } else if (Math.abs(th.z) < HIT_Z && dx < HIT_X) {
        if (th.type === 'rock' || this.height < CLEAR_H) { this.die(th.type); return; }
        th.cleared = true;
      } else if (th.cleared && th.z < -HIT_Z) {
        th.cleared = false;
        th.gone = true;
        this.fences++;
        this.events.push({ type: 'fence' });
      }
    }
    this.things = this.things.filter(th => !th.gone && th.z > -4);
  }

  // Run for `seconds`; returns the events that happened.
  advance(seconds) {
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n && !this.over; i++) this.step(STEP);
    return this.drain();
  }

  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }
}
