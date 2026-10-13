// Checks the generated pages for problems that are easy to miss by eye:
// broken internal links and anchors, duplicate ids, missing title or
// description, and pages without exactly one <h1>. Also basic safety:
// scripts only from known places, no http:// resources, new tabs opened
// with rel="noopener", the security <meta> on every page, and well-formed
// quiz and pick data.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

// Japanese pages at the root, the English edition in en/.
const pages = [
  ...readdirSync('.').filter(f => f.endsWith('.html')),
  ...(existsSync('en') ? readdirSync('en').filter(f => f.endsWith('.html')).map(f => `en/${f}`) : []),
];
const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);
// Each page is read once, even when many pages link to it.
const cache = new Map();
const read = file => { if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf8')); return cache.get(file); };
// Third-party scripts we load on purpose (GA4 and AdSense). Anything else is a mistake.
const scriptHosts = ['https://www.googletagmanager.com/', 'https://pagead2.googlesyndication.com/'];

for (const page of pages) {
  const html = read(page);
  // Duplicate behaviour scripts attach duplicate click handlers (Menu opens then closes).
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  const loaded = new Set();
  for (const src of scripts) {
    if (loaded.has(src)) report(page, `duplicate script "${src}"`);
    loaded.add(src);
    if (/^(https?:)?\/\//.test(src) && !scriptHosts.some(h => src.startsWith(h))) report(page, `script from an unexpected host "${src}"`);
  }
  if (!html.includes('<meta http-equiv="Content-Security-Policy"')) report(page, 'missing Content-Security-Policy meta');
  for (const [tag] of html.matchAll(/<(?:script|link|img|source|iframe)\b[^>]*\s(?:src|href|srcset)="http:\/\/[^"]*"[^>]*>/g)) report(page, `insecure resource ${tag.slice(0, 80)}`);
  for (const [tag] of html.matchAll(/<(?:a|form)\b[^>]*\starget="_blank"[^>]*>/g)) {
    if (!/\srel="[^"]*\bnoopener\b/.test(tag)) report(page, `target="_blank" without rel="noopener": ${tag.slice(0, 80)}`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const idSet = new Set(ids);

  for (const id of idSet) {
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) report(page, `duplicate id "${id}"`);
  }
  if (!/<title>[^<]+<\/title>/.test(html)) report(page, 'missing <title>');
  if (!/<meta name="description" content="[^"]+">/.test(html)) report(page, 'missing meta description');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) report(page, `${h1s} <h1> elements (expected 1)`);

  for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|\/\/)/.test(href)) continue;
    const [rel, hash] = href.split('#');
    // Links are relative to the page's own folder.
    const file = rel && normalize(join(dirname(page), rel)).replace(/\/$/, '/index.html');
    if (file) {
      if (!existsSync(file)) { report(page, `broken link "${href}"`); continue; }
      if (hash && file.endsWith('.html') && file !== page) {
        const target = read(file);
        if (!target.includes(`id="${hash}"`)) report(page, `broken anchor "${href}"`);
      }
    }
    if (hash && (!file || file === page) && !idSet.has(hash)) report(page, `broken anchor "#${hash}"`);
  }
}

// Quiz and pick data are read by the browser scripts: every entry must be
// well-formed and point at a page that exists.
const slug = /^[a-z0-9-]+$/;
for (const [file, dir] of [['quizzes.json', ''], ['en/quizzes.json', 'en/']]) {
  if (!existsSync(file)) continue;
  for (const q of JSON.parse(read(file))) {
    if (!slug.test(q.slug) || typeof q.q !== 'string' || typeof q.a !== 'boolean') report(file, `bad entry ${JSON.stringify(q).slice(0, 80)}`);
    else if (!existsSync(`${dir}${q.slug}.html`)) report(file, `no page for "${q.slug}"`);
  }
}
if (existsSync('picks.json')) {
  for (const a of JSON.parse(read('picks.json'))) {
    if (!slug.test(a.s) || typeof a.t !== 'string') report('picks.json', `bad entry ${JSON.stringify(a).slice(0, 80)}`);
    else if (!existsSync(`${a.s}.html`)) report('picks.json', `no page for "${a.s}"`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${pages.length} pages.`);
  process.exit(1);
}
console.log(`Checked ${pages.length} pages: no problems found.`);
