// Sanity checks for selling the three philosophy articles on this site (not on note).
// Payment: Stripe Payment Link. Delivery: Cloudflare Worker emails a time-limited PDF link.
// The buy button may only appear once fulfillment is verified and the 特定商取引法 page exists.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const { default: site } = await import('../src/_data/site.js');
const ph = site.product.philosophy;
assert(ph, 'site.product.philosophy is required');
assert.equal(ph.checkoutProvider, 'stripe', 'philosophy articles are sold with Stripe on this site');
assert.equal(ph.priceJPY, 2980, 'price must match the 2,980 JPY decision');

for (const slug of ['paid-kierkegaard', 'paid-nietzsche', 'paid-spinoza']) {
  const src = read(`src/articles/${slug}.html`);
  const html = read(`${slug}.html`);
  const url = src.match(/^\s*checkoutUrl:\s*"([^"]*)"/m)?.[1];
  assert(url !== undefined, `${slug}: paid.checkoutUrl must exist in front matter`);
  assert(!/^\s*url:\s*"/m.test(src.split('\nlp:')[0]), `${slug}: old note url field must not come back`);
  assert(/price:\s*2980/.test(src), `${slug}: price must be 2980`);
  assert(!html.includes('buy.stripe.com/test_'), `${slug}: sandbox Payment Link must never be published`);
  assert(!/note\.com\/[^"]*"[^>]*class="buy-btn|noteで購入|noteで公開準備中/.test(html), `${slug}: note purchase wording must not remain`);
  const live = Boolean(url && ph.fulfillmentReady && ph.legalUrl);
  if (url) {
    const u = new URL(url);
    assert.equal(u.protocol, 'https:', `${slug}: checkoutUrl must be https`);
    assert.equal(u.hostname, 'buy.stripe.com', `${slug}: checkoutUrl must be a Stripe Payment Link`);
    assert(!u.pathname.startsWith('/test_'), `${slug}: test Payment Links must never be published`);
  }
  if (live) {
    assert(/^https:\/\//.test(ph.legalUrl), 'legalUrl (特定商取引法に基づく表記) must be https');
    assert(html.includes(`class="buy-btn" href="${url}"`), `${slug}: buy button missing although sale is live`);
    assert(html.includes(ph.legalUrl), `${slug}: 特定商取引法に基づく表記 link missing`);
  } else {
    assert(!/<a class="buy-btn"/.test(html), `${slug}: buy button must stay hidden until fulfillment and legal page are ready`);
    assert(html.includes('このサイトでの販売準備中'), `${slug}: pre-sale status required`);
    assert(html.includes('現在は、購入・予約は受け付けていません。'), `${slug}: must say purchases are not accepted yet`);
  }
}
if (ph.fulfillmentReady) assert(/^https:\/\//.test(ph.legalUrl || ''), 'fulfillmentReady requires legalUrl');
console.log('Paid philosophy sales checks passed.');
// 特定商取引法に基づく表記：必要な欄がすべて埋まるまで legal.html は作らない。埋まったら、必要な項目が出ているか確かめる。
{
  const { existsSync } = await import('node:fs');
  const { default: legal } = await import('../src/_data/legal.js');
  if (legal.ready) {
    assert(existsSync('legal.html'), 'legal.html must be built once src/_data/legal.js is complete');
    const page = read('legal.html');
    for (const v of [legal.seller, legal.manager, legal.email, legal.payMethods]) assert(page.includes(v), `legal.html is missing: ${v}`);
    for (const label of ['販売価格', 'お支払い方法', 'お支払いの時期', '商品の引き渡し時期・方法', '返品・返金について', '動作環境']) assert(page.includes(label), `legal.html must include ${label}`);
  } else {
    assert(!existsSync('legal.html'), 'legal.html must not be published until src/_data/legal.js is complete');
    for (const p of Object.values(site.product)) assert(!p.legalUrl || !/legal\.html$/.test(p.legalUrl), 'legalUrl points to legal.html before it exists');
  }
  console.log('Legal page checks passed.');
}
