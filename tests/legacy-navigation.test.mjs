import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
const migration = readFileSync(new URL('../design-version.js', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/index.njk', import.meta.url), 'utf8');
const redirect = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(script => script.includes('const articleRoutes='));
function navigate(hash) {
  let href = 'https://example.test/sub/index.html?version=club&utm_source=smoke&tag=a&tag=b' + hash;
  const values = new Map([['mouton.cover', 'day'], ['mouton.designVersion', 'club'], ['mouton.read', '{"nietzsche":true}']]);
  const replacements = [];
  const location = { get href() { return href; }, reload() { replacements.push(href); } };
  const history = { state: { preserved: true }, replaceState(state, _, value) { this.state = state; href = new URL(value, href).href; } };
  const context = { URL, location, history, document: { documentElement: { dataset: {} } }, localStorage: { removeItem(key) { values.delete(key); } } };
  runInNewContext(migration, context);
  runInNewContext(redirect, context);
  return { href, history, values, replacements };
}
for (const [hash, target] of [['#journal', 'journal.html'], ...['self-image', 'hill', 'nietzsche', 'trampoline', 'stamina'].map(slug => ['#article-' + slug, slug + '.html'])]) {
  test('legacy redirect preserves non-version queries and state: ' + hash, () => {
    const page = navigate(hash);
    assert.equal(page.href, 'https://example.test/sub/' + target + '?utm_source=smoke&tag=a&tag=b');
    assert.equal(page.replacements.length, 1);
    assert.deepEqual(page.history.state, { preserved: true });
    assert.deepEqual([...page.values], [['mouton.read', '{"nietzsche":true}']]);
  });
}
for (const [hash, expected] of [['#now', '#top'], ['#think', '#think'], ['#unknown', '#unknown'], ['', '']]) {
  test('same-page anchor retains queries and history: ' + hash, () => {
    const page = navigate(hash);
    assert.equal(page.href, 'https://example.test/sub/index.html?utm_source=smoke&tag=a&tag=b' + expected);
    assert.deepEqual(page.history.state, { preserved: true });
    assert.equal(page.replacements.length, 0);
  });
}
