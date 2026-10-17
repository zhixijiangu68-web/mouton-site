// MOUTON・LEAP drawing. Everything is drawn from one `view` (a Run, or a
// stand-in on the title screen). The meadow is seen from behind the sheep:
// z = 0 is the sheep, bigger z runs away towards the horizon.
//
// Objects are drawn in "lane units": after ctx.scale(u, u) one unit is one
// lane width at that depth, so shapes are written once and scale themselves.
import { SPAWN_Z } from './core.js';

const TAU = Math.PI * 2;
const ZC = 9;                                   // perspective strength
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hash = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

export function layout(W, H) {
  return { W, H, cx: W / 2, hy: H * 0.31, py: H * 0.8, lw: Math.min(W * 0.31, H * 0.2) };
}

export function project(L, z, lane = 0) {
  const sc = 1 / (1 + Math.max(z, -3) / ZC);
  return { x: L.cx + lane * L.lw * sc, y: L.hy + (L.py - L.hy) * sc, sc, u: L.lw * sc };
}

const STAR_COUNT = 56;

// The sky never changes, so it is painted once per size.
export function buildSky(L, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(L.W * dpr);
  c.height = Math.ceil(L.H * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);

  const sky = g.createLinearGradient(0, 0, 0, L.hy);
  sky.addColorStop(0, '#030814');
  sky.addColorStop(0.55, '#0a1b3a');
  sky.addColorStop(1, '#2a4a7c');
  g.fillStyle = sky;
  g.fillRect(0, 0, L.W, L.hy + 2);

  const mx = L.W * 0.72, my = L.hy * 0.42, mr = Math.min(L.W * 0.1, 48);
  const glow = g.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 5);
  glow.addColorStop(0, 'rgba(244,227,161,.30)');
  glow.addColorStop(1, 'rgba(244,227,161,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, L.W, L.hy + 2);

  // Crescent: the moon disc minus a second disc nudged to the upper left.
  g.save();
  g.beginPath();
  g.arc(mx, my, mr, 0, TAU);
  g.clip();
  g.fillStyle = '#f4e3a1';
  g.beginPath();
  g.rect(mx - mr, my - mr, mr * 2, mr * 2);
  g.arc(mx - mr * 0.42, my - mr * 0.16, mr * 0.86, 0, TAU, true);
  g.fill('evenodd');
  g.restore();

  const hill = (base, amp, seed, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, L.hy + 2);
    for (let x = 0; x <= L.W + 8; x += 8) {
      const y = L.hy - base - amp * (0.55 * Math.sin(x / L.W * 5 + seed) + 0.45 * Math.sin(x / L.W * 11 + seed * 2.3));
      g.lineTo(x, y);
    }
    g.lineTo(L.W + 8, L.hy + 2);
    g.closePath();
    g.fill();
  };
  hill(14, 12, 1.2, '#0d2342');
  hill(4, 8, 4.1, '#0a1c36');
  return c;
}

function drawStars(ctx, L, t) {
  ctx.fillStyle = '#f9e9b4';
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = hash(i) * L.W, y = hash(i + 100) * L.hy * 0.8;
    const r = 0.5 + hash(i + 200) * 1.1;
    ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (0.8 + hash(i + 300)) + i));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGround(ctx, L, dist) {
  const { W, H, hy } = L;
  const gg = ctx.createLinearGradient(0, hy, 0, H);
  gg.addColorStop(0, '#1a4358');
  gg.addColorStop(0.3, '#10313f');
  gg.addColorStop(1, '#0a1f2a');
  ctx.fillStyle = gg;
  ctx.fillRect(0, hy, W, H - hy);

  // Bands sliding towards us give the speed.
  const BAND = 6;
  const off = dist % (BAND * 2);
  ctx.fillStyle = 'rgba(244,227,161,.035)';
  for (let z0 = -off; z0 < SPAWN_Z + 30; z0 += BAND * 2) {
    const a = project(L, z0), b = project(L, z0 + BAND);
    ctx.fillRect(0, b.y, W, a.y - b.y);
  }

  // The track: a darker strip three lanes wide, with dashed lane lines.
  const far = project(L, 4000), near = project(L, -3);
  ctx.fillStyle = 'rgba(6,13,30,.34)';
  ctx.beginPath();
  ctx.moveTo(L.cx - 1.5 * L.lw * far.sc, far.y);
  ctx.lineTo(L.cx + 1.5 * L.lw * far.sc, far.y);
  ctx.lineTo(L.cx + 1.5 * L.lw * near.sc, near.y);
  ctx.lineTo(L.cx - 1.5 * L.lw * near.sc, near.y);
  ctx.closePath();
  ctx.fill();

  ctx.lineCap = 'round';
  const DASH = 3;
  const o2 = dist % (DASH * 2);
  for (const lane of [-0.5, 0.5]) {
    for (let z0 = -o2; z0 < SPAWN_Z + 30; z0 += DASH * 2) {
      const a = project(L, z0, lane), b = project(L, z0 + DASH, lane);
      ctx.strokeStyle = `rgba(243,234,216,${0.1 + 0.12 * a.sc})`;
      ctx.lineWidth = Math.max(1, 0.035 * L.lw * a.sc);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  for (const lane of [-1.5, 1.5]) {
    const a = project(L, 4000, lane), b = project(L, -3, lane);
    ctx.strokeStyle = 'rgba(244,227,161,.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Grass tufts at the sides, every few units, so the edges move too.
  const TUFT = 4.5;
  const first = Math.floor(dist / TUFT);
  ctx.strokeStyle = 'rgba(88,150,140,.55)';
  for (let i = first; i < first + (SPAWN_Z + 20) / TUFT; i++) {
    const z = i * TUFT - dist;
    if (z < -2) continue;
    for (const side of [-1, 1]) {
      const lane = side * (2 + hash(i * 2 + (side > 0 ? 1 : 0)) * 2.4);
      const p = project(L, z, lane);
      const h = 0.16 * p.u;
      ctx.lineWidth = Math.max(1, 0.025 * p.u);
      ctx.beginPath();
      ctx.moveTo(p.x - 0.05 * p.u, p.y); ctx.lineTo(p.x - 0.09 * p.u, p.y - h);
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h * 1.25);
      ctx.moveTo(p.x + 0.05 * p.u, p.y); ctx.lineTo(p.x + 0.09 * p.u, p.y - h);
      ctx.stroke();
    }
  }
}

function drawFireflies(ctx, L, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const x = hash(i + 500) * L.W + Math.sin(t * 0.35 + i * 1.7) * 22;
    const y = L.hy + (L.H - L.hy) * (0.08 + hash(i + 600) * 0.6) + Math.cos(t * 0.45 + i) * 12;
    const a = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.1));
    ctx.fillStyle = `rgba(244,200,90,${a * 0.14})`;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,244,196,${a})`;
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function enter(ctx, p, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.scale(p.u, p.u);
}

const shadow = (ctx, rx, ry = rx * 0.22, a = 0.34) => {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0.012, rx, ry, 0, 0, TAU); ctx.fill();
};

function drawRock(ctx, p, alpha) {
  enter(ctx, p, alpha);
  shadow(ctx, 0.38);
  const g = ctx.createLinearGradient(0.3, -0.5, -0.3, 0);
  g.addColorStop(0, '#93a3c0');
  g.addColorStop(0.5, '#51617f');
  g.addColorStop(1, '#222d47');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-0.31, 0);
  ctx.bezierCurveTo(-0.37, -0.28, -0.22, -0.5, -0.02, -0.5);
  ctx.bezierCurveTo(0.2, -0.52, 0.37, -0.3, 0.31, 0);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 0.018;
  ctx.strokeStyle = 'rgba(8,14,32,.5)';
  ctx.beginPath();
  ctx.moveTo(-0.04, -0.5); ctx.lineTo(-0.1, -0.24); ctx.lineTo(0.04, -0.02);
  ctx.moveTo(-0.1, -0.24); ctx.lineTo(-0.24, -0.16);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(244,227,161,.42)';
  ctx.beginPath();
  ctx.moveTo(0.04, -0.5);
  ctx.bezierCurveTo(0.22, -0.5, 0.34, -0.3, 0.29, -0.1);
  ctx.stroke();
  ctx.fillStyle = '#34425f';
  ctx.beginPath(); ctx.ellipse(-0.37, -0.04, 0.09, 0.06, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// A fence made of neighbours in the same row joins up: posts only at the
// ends of the run plus one per lane, rails all the way across.
function drawFence(ctx, p, alpha, left, right) {
  enter(ctx, p, alpha);
  const l = left ? -0.5 : -0.44, r = right ? 0.5 : 0.44;
  shadow(ctx, 0.5, 0.07, 0.3);
  const rail = (y0, y1) => {
    ctx.fillStyle = '#9a774f';
    ctx.fillRect(l, y0, r - l, y1 - y0);
    ctx.fillStyle = 'rgba(244,227,161,.45)';
    ctx.fillRect(l, y0, r - l, 0.012);
    ctx.fillStyle = 'rgba(6,10,24,.28)';
    ctx.fillRect(l, y1 - 0.016, r - l, 0.016);
  };
  const post = (x, h) => {
    ctx.fillStyle = '#6f5238';
    ctx.fillRect(x - 0.04, -h, 0.08, h);
    ctx.fillStyle = 'rgba(244,227,161,.4)';
    ctx.fillRect(x + 0.012, -h, 0.014, h);
  };
  post(0, 0.46);
  if (!left) post(l + 0.03, 0.46);
  if (!right) post(r - 0.03, 0.46);
  rail(-0.21, -0.14);
  rail(-0.37, -0.3);
  ctx.restore();
}

function drawStarShape(ctx, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.46 : r;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawStar(ctx, p, alpha, t, i) {
  enter(ctx, p, alpha);
  const bob = Math.sin(t * 3 + i) * 0.03;
  ctx.translate(0, -0.4 + bob);
  shadow(ctx, 0.12, 0.03, 0.2);
  ctx.translate(0, 0.0);
  const g = ctx.createRadialGradient(0, 0, 0.02, 0, 0, 0.34);
  g.addColorStop(0, 'rgba(244,227,161,.5)');
  g.addColorStop(1, 'rgba(244,227,161,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 0.34, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f7e7a8';
  ctx.strokeStyle = '#d9b45a';
  ctx.lineWidth = 0.02;
  ctx.lineJoin = 'round';
  drawStarShape(ctx, 0.16, Math.sin(t * 2 + i) * 0.25);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const LIMB = '#5b4a60';
const WOOL = [[0, 0, 0.27], [-0.17, 0.05, 0.2], [0.17, 0.05, 0.2], [-0.1, -0.14, 0.19], [0.1, -0.14, 0.19], [0, 0.13, 0.21], [-0.21, -0.07, 0.15], [0.21, -0.07, 0.15]];

// The sheep seen from behind: a cloud of wool, two ears and the top of the
// head showing over the back, two hind legs under it.
export function drawSheep(ctx, p, { h = 0, phase = 0, dead = -1, tilt = 0 } = {}) {
  enter(ctx, p, dead >= 0 ? clamp(1 - dead * 1.8, 0, 1) : 1);
  const air = h > 0.02;
  shadow(ctx, 0.3 * (1 - clamp(h, 0, 1.2) * 0.3), 0.07 * (1 - clamp(h, 0, 1.2) * 0.3), 0.36 * (1 - clamp(h, 0, 1.2) * 0.3));
  const bob = air ? 0 : Math.abs(Math.sin(phase)) * 0.035;
  const cy = -0.37 - bob - h * 0.62;
  ctx.translate(0, cy);
  if (dead >= 0) ctx.rotate(Math.min(dead * 9, 2.6));
  else ctx.rotate(tilt * 0.12);

  // hind legs
  ctx.fillStyle = LIMB;
  const stride = Math.sin(phase);
  for (const side of [-1, 1]) {
    const lift = air ? -0.05 : Math.max(0, stride * side) * 0.06;
    const len = air ? 0.09 : -cy - 0.2 - lift;
    ctx.beginPath();
    ctx.roundRect(side * 0.12 - 0.04, 0.2, 0.08, Math.max(0.05, len), 0.035);
    ctx.fill();
  }
  // head and ears (behind the wool)
  const flap = Math.sin(phase * 2) * 0.12 + (air ? -0.25 : 0);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 0.17, -0.36);
    ctx.rotate(side * (0.5 + flap));
    ctx.fillStyle = LIMB;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.1, 0.045, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9a9a0';
    ctx.beginPath(); ctx.ellipse(side * 0.012, 0, 0.065, 0.02, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = LIMB;
  ctx.beginPath(); ctx.ellipse(0, -0.38, 0.125, 0.11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(244,227,161,.28)';
  ctx.beginPath(); ctx.ellipse(0.05, -0.41, 0.05, 0.03, -0.4, 0, TAU); ctx.fill();

  // wool: a shaded copy underneath, then the cream, then the moonlit side
  ctx.fillStyle = '#b9b5bd';
  for (const [x, y, r] of WOOL) { ctx.beginPath(); ctx.arc(x - 0.01, y + 0.025, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#f3ead8';
  for (const [x, y, r] of WOOL) { ctx.beginPath(); ctx.arc(x, y, r * 0.96, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,248,225,.7)';
  for (const [x, y, r] of WOOL.slice(2, 5)) { ctx.beginPath(); ctx.arc(x + 0.04, y - 0.03, r * 0.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Draw one frame. view: { dist, x, height, things, ... }; opts.shake: [dx, dy]
export function drawFrame(ctx, L, sky, view, t, opts = {}) {
  const { W, H } = L;
  ctx.save();
  if (opts.shake) ctx.translate(opts.shake[0], opts.shake[1]);
  ctx.drawImage(sky, 0, 0, W, H);
  drawStars(ctx, L, t);
  drawGround(ctx, L, view.dist);
  drawFireflies(ctx, L, t);

  // Things far to near; the sheep sits at z = 0, things already past it are drawn over it.
  const things = view.things.filter(th => th.z < SPAWN_Z + 2 && th.z > -3.5).sort((a, b) => b.z - a.z);
  const fences = new Set(things.filter(th => th.type === 'fence').map(th => th.row + ':' + th.lane));
  let sheepDone = false;
  const sheep = () => {
    sheepDone = true;
    drawSheep(ctx, project(L, 0, view.x), { h: view.height, phase: view.t * 14, dead: opts.dead ?? -1, tilt: (view.target - view.x) });
  };
  things.forEach((th, i) => {
    if (!sheepDone && th.z < 0) sheep();
    const p = project(L, th.z, th.lane);
    const alpha = clamp((SPAWN_Z - th.z) / 8, 0, 1) * clamp((th.z + 3.5) / 2, 0, 1);
    if (th.type === 'rock') drawRock(ctx, p, alpha);
    else if (th.type === 'fence') drawFence(ctx, p, alpha, fences.has(th.row + ':' + (th.lane - 1)), fences.has(th.row + ':' + (th.lane + 1)));
    else drawStar(ctx, p, alpha, t, i);
  });
  if (!sheepDone) sheep();

  // Soft vignette keeps the eye on the track.
  const v = ctx.createRadialGradient(W / 2, H * 0.62, H * 0.25, W / 2, H * 0.62, H * 0.85);
  v.addColorStop(0, 'rgba(3,8,20,0)');
  v.addColorStop(1, 'rgba(3,8,20,.5)');
  ctx.fillStyle = v;
  ctx.fillRect(-10, -10, W + 20, H + 20);
  ctx.restore();
}
