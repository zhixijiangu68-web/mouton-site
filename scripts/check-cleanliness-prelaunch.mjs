// Sanity checks for the first MOUTON paid-PDF prelaunch funnel.
// Run after Eleventy builds the root-level HTML files.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
for (const file of ['cleanliness-science.html','cleanliness-sample.html','cleanliness-sample.pdf','cleanliness-science.css','cleanliness-sample.css','cleanliness-science.js']) {
  assert(existsSync(file), `missing ${file}`);
}
const lp = read('cleanliness-science.html');
const sample = read('cleanliness-sample.html');
const article = read('cleanliness.html');
const home = read('index.html');
const js = read('cleanliness-science.js');
// Price and sale state come from src/_data/site.js.
const { default: site } = await import('../src/_data/site.js');
const product = site.product.cleanScience;
const provider = product.checkoutProvider || 'booth';
assert(['booth','stripe'].includes(provider), 'checkoutProvider must be booth or stripe');
assert(product.priceJPY === 1980, 'price must match current 1980 JPY guide');
const configured = Boolean(product.checkoutUrl);
if (configured) {
  assert(/^https:\/\//.test(product.checkoutUrl), 'checkoutUrl must be https');
  assert(/^https:\/\//.test(product.legalUrl || ''), 'legalUrl (特定商取引法に基づく表示) is required before selling');
  const checkout = new URL(product.checkoutUrl);
  if (provider === 'stripe') {
    assert(product.fulfillmentReady === true, 'Stripe checkout requires verified PDF fulfillment before going live');
    assert(checkout.hostname === 'buy.stripe.com', 'Stripe checkoutUrl must be a verified buy.stripe.com payment link');
    assert(!checkout.pathname.startsWith('/test_'), 'Stripe test Payment Links must never be published as a live checkout');
  } else {
    assert(checkout.hostname === 'booth.pm' || checkout.hostname.endsWith('.booth.pm'), 'BOOTH checkoutUrl must be a BOOTH URL');
  }
  assert(lp.includes('data-lp-event="begin_checkout"'), 'checkout button missing');
} else {
  assert(lp.includes(provider === 'stripe' ? 'Stripeでの発売準備中' : 'BOOTHでの発売準備中'), 'pre-sale status required');
  assert(!lp.includes('data-lp-event="begin_checkout"'), 'checkout link must be disabled until configured');
}
assert(!lp.includes('buy.stripe.com/test_'), 'sandbox Payment Link must never appear in the public LP');
assert(lp.includes(`${product.priceText}円`), 'price not displayed');
assert(lp.includes('cleanliness-sample.html'), 'sample CTA missing');
assert(lp.includes('id="notify"'), 'interest section missing');
assert(lp.includes('id="offer"'), 'pricing section missing');
assert(lp.includes('id="plan"'), '30 day plan missing');
assert(lp.includes('30日間の実践表'), '30 day worksheet missing');
assert(home.includes('intro-veil') && home.includes('data-home-tabs'), 'homepage intro and tabs must be preserved');
assert(!lp.includes('今すぐ購入'), 'must not imply checkout is live');
assert(!lp.includes('id="cleanliness-waitlist"'), 'form must remain disabled until provider is configured');
assert(sample.includes('cleanliness-sample.pdf'), 'download link missing');
assert(sample.includes('data-sample-print'), 'print/PDF feature missing');
assert((sample.match(/class="cs-sample-page(?: |")/g) || []).length === 5, 'sample must have five pages');
assert(article.includes('data-lp-entry'), 'existing cleanliness article should link to LP');
assert(home.includes('cleanliness-science.html'), 'home entry is missing');
assert(js.includes('sample_click') || lp.includes('sample_click'), 'sample tracking missing');
assert(js.includes('waitlist_submit'), 'waitlist attempt tracking missing');
console.log('Cleanliness prelaunch checks passed.');
