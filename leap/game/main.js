// MOUTON・LEAP on screen: the loop, swipe and tap controls, sheets, effects
// and saving. The rules live in core.js, the pictures in draw.js.
//
// Controls (only these two, on purpose):
//   swipe left / right  -> change lane
//   tap (or swipe up)   -> jump
import { Run, STEP, STAR_POINTS } from './core.js';
import { layout, buildSky, drawFrame, project } from './draw.js';
import { Sound, vibrate } from './audio.js';

const app = document.querySelector('[data-app]');
const $ = sel => app.querySelector(sel);
const $$ = sel => [...app.querySelectorAll(sel)];
const canvas = $('[data-stage]');
const ctx = canvas.getContext('2d');
const hud = $('[data-hud]');
const sheets = Object.fromEntries($$('[data-sheet]').map(el => [el.dataset.sheet, el]));
const scoreEl = $('[data-score]');
const starsEl = $('[data-stars]');
const hintEl = $('[data-hint]');

const SAVE = 'mouton.leap.save';
const SWIPE = 26;                  // px sideways before a swipe counts
const SWIPE_UP = 34;               // px upwards for a jump swipe
const TAP_SLOP = 14;               // a tap moves less than this
const TAP_MS = 600;                // and lifts within this
const DYING_MS = 900;              // the tumble before the end sheet
const OVER_LOCK_MS = 500;          // taps right after the end are ignored
const TEACH_RUNS = 3;              // the first runs show hints
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const seedParam = Number(new URLSearchParams(location.search).get('seed')) || undefined;

// --- saving (never required: private windows can refuse storage)
const save = { best: 0, plays: 0, sound: true };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE)) || {}); } catch { /* start fresh */ }
const persist = () => { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch { /* fine */ } };

const sound = new Sound();
sound.on = save.sound !== false;

// --- state
let mode = 'title';                // title | play | pause | dying | over
let run = null;
const idle = { dist: 0, x: 0, target: 0, height: 0, things: [], t: 0 };   // the scene behind the title
let acc = 0, last = 0, clock = 0;
let deadT = -1, overAt = 0, shakeT = 0;
let hintDone = {};
let starChain = 0, lastStarAt = -9;
let L, sky;
const particles = [];

function setMode(next) {
  mode = next;
  app.dataset.mode = next;
  const sheet = { title: 'title', pause: 'pause', over: 'over' }[next] || null;
  for (const [name, el] of Object.entries(sheets)) el.hidden = name !== sheet;
  hud.hidden = next === 'title' || next === 'over';
  if (next !== 'play') hideHint();
  if (sheet) sheets[sheet].querySelector('.btn-main')?.focus({ preventScroll: true });
}

function showTitle() {
  const best = $('[data-best]');
  best.hidden = !save.best;
  best.textContent = `ベスト ${save.best}`;
  setMode('title');
}

function startRun() {
  sound.unlock();
  run = new Run(seedParam);
  acc = 0;
  deadT = -1;
  shakeT = 0;
  hintDone = {};
  starChain = 0;
  lastStarAt = -9;
  particles.length = 0;
  save.plays++;
  persist();
  scoreEl.textContent = '0';
  starsEl.textContent = '0';
  setMode('play');
}

function pause() { if (mode === 'play') setMode('pause'); }
function resume() { if (mode === 'pause') { acc = 0; setMode('play'); } }

function finish() {
  const newBest = run.score > save.best;
  if (newBest) save.best = run.score;
  persist();
  $('[data-final]').textContent = run.score;
  $('[data-dist]').textContent = Math.floor(run.dist);
  $('[data-star-n]').textContent = run.stars;
  $('[data-star-pt]').textContent = run.stars * STAR_POINTS;
  $('[data-fence-n]').textContent = run.fences;
  $('[data-new]').hidden = !(newBest && save.plays > 1);
  $('[data-over-best]').textContent = `ベスト ${save.best}`;
  const lines = ['柵は、またやってくる。', '夜は、まだ長い。', '羊は、また走り出す。', '跳んだ柵のぶんだけ、よく眠れそう。'];
  $('[data-murmur]').textContent = newBest && save.plays > 1 ? 'いちばん遠くまで来た。' : lines[run.seed % lines.length];
  overAt = performance.now();
  setMode('over');
}

// --- teaching: the first runs say what to do when the first thing arrives in your lane
const HINTS = { fence: 'タップで ジャンプ', rock: 'スワイプで よける' };
function hideHint() { hintEl.hidden = true; }
function updateHint() {
  if (mode !== 'play' || save.plays > TEACH_RUNS) return hideHint();
  let next = null;
  for (const t of run.things) {
    if (t.type === 'star' || t.z <= 0 || Math.abs(t.lane - run.target) > 0.6) continue;
    if (!next || t.z < next.z) next = t;
  }
  if (!next || next.z > 34 || hintDone[next.type]) return hideHint();
  if (next.z < 3) { hintDone[next.type] = true; return hideHint(); }
  hintEl.textContent = HINTS[next.type];
  hintEl.hidden = false;
}

// --- effects
function bodyPos() {
  const p = project(L, 0, run.x);
  return { x: p.x, y: p.y - (0.37 + run.height * 0.62) * p.u, gy: p.y, u: p.u };
}
function emit(n, make) {
  const count = reduced ? Math.ceil(n / 3) : n;
  for (let i = 0; i < count; i++) particles.push(make());
}
const rand = (a, b) => a + Math.random() * (b - a);

function onEvent(e) {
  switch (e.type) {
    case 'jump': sound.jump(); break;
    case 'land': {
      sound.land();
      const b = bodyPos();
      emit(6, () => ({ x: b.x + rand(-8, 8), y: b.gy, vx: rand(-60, 60), vy: rand(-50, -10), g: 120, life: 0.4, max: 0.4, r: rand(2, 4), color: '190,205,230' }));
      break;
    }
    case 'lane': sound.lane(); break;
    case 'fence': sound.fence(); break;
    case 'star': {
      starChain = run.t - lastStarAt < 0.9 ? starChain + 1 : 0;
      lastStarAt = run.t;
      sound.star(starChain);
      starsEl.textContent = run.stars;
      const b = bodyPos();
      emit(8, () => ({ x: b.x, y: b.y - b.u * 0.2, vx: rand(-110, 110), vy: rand(-150, -20), g: 260, life: 0.55, max: 0.55, r: rand(2, 4), color: '247,231,168' }));
      break;
    }
    case 'hit': {
      sound.hit();
      vibrate(60);
      shakeT = reduced ? 0 : 0.3;
      const b = bodyPos();
      emit(16, () => ({ x: b.x, y: b.y, vx: rand(-230, 230), vy: rand(-260, 40), g: 420, life: 0.8, max: 0.8, r: rand(5, 11), color: '243,234,216' }));
      deadT = 0;
      setMode('dying');
      break;
    }
    default: break;
  }
}

function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    ctx.fillStyle = `rgba(${p.color},${(p.life / p.max).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- the loop: the world moves in fixed steps, drawing follows the screen
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000 || 0);
  last = now;
  clock += dt;

  let view = idle;
  if (mode === 'title') {
    idle.dist += 8 * dt;
    idle.t += dt;
  } else if (run) {
    view = run;
    if (mode === 'play') {
      acc += dt;
      while (acc >= STEP && mode === 'play') { run.step(STEP); acc -= STEP; run.drain().forEach(onEvent); }
      const s = String(run.score);
      if (scoreEl.textContent !== s) scoreEl.textContent = s;
      updateHint();
    }
    if (mode === 'dying') {
      deadT += dt;
      if (deadT * 1000 >= DYING_MS) finish();
    }
  }

  shakeT = Math.max(0, shakeT - dt);
  const k = shakeT / 0.3;
  const shake = shakeT > 0 ? [rand(-1, 1) * 7 * k, rand(-1, 1) * 7 * k] : null;
  drawFrame(ctx, L, sky, view, clock, { shake, dead: deadT >= 0 ? deadT : -1 });
  drawParticles(dt);
}

// --- sizing
function resize() {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  L = layout(r.width, r.height);
  sky = buildSky(L, dpr);
}
new ResizeObserver(resize).observe(canvas);
resize();

// --- input: one finger, swipe or tap
let g = null;     // the gesture in progress: { id, x, y, t, fired }
app.addEventListener('pointerdown', () => sound.unlock(), { capture: true });
app.addEventListener('pointerdown', e => {
  if (mode !== 'play' || e.target.closest('button, [data-sheet]')) return;
  g = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), fired: false };
  try { app.setPointerCapture(e.pointerId); } catch { /* synthetic pointers can refuse */ }
});
app.addEventListener('pointermove', e => {
  if (!g || e.pointerId !== g.id || mode !== 'play') return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy) * 1.2) {
    run.swipe(dx > 0 ? 1 : -1);
  } else if (dy <= -SWIPE_UP && Math.abs(dy) > Math.abs(dx) * 1.2) {
    run.jump();
  } else return;
  g.fired = true;
  g.x = e.clientX;       // keep dragging in the same swipe for another lane
  g.y = e.clientY;
});
const lift = e => {
  if (!g || e.pointerId !== g.id) return;
  const tap = e.type === 'pointerup' && !g.fired && mode === 'play'
    && Math.hypot(e.clientX - g.x, e.clientY - g.y) < TAP_SLOP && performance.now() - g.t < TAP_MS;
  if (tap) run.jump();
  g = null;
};
app.addEventListener('pointerup', lift);
app.addEventListener('pointercancel', lift);
// Older iOS still rubber-bands the page under a finger.
document.addEventListener('touchmove', e => { if (mode === 'play') e.preventDefault(); }, { passive: false });

// Keyboard, so it can be tried on a computer too.
document.addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (mode === 'play') {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') run.swipe(-1);
    else if (key === 'arrowright' || key === 'd') run.swipe(1);
    else if (key === 'arrowup' || key === 'w' || key === ' ') run.jump();
    else if (key === 'escape' || key === 'p') pause();
    else return;
    e.preventDefault();
  } else if (mode === 'pause' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
    resume();
  }
});

// --- buttons
const on = (sel, fn) => $$(sel).forEach(el => el.addEventListener('click', fn));
on('[data-start]', startRun);
on('[data-again]', () => { if (performance.now() - overAt > OVER_LOCK_MS) startRun(); });
on('[data-pause]', pause);
on('[data-resume]', resume);
on('[data-restart]', startRun);
on('[data-to-title]', showTitle);
function paintSound() {
  for (const el of $$('[data-sound]')) {
    el.setAttribute('aria-pressed', String(sound.on));
    el.textContent = sound.on ? '音 オン' : '音 オフ';
  }
}
on('[data-sound]', () => {
  sound.on = !sound.on;
  save.sound = sound.on;
  persist();
  paintSound();
  sound.unlock();
  sound.jump();
});
paintSound();

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);

// A small window for tests and for looking at a run from the console.
window.__moutonLeap = {
  state: () => ({
    mode, score: run?.score ?? 0, lane: run?.target ?? 0, x: run?.x ?? 0,
    airborne: !!run?.airborne, stars: run?.stars ?? 0, fences: run?.fences ?? 0, plays: save.plays, best: save.best,
  }),
  // What is coming, nearest first (stars left out).
  peek: () => (run?.things || []).filter(t => t.type !== 'star' && t.z > -1 && t.z < 40)
    .map(t => ({ type: t.type, lane: t.lane, z: t.z, path: t.path, row: t.row })).sort((a, b) => a.z - b.z),
};

showTitle();
requestAnimationFrame(frame);
