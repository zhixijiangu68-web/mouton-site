// Makes a short vertical quiz video (1080x1920, 8 seconds, no sound) for X:
// the question, a 3-2-1 countdown, then the answer as a big ○ or ×.
//   cd scripts/og && node x-video.mjs <slug> [n]      (n: which question for the article, from 1)
// Writes promo/x-videos/<slug>-<n>.mp4. Needs ffmpeg.
// With --shorts: a 15-second YouTube Shorts version (quiz on top, a Galton board filling below,
// ends back on the question so the loop joins up). Writes promo/shorts/<slug>-<n>.mp4.
//   node x-video.mjs --philo <id>   an 18-second two-choice philosophy Short from promo/shorts/philosophy.json.
// Writes promo/shorts/philo-<id>.mp4.
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadDefaultJapaneseParser } from 'budoux';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const args = process.argv.slice(2);
const philo = args.includes('--philo');
const shorts = philo || args.includes('--shorts');
const [slug, nArg = '1'] = args.filter(a => !a.startsWith('--'));
if (!slug) { console.error('usage: node x-video.mjs <slug> [n] [--shorts]  |  node x-video.mjs --philo <id>'); process.exit(1); }
const n = +nArg;
const q = philo
  ? JSON.parse(readFileSync(join(root, 'promo', 'shorts', 'philosophy.json'), 'utf8')).find(x => x.id === slug)
  : JSON.parse(readFileSync(join(root, 'src', '_data', 'quizzes.json'), 'utf8')).filter(x => x.slug === slug)[n - 1];
if (!q) { console.error(philo ? `no item ${slug} in promo/shorts/philosophy.json` : `no question ${n} for ${slug}`); process.exit(1); }
const budoux = loadDefaultJapaneseParser();
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const phrased = t => budoux.parse(t).map(esc).join('<wbr>');

const fps = 30, seconds = philo ? 18 : shorts ? 15 : 8;
const name = philo ? `philo-${slug}` : `${slug}-${n}`;
const outDir = shorts ? 'shorts' : 'x-videos';
const out = join(root, 'promo', outDir);
const tmp = join(out, `.frames-${name}`);
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, shorts ? 'shorts.html' : 'xvideo.html')).href);
await page.evaluate(() => document.fonts.ready);
const seed = [...slug].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, n);
await page.evaluate(d => window.setup(d), philo
  ? { q: q.q, qHtml: phrased(q.q), hook: q.hook, choices: q.choices.map(phrased), pick: q.pick, ansHtml: phrased(q.answer), noteHtml: phrased(q.note), seed }
  : { q: q.q, qHtml: phrased(q.q), a: q.a, headHtml: phrased(q.head), seed });
await page.evaluate(() => document.fonts.ready);
for (let i = 0; i < fps * seconds; i++) {
  await page.evaluate(t => window.frame(t), i / fps);
  await page.screenshot({ path: join(tmp, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
}
await browser.close();
const file = join(out, `${name}.mp4`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(tmp, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', file]);
rmSync(tmp, { recursive: true, force: true });
console.log(`wrote promo/${outDir}/${name}.mp4`);
