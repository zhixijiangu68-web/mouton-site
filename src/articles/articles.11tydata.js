import { readFileSync } from 'node:fs';
import currentArticles from '../_data/currentArticles.js';

// Japanese prose reads at roughly 400–600 characters a minute.
const CHARS_PER_MINUTE = 500;

// 見出しの文字だけを取り出す。テンプレートの {% %}・{{ }} とタグは、正規表現の置き換えではなく1文字ずつ読んで外す
// （置き換えで外すと、CodeQL が「不完全な複数文字の除去」と判定するため）。
const stripTags = s => {
  let out = '';
  let inTag = false;
  for (const ch of String(s)) {
    if (ch === '<') inTag = true;
    else if (ch === '>' && inTag) inTag = false;
    else if (!inTag) out += ch;
  }
  return out;
};
function stripTemplate(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const open = s.slice(i, i + 2);
    if (open === '{%' || open === '{{') {
      const end = s.indexOf(open === '{%' ? '%}' : '}}', i + 2);
      if (end === -1) break;
      i = end + 2;
    } else {
      out += s[i];
      i += 1;
    }
  }
  return out;
}

// 本文の見出し（h2）。トップの検索で、題と要約のほかに見出しの言葉でも探せるようにする（2026-10-21）。
function headings(inputPath) {
  const body = readFileSync(inputPath, 'utf8').split('\n---\n').slice(1).join('\n---\n');
  return [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => stripTags(stripTemplate(m[1])).trim())
    .filter(h => h && h !== '参考文献' && h !== '僕の結論');
}

function readMinutes(inputPath) {
  let body = readFileSync(inputPath, 'utf8').split('\n---\n').slice(1).join('\n---\n');
  // 参考文献の一覧は読む時間に入れない（2026-10-22、記事を1万〜2万字にして、文献が100件を超えたため）
  const refs = body.indexOf('class="rn-refs"');
  if (refs > 0) body = body.slice(0, body.lastIndexOf('<', refs));
  const text = body
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<nav class="reading-next"[\s\S]*?<\/nav>/g, '')
    .replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / CHARS_PER_MINUTE));
}

export default {
  layout: 'article.njk',
  permalink: data => `${data.page.fileSlug}.html`,
  isArticle: true,
  eleventyComputed: {
    readMinutes: data => readMinutes(data.page.inputPath),
    headings: data => headings(data.page.inputPath),
    // Which topic page the article belongs to (philosophy / body / work / food), if any.
    topic: data => data.journal?.category ?? (data.science ? 'food' : null),
    // アーカイブに移した記事（src/_data/currentArticles.js にない記事）。
    archived: data => !currentArticles.includes(data.page.fileSlug),
  },
};
