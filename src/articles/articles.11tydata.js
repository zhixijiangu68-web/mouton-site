import { readFileSync } from 'node:fs';

// Japanese prose reads at roughly 400–600 characters a minute.
const CHARS_PER_MINUTE = 500;

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
    // Which topic page the article belongs to (philosophy / body / work / food), if any.
    topic: data => data.journal?.category ?? (data.science ? 'food' : null),
  },
};
