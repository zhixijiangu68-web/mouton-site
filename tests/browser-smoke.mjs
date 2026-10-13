// Actual Chromium smoke tests for the existing site and its four-tab homepage.
// CI builds with Eleventy before running this file; only failures save screenshots.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright';

const root = resolve('.');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function serveBuiltSite() {
  const server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(root, '.' + pathname);
      if (!file.startsWith(root + sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500);
      res.end('Not found');
    }
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  return { server, origin: 'http://127.0.0.1:' + server.address().port };
}

async function checkPage(browser, label, options, run) {
  const context = await browser.newContext({ reducedMotion: 'reduce', ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await run(page);
    assert.deepEqual(errors, [], label + ': uncaught page JavaScript errors');
  } catch (error) {
    await mkdir('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/' + label + '.png', fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

test('MOUTON browser smoke', async t => {
  const { server, origin } = await serveBuiltSite();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await t.test('desktop: original cover and all four tabs', async () => {
      await checkPage(browser, 'desktop-tabs', { viewport: { width: 1440, height: 900 } }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.intro-veil').count(), 1, 'keep the opening animation markup');
        assert.equal(await page.locator('.cover-title').count(), 1);
        assert.equal(await page.locator('[data-home-tab]').count(), 4);
        for (const name of ['reading', 'quiz', 'topics', 'journal']) {
          await page.locator('[data-home-tab="' + name + '"]').click();
          assert.equal(await page.locator('[data-home-tab="' + name + '"]').getAttribute('aria-selected'), 'true');
          assert.equal(await page.locator('[data-home-panel="' + name + '"]').isVisible(), true);
          const visible = await page.locator('[data-home-panel]').evaluateAll(panels => panels.filter(p => !p.hidden).length);
          assert.equal(visible, 1, 'exactly one tab panel should be active');
        }
      });
    });

    await t.test('mobile: menu opens and closes with Escape', async () => {
      await checkPage(browser, 'mobile-menu', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        const menu = page.locator('.menu-toggle');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        await page.locator('[data-home-tab="quiz"]').click();
        assert.equal(await page.locator('[data-home-panel="quiz"]').isVisible(), true);
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow on mobile');
      });
    });

    await t.test('deep links and article navigation', async () => {
      await checkPage(browser, 'deep-link', { viewport: { width: 1024, height: 768 } }, async page => {
        await page.goto(origin + '/index.html#journal', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('[data-home-tab="journal"]').getAttribute('aria-selected'), 'true');
        await page.goto(origin + '/nietzsche.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('h1').count(), 1);
        await page.goto(origin + '/en/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('h1').count(), 1);
      });
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
