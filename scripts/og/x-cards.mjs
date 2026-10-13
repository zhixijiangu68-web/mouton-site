// Makes promo/x-images/<ID>.jpg (1080x1350) for the X posts on the schedule
// (promo/x-posts.md), from a given date on (default: today in Japan time).
//   cd scripts/og && node x-cards.mjs [YYYY-MM-DD]
// Polls are skipped (X polls can't carry an image), and so are posts with the link in
// the text (an attached image would replace the article's own link card). The card shows the post's
// first paragraph: the hook. Quiz posts get "○か×か？" and the answer is left to the post.
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { scheduled, postBody } from '../x-posts-lib.mjs';
import { loadDefaultJapaneseParser } from 'budoux';

// Wrap between phrases (like the site's headings), never mid-word.
const budoux = loadDefaultJapaneseParser();
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const phrased = t => t.split('\n').map(line => budoux.parse(line).map(esc).join('<wbr>')).join('<br>');

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const md = readFileSync(join(root, 'promo', 'x-posts.md'), 'utf8');
const from = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const out = join(root, 'promo', 'x-images');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto(pathToFileURL(join(here, 'xcard.html')).href);
await page.evaluate(() => document.fonts.ready);
let n = 0;
for (const row of scheduled(md).filter(r => r.date >= from && !/投票|本文リンク/.test(r.memo) && !/-A\d/.test(r.id))) {
  const body = postBody(md, row.id);
  if (!body) { console.warn(`no text for ${row.id}`); continue; }
  const paras = body.replace(/^【PR】/, '').split(/\n\s*\n/);
  // "○×クイズ。" / "クイズ。" on its own line introduces the question in the next paragraph.
  const intro = /^(○×)?クイズ。$/.test(paras[0].trim());
  let first = (intro ? paras[1] : paras[0]).trim();
  const ox = /^○×クイズ。$/.test(paras[0].trim()) || /○か×か/.test(body.split('\n')[0]);
  const quiz = intro || ox || /[？?]$/.test(first);
  const kind = quiz ? 'quiz' : row.kind === '哲学' ? 'philosophy' : 'word';
  await page.evaluate(d => window.render(d), { html: phrased(first), text: first, kind, ox, hint: quiz ? '答えは投稿で' : '' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${row.id}.jpg`), type: 'jpeg', quality: 88 });
  n++; process.stdout.write('.');
}
await browser.close();
console.log(`\nwrote ${n} images to promo/x-images/`);
