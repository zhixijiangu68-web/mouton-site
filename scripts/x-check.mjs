// X の投稿の下書きを機械的に点検する。promo/x-posts.md（か、同じ形の下書きファイル）の「### ID …」ごとに、
// 本文の字数（URL を除く）、X の重み付きの長さ（日本語1字＝2、URL＝23）、リプライの utm、禁じている言い回し
// （docs/content-quality.md・x-staff/rules.md の 2026-10-18 の決まり）を出す。
// 使い方：node scripts/x-check.mjs [ファイル] [--section <節の見出しの一部>] [--ids KI-1,KI-2] [--strict]
//   例：node scripts/x-check.mjs promo/x-posts.md --section "2026-10-18 版"
import { readFileSync } from 'node:fs';
import { postBody, postReply, postPoll } from './x-posts-lib.mjs';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const opt = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };
const file = args.find(a => !a.startsWith('--') && a !== opt('--section') && a !== opt('--ids')) || 'promo/x-posts.md';
const section = opt('--section');
const onlyIds = opt('--ids')?.split(',');

let md = readFileSync(file, 'utf8');
if (section) {
  // 指定した節（## 見出し）だけを見る。次の ## まで
  const start = md.split('\n').findIndex(l => l.startsWith('## ') && l.includes(section));
  if (start === -1) { console.error(`節が見つからない: ${section}`); process.exit(2); }
  const lines = md.split('\n');
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end === -1) end = lines.length;
  md = lines.slice(start, end).join('\n') + '\n## 終わり\n';
}

const ids = [...md.matchAll(/^###+ ([A-Z0-9]+-[A-Z0-9]+)(?=[ \n（｜])/gm)].map(m => m[1]).filter(id => !onlyIds || onlyIds.includes(id));
const urlRe = /https?:\/\/\S+/g;
const weighted = (text) => [...text.replace(urlRe, '')].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x7f ? 2 : 1), 0) + (text.match(urlRe) || []).length * 23;
const ng = [
  // 命令・あおりは 2026-10-28 から X では使ってよい（オーナー「命令・あおりは必要だと思う。受け取る側の問題だよ」）。外すのは下の、嘘・誇張・見下しにつながるものだけ
  ['断定・約束', /(必ず|絶対に|誰でも|確実に|人生が変わる|できるようになる|劇的に)/],
  ['誇張（〜するだけで）', /(するだけで|飲むだけで|食べるだけで|聞くだけで|見るだけで|読むだけで人生)/],
  ['見下し・からかい', /(負け組|底辺|情弱|メンヘラ|弱者男性|老害|ゆとり世代)/],
  ['クイズ・投票・ワーク', /(○か×か|○×|クイズ|投票|答えは明日|書き出してみ|今日やること|＿＿)/],
  ['取り入れないこと', /(引き寄せ|量子力学|負け組|凡庸|退路を断|決断疲れ)/],
  ['値段・販売', /(2,980円|円（税込）|購入|販売中|PDF を買)/],
];
let problems = 0;
for (const id of ids) {
  const body = postBody(md, id);
  const reply = postReply(md, id);
  const poll = postPoll(md, id);
  const notes = [];
  if (!body) { notes.push('本文がない'); }
  const chars = [...body.replace(urlRe, '')].filter(c => c !== '\n').length;
  const w = weighted(body);
  const hasUrl = urlRe.test(body); urlRe.lastIndex = 0;
  if (chars > 140) notes.push(`本文 ${chars} 字（140 を超える）`);
  if (w > 280) notes.push(`重み付き ${w}（280 を超える）`);
  if (poll) notes.push('投票がある（2026-10-17 から使わない）');
  for (const [kind, re] of ng) { const m = body.match(re); if (m) notes.push(`[${kind}]「${m[0]}」`); }
  if (!hasUrl) {
    if (!reply) notes.push('リプライの1行がない（リプリンクの型）');
    else if (!/utm_source=x&utm_medium=social&utm_campaign=[a-z0-9-]+&utm_content=reply/.test(reply)) notes.push('リプライの utm が形に合わない');
  } else if (!/utm_content=body/.test(body)) notes.push('本文のリンクに utm_content=body がない');
  const flag = notes.length ? '!!' : 'ok';
  console.log(`${flag} ${id}  ${chars}字 / 重み${w}${hasUrl ? '（本文リンク）' : ''}${notes.length ? '  ' + notes.join('；') : ''}`);
  problems += notes.length;
}
console.log(`\n${ids.length} 本を点検、問題 ${problems} 件。`);
if (strict && problems) process.exit(1);
