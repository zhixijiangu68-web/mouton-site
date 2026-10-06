// Renders a reel described by reel.json into a 1080x1920 mp4 (no audio) and a cover PNG.
//
//   node render.mjs <reel.json> [output-dir]
//
// Needs ffmpeg on PATH and a Chromium for Playwright (set CHROME_PATH to use a
// specific one). Images in reel.json are resolved relative to reel.json.
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const [reelPath, outArg] = process.argv.slice(2);
if (!reelPath) {
  console.error('usage: node render.mjs <reel.json> [output-dir]');
  process.exit(1);
}
const reelFile = resolve(reelPath);
const outDir = resolve(outArg || dirname(reelFile));
const reel = JSON.parse(readFileSync(reelFile, 'utf8'));
const fps = reel.fps || 30;

// Image paths become file URLs so the template can load them.
for (const s of reel.screens) {
  if (s.image) {
    const p = resolve(dirname(reelFile), s.image);
    if (!existsSync(p)) throw new Error(`image not found: ${s.image}`);
    s.image = pathToFileURL(p).href;
  }
}

const frames = join(outDir, '.frames');
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, 'template.html')).href);
const total = await page.evaluate(r => window.setupReel(r), reel);
// Mirror the page's screen start times here, for picking the cover frame.
{ let t = 0; for (const s of reel.screens) { s.start = t; t += s.duration; } }
await page.evaluate(() => document.fonts.ready);

const count = Math.round(total * fps);
for (let f = 0; f < count; f++) {
  await page.evaluate(t => window.show(t), f / fps);
  await page.screenshot({ path: join(frames, `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  if (f % fps === 0) process.stdout.write(`\r${Math.round((f / count) * 100)}%`);
}

// Cover: the screen marked "cover": true (or the first), fully settled.
const coverIndex = Math.max(0, reel.screens.findIndex(s => s.cover));
const cover = reel.screens[coverIndex];
await page.evaluate(t => window.show(t), cover.start + Math.min(cover.duration - .01, .5));
await page.screenshot({ path: join(outDir, 'cover.png') });
await browser.close();

const mp4 = join(outDir, 'reel.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(frames, '%05d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4]);
rmSync(frames, { recursive: true, force: true });
console.log(`\rwrote ${mp4} (${total.toFixed(1)}s, ${count} frames) and cover.png`);
