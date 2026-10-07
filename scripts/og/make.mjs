// Makes images/og/<slug>.jpg (1200x630) for every article from its built page.
//   cd scripts/og && npm install && node make.mjs
// Needs a Chromium for Playwright (CHROME_PATH to pick one). Run `npm run build`
// in the repo root first: titles are read from the generated HTML.
// Guides with a {% quiz %} get a QUIZ card showing the question; front matter
// `face: "images/faces/<file>.jpg"` adds a face photo on the right.
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(root, 'images', 'og');
mkdirSync(out, { recursive: true });

const labels = { philosophy: 'Philosophy', body: 'Body', food: 'Food & Science', books: 'Bookshelf', work: 'Work' };
const articles = readdirSync(join(root, 'src', 'articles')).filter(f => f.endsWith('.html'));

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(here, 'card.html')).href);
await page.evaluate(() => document.fonts.ready);
for (const file of articles) {
  const src = readFileSync(join(root, 'src', 'articles', file), 'utf8');
  const headline = src.match(/^headline: "(.*)"$/m)?.[1];
  const category = src.match(/^category: (\w+)/m)?.[1];
  if (!headline) continue;
  // The built page carries the phrase breaks (<wbr>) for the headline.
  const built = readFileSync(join(root, file), 'utf8');
  const h1 = built.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? headline;
  const quiz = src.match(/\{% quiz "((?:[^"\\]|\\.)*)"/)?.[1]?.replace(/\\"/g, '"');
  const face = src.match(/^face: "(.*)"$/m)?.[1];
  const faceUrl = face ? pathToFileURL(join(root, face)).href : '';
  await page.evaluate(d => window.render(d), quiz
    ? { title: quiz.replace(/&/g, '&amp;').replace(/</g, '&lt;'), label: labels[category] ?? 'Journal', quiz: true, face: faceUrl }
    : { title: h1, label: labels[category] ?? 'Journal', face: faceUrl });
  if (faceUrl) await page.waitForFunction(() => document.getElementById('face').style.backgroundImage !== '');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, file.replace(/\.html$/, '.jpg')), type: 'jpeg', quality: 86 });
  process.stdout.write('.');
}
await browser.close();
console.log(`\nwrote ${articles.length} images to images/og/`);
