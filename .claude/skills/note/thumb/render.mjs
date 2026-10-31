// note の見出し画像を描く。
//   node render.mjs <spec.json> <out-basename>
// <out>.png（1280×670）、<out>.jpg（note に上げる用）、<out>-small.png（一覧での見え方。幅320に縮小）を書き出す。
// spec は thumb.html の window.render に渡す形。テキストがはみ出したら終了コード 2。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const pw = join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs');
const { chromium } = await import(pathToFileURL(pw).href);

const [specPath, outBase] = process.argv.slice(2);
if (!specPath || !outBase) { console.error('usage: node render.mjs <spec.json> <out-basename>'); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const out = resolve(outBase);

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 670 } });
await page.goto(pathToFileURL(join(here, 'thumb.html')).href);
await page.evaluate(s => window.render(s), spec);
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => {
  const w = document.getElementById('wrap');
  const bad = [...w.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline');
  return { wrapH: w.scrollHeight > w.clientHeight + 1, wide: bad.map(e => e.className || e.tagName) };
});
const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
await page.screenshot({ path: out + '.png' });
await page.screenshot({ path: out + '.jpg', type: 'jpeg', quality: 90 });
const small = await browser.newPage({ viewport: { width: 320, height: 168 } });
await small.setContent(`<body style="margin:0"><img src="data:image/png;base64,${readFileSync(out + '.png').toString('base64')}" width="320" height="168"></body>`);
await small.screenshot({ path: out + '-small.png' });
await browser.close();
const ok = !overflow.wrapH && overflow.wide.length === 0;
console.log(JSON.stringify({ out: out + '.png', ok, overflow, fonts: [...new Set(fonts)] }));
process.exit(ok ? 0 : 2);
