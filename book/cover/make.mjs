// Makes cover.jpg (1600x2560, the size KDP recommends) from cover.html.
//   cd book/cover && npm install && node make.mjs
// Needs a Chromium for Playwright (CHROME_PATH to pick one).
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1600, height: 2560 } });
await page.goto(pathToFileURL(join(here, 'cover.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(here, 'cover.jpg'), type: 'jpeg', quality: 90 });
await browser.close();
console.log('wrote cover.jpg');
