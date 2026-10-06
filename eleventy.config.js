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
// The author's profiles, for structured data.
const sameAs = site => [
  site.author.x && `https://x.com/${site.author.x}`,
  site.author.instagram && `https://www.instagram.com/${site.author.instagram}/`,
].filter(Boolean);

export default function (eleventyConfig) {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())];

  eleventyConfig.addFilter('isoDate', d => ymd(new Date(d)).join('-'));
  eleventyConfig.addFilter('dotDate', d => ymd(new Date(d)).join('.'));
  // Pages with affiliate links say so near the top, not only at the end
  // (Japan's stealth-marketing rules): right after the reading time line.
  eleventyConfig.addFilter('prNotice', (html, show) => {
    if (!show) return html;
    const notice = '<p class="pr-notice">PR｜この記事には広告（アフィリエイトリンク）が含まれます。<a href="privacy.html">詳しく</a></p>';
    return html.replace(/(<p class="reading-time">[\s\S]*?<\/p>)/, `$1${notice}`);
  });
  eleventyConfig.addFilter('guideCards', items =>
    items.filter(a => a.data.guide).sort((a, b) => a.data.guide.order - b.data.guide.order));
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
  // Articles in the order of the given slugs (unknown slugs are skipped).
  eleventyConfig.addFilter('bySlugs', (items, slugs = []) => {
    const bySlug = new Map(items.map(a => [a.page.fileSlug, a]));
    return slugs.map(slug => bySlug.get(slug)).filter(Boolean);
  });
  eleventyConfig.addFilter('head', (items, n) => items.slice(0, n));
  eleventyConfig.addFilter('rfc822', d => new Date(d).toUTCString().replace('GMT', '+0000'));
  eleventyConfig.addFilter('json', v => JSON.stringify(v).replace(/</g, '\\u003c'));
  eleventyConfig.addFilter('absoluteUrl', (path, base) => (base ? new URL(String(path).replace(/^\//, ''), base.replace(/\/?$/, '/')).href : ''));

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

  // Product card for articles that recommend something. Buttons appear only
  // for shops with an affiliate ID set; without any, the card is a plain note.
  //   {% productCard "名前", "ひとこと", { asin: "B0...", amazon: "検索語", rakuten: "検索語" } %}
  eleventyConfig.addShortcode('productCard', function (name, note = '', shops = {}) {
    const { amazonTag, rakutenId } = site.affiliate;
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const buttons = [];
    if (amazonTag && (shops.asin || shops.amazon)) {
      const href = shops.asin
        ? `https://www.amazon.co.jp/dp/${encodeURIComponent(shops.asin)}?tag=${encodeURIComponent(amazonTag)}`
        : `https://www.amazon.co.jp/s?k=${encodeURIComponent(shops.amazon)}&amp;tag=${encodeURIComponent(amazonTag)}`;
      buttons.push(`<a class="product-btn product-amazon" href="${href}" rel="sponsored noopener" target="_blank">Amazonで見る</a>`);
    }
    if (rakutenId && shops.rakuten) {
      const target = /^https?:/.test(shops.rakuten) ? shops.rakuten : `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(shops.rakuten)}/`;
      buttons.push(`<a class="product-btn product-rakuten" href="https://hb.afl.rakuten.co.jp/hgc/${encodeURIComponent(rakutenId)}/?pc=${encodeURIComponent(target)}&amp;m=${encodeURIComponent(target)}" rel="sponsored noopener" target="_blank">楽天で見る</a>`);
    }
    return `<aside class="product-card" aria-label="${esc(name)}">`
      + `<p class="product-name">${esc(name)}${buttons.length ? ' <span class="pr-label">PR</span>' : ''}</p>`
      + (note ? `<p class="product-note">${esc(note)}</p>` : '')
      + (buttons.length ? `<p class="product-btns">${buttons.join('')}</p>` : '')
      + `</aside>`;
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
        sameAs: sameAs(site),
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
        (m, tag, attrs, inner) => `<${tag}${attrs}>${phraseBreaks(inner)}</${tag}>`)
      .replace(/<p(\s[^>]*class="(?:[^"]*\s)?(?:lede|scene-text|copy|newsletter-text|topic-intro)(?:\s[^"]*)?"[^>]*)>([\s\S]*?)<\/p>/g,
        (m, attrs, inner) => `<p${attrs}>${phraseBreaks(inner)}</p>`);
  });

  // WebSite and author for the home page.
  eleventyConfig.addShortcode('siteLd', site => {
    const base = site.url ? site.url.replace(/\/?$/, '/') : null;
    const data = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: site.name, description: site.description, inLanguage: 'ja', ...(base ? { url: base } : {}) },
        { '@type': 'Person', name: site.author.name, description: site.author.bio, sameAs: sameAs(site) },
      ],
    };
    return JSON.stringify(data).replace(/</g, '\\u003c');
  });
  // Home > topic > article, for search results.
  eleventyConfig.addShortcode('breadcrumbLd', (site, topic, headline, url) => {
    if (!site.url) return '';
    const base = site.url.replace(/\/?$/, '/');
    const items = [{ name: site.name, item: base }];
    if (topic) items.push({ name: topic.label, item: new URL(`topic-${topic.key}.html`, base).href });
    items.push({ name: headline, item: url });
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, ...it })),
    }).replace(/</g, '\\u003c');
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
