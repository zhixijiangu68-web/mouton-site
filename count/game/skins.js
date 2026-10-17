// How each look is drawn on a canvas: drawBlock(g, x, y, size, v, skinId).
// v is 1–4 for white sheep (four soft tints) and BLACK for a black sheep.
// Every look keeps the white ones light and the black one dark.
import { BLACK, GOLD } from './core.js';

const TAU = Math.PI * 2;

// A soft cloud: an oval with puffs around it.
function cloud(g, s, color, rx = 0.3, ry = 0.25, n = 11, pr = 0.14, dy = 0) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, dy * s, rx * s, ry * s, 0, 0, TAU);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    const px = Math.cos(a) * (rx - 0.03) * s, py = Math.sin(a) * (ry - 0.04) * s - 0.02 * s + dy * s;
    g.moveTo(px + pr * s, py);
    g.arc(px, py, pr * s, 0, TAU);
  }
  g.fill();
}

function dots(g, s, color, pts, r) {
  g.fillStyle = color;
  g.beginPath();
  for (const [x, y] of pts) { g.moveTo(x * s + r * s, y * s); g.arc(x * s, y * s, r * s, 0, TAU); }
  g.fill();
}

function star(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU - Math.PI / 2, rr = k % 2 ? r * 0.4 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

// The classic sheep face (head, ears, tuft, eyes); eyes can be closed.
function sheepFace(g, s, wool, dark, closed = false) {
  g.fillStyle = dark;
  g.beginPath();
  g.ellipse(-0.17 * s, -0.02 * s, 0.08 * s, 0.045 * s, -0.4, 0, TAU);
  g.ellipse(0.17 * s, -0.02 * s, 0.08 * s, 0.045 * s, 0.4, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, 0.04 * s, 0.13 * s, 0.16 * s, 0, 0, TAU);
  g.fill();
  dots(g, s, wool, [[-0.05, -0.1], [0.05, -0.1]], 0.06);
  if (closed) {
    g.strokeStyle = '#fffaf0';
    g.lineWidth = Math.max(1, s * 0.022);
    g.lineCap = 'round';
    g.beginPath();
    g.arc(-0.05 * s, 0.015 * s, 0.028 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    g.moveTo(0.078 * s, 0.025 * s);
    g.arc(0.05 * s, 0.015 * s, 0.028 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  } else {
    dots(g, s, '#fffaf0', [[-0.05, 0.02], [0.05, 0.02]], 0.022);
  }
}

function legs(g, s, dark) {
  g.fillStyle = dark;
  for (const lx of [-0.14, 0.12]) g.fillRect(lx * s, 0.24 * s, 0.06 * s, 0.17 * s);
}

const PAINT = {
  sheep(g, s, v) {
    const black = v === BLACK;
    const wool = black ? '#3b3e4f' : ['#f7f0e1', '#eee0c2', '#e0e6ee', '#e8dccb'][v - 1];
    const dark = black ? '#141419' : '#2a2833';
    legs(g, s, dark);
    cloud(g, s, wool);
    g.fillStyle = black ? 'rgba(0,0,0,.25)' : 'rgba(120,96,60,.12)';
    g.beginPath();
    g.ellipse(0, 0.14 * s, 0.26 * s, 0.1 * s, 0, 0, Math.PI);
    g.fill();
    sheepFace(g, s, wool, dark);
  },

  sleepy(g, s, v) {
    const black = v === BLACK;
    const wool = black ? '#383a4c' : ['#fbf3e6', '#f3e6cf', '#e6ebf3', '#efe1d2'][v - 1];
    const dark = black ? '#121217' : '#2e2b36';
    legs(g, s, dark);
    cloud(g, s, wool);
    sheepFace(g, s, wool, dark, true);
    // Rosy cheeks and a small "z".
    dots(g, s, black ? 'rgba(220,120,130,.45)' : 'rgba(232,140,140,.55)', [[-0.09, 0.09], [0.09, 0.09]], 0.025);
    g.fillStyle = black ? 'rgba(200,205,230,.85)' : 'rgba(80,90,140,.75)';
    g.font = `700 ${Math.round(s * 0.2)}px system-ui, sans-serif`;
    g.fillText('z', 0.2 * s, -0.22 * s);
  },

  yarn(g, s, v) {
    const black = v === BLACK;
    const base = black ? '#2b3150' : ['#f4ead6', '#f0d9a8', '#d9e3f3', '#efd2c8'][v - 1];
    const line = black ? 'rgba(150,160,210,.45)' : 'rgba(110,80,50,.28)';
    g.fillStyle = base;
    g.beginPath();
    g.arc(0, 0.02 * s, 0.36 * s, 0, TAU);
    g.fill();
    g.strokeStyle = line;
    g.lineWidth = Math.max(1, s * 0.035);
    g.save();
    g.beginPath();
    g.arc(0, 0.02 * s, 0.36 * s, 0, TAU);
    g.clip();
    for (let k = -3; k <= 3; k++) {
      g.beginPath();
      g.ellipse(k * 0.11 * s, 0.02 * s, 0.07 * s, 0.4 * s, 0.5, 0, TAU);
      g.stroke();
    }
    g.restore();
    // The loose end of the thread.
    g.beginPath();
    g.moveTo(0.3 * s, 0.22 * s);
    g.quadraticCurveTo(0.44 * s, 0.32 * s, 0.38 * s, 0.44 * s);
    g.strokeStyle = base;
    g.lineWidth = Math.max(1, s * 0.04);
    g.stroke();
  },

  cloud(g, s, v) {
    const black = v === BLACK;
    const color = black ? '#4a4e63' : ['#ffffff', '#f6f1ff', '#eef5ff', '#fff6ee'][v - 1];
    cloud(g, s, color, 0.36, 0.2, 9, 0.16, 0.06);
    dots(g, s, color, [[-0.12, -0.1], [0.1, -0.12]], 0.15);
    // A sleepy face.
    g.strokeStyle = black ? '#d9dcef' : '#4b4f66';
    g.lineWidth = Math.max(1, s * 0.025);
    g.lineCap = 'round';
    g.beginPath();
    g.arc(-0.09 * s, 0.04 * s, 0.035 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    g.moveTo(0.125 * s, 0.05 * s);
    g.arc(0.09 * s, 0.04 * s, 0.035 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    dots(g, s, black ? 'rgba(220,130,150,.45)' : 'rgba(240,150,160,.5)', [[-0.17, 0.11], [0.17, 0.11]], 0.03);
  },

  star(g, s, v) {
    const black = v === BLACK;
    const wool = black ? '#1f2752' : ['#e8ecff', '#efe8ff', '#e3f1ff', '#f2eaf6'][v - 1];
    const dark = black ? '#0c0f24' : '#28284a';
    legs(g, s, dark);
    cloud(g, s, wool);
    star(g, -0.2 * s, -0.17 * s, 0.07 * s, '#f4d77a');
    star(g, 0.23 * s, 0.12 * s, 0.05 * s, '#f4d77a');
    if (black) star(g, 0.18 * s, -0.2 * s, 0.045 * s, '#f9e9b0');
    sheepFace(g, s, wool, dark);
  },

  gold(g, s, v) {
    const black = v === BLACK;
    const grad = g.createLinearGradient(0, -0.3 * s, 0, 0.3 * s);
    if (black) { grad.addColorStop(0, '#5a4a35'); grad.addColorStop(1, '#2e251a'); }
    else {
      const top = ['#fff1b8', '#ffe9a3', '#fff4c9', '#ffe7b0'][v - 1];
      grad.addColorStop(0, top);
      grad.addColorStop(1, '#d9a441');
    }
    const dark = black ? '#16110b' : '#3b2a14';
    legs(g, s, dark);
    cloud(g, s, grad);
    dots(g, s, black ? 'rgba(255,220,150,.25)' : 'rgba(255,255,255,.7)', [[-0.18, -0.16]], 0.035);
    sheepFace(g, s, black ? '#5a4a35' : '#ffe9a3', dark);
  },
};

export function drawBlock(g, x, y, s, v, skin = 'sheep') {
  g.save();
  g.translate(x + s / 2, y + s / 2);
  if (v === GOLD) paintGolden(g, s, skin);
  else (PAINT[skin] || PAINT.sheep)(g, s, v);
  g.restore();
}

// A golden sheep in any look: a halo, the light version washed with gold
// (paler in the gold look, so it still stands out), and a sparkle.
function paintGolden(g, s, skin) {
  const halo = g.createRadialGradient(0, 0, s * 0.1, 0, 0, s * 0.5);
  halo.addColorStop(0, 'rgba(255,220,120,.55)');
  halo.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = halo;
  g.fillRect(-s / 2, -s / 2, s, s);
  const layer = document.createElement('canvas');
  layer.width = layer.height = Math.ceil(s * 2);
  const l = layer.getContext('2d');
  l.scale(2, 2);
  l.translate(s / 2, s / 2);
  (PAINT[skin] || PAINT.sheep)(l, s, 1);
  l.globalCompositeOperation = 'source-atop';
  l.fillStyle = skin === 'gold' ? 'rgba(255,252,235,.55)' : 'rgba(255,200,60,.55)';
  l.fillRect(-s / 2, -s / 2, s, s);
  g.drawImage(layer, -s / 2, -s / 2, s, s);
  star(g, 0.24 * s, -0.24 * s, 0.09 * s, '#fffbe6');
  star(g, -0.27 * s, 0.16 * s, 0.05 * s, '#fff3c0');
}
