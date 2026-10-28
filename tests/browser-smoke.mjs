// Actual Chromium smoke tests for the existing site (simple homepage + journal page).
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
    // 2026-10-21〜22 サイトの作り直し（docs/site-renewal-20261021.md）：トップは見出し・短い文・検索・3つの並び順・記事の一覧だけ。
    const headline = ['君はどういう人間として生きたいのか？', '答えられないのなら知識が足りていない。'];
    await t.test('desktop: the decided headline, search, three orders and the current articles', async () => {
      await checkPage(browser, 'desktop-home', { viewport: { width: 1440, height: 900 } }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.intro-veil').count(), 0, 'no opening veil: the headline is the first thing seen (2026-10-18, copy first)');
        const h1 = (await page.locator('h1').innerText()).replace(/\s+/g, '');
        for (const line of headline) assert.ok(h1.includes(line), 'headline must include ' + line + ', got ' + h1);
        assert.equal(await page.locator('#rn-q').isVisible(), true, 'search box');
        assert.deepEqual(await page.locator('.rn-tabs [role="tab"]').allInnerTexts(), ['新しい順', 'おすすめ', '人気順']);
        const items = page.locator('.rn-current .rn-item');
        assert.ok(await items.count() > 0, 'current articles listed');
        assert.equal(await items.first().isVisible(), true);
        assert.equal(await page.locator('[data-home-tab], .cover-choice-card').count(), 0, 'old homepage parts are gone');
      });
    });

    for (const [i, device] of ['desktop','mobile'].entries()) {
      await t.test('the headline visible at once, no opening veil: ' + device, async () => {
        await checkPage(browser, 'static-' + device, {
          reducedMotion: 'no-preference',
          viewport: i ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        }, async page => {
          await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, route => route.abort());
          await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
          // 2026-10-18（コピーライティング第一）：オープニングの演出は外した。見出しは読み込みと同時に見える
          assert.equal(await page.locator('.intro-veil').count(), 0, 'no opening veil: words first');
          const state = () => page.locator('h1').evaluate(el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return { opacity: s.opacity, animation: s.animationName, top: r.top, bottom: r.bottom };
          });
          const now = await state();
          assert.equal(now.opacity, '1', 'the headline must be visible immediately');
          assert.equal(now.animation, 'none', 'no delayed arrival animation');
          assert.ok(now.top >= 0 && now.bottom <= (i ? 844 : 900), 'the headline is inside the first screen: ' + JSON.stringify(now));
          await page.evaluate(() => scrollTo(0, 150));
          await page.waitForTimeout(1100); // Late font loading must not hide the words.
          assert.equal((await state()).opacity, '1');
        });
      });
    }

    await t.test('mobile: menu links are visible without a toggle, tappable, and nothing overflows', async () => {
      await checkPage(browser, 'mobile-menu', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.menu-toggle').count(), 0, 'no hidden menu on the new pages');
        const links = page.locator('.rn-nav a');
        assert.deepEqual(await links.allInnerTexts(), ['理解度テスト', 'ムートンについて', 'アーカイブ']);
        for (const box of await links.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()))) {
          assert.ok(box.height >= 44, 'menu link must be at least 44px tall: ' + JSON.stringify(box));
          assert.ok(box.right <= 390 + 1, 'menu link must stay on screen: ' + JSON.stringify(box));
        }
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow on mobile');
      });
    });

    await t.test('mobile journal: titles stay readable at 320px and 390px including retired edition links', async () => {
      for (const [label, width, version] of [
        ['journal-320-original', 320, 'original'],
        ['journal-390-original', 390, 'original'],
        ['journal-390-retired-link', 390, 'club'],
      ]) {
        await checkPage(browser, label, {
          viewport: { width, height: 844 }, isMobile: true, hasTouch: true,
        }, async page => {
          await page.goto(origin + '/journal.html?version=' + version, { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('[data-version-picker], [data-cover-toggle], .club-signature').count(), 0);
          assert.equal(await page.locator('html').getAttribute('data-version'), null);
          assert.equal(new URL(page.url()).searchParams.has('version'), false);
          const entry = page.locator('.rn-current .rn-item').first();
          assert.equal(await entry.isVisible(), true, label + ': journal entry missing');
          const rects = await entry.evaluate(el => ({
            item: el.getBoundingClientRect().width,
            title: el.querySelector('.rn-list-title').getBoundingClientRect().width,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
          }));
          assert.ok(rects.title >= rects.item * .67, label + ': title is squeezed: ' + JSON.stringify(rects));
          assert.ok(rects.documentWidth <= rects.viewportWidth + 2, label + ': page overflows horizontally');
        });
      }
    });

    await t.test('making sections: open and close on desktop and phone; anchors expand', async () => {
      for (const [label, options] of [
        ['making-accordion-desktop', { viewport: { width: 1280, height: 900 } }],
        ['making-accordion-phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
      ]) {
        await checkPage(browser, label, options, async page => {
          await page.goto(origin + '/making.html', { waitUntil: 'domcontentloaded' });
          const panels = page.locator('main.making details.mk-accordion');
          assert.equal(await panels.count(), 4, 'every major section has a disclosure control');
          assert.equal(await panels.nth(0).evaluate(el => el.closest('section').getAttribute('aria-labelledby')), 'mk-projects', 'apps (KIOKU, diary) come first');
          assert.equal(await panels.nth(0).evaluate(el => el.open), true, 'apps are initially visible');
          assert.equal(await panels.nth(3).evaluate(el => el.closest('section').id), 'visual-studies', 'visual studies sit last');
          assert.equal(await panels.nth(3).evaluate(el => el.open), false, 'visual studies initially collapsed');
          assert.equal(await panels.nth(1).evaluate(el => el.open), false, 'production log initially collapsed');
          await panels.nth(1).locator('summary').click();
          assert.equal(await panels.nth(1).evaluate(el => el.open), true, 'tap expands the production log');
          await panels.nth(1).locator('summary').click();
          assert.equal(await panels.nth(1).evaluate(el => el.open), false, 'tap collapses the production log');
          await panels.nth(3).locator('summary').click();
          const image = page.locator('.mk-study--two img');
          assert.equal(await image.getAttribute('width'), '508', 'keep the original image dimensions');
          const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
          assert.ok(sizes.width <= sizes.viewport + 2, 'making gallery must not overflow');
          await page.goto(origin + '/making.html#kioku', { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('#kioku').isVisible(), true, 'project deep link opens containing section');
          assert.equal(await page.locator('#mk-projects').count(), 1);
        });
      }
    });

    await t.test('start page: brand introduction reaches the archive (and making through it) on desktop and mobile', async () => {
      for (const [label, options] of [
        ['start-desktop', { viewport: { width: 1440, height: 900 } }],
        ['start-mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
      ]) {
        await checkPage(browser, label, options, async page => {
          await page.goto(origin + '/start.html', { waitUntil: 'domcontentloaded' });
          const main = page.locator('main.start-page');
          assert.equal(await main.getByText('作る。記録する。残していく。', { exact: true }).count(), 1);
          assert.equal(await main.locator('a[href="editorial.html"]').count(), 1, 'editorial policy link remains');
          // 2026-10-17：制作・清潔感の科学・以前の記事はアーカイブへ。はじめての方へからは、アーカイブを通って行ける。
          const archive = main.getByRole('link', { name: 'アーカイブ', exact: true });
          assert.equal(await archive.getAttribute('href'), 'archive.html');
          const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
          assert.ok(sizes.page <= sizes.viewport + 2, label + ': horizontal overflow');
          await archive.click();
          await page.waitForURL('**/archive.html');
          assert.ok(await page.locator('#archive .journal-item').count() > 50, label + ': archived articles listed');
          const making = page.locator('.archive-pages a[href="making.html"]');
          assert.equal(await making.count(), 1, label + ': making reachable from the archive');
          await making.click();
          await page.waitForURL('**/making.html');
          for (const project of ['KIOKU', 'DIARY', 'MOUTON・COUNT', 'MOUTON']) {
            assert.equal(await page.locator('.mk-card h3').filter({ hasText: new RegExp('^' + project + '$') }).count(), 1,
              label + ': missing ' + project + ' project');
          }
        });
      }
    });

    await t.test('making page: purpose, progress and next steps on desktop and mobile', async () => {
      for (const [label, options] of [
        ['making-desktop', { viewport: { width: 1440, height: 900 } }],
        ['making-mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
      ]) {
        await checkPage(browser, label, options, async page => {
          await page.goto(origin + '/making.html', { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('[aria-labelledby="mk-projects"] details').evaluate(el => el.open), true, 'projects open by default');
          assert.equal(await page.locator('.mk-grid > .mk-card').count(), 4);
          for (const [slug, name] of [['kioku', 'KIOKU'], ['diary', 'DIARY'], ['count', 'MOUTON・COUNT'], ['site', 'MOUTON']]) {
            const card = page.locator('.mk-grid > .mk-card#' + slug);
            assert.equal(await card.locator('h3').textContent(), name);
            assert.deepEqual(await card.locator('dl.mk-summary dt').allTextContents(), ['目的', '現在地', '次の一歩']);
            const descriptions = await card.locator('dl.mk-summary dd').allTextContents();
            assert.equal(descriptions.length, 3);
            for (const description of descriptions) assert.ok(description.trim().length >= 12, name + ': missing summary');
            assert.equal(await card.locator('.mk-state').count(), 1, name + ': status badge missing');
            assert.equal(await card.locator('.mk-thumb img').count(), 1, name + ': thumbnail missing');
            assert.equal(await card.getByRole('link', { name: name + ' の詳しい記録' }).getAttribute('href'),
              'making-' + slug + '.html');
          }
          assert.match(await page.locator('#diary .mk-summary dd').nth(1).textContent(), /AIとの接続はまだ未実装/);
          const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
          assert.ok(sizes.page <= sizes.viewport + 2, label + ': horizontal overflow');
          await page.locator('#kioku').getByRole('link', { name: 'KIOKU の詳しい記録' }).click();
          await page.waitForURL('**/making-kioku.html');
          assert.equal(await page.locator('h1').innerText(), 'KIOKU');
        });
      }
    });

    await t.test('making gallery: natural photo ratios, crisp display sizes and no mobile overflow', async () => {
      for (const [label, options] of [
        ['making-photos-desktop', { viewport: { width: 1440, height: 900 } }],
        ['making-photos-mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
        ['making-photos-small', { viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true }],
      ]) {
        await checkPage(browser, label, options, async page => {
          await page.goto(origin + '/making.html#visual-studies', { waitUntil: 'domcontentloaded' });
          const photos = page.locator('.mk-studies-grid .mk-study-photo img');
          assert.equal(await photos.count(), 4, label + ': must have exactly four photographs');
          const sizes = await photos.evaluateAll(async images => {
            await Promise.all(images.map(image => image.decode()));
            return images.map(image => {
              const box = image.getBoundingClientRect();
              const parent = image.closest('.mk-study-photo').getBoundingClientRect();
              return {
                src: image.getAttribute('src'),
                naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
                width: box.width, height: box.height,
                containerWidth: parent.width, containerHeight: parent.height,
              };
            });
          });
          for (const image of sizes) {
            assert.ok(image.naturalWidth > 0 && image.naturalHeight > 0,
              label + ': image failed to load: ' + image.src);
            assert.ok(image.width > 0 && image.height > 0, label + ': image is hidden');
            assert.ok(Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight) < .012,
              label + ': image distorted or cropped: ' + JSON.stringify(image));
            assert.ok(Math.abs(image.containerHeight - image.height) < 2,
              label + ': image frame clips original height: ' + JSON.stringify(image));
            assert.ok(image.width <= image.naturalWidth / 1.85,
              label + ': image enlarged too far for retina screens: ' + JSON.stringify(image));
          }
          assert.ok(sizes[1].width <= 250, label + ': 508px source should stay compact');
          const pageSize = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
          assert.ok(pageSize.page <= pageSize.viewport + 2, label + ': horizontal overflow');
        });
      }
    });

    await t.test('legacy #journal link opens the journal page', async () => {
      await checkPage(browser, 'journal-redirect', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async page => {
        await page.goto(origin + '/index.html#journal', { waitUntil: 'domcontentloaded' });
        await page.waitForURL(/journal\.html/);
        assert.ok((await page.locator('.rn-current .rn-item').count()) > 0, 'journal list missing');
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow');
      });
    });

    await t.test('legacy migration preserves campaign queries, reading data and history state', async () => {
      await checkPage(browser, 'legacy-migration', { viewport: { width: 390, height: 844 } }, async page => {
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          localStorage.setItem('mouton.cover', 'day');
          localStorage.setItem('mouton.designVersion', 'club');
          localStorage.setItem('mouton.read', '{"nietzsche":true}');
        });
        await page.addInitScript(() => {
          if (location.pathname.endsWith('/index.html')) history.replaceState({ preserved: true }, '', location.href);
        });
        for (const [hash, path] of [['journal', 'journal.html'], ['article-nietzsche', 'nietzsche.html'], ['now', 'index.html']]) {
          await page.goto(origin + '/index.html?version=club&utm_source=smoke#' + hash, { waitUntil: 'domcontentloaded' });
          await page.waitForURL(url => url.pathname.endsWith('/' + path) && !url.searchParams.has('version') && (hash !== 'now' || url.hash === '#top'));
          assert.equal(new URL(page.url()).searchParams.get('utm_source'), 'smoke');
          assert.deepEqual(await page.evaluate(() => history.state), { preserved: true });
          assert.equal(await page.evaluate(() => localStorage.getItem('mouton.cover')), null);
          assert.equal(await page.evaluate(() => localStorage.getItem('mouton.designVersion')), null);
          assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('mouton.read')).nietzsche));
        }
      });
    });

    // 2026-10-21（オーナー「新しい順、おすすめ、人気順くらいにする。あとは検索機能をつける」）
    await t.test('search and orders: tabs reorder, search filters and finds archive titles, Escape clears', async () => {
      await checkPage(browser, 'search-orders', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        const order = key => page.locator('.rn-current .rn-item:not([hidden])').evaluateAll((els, k) => els.map(el => Number(el.dataset[k])), key);
        const isSorted = list => list.every((v, i) => i === 0 || list[i - 1] <= v);
        assert.ok(isSorted(await order('new')), 'newest first by default');
        await page.getByRole('tab', { name: 'おすすめ' }).click();
        assert.equal(await page.getByRole('tab', { name: 'おすすめ' }).getAttribute('aria-selected'), 'true');
        assert.ok(isSorted(await order('pick')), 'recommended order follows pick');
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.getByRole('tab', { name: '人気順' }).getAttribute('aria-selected'), 'true', 'arrow keys move between orders');
        await page.getByRole('tab', { name: '新しい順' }).click();
        const all = await page.locator('.rn-current .rn-item').count();
        await page.fill('#rn-q', '睡眠');
        assert.equal(await page.locator('.rn-count').isVisible(), true, 'result count is shown');
        assert.ok(await page.locator('.rn-current .rn-item:not([hidden])').count() < all, 'search narrows the list');
        assert.ok(await page.locator('.rn-arc .rn-item').count() > 0, 'archive titles are searched too');
        assert.ok(await page.locator('.rn-current mark, .rn-arc mark').count() > 0, 'matched words are marked');
        assert.match(await page.locator('.rn-arc .rn-item a').first().getAttribute('href'), /^[a-z0-9-]+\.html$/);
        await page.fill('#rn-q', 'zzzzzz');
        assert.equal(await page.locator('.rn-empty').isVisible(), true, 'nothing found message');
        await page.locator('#rn-q').press('Escape');
        assert.equal(await page.locator('.rn-count').isVisible(), false);
        assert.equal(await page.locator('.rn-current .rn-item:not([hidden])').count(), all, 'Escape restores the list');
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow');
      });
    });

    await t.test('no JavaScript: the article list and the test answers remain readable', async () => {
      await checkPage(browser, 'no-js-home', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, javaScriptEnabled: false,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.rn-current .rn-item').first().isVisible(), true, 'list must be readable without scripts');
        assert.equal(await page.locator('.rn-find').isVisible(), false, 'search and orders need scripts, so they stay hidden');
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.rn-current .rn-item').first().isVisible(), true, 'journal must be readable without scripts');
        await page.goto(origin + '/test.html', { waitUntil: 'domcontentloaded' });
        assert.ok(await page.locator('details.rn-test-a').count() > 0, 'questions with answers inside details');
      });
    });

    await t.test('first view: the headline and the lead fit the first screen on a phone', async () => {
      await checkPage(browser, 'first-view-mobile', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        const h1 = await page.locator('h1').evaluate(el => el.getBoundingClientRect().bottom);
        assert.ok(h1 <= 844, 'the headline must be inside the first screen, got bottom=' + h1);
        const lead = await page.locator('.rn-lead').evaluate(el => el.getBoundingClientRect().top);
        assert.ok(lead < 844, 'the lead starts inside the first screen, got top=' + lead);
      });
    });

    await t.test('archive: an archived article carries the note, a current one has a verdict table and no quiz', async () => {
      await checkPage(browser, 'archive-note', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async page => {
        await page.goto(origin + '/coffee.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('article .archive-note').count(), 1, 'archived article shows the archive note');
        assert.equal(await page.locator('.archive-note a[href="index.html"]').count(), 1, 'the note leads to the current articles');
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        const current = await page.locator('.rn-current .rn-item a.rn-list-title').first().getAttribute('href');
        await page.goto(origin + '/' + current, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.archive-note').count(), 0, 'current article has no archive note');
        assert.equal(await page.locator('.quiz-more, [data-qloop], .mini-work, .rn-quiz').count(), 0, 'current article has no quiz or work (tests live on test.html)');
        assert.equal(await page.locator('.rn-verdicts').count(), 1, 'current article has a verdict table');
        await page.goto(origin + '/archive.html', { waitUntil: 'domcontentloaded' });
        assert.ok((await page.locator('#archive .journal-item').count()) > 50, 'archive lists the archived articles');
      });
    });

    // 2026-10-28 記事の型の段階1（docs/article-type-20261028.md）：署名の行・続きの口と、読まれ方のイベント。
    // イベントは gtag があるときだけ、1回ずつ。送る値は決まった名前と番号・種類だけ。IntersectionObserver が無くても例外を出さない。
    await t.test('current article: byline, follow line and one GA4 event per reading step', async () => {
      const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
      let article = '';
      await checkPage(browser, 'article-type-step1', phone, async page => {
        await page.route('**/www.googletagmanager.com/**', route => route.abort());
        const events = () => page.evaluate(() => (window.dataLayer || [])
          .filter(entry => entry[0] === 'event' && /^rn_/.test(entry[1]))
          .map(entry => ({ name: entry[1], params: entry[2] })));
        const count = async name => (await events()).filter(event => event.name === name).length;
        const waitFor = name => page.waitForFunction(n => (window.dataLayer || []).some(entry => entry[0] === 'event' && entry[1] === n), name);
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        article = await page.locator('.rn-current .rn-item a.rn-list-title').first().getAttribute('href');
        await page.goto(origin + '/' + article, { waitUntil: 'domcontentloaded' });

        const byline = page.locator('.rn-byline');
        assert.equal(await byline.count(), 1, 'one byline under the reading time');
        for (const href of ['start.html', 'editorial.html#verdicts', 'editorial.html#ai']) {
          assert.equal(await byline.locator(`a[href="${href}"]`).count(), 1, 'byline links to ' + href);
        }
        assert.ok((await byline.locator('a').first().boundingBox()).height >= 44, 'byline links are at least 44px tall');
        assert.equal(await page.locator('.rn-owner').count(), 0, 'no owner box while owner.note is empty');
        assert.match(await page.locator('.rn-follow').innerText(), /新しい記事は、\s*RSS\s*で知らせている。\s*X（@[^）]+）にも書いている。/);
        const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.width <= sizes.viewport + 2, 'horizontal overflow');

        // 押したリンクで、ページを移らない（イベントだけを見る）
        await page.evaluate(() => document.addEventListener('click', event => {
          if (event.target.closest('.rn-next a, .rn-follow a')) event.preventDefault();
        }, true));
        await page.evaluate(() => document.querySelector('.rn-verdicts').scrollIntoView({ block: 'start' }));
        await waitFor('rn_table_view');
        const row = await page.evaluate(() => [...document.querySelectorAll('.rn-verdicts tbody tr')].findIndex(tr => tr.querySelector('a[href^="#ref-"]')));
        assert.ok(row >= 0, 'a verdict row links to a reference');
        await page.locator('.rn-verdicts tbody tr').nth(row).locator('a[href^="#ref-"]').first().click();
        await page.evaluate(() => document.querySelector('.rn-question').scrollIntoView({ block: 'center' }));
        await waitFor('rn_question_view');
        await page.locator('.rn-next a.rn-list-title').nth(1).click();
        await page.locator('.rn-follow a[href="feed.xml"]').click();
        await page.locator('.rn-follow a[href^="https://x.com/"]').click();
        // もう一度見えても、見えたイベントは増えない
        await page.evaluate(() => document.querySelector('.rn-verdicts').scrollIntoView({ block: 'start' }));
        await page.evaluate(() => document.querySelector('.rn-question').scrollIntoView({ block: 'center' }));
        await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
        assert.equal(await count('rn_table_view'), 1, 'the table view is sent once');
        assert.equal(await count('rn_question_view'), 1, 'the question view is sent once');
        const sent = await events();
        const one = name => sent.filter(event => event.name === name).map(event => event.params);
        assert.deepEqual(one('rn_row_click'), [{ row: row + 1, kind: 'ref' }]);
        assert.deepEqual(one('rn_next_click'), [{ position: 2 }]);
        assert.deepEqual(one('rn_follow_click'), [{ target: 'rss' }, { target: 'x' }]);
        assert.deepEqual(one('rn_table_view'), [{}]);
        assert.deepEqual(one('rn_question_view'), [{}]);
      });
      await checkPage(browser, 'article-type-step1-no-io', phone, async page => {
        await page.route('**/www.googletagmanager.com/**', route => route.abort());
        await page.addInitScript(() => { delete window.IntersectionObserver; });
        await page.goto(origin + '/' + article, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.evaluate(() => 'IntersectionObserver' in window), false);
        await page.evaluate(() => document.addEventListener('click', event => {
          if (event.target.closest('.rn-next a')) event.preventDefault();
        }, true));
        await page.locator('.rn-next a.rn-list-title').first().click();
        const sent = await page.evaluate(() => (window.dataLayer || []).filter(entry => entry[0] === 'event' && /^rn_/.test(entry[1])).map(entry => entry[1]));
        assert.deepEqual(sent, ['rn_next_click'], 'clicks are still counted without IntersectionObserver');
      });
    });

    // 2026-10-22（オーナー「記事について、どれくらいの理解度があるのかを測るテストも作成したい」。記事とは切り離す）
    await t.test('understanding test: answer every question, see the score and links to the article sections', async () => {
      await checkPage(browser, 'understanding-test', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async page => {
        await page.goto(origin + '/test.html', { waitUntil: 'domcontentloaded' });
        await page.locator('.rn-test-start').first().click();
        const total = Number((await page.locator('.rn-quiz-step').innerText()).match(/(\d+)問中/)[1]);
        assert.ok(total >= 8 && total <= 10, 'each test has 8 to 10 questions, got ' + total);
        for (let n = 0; n < total; n++) {
          assert.equal(await page.locator('.rn-choice').count(), 4, 'four choices');
          await page.locator('.rn-choice').nth(n % 4).click();
          assert.match(await page.locator('.rn-judge').innerText(), /^[○×] /, 'right or wrong is shown in words, not colour alone');
          assert.match(await page.locator('.rn-feedback .rn-sec a').getAttribute('href'), /^[a-z0-9-]+\.html#s-\d+$/);
          await page.locator('[data-act="next"]').click();
        }
        assert.match(await page.locator('.rn-quiz-score').innerText(), new RegExp('^理解度 \\d+ / ' + total + '$'));
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow');
        const missed = page.locator('.rn-quiz-missed .rn-sec a');
        if (await missed.count()) {
          const [file, id] = (await missed.first().getAttribute('href')).split('#');
          await page.goto(origin + '/' + file, { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('#' + id).count(), 1, 'the section link points at a real heading');
        }
      });
    });

    await t.test('cleanliness LP and sample: accurate state, PDF and one GA4 event per click', async () => {
      for (const [label, options] of [
        ['cleanliness-desktop', { viewport: { width: 1440, height: 900 } }],
        ['cleanliness-mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
      ]) {
        await checkPage(browser, label, options, async page => {
          // Observe gtag() calls via the site's own dataLayer without sending analytics over the network.
          await page.route('**/www.googletagmanager.com/**', route => route.abort());
          const events = () => page.evaluate(() => (window.dataLayer || [])
            .filter(entry => entry[0] === 'event')
            .map(entry => ({ name: entry[1], params: entry[2] })));
          const blockTrackedNavigation = () => page.evaluate(() => {
            document.addEventListener('click', event => {
              if (event.target.closest('a[data-lp-event]')) event.preventDefault();
            }, true);
          });

          await page.goto(origin + '/cleanliness-science.html', { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('h1#cs-title').count(), 1);
          assert.match(await page.locator('.cs-status').innerText(), /発売準備中/);
          assert.match(await page.locator('.cs-offer-price').innerText(), /2,980/);
          assert.match(await page.locator('.cs-spec').innerText(), /75ページ/);
          assert.match(await page.locator('#cs-contents').locator('..').innerText(), /参考文献133件/);
          assert.equal(await page.locator('a[data-lp-event="begin_checkout"]').count(), 0, 'checkout must remain off');
          assert.equal(await page.locator('#cleanliness-waitlist').count(), 0, 'email signup must remain off');
          assert.equal(await page.locator('a[href="cleanliness-sample.html"]').count() >= 1, true);
          const initial = await events();
          const views = initial.filter(event => event.name === 'view_item');
          assert.equal(views.length, 1, 'one product view event on LP load');
          assert.equal(views[0].params.value, 2980);
          assert.equal(views[0].params.product_id, 'cleanliness_001');
          await blockTrackedNavigation();
          await page.locator('a[data-lp-event="sample_click"][data-placement="hero"]').click();
          await page.locator('a[data-lp-event="lp_cta_click"][data-placement="hero"]').click();
          const lpEvents = await events();
          assert.equal(lpEvents.filter(event => event.name === 'sample_click').length, 1, 'sample click counted once');
          assert.equal(lpEvents.filter(event => event.name === 'lp_cta_click').length, 1, 'offer click counted once');
          assert.equal(lpEvents.find(event => event.name === 'sample_click').params.placement, 'hero');
          assert.equal(lpEvents.filter(event => ['purchase','begin_checkout','generate_lead'].includes(event.name)).length, 0,
            'clicks must not create fake conversions');

          await page.goto(origin + '/cleanliness-sample.html', { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('.cs-sample-document > .cs-sample-page').count(), 5, 'five free Web sample pages');
          assert.match(await page.locator('.cs-sample-after').innerText(), /完成しています/);
          assert.equal(await page.locator('.cs-sample-after').innerText().then(text => text.includes('制作を検討')), false);
          await blockTrackedNavigation();
          await page.locator('a[data-lp-event="sample_pdf_click"]').click();
          await page.evaluate(() => {
            window.__printRequested = false;
            window.print = () => { window.__printRequested = true; };
          });
          await page.locator('[data-sample-print]').click();
          assert.equal(await page.evaluate(() => window.__printRequested), true, 'print dialog was invoked');
          const sampleEvents = await events();
          assert.equal(sampleEvents.filter(event => event.name === 'sample_pdf_click').length, 1);
          assert.equal(sampleEvents.filter(event => event.name === 'sample_print_click').length, 1);
          assert.equal(sampleEvents.filter(event => ['purchase','begin_checkout','generate_lead'].includes(event.name)).length, 0);
          const pdf = await page.request.get(origin + '/cleanliness-sample.pdf');
          assert.equal(pdf.status(), 200);
          assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-', 'download must be PDF');
          await page.goto(origin + '/cleanliness.html', { waitUntil: 'domcontentloaded' });
          await page.evaluate(() => {
            document.addEventListener('click', event => {
              if (event.target.closest('a[data-lp-entry]')) event.preventDefault();
            }, true);
          });
          await page.locator('a[data-lp-entry][data-placement="article_intro"]').click();
          const entryEvents = await events();
          const entry = entryEvents.filter(event => event.name === 'lp_entry_click');
          assert.equal(entry.length, 1, 'article-to-LP click counted once');
          assert.equal(entry[0].params.placement, 'article_intro');
          assert.equal(entry[0].params.source_article, 'cleanliness');
          assert.equal(entryEvents.filter(event => event.name === 'purchase').length, 0);
          await page.goto(origin + '/cleanliness-sample.html', { waitUntil: 'domcontentloaded' });
          const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
          assert.ok(sizes.width <= sizes.viewport + 2, label + ': horizontal overflow');
        });
      }
    });

    await t.test('deep links and article navigation', async () => {
      await checkPage(browser, 'deep-link', { viewport: { width: 1024, height: 768 } }, async page => {
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('h1').count(), 1);
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
