// 文章の自己点検。残す記事（src/_data/currentArticles.js）か、引数で指定した記事の元ファイル（src/articles/<slug>.html）を読み、
// docs/content-quality.md が禁じる言い回し（命令・断定・約束・あおり・穴埋め・取り入れないこと）と、
// 出典・終わり方の抜けを「警告」として出す。機械的に拾うだけなので、引用の中や FAQ の案内は人（AI社員）が読んで判断する。
// 使い方：node scripts/lint-writing.mjs            … 残す記事をすべて
//        node scripts/lint-writing.mjs <slug> ...  … 指定した記事だけ
//        --strict を付けると、警告が1つでもあれば exit 1（既定は exit 0。npm test には入れていない）
import { readFileSync, existsSync } from 'node:fs';
import currentArticles from '../src/_data/currentArticles.js';

const args = process.argv.slice(2).filter(a => a !== '--strict');
const strict = process.argv.includes('--strict');
const slugs = args.length ? args : currentArticles;

// [種類, 正規表現]。文脈で許されるものもある（引用・FAQ・運用の案内）ので、まず出して、読んで決める。
const rules = [
  ['命令・要請', /(しなさい|しろ。|するな。|してください|して下さい|しましょう|してみましょう|しよう。|べきだ。|べきです)/g],
  ['断定・約束', /(必ず|絶対に|誰でも|確実に|保証|人生が変わる|できるようになる|劇的に)/g],
  ['あおり', /(今すぐ|手遅れ|損をする|損します|急いで|限定|残りわずか)/g],
  ['穴埋め・ワーク', /(＿＿|mw-blank|mini-work|書き出してみ|書いてみてください|今日やること|実践ステップ)/g],
  ['取り入れないこと', /(引き寄せ|量子力学|負け組|退路を断|有害な友人|決断疲れ|恐怖は存在しない)/g],
  ['健康の言い切り', /(治る|治ります|効く|効きます|痩せる)/g],
];

// タグと Nunjucks の印（{% %}・{{ }}）を外して、文だけにする。
// 正規表現を使わず一文字ずつ進める：文章の点検が目的で HTML の無害化ではないこと、長い行でも線形で終わることのため。
function plainText(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '<') {
      const j = s.indexOf('>', i + 1);
      if (j !== -1) { i = j + 1; continue; }
    } else if (c === '{' && (s[i + 1] === '%' || s[i + 1] === '{')) {
      const close = s[i + 1] === '%' ? '%}' : '}}';
      const j = s.indexOf(close, i + 2);
      if (j !== -1) { i = j + close.length; continue; }
    }
    out += c;
    i++;
  }
  return out;
}

// <p ...>〜</p> の中の文を順に取り出す（<pre> などは除く）。
function paragraphs(html) {
  const out = [];
  let i = 0;
  for (;;) {
    const a = html.indexOf('<p', i);
    if (a === -1) break;
    const after = html[a + 2];
    if (after !== '>' && after !== ' ') { i = a + 2; continue; }
    const b = html.indexOf('>', a);
    if (b === -1) break;
    const c = html.indexOf('</p>', b);
    if (c === -1) break;
    const t = plainText(html.slice(b + 1, c)).trim();
    if (t) out.push(t);
    i = c + 4;
  }
  return out;
}

let warnings = 0;
for (const slug of slugs) {
  const file = `src/articles/${slug}.html`;
  if (!existsSync(file)) { console.error(`${file}: ない`); warnings++; continue; }
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const out = [];
  const front = src.split('\n---\n')[0];
  const isPaid = /^paid:/m.test(front);
  const isHealth = /^health: true/m.test(front) || /^category: (body|food)/m.test(front);
  const active = rules.filter(([kind]) => kind !== '健康の言い切り' || isHealth);
  // 言い回し：行ごとに、タグを除いた文で照らす
  lines.forEach((line, i) => {
    const text = plainText(line).trim();
    if (!text) return;
    for (const [kind, re] of active) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const at = Math.max(0, m.index - 18);
        out.push(`  ${i + 1}: [${kind}] 「${m[0]}」 … ${text.slice(at, m.index + m[0].length + 18)}`);
      }
    }
  });
  // 出典：本文に「研究」「調査」「％」があるのに参考文献の節がない／番号がずれている
  const body = src.split('\n---\n').slice(1).join('\n---\n');
  if (isPaid) { // 販売ページは冒頭の無料部分だけ（「ここから先は有料」）なので、出典と終わり方は PDF の側で確かめる
    if (out.length) { console.log(`${file}（販売ページ：言い回しだけ）`); console.log(out.join('\n')); warnings += out.length; }
    continue;
  }
  const refs = [...body.matchAll(/id="ref-(\d+)"/g)].map(m => Number(m[1]));
  const cites = [...body.matchAll(/href="#ref-(\d+)"/g)].map(m => Number(m[1]));
  if (/研究|調査|分析|％|%/.test(plainText(body)) && !refs.length) out.push('  [出典] 「研究」「調査」「％」とあるのに、参考文献の節（<section class="refs">）がない');
  for (const n of new Set(cites)) if (!refs.includes(n)) out.push(`  [出典] 本文の [${n}] に対応する <p id="ref-${n}"> がない`);
  for (const n of refs) if (!cites.includes(n)) out.push(`  [出典] 参考文献 ${n} が本文から引かれていない`);
  // 終わり方：参考文献の節（なければ最後の共有ボタン）の前の段落に、問いがあるか
  const refsAt = body.indexOf('<section class="refs">');
  const shareAt = body.lastIndexOf('<div class="article-share">');
  const before = refsAt !== -1 ? body.slice(0, refsAt) : shareAt !== -1 ? body.slice(0, shareAt) : body;
  const tail = paragraphs(before).slice(-3).join(' ');
  if (!/[？?]|だろう。|だろうか。|ませんか。|でしょうか。/.test(tail)) out.push('  [終わり方] 本文の最後の3段落に問いが見当たらない（最後に問いを一つ置く）');
  // 読者への手順：本文（参考文献より前）に <ol> があれば知らせる
  if (/<ol[\s>]/.test(before)) out.push('  [終わり方] 本文に番号付きの手順（<ol>）がある。読者への手順になっていないか読む');
  if (out.length) { console.log(`${file}`); console.log(out.join('\n')); warnings += out.length; }
}
console.log(`\n${slugs.length} 本を読んで、警告 ${warnings} 件。引用の中・FAQ・運用の案内は許される。それ以外は docs/content-quality.md に照らして直す。`);
if (strict && warnings) process.exit(1);
