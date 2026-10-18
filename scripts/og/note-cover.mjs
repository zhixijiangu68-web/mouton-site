// Makes the header image (1280x670) of every article in note/series-30/ → note/series-30/<NN-slug>/cover.jpg,
// and of the index article → note/series-30/00-index/cover.jpg. The text is the "見出し画像の文言" (大／小) in
// each 03-titles.md. The artwork changes with the path (道) the article belongs to.
// The free article note/free-habit/ gets one in the same style (artwork of the profile header).
// The next 30 (note/next-30/, 31〜60) use SERIES=next30: three groups, each with its own artwork.
// The single articles (無料の入門3本・有料記事) get theirs from SINGLES below → note/<dir>/cover.jpg.
//   cd scripts/og && npm install && node note-cover.mjs [番号 ... | habit | single | <dir> ...]
//   SERIES=next30 node note-cover.mjs [番号 ...]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { loadDefaultJapaneseParser } from 'budoux';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const next30 = process.env.SERIES === 'next30';
const base = process.env.SERIES_DIR || join(root, 'note', next30 ? 'next-30' : 'series-30');
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
// 次の30本「自分を動かしているもの」（31〜40＝選べない、41〜50＝誰かの物差し、51〜60＝感情に振り回される）
const GROUPS = [
  { to: 40, name: '選べない', art: 'orb-dark-wide.webp', pos: 'center 40%' },
  { to: 50, name: '誰かの物差し', art: 'moon-botanical-wide.webp', pos: 'center 30%' },
  { to: 60, name: '感情に振り回される', art: 'ocean-wide.webp', pos: 'center 70%' },
];
const pathOf = n => (next30 ? GROUPS : PATHS).find(p => n <= p.to);
// 1本ずつの記事（無料の入門＝羊と月の絵、有料＝月桂樹の絵。サイトのシェア用の画像は、クイズや古いデザインのため note には使わない）。
// 大きな文字は意味の切れ目で改行して（\n）、一覧の小さな画像でも読める大きさにする（2026-10-18、コピーを先に）
const intro = { path: '入門', art: 'intro-sheep-moon.webp', pos: 'center 60%' };
const paid = { path: '有料', art: 'gold-laurel-wide.webp', pos: 'center 50%' };
const SINGLES = [
  // 題は画像の下に出るので、画像には記事の要の一行を置く（2026-10-18、コピーを先に）
  { dir: 'free-kierkegaard', big: '足がすくむのは、\n選べる場所にいるから', small: 'キルケゴールの「自由のめまい」', ...intro },
  { dir: 'free-nietzsche', big: '人の目より、\n頭の中の「すべき」', small: 'ニーチェの「汝なすべし」', ...intro },
  { dir: 'free-spinoza', big: '責める時間は、\n力が減る時間かもしれない', small: 'スピノザ「謙遜は徳ではない」', ...intro },
  // 有料は、大きな文字に読む人の悩みの言葉を置く（2026-10-18、オーナー：コピーを先に。題は画像の下に出るので、くり返さない）
  { dir: 'paid-kierkegaard', big: '考えるほど、\n決められない', small: 'キルケゴールに学ぶ、不安を抱えたまま選ぶ5つの方法', ...paid },
  { dir: 'paid-nietzsche', big: 'どう思われるかで、\n決めてしまう', small: 'ニーチェに学ぶ、自分の物差しで選ぶ方法', ...paid },
  { dir: 'paid-spinoza', big: '続かない自分を、\n責めてしまう', small: 'スピノザ『エチカ』に学ぶ、感情に振り回されない続け方', ...paid },
  { dir: 'paid-choice', big: '比べるほど、\n選べない', small: 'アリストテレスに学ぶ、「いちばん」を探さずに選ぶ5つの方法', ...paid },
  { dir: 'paid-perfect', big: '完璧にできないなら、\nやらない', small: 'ヴォルテールに学ぶ、「ちゃんと」と「ゼロ」のあいだで続ける5つの方法', ...paid },
];

const args = process.argv.slice(2);
const only = args.filter(a => /^\d+$/.test(a)).map(Number);
const habit = !next30 && (!args.length || args.includes('habit'));
const singleDirs = args.filter(a => SINGLES.some(x => x.dir === a));
const singles = next30 ? [] : SINGLES.filter(x => !args.length || args.includes('single') || singleDirs.includes(x.dir));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 670 } });
await page.goto(pathToFileURL(join(here, 'note-cover.html')).href);
await page.evaluate(() => document.fonts.ready);

let count = 0;
for (const dir of readdirSync(base).filter(d => /^\d\d-/.test(d)).sort()) {
  const n = Number(dir.slice(0, 2));
  if (args.length && !only.includes(n)) continue;
  const f = join(base, dir, '03-titles.md');
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');
  const big = t.match(/^- 大：(.+)$/m)?.[1]?.trim();
  const small = t.match(/^- 小：(.+)$/m)?.[1]?.trim();
  if (!big) { console.warn(`skip ${dir}: no 大：`); continue; }
  const p = n === 0 ? { name: '目次', art: 'intro-sheep-moon.webp', pos: 'center 60%' } : pathOf(n);
  // 「大：」の「／」は改行の位置（自動の折り返しが不自然なときだけ使う）。文字の大きさは、いちばん長い行で決める
  const lines = big.split('／');
  await page.evaluate(a => window.render(a), {
    num: n || 0, total: next30 ? 60 : 30, path: p.name, bigHtml: lines.map(phrased).join('<br>'), bigLen: Math.max(...lines.map(l => l.length)), small: small || '',
    art: pathToFileURL(join(root, 'images', 'mouton', p.art)).href, pos: p.pos,
    series: !n ? 'MOUTON — PHILOSOPHY OF LIFE' : next30 ? '自分を動かしているもの' : '30の不安と、30の最初の一歩',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(base, dir, 'cover.jpg'), type: 'jpeg', quality: 86 });
  count++;
}

if (habit) {
  const dir = join(root, 'note', 'free-habit');
  const t = readFileSync(join(dir, '03-titles.md'), 'utf8');
  const big = t.match(/^- 大：(.+)$/m)[1].trim();
  const small = t.match(/^- 小：(.+)$/m)?.[1]?.trim() || '';
  await page.evaluate(a => window.render(a), {
    num: 0, total: 30, path: '全文無料', bigHtml: phrased(big), bigLen: big.length, small,
    art: pathToFileURL(join(root, 'images', 'mouton', 'gold-laurel-wide.webp')).href, pos: 'center 8%',
    series: 'MOUTON — PHILOSOPHY OF LIFE',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(dir, 'cover.jpg'), type: 'jpeg', quality: 86 });
  count++;
}
for (const x of singles) {
  // big の \n は改行の位置（自動の折り返しが不自然なときだけ使う）。文字の大きさは、いちばん長い行で決める
  const lines = x.big.split('\n');
  await page.evaluate(a => window.render(a), {
    num: 0, total: 30, path: x.path, bigHtml: lines.map(phrased).join('<br>'), bigLen: Math.max(...lines.map(l => l.length)), small: x.small,
    art: pathToFileURL(join(root, 'images', 'mouton', x.art)).href, pos: x.pos,
    series: 'MOUTON — PHILOSOPHY OF LIFE',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'note', x.dir, 'cover.jpg'), type: 'jpeg', quality: 86 });
  count++;
}
await browser.close();
console.log(`${count} cover(s)`);
