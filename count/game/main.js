// MOUTON・COUNT on screen: drawing the field, touch controls, items,
// the night sky that turns to dawn, music and sounds, saving, and the device ranking.
import { Game, COLS, ROWS, BLACK, GOLD, DAWN, clock, fallDelay, addScore, height, moodFor } from './core.js';
import { storage, ads, leaderboard, haptics, onBack, purchases } from './services.js';
import { Sound } from './audio.js';
import { drawBlock } from './skins.js';
import { Wallet, SKINS, skinById } from './wool.js';
import { QUESTS, GOALS, questById, questGame, progress, outcome, record, unlocked } from './quest.js';
import { Profile, ACHIEVEMENTS, rankOf, gameStats, moonPhase, localDate, goodnightMessage } from './profile.js';
import * as S from './story.js';
import { storyNightAt } from './storynights.js';
import { WARES, WARE_IDS, FREE_NOTE } from './purchases.js';
import * as T from './transfer.js';

const app = document.querySelector('[data-app]');
const field = app.querySelector('[data-field]');
const nextCanvas = app.querySelector('[data-next]');
const wrap = app.querySelector('[data-wrap]');
const ctx = field.getContext('2d');
const nctx = nextCanvas.getContext('2d');
const $ = sel => app.querySelector(sel);
const SAVE = 'mouton.sheep.save';
const SEEN = 'mouton.sheep.seen';
const SETTINGS = 'mouton.sheep.settings';
const WALLET = 'mouton.sheep.wallet';
const QUEST_SAVE = 'mouton.sheep.quest.save';
const RESULTS = 'mouton.sheep.quests';
const STORY = 'mouton.sheep.story';
const NIGHT_RESULTS = 'mouton.sheep.storynights';   // the story's fifty nights: best stars of each
const AD_FLOCKS = 5;          // flocks added by an ad when a quest runs out
const PROFILE = 'mouton.sheep.profile';
const TIPS = 'mouton.sheep.tips';     // one-time tips already shown
const STAR_MS = 8000;         // a shooting star doubles clears for this long
const MOON_MS = 1500;
const STEP_MS = 380;          // one step of a chain
const DROP_MS = 200;          // sheep dropping into a gap
const SQUASH_MS = 200;        // a landing squash
const AD_CAP = 3;
const LOCK_DELAY = 450;
const LOCK_RESETS = 12;
const SLOW_MS = 20000;
const HOLD_MS = 220;          // a finger held this long without moving: fall fast
const FAST_MS = 35;           // one row every 35 ms while held
const NAMES = { dog: '牧羊犬', swap: '入れ替え', slow: 'ゆっくり', whistle: '笛' };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let game = null;
let state = 'title';          // title | play | pick (choosing a black sheep for the whistle) | pause | over
let cell = 32;
let dpr = 1;
let sprites = {};
let fallTimer = 0;
let lockTimer = 0;
let lockResets = 0;
let busyUntil = 0;            // gravity waits while sheep are jumping
let slowUntil = 0;
let shownCount = 0;
let effects = [];             // jumping sheep and "+8匹" texts
let last = performance.now();
let dawnShown = false;
let mood = null;              // which music is playing
let nightMood = null;         // the music the night itself calls for (chance time aside)
let fast = false;             // the falling flock is held down
let tracks = new Map();       // cell → rows it passes through while dropping, with times
let squash = new Map();       // cell → when it landed (a short squash)
let shake = { start: 0, dur: 0, mag: 0 };
const wallet = new Wallet(storage.get(WALLET, {}));
const saveWallet = () => storage.set(WALLET, wallet.toJSON());
let mode = 'free';            // free play, or a quest
let quest = null;             // the quest being played
let extra = 0;                // flocks added by an ad in this attempt
let adFlocksUsed = false;
let results = storage.get(RESULTS, {});
if (typeof results !== 'object' || !results) results = {};
let nightResults = storage.get(NIGHT_RESULTS, {});
if (typeof nightResults !== 'object' || !nightResults) nightResults = {};
let nightMs = 0;              // time on a story night not yet added to the story's played time
// A story night has an id above 100 (the fifteen quests are 1 to 15) and its number in `n`.
const isStoryNight = q => Boolean(q) && q.id > 100;
const nightNo = q => q.n || q.id;
const resultsOf = q => (isStoryNight(q) ? nightResults : results);
let story =S.normalize(storage.get(STORY, null));      // ものがたり (optional; see story.js)
const saveStory = () => storage.set(STORY, story);
const profile = new Profile(storage.get(PROFILE, {}));
const saveProfile = () => storage.set(PROFILE, profile.toJSON());
let synced = {};              // this night's numbers already added to the profile
let prevBest = 0;             // free play: the best before this night
let bestPassed = false;
let playTime = 0;             // ms played this session (shooting stars, good night)
let nextStar = 0;             // play time of the next shooting star
let starEnd = 0;              // play time when the current one ends
let lastTick = 0;             // the last "seconds left" ticked during a shooting star
let goodnightShown = false;
const tips = storage.get(TIPS, {}) || {};
const settings = { music: true, sfx: true, vibe: true, ...storage.get(SETTINGS, {}) };
const sound = new Sound(settings);
haptics.on = settings.vibe;

// ---- Sheep pictures --------------------------------------------------------

// Each kind of sheep is drawn once per size, then copied.
function makeSprites() {
  sprites = {};
  for (const v of [1, 2, 3, 4, GOLD, BLACK]) {
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(cell * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    drawBlock(g, 0, 0, cell, v, wallet.skin);
    sprites[v] = c;
  }
}
// sx, sy squash the sheep from its feet (landing).
const sheepAt = (g, x, y, v, alpha = 1, sx = 1, sy = 1) => {
  g.globalAlpha = alpha;
  const w = cell * sx, h = cell * sy;
  g.drawImage(sprites[v] || sprites[1], x + (cell - w) / 2, y + cell - h, w, h);
  g.globalAlpha = 1;
};

// Where a dropping sheep is now, in rows. It speeds up as it falls.
function rowOnTrack(kf, now) {
  let row = kf[0].row;
  for (let k = 1; k < kf.length; k++) {
    const { row: to, time } = kf[k];
    if (now < time) return row;
    const t = (now - time) / DROP_MS;
    if (t < 1) return row + (to - row) * t * t;
    row = to;
  }
  return row;
}
// A landing: flatten and widen a little, then spring back.
function squashAt(i, now) {
  const t0 = squash.get(i);
  if (t0 === undefined || now < t0) return [1, 1];
  const t = (now - t0) / SQUASH_MS;
  if (t >= 1) { squash.delete(i); return [1, 1]; }
  const k = Math.sin(Math.PI * t) * (1 - t * 0.5);
  return [1 + 0.12 * k, 1 - 0.2 * k];
}

// ---- Layout ----------------------------------------------------------------

function layout() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const box = wrap.getBoundingClientRect();
  cell = Math.max(16, Math.floor(Math.min(box.width / COLS, box.height / ROWS)));
  field.style.width = `${cell * COLS}px`;
  field.style.height = `${cell * ROWS}px`;
  field.width = Math.round(cell * COLS * dpr);
  field.height = Math.round(cell * ROWS * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(cell * 0.5);
  nextCanvas.style.width = `${n * 3}px`;
  nextCanvas.style.height = `${n * 3}px`;
  nextCanvas.width = Math.round(n * 3 * dpr);
  nextCanvas.height = Math.round(n * 3 * dpr);
  makeSprites();
  drawNext();
}

// The sky moves from night to dawn as more sheep are counted.
function sky() {
  const p = Math.min(1, (game ? game.count : 0) / DAWN);
  app.style.setProperty('--dawn', p.toFixed(3));
}

// ---- Drawing ---------------------------------------------------------------

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cell * COLS, cell * ROWS);
  // A short shake on big moments.
  if (now < shake.start + shake.dur && !reduced()) {
    const k = shake.mag * (1 - (now - shake.start) / shake.dur);
    ctx.translate((Math.random() * 2 - 1) * k, (Math.random() * 2 - 1) * k);
  }
  // Field: faint grass lines on the night.
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if ((r + c) % 2) ctx.fillRect(c * cell, r * cell, cell, cell);
  if (!game) return;
  for (let i = 0; i < game.board.length; i++) {
    const v = game.board[i];
    if (!v) continue;
    let row = Math.floor(i / COLS);
    const kf = tracks.get(i);
    if (kf) {
      row = rowOnTrack(kf, now);
      if (now > kf[kf.length - 1].time + DROP_MS) tracks.delete(i);
    }
    const [sx, sy] = squashAt(i, now);
    sheepAt(ctx, (i % COLS) * cell, row * cell, v, 1, sx, sy);
    if (v === GOLD) twinkle((i % COLS) * cell, row * cell, now, i);
  }
  if (state === 'play' || state === 'pause' || state === 'pick') {
    const p = game.piece;
    if (p && !game.over) {
      const land = game.landingRow();
      if (land !== p.row) {
        ctx.fillStyle = 'rgba(244,227,161,.12)';
        ctx.strokeStyle = 'rgba(244,227,161,.35)';
        ctx.lineWidth = 1;
        for (const x of p.cells) {
          const X = (p.col + x.c) * cell, Y = (land + x.r) * cell;
          ctx.beginPath();
          ctx.roundRect(X + 3, Y + 3, cell - 6, cell - 6, cell * 0.3);
          ctx.fill();
          ctx.stroke();
        }
      }
      // Held down: a faint trail above the flock shows the speed.
      if (fast && game.canFall()) {
        for (let k = 1; k <= 3; k++) for (const x of p.cells) sheepAt(ctx, (p.col + x.c) * cell, (p.row + x.r - k * 0.45) * cell, x.v, 0.22 / k);
      }
      for (const x of p.cells) {
        sheepAt(ctx, (p.col + x.c) * cell, (p.row + x.r) * cell, x.v);
        if (x.v === GOLD) twinkle((p.col + x.c) * cell, (p.row + x.r) * cell, now, x.c + x.r);
      }
    }
  }
  if (state === 'pick') pickOverlay(now);
  // Jumping sheep fly in an arc towards the counter; texts rise and fade.
  effects = effects.filter(e => now < e.start + e.dur);
  for (const e of effects) {
    const t = (now - e.start) / e.dur;
    if (t < 0) {
      // A sheep that leaves later in a chain waits where it is (it may still be dropping).
      if (e.kind === 'sheep') sheepAt(ctx, e.x, e.track ? rowOnTrack(e.track, now) * cell : e.y, e.v);
      continue;
    }
    if (e.kind === 'sheep') {
      const k = t * t * (3 - 2 * t);
      const x = e.x + (e.tx - e.x) * k;
      const y = e.y + (e.ty - e.y) * k - Math.sin(Math.PI * k) * cell * 2.2;
      sheepAt(ctx, x, y, e.v, 1 - t * 0.85);
    } else if (e.kind === 'moon') {
      // A full moon rises behind the field for a moment.
      const a = Math.sin(Math.PI * Math.min(1, t * 1.1));
      const cx = cell * COLS / 2, cy = cell * ROWS * 0.42, r = cell * 2.6 * (0.85 + 0.15 * a);
      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
      glow.addColorStop(0, `rgba(255,244,200,${0.55 * a})`);
      glow.addColorStop(1, 'rgba(255,244,200,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, cell * COLS, cell * ROWS);
      ctx.fillStyle = `rgba(255,246,214,${0.9 * a})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#1b2440';
      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(cell * 0.95)}px system-ui, sans-serif`;
      ctx.fillText('満月', cx, cy + cell * 0.3);
      ctx.restore();
    } else if (e.kind === 'puff') {
      // Bits of wool flying off.
      const x = e.x + e.vx * t * cell, y = e.y + e.vy * t * cell + t * t * cell * 0.6;
      ctx.globalAlpha = 0.8 * (1 - t);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(x, y, e.r * cell * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (e.kind === 'spark') {
      const x = e.x + e.vx * t * cell, y = e.y + e.vy * t * cell;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = e.color || '#f4e3a1';
      const r = cell * (e.size || 0.12) * (1 - t * 0.5);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + t * 2, rr = k % 2 ? r * 0.35 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (e.kind === 'row') {
      ctx.fillStyle = `rgba(244,227,161,${0.35 * (1 - t)})`;
      ctx.fillRect(0, e.r * cell, cell * COLS, cell);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - t) * 1.6);
      ctx.fillStyle = '#f4e3a1';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 8;
      // Pops in a little too big, then settles.
      const pop = t < 0.12 ? 0.6 + (t / 0.12) * 0.55 : t < 0.22 ? 1.15 - ((t - 0.12) / 0.1) * 0.15 : 1;
      const big = e.big || 1;
      ctx.translate(cell * COLS / 2, e.y - t * cell * 1.5);
      ctx.scale(pop * big, pop * big);
      ctx.font = `700 ${Math.round(cell * 0.62)}px system-ui, sans-serif`;
      ctx.fillText(e.text, 0, 0);
      if (e.sub) {
        ctx.font = `600 ${Math.round(cell * 0.38)}px system-ui, sans-serif`;
        ctx.fillText(e.sub, 0, cell * 0.55);
      }
      ctx.restore();
    }
  }
}

function drawNext() {
  const n = Math.round(cell * 0.5);
  nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  nctx.clearRect(0, 0, n * 3, n * 3);
  if (!game || state === 'title') return;
  const cells = game.queue[0];
  const h = Math.max(...cells.map(x => x.r)) + 1, w = Math.max(...cells.map(x => x.c)) + 1;
  const ox = (3 - w) * n / 2, oy = (3 - h) * n / 2;
  for (const x of cells) {
    nctx.drawImage(sprites[x.v] || sprites[1], ox + x.c * n, oy + x.r * n, n, n);
  }
}

// ---- Heads-up display --------------------------------------------------------

function hud() {
  const goal = $('[data-goal]');
  if (mode === 'quest' && game && quest) {
    // In a quest the top shows the goal: progress on the left, flocks left on the right.
    const p = progress(quest, game);
    const left = Math.max(0, quest.limit + extra - game.placed);
    $('[data-count]').textContent = Math.min(p.value, p.target).toLocaleString('ja-JP');
    $('[data-unit]').textContent = `/ ${p.target.toLocaleString('ja-JP')} ${GOALS[quest.goal].unit}`;
    $('[data-clock]').textContent = `群れ のこり ${left}`;
    $('[data-clock]').classList.toggle('is-low', left <= 3);
    goal.hidden = false;
    goal.textContent = `第${nightNo(quest)}夜　${GOALS[quest.goal].text(quest.target)}`;
  } else {
    $('[data-count]').textContent = shownCount.toLocaleString('ja-JP');
    $('[data-unit]').textContent = '匹';
    $('[data-clock]').textContent = clock(game ? game.count : 0);
    $('[data-clock]').classList.remove('is-low');
    goal.hidden = true;
  }
  for (const btn of app.querySelectorAll('[data-item]')) {
    const item = btn.dataset.item;
    const n = game ? game.items[item] : 0;
    const offer = game && n === 0 && ads.available() && game.adRewards < AD_CAP && !game.over;
    btn.querySelector('[data-n]').textContent = offer ? (ads.free() ? 'もらう+1' : '広告で+1') : `×${n}`;
    btn.classList.toggle('is-ad', Boolean(offer));
    btn.classList.toggle('is-on', (item === 'slow' && performance.now() < slowUntil) || (item === 'whistle' && state === 'pick'));
    btn.disabled = state === 'pick' ? item !== 'whistle' : state !== 'play' || !(game.canUse(item) || offer);
  }
  sky();
}

// ---- The loop --------------------------------------------------------------

function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  if (mode === 'free' && shownCount < (game ? game.count : 0)) {
    shownCount = Math.min(game.count, shownCount + Math.max(1, Math.ceil((game.count - shownCount) / 8)));
    $('[data-count]').textContent = shownCount.toLocaleString('ja-JP');
  }
  if (state === 'play') { playTime += dt; if (mode === 'quest' && isStoryNight(quest)) nightMs += dt; stars(); }
  if (state === 'play' && now >= busyUntil) step(dt, now);
  if (now - (frame.chips || 0) > 150) { frame.chips = now; chips(); }
  draw(now);
  requestAnimationFrame(frame);
}

function step(dt, now) {
  // A long press speeds up only the flock it started on, not the next one.
  fast = Boolean(touch && touch.hold && touch.piece === game.piece);
  const delay = fast ? FAST_MS : fallDelay(game.count) * (now < slowUntil ? 2.4 : 1);
  if (game.canFall()) {
    lockTimer = 0;
    fallTimer += dt;
    if (fallTimer >= delay) { fallTimer = 0; game.fall(); }
  } else {
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY) settle(game.lock());
  }
  if (slowUntil && now >= slowUntil) { slowUntil = 0; sound.setSlow(false); hud(); }
}

// A golden sheep glints now and then.
function twinkle(x, y, now, k) {
  const a = Math.max(0, Math.sin(now / 260 + k * 1.7));
  if (a < 0.2) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#fff6c8';
  const cx = x + cell * (0.25 + 0.5 * ((k * 37) % 7) / 7), cy = y + cell * 0.22, r = cell * 0.1 * a;
  ctx.beginPath();
  for (let n = 0; n < 8; n++) {
    const ang = (n / 8) * Math.PI * 2, rr = n % 2 ? r * 0.3 : r;
    ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
  }
  ctx.fill();
  ctx.restore();
}

// Small labels over the field: the run of clears, a shooting star, the way to a best.
function chips() {
  const combo = $('[data-chip-combo]'), star = $('[data-chip-star]'), best = $('[data-chip-best]');
  const playing = game && (state === 'play' || state === 'end' || state === 'pause');
  const n = playing ? game.streak : 0;
  combo.hidden = n < 2;
  if (n >= 2) combo.textContent = `連続 ${n}  ×${(Math.min(3, 1 + (n - 1) * 0.5)).toFixed(1).replace('.0', '')}`;
  const left = Math.ceil((starEnd - playTime) / 1000);
  star.hidden = !(playing && game.boost > 1 && left > 0);
  if (!star.hidden) star.textContent = `流れ星 ×2  あと${left}秒`;
  best.hidden = true;
  if (playing && mode === 'free' && prevBest > 0) {
    if (bestPassed) { best.hidden = false; best.textContent = '自己ベスト更新中'; }
    else if (game.count >= prevBest * 0.7) { best.hidden = false; best.textContent = `ベストまで あと${prevBest - game.count}匹`; }
  }
}

// Shooting stars (free play): every 40–80 seconds of play, clears count double for 8 seconds.
function stars() {
  if (mode !== 'free' || !game) return;
  if (game.boost > 1 && playTime >= starEnd) {
    game.boost = 1;
    nextStar = playTime + 40000 + Math.random() * 40000;
    sound.sfx('chanceEnd');
    updateMood();
  }
  if (game.boost > 1) {
    const left = Math.ceil((starEnd - playTime) / 1000);
    if (left <= 3 && left !== lastTick) { lastTick = left; sound.sfx('tick', left); }
  }
  if (game.boost === 1 && nextStar && playTime >= nextStar) {
    game.boost = 2;
    starEnd = playTime + STAR_MS;
    nextStar = 0;
    lastTick = 0;
    sound.sfx('star');
    updateMood();
    haptics.buzz([10, 30, 10]);
    if (!reduced()) {
      const el = document.createElement('div');
      el.className = 'shooting-star';
      el.setAttribute('aria-hidden', 'true');
      app.append(el);
      el.addEventListener('animationend', () => el.remove());
    }
    toast('流れ星！ 8秒間、数が2倍');
  }
}

// Add what this night has counted so far to the player's record, and hand out
// whatever that earns (a new rank, achievements).
function absorbNow() {
  if (!game) return;
  const now = gameStats(game);
  celebrate(profile.absorb(now, synced, localDate(), results));
  synced = now;
  saveProfile();
}
function celebrate(r) {
  if (r.wool) { wallet.earn(r.wool); saveWallet(); showWool(); }
  for (const rank of r.ranks) toast(`ランクアップ「${rank.name}」 ウール +${rank.wool}`, 'rankup');
  for (const a of r.achievements) toast(`実績「${a.name}」 ウール +${a.wool}`, 'achieve');
}

// The highest row a step's leaving sheep were on (for placing its text).
const y0 = s => Math.min(...s.sheep.map(({ i }) => Math.floor(i / COLS))) * cell;

function shakeIt(mag, dur) {
  if (reduced()) return;
  shake = { start: performance.now(), dur, mag: Math.max(mag, now() < shake.start + shake.dur ? shake.mag : 0) };
}
const now = () => performance.now();

// The counter jumps a little when sheep are counted.
function bump() {
  const el = $('.hud-count');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

// Sheep above a gap drop into it instead of jumping there. For every sheep
// that moves during these steps, note the rows it passes and when, and
// squash it when it lands. A sheep that leaves in a later step of a chain
// gets the path it took until then.
function planDrops(steps, start) {
  let cur = new Map();
  steps.forEach((s, k) => {
    s.tracks = cur;
    const at = start + k * STEP_MS + 140;
    const gone = new Set([...s.jumped, ...s.freed]);
    const movedFrom = new Set(s.moves.map(m => m[0]));
    const next = new Map();
    for (const [i, kf] of cur) if (!gone.has(i) && !movedFrom.has(i)) next.set(i, kf);
    for (const [from, to] of s.moves) {
      next.set(to, [...(cur.get(from) || [{ row: Math.floor(from / COLS), time: 0 }]), { row: Math.floor(to / COLS), time: at }]);
    }
    cur = next;
  });
  for (const [i, kf] of cur) {
    tracks.set(i, kf);
    squash.set(i, kf[kf.length - 1].time + DROP_MS);
  }
}

// The music follows the night: lullaby, late night, dawn, and the pinch when
// the pile is high. While a shooting star doubles the count, chance time plays
// over all of them (the pinch still shows on the field's edge).
function updateMood() {
  const night = moodFor(nightMood, game.count, height(game.board));
  if (night === 'pinch' && nightMood !== 'pinch') { sound.sfx('pinch'); haptics.pinch(); }
  app.classList.toggle('is-pinch', night === 'pinch');
  nightMood = night;
  const chance = game.boost > 1;
  app.classList.toggle('is-chance', chance);
  const next = chance ? 'chance' : night;
  if (next === mood) return;
  mood = next;
  sound.play(next);
}

// After a flock lands (or the dog runs): show who jumped, then go on.
function settle(res, steps = res ? res.steps : [], hard = false) {
  fallTimer = 0;
  lockTimer = 0;
  lockResets = 0;
  const now = performance.now();
  if (res) {
    sound.sfx('land', hard);
    haptics.land();
    for (const i of res.placed) squash.set(i, now);
  }
  planDrops(steps, now);
  let t = now;
  steps.forEach((s, k) => {
    const start = now + k * STEP_MS;
    if (!s.whistle) setTimeout(() => {
      shakeIt(Math.min(9, 1.5 + s.rows.length * 1.5 + (s.chain - 1) * 2.5), 260);
      bump();
    }, k * STEP_MS);
    if (!s.whistle) setTimeout(() => {
      sound.sfx('jumps', s.sheep.length, s.chain);
      if (s.freed.length) { sound.sfx('black'); haptics.black(); } else haptics.clear(s.chain);
      if (s.golds) sound.sfx('gold');
      if (s.moon) { sound.sfx('moon'); haptics.buzz([40, 50, 60, 50, 90]); shakeIt(10, 420); }
    }, k * STEP_MS);
    if (s.moon) effects.push({ kind: 'moon', start, dur: MOON_MS });
    if (s.golds && !reduced()) {
      for (const { i, v } of s.sheep) if (v === GOLD) {
        for (let p = 0; p < 10; p++) {
          const a = (p / 10) * Math.PI * 2;
          effects.push({ kind: 'spark', x: (i % COLS) * cell + cell / 2, y: Math.floor(i / COLS) * cell + cell / 2, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, color: '#ffd76a', size: 0.14, start, dur: 700 });
        }
      }
    }
    for (const r of s.rows) effects.push({ kind: 'row', r, start, dur: 380 });
    s.sheep.forEach(({ i, v }, j) => {
      const x = (i % COLS) * cell, y = Math.floor(i / COLS) * cell;
      if (reduced()) return;
      // Counted sheep jump towards the counter; one sent off by the whistle hops out to the side.
      const [tx, ty] = s.whistle ? [x < cell * COLS / 2 ? -cell * 1.4 : cell * (COLS + 0.4), y - cell * 0.6] : [cell * COLS - cell, -cell * 1.2];
      effects.push({ kind: 'sheep', v, x, y, track: s.tracks?.get(i), tx, ty, start: start + j * 25, dur: s.whistle ? 800 : 650 });
      for (let p = 0; p < 3; p++) {
        const a = Math.random() * Math.PI * 2;
        effects.push({ kind: 'puff', x: x + cell / 2, y: y + cell / 2, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.9 - 0.4, r: 0.07 + Math.random() * 0.06,
          color: v === BLACK ? 'rgba(70,74,96,.9)' : 'rgba(255,250,240,.95)', start: start + j * 25, dur: 520 });
      }
    });
    if (s.chain > 1 && !reduced()) {
      for (let p = 0; p < 6 + s.chain * 2; p++) {
        const a = (p / (6 + s.chain * 2)) * Math.PI * 2;
        effects.push({ kind: 'spark', x: cell * COLS / 2, y: Math.max(cell * 1.5, y0(s) - k * cell * 2.2), vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 1.4, start, dur: 650 });
      }
    }
    // Each step of a chain shows its text a little higher than the one before.
    const y = Math.max(cell * 1.5, y0(s) - k * cell * 2.2);
    if (s.whistle) {
      effects.push({ kind: 'text', text: 'おさんぽへ', sub: '黒い羊が1匹', y: Math.max(cell * 1.5, y0(s) - cell * 0.6), start, dur: 1100, big: 0.8 });
      t = start + STEP_MS;
      return;
    }
    effects.push({ kind: 'text', text: `+${s.gained}匹`, sub: s.golds ? `金の羊 ×3` : s.chain > 1 ? `れんさ ×${s.chain}` : s.rowsBonus > 1 ? `${s.rowsBonus}列いっしょ ×${s.rowsBonus}` : s.freed.length ? '黒い羊も帰った' : '',
      y, start, dur: 1000, big: Math.min(1.5, 1 + (s.chain - 1) * 0.15 + (s.rowsBonus - 1) * 0.12) });
    t = start + STEP_MS + (s.moon ? 500 : 0);
  });
  // After the steps: the run of clears and an emptied field.
  const b = res && res.bonus;
  if (b && b.extra > 0) {
    effects.push({ kind: 'text', text: `+${b.extra}匹`, sub: game.boost > 1 && b.streak < 2 ? '流れ星 ×2' : `連続${b.streak}  ×${b.mult}`, y: cell * 3.2, start: t - 120, dur: 1100, big: 0.9 });
    setTimeout(() => sound.sfx('combo', b.streak), Math.max(0, t - now - 120));
  }
  if (b && b.perfect) {
    effects.push({ kind: 'text', text: 'ぜんぶ消えた！', sub: `+${b.perfectBonus}匹`, y: cell * ROWS * 0.55, start: t, dur: 1800, big: 1.4 });
    if (!reduced()) for (let p = 0; p < 24; p++) {
      const a = (p / 24) * Math.PI * 2;
      effects.push({ kind: 'spark', x: cell * COLS / 2, y: cell * ROWS * 0.55, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, size: 0.16, start: t, dur: 900 });
    }
    setTimeout(() => { sound.sfx('perfect'); haptics.buzz([30, 40, 30, 40, 80]); shakeIt(8, 380); }, Math.max(0, t - now));
    t += 1000;
  }
  // Free play: the moment the night passes the best one so far.
  if (mode === 'free' && prevBest > 0 && !bestPassed && game.count > prevBest) {
    bestPassed = true;
    effects.push({ kind: 'text', text: '自己ベスト更新！', sub: `これまで ${prevBest.toLocaleString('ja-JP')}匹`, y: cell * ROWS * 0.24, start: t, dur: 1800, big: 1.3 });
    setTimeout(() => { sound.sfx('best'); haptics.buzz([20, 40, 20, 40, 60]); }, Math.max(0, t - now));
  }
  if (steps.length) busyUntil = t;
  absorbNow();
  save();
  drawNext();
  hud();
  tipBlack();
  if (game.count >= DAWN && !dawnShown) {
    dawnShown = true;
    effects.push({ kind: 'text', text: '朝になった', sub: 'まだ数えられる？', y: cell * ROWS / 2, start: t, dur: 2200 });
    setTimeout(() => sound.sfx('dawn'), Math.max(0, t - now));
  }
  if (mode === 'quest') {
    const o = outcome(quest, game, extra);
    if (o.state !== 'play') {
      state = 'end';           // no more moves while the last sheep jump
      setTimeout(() => questEnd(o), Math.max(0, t - now) + 350);
      return;
    }
  }
  if (res && res.over) setTimeout(finish, Math.max(0, t - now) + 300);
  else updateMood();
}

// ---- Controls ----------------------------------------------------------------

function nudged(ok) {
  if (ok && !game.canFall() && lockResets < LOCK_RESETS) { lockTimer = 0; lockResets += 1; }
  return ok;
}
const moved = ok => { if (ok) { sound.sfx('move'); haptics.move(); } return ok; };
const act = {
  left: () => moved(nudged(game.move(-1))),
  right: () => moved(nudged(game.move(1))),
  turn: () => { const ok = nudged(game.rotate()); if (ok) { sound.sfx('rotate'); haptics.turn(); } return ok; },
  soft: () => { if (game.fall()) { fallTimer = 0; return true; } return false; },
  drop: () => settle(game.drop(), undefined, true),
};

// Touch: slide sideways to move, tap to turn, hold to fall fast,
// pull down to speed up, swipe up (or flick down) to drop at once.
let touch = null;
app.addEventListener('pointerdown', e => {
  if (state === 'pick') { pickAt(e); return; }
  if (state === 'play') sound.unlock();   // wake the sound if the phone paused it
  if (state !== 'play' || e.target.closest('button, .sheet, .ad-mock') || touch) return;
  const t = touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, col0: game.piece.col, rows: 0, moved: false, trail: [[e.timeStamp, e.clientY]], piece: game.piece, hold: false };
  t.timer = setTimeout(() => {
    if (touch === t && !t.moved && state === 'play') { t.hold = true; haptics.buzz(6); }
  }, HOLD_MS);
  app.setPointerCapture?.(e.pointerId);
});
app.addEventListener('pointermove', e => {
  if (!touch || e.pointerId !== touch.id || state !== 'play' || touch.dropped) return;
  const dx = e.clientX - touch.x0, dy = e.clientY - touch.y0;
  // Swipe up: the flock drops to the bottom at once, as soon as the swipe is clear.
  if (-dy > cell * 1.1 && -dy > Math.abs(dx) * 1.3) {
    touch.dropped = true;
    clearTimeout(touch.timer);
    act.drop();
    return;
  }
  touch.trail.push([e.timeStamp, e.clientY]);
  while (touch.trail.length > 2 && e.timeStamp - touch.trail[0][0] > 90) touch.trail.shift();
  const target = touch.col0 + Math.round(dx / (cell * 0.85));
  while (game.piece.col < target && act.right()) touch.moved = true;
  while (game.piece.col > target && act.left()) touch.moved = true;
  if (dy > cell * 0.9 * (touch.rows + 1) && dy > Math.abs(dx)) { touch.rows += 1; if (act.soft()) touch.moved = true; }
  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) touch.moved = true;
});
const release = e => {
  if (!touch || e.pointerId !== touch.id) return;
  const t = touch;
  touch = null;
  clearTimeout(t.timer);
  if (state !== 'play' || e.type === 'pointercancel' || t.hold || t.dropped) return;
  const dt = e.timeStamp - t.t0;
  const [t1, y1] = t.trail[0];
  const speed = (e.clientY - y1) / Math.max(1, e.timeStamp - t1);
  if (!t.moved && dt < 350) act.turn();
  else if (speed > 0.9 && e.clientY - t.y0 > cell * 1.2) act.drop();
};
app.addEventListener('pointerup', release);
app.addEventListener('pointercancel', release);

// Keyboard, for trying it on a computer.
document.addEventListener('keydown', e => {
  if (state === 'pick' && (e.key === 'Escape' || e.key === 'p')) { endPick(); return; }
  if (state !== 'play') return;
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'turn', x: 'turn', ArrowDown: 'soft', ' ': 'drop' };
  if (map[e.key]) { e.preventDefault(); act[map[e.key]](); }
  else if (e.key === 'p' || e.key === 'Escape') pause();
});

// ---- Items -------------------------------------------------------------------

async function useItem(item) {
  if (state === 'pick') { if (item === 'whistle') endPick(); return; }
  if (state !== 'play') return;
  if (game.items[item] === 0) {
    if (game.adRewards >= AD_CAP || !ads.available()) return;
    const shown = !ads.free();   // with "no ads" the item is simply given: no pause, no sound change
    if (shown) {
      state = 'pause';
      sound.stop(0.2);          // the ad has its own sound
      mood = nightMood = null;
    }
    const ok = await ads.showRewarded(app);
    if (shown) { state = 'play'; last = performance.now(); }
    if (ok && game.reward(item, AD_CAP)) { save(); sound.sfx('reward'); toast(`${NAMES[item]}を1つもらいました`); }
    if (shown) updateMood();
    hud();
    return;
  }
  if (item === 'dog') { const steps = game.dog(); if (steps) { sound.sfx('dog'); settle(null, steps); } }
  else if (item === 'swap') { if (game.swap()) { sound.sfx('swap'); fallTimer = 0; lockTimer = 0; drawNext(); save(); } }
  else if (item === 'slow') {
    if (game.slow()) { sound.sfx('slow'); sound.setSlow(true); slowUntil = performance.now() + SLOW_MS; save(); toast('しばらく、ゆっくり落ちます'); }
  }
  else if (item === 'whistle') startPick();
  hud();
}

// The whistle: with one black sheep it goes at once; with more, the night
// waits while the player taps the one to send off (tapping anywhere else,
// or the whistle again, puts the whistle away unused).
function startPick() {
  if (!game.canUse('whistle')) return;
  const blacks = game.board.flatMap((v, i) => (v === BLACK ? [i] : []));
  if (blacks.length === 1) { whistle(blacks[0]); return; }
  state = 'pick';
  if (touch) { clearTimeout(touch.timer); touch = null; }
  fast = false;
  $('[data-pick]').hidden = false;
  sound.sfx('tap');
}
function endPick() {
  if (state !== 'pick') return;
  state = 'play';
  last = performance.now();
  $('[data-pick]').hidden = true;
  hud();
}
function pickAt(e) {
  if (e.target.closest('button, .sheet, .ad-mock')) return;
  e.preventDefault();
  const box = field.getBoundingClientRect();
  const c = Math.floor((e.clientX - box.left) / cell), r = Math.floor((e.clientY - box.top) / cell);
  const i = r * COLS + c;
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS && game.board[i] === BLACK) whistle(i);
  else endPick();
}
function whistle(i) {
  const steps = game.whistle(i);
  endPick();
  if (!steps) return;
  sound.sfx('whistle');
  haptics.black();
  settle(null, steps);
}
function pickOverlay(now) {
  ctx.fillStyle = 'rgba(7,21,43,.5)';
  ctx.fillRect(0, 0, cell * COLS, cell * ROWS);
  const a = 0.55 + 0.45 * Math.sin(now / 170);
  ctx.strokeStyle = `rgba(244,227,161,${a})`;
  ctx.lineWidth = Math.max(2, cell * 0.06);
  game.board.forEach((v, i) => {
    if (v !== BLACK) return;
    const x = (i % COLS) * cell, y = Math.floor(i / COLS) * cell;
    sheepAt(ctx, x, y, BLACK);
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, cell * 0.28);
    ctx.stroke();
  });
}
for (const btn of app.querySelectorAll('[data-item]')) btn.addEventListener('click', () => useItem(btn.dataset.item));

// A tip shown once ever, the first time it matters (the rules live in the menu).
function tip(key, text) {
  if (tips[key]) return;
  tips[key] = true;
  storage.set(TIPS, tips);
  toast(text);
}
function tipBlack() {
  if (game?.piece?.cells.some(x => x.v === BLACK)) tip('black', '黒い羊は、白い羊で囲むと帰る（5匹ぶん）');
}

// Messages over the field, one after another; some come with a sound.
const toasts = [];
function toast(text, sfx = '') {
  toasts.push({ text, sfx });
  if (!toast.busy) nextToast();
}
function nextToast() {
  const el = $('[data-toast]');
  const t = toasts.shift();
  if (!t) { el.hidden = true; toast.busy = false; return; }
  toast.busy = true;
  el.textContent = t.text;
  el.hidden = false;
  el.classList.remove('is-in');
  void el.offsetWidth;
  el.classList.add('is-in');
  if (t.sfx) { sound.sfx(t.sfx); haptics.buzz([15, 40, 15]); }
  setTimeout(nextToast, t.sfx ? 2400 : 1800);
}

// ---- Screens -------------------------------------------------------------------

function show(name) {
  for (const s of app.querySelectorAll('.sheet')) s.hidden = s.dataset.sheet !== name;
  // Away from a night (title, menu and its pages), the count and items are put away.
  app.classList.toggle('is-home', state === 'title');
}

function ranking(target, fresh) {
  const list = leaderboard.top();
  target.replaceChildren(...list.map((e, i) => {
    const li = document.createElement('li');
    if (fresh && e.t === fresh.t) li.className = 'is-new';
    li.innerHTML = `<span class="rank-n">${i + 1}</span><strong>${e.s.toLocaleString('ja-JP')}匹</strong><span class="rank-meta">${e.c}まで・${String(e.d).slice(5).replace('-', '/')}</span>`;
    return li;
  }));
  target.hidden = !list.length;
}

function start(fresh = true) {
  if (fresh) {
    game = mode === 'quest' ? questGame(quest) : Game.create(crypto.getRandomValues(new Uint32Array(1))[0]);
    shownCount = 0;
    dawnShown = false;
    extra = 0;
    adFlocksUsed = false;
    profile.played(localDate());
    saveProfile();
  }
  synced = gameStats(game);    // a continued night was already added up to here
  prevBest = mode === 'free' ? (leaderboard.top()[0]?.s || 0) : 0;
  bestPassed = prevBest > 0 && game.count > prevBest;
  nextStar = mode === 'free' ? playTime + 30000 + Math.random() * 30000 : 0;
  starEnd = 0;
  game.boost = 1;
  effects = [];
  slowUntil = 0;
  busyUntil = 0;
  fallTimer = lockTimer = lockResets = 0;
  state = 'play';
  show(null);
  ads.prepare();               // the app loads one rewarded ad ahead
  sound.unlock();
  sound.stop(0.05);
  sound.setSlow(false);
  mood = nightMood = null;
  app.classList.remove('is-pinch', 'is-chance');
  updateMood();
  drawNext();
  hud();
  save();
  last = performance.now();
  if (!storage.get(SEEN, false)) {
    storage.set(SEEN, true);
    const hint = $('[data-hint]');
    hint.hidden = false;
    setTimeout(() => { hint.hidden = true; }, 5000);
  }
}

function pause() {
  endPick();
  if (state !== 'play') return;
  state = 'pause';
  save();
  show('pause');
  sound.stop(0.3);
  mood = nightMood = null;
  hud();
}

function resume() {
  state = 'play';
  show(null);
  last = performance.now();
  sound.unlock();
  updateMood();
  hud();
}

function finish() {
  if (state === 'over') return;
  state = 'over';
  storage.remove(SAVE);
  sound.stop(0.3);
  mood = nightMood = null;
  app.classList.remove('is-pinch', 'is-chance');
  sound.sfx('over');
  haptics.over();
  const entry = { s: game.count, c: clock(game.count), d: new Date().toISOString().slice(0, 10), t: Date.now() };
  const prev = leaderboard.top();
  const best = prev[0]?.s || 0;
  let rank = 0;
  if (game.count > 0) {
    const res = addScore(prev, entry);
    leaderboard.save(res.list);
    rank = res.rank;
  }
  $('[data-final]').textContent = game.count.toLocaleString('ja-JP');
  $('[data-final-clock]').textContent = `${clock(game.count)}まで数えた`;
  $('[data-final-note]').textContent =
    game.count > 0 && !best ? 'はじめての記録'
      : game.count > best ? `自己ベスト更新（これまで ${best.toLocaleString('ja-JP')}匹）`
      : rank ? `この端末で ${rank}位` : `自己ベストは ${best.toLocaleString('ja-JP')}匹`;
  $('[data-final-detail]').textContent = `${game.rows}列・黒い羊 ${game.blacks}匹・最大れんさ ${game.best}`;
  ranking($('[data-over-ranking]'), rank ? entry : null);
  game.boost = 1;
  absorbNow();
  celebrate(profile.finished(results));
  saveProfile();
  goodnight();
  // Every sheep counted is one wool, kept for new looks.
  earned = wallet.earn(game.count);
  saveWallet();
  showWool();
  $('[data-double]').hidden = !(earned > 0 && ads.available());
  shownCount = game.count;
  show('over');
  hud();
}

// A gentle word after long play late at night (or after an hour at any time).
function goodnight() {
  const text = goodnightMessage(new Date().getHours(), playTime, goodnightShown);
  for (const el of app.querySelectorAll('[data-goodnight]')) { el.hidden = !text; el.textContent = text; }
  if (text) goodnightShown = true;
}

let earned = 0;
function showWool() {
  $('[data-final-wool]').textContent = earned ? `ウール +${earned.toLocaleString('ja-JP')}（ぜんぶで ${wallet.wool.toLocaleString('ja-JP')}）` : '';
  for (const el of app.querySelectorAll('[data-wool-balance]')) el.textContent = wallet.wool.toLocaleString('ja-JP');
}

// Watching an ad to the end doubles the wool from this night (once).
$('[data-double]').addEventListener('click', async e => {
  const btn = e.currentTarget;
  btn.disabled = true;
  sound.stop(0.2);
  const ok = await ads.showRewarded(app);
  if (ok && earned) {
    wallet.earn(earned);
    earned *= 2;
    saveWallet();
    showWool();
    sound.sfx('reward');
    haptics.clear(2);
    toast('ウールが2倍になりました');
    btn.hidden = true;
  }
  btn.disabled = false;
});

// ---- Dress-up: new looks for the sheep, bought with wool ----------------------

function preview(canvas, skin) {
  const s = 40;
  canvas.width = Math.round(s * 3 * dpr);
  canvas.height = Math.round(s * dpr);
  canvas.style.width = `${s * 3}px`;
  canvas.style.height = `${s}px`;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  [1, 3, BLACK].forEach((v, k) => drawBlock(g, k * s, 0, s, v, skin));
}

function renderShop() {
  showWool();
  const list = $('[data-skins]');
  list.replaceChildren(...SKINS.map(skin => {
    const card = document.createElement('div');
    card.className = 'skin';
    card.classList.toggle('is-worn', wallet.skin === skin.id);
    const pic = document.createElement('canvas');
    pic.setAttribute('aria-hidden', 'true');
    preview(pic, skin.id);
    const name = document.createElement('p');
    name.className = 'skin-name';
    name.textContent = skin.name;
    const note = document.createElement('p');
    note.className = 'skin-note';
    note.textContent = skin.note;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skin-btn';
    if (wallet.skin === skin.id) { btn.textContent = 'つけている'; btn.disabled = true; }
    else if (wallet.owned.has(skin.id)) { btn.textContent = 'つける'; btn.dataset.wear = skin.id; }
    else if (wallet.canBuy(skin.id)) { btn.textContent = `ウール ${skin.price.toLocaleString('ja-JP')} で交換`; btn.dataset.buy = skin.id; btn.classList.add('is-buy'); }
    else { btn.textContent = `あと ${(skin.price - wallet.wool).toLocaleString('ja-JP')} ウール`; btn.disabled = true; }
    card.append(pic, name, note, btn);
    return card;
  }));
}

$('[data-skins]').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  sound.unlock();
  if (btn.dataset.buy && wallet.buy(btn.dataset.buy)) {
    sound.sfx('reward');
    haptics.clear(2);
    toast(`「${skinById(wallet.skin).name}」になりました`);
  } else if (btn.dataset.wear && wallet.wear(btn.dataset.wear)) {
    sound.sfx('tap');
    haptics.move();
  } else return;
  saveWallet();
  makeSprites();
  renderShop();
});
let shopFrom = 'title';        // where "back" in the shop goes
for (const btn of app.querySelectorAll('[data-shop]')) btn.addEventListener('click', () => {
  shopFrom = btn.closest('[data-sheet]')?.dataset.sheet === 'menu' ? 'menu' : 'title';
  state = 'title';
  renderShop();
  show('shop');
});
$('[data-shop-back]').addEventListener('click', () => (shopFrom === 'menu' ? menu() : title()));

// Time on a story night goes into the story's record (shown on the keepsake) each time the
// night is saved, so closing the app loses at most a few seconds.
function flushPlayed() {
  if (nightMs <= 0) return;
  if (S.isActive(story)) { story = S.addPlayed(story, nightMs); saveStory(); }
  nightMs = 0;
}

function save() {
  if (mode === 'quest' && isStoryNight(quest)) flushPlayed();
  if (!game || game.over || state === 'title') return;
  if (mode === 'quest') storage.set(QUEST_SAVE, { game: game.toJSON(), extra, adFlocksUsed });
  else storage.set(SAVE, game.toJSON());
}

function title() {
  flushPlayed();
  state = 'title';
  if (mode === 'quest') game = null;   // the quest field is not shown behind the title
  mode = 'free';
  quest = null;
  sound.stop();
  mood = nightMood = null;
  app.classList.remove('is-pinch', 'is-chance');
  hud();
  const saved = storage.get(SAVE, null);
  $('[data-continue]').hidden = !(saved && saved.v === 1 && !saved.over);
  const best = leaderboard.top()[0];
  $('[data-best]').textContent = best ? `自己ベスト ${best.s.toLocaleString('ja-JP')}匹（${best.c}まで）` : '';
  showWool();
  const rk = rankOf(profile.stats.total);
  $('[data-rank-line]').textContent = `羊飼いランク：${rk.rank.name}`;
  show('title');
  drawNext();
}

// The title shows only the way in (free play); everything else is in the menu.
function menu() {
  title();
  show('menu');
}
$('[data-menu]').addEventListener('click', menu);
$('[data-menu-back]').addEventListener('click', title);
$('[data-howto]').addEventListener('click', () => show('howto'));
$('[data-howto-back]').addEventListener('click', () => show('menu'));

$('[data-start]').addEventListener('click', () => { mode = 'free'; quest = null; start(true); });
$('[data-continue]').addEventListener('click', () => {
  mode = 'free';
  quest = null;
  try { game = new Game(storage.get(SAVE, null)); } catch { game = null; }
  if (!game || game.over) { start(true); return; }
  shownCount = game.count;
  dawnShown = game.count >= DAWN;
  start(false);
});
$('[data-pause]').addEventListener('click', pause);
$('[data-resume]').addEventListener('click', resume);
$('[data-restart]').addEventListener('click', () => start(true));
$('[data-again]').addEventListener('click', () => start(true));
$('[data-to-title]').addEventListener('click', title);
$('[data-quit]').addEventListener('click', () => { save(); if (mode === 'quest') questList(); else title(); });

// ---- Record: rank, moon calendar, achievements -----------------------------------

let calMonth = null;          // [year, month] shown in the calendar

function drawMoon(canvas, phase, lit) {
  const s = 26;
  canvas.width = canvas.height = Math.round(s * dpr);
  canvas.style.width = canvas.style.height = `${s}px`;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = s * 0.38, cx = s / 2, cy = s / 2;
  g.fillStyle = lit ? 'rgba(20,30,60,.9)' : 'rgba(255,255,255,.06)';
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  // The lit part: a half disc plus an ellipse that grows or eats into it.
  const light = lit ? '#f4e3a1' : 'rgba(243,234,216,.22)';
  const waxing = phase < 0.5;
  const k = Math.cos(phase * Math.PI * 2);       // 1 new, -1 full
  g.fillStyle = light;
  g.beginPath();
  g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !waxing);
  g.ellipse(cx, cy, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing ? true : false);
  g.fill();
}

function renderRecord() {
  const rk = rankOf(profile.stats.total);
  $('[data-rec-rank]').textContent = rk.rank.name;
  $('[data-rec-bar]').style.setProperty('--p', rk.progress.toFixed(3));
  $('[data-rec-next]').textContent = rk.next ? `あと ${rk.toNext.toLocaleString('ja-JP')}匹で「${rk.next.name}」（ウール +${rk.next.wool}）` : 'いちばん上のランクです';
  ranking($('[data-rec-ranking]'), null);
  $('[data-rec-ranking-empty]').hidden = leaderboard.top().length > 0;
  const v = profile.view(results);
  $('[data-rec-totals]').textContent = `数えた羊 ${v.total.toLocaleString('ja-JP')}匹 ・ 遊んだ夜 ${v.nights} ・ 1夜の最高 ${v.bestNight.toLocaleString('ja-JP')}匹`;
  // Calendar: this month by default; each day shows that night's real moon.
  const today = new Date();
  if (!calMonth) calMonth = [today.getFullYear(), today.getMonth()];
  const [y, m] = calMonth;
  $('[data-cal-title]').textContent = `${y}年${m + 1}月`;
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(Object.assign(document.createElement('span'), { className: 'cal-day is-blank' }));
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d, 22);
    const rec = profile.days[localDate(date)];
    const el = document.createElement('span');
    el.className = 'cal-day';
    el.classList.toggle('is-played', Boolean(rec));
    el.classList.toggle('is-today', localDate(date) === localDate(today));
    const moon = document.createElement('canvas');
    moon.setAttribute('aria-hidden', 'true');
    drawMoon(moon, moonPhase(date), Boolean(rec));
    const n = document.createElement('small');
    n.textContent = rec && rec.count ? rec.count.toLocaleString('ja-JP') : String(d);
    el.append(moon, n);
    el.setAttribute('aria-label', `${m + 1}月${d}日${rec ? `、${rec.count}匹数えた` : ''}`);
    cells.push(el);
  }
  $('[data-cal]').replaceChildren(...cells);
  // Achievements
  $('[data-ach-count]').textContent = `${profile.done.size} / ${ACHIEVEMENTS.length}`;
  $('[data-ach]').replaceChildren(...ACHIEVEMENTS.map(a => {
    const el = document.createElement('div');
    el.className = 'ach';
    const got = profile.done.has(a.id);
    el.classList.toggle('is-done', got);
    el.innerHTML = '<p class="ach-name"></p><p class="ach-text"></p><p class="ach-wool"></p>';
    el.querySelector('.ach-name').textContent = `${got ? '✓ ' : ''}${a.name}`;
    el.querySelector('.ach-text').textContent = a.text;
    el.querySelector('.ach-wool').textContent = `ウール ${a.wool}`;
    return el;
  }));
}

$('[data-record]').addEventListener('click', () => { calMonth = null; renderRecord(); show('record'); });
$('[data-record-back]').addEventListener('click', menu);
$('[data-cal-prev]').addEventListener('click', () => { const [y, m] = calMonth; calMonth = m ? [y, m - 1] : [y - 1, 11]; renderRecord(); });
$('[data-cal-next]').addEventListener('click', () => { const [y, m] = calMonth; calMonth = m < 11 ? [y, m + 1] : [y + 1, 0]; renderRecord(); });

// ---- Quests -------------------------------------------------------------------

const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

function questList() {
  flushPlayed();
  state = 'title';
  sound.stop();
  mood = nightMood = null;
  app.classList.remove('is-pinch', 'is-chance');
  const total = QUESTS.reduce((sum, q) => sum + (results[q.id] || 0), 0);
  $('[data-quest-total]').textContent = `クエスト　★ ${total} / ${QUESTS.length * 3}`;
  $('[data-quest-list]').replaceChildren(...QUESTS.map(q => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quest';
    const open = unlocked(results, q);
    btn.disabled = !open;
    btn.dataset.quest = q.id;
    const stars = results[q.id] || 0;
    btn.innerHTML = `<span class="quest-n">第${q.id}夜</span><span class="quest-name"></span><span class="quest-stars${stars ? '' : ' is-none'}">${open ? starText(stars) : 'まだ'}</span>`;
    btn.querySelector('.quest-name').textContent = q.name;
    btn.setAttribute('aria-label', `第${q.id}夜 ${q.name}、${open ? `星${stars}つ` : 'まだ遊べない'}`);
    return btn;
  }));
  storyCard();
  show('quests');
}

function questIntro(q) {
  quest = q;
  mode = 'quest';
  const night = isStoryNight(q);
  $('[data-qi-n]').textContent = night ? `第${q.n}夜　全${S.LAST_NIGHT}夜` : `第${q.id}夜`;
  $('[data-qi-name]').textContent = q.name;
  $('[data-qi-goal]').textContent = GOALS[q.goal].text(q.target);
  $('[data-qi-limit]').textContent = `群れは ${q.limit}個まで`;
  $('[data-qi-stars]').textContent = `★★ 群れを${q.stars[0]}個のこす　★★★ ${q.stars[1]}個のこす`;
  $('[data-qi-wool]').textContent = `はじめて取った★1つにつき ウール ${q.wool}`;
  const best = resultsOf(q)[q.id] || 0;
  $('[data-qi-best]').textContent = best ? `これまで ${starText(best)}` : '';
  storyLines($('[data-qi-story]'), night ? S.before(story, q.n) || [] : []);
  skipLinks(night);
  const saved = storage.get(QUEST_SAVE, null);
  $('[data-qi-continue]').hidden = !(saved && saved.game && saved.game.quest === q.id && !saved.game.over);
  show('qintro');
}

// Skipping a night is a purchase (purchases.js). It is offered only on a story night, never as a
// pop-up, and the scenes and questions around it still come.
let skipArmed = 0;
function skipLinks(night) {
  const own = night && purchases.owns('skip');
  const skip = $('[data-qi-skip]');
  skipArmed = 0;
  skip.textContent = 'この夜をとばす';
  skip.hidden = !own;
  $('[data-qi-skip-buy]').hidden = !(night && !own && purchases.available());
}

// The story moves on after a night is over (cleared or skipped): its lines, then the
// question that waits, or the next night.
function storyAfter(lines, pending) {
  const go = () => (pending ? storyAsk() : goNextNight());
  if (lines.length) storyScene({ lines, next: { label: pending ? 'つづきを読む' : `第${story.night}夜へ`, run: go } });
  else go();
}

function goNextNight() {
  const next = story.status === 'active' && !story.pending ? storyNightAt(story.night) : null;
  if (next) questIntro(next); else questList();
}

$('[data-qi-skip]').addEventListener('click', e => {
  if (!isStoryNight(quest) || !purchases.owns('skip')) return;
  const btn = e.currentTarget;
  // Two taps (the second within four seconds): it cannot happen by accident.
  if (!skipArmed) {
    const armed = skipArmed = performance.now();
    btn.textContent = 'もう一度タップで、とばす';
    setTimeout(() => { if (skipArmed === armed) { skipArmed = 0; btn.textContent = 'この夜をとばす'; } }, 4000);
    return;
  }
  skipArmed = 0;
  const r = S.skipNight(story, quest.n);
  if (r.state === story) { questList(); return; }
  story = r.state;
  saveStory();
  const saved = storage.get(QUEST_SAVE, null);
  if (saved && saved.game && saved.game.quest === quest.id) storage.remove(QUEST_SAVE);
  storyAfter(r.after, r.pending);
});
$('[data-qi-skip-buy]').addEventListener('click', () => purchasesOpen(() => questIntro(quest)));

$('[data-quests]').addEventListener('click', questList);
$('[data-quest-list]').addEventListener('click', e => {
  const btn = e.target.closest('[data-quest]');
  if (btn && !btn.disabled) questIntro(questById(Number(btn.dataset.quest)));
});
$('[data-quests-back]').addEventListener('click', menu);
$('[data-qi-back]').addEventListener('click', questList);
$('[data-qi-start]').addEventListener('click', () => { storage.remove(QUEST_SAVE); start(true); });
$('[data-qi-continue]').addEventListener('click', () => {
  const saved = storage.get(QUEST_SAVE, null);
  try { game = new Game(saved.game); } catch { game = null; }
  if (!game || game.quest !== quest.id) { start(true); return; }
  extra = saved.extra || 0;
  adFlocksUsed = Boolean(saved.adFlocksUsed);
  start(false);
});

// ---- ものがたり ----------------------------------------------------------------
// The story is optional and starts only when the player taps. Everything it
// says comes from story.js; here it is only shown. The sheep speaks ("I") and
// the player is "you"; every question has two or three answers, none typed.

function storyLines(el, lines) {
  el.textContent = lines.join('\n');
  el.hidden = !lines.length;
}

// One screen of the story: lines, then (after the last line has appeared)
// the choices or the buttons.
function storyScene({ eyebrow = 'ものがたり', lines, choices = [], next = null, later = null }) {
  const step = Math.min(0.45, 3.2 / lines.length);
  $('[data-story-eyebrow]').textContent = eyebrow;
  $('[data-sheet="story"]').style.setProperty('--story-wait', `${lines.length * step + 0.2}s`);
  $('[data-story-lines]').replaceChildren(...lines.map((t, i) => {
    const p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = `${i * step}s`;
    return p;
  }));
  $('[data-story-choices]').replaceChildren(...choices.map(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.textContent = c.label;
    b.addEventListener('click', c.run, { once: true });
    return b;
  }));
  const nextBtn = $('[data-story-next]');
  nextBtn.hidden = !next;
  if (next) { nextBtn.textContent = next.label; nextBtn.onclick = next.run; }
  const laterBtn = $('[data-story-later]');
  laterBtn.hidden = !later;
  if (later) { laterBtn.textContent = later.label; laterBtn.onclick = later.run; }
  show('story');
}

function storyPrologue() {
  storyScene({
    lines: S.PROLOGUE,
    next: { label: '夜をはじめる', run: () => { story = S.begin(story, localDate()); saveStory(); storyWord(); } },
    later: { label: 'やめておく', run: questList },
  });
}

function storyWord() {
  storyScene({
    lines: S.WORD.prompt,
    choices: Object.entries(S.WORRIES).map(([id, label]) => ({ label, run: () => storyWordPicked(id) })),
    later: { label: S.WORD.skip, run: () => storyWordPicked(null) },
  });
}

function storyWordPicked(id) {
  story = S.setWorry(story, id);
  saveStory();
  storyScene({
    lines: story.worry ? S.WORD.replyNamed : S.WORD.replyNone,
    next: { label: '第1夜へ', run: () => questIntro(storyNightAt(1)) },
  });
}

// The question that waits (after a night): the sheep asks, the player taps one answer.
function storyAsk() {
  const q = S.question(story);
  if (!q) { questList(); return; }
  storyScene({
    lines: q.prompt,
    choices: q.options.map(o => ({ label: o.label, run: () => storyAnswered(o.id) })),
  });
}

function storyAnswered(id) {
  const r = S.answer(story, id);
  story = r.state;
  saveStory();
  if (story.pending === 'dawn') {
    storyScene({ lines: r.reply, next: { label: '答え合わせへ', run: storyDawn } });
    return;
  }
  storyScene({ lines: r.reply, next: { label: `第${story.night}夜へ`, run: goNextNight } });
}

// After the last answer: the story ends when the player says so.
function storyDawn() {
  storyScene({ lines: S.DAWN, next: { label: '朝にする', run: storyFinish } });
}

function storyFinish() {
  const r = S.finish(story, localDate());
  if (!r.lines.length) { questList(); return; }
  story = r.state;
  saveStory();
  sound.sfx('dawn');
  storyScene({
    eyebrow: r.title,
    lines: r.lines,
    next: { label: '夜のしおりを見る', run: () => shioriShow(S.lastKeepsake(story)) },
    later: { label: '別の朝を見る', run: storyAnother },
  });
}

// The same night, the last question asked again: another morning.
function storyAnother() {
  story = S.reopen(story);
  saveStory();
  storyAsk();
}

function listRows(target, rows) {
  target.replaceChildren(...rows.map(([name, value]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = name;
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  }));
}

function foundMornings() {
  return S.ENDING_LIST.map(e => [e, story.seen.includes(e.id)]);
}

function shioriShow(k) {
  if (!k) { questList(); return; }
  const r = S.shiori(k);
  listRows($('[data-shiori-rows]'), r.rows);
  listRows($('[data-shiori-chosen]'), r.chosen);
  const memo = $('[data-shiori-memo]');
  memo.hidden = !r.memo.length;
  memo.textContent = r.memo.length ? `私のメモ：${r.memo.join('、')}` : '';
  $('[data-shiori-found-n]').textContent = `${story.seen.length} / ${S.ENDING_COUNT}`;
  $('[data-shiori-found]').replaceChildren(...foundMornings().map(([e, got]) => {
    const li = document.createElement('li');
    li.className = got ? 'is-found' : '';
    li.textContent = got ? e.title : '？';
    return li;
  }));
  $('[data-shiori-care]').textContent = S.CARE;
  $('[data-shiori-copy]').onclick = async () => {
    try { await navigator.clipboard.writeText(r.text); toast('しおりをコピーしました'); }
    catch { toast(r.text.split('\n')[1]); }
  };
  $('[data-shiori-another]').hidden = story.status !== 'ended';
  const past = story.status === 'ended' ? story.history : story.history.slice(1);
  $('[data-shiori-past-head]').hidden = !past.length;
  const list = $('[data-shiori-past]');
  list.hidden = !past.length;
  list.replaceChildren(...past.map(h => {
    const li = document.createElement('li');
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = (h.ended || h.started || '').replaceAll('-', '/').slice(5) || '—';
    b.textContent = S.endingTitle(h.ending) || '—';
    li.append(a, b);
    return li;
  }));
  show('shiori');
}

// "このものがたりについて": what it is not, and where the ideas come from.
let aboutBack = questList;
function storyAbout(back) {
  aboutBack = back;
  $('[data-about-lines]').replaceChildren(...S.ABOUT.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
  $('[data-about-sources]').replaceChildren(...S.SOURCES.map(([what, ref]) => {
    const li = document.createElement('li');
    const b = document.createElement('strong');
    b.textContent = what;
    li.append(b, document.createTextNode(ref));
    return li;
  }));
  show('storyabout');
}

// The card at the top of the quest list: start, go on, or look back.
let resetArmed = 0;
function storyCard() {
  const text = $('[data-story-card-text]');
  const main = $('[data-story-card-main]');
  const sub = $('[data-story-card-sub]');
  const reset = $('[data-story-card-reset]');
  const found = $('[data-story-card-found]');
  resetArmed = 0;
  reset.textContent = 'はじめからにする';
  sub.hidden = true;
  reset.hidden = true;
  found.hidden = !story.seen.length;
  found.textContent = `見つけた朝 ${story.seen.length} / ${S.ENDING_COUNT}`;
  if (story.status === 'active') {
    if (story.pending === 'dawn') { text.textContent = '最後の夜を、数えきりました。'; main.textContent = 'つづきを読む'; }
    else if (story.pending) { text.textContent = 'つづきがあります。'; main.textContent = 'つづきを読む'; }
    else { text.textContent = `第${story.night}夜から。（全${S.LAST_NIGHT}夜・ここまで ${S.formatPlayed(story.played)}）`; main.textContent = 'つづける'; }
    reset.hidden = false;
  } else if (story.status === 'ended') {
    text.textContent = `ものがたりは、おわりました。「${S.endingTitle(story.ending)}」`;
    main.textContent = 'しおりを見る';
    sub.textContent = 'もう一度、はじめる';
    sub.hidden = false;
  } else {
    text.textContent = `${S.LAST_NIGHT}の夜に、あなたと私（あなたの羊）の話を重ねます。ゆっくり、数時間かけて。途中でやめても、続きから。はじめるのも、終わらせるのも、あなたです。`;
    main.textContent = 'ものがたりを はじめる';
    if (story.history.length) { sub.textContent = 'しおりを見る'; sub.hidden = false; }
  }
}

$('[data-story-card-main]').addEventListener('click', () => {
  if (story.status === 'ended') { shioriShow(S.lastKeepsake(story)); return; }
  if (story.status !== 'active') { storyPrologue(); return; }
  if (story.pending === 'dawn') { storyDawn(); return; }
  if (story.pending) { storyAsk(); return; }
  goNextNight();
});
$('[data-story-card-sub]').addEventListener('click', () => {
  if (story.status === 'ended') storyPrologue();
  else shioriShow(S.lastKeepsake(story));
});
// Starting over asks twice (a second tap within four seconds), so it cannot happen by accident.
$('[data-story-card-reset]').addEventListener('click', e => {
  const btn = e.currentTarget;
  if (!resetArmed) {
    const armed = resetArmed = performance.now();
    btn.textContent = 'もう一度タップで、はじめから';
    setTimeout(() => { if (resetArmed === armed) { resetArmed = 0; btn.textContent = 'はじめからにする'; } }, 4000);
    return;
  }
  story = { ...S.fresh(), seen: story.seen, history: story.history };
  saveStory();
  storyCard();
});
$('[data-qc-story-next]').addEventListener('click', () => {
  if (story.pending === 'dawn') storyDawn();
  else if (story.pending) storyAsk();
  else goNextNight();
});
$('[data-shiori-back]').addEventListener('click', questList);
$('[data-shiori-another]').addEventListener('click', storyAnother);
for (const el of app.querySelectorAll('[data-story-about-open]')) {
  el.addEventListener('click', () => storyAbout(el.closest('[data-sheet="shiori"]') ? () => shioriShow(S.lastKeepsake(story)) : questList));
}
$('[data-about-back]').addEventListener('click', () => aboutBack());

function questEnd(o) {
  goodnight();
  sound.stop(0.3);
  mood = nightMood = null;
  app.classList.remove('is-pinch', 'is-chance');
  const p = progress(quest, game);
  if (o.state === 'clear') {
    state = 'over';
    storage.remove(QUEST_SAVE);
    const night = isStoryNight(quest);
    flushPlayed();
    const r = record(resultsOf(quest), quest, o.stars);
    if (night) { nightResults = r.results; storage.set(NIGHT_RESULTS, nightResults); }
    else { results = r.results; storage.set(RESULTS, results); }
    celebrate(profile.finished(results));
    saveProfile();
    if (r.wool) { wallet.earn(r.wool); saveWallet(); }
    sound.sfx('dawn');
    haptics.clear(3);
    $('[data-qc-n]').textContent = `第${nightNo(quest)}夜 ${quest.name}`;
    const stars = $('[data-qc-stars]');
    stars.replaceChildren(...[0, 1, 2].map(k => {
      const el = document.createElement('span');
      el.textContent = k < o.stars ? '★' : '☆';
      el.className = k < o.stars ? 'is-on' : '';
      el.style.animationDelay = `${0.15 + k * 0.18}s`;
      return el;
    }));
    stars.setAttribute('aria-label', `星${o.stars}つ`);
    $('[data-qc-left]').textContent = extra ? `群れを${extra}個たして クリア` : `群れを${o.left}個のこして クリア`;
    $('[data-qc-wool]').textContent = r.wool ? `ウール +${r.wool}（ぜんぶで ${wallet.wool.toLocaleString('ja-JP')}）` : '';
    // The story moves on only when this is the story's night (the fifteen quests are apart from it).
    // The black sheep that went home by the dog are in game.blacks too, so they are taken out.
    const sr = night
      ? S.afterNight(story, quest.n, { homed: Math.max(0, game.blacks - game.dogged), walked: game.walked, dogged: game.dogged })
      : { state: story, after: [], pending: null };
    if (sr.state !== story) { story = sr.state; saveStory(); }
    storyLines($('[data-qc-story]'), sr.after);
    $('[data-qc-story-next]').hidden = !sr.pending;
    const next = night ? (story.status === 'active' && !story.pending ? storyNightAt(story.night) : null) : questById(quest.id + 1);
    $('[data-qc-next]').hidden = !next || Boolean(sr.pending);
    $('[data-qc-next]').textContent = night && next ? `第${next.n}夜へ` : 'つぎの夜へ';
    show('qclear');
  } else {
    state = 'over';
    sound.sfx('over');
    haptics.over();
    flushPlayed();
    $('[data-qf-n]').textContent = `第${nightNo(quest)}夜 ${quest.name}`;
    $('[data-qf-why]').textContent = game.over ? '羊があふれた' : '群れを使いきった';
    $('[data-qf-progress]').textContent = `${GOALS[quest.goal].label} ${Math.min(p.value, p.target)} / ${p.target}`;
    // Five more flocks for an ad, once, if the field still has room.
    $('[data-qf-more]').hidden = game.over || adFlocksUsed || !ads.available();
    if (game.over) storage.remove(QUEST_SAVE);
    celebrate(profile.finished(results));
    saveProfile();
    show('qfail');
  }
  hud();
}

$('[data-qf-more]').addEventListener('click', async () => {
  const ok = await ads.showRewarded(app);
  if (!ok) return;
  extra += AD_FLOCKS;
  adFlocksUsed = true;
  sound.sfx('reward');
  toast(`群れが${AD_FLOCKS}個ふえました`);
  state = 'play';
  show(null);
  last = performance.now();
  sound.unlock();
  updateMood();
  save();
  hud();
});
for (const sel of ['[data-qc-again]', '[data-qf-again]']) $(sel).addEventListener('click', () => { storage.remove(QUEST_SAVE); start(true); });
for (const sel of ['[data-qc-list]', '[data-qf-list]']) $(sel).addEventListener('click', questList);
$('[data-qc-next]').addEventListener('click', () => {
  const next = isStoryNight(quest) ? (!story.pending ? storyNightAt(story.night) : null) : questById(quest.id + 1);
  if (next) questIntro(next);
});
$('[data-copy]').addEventListener('click', async () => {
  const text = `MOUTON・COUNT：${game.count.toLocaleString('ja-JP')}匹（${clock(game.count)}まで）`;
  try { await navigator.clipboard.writeText(text); toast('記録をコピーしました'); }
  catch { toast(text); }
});

// Leaving the app (switching apps, locking the phone) pauses and saves.
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); sound.suspend(); } });

// Music, sound effects and vibration can each be turned off (title and pause screens).
function renderSettings() {
  const labels = { music: '音楽', sfx: '効果音', vibe: '振動' };
  for (const btn of app.querySelectorAll('[data-setting]')) {
    const key = btn.dataset.setting;
    btn.setAttribute('aria-pressed', String(settings[key]));
    btn.textContent = `${labels[key]} ${settings[key] ? 'オン' : 'オフ'}`;
  }
}
for (const btn of app.querySelectorAll('[data-setting]')) {
  btn.addEventListener('click', () => {
    const key = btn.dataset.setting;
    settings[key] = !settings[key];
    storage.set(SETTINGS, settings);
    haptics.on = settings.vibe;
    sound.unlock();
    sound.apply(settings);
    if (key === 'sfx' && settings.sfx) sound.sfx('tap');
    if (key === 'vibe' && settings.vibe) haptics.buzz(20);
    renderSettings();
  });
}
renderSettings();

// "Check the sound": play a chime and a buzz, and say what state the sound is in.
for (const btn of app.querySelectorAll('[data-sound-test]')) {
  btn.addEventListener('click', () => {
    sound.unlock();
    sound.test();
    haptics.buzz([30, 60, 30]);
    const out = btn.closest('.sheet').querySelector('[data-sound-status]');
    out.textContent = '鳴らしています…';
    setTimeout(() => { out.textContent = sound.status(); }, 400);
  });
}
// ---- 購入（夜をとばす・広告なし） ------------------------------------------------
// Two purchases, each bought once (purchases.js). Nothing here is a pop-up: the screen is
// opened from the menu, the story card, or the small link on a story night. With no store
// (a browser, or an app whose products are not set up yet) none of it is shown.

let purchasesBack = menu;
function purchasesOpen(back) {
  purchasesBack = back;
  renderPurchases();
  show('purchases');
}

function renderPurchases(msg = '') {
  $('[data-purchases-free]').textContent = FREE_NOTE;
  $('[data-purchases-test]').hidden = purchases.mode !== 'test';
  $('[data-purchases-msg]').textContent = msg;
  $('[data-wares]').replaceChildren(...WARE_IDS.map(id => {
    const own = purchases.owns(id);
    const el = document.createElement('div');
    el.className = `ware${own ? ' is-owned' : ''}`;
    const h = document.createElement('h3');
    const p = document.createElement('p');
    const b = document.createElement('button');
    h.textContent = WARES[id].name;
    p.textContent = WARES[id].text;
    b.type = 'button';
    b.className = 'btn';
    b.disabled = own;
    b.textContent = own ? '購入ずみ' : `${purchases.price(id)}　買う`.trim();
    b.addEventListener('click', async () => {
      b.disabled = true;
      const r = await purchases.buy(id);
      renderPurchases(r.ok ? `${WARES[id].name}を、使えるようになりました。`
        : r.reason === 'cancelled' ? '購入は、しませんでした。'
        : '購入できませんでした。時間をおいて、もう一度お試しください。');
    });
    el.append(h, p, b);
    return el;
  }));
}

// What the screens show depends on what is bought and on whether the store is there.
function applyPurchases() {
  const can = purchases.available();
  $('[data-purchases]').hidden = !can;
  $('[data-purchases-open]').hidden = !can;
  // "No ads": the same buttons, now simply giving what the ad would have given.
  for (const [sel, free] of [['[data-double]', 'ウール2倍をもらう'], ['[data-qf-more]', '群れ+5をもらう']]) {
    const el = $(sel);
    el.dataset.adText ??= el.textContent;
    el.textContent = ads.free() ? free : el.dataset.adText;
  }
  hud();
}
purchases.onChange(applyPurchases);
purchases.load().then(applyPurchases);
applyPurchases();

for (const el of app.querySelectorAll('[data-purchases], [data-purchases-open]')) {
  el.addEventListener('click', () => purchasesOpen(el.closest('[data-sheet="quests"]') ? questList : menu));
}
$('[data-purchases-back]').addEventListener('click', () => purchasesBack());
$('[data-purchases-restore]').addEventListener('click', async () => {
  $('[data-purchases-msg]').textContent = '調べています…';
  const r = await purchases.restore();
  renderPurchases(!r.ok ? '調べられませんでした。時間をおいて、もう一度お試しください。'
    : r.found.length ? `購入ずみ：${r.found.map(id => WARES[id].name).join('、')}` : '復元できる購入は、見つかりませんでした。');
});

// ---- 引き継ぎ（コードをコピーして、別のスマホで読み込む） ----------------------------
// The whole save as one piece of text (transfer.js). No account, no server. Purchases are
// not in it (the store gives them back). Loading replaces what is on this phone, so it shows
// what the code holds and asks first.

let transferEntries = null;
const transferMsg = text => { $('[data-transfer-msg]').textContent = text; };
const TRANSFER_REASONS = {
  empty: 'コードが入っていません。',
  format: 'ムートン・カウントのコードではないようです。コピーし直してみてください。',
  damaged: 'コードが途中で切れているか、文字が違っているようです。もう一度コピーしてください。',
  version: 'このコードは、このバージョンでは読み込めません。',
  invalid: 'コードの中身を読み込めませんでした。',
};

function transferOpen() {
  transferEntries = null;
  $('[data-transfer-paste]').hidden = true;
  $('[data-transfer-confirm]').hidden = true;
  $('[data-transfer-text]').value = '';
  transferMsg('');
  show('transfer');
}

$('[data-transfer]').addEventListener('click', transferOpen);
$('[data-transfer-back]').addEventListener('click', menu);

$('[data-transfer-copy]').addEventListener('click', async () => {
  flushPlayed();
  const entries = {};
  for (const k of storage.keys()) if (T.wanted(k)) entries[k] = storage.raw(k);
  const code = T.pack(entries, new Date().toISOString());
  $('[data-transfer-confirm]').hidden = true;
  try {
    await navigator.clipboard.writeText(code);
    $('[data-transfer-paste]').hidden = true;
    transferMsg('コードをコピーしました。新しいスマホで「コードを読み込む」から貼り付けてください。メモ帳などに貼っておくと、なくしません。');
  } catch {
    // The phone would not let the page copy: show the code to be copied by hand.
    const box = $('[data-transfer-text]');
    $('[data-transfer-paste]').hidden = false;
    box.value = code;
    box.focus();
    box.select();
    transferMsg('自動でコピーできませんでした。下の文字を、すべて選んでコピーしてください。');
  }
});

$('[data-transfer-read]').addEventListener('click', async () => {
  $('[data-transfer-confirm]').hidden = true;
  $('[data-transfer-paste]').hidden = false;
  const box = $('[data-transfer-text]');
  box.value = '';
  transferMsg('コードを貼り付けて、「このコードを調べる」を押してください。');
  try {
    const text = await navigator.clipboard.readText();
    if (/^\s*MOUTON1\./.test(text)) box.value = text.trim();
  } catch {}      // the phone may not allow reading: the player pastes by hand
  box.focus();
});

$('[data-transfer-go]').addEventListener('click', () => {
  const r = T.unpack($('[data-transfer-text]').value);
  if (!r.ok) { transferMsg(TRANSFER_REASONS[r.reason]); $('[data-transfer-confirm]').hidden = true; return; }
  transferEntries = r.entries;
  const sum = T.summarize(r.entries);
  const parts = [
    sum.story === 'ended' ? 'ものがたり：おわりました' : sum.story === 'active' ? `ものがたり：第${sum.night}夜まで（遊んだ時間 ${S.formatPlayed(sum.played)}）` : 'ものがたり：まだはじめていません',
    `ウール ${sum.wool.toLocaleString('ja-JP')}`,
  ];
  $('[data-transfer-summary]').textContent = `${r.date ? `${r.date.replaceAll('-', '/')} のコードです。` : ''}${parts.join('　')}\nこのスマホの記録は、これに置きかえられます。`;
  $('[data-transfer-confirm]').hidden = false;
  $('[data-transfer-confirm]').scrollIntoView({ block: 'nearest' });
  transferMsg('');
});

$('[data-transfer-cancel]').addEventListener('click', () => {
  transferEntries = null;
  $('[data-transfer-confirm]').hidden = true;
  transferMsg('読み込みは、やめました。');
});

$('[data-transfer-apply]').addEventListener('click', () => {
  if (!transferEntries) return;
  const entries = transferEntries;
  transferEntries = null;
  T.apply(entries, { keys: () => storage.keys(), set: (k, v) => storage.setRaw(k, v), remove: k => storage.remove(k) });
  $('[data-transfer-confirm]').hidden = true;
  $('[data-transfer-paste]').hidden = true;
  transferMsg('読み込みました。開き直します…');
  // A moment for the phone's own storage to finish writing, then start again from what was loaded.
  setTimeout(() => location.reload(), 900);
});

addEventListener('resize', layout);

layout();
// Android's back button: put the whistle away, pause, or go back one page.
// On the title it closes the app (returns false).
onBack(() => {
  if (state === 'pick') { endPick(); return true; }
  if (state === 'play') { pause(); return true; }
  if (state === 'pause') { resume(); return true; }
  const open = app.querySelector('.sheet:not([hidden])');
  const name = open?.dataset.sheet;
  if (!name || name === 'title') return false;
  const back = open.querySelector('.sheet-back');
  if (back) back.click();
  else if (mode === 'quest') questList();
  else title();
  return true;
});

title();
hud();
requestAnimationFrame(frame);
