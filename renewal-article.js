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

// 2026-10-28 読まれ方を測る（記事の型の段階1。docs/article-type-20261028.md の「7. 測り方」）：GA4 に次のイベントを送る。
// - rn_table_view：判定表（.rn-verdicts）の半分が見えたら1回。画面より高い表は、画面の半分を占めたら1回
//   （スマホでは表が画面の2倍以上の高さになり、表の半分が一度に画面に入ることは、ほぼないため）
// - rn_row_click：判定表の行の中のリンクを押した。{ row: 上から何行目か（1から）, kind: 'ref'（#ref- へのリンク）か 'section' }
// - rn_question_view：最後の問い（.rn-question）の半分が見えたら1回
// - rn_next_click：「次に読む」のリンクを押した。{ position: 1 か 2 }
// - rn_follow_click：続きの口のリンクを押した。{ target: 'x' か 'rss' }
// gtag があるときだけ送る。ブラウザへの保存（ローカルストレージ・セッションストレージ・Cookie）もタイマーも使わない（npm test が確かめる）。
// 送るのは上の名前と値だけで、個人を見分ける値やページの文章は送らない。IntersectionObserver の無いブラウザでは「見えた」を送らない（例外は出さない）。
(() => {
  'use strict';
  const send = (name, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  };
  if ('IntersectionObserver' in window) {
    const views = new Map();
    for (const [selector, name] of [['.rn-verdicts', 'rn_table_view'], ['.rn-question', 'rn_question_view']]) {
      const el = document.querySelector(selector);
      if (el) views.set(el, name);
    }
    if (views.size) {
      // 見えている割合が1%変わるごとに確かめる（画面より高い表でも、画面の半分を占めたときに気づけるように）
      const steps = [];
      for (let i = 0; i <= 100; i++) steps.push(i / 100);
      const io = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting || !views.has(e.target)) continue;
          const half = e.intersectionRatio >= 0.5 || (e.rootBounds && e.intersectionRect.height >= e.rootBounds.height / 2);
          if (!half) continue;
          io.unobserve(e.target);
          send(views.get(e.target), {});
          views.delete(e.target);
        }
      }, { threshold: steps });
      for (const el of views.keys()) io.observe(el);
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const row = a.closest('.rn-verdicts tbody tr');
    if (row) {
      send('rn_row_click', { row: [...row.parentElement.children].indexOf(row) + 1, kind: href.startsWith('#ref-') ? 'ref' : 'section' });
      return;
    }
    const next = a.closest('.rn-next');
    if (next) {
      const i = [...next.querySelectorAll('a.rn-list-title')].indexOf(a);
      if (i >= 0) send('rn_next_click', { position: i + 1 });
      return;
    }
    if (a.closest('.rn-follow')) {
      const target = /(^|\/)feed\.xml$/.test(href) ? 'rss' : /^https:\/\/x\.com\//.test(href) ? 'x' : '';
      if (target) send('rn_follow_click', { target });
    }
  });
})();
