import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [name, url] of [['kioku','file:///home/user/KIOKU/index.html'],['diary','file:///home/user/AI-JOURNAL/index.html']]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const fails = []; p.on('requestfailed', r => fails.push(r.url().slice(0,60)));
  await p.goto(url); await p.waitForTimeout(4000);
  await p.screenshot({ path: `${out}/${name}-top.png` });
  console.log(name, 'failed requests:', fails.length, fails.slice(0,3));
}
await b.close();
