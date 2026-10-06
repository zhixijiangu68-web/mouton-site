// Renders a fast-cut reel ("The life I want." style): many short clips cut
// every ~0.5s under one fixed line of text, then an end card.
//
//   node cuts.mjs <cuts.json> [output-dir]
//
// Needs ffmpeg on PATH and a Chromium for Playwright (CHROME_PATH to pick one).
// Clip paths in cuts.json are resolved relative to cuts.json. Videos and still
// images (jpg/png/webp) both work.
import { readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const [cfgPath, outArg] = process.argv.slice(2);
if (!cfgPath) {
  console.error('usage: node cuts.mjs <cuts.json> [output-dir]');
  process.exit(1);
}
const cfgFile = resolve(cfgPath);
const base = dirname(cfgFile);
const outDir = resolve(outArg || base);
const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
const fps = cfg.fps || 30;
const cut = cfg.cut || 0.5;
const body = cfg.length || 14;
const STILL = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MEDIA = new Set([...STILL, '.mp4', '.mov', '.m4v', '.webm']);

// Clips: an explicit list, or every media file in a folder (sorted by name).
let clips = cfg.clips;
if (typeof clips === 'string') {
  const dir = resolve(base, clips);
  clips = readdirSync(dir).filter(f => MEDIA.has(extname(f).toLowerCase())).sort().map(f => join(dir, f));
} else {
  clips = clips.map(c => resolve(base, c));
}
if (!clips.length) throw new Error('no clips found');
for (const c of clips) if (!existsSync(c)) throw new Error(`clip not found: ${c}`);

const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
const duration = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 0;

const work = join(outDir, '.cuts');
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// 1. Text overlay and end card, drawn in the browser with the reel font.
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, 'cuts.html')).href);
await page.evaluate(c => window.setup(c), cfg);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.mode('overlay'));
await page.screenshot({ path: join(work, 'overlay.png'), omitBackground: true });
await page.evaluate(() => window.mode('end'));
await page.screenshot({ path: join(work, 'end.png') });
await page.evaluate(() => window.mode('cover'));
await page.screenshot({ path: join(outDir, 'cover.png') });
await browser.close();

// 2. One short segment per cut, cycling through the clips. Each pass over the
// clips takes a later moment from each video so repeats don't look identical.
const count = Math.round(body / cut);
const frames = Math.round(cut * fps);
const look = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=${fps},eq=brightness=${cfg.brightness ?? -0.06}:saturation=${cfg.saturation ?? 0.85}`;
const lens = clips.map(c => (STILL.has(extname(c).toLowerCase()) ? 0 : duration(c)));
const list = [];
for (let i = 0; i < count; i++) {
  const k = i % clips.length, pass = Math.floor(i / clips.length);
  const seg = join(work, `seg${String(i).padStart(3, '0')}.mp4`);
  if (lens[k] === 0) {
    // Still image: a slow push-in so it doesn't look frozen.
    ff(['-loop', '1', '-i', clips[k], '-frames:v', String(frames), '-vf',
      `${look},zoompan=z='1+0.0015*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${fps}`,
      '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', seg]);
  } else {
    const room = Math.max(0, lens[k] - cut - 0.1);
    const start = room ? ((0.2 + pass * 0.37) * lens[k]) % room : 0;
    ff(['-ss', start.toFixed(2), '-i', clips[k], '-frames:v', String(frames), '-vf', look,
      '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', seg]);
  }
  list.push(`file '${seg}'`);
  process.stdout.write(`\rcuts ${i + 1}/${count}`);
}
writeFileSync(join(work, 'list.txt'), list.join('\n'));

// 3. Join the cuts, lay the text over them, then append the end card.
ff(['-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'), '-i', join(work, 'overlay.png'),
  '-filter_complex', '[0:v][1:v]overlay=0:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', join(work, 'body.mp4')]);
const endLen = cfg.end?.duration ?? 2.5;
ff(['-loop', '1', '-i', join(work, 'end.png'), '-t', String(endLen), '-vf', `fps=${fps},format=yuv420p`,
  '-c:v', 'libx264', '-crf', '18', join(work, 'end.mp4')]);
writeFileSync(join(work, 'all.txt'), `file '${join(work, 'body.mp4')}'\nfile '${join(work, 'end.mp4')}'\n`);
const mp4 = join(outDir, 'reel.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', join(work, 'all.txt'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4]);
rmSync(work, { recursive: true, force: true });
console.log(`\rwrote ${mp4} (${(count * cut + endLen).toFixed(1)}s, ${count} cuts from ${clips.length} clips) and cover.png`);
