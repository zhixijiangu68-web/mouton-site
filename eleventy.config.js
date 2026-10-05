import { existsSync } from 'node:fs';
import { loadDefaultJapaneseParser } from 'budoux';
import site from './src/_data/site.js';

const budoux = loadDefaultJapaneseParser();

// Mark phrase boundaries with <wbr> so headings wrap between phrases in every
// browser (CSS word-break: auto-phrase is Chrome-only).
function phraseBreaks(inner) {
  if (inner.includes('<wbr>')) return inner;
  return inner.split(/(<[^>]+>)/).map(part => {
    if (part.startsWith('<') || !part.trim()) return part;
    const entities = [...part.matchAll(/&[#\w]+;/g)].map(m => [m.index, m.index + m[0].length]);
    let out = '', pos = 0;
    for (const phrase of budoux.parse(part)) {
      const inEntity = entities.some(([s, e]) => pos > s && pos < e);
      out += (pos > 0 && !inEntity ? '<wbr>' : '') + phrase;
      pos += phrase.length;
    }
    return out;
  }).join('');
}


// Builds the site from src/ into the repository root, so hosting keeps
// serving the same files from the same place.
export default function (eleventyConfig) {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())];

  eleventyConfig.addFilter('isoDate', d => ymd(new Date(d)).join('-'));
  eleventyConfig.addFilter('dotDate', d => ymd(new Date(d)).join('.'));
  eleventyConfig.addFilter('scienceCards', items =>
    items.filter(a => a.data.science).sort((a, b) => a.data.science.order - b.data.science.order));
  // First image in the list that exists, or '' so the placeholder art shows.
  // Checking at build time avoids requesting images that are not there yet.
  eleventyConfig.addFilter('firstImage', paths => paths.find(p => existsSync(p)) || '');
  eleventyConfig.addShortcode('bgImage', (...paths) => {
    const src = paths.find(p => existsSync(p));
    return src ? ` style="--img:url('${src}')"` : '';
  });
  // Plain text of every article for the journal's full-text search (loaded on demand).
  eleventyConfig.addFilter('searchIndex', items => JSON.stringify(items.map(a => ({
    url: `${a.page.fileSlug}.html`,
    title: a.data.journal?.title || a.data.science?.title || a.data.headline,
    excerpt: a.data.journal?.excerpt || a.data.science?.text || a.data.description,
    date: ymd(new Date(a.page.date)).join('.'),
    minutes: a.data.readMinutes,
    category: a.data.journal?.category || a.data.topic || a.data.category,
    text: (a.templateContent || '')
      .replace(/<(style|script|nav)[^>]*>[\s\S]*?<\/\1>/g, ' ')
      .replace(/<div class="article-share">[\s\S]*?<\/label><\/div><\/div>/g, ' ')
      .replace(/<details class="reading-toc">[\s\S]*?<\/details>/g, ' ')
      .replace(/<p class="reading-time">[\s\S]*?<\/p>/g, ' ')
      .replace(/リンクを(長押しして)?コピー/g, ' ')
      .replace(/<aside[\s\S]*?<\/aside>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim(),
  }))));
  eleventyConfig.addFilter('findTopic', (topics, key) => topics.find(t => t.key === key) || null);
  eleventyConfig.addFilter('inTopic', (items, key) => items.filter(a => a.data.topic === key));
  // Curated picks first, then the newest articles on the same topic.
  eleventyConfig.addFilter('relatedTo', (items, current, related = [], count = 2) => {
    const bySlug = new Map(items.map(a => [a.page.fileSlug, a]));
    const picks = related.map(slug => bySlug.get(slug)).filter(Boolean);
    for (const a of items) {
      if (picks.length >= count) break;
      if (a.page.fileSlug === current.fileSlug || picks.includes(a)) continue;
      if (a.data.topic && a.data.topic === current.topic) picks.push(a);
    }
    return picks;
  });
  eleventyConfig.addFilter('head', (items, n) => items.slice(0, n));
  eleventyConfig.addFilter('rfc822', d => new Date(d).toUTCString().replace('GMT', '+0000'));
  eleventyConfig.addFilter('json', v => JSON.stringify(v).replace(/</g, '\\u003c'));
  eleventyConfig.addFilter('absoluteUrl', (path, base) => (base ? new URL(path, base.replace(/\/?$/, '/')).href : ''));

  // Amazon links get the associate tag, rel="sponsored" and a visible PR label
  // only once site.affiliate.amazonTag is set.
  eleventyConfig.addShortcode('amazonLink', function (asin, label, className = '') {
    const tag = site.affiliate.amazonTag;
    const url = `https://www.amazon.co.jp/dp/${asin}` + (tag ? `?tag=${encodeURIComponent(tag)}` : '');
    const cls = className ? ` class="${className}"` : '';
    const rel = tag ? ' rel="sponsored noopener"' : '';
    const pr = tag ? ' <span class="pr-label">PR</span>' : '';
    return `<a${cls} href="${url}"${rel}>${label} <span aria-hidden="true">↗</span>${pr}</a>`;
  });

  eleventyConfig.addShortcode('articleLd', (headline, description, date, updated, url, site) => {
    const iso = d => ymd(new Date(d)).join('-');
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline,
      description,
      inLanguage: 'ja',
      datePublished: iso(date),
      dateModified: iso(updated || date),
      author: {
        '@type': 'Person',
        name: site.author.name,
        sameAs: `https://x.com/${site.author.x}`,
        ...(site.url ? { url: new URL('operator.html', site.url.replace(/\/?$/, '/')).href } : {}),
      },
      ...(url ? { mainEntityOfPage: url } : {}),
    };
    return JSON.stringify(data).replace(/</g, '\\u003c');
  });

  eleventyConfig.addTransform('phrase-breaks', function (html) {
    if (!(this.page.outputPath || '').endsWith('.html')) return html;
    return html
      .replace(/<(h[1-3])(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (m, tag, attrs = '', inner) => `<${tag}${attrs}>${phraseBreaks(inner)}</${tag}>`)
      .replace(/<(div|span|a)(\s[^>]*class="(?:[^"]*\s)?(?:journal-title|topic-title|reading-card)(?:\s[^"]*)?"[^>]*)>([^<]*)<\/\1>/g,
        (m, tag, attrs, inner) => `<${tag}${attrs}>${phraseBreaks(inner)}</${tag}>`);
  });

  eleventyConfig.addCollection('articles', api =>
    api.getFilteredByGlob('src/articles/*.html').sort((a, b) =>
      b.date - a.date || (a.data.journal?.order ?? 999) - (b.data.journal?.order ?? 999)));

  return {
    dir: { input: 'src', output: '.', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'html'],
    htmlTemplateEngine: 'njk',
  };
}
