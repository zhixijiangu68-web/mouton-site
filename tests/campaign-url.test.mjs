import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignUrl } from '../scripts/campaign-url.mjs';

const destination = 'https://moutonarchive.com/cleanliness-science.html';
const params = { source: 'x', medium: 'organic_social', campaign: 'cleanliness_sample_202610', content: 'post01' };

test('creates canonical external SNS link with deterministic UTM names', () => {
  const built = createCampaignUrl(destination, params);
  assert.equal(built,
    destination + '?utm_source=x&utm_medium=organic_social&utm_campaign=cleanliness_sample_202610&utm_content=post01');
  assert.equal(new URL(built).hostname, 'moutonarchive.com');
});

test('content can be omitted while source, medium and campaign stay required', () => {
  const built = createCampaignUrl('https://moutonarchive.com/start.html', {
    source: 'instagram', medium: 'organic_social', campaign: 'brand_intro_202610'
  });
  const url = new URL(built);
  assert.equal(url.searchParams.size, 3);
  assert.equal(url.searchParams.has('utm_content'), false);
});

test('in-page hash survives and UTM parameters appear before it', () => {
  const built = createCampaignUrl('https://moutonarchive.com/index.html#journal', params);
  const url = new URL(built);
  assert.equal(url.hash, '#journal');
  assert.equal(url.searchParams.get('utm_source'), 'x');
});

test('refuses offsite, insecure or credential-bearing links', () => {
  for (const bad of [
    'http://moutonarchive.com/cleanliness-science.html',
    'https://lookalike-moutonarchive.com/start.html',
    'https://moutonarchive.com.evil.example/start.html',
    'https://somebody:password@moutonarchive.com/start.html',
    '/relative.html',
  ]) {
    assert.throws(() => createCampaignUrl(bad, params), /destination/);
  }
});

test('refuses arbitrary query strings to prevent leaks and duplicate UTM', () => {
  for (const bad of [
    destination + '?utm_source=x',
    destination + '?email=somebody%40example.com',
    destination + '?ref=abc',
  ]) assert.throws(() => createCampaignUrl(bad, params), /query parameters/);
});

test('enforces consistent lowercase campaign tokens', () => {
  for (const bad of ['Upper', 'has space', 'with.dot', 'person@example.com', 'a'.repeat(65), 'x&y', '']) {
    assert.throws(() => createCampaignUrl(destination, { ...params, campaign: bad }), /campaign/);
  }
  assert.throws(() => createCampaignUrl(destination, { ...params, medium: 'Paid Social' }), /medium/);
  assert.throws(() => createCampaignUrl(destination, { ...params, source: undefined }), /source/);
  assert.throws(() => createCampaignUrl(destination, { ...params, content: 'my@account' }), /content/);
});
