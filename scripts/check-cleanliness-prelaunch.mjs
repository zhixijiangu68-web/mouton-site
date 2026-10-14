// Sanity checks for the first MOUTON paid-PDF prelaunch funnel.
// Run after Eleventy builds the root-level HTML files.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { waitlistReady } from './waitlist-readiness.mjs';

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
assert(provider === 'stripe', 'Cleanliness Science must use Stripe as the approved seller');
assert(product.checkoutUrl || product.fulfillmentReady === false, 'unconfigured checkout must have fulfillmentReady=false');
assert(product.priceJPY === 2980, 'price must match current 2980 JPY guide');
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
assert(product.pages === 75, 'product must be the complete 75-page edition');
assert(lp.includes('参考文献133件'), 'reference count must match the finished PDF');
assert(lp.includes('<span>14</span>'), 'all 14 chapters must be listed');
assert(home.includes('intro-veil'), 'homepage intro must be preserved');
assert(!lp.includes('今すぐ購入'), 'must not imply checkout is live');
assert.equal(site.prelaunch.ready, waitlistReady(site.prelaunch), 'prelaunch readiness must match validation');
const privacy = read('privacy.html');
if (site.prelaunch.ready) {
  assert(lp.includes('id="cleanliness-waitlist"'), 'verified signup form must render');
  assert(lp.includes('id="cs-waitlist-consent"'), 'explicit consent checkbox is required');
  assert(lp.includes('type="checkbox"') && lp.includes('required'), 'consent must be mandatory');
  assert(lp.includes('href="privacy.html"'), 'privacy policy link required');
  assert(lp.includes('name="embed" value="1"'), 'Buttondown requires embed=1 in HTML forms');
  assert(privacy.includes('有料PDFの先行案内'), 'privacy policy must disclose collection');
} else {
  assert(!lp.includes('id="cleanliness-waitlist"'), 'form must stay disabled before verification');
  assert(lp.includes('先行案内の受付は準備中'), 'prelaunch pending message must remain visible');
  assert(!privacy.includes('先行案内に登録されたメールアドレス'), 'disabled signup must not be described as active');
}
const lpSource = read('src/cleanliness-science.njk');
assert(lpSource.includes('{% elif site.prelaunch and site.prelaunch.ready %}'), 'form must check readiness');
const privacySource = read('src/privacy.njk');
assert(privacySource.includes('site.prelaunch.ready'), 'privacy copy must use same readiness gate');
assert(sample.includes('cleanliness-sample.pdf'), 'download link missing');
const samplePdf = readFileSync('cleanliness-sample.pdf');
assert.equal(samplePdf.subarray(0, 5).toString(), '%PDF-', 'sample download must be a real PDF');
assert(samplePdf.byteLength > 1000, 'sample PDF is unexpectedly small');
assert(sample.includes('「清潔感の科学」は完成しています。') || configured,
  'free sample must reflect that the guide is completed');
assert(!sample.includes('現在制作を検討している商品'), 'outdated product state on sample');
assert(!sample.includes('有料版に収録予定'), 'completed guide cannot be described as planned');
assert(!sample.includes('data-lp-event="begin_checkout"'), 'sample must not present an unapproved checkout');
const lpTemplate = read('src/cleanliness-science.njk');
const faq = lpTemplate.match(/<details><summary>どこで購入できますか？<\/summary><p>([\s\S]*?)<\/p><\/details>/)?.[1] || '';
assert(faq.includes('{% if checkoutReady %}'), 'FAQ must use checkout readiness, not just URL presence');
assert(faq.includes('{% if isStripe %}'), 'FAQ must reflect the configured checkout provider');
assert(sample.includes('data-sample-print'), 'print/PDF feature missing');
assert((sample.match(/class="cs-sample-page(?: |")/g) || []).length === 5, 'sample must have five pages');
assert(article.includes('data-lp-entry'), 'existing cleanliness article should link to LP');
assert(js.includes('sample_click') || lp.includes('sample_click'), 'sample tracking missing');
assert(js.includes('waitlist_submit'), 'waitlist attempt tracking missing');
console.log('Cleanliness prelaunch checks passed.');
