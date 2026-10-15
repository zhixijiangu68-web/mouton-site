// Compatibility migration: retired appearance choices must not return on old links.
(() => {
  'use strict';
  const root = document.documentElement;
  delete root.dataset.version;
  delete root.dataset.cover;
  for (const key of ['mouton.designVersion', 'mouton.cover']) {
    try { localStorage.removeItem(key); } catch (_) { /* Storage is optional. */ }
  }
  const url = new URL(location.href);
  if (url.searchParams.has('version')) {
    url.searchParams.delete('version');
    try { history.replaceState(history.state, '', url); } catch (_) { /* file: previews */ }
  }
})();
