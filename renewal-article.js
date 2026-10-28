// 2026-10-28 参考文献の折りたたみ：本文の [N]（#ref-N）や目次の「参考文献」（#refs-h）を押したとき、
// またはそのアドレスで開いたときに、折りたたんだ参考文献を開いて、その文献まで移る。動きは足さない。
(() => {
  'use strict';
  const box = document.querySelector('.rn-refs-box');
  if (!box) return;
  const isRef = id => /^(ref-\d+|refs-h)$/.test(id);
  const openTo = id => {
    if (!isRef(id)) return;
    box.open = true;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView();
  };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && isRef(a.getAttribute('href').slice(1))) box.open = true;
  });
  window.addEventListener('hashchange', () => openTo(decodeURIComponent(location.hash.slice(1))));
  openTo(decodeURIComponent(location.hash.slice(1)));
})();
