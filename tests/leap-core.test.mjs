// MOUTON・LEAP rules (leap/game/core.js). The point of these tests is
// fairness: whatever the dice give, a player who reads the track can always
// get through, and the track never asks for the impossible.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  Run, rng, makeRow, gapTime, speedAt, level, STEP, JUMP_TIME, CLEAR_H, SPAWN_Z, INTRO, LANES,
} from '../leap/game/core.js';

const KINDS = ['empty', 'fenceAll', 'fenceSome', 'rock1', 'rock2', 'mix'];

// A player who reads the track: sits on the safe path of the next rock row,
// holds still while a row is arriving, and jumps for a fence in its lane.
// Human limits are respected: a jump takes JUMP_TIME, a lane change takes time.
function bot(run) {
  const rows = new Map();
  for (const t of run.things) {
    if (t.type === 'star' || t.z <= -0.7) continue;
    if (!rows.has(t.row)) rows.set(t.row, []);
    rows.get(t.row).push(t);
  }
  const ahead = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
  const arriving = ahead.length && ahead[0][0].z < run.speed * 0.4;
  if (!arriving) {
    const next = ahead.find(row => row.some(t => t.type === 'rock'));
    if (next) {
      const want = next[0].path;
      while (run.target < want) run.swipe(1);
      while (run.target > want) run.swipe(-1);
    }
  }
  for (const th of run.things) {
    if (th.type !== 'fence' || th.z < 0 || th.z > run.speed * 0.3) continue;
    if (Math.abs(th.lane - run.x) < 0.7 && !run.airborne) run.jump();
  }
}

test('the same seed gives the same run', () => {
  const a = new Run(7), b = new Run(7), c = new Run(8);
  for (const run of [a, b, c]) { run.advance(2); }
  assert.deepEqual(a.things, b.things);
  assert.notDeepEqual(a.things, c.things);
});

test('the generator keeps a free path that moves one lane at a time', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = rng(seed);
    let path = 0;
    for (let i = 0; i < 200; i++) {
      for (const kind of KINDS) {
        const row = makeRow(kind, r, path, r());
        assert(Math.abs(row.path - path) <= 1, `${kind}: path jumped ${path} -> ${row.path}`);
        assert(LANES.includes(row.path));
        assert(!row.things.some(t => t.type === 'rock' && t.lane === row.path), `${kind}: rock on the path`);
        if (row.things.some(t => t.type === 'rock')) {
          assert(row.things.filter(t => t.type === 'rock').length <= 2, 'at most two rocks in a row');
        }
        if (kind === 'mix') assert(row.things.some(t => t.type === 'fence' && t.lane === row.path), 'mix: jump on the path');
        path = row.path;
      }
    }
  }
});

test('rows are always far enough apart in time', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = rng(seed);
    for (let i = 0; i < 300; i++) {
      const L = r();
      const a = KINDS[Math.floor(r() * KINDS.length)];
      const b = KINDS[Math.floor(r() * KINDS.length)];
      assert(gapTime(r, L, a, b, false) >= 0.8, 'gap is at least 0.8 s');
    }
  }
  // After a jump there is time to land: longer than the jump itself.
  const r = rng(1);
  assert(gapTime(r, 1, 'fenceAll', 'rock2', false) > JUMP_TIME + 0.2);
});

test('a player who reads the track never gets hit', () => {
  for (let seed = 1; seed <= 120; seed++) {
    const run = new Run(seed);
    const seconds = 240;
    for (let i = 0; i < seconds / STEP && !run.over; i++) {
      bot(run);
      run.step(STEP);
    }
    assert(!run.over, `seed ${seed}: hit a ${run.cause} at ${run.t.toFixed(1)} s, ${run.dist.toFixed(0)} m`);
    assert(run.fences > 20, `seed ${seed}: only ${run.fences} fences in ${seconds} s`);
  }
});

test('in real play, rows reach the sheep far enough apart', () => {
  // Time between one row passing the sheep and the next, measured while a
  // careful player runs for four minutes. Speed keeps rising a little after a
  // row appears, so allow a sliver below the 0.8 s the generator promises.
  const jumpy = new Set(['fenceAll', 'mix']);
  const worst = { any: Infinity, afterJump: Infinity };
  for (let seed = 1; seed <= 30; seed++) {
    const run = new Run(seed);
    const passed = new Map();     // row -> { t, kind }
    for (let i = 0; i < 240 / STEP && !run.over; i++) {
      bot(run);
      run.step(STEP);
      for (const th of run.things) {
        if (th.type !== 'star' && th.z <= 0 && !passed.has(th.row)) passed.set(th.row, { t: run.t, kind: th.kind });
      }
    }
    assert(!run.over);
    const rows = [...passed.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i].t - rows[i - 1].t;
      worst.any = Math.min(worst.any, gap);
      if (jumpy.has(rows[i - 1].kind)) worst.afterJump = Math.min(worst.afterJump, gap);
    }
  }
  assert(worst.any >= 0.75, `closest two rows were ${worst.any.toFixed(2)} s apart`);
  assert(worst.afterJump >= 0.78, `after a jump the next row came ${worst.afterJump.toFixed(2)} s later`);
});

test('standing still in the middle ends the run', () => {
  const run = new Run(3);
  run.advance(60);
  assert(run.over);
  assert(run.cause === 'fence' || run.cause === 'rock');
});

test('the run starts with the teaching rows, then varies', () => {
  const run = new Run(5);
  const seen = [];
  // Collect the kinds in order as they spawn, via the row counter.
  let rows = run.rows;
  seen.push(run.kind);
  for (let i = 0; i < 60 / STEP && seen.length < INTRO.length + 3; i++) {
    run.over = false; // look at the track only
    run.step(STEP);
    if (run.rows !== rows) { rows = run.rows; seen.push(run.kind); }
  }
  assert.deepEqual(seen.slice(0, INTRO.length), INTRO);
});

test('rows appear at the horizon, never closer', () => {
  const run = new Run(11);
  const zs = [];
  for (let i = 0; i < 20 / STEP; i++) {
    run.over = false;
    run.step(STEP);
    for (const th of run.things) if (th.type !== 'star' && th.z > SPAWN_Z - 1) zs.push(+th.z.toFixed(3));
  }
  assert(zs.every(z => z <= SPAWN_Z + 1e-6));
});

test('jumping clears a fence; not jumping does not', () => {
  const fenceRun = () => { const run = new Run(2); run.things = run.things.filter(t => t.type === 'fence'); return run; };
  // Not jumping: dead at the first fence.
  const a = fenceRun(); a.advance(10);
  assert.equal(a.over, true); assert.equal(a.cause, 'fence');
  // Jumping at the right moment: through, and it counts.
  const b = fenceRun();
  const first = Math.min(...b.things.map(t => t.z));
  for (let i = 0; i < 10 / STEP && !b.over; i++) {
    const th = b.things.find(t => t.type === 'fence' && t.z > 0);
    if (th && th.z < b.speed * 0.28 && !b.airborne && b.fences === 0) b.jump();
    b.step(STEP);
    if (b.fences > 0) break;
  }
  assert(first > 0);
  assert.equal(b.over, false);
  assert.equal(b.fences, 1);
});

test('rocks cannot be jumped, but a lane change avoids them', () => {
  const run = new Run(4);
  run.things = [{ type: 'rock', lane: 0, z: 10, row: 1, path: 1 }];
  run.nextIn = 1e9;
  for (let i = 0; i < 0.3 / STEP; i++) run.step(STEP);
  run.jump(); // too early to matter; still airborne when the rock arrives
  run.advance(1.2);
  assert.equal(run.over, true, 'the jump did not save it');

  const dodge = new Run(4);
  dodge.things = [{ type: 'rock', lane: 0, z: 10, row: 1, path: 1 }];
  dodge.nextIn = 1e9;
  dodge.swipe(1);
  dodge.advance(1.5);
  assert.equal(dodge.over, false);
});

test('stars add points; lane changes stay inside the three lanes', () => {
  const run = new Run(6);
  run.things = [{ type: 'star', lane: 0, z: 5 }];
  run.nextIn = 1e9;
  run.advance(1);
  assert.equal(run.stars, 1);
  assert(run.score >= Math.floor(run.dist) + 10);
  for (let i = 0; i < 5; i++) run.swipe(1);
  assert.equal(run.target, 1);
  for (let i = 0; i < 5; i++) run.swipe(-1);
  assert.equal(run.target, -1);
});

test('a tap just before landing still jumps (buffer)', () => {
  const run = new Run(9);
  run.things = [];
  run.nextIn = 1e9;
  run.jump();
  run.advance(JUMP_TIME - 0.05);
  assert(run.airborne);
  run.jump();                 // 0.05 s before landing
  run.advance(0.1);
  assert(run.airborne, 'jumped again on landing');
});

test('speed rises smoothly and levels cap at 1', () => {
  assert.equal(speedAt(0), 12);
  assert(speedAt(5000) < 28 && speedAt(5000) > 26);
  let prev = 0;
  for (let d = 0; d < 6000; d += 50) { assert(speedAt(d) >= prev); prev = speedAt(d); }
  assert.equal(level(1e6), 1);
  assert(CLEAR_H > 0 && CLEAR_H < 1);
});
