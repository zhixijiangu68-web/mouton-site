// Makes note/profile/header.jpg (1280x670, note's header image) and note/profile/icon.png (1024x1024,
// note's profile icon) from the site's own artwork (images/mouton/gold-laurel-wide.webp, icon-512.png).
//   cd scripts/og && npm install && node note-profile.mjs
// The icon is the site's sheep-and-moon app icon, enlarged a little so its rounded transparent corners fall
// outside the square: note crops the icon to a circle itself.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(root, 'note', 'profile');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

const header = await browser.newPage({ viewport: { width: 1280, height: 670 } });
await header.goto(pathToFileURL(join(here, 'note-header.html')).href);
await header.evaluate(() => document.fonts.ready);
await header.screenshot({ path: join(out, 'header.jpg'), type: 'jpeg', quality: 92 });

const icon = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await icon.goto(pathToFileURL(join(here, 'note-icon.html')).href);
await icon.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
await icon.screenshot({ path: join(out, 'icon.png'), type: 'png' });

await browser.close();
console.log('note/profile/header.jpg, note/profile/icon.png');
