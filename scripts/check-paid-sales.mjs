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
