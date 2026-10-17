// Makes leap/icon.png (512x512) and leap/og.png (1200x630) for MOUTON・LEAP.
// The pictures come from the game's own drawing code (leap/game/draw.js), so
// they match what is on screen.
//   cd scripts/og && npm install && node leap-images.mjs
// Needs a Chromium for Playwright (CHROME_PATH to pick one).
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage();
await page.goto(origin + '/leap/', { waitUntil: 'load' });
await page.addStyleTag({ url: origin + '/scripts/og/node_modules/@fontsource/noto-serif-jp/300.css' });

const draw = async kind => page.evaluate(async kind => {
  const { drawFrame, buildSky } = await import('/leap/game/draw.js');
  await document.fonts.load('300 64px "Noto Serif JP"', 'MOUTON・LEAP月夜を駆けて、柵を跳ぶ。');
  const W = kind === 'icon' ? 512 : 1200, H = kind === 'icon' ? 512 : 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  if (kind === 'icon') {
    // A big sheep against the horizon, mid-leap, under the crescent.
    const L = { W, H, cx: W / 2, hy: H * 0.42, py: H * 0.86, lw: 250 };
    const view = { dist: 3, x: 0, target: 0, height: 0.22, t: 0.35, things: [] };
    drawFrame(ctx, L, buildSky(L, 1), view, 1.4);
  } else {
    // The sheep over a fence, with stars and rocks ahead.
    const L = { W, H, cx: W / 2, hy: H * 0.42, py: H * 0.88, lw: 175 };
    const view = {
      dist: 14, x: 0, target: 0, height: 0.85, t: 2.3,
      things: [
        ...[-1, 0, 1].map(lane => ({ type: 'fence', lane, z: 0.2, row: 1 })),
        ...[6, 9.5, 13].map(z => ({ type: 'star', lane: 1, z })),
        { type: 'rock', lane: -1, z: 18, row: 2 }, { type: 'rock', lane: 0, z: 30, row: 3 },
        ...[-1, 0, 1].map(lane => ({ type: 'fence', lane, z: 42, row: 4 })),
      ],
    };
    drawFrame(ctx, L, buildSky(L, 1), view, 1.9);
    const g = ctx.createLinearGradient(0, 0, W * 0.75, 0);
    g.addColorStop(0, 'rgba(3,8,20,.72)');
    g.addColorStop(1, 'rgba(3,8,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.46);
    ctx.fillStyle = '#f3ead8';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '300 72px "Noto Serif JP", serif';
    ctx.letterSpacing = '7px';
    ctx.fillText('MOUTON・LEAP', 70, 124);
    ctx.font = '300 38px "Noto Serif JP", serif';
    ctx.letterSpacing = '6px';
    ctx.fillStyle = 'rgba(243,234,216,.82)';
    ctx.fillText('月夜を駆けて、柵を跳ぶ。', 74, 196);
  }
  return c.toDataURL('image/png');
}, kind);

for (const [kind, out] of [['icon', 'icon.png'], ['og', 'og.png']]) {
  const url = await draw(kind);
  await writeFile(join(root, 'leap', out), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote leap/' + out);
}
await browser.close();
server.close();
