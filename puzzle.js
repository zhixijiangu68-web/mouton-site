// MOUTON BLOCKS on the page (puzzle.html): drawing the board, dragging and
// tapping pieces, keyboard play, items, rewarded ads and the device ranking.
// The rules themselves live in puzzle-core.js.
import { Game, PIECES, SIZE, ITEMS, at, fits, fitsAnywhere, fullLines, addScore } from './puzzle-core.js';

const root = document.querySelector('[data-puzzle]');
if (root) init(root);

function init(root) {
  const $ = sel => root.querySelector(sel);
  const boardEl = $('[data-board]');
  const slots = [...root.querySelectorAll('[data-slot]')];
  const itemBtns = [...root.querySelectorAll('[data-item]')];
  const itemsEl = $('[data-items]');
  const statusEl = $('[data-status]');
  const overEl = $('[data-over]');
  const adDialog = $('[data-ad-dialog]');
  const rankingEl = document.querySelector('[data-ranking]');
  const rankingEmpty = document.querySelector('[data-ranking-empty]');
  const clearBtn = document.querySelector('[data-clear]');
  const NAMES = { undo: 'もどす', reroll: '引き直し', star: '流れ星' };
  const KEYS = { save: 'mouton.puzzle.save', scores: 'mouton.puzzle.scores' };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const track = (name, params = {}) => { if (typeof window.gtag === 'function') window.gtag('event', name, params); };
  const num = n => n.toLocaleString('ja-JP');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scores = store.get(KEYS.scores, []);
  if (!Array.isArray(scores)) scores = [];
  let game = load() || fresh();
  let mode = null;      // { type: 'select', slot } or { type: 'star' } while waiting for a cell
  let preview = null;   // { slot, r, c } (top-left of a piece) or { star: true, r, c } (centre)
  let cursor = { r: 3, c: 3 };
  let drag = null;
  let paused = false;   // an ad is playing
  let pointerAt = 0;    // when a pointer last handled a slot (its click event is ignored)
  let endTimer = 0;

  function fresh() {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    track('puzzle_start');
    return Game.create(seed);
  }
  function load() {
    const s = store.get(KEYS.save, null);
    if (!s || s.v !== 1 || s.over || !Array.isArray(s.board) || s.board.length !== SIZE * SIZE) return null;
    if (!Array.isArray(s.tray) || !s.tray.every(k => k === null || PIECES[k])) return null;
    try { return new Game(s); } catch { return null; }
  }
  const save = () => store.set(KEYS.save, game.toJSON());
  const say = text => { statusEl.textContent = text; };

  // Board cells, built once; only their attributes change.
  const cells = Array.from({ length: SIZE * SIZE }, () => {
    const el = document.createElement('div');
    el.className = 'pz-cell';
    boardEl.append(el);
    return el;
  });
  const fxEl = document.createElement('div');
  fxEl.className = 'pz-fx';
  fxEl.setAttribute('aria-hidden', 'true');
  boardEl.append(fxEl);

  // ---- Drawing ----------------------------------------------------------

  function ghost() {
    if (!preview || game.over) return null;
    if (preview.star) {
      const area = new Set();
      for (let i = preview.r - 1; i <= preview.r + 1; i++) {
        for (let j = preview.c - 1; j <= preview.c + 1; j++) if (i >= 0 && j >= 0 && i < SIZE && j < SIZE) area.add(at(i, j));
      }
      return { area };
    }
    const piece = game.piece(preview.slot);
    if (!piece) return null;
    const { r, c } = preview;
    const inside = r >= 0 && c >= 0 && r + piece.h <= SIZE && c + piece.w <= SIZE;
    if (!inside) return null;
    const spots = new Set(piece.cells.map(([dr, dc]) => at(r + dr, c + dc)));
    if (!fits(game.board, piece, r, c)) return { bad: spots };
    const next = [...game.board];
    for (const i of spots) next[i] = piece.color;
    const { rows, cols } = fullLines(next);
    const clear = new Set();
    for (const row of rows) for (let j = 0; j < SIZE; j++) clear.add(at(row, j));
    for (const col of cols) for (let j = 0; j < SIZE; j++) clear.add(at(j, col));
    return { spots, color: piece.color, clear };
  }

  function renderBoard() {
    const g = ghost();
    cells.forEach((el, i) => {
      const v = game.board[i];
      const isGhost = Boolean(g?.spots?.has(i));
      el.dataset.c = String(v || (isGhost ? g.color : 0));
      el.classList.toggle('is-ghost', isGhost);
      el.classList.toggle('is-clear', Boolean(g?.clear?.has(i)));
      el.classList.toggle('is-bad', Boolean(g?.bad?.has(i)));
      el.classList.toggle('is-target', Boolean(g?.area?.has(i)));
    });
    boardEl.classList.toggle('is-aiming', Boolean(mode));
  }

  function renderTray() {
    slots.forEach((btn, i) => {
      const piece = game.piece(i);
      btn.replaceChildren();
      btn.disabled = !piece || game.over;
      btn.classList.toggle('is-selected', mode?.type === 'select' && mode.slot === i);
      btn.setAttribute('aria-pressed', String(mode?.type === 'select' && mode.slot === i));
      if (!piece) { btn.setAttribute('aria-label', `ブロック${i + 1}：置きました`); return; }
      const room = fitsAnywhere(game.board, piece);
      btn.classList.toggle('is-blocked', !room);
      btn.setAttribute('aria-label', `ブロック${i + 1}：${piece.cells.length}マス（横${piece.w}×縦${piece.h}）${room ? '' : '、置ける場所なし'}`);
      btn.append(miniPiece(piece));
    });
  }

  function miniPiece(piece) {
    const grid = document.createElement('span');
    grid.className = 'pz-mini';
    grid.style.setProperty('--w', piece.w);
    grid.style.setProperty('--h', piece.h);
    for (const [r, c] of piece.cells) {
      const b = document.createElement('span');
      b.className = 'pz-block';
      b.dataset.c = piece.color;
      b.style.gridArea = `${r + 1} / ${c + 1}`;
      grid.append(b);
    }
    return grid;
  }

  function renderItems() {
    itemBtns.forEach(btn => {
      const item = btn.dataset.item;
      const n = game.items[item];
      const offer = n === 0 && ads.canOffer();
      btn.querySelector('[data-count]').textContent = offer ? '広告で+1' : `×${n}`;
      btn.classList.toggle('is-ad', offer);
      btn.classList.toggle('is-active', mode?.type === 'star' && item === 'star');
      btn.disabled = paused || game.over || !(game.canUse(item) || offer);
      btn.setAttribute('aria-label', offer ? `${NAMES[item]}：広告を見て1つもらう` : `${NAMES[item]}：残り${n}`);
    });
  }

  function renderScore() {
    $('[data-score]').textContent = num(game.score);
    $('[data-best]').textContent = num(Math.max(scores[0]?.s || 0, game.score));
  }

  function renderRanking(fresh) {
    if (!rankingEl) return;
    rankingEl.replaceChildren(...scores.map((e, i) => {
      const li = document.createElement('li');
      if (e === fresh) li.className = 'is-new';
      const rank = document.createElement('span');
      rank.className = 'pz-rank-n';
      rank.textContent = `${i + 1}`;
      const score = document.createElement('strong');
      score.textContent = `${num(e.s)}点`;
      const meta = document.createElement('span');
      meta.className = 'pz-rank-meta';
      meta.textContent = `${e.l}列消し・${String(e.d).replace(/-/g, '.')}`;
      li.append(rank, score, meta);
      return li;
    }));
    rankingEmpty.hidden = scores.length > 0;
    clearBtn.hidden = scores.length === 0;
  }

  function render() {
    $('[data-end]').hidden = game.over;
    renderBoard();
    renderTray();
    renderItems();
    renderScore();
  }

  // ---- Effects ----------------------------------------------------------

  function effects(placed, cleared, text) {
    for (const i of placed) {
      const el = cells[i];
      el.classList.remove('is-pop');
      void el.offsetWidth;
      el.classList.add('is-pop');
    }
    if (reduced()) return;
    for (const [i, color] of cleared) {
      const s = document.createElement('span');
      s.className = 'pz-spark';
      s.dataset.c = color;
      s.style.left = `${cells[i].offsetLeft}px`;
      s.style.top = `${cells[i].offsetTop}px`;
      s.style.animationDelay = `${(i % SIZE + Math.floor(i / SIZE)) * 18}ms`;
      s.addEventListener('animationend', () => s.remove());
      fxEl.append(s);
    }
    if (text && placed.length) {
      // Above the placed piece, but never off the edge of the board.
      const mid = placed.reduce((acc, i) => ({ x: acc.x + cells[i].offsetLeft + cells[i].offsetWidth / 2, y: acc.y + cells[i].offsetTop }), { x: 0, y: 0 });
      const w = boardEl.clientWidth;
      const p = document.createElement('span');
      p.className = 'pz-pop';
      p.textContent = text;
      p.style.left = `${Math.min(Math.max(mid.x / placed.length, w * .3), w * .7)}px`;
      p.style.top = `${Math.max(mid.y / placed.length, w * .12)}px`;
      p.addEventListener('animationend', () => p.remove());
      fxEl.append(p);
    }
  }

  // ---- Actions ----------------------------------------------------------

  function place(slot, r, c) {
    const res = game.place(slot, r, c);
    if (!res) { say('そこには置けません。'); return false; }
    mode = null;
    preview = null;
    save();
    render();
    const bits = [`+${res.gained}`];
    if (res.combo > 1) bits.push(`COMBO ×${res.combo}`);
    if (res.allClear) bits.push('ALL CLEAR');
    effects(res.placed, res.cleared, res.lines ? bits.join('\n') : '');
    if (res.lines) say(`${res.lines}列消しました。+${res.gained}点${res.combo > 1 ? `（コンボ×${res.combo}）` : ''}${res.allClear ? '。盤面がすべて空になりました' : ''}`);
    else say(`+${res.gained}点`);
    afterMove();
    return true;
  }

  function useItem(item) {
    if (paused || game.over) return;
    if (game.items[item] === 0) { if (ads.canOffer()) ads.request(item); return; }
    if (item === 'undo' && game.undo()) { mode = null; preview = null; say('ひとつ前に戻しました。'); }
    else if (item === 'reroll' && game.reroll()) { mode = null; preview = null; say('ブロックを新しい3つに替えました。'); }
    else if (item === 'star' && game.canUse('star')) {
      if (mode?.type === 'star') { cancel(); return; }
      mode = { type: 'star' };
      preview = null;
      say('消したい場所をタップしてください。まわりの3×3が消えます。');
      render();
      return;
    } else return;
    save();
    render();
    afterMove();
  }

  function shootStar(r, c) {
    const res = game.star(r, c);
    if (!res) { say('ブロックのある場所を選んでください。'); return; }
    mode = null;
    preview = null;
    save();
    render();
    effects([], res.cleared, '');
    say(`流れ星で${res.cleared.length}マス消しました。`);
    afterMove();
  }

  function select(slot) {
    if (paused || game.over || !game.piece(slot)) return;
    if (mode?.type === 'select' && mode.slot === slot) { cancel(); return; }
    mode = { type: 'select', slot };
    preview = null;
    say(`ブロック${slot + 1}を選びました。置きたいマスをタップしてください。`);
    render();
  }

  function cancel() {
    mode = null;
    preview = null;
    say('');
    render();
  }

  // After every change: can the game go on?
  function afterMove() {
    clearTimeout(endTimer);
    if (game.over) return;
    const stuck = game.stuck();
    itemsEl.classList.toggle('is-hint', stuck);
    if (!stuck) return;
    const help = ITEMS.some(i => game.canUse(i) || (game.items[i] === 0 && ads.canOffer()));
    if (help) { say('置ける場所がありません。アイテムを使うか、「おわる」で記録します。'); return; }
    say('置ける場所がありません。');
    endTimer = setTimeout(() => { if (game.stuck()) finish(); }, 900);
  }

  function finish() {
    if (game.over) return;
    clearTimeout(endTimer);
    game.end();
    mode = null;
    preview = null;
    store.del(KEYS.save);
    const best = scores[0]?.s || 0;
    const entry = { s: game.score, l: game.lines, d: today(), t: Date.now() };
    let rank = 0;
    if (game.score > 0) {
      ({ list: scores, rank } = addScore(scores, entry));
      store.set(KEYS.scores, scores);
    }
    $('[data-final]').textContent = num(game.score);
    $('[data-rank]').textContent =
      game.score > 0 && !best ? 'はじめての記録です。'
        : game.score > best ? `自己ベスト更新！（これまで ${num(best)}点）`
        : rank ? `この端末で ${rank}位`
        : `自己ベストは ${num(best)}点`;
    $('[data-meta]').textContent = `${game.lines}列消し・${game.moves}手`;
    const url = document.querySelector('link[rel="canonical"]')?.href || location.origin + location.pathname;
    $('[data-share]').href = 'https://x.com/intent/post?' + new URLSearchParams({
      text: `MOUTON BLOCKS で ${num(game.score)}点（${game.lines}列消し）。`, url, via: root.dataset.x || '',
    });
    overEl.hidden = false;
    itemsEl.classList.remove('is-hint');
    render();
    renderRanking(rank ? entry : null);
    say(`おしまい。${num(game.score)}点でした。`);
    track('puzzle_over', { score: game.score, lines: game.lines, moves: game.moves });
    $('[data-final-heading]').focus({ preventScroll: true });
  }

  function again() {
    overEl.hidden = true;
    game = fresh();
    save();
    render();
    say('新しいゲームです。ブロックをドラッグして置いてください。');
    slots[0].focus({ preventScroll: true });
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ---- Geometry ---------------------------------------------------------

  function metrics() {
    const a = cells[0].getBoundingClientRect();
    const b = cells[1].getBoundingClientRect();
    return { left: a.left, top: a.top, cell: a.width, pitch: b.left - a.left };
  }
  function cellAt(x, y) {
    const m = metrics();
    const gap = m.pitch - m.cell;
    const c = Math.floor((x - m.left + gap / 2) / m.pitch);
    const r = Math.floor((y - m.top + gap / 2) / m.pitch);
    return r >= 0 && c >= 0 && r < SIZE && c < SIZE ? { r, c } : null;
  }
  // Where a piece goes when it is centred on a cell, kept on the board.
  function centred(slot, { r, c }) {
    const piece = game.piece(slot);
    return {
      slot,
      r: Math.min(Math.max(r - Math.floor((piece.h - 1) / 2), 0), SIZE - piece.h),
      c: Math.min(Math.max(c - Math.floor((piece.w - 1) / 2), 0), SIZE - piece.w),
    };
  }
  const samePreview = (a, b) => (!a && !b) || (a && b && a.slot === b.slot && a.star === b.star && a.r === b.r && a.c === b.c);
  function setPreview(next) {
    if (samePreview(preview, next)) return;
    preview = next;
    renderBoard();
  }

  // ---- Dragging from the tray -------------------------------------------

  slots.forEach((btn, slot) => {
    btn.addEventListener('pointerdown', e => {
      if (e.button > 0 || paused || game.over || !game.piece(slot) || drag) return;
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      drag = { slot, btn, id: e.pointerId, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== 'mouse', el: null, m: null };
    });
    btn.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.el) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
        lift();
      }
      follow(e.clientX, e.clientY);
    });
    btn.addEventListener('pointerup', e => drop(e, true));
    btn.addEventListener('pointercancel', e => drop(e, false));
    btn.addEventListener('lostpointercapture', e => drop(e, false));
    // Keyboard (Enter / Space) and assistive technology arrive as a plain click.
    btn.addEventListener('click', () => {
      if (performance.now() - pointerAt < 600) return;
      select(slot);
      if (mode?.type === 'select') {
        boardEl.focus({ preventScroll: true });
        aimAtCursor();
      }
    });
  });

  function lift() {
    const piece = game.piece(drag.slot);
    const m = metrics();
    const el = document.createElement('div');
    el.className = 'pz-drag';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--size', `${m.cell}px`);
    el.style.setProperty('--gap', `${m.pitch - m.cell}px`);
    el.style.setProperty('--w', piece.w);
    el.style.setProperty('--h', piece.h);
    for (const [r, c] of piece.cells) {
      const b = document.createElement('span');
      b.className = 'pz-block';
      b.dataset.c = piece.color;
      b.style.gridArea = `${r + 1} / ${c + 1}`;
      el.append(b);
    }
    document.body.append(el);
    drag.el = el;
    drag.m = m;
    drag.piece = piece;
    drag.btn.classList.add('is-lifted');
    if (mode) { mode = null; renderTray(); renderItems(); }
  }

  function follow(x, y) {
    const { m, piece, el } = drag;
    const gap = m.pitch - m.cell;
    const w = piece.w * m.pitch - gap;
    const h = piece.h * m.pitch - gap;
    // On touch screens the piece floats above the finger so it stays visible.
    const left = x - w / 2;
    const top = drag.touch ? y - h - m.pitch * 0.9 : y - h / 2;
    el.style.transform = `translate(${left}px, ${top}px)`;
    // About a cell past the edge still snaps onto the board.
    const near = (v, max) => (v === -1 ? 0 : v === max + 1 ? max : v);
    const r = near(Math.round((top - m.top) / m.pitch), SIZE - piece.h);
    const c = near(Math.round((left - m.left) / m.pitch), SIZE - piece.w);
    setPreview({ slot: drag.slot, r, c });
  }

  function drop(e, commit) {
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag;
    drag = null;
    pointerAt = performance.now();
    d.btn.classList.remove('is-lifted');
    if (!d.el) { if (commit && e.type === 'pointerup') select(d.slot); return; }
    d.el.remove();
    const p = preview;
    preview = null;
    if (commit && p && game.canPlace(d.slot, p.r, p.c)) place(d.slot, p.r, p.c);
    else renderBoard();
  }

  // ---- Tapping and hovering on the board --------------------------------

  boardEl.addEventListener('pointermove', e => {
    if (drag || !mode || e.pointerType !== 'mouse') return;
    const cell = cellAt(e.clientX, e.clientY);
    setPreview(!cell ? null : mode.type === 'star' ? { star: true, ...cell } : centred(mode.slot, cell));
  });
  boardEl.addEventListener('pointerleave', () => { if (!drag && mode && document.activeElement !== boardEl) setPreview(null); });
  boardEl.addEventListener('click', e => {
    if (paused || game.over) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell) return;
    if (!mode) { say('下のブロックをドラッグするか、タップで選んでから置いてください。'); return; }
    if (mode.type === 'star') { shootStar(cell.r, cell.c); return; }
    const p = centred(mode.slot, cell);
    if (!place(mode.slot, p.r, p.c)) setPreview(p);
  });

  // ---- Keyboard on the board --------------------------------------------

  function aimAtCursor() {
    if (!mode) { setPreview(null); return; }
    if (mode.type === 'star') { setPreview({ star: true, ...cursor }); return; }
    const piece = game.piece(mode.slot);
    cursor = { r: Math.min(cursor.r, SIZE - piece.h), c: Math.min(cursor.c, SIZE - piece.w) };
    setPreview({ slot: mode.slot, ...cursor });
  }
  boardEl.addEventListener('focus', aimAtCursor);
  boardEl.addEventListener('blur', () => { if (!drag) setPreview(null); });
  boardEl.addEventListener('keydown', e => {
    if (paused || game.over) return;
    if (['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const slot = Number(e.key) - 1;
      if (!game.piece(slot)) return;
      if (!(mode?.type === 'select' && mode.slot === slot)) select(slot);
      aimAtCursor();
      return;
    }
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key] && mode) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      cursor = { r: Math.min(Math.max(cursor.r + dr, 0), SIZE - 1), c: Math.min(Math.max(cursor.c + dc, 0), SIZE - 1) };
      aimAtCursor();
      say(`${cursor.r + 1}行目・${cursor.c + 1}列目${preview && !preview.star && !game.canPlace(preview.slot, preview.r, preview.c) ? '（置けません）' : ''}`);
    } else if ((e.key === 'Enter' || e.key === ' ') && mode) {
      e.preventDefault();
      if (mode.type === 'star') shootStar(cursor.r, cursor.c);
      else place(mode.slot, preview?.r ?? cursor.r, preview?.c ?? cursor.c);
    } else if (e.key === 'Escape' && mode) {
      e.preventDefault();
      cancel();
    }
  });

  // ---- Buttons ----------------------------------------------------------

  itemBtns.forEach(btn => btn.addEventListener('click', () => {
    useItem(btn.dataset.item);
    if (mode?.type === 'star') boardEl.focus({ preventScroll: true });
  }));
  $('[data-end]').addEventListener('click', () => {
    if (game.over || paused) return;
    if (!game.stuck() && game.moves > 0 && !confirm('このゲームを終えて、スコアを記録しますか？')) return;
    if (game.moves === 0) { say('まだ1つも置いていません。'); return; }
    finish();
  });
  $('[data-again]').addEventListener('click', again);
  $('[data-share]').addEventListener('click', () => track('puzzle_share', { score: game.score }));
  clearBtn?.addEventListener('click', () => {
    if (!confirm('この端末のランキングを消しますか？元には戻せません。')) return;
    scores = [];
    store.del(KEYS.scores);
    renderRanking();
    renderScore();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mode && document.activeElement !== boardEl) cancel(); });

  // ---- Rewarded ads (AdSense H5 Games Ads / Ad Placement API) ---------------
  // Only when site.js turns rewardedAds on (after Google approves the site for
  // H5 Games Ads), or on puzzle.html?adtest=1, which shows Google's test ads.
  // The reward is given only after the ad was watched to the end (adViewed).

  const ads = (() => {
    const test = new URLSearchParams(location.search).has('adtest');
    const client = root.dataset.adClient;
    const enabled = Boolean(client) && (root.dataset.rewarded === 'on' || test);
    const cap = Number(root.dataset.adCap) || 3;
    let failed = false;
    let busy = false;
    if (enabled) {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      if (test) s.dataset.adbreakTest = 'on';
      s.addEventListener('error', () => { failed = true; renderItems(); });
      document.head.append(s);
      window.adConfig({ preloadAdBreaks: 'on', sound: 'off' });
      if (test) root.classList.add('is-adtest');
    }
    // Ask first; the ad plays only if the player chooses to watch it.
    function confirmAd(item, answer) {
      $('[data-ad-text]').textContent = `広告を最後まで見ると、「${NAMES[item]}」が1つもらえます。このゲームでは、あと${cap - game.adRewards}回まで。`;
      const watch = $('[data-ad-watch]');
      const stop = $('[data-ad-cancel]');
      let ok = false;
      const yes = () => { ok = true; adDialog.close(); };
      const no = () => adDialog.close();
      watch.addEventListener('click', yes);
      stop.addEventListener('click', no);
      adDialog.addEventListener('close', () => {
        watch.removeEventListener('click', yes);
        stop.removeEventListener('click', no);
        answer(ok);
      }, { once: true });
      adDialog.showModal();
      watch.focus();
    }
    return {
      test,
      canOffer: () => enabled && !failed && !busy && !game.over && game.adRewards < cap,
      request(item) {
        if (!this.canOffer()) return;
        busy = true;
        renderItems();
        let offered = false;
        let settled = false;
        const done = msg => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          busy = false;
          if (adDialog.open) adDialog.close();
          if (msg) say(msg);
          renderItems();
          afterMove();
        };
        const unavailable = '今は広告を用意できませんでした。少し時間をおいて試してください。';
        const timer = setTimeout(() => { if (!offered) done(unavailable); }, 8000);
        say('広告を準備しています…');
        window.adBreak({
          type: 'reward',
          name: `puzzle-${item}`,
          beforeAd: () => { paused = true; root.classList.add('is-paused'); },
          afterAd: () => { paused = false; root.classList.remove('is-paused'); renderItems(); },
          beforeReward: showAdFn => {
            if (settled) return;
            offered = true;
            clearTimeout(timer);
            confirmAd(item, ok => (ok ? showAdFn() : done('')));
          },
          adDismissed: () => done('広告を最後まで見ると、アイテムがもらえます。'),
          adViewed: () => {
            if (game.reward(item, cap)) {
              save();
              track('puzzle_reward', { item });
              done(`「${NAMES[item]}」を1つもらいました。`);
            } else done('');
          },
          adBreakDone: () => done(offered ? '' : unavailable),
        });
      },
    };
  })();

  // ---- Start ------------------------------------------------------------

  if (ads.test) say('広告テストモードです（Google のテスト広告が出ます）。');
  render();
  renderRanking();
  afterMove();
}
