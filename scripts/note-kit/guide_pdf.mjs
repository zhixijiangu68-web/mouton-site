// docs/note-copywriting-guide.html → docs/note-copywriting-guide.pdf（A4）。
// 日本語は Noto Serif JP（scripts/og の @fontsource）と IPA ゴシック。
//   node scripts/note-kit/guide_pdf.mjs
//   CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/note-kit/guide_pdf.mjs
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(join(root, 'scripts', 'og', 'package.json'));
const { chromium } = require('playwright');

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();
await page.goto(pathToFileURL(join(root, 'docs', 'note-copywriting-guide.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: join(root, 'docs', 'note-copywriting-guide.pdf'),
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:8px;color:#8a8577;text-align:center;font-family:Georgia,serif;letter-spacing:.08em;">MOUTON — note copywriting guide · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log('docs/note-copywriting-guide.pdf');
