import { readFileSync } from 'node:fs';

// English prose reads at roughly 200–250 words a minute.
const WORDS_PER_MINUTE = 230;

function readMinutes(inputPath) {
  const body = readFileSync(inputPath, 'utf8').split('\n---\n').slice(1).join('\n---\n');
  const words = body
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g, '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export default {
  layout: 'article.njk',
  permalink: data => `en/${data.page.fileSlug}.html`,
  isArticle: true,
  back: { href: 'index.html#journal', text: 'Back to all articles' },
  eleventyComputed: {
    readMinutes: data => readMinutes(data.page.inputPath),
    topic: data => data.journal?.category ?? (data.science ? 'food' : null),
  },
};
