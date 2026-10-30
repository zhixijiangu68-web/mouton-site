// note の見出し画像（1280×670）を thumb.json から作る。リポジトリの直下で：
//   node scripts/note-thumb/make.mjs note/<slug>/thumb.json [出力.png] [--preview]
// thumb.json:
//   { "title": "大きな文言（\n で改行）", "sub": "小さな一行（なくてよい）", "label": "哲学（なくてよい）", "variant": "paper" | "ink" | "ai" }
// 出力は既定で thumb.json と同じフォルダの thumbnail.png（.jpg を指定すれば JPEG）。
// 文字は安全な余白の中に入るまで自動で小さくする。読める大きさ（見出し 64px）で入らない文言は、画像を作らずに止まる。
// 出力の「中央で切ったとき」は、2:1・16:9・3:2・4:3・正方形に中央を残して切られたとき、見出しとサブが残るか（○）欠けるか（×）。
// note が一覧でどう切るかは未確認なので、目安として読む。
// --preview を付けると、幅 343・160・100px に縮めた見え方と、中央で切った見え方を1枚に並べる。見本は OS の一時フォルダ
// （<一時フォルダ>/note-thumb/）に作り、場所を出力に出す。リポジトリには残らない。
// 大きさは note ヘルプの推奨 1280×670px（調査ではヘルプの抜粋で確かめた。本文は未確認）。
// 初回だけ：(cd scripts/note-thumb && npm ci)（書体 Noto Sans JP と Playwright を package-lock.json の版で入れる）。
// ブラウザは CHROME_PATH → /opt/pw-browsers/chromium → Playwright の既定 の順。
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const W = 1280, H = 670;
// 中央を残して切られる比率（幅 ÷ 高さ）。note・アプリ・X が実際にどう切るかは未確認（analysis.md 10-5）。
const CROPS = [['2:1', 2], ['16:9', 16 / 9], ['3:2', 3 / 2], ['4:3', 4 / 3], ['正方形', 1]];
const VARIANTS = ['paper', 'ink', 'ai'];
const KEYS = ['title', 'sub', 'label', 'variant'];
const MODES = { asis: '書いたとおりの改行', phrase: '文節で折り返し', anywhere: '語の途中でも折り返し' };
const here = dirname(fileURLToPath(import.meta.url));
const USAGE = [
  '使い方: node scripts/note-thumb/make.mjs <thumb.json> [出力.png] [--preview]',
  '  thumb.json: {"title": "大きな文言（\\n で改行）", "sub": "小さな一行", "label": "哲学", "variant": "paper | ink | ai"}',
].join('\n');

class Stop extends Error {}
const stop = message => { throw new Stop(message); };
const cautions = [];
// 今いるフォルダの中なら相対パス、外なら絶対パスで見せる。
const show = path => { const rel = relative(process.cwd(), path); return rel && !rel.startsWith('..') ? rel : path; };
const chars = lines => lines.join('').replace(/\s/g, '').length;
// 画像の中の px が、画面で幅 width px に縮んだときの大きさ。
const shrunk = (px, width) => (px * width / W).toFixed(1);
// 中央を残して ratio に切ったときに、見出しとサブの字（core）がすべて残るか。
function survives(core, ratio) {
  const cw = Math.min(W, H * ratio), ch = Math.min(H, W / ratio);
  const x0 = (W - cw) / 2, y0 = (H - ch) / 2;
  return core.left >= x0 - .5 && core.right <= x0 + cw + .5 && core.top >= y0 - .5 && core.bottom <= y0 + ch + .5;
}

function readSpec(path) {
  let raw, spec;
  try { raw = readFileSync(path, 'utf8'); } catch { stop(`${show(path)} が読めません。`); }
  try { spec = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch (e) { stop(`${show(path)} の JSON が読めません（${e.message}）。`); }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) stop(`thumb.json は {"title": "…"} の形にしてください。\n${USAGE}`);
  for (const key of Object.keys(spec)) {
    if (!KEYS.includes(key)) cautions.push(`thumb.json の "${key}" は使いません（使えるのは ${KEYS.join('・')}）。`);
  }
  const text = key => {
    if (spec[key] == null) return '';
    if (typeof spec[key] !== 'string') stop(`thumb.json の "${key}" は文字列にしてください。`);
    return spec[key];
  };
  // 改行は JSON の "\n"。"\\n"（バックスラッシュと n）と書いてしまった場合も改行にする。
  const lines = s => s.replace(/\\n/g, '\n').split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
  const title = lines(text('title'));
  if (!title.length) stop(`thumb.json に "title"（大きな文言）がありません。\n${USAGE}`);
  const variant = (text('variant').trim() || 'paper').toLowerCase();
  if (!VARIANTS.includes(variant)) stop(`"variant" は ${VARIANTS.join('・')} のどれかにしてください（いまは "${variant}"）。`);
  return { title, sub: lines(text('sub')), label: lines(text('label')).join(' '), variant };
}

function fontCss() {
  try { return createRequire(import.meta.url).resolve('@fontsource-variable/noto-sans-jp/index.css'); } catch { return null; }
}

async function loadChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND' && /playwright/.test(e.message)) stop('Playwright が見つかりません。リポジトリの直下で (cd scripts/note-thumb && npm ci) を実行してください。');
    throw e;
  }
}

// 見出しを実際に描いた書体の名前（Chromium の開発者向けの機能で聞く）。分からなければ null。
async function usedFont(page) {
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#title .line' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    await cdp.detach();
    // 可変フォントは既定の太さの名前（Noto Sans JP Thin など）で返るので、太さの語は外す。
    const name = fonts.sort((a, b) => b.glyphCount - a.glyphCount)[0]?.familyName;
    return name ? name.replace(/\s+(Thin|ExtraLight|Light|DemiLight|Regular|Medium|SemiBold|Bold|ExtraBold|Black)$/i, '') : null;
  } catch {
    return null;
  }
}

function failure(r, spec) {
  switch (r.failed) {
    case 'label': return `ラベル「${spec.label}」が長すぎて、${r.limits.label[1]}px でも 1 行に入りません。「哲学」のように短くしてください。`;
    case 'sub': return `サブが長すぎて、${r.limits.sub[1]}px・2 行でも入りません（いま ${chars(spec.sub)} 字）。短くするか、なくしてください。`;
    case 'title': return `見出しが長すぎて、読める大きさ（${r.limits.title[1]}px）では枠に入りません（いま ${chars(spec.title)} 字）。目安は 10〜15 字・2 行。字数を減らすか、サブを短くしてください。`;
    default: return '文字が安全な枠からはみ出しました。';
  }
}

// 見本：上の段に幅 343・160・100px に縮めた見え方、下の段に中央で切った見え方（高さ 120px にそろえる）。
// スマホの画面に近い 2 倍の細かさで撮り、OS の一時フォルダに置く（リポジトリには残さない）。
async function writePreview(browser, image, core) {
  const dir = join(tmpdir(), 'note-thumb');
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, `${basename(dirname(image))}-${basename(image, extname(image))}-preview.png`);
  const src = `data:image/${extname(image) === '.png' ? 'png' : 'jpeg'};base64,${readFileSync(image).toString('base64')}`;
  const sizes = [[343, '幅 343px（スマホで横いっぱい）'], [160, '幅 160px（一覧で小さく）'], [100, '幅 100px']];
  const figure = (inner, w, caption) => `<figure style="margin:0;width:${w}px">${inner}<figcaption style="margin-top:6px;white-space:nowrap">${caption}</figcaption></figure>`;
  const shrinks = sizes.map(([w, caption]) => figure(`<img src="${src}" width="${w}" style="display:block;outline:1px solid #DDD8CC">`, w, caption));
  const crops = CROPS.map(([name, ratio]) => {
    const h = 120, w = Math.round(h * ratio);
    const mark = survives(core, ratio) ? '○ 残る' : '× 欠ける';
    return figure(`<img src="${src}" style="display:block;width:${w}px;height:${h}px;object-fit:cover;object-position:center;outline:1px solid #DDD8CC">`, w, `中央で ${name}（${mark}）`);
  });
  const row = items => `<div style="display:flex;gap:24px;align-items:flex-start">${items.join('')}</div>`;
  const page = await browser.newPage({ viewport: { width: 1100, height: 520 }, deviceScaleFactor: 2 });
  await page.setContent(`<!doctype html><html lang="ja"><body style="margin:0;background:#FFFFFF">
<div id="sheet" style="display:inline-flex;flex-direction:column;gap:28px;padding:24px;color:#3E3C38;font:13px/1.5 'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',Meiryo,IPAPGothic,sans-serif">
${row(shrinks)}
${row(crops)}
</div></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
  await page.screenshot({ path: dest, clip: await page.locator('#sheet').boundingBox() });
  await page.close();
  return dest;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('-'));
  const [jsonArg, outArg, ...extra] = args.filter(a => !a.startsWith('-'));
  if (flags.includes('--help') || flags.includes('-h')) return console.log(USAGE);
  const unknown = flags.filter(f => f !== '--preview');
  if (unknown.length) stop(`知らないオプションです: ${unknown.join(' ')}\n${USAGE}`);
  if (!jsonArg || extra.length) { console.error(USAGE); process.exitCode = 1; return; }

  const jsonPath = resolve(jsonArg);
  const spec = readSpec(jsonPath);
  const out = resolve(outArg ?? join(dirname(jsonPath), 'thumbnail.png'));
  const ext = extname(out).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) stop(`出力の名前は .png か .jpg で終わるようにしてください（いまは ${outArg}）。`);

  const chromium = await loadChromium();
  const executablePath = process.env.CHROME_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  let browser;
  try {
    browser = await chromium.launch(executablePath ? { executablePath } : {});
  } catch (e) {
    stop(`Chromium を起動できません（${String(e.message).split('\n')[0]}）。npx playwright install chromium を実行するか、CHROME_PATH にブラウザの場所を入れてください。`);
  }
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(join(here, 'template.html')).href);
    const css = fontCss();
    if (css) await page.addStyleTag({ url: pathToFileURL(css).href });
    const r = await page.evaluate(data => window.render(data), spec);
    if (!r.ok) stop(`${failure(r, spec)}画像は作っていません。`);
    const font = await usedFont(page);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, ...(ext === '.png' ? { type: 'png' } : { type: 'jpeg', quality: 92 }) });

    const t = r.title;
    if (t.px < r.readable) {
      cautions.push(`見出しが ${t.px}px です。一覧の小さな表示（幅 160px）では約 ${shrunk(t.px, 160)}px になり、読みにくくなります。目安は 10〜15 字・2 行（いま ${chars(spec.title)} 字・${t.lines} 行）。字数を減らすか、改行の位置を見直してください。`);
    }
    if (t.mode !== 'asis' && spec.title.length > 1) {
      cautions.push(`書いた改行のままでは小さくなるので、行の中でも折り返しました（${t.lines} 行）。title の \\n で区切る位置を決め直すと、思ったとおりの行になります。`);
    } else if (t.mode !== 'asis') {
      cautions.push(`title に改行がないので、自動で ${t.lines} 行に折り返しました。区切りが不自然なら（例:「人間と／して」）、title に \\n を入れて区切る位置を決めてください。`);
    }
    if (r.label && r.label.px < r.limits.label[0]) {
      cautions.push(`ラベルが長いので ${r.label.px}px に縮めました。ラベルは「哲学」のような短い言葉が目安です。`);
    }
    if (t.lines >= 3) cautions.push(`見出しが ${t.lines} 行です。小さく出たときに読める目安は 2 行です。`);
    if (!css) {
      cautions.push(`書体 Noto Sans JP が入っていないので、このパソコンの書体（${font ?? '不明'}）で作りました。(cd scripts/note-thumb && npm ci) で入れると、どこで作っても同じ見た目になります。`);
    } else if (font && !/Noto Sans JP/i.test(font)) {
      cautions.push(`Noto Sans JP を読み込めず、${font} で作りました。`);
    }

    console.log(`作りました: ${show(out)}（${W}×${H}・${spec.variant}・書体 ${font ?? '不明'}）`);
    console.log(`  見出し ${t.px}px・${t.lines} 行（${MODES[t.mode]}）`
      + (r.sub ? `／サブ ${r.sub.px}px・${r.sub.lines} 行` : '') + (r.label ? `／ラベル ${r.label.px}px` : ''));
    console.log(`  縮んだときの見出しの大きさ: 幅 343px で約 ${shrunk(t.px, 343)}px、幅 160px で約 ${shrunk(t.px, 160)}px（12.8px 以上が読みやすさの目安。見出し ${r.readable}px 以上で届く）`);
    console.log(`  文字の外側の余白: 上 ${Math.round(r.edge.top)}px・下 ${Math.round(r.edge.bottom)}px・左 ${Math.round(r.edge.left)}px・右 ${Math.round(r.edge.right)}px`);
    console.log(`  中央で切ったとき（見出しとサブ。note がこう切るかは未確認）: ${CROPS.map(([name, ratio]) => `${name} ${survives(r.core, ratio) ? '○' : '×'}`).join('・')}`);
    if (args.includes('--preview')) console.log(`  見本（縮めた見え方と、中央で切った見え方）: ${show(await writePreview(browser, out, r.core))}`);
    for (const c of cautions) console.log(`注意: ${c}`);
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (e) {
  if (!(e instanceof Stop)) throw e;
  for (const c of cautions) console.error(`注意: ${c}`);
  console.error(`止めました: ${e.message}`);
  process.exitCode = 1;
}
