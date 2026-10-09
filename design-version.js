// Run before the stylesheets so the saved edition is present on the first paint.
(() => {
  'use strict';
  const key = 'mouton.designVersion';
  const root = document.documentElement;
  const valid = value => value === 'original' || value === 'club';
  let stored;
  try { stored = localStorage.getItem(key); } catch (_) { /* Storage is optional. */ }
  const requested = new URL(location.href).searchParams.get('version');
  let current = valid(requested) ? requested : valid(stored) ? stored : 'original';

  function apply(value, save = false) {
    current = valid(value) ? value : 'original';
    root.dataset.version = current;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = current === 'club' ? '#090910' : '#f8f5ee';
    document.querySelectorAll('[data-version-picker]').forEach(picker => {
      picker.value = current;
    });
    if (save) {
      try { localStorage.setItem(key, current); } catch (_) { /* Still switch this page. */ }
    }
    document.dispatchEvent(new CustomEvent('mouton:versionchange', { detail: { version: current } }));
  }

  // Explicit edition links also carry the choice to the next page.
  apply(current, valid(requested));

  function reflectUrl() {
    const url = new URL(location.href);
    if (!url.searchParams.has('version')) return;
    url.searchParams.set('version', current);
    try { history.replaceState(history.state, '', url); } catch (_) { /* file: previews */ }
  }

  function bind() {
    document.querySelectorAll('[data-version-picker]').forEach(picker => {
      picker.value = current;
      picker.addEventListener('change', () => {
        apply(picker.value, true);
        reflectUrl();
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();

  // A choice in another tab is reflected here without reloading or losing reading position.
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    apply(event.newValue);
    reflectUrl();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { apply(localStorage.getItem(key)); reflectUrl(); } catch (_) { /* Storage is optional. */ }
  });
})();
