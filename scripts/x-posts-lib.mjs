// Reads promo/x-posts.md: the schedule tables and each post's text.
// Shared by scripts/x-today.mjs and scripts/og/x-cards.mjs.

// Schedule rows: | 10/9（金） | 朝 | CF-A1 | 選び方 | 記事 | ✓ | メモ |
export function scheduled(md, year = 2026) {
  const rows = [];
  for (const m of md.matchAll(/^\| (\d{1,2})\/(\d{1,2})（.）\s*\| (朝|昼|夜) \| ([A-Z0-9-]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| ([^|]*) \|$/gm)) {
    const [, mo, d, slot, id, kind, article, done, memo] = m;
    rows.push({ date: `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`, slot, id, kind: kind.trim(), article: article.trim(), done: done.trim(), memo: memo.trim() });
  }
  const order = { 朝: 0, 昼: 1, 夜: 2 };
  return rows.sort((a, b) => a.date.localeCompare(b.date) || order[a.slot] - order[b.slot]);
}

// The first ``` block after the post's heading (### ID ...).
const section = (md, id) => {
  const re = new RegExp(`^###+ ${id.replace(/[-]/g, '\\-')}(?:[ \\n（]|$)[\\s\\S]*?(?=^###? |^## )`, 'm');
  return md.match(re)?.[0] || '';
};
export function postBody(md, id) {
  return section(md, id).match(/```\n([\s\S]*?)\n```/)?.[1] || '';
}
export function postReply(md, id) {
  const s = section(md, id);
  return s.includes('リプライ（自分の投稿に返信）') ? s.split('リプライ（自分の投稿に返信）')[1].match(/```\n([\s\S]*?)\n```/)?.[1] || '' : '';
}
export function postPoll(md, id) {
  const s = section(md, id);
  return s.includes('投票の選択肢') ? s.split('投票の選択肢')[1].match(/\n((?:- .*\n?)+)/)?.[1].trim() || '' : '';
}
