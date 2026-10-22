// MOUTON 作り直し（2026-10-21）：記事の一覧の並び替え（新しい順・おすすめ・人気順）と検索。
// 一覧そのものはページに書き出してあり、JS が無くても新しい順で読める。ここでは並べ替えと絞り込みだけをする。
// 検索は外のサービスを使わない。ひらがな・カタカナ、全角・半角、大文字・小文字の違いは無視し、
// スペースで区切った言葉をすべて含む記事を出す。アーカイブは題だけを探し、今の記事の下に分けて出す。
(() => {
  'use strict';
  const find = document.querySelector('.rn-find');
  const list = document.querySelector('.rn-current');
  if (!find || !list) return;

  const q = find.querySelector('.rn-q');
  const tabs = [...find.querySelectorAll('[data-sort]')];
  const how = find.querySelector('.rn-how');
  const count = document.querySelector('.rn-count');
  const empty = document.querySelector('.rn-empty');
  const arcBox = document.querySelector('.rn-arc');
  const arcList = arcBox && arcBox.querySelector('ul');
  const items = [...list.querySelectorAll('.rn-item')];
  let archive = [];
  try { archive = JSON.parse(document.getElementById('rn-archive').textContent); } catch (_) { archive = []; }

  const norm = s => String(s).normalize('NFKC').toLowerCase()
    .replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  // ページ内の記事へのリンクだけを許す（例：sleep.html）
  const safeHref = h => (/^[a-z0-9][a-z0-9-]*\.html$/.test(h) ? h : '#');

  // 見つかった言葉に印を付ける（題と要約だけ）。文字は textContent で入れ、HTML として解釈しない
  function mark(el, text, terms) {
    el.textContent = '';
    if (!terms.length) { el.textContent = text; return; }
    const n = norm(text);
    const on = new Array(text.length).fill(false);
    for (const t of terms) {
      for (let i = n.indexOf(t); i !== -1; i = n.indexOf(t, i + t.length)) {
        for (let k = i; k < i + t.length && k < text.length; k++) on[k] = true;
      }
    }
    let i = 0;
    while (i < text.length) {
      let j = i;
      while (j < text.length && on[j] === on[i]) j++;
      const part = text.slice(i, j);
      if (on[i]) {
        const m = document.createElement('mark');
        m.textContent = part;
        el.appendChild(m);
      } else {
        el.appendChild(document.createTextNode(part));
      }
      i = j;
    }
  }
  for (const li of items) {
    for (const el of li.querySelectorAll('.rn-list-title, .rn-list-summary')) el.dataset.plain = el.textContent;
    li.dataset.hay = norm(li.dataset.text || li.textContent);
  }

  const num = (li, key) => Number(li.dataset[key]) || 0;
  const sorters = {
    new: (a, b) => num(a, 'new') - num(b, 'new'),
    pick: (a, b) => num(a, 'pick') - num(b, 'pick') || num(a, 'new') - num(b, 'new'),
    pop: (a, b) => num(b, 'views') - num(a, 'views') || num(a, 'new') - num(b, 'new'),
  };
  let sort = 'new';

  function render() {
    const raw = q.value.trim();
    const terms = raw ? norm(raw).split(/\s+/).filter(Boolean) : [];
    const shown = [];
    for (const li of [...items].sort(sorters[sort])) {
      const hit = terms.every(t => li.dataset.hay.includes(t));
      li.hidden = !hit;
      for (const el of li.querySelectorAll('[data-plain]')) mark(el, el.dataset.plain, hit ? terms : []);
      list.appendChild(li);
      if (hit) shown.push(li);
    }
    const arcHits = terms.length ? archive.filter(a => terms.every(t => norm(a.t).includes(t))) : [];
    if (arcBox) {
      arcBox.hidden = !arcHits.length;
      arcList.replaceChildren(...arcHits.map(a => {
        const li = document.createElement('li');
        li.className = 'rn-item';
        const link = document.createElement('a');
        link.className = 'rn-list-title';
        link.href = safeHref(a.h);
        mark(link, a.t, terms);
        li.appendChild(link);
        return li;
      }));
    }
    if (count) {
      count.hidden = !terms.length;
      count.textContent = terms.length ? `「${raw}」　今の記事 ${shown.length}件${arcHits.length ? `・これまでの記事 ${arcHits.length}件` : ''}` : '';
    }
    if (empty) empty.hidden = !(terms.length && !shown.length && !arcHits.length);
    list.hidden = terms.length > 0 && !shown.length;
  }

  function choose(tab) {
    sort = tab.dataset.sort;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    how.textContent = how.dataset['how' + sort.charAt(0).toUpperCase() + sort.slice(1)] || '';
    render();
  }
  for (const t of tabs) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', () => choose(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = tabs.indexOf(t);
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      choose(next);
    });
  }
  q.addEventListener('input', render);
  q.addEventListener('keydown', e => { if (e.key === 'Escape') { q.value = ''; render(); } });
  render();
})();
