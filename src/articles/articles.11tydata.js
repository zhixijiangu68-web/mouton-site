import { readFileSync } from 'node:fs';
import currentArticles from '../_data/currentArticles.js';

// Japanese prose reads at roughly 400–600 characters a minute.
const CHARS_PER_MINUTE = 500;

// 本文の見出し（h2）。トップの検索で、題と要約のほかに見出しの言葉でも探せるようにする（2026-10-21）。
function headings(inputPath) {
  const body = readFileSync(inputPath, 'utf8').split('\n---\n').slice(1).join('\n---\n');
  return [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => m[1].replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g, '').replace(/<[^>]+>/g, '').trim())
    .filter(h => h && h !== '参考文献' && h !== '僕の結論');
}

function readMinutes(inputPath) {
  const body = readFileSync(inputPath, 'utf8').split('\n---\n').slice(1).join('\n---\n');
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
