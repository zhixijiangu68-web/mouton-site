// Makes the note header image note/<slug>/header.jpg (2400x1260, note's 1.91:1) with the same card as the site.
//   cd scripts/og && npm install && node note.mjs <slug> "見出し画像の文言" [ラベル] [--quiz]
// Put <br> in the text to choose the line breaks. Needs a Chromium for Playwright (CHROME_PATH to pick one).
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const quiz = args.includes('--quiz');
const [slug, title, label = 'note'] = args.filter(a => a !== '--quiz');
if (!slug || !title) {
  console.error('usage: node note.mjs <slug> "text" [label] [--quiz]');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'note', slug);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(join(here, 'card.html')).href);
await page.evaluate(d => window.render(d), { title, label, quiz });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(out, 'header.jpg'), type: 'jpeg', quality: 88 });
await browser.close();
console.log(`wrote note/${slug}/header.jpg`);
