// Checks the generated pages for problems that are easy to miss by eye:
// broken internal links and anchors, duplicate ids, missing title or
// description, and pages without exactly one <h1>.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

// Japanese pages at the root, the English edition in en/.
const pages = [
  ...readdirSync('.').filter(f => f.endsWith('.html')),
  ...(existsSync('en') ? readdirSync('en').filter(f => f.endsWith('.html')).map(f => `en/${f}`) : []),
];
const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  // Duplicate behaviour scripts attach duplicate click handlers (Menu opens then closes).
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  const loaded = new Set();
  for (const src of scripts) {
    if (loaded.has(src)) report(page, `duplicate script "${src}"`);
    loaded.add(src);
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
        const target = readFileSync(file, 'utf8');
        if (!target.includes(`id="${hash}"`)) report(page, `broken anchor "${href}"`);
      }
    }
    if (hash && (!file || file === page) && !idSet.has(hash)) report(page, `broken anchor "#${hash}"`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${pages.length} pages.`);
  process.exit(1);
}
console.log(`Checked ${pages.length} pages: no problems found.`);
