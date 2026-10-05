import site from './src/_data/site.js';

// Builds the site from src/ into the repository root, so hosting keeps
// serving the same files from the same place.
export default function (eleventyConfig) {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())];

  eleventyConfig.addFilter('isoDate', d => ymd(new Date(d)).join('-'));
  eleventyConfig.addFilter('dotDate', d => ymd(new Date(d)).join('.'));
  eleventyConfig.addFilter('scienceCards', items =>
    items.filter(a => a.data.science).sort((a, b) => a.data.science.order - b.data.science.order));
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

  eleventyConfig.addCollection('articles', api =>
    api.getFilteredByGlob('src/articles/*.html').sort((a, b) =>
      b.date - a.date || (a.data.journal?.order ?? 999) - (b.data.journal?.order ?? 999)));

  return {
    dir: { input: 'src', output: '.', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'html'],
    htmlTemplateEngine: 'njk',
  };
}
