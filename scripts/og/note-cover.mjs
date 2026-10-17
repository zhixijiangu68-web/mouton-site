// Makes the header image (1280x670) of every article in note/series-30/ → note/series-30/<NN-slug>/cover.jpg,
// and of the index article → note/series-30/00-index/cover.jpg. The text is the "見出し画像の文言" (大／小) in
// each 03-titles.md. The artwork changes with the path (道) the article belongs to.
//   cd scripts/og && npm install && node note-cover.mjs [番号 ...]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { loadDefaultJapaneseParser } from 'budoux';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const base = process.env.SERIES_DIR || join(root, 'note', 'series-30');
const budoux = loadDefaultJapaneseParser();
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const phrased = t => budoux.parse(t).map(esc).join('<wbr>');

// 道（1〜8＝動けない、9〜14＝続かない、15〜20＝決められない・人の目、21〜26＝何のために、27〜30＝崩れても戻る）
const PATHS = [
  { to: 8, name: '動けない', art: 'gold-laurel-wide.webp', pos: 'center 8%' },
  { to: 14, name: '続かない', art: 'moon-botanical-wide.webp', pos: 'center' },
  { to: 20, name: '決められない・人の目', art: 'gold-laurel-wide.webp', pos: 'center 88%' },
  { to: 26, name: '何のために', art: 'orb-dark-wide.webp', pos: 'center' },
  { to: 30, name: '崩れても戻る', art: 'ocean-wide.webp', pos: 'center' },
];
const pathOf = n => PATHS.find(p => n <= p.to);

const only = process.argv.slice(2).map(Number);
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 670 } });
await page.goto(pathToFileURL(join(here, 'note-cover.html')).href);
await page.evaluate(() => document.fonts.ready);

let count = 0;
for (const dir of readdirSync(base).filter(d => /^\d\d-/.test(d)).sort()) {
  const n = Number(dir.slice(0, 2));
  if (only.length && !only.includes(n)) continue;
  const f = join(base, dir, '03-titles.md');
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');
  const big = t.match(/^- 大：(.+)$/m)?.[1]?.trim();
  const small = t.match(/^- 小：(.+)$/m)?.[1]?.trim();
  if (!big) { console.warn(`skip ${dir}: no 大：`); continue; }
  const p = n === 0 ? { name: '目次', art: 'intro-sheep-moon.webp', pos: 'center 60%' } : pathOf(n);
  await page.evaluate(a => window.render(a), {
    num: n || 0, total: 30, path: p.name, bigHtml: phrased(big), bigLen: big.length, small: small || '',
    art: pathToFileURL(join(root, 'images', 'mouton', p.art)).href, pos: p.pos,
    series: n ? '30の不安と、30の最初の一歩' : 'MOUTON — PHILOSOPHY OF LIFE',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(base, dir, 'cover.jpg'), type: 'jpeg', quality: 86 });
  count++;
}
await browser.close();
console.log(`${count} cover(s) in note/series-30/`);
