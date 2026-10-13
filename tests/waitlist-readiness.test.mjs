import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitlistReady } from '../scripts/waitlist-readiness.mjs';

const valid = {
  enabled: true,
  provider: 'buttondown',
  waitlistAction: 'https://buttondown.com/api/emails/embed-subscribe/example-newsletter',
  waitlistEmailField: 'email',
  waitlistService: 'Buttondown',
  doubleOptInVerified: true,
  unsubscribeVerified: true,
  privacyReviewed: true,
  senderDetailsVerified: true,
};

test('default-disabled never reveals form, even with a configured URL', () => {
  assert.equal(waitlistReady(), false);
  assert.equal(waitlistReady({ ...valid, enabled: false }), false);
});

test('ready is true only after all explicit approvals', () => {
  assert.equal(waitlistReady(valid), true);
  for (const key of [
    'doubleOptInVerified', 'unsubscribeVerified', 'privacyReviewed', 'senderDetailsVerified',
  ]) {
    assert.throws(() => waitlistReady({ ...valid, [key]: false }), new RegExp(key));
    assert.throws(() => waitlistReady({ ...valid, [key]: undefined }), new RegExp(key));
  }
});

test('rejects unapproved providers and malformed form fields', () => {
  assert.throws(() => waitlistReady({ ...valid, provider: 'unknown' }), /approved/);
  assert.throws(() => waitlistReady({ ...valid, waitlistService: 'Impersonation' }), /approved/);
  assert.throws(() => waitlistReady({ ...valid, waitlistEmailField: 'address' }), /email field/);
});

test('rejects external, unsafe and test-only subscribe destinations', () => {
  for (const endpoint of [
    '', 'http://buttondown.com/api/emails/embed-subscribe/example',
    'https://buttondown.com.evil.invalid/api/emails/embed-subscribe/example',
    'https://evil.invalid/api/emails/embed-subscribe/example',
    'https://someone:pass@buttondown.com/api/emails/embed-subscribe/example',
    'https://buttondown.com:8443/api/emails/embed-subscribe/example',
    'https://buttondown.com/api/emails/embed-subscribe/example?redirect=https://evil.invalid',
    'https://buttondown.com/api/emails/embed-subscribe/example#fragment',
    'https://buttondown.com/api/emails/embed-subscribe/',
    'https://buttondown.com/api/v1/subscribers',
  ]) {
    assert.throws(() => waitlistReady({ ...valid, waitlistAction: endpoint }), /form action|endpoint/i, endpoint);
  }
});

test('only regular public subscribe paths are accepted', () => {
  assert.equal(waitlistReady({ ...valid, waitlistAction: 'https://buttondown.com/api/emails/embed-subscribe/MOUTON_2026' }), true);
  assert.equal(waitlistReady({ ...valid, waitlistAction: valid.waitlistAction + '/' }), true);
});
