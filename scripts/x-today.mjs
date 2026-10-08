// Prints the day's X posts (morning, noon, night) ready to copy: the text,
// the reply line or poll options, and the card image if one was made.
//   node scripts/x-today.mjs [YYYY-MM-DD]     (default: today in Japan time)
import { readFileSync, existsSync } from 'node:fs';
import { scheduled, postBody, postReply, postPoll } from './x-posts-lib.mjs';

const md = readFileSync('promo/x-posts.md', 'utf8');
const day = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const rows = scheduled(md).filter(r => r.date === day);
if (!rows.length) { console.log(`${day}: 順番表に投稿がありません。`); process.exit(0); }
const time = { 朝: '7〜8時', 昼: '12〜13時', 夜: '21〜22時' };
for (const r of rows) {
  console.log(`\n■ ${r.slot}（${time[r.slot]}）${r.id}｜${r.kind}｜${r.article}｜${r.memo}${r.done ? '｜投稿済み ' + r.done : ''}`);
  console.log('--- 本文 ---\n' + (postBody(md, r.id) || '（本文が見つかりません）'));
  const poll = postPoll(md, r.id);
  if (poll) console.log('--- 投票の選択肢（期間1日） ---\n' + poll);
  const reply = postReply(md, r.id);
  if (reply && !/本文リンク/.test(r.memo)) console.log('--- 自分の投稿へのリプライ ---\n' + reply);
  const img = `promo/x-images/${r.id}.jpg`;
  if (existsSync(img)) console.log(`--- 画像 --- ${img}`);
}
