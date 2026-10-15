import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../design-version.js', import.meta.url), 'utf8');

function openPage(blocked = false) {
  const values = new Map([['mouton.designVersion', 'club'], ['mouton.cover', 'day'], ['mouton.read', '{"nietzsche":true}']]);
  const root = { dataset: { version: 'club', cover: 'day', root: '' } };
  const location = { href: 'https://example.test/index.html?version=club&utm_source=test#journal' };
  const history = { state: { preserved: true }, replaceState(state, _, next) { this.state = state; location.href = String(next); } };
  runInNewContext(source, {
    URL, document: { documentElement: root }, location, history,
    localStorage: { removeItem(key) { if (blocked) throw new Error('Storage blocked'); values.delete(key); } },
  });
  return { values, root, location, history };
}

test('retired appearance settings do not return; reading history and navigation survive', () => {
  const p = openPage();
  assert.equal(p.values.has('mouton.cover'), false);
  assert.equal(p.values.has('mouton.designVersion'), false);
  assert.equal(p.values.get('mouton.read'), '{"nietzsche":true}');
  assert.deepEqual(p.root.dataset, { root: '' });
  assert.equal(p.location.href, 'https://example.test/index.html?utm_source=test#journal');
  assert.deepEqual(p.history.state, { preserved: true });
});

test('blocked storage does not prevent opening the normal design', () => {
  const p = openPage(true);
  assert.deepEqual(p.root.dataset, { root: '' });
  assert.equal(p.location.href, 'https://example.test/index.html?utm_source=test#journal');
});
