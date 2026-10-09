// Makes a short vertical quiz video (1080x1920, 8 seconds, no sound) for X:
// the question, a 3-2-1 countdown, then the answer as a big ○ or ×.
//   cd scripts/og && node x-video.mjs <slug> [n]      (n: which question for the article, from 1)
// Writes promo/x-videos/<slug>-<n>.mp4. Needs ffmpeg.
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadDefaultJapaneseParser } from 'budoux';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const [slug, nArg = '1'] = process.argv.slice(2);
if (!slug) { console.error('usage: node x-video.mjs <slug> [n]'); process.exit(1); }
const n = +nArg;
const q = JSON.parse(readFileSync(join(root, 'src', '_data', 'quizzes.json'), 'utf8')).filter(x => x.slug === slug)[n - 1];
if (!q) { console.error(`no question ${n} for ${slug}`); process.exit(1); }
const budoux = loadDefaultJapaneseParser();
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const phrased = t => budoux.parse(t).map(esc).join('<wbr>');

const fps = 30, seconds = 8;
const out = join(root, 'promo', 'x-videos');
const tmp = join(out, `.frames-${slug}-${n}`);
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, 'xvideo.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(d => window.setup(d), { q: q.q, qHtml: phrased(q.q), a: q.a, headHtml: phrased(q.head) });
await page.evaluate(() => document.fonts.ready);
for (let i = 0; i < fps * seconds; i++) {
  await page.evaluate(t => window.frame(t), i / fps);
  await page.screenshot({ path: join(tmp, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
}
await browser.close();
const file = join(out, `${slug}-${n}.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(tmp, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', file]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote promo/x-videos/${slug}-${n}.mp4`);
