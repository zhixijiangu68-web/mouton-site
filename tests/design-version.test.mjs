import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../design-version.js', import.meta.url), 'utf8');
const key = 'mouton.designVersion';

// Exercise the shipped script's events without a browser dependency. Rendering,
// native select controls, and real BFCache behavior still need a browser check.
function openPage({ url = 'https://example.test/index.html', saved, readBlocked = false, writeBlocked = false } = {}) {
  const values = new Map([['mouton.read', '{"nietzsche":true}']]);
  if (saved !== undefined) values.set(key, saved);
  let rejectWrites = writeBlocked;
  const root = { dataset: {} };
  const meta = { content: '#f8f5ee' };
  const picker = Object.assign(new EventTarget(), { value: 'original' });
  const location = { href: url };
  const history = {
    state: { preserved: true },
    replaceState(state, _title, next) { this.state = state; location.href = String(next); },
  };
  const document = Object.assign(new EventTarget(), {
    documentElement: root,
    readyState: 'loading',
    querySelector: () => meta,
    querySelectorAll: () => document.readyState === 'loading' ? [] : [picker],
  });
  const window = new EventTarget();
  const localStorage = {
    getItem(name) { if (readBlocked) throw new Error('Storage read blocked'); return values.get(name) ?? null; },
    setItem(name, value) { if (rejectWrites) throw new Error('Storage write blocked'); values.set(name, value); },
  };
  runInNewContext(source, { URL, CustomEvent, document, window, localStorage, location, history });
  document.readyState = 'interactive';
  document.dispatchEvent(new Event('DOMContentLoaded'));
  return {
    root, meta, picker, location, history, values,
    choose(value) { picker.value = value; picker.dispatchEvent(new Event('change')); },
    allowWrites() { rejectWrites = false; },
    restore() { window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })); },
    externalChoice(value) {
      if (value === null) values.delete(key); else values.set(key, value);
      window.dispatchEvent(Object.assign(new Event('storage'), { key, newValue: value }));
    },
    unrelatedStorageChange() {
      window.dispatchEvent(Object.assign(new Event('storage'), { key: 'mouton.read', newValue: '{}' }));
    },
  };
}

function expectVersion(page, version) {
  assert.equal(page.root.dataset.version, version);
  assert.equal(page.picker.value, version);
  assert.equal(page.meta.content, version === 'club' ? '#090910' : '#f8f5ee');
}

for (const [name, options, expected] of [
  ['new visit defaults to original', {}, 'original'],
  ['saved choice is restored', { saved: 'club' }, 'club'],
  ['invalid saved choice falls back', { saved: 'invalid' }, 'original'],
  ['URL overrides saved original', { url: 'https://example.test/?version=club', saved: 'original' }, 'club'],
  ['URL overrides saved club', { url: 'https://example.test/?version=original', saved: 'club' }, 'original'],
  ['invalid URL uses saved choice', { url: 'https://example.test/?version=invalid', saved: 'club' }, 'club'],
]) {
  test(name, () => expectVersion(openPage(options), expected));
}

test('switching preserves other URL parameters, the anchor, history state, and reading history', () => {
  const page = openPage({ url: 'https://example.test/index.html?version=club&check=1#journal' });
  assert.equal(page.values.get(key), 'club');
  page.choose('original');
  expectVersion(page, 'original');
  assert.equal(page.values.get(key), 'original');
  assert.equal(page.location.href, 'https://example.test/index.html?version=original&check=1#journal');
  assert.deepEqual(page.history.state, { preserved: true });
  assert.equal(page.values.get('mouton.read'), '{"nietzsche":true}');
});

test('switching a plain URL does not add a version parameter', () => {
  const page = openPage();
  page.choose('club');
  expectVersion(page, 'club');
  assert.equal(page.values.get(key), 'club');
  assert.equal(page.location.href, 'https://example.test/index.html');
});

test('another tab updates the choice and an existing version URL', () => {
  const page = openPage({ url: 'https://example.test/?version=club' });
  page.externalChoice('original');
  expectVersion(page, 'original');
  assert.equal(page.location.href, 'https://example.test/?version=original');
});

test('restoring a saved page reads the latest shared choice', () => {
  const page = openPage({ saved: 'club' });
  page.values.set(key, 'original');
  page.restore();
  expectVersion(page, 'original');
});

for (const initialChoice of ['URL', 'picker']) {
  test(`restoring preserves an unsaved ${initialChoice} choice when writes fail`, () => {
    const page = openPage({
      url: initialChoice === 'URL' ? 'https://example.test/?version=club' : 'https://example.test/',
      saved: 'original', writeBlocked: true,
    });
    if (initialChoice === 'picker') page.choose('club');
    page.unrelatedStorageChange();
    page.restore();
    expectVersion(page, 'club');
    assert.equal(page.values.get(key), 'original');
    assert.equal(page.location.href, initialChoice === 'URL' ? 'https://example.test/?version=club' : 'https://example.test/');
  });
}

test('a successful retry restores normal shared-state handling', () => {
  const page = openPage({ saved: 'original', writeBlocked: true });
  page.choose('club');
  page.allowWrites();
  page.choose('club');
  assert.equal(page.values.get(key), 'club');
  page.values.set(key, 'original');
  page.restore();
  expectVersion(page, 'original');
});

test('a later external choice supersedes an unsaved selection', () => {
  const page = openPage({ saved: 'original', writeBlocked: true });
  page.choose('club');
  page.externalChoice('original');
  expectVersion(page, 'original');
  page.values.set(key, 'club');
  page.restore();
  expectVersion(page, 'club');
});

test('removing the saved choice in another tab resets to original', () => {
  const page = openPage({ saved: 'club' });
  page.externalChoice(null);
  expectVersion(page, 'original');
});

test('blocked storage still allows switching and restoring the current page', () => {
  const page = openPage({ readBlocked: true, writeBlocked: true });
  page.choose('club');
  page.restore();
  expectVersion(page, 'club');
});
