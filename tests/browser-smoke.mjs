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
    await t.test('desktop: original cover with three theme cards, no tabs', async () => {
      await checkPage(browser, 'desktop-home', { viewport: { width: 1440, height: 900 } }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.intro-veil').count(), 1, 'keep the opening animation markup');
        assert.equal(await page.locator('.cover-title').count(), 1);
        assert.equal(await page.locator('.cover-choice-card').count(), 3);
        assert.equal(await page.locator('[data-home-tab]').count(), 0, 'tabs were removed from the homepage');
      });
    });

    for (const [i, device] of ['desktop','mobile'].entries()) {
      const scene = 'gold-laurel';
      const introArt = device === 'desktop' ? 'gold-laurel-wide.webp' : 'intro-sheep-moon.webp';
      await t.test('fixed background, device intro art and immediate skip: ' + device, async () => {
        await checkPage(browser, 'static-' + device, {
          reducedMotion: 'no-preference',
          viewport: i ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        }, async page => {
          await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, route => route.abort());
          await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
          assert.equal(await page.locator('html').getAttribute('data-home-background'), null, 'no random background any more');
          assert.equal(await page.locator('link[rel="preload"][as="image"][href="images/mouton/gold-laurel-wide.webp"]').count(), 1);
          assert.equal(await page.locator('link[rel="preload"][as="image"][href="images/mouton/intro-sheep-moon.webp"]').getAttribute('media'), '(max-width: 900px)');
          const intro = await page.locator('.intro-veil').evaluate(el => getComputedStyle(el, '::before').backgroundImage);
          assert(intro.includes(introArt), device + ' intro art: ' + intro);
          if (i) await page.keyboard.press('Escape');
          else await page.locator('.intro-veil').click({ force: true });
          const visibleNow = await page.locator('.cover-inner').evaluate(el => ({
            opacity: getComputedStyle(el).opacity,
            animation: getComputedStyle(el).animationName,
            preparing: document.documentElement.classList.contains('intro-preparing'),
          }));
          assert.equal(visibleNow.opacity, '1', 'skip must reveal cards immediately');
          assert.equal(visibleNow.animation, 'none', 'no delayed arrival animation after skip');
          assert.equal(visibleNow.preparing, false);
          const before = await page.locator('.cover-art').evaluate(el => {
            const s = getComputedStyle(el);
            return { background: s.backgroundImage, transform: s.transform, animation: s.animationName };
          });
          assert(before.background.includes(scene + '-wide.webp'));
          assert.equal(before.transform, 'none');
          assert.equal(before.animation, 'none');
          assert.equal(await page.evaluate(async name => {
            const img = new Image(); img.src = 'images/mouton/' + name + '-wide.webp';
            await img.decode(); return img.naturalWidth;
          }, scene), 1536);
          await page.mouse.move(200, 300);
          await page.evaluate(() => scrollTo(0, 150));
          await page.waitForTimeout(1100); // Late font preparation must not restart the intro.
          assert.equal(await page.locator('.cover-inner').evaluate(el => getComputedStyle(el).opacity), '1');
          assert.equal(await page.locator('.cover-art').evaluate(el => getComputedStyle(el).backgroundImage), before.background);
          assert.equal(await page.locator('.cover-art').evaluate(el => getComputedStyle(el).transform), 'none');
          assert.equal(await page.locator('.hero-light,.cover-light,.hero-word').count(), 0);
        });
      });
    }

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
        const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.page <= sizes.viewport + 2, 'horizontal overflow on mobile');
      });
    });

    await t.test('mobile journal: title stays readable at 320px and 390px including retired edition links', async () => {
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
          const entry = page.locator('#journal .journal-item:not(.is-hidden):not(.is-collapsed)').first();
          assert.equal(await entry.count(), 1, label + ': journal entry missing');
          const rects = await entry.evaluate(el => {
            const rect = selector => el.querySelector(selector).getBoundingClientRect();
            const outer = el.getBoundingClientRect();
            const date = rect('.journal-date');
            const body = rect('.journal-body');
            const title = rect('.journal-title');
            const arrow = rect('.journal-arrow');
            return {
              outerWidth: outer.width,
              bodyWidth: body.width,
              dateLeft: date.left,
              dateBottom: date.bottom,
              bodyLeft: body.left,
              titleTop: title.top,
              bodyRight: body.right,
              arrowLeft: arrow.left,
              documentWidth: document.documentElement.scrollWidth,
              viewportWidth: innerWidth,
            };
          });
          assert.ok(rects.bodyWidth >= rects.outerWidth * .67,
            label + ': article text is squeezed into a narrow grid column: ' + JSON.stringify(rects));
          assert.ok(Math.abs(rects.dateLeft - rects.bodyLeft) < 2,
            label + ': date and article text should align');
          assert.ok(rects.dateBottom <= rects.titleTop + 2,
            label + ': date should appear above the title');
          assert.ok(rects.arrowLeft >= rects.bodyRight - 2,
            label + ': arrow should be to the right of the article text');
          assert.ok(rects.documentWidth <= rects.viewportWidth + 2,
            label + ': page overflows horizontally');
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
        assert.ok((await page.locator('#journal .journal-item').count()) > 0, 'journal list missing');
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

    await t.test('mobile menu: concealed panel anchors and focus recovery', async () => {
      await checkPage(browser, 'menu-anchors', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        const menu = page.locator('.menu-toggle');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('main').evaluate(el => el.inert), true, 'background should be inert');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('main').evaluate(el => el.inert), false);
        assert.equal(await menu.evaluate(el => el === document.activeElement), true, 'focus should return to menu button');
        await menu.click();
        await page.locator('.site-links a[href="journal.html"]').first().click();
        await page.waitForURL('**/journal.html');
        await page.goto(origin + '/index.html#think', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('#think').count(), 1, 'cover anchor must remain');
      });
    });

    await t.test('no JavaScript: theme cards and journal remain readable', async () => {
      await checkPage(browser, 'no-js-home', {
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, javaScriptEnabled: false,
      }, async page => {
        await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('a[href="topic-philosophy.html"]').count() > 0, true);
        await page.goto(origin + '/journal.html', { waitUntil: 'domcontentloaded' });
        assert.ok((await page.locator('#journal .journal-item').count()) > 0, 'journal must be readable without scripts');
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

    await t.test('MOUTON・LEAP: swipe changes lane, tap jumps, the run ends and restarts', async () => {
      await checkPage(browser, 'leap', { viewport: { width: 390, height: 844 } }, async page => {
        const bad = [];
        page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
        page.on('requestfailed', r => bad.push('failed ' + r.url()));
        await page.goto(origin + '/leap/?seed=11', { waitUntil: 'load' });
        const state = () => page.evaluate(() => window.__moutonLeap.state());
        assert.equal((await state()).mode, 'title');
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
        await page.locator('[data-start]').click();
        assert.equal((await state()).mode, 'play');

        // One finger: a swipe is a drag of a few dozen pixels, a tap is a click.
        const swipe = async dx => {
          await page.mouse.move(195, 520);
          await page.mouse.down();
          await page.mouse.move(195 + dx / 2, 520, { steps: 3 });
          await page.mouse.move(195 + dx, 520, { steps: 3 });
          await page.mouse.up();
        };
        await swipe(80);
        assert.equal((await state()).lane, 1, 'swipe right moves one lane right');
        await swipe(80);
        assert.equal((await state()).lane, 1, 'the sheep stays inside the right lane');
        for (let i = 0; i < 3; i++) await swipe(-80);
        assert.equal((await state()).lane, -1, 'swipes left end at the left lane');
        await page.mouse.click(195, 480);
        assert.equal((await state()).airborne, true, 'a tap jumps');

        // Doing nothing: the first fence ends the run, and the end sheet shows the score.
        await page.waitForFunction(() => window.__moutonLeap.state().mode === 'over', null, { timeout: 20000 });
        const over = await state();
        assert.equal(await page.locator('[data-sheet="over"]').isVisible(), true);
        assert.equal(await page.locator('[data-final]').textContent(), String(over.score));
        assert.equal(over.best, over.score);

        await page.waitForTimeout(700);              // taps right after the end are ignored for a moment
        await page.locator('[data-again]').click();
        const again = await state();
        assert.equal(again.mode, 'play');
        assert.equal(again.plays, 2);
        const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(sizes.width <= sizes.viewport, 'leap: horizontal overflow');
        assert.deepEqual(bad, [], 'leap: every file loads');
      });
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
