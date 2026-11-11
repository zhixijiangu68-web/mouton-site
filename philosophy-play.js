// 哲学ページの遊び（2026-11-11、オーナー「サイトのUIで遊びたい。収益よりも個人の自由を優先したい」）
// 記事の中の data-play を持つ要素にだけ動きを付ける。
//   data-play="dragon"     ニーチェ：竜「汝なすべし」の金色の鱗。なぞるとはがれ、しばらくすると生えてくる
//   data-play="recurrence" ニーチェ：永劫回帰。いちばん下でさらに下へ進むと、冒頭へ戻る
//   data-play="vertigo"    キルケゴール：自由のめまい。のぞき込むと淵が深くなり、言葉が揺れる
//   data-play="conatus"    スピノザ：コナトゥス。押しのけても、文字は元の場所に戻ろうとする
// 言葉は隠さない・遅らせない。動きを減らす設定では何もしない。
'use strict';
(() => {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const hint = (el, text) => {
    const h = document.createElement('div');
    h.className = 'play-hint';
    h.textContent = text;
    el.after(h);
  };

  const local = (el, e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  // 画面に入っているあいだだけ動かす
  const whileVisible = (el, start, stop) => {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { rootMargin: '80px' }).observe(el);
  };

  /* ニーチェ：竜の鱗 ---------------------------------------------------- */
  function dragon(el) {
    el.classList.add('play-dragon');
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    el.prepend(c);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, scales = [], raf = 0, running = false;

    const layout = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = W < 520 ? 28 : 36;
      scales = [];
      let row = 0;
      for (let y = -s * 0.2; y < H + s * 0.6; y += s * 0.55, row++) {
        for (let x = (row % 2 ? 0 : s / 2) - s / 2; x < W + s; x += s) {
          scales.push({ ox: x, oy: y, x, y, r: s / 2, ph: Math.random() * 6.283, vx: 0, vy: 0, rot: 0, vr: 0, a: 1, state: 'on', t: 0 });
        }
      }
    };

    const knock = (px, py) => {
      for (const s of scales) {
        if (s.state !== 'on') continue;
        const dx = s.x - px, dy = s.y - py;
        if (dx * dx + dy * dy < (s.r * 1.5) ** 2) {
          s.state = 'fall'; s.t = performance.now();
          s.vx = dx * 0.06 + (Math.random() - 0.5) * 2;
          s.vy = -1.2 - Math.random() * 1.6;
          s.vr = (Math.random() - 0.5) * 0.25;
        }
      }
    };

    const drawScale = (s, now) => {
      const glow = 0.5 + 0.5 * Math.sin(now / 700 + s.ph);
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, Math.PI);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, s.r);
      g.addColorStop(0, `rgba(214,178,92,${0.10 + glow * 0.12})`);
      g.addColorStop(1, `rgba(170,128,44,${0.20 + glow * 0.16})`);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = `rgba(150,112,38,${0.22 + glow * 0.18})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (s.r >= 14) {
        ctx.fillStyle = `rgba(120,88,26,${0.18 + glow * 0.22})`;
        ctx.font = `${Math.round(s.r * 0.42)}px "Noto Serif JP",serif`;
        ctx.textAlign = 'center';
        ctx.fillText('すべし', 0, s.r * 0.62);
      }
      ctx.restore();
    };

    const frame = (now) => {
      ctx.clearRect(0, 0, W, H);
      for (let i = scales.length - 1; i >= 0; i--) {
        const s = scales[i];
        if (s.state === 'fall') {
          s.vy += 0.22; s.x += s.vx; s.y += s.vy; s.rot += s.vr; s.a -= 0.018;
          if (s.a <= 0) { s.a = 0; s.state = 'gone'; }
        } else if (s.state === 'gone' && now - s.t > 4500) {
          s.state = 'grow'; s.x = s.ox; s.y = s.oy; s.rot = 0; s.a = 0;
        } else if (s.state === 'grow') {
          s.a += 0.02;
          if (s.a >= 1) { s.a = 1; s.state = 'on'; }
        }
        if (s.state !== 'gone') drawScale(s, now);
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    layout();
    window.addEventListener('resize', () => { layout(); }, { passive: true });
    el.addEventListener('pointermove', (e) => { const p = local(el, e); knock(p.x, p.y); });
    el.addEventListener('pointerdown', (e) => { const p = local(el, e); knock(p.x, p.y); });
    whileVisible(el,
      () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
      () => { running = false; cancelAnimationFrame(raf); });
    hint(el, '金色の鱗をなぞると、はがれる。しばらくすると、また生えてくる。');
  }

  /* ニーチェ：永劫回帰 -------------------------------------------------- */
  function recurrence() {
    const C = 2 * Math.PI * 15;
    const bar = document.createElement('div');
    bar.className = 'play-loop';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `<svg viewBox="0 0 36 36"><circle class="ring-bg" cx="18" cy="18" r="15"/><circle class="ring" cx="18" cy="18" r="15" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><span>さらに下へ。もう一度？</span>`;
    const ring = bar.querySelector('.ring');
    const veil = document.createElement('div');
    veil.className = 'play-veil';
    veil.setAttribute('role', 'status');
    document.body.append(bar, veil);

    let p = 0, last = 0, busy = false, ty = null, raf = 0;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    const paint = () => { ring.setAttribute('stroke-dashoffset', String(C * (1 - p))); };

    const decay = (now) => {
      raf = 0;
      if (busy || p <= 0) return;
      if (now - last > 450) { p = Math.max(0, p - 0.015); paint(); }
      raf = requestAnimationFrame(decay);
    };

    const loop = () => {
      busy = true;
      veil.innerHTML = '<div>この人生を、もう一度。<br>そして、数えきれないほど何度も。<small>— ニーチェ『悦ばしき知識』第341節（要約）</small></div>';
      veil.classList.add('is-on');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        p = 0; paint();
        bar.classList.remove('is-shown');
        const h1 = document.querySelector('main h1');
        if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
        setTimeout(() => { veil.classList.remove('is-on'); busy = false; }, 1300);
      }, 1700);
    };

    const push = (d) => {
      if (busy || !atBottom()) return;
      bar.classList.add('is-shown');
      p = Math.min(1, p + d); last = performance.now(); paint();
      if (p >= 1) loop();
      else if (!raf) raf = requestAnimationFrame(decay);
    };

    window.addEventListener('scroll', () => {
      if (busy) return;
      if (atBottom()) bar.classList.add('is-shown');
      else { bar.classList.remove('is-shown'); p = 0; paint(); }
    }, { passive: true });
    window.addEventListener('wheel', (e) => {
      if (e.deltaY <= 0) return;
      const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      push(px / 900);
    }, { passive: true });
    window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (ty === null) return;
      const y = e.touches[0].clientY, dy = ty - y;
      if (dy > 0) push(dy / 360);
      ty = y;
    }, { passive: true });
    window.addEventListener('touchend', () => { ty = null; }, { passive: true });
  }

  /* キルケゴール：自由のめまい ------------------------------------------ */
  function vertigo(el) {
    el.classList.add('play-vertigo');
    const tilt = document.createElement('span');
    tilt.className = 'play-tilt';
    while (el.firstChild) tilt.append(el.firstChild);
    el.append(tilt);
    const abyss = document.createElement('span');
    abyss.className = 'play-abyss';
    abyss.setAttribute('aria-hidden', 'true');
    abyss.innerHTML = '<i></i>'.repeat(5);
    el.prepend(abyss);
    const set = (k, v) => el.style.setProperty(k, v);
    el.addEventListener('pointermove', (e) => {
      const p = local(el, e), x = p.x / p.w, y = p.y / p.h;
      set('--ax', `${x * 100}%`); set('--ay', `${y * 100}%`);
      set('--ry', `${(x - 0.5) * 16}deg`); set('--rx', `${(0.5 - y) * 12}deg`);
      el.classList.add('is-near');
    });
    el.addEventListener('pointerleave', () => {
      ['--ax', '--ay', '--rx', '--ry'].forEach((k) => el.style.removeProperty(k));
      el.classList.remove('is-near');
    });
    hint(el, 'カーソルや指を近づけて、のぞき込んでみる。淵が深くなる。');
  }

  /* スピノザ：コナトゥス ------------------------------------------------ */
  function conatus(el) {
    el.classList.add('play-conatus');
    const sr = document.createElement('span');
    sr.className = 'play-sr';
    sr.textContent = el.textContent;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    const chars = [];
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === Node.TEXT_NODE) {
        for (const ch of n.textContent) {
          if (/\s/.test(ch)) { vis.append(ch); continue; }
          const s = document.createElement('span');
          s.className = 'play-ch';
          s.textContent = ch;
          vis.append(s);
          chars.push({ el: s, hx: 0, hy: 0, ox: 0, oy: 0, vx: 0, vy: 0 });
        }
      } else {
        vis.append(n.cloneNode(true));
      }
    }
    el.replaceChildren(sr, vis);

    let pointer = null, raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      for (const c of chars) {
        c.el.style.transform = '';
        const b = c.el.getBoundingClientRect();
        c.hx = b.left - r.left + b.width / 2;
        c.hy = b.top - r.top + b.height / 2;
        c.ox = c.oy = c.vx = c.vy = 0;
      }
    };

    const step = () => {
      raf = 0;
      let moving = false;
      const R = el.clientWidth < 500 ? 60 : 80;
      for (const c of chars) {
        if (pointer) {
          const dx = c.hx + c.ox - pointer.x, dy = c.hy + c.oy - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) { const f = (1 - d / R) * 3.2; c.vx += (dx / d) * f; c.vy += (dy / d) * f; }
        }
        c.vx += -c.ox * 0.06; c.vy += -c.oy * 0.06;
        c.vx *= 0.82; c.vy *= 0.82;
        c.ox += c.vx; c.oy += c.vy;
        if (Math.abs(c.ox) > 0.1 || Math.abs(c.oy) > 0.1 || Math.abs(c.vx) > 0.05) moving = true;
        else { c.ox = c.oy = c.vx = c.vy = 0; }
        c.el.style.transform = c.ox || c.oy
          ? `translate(${c.ox.toFixed(1)}px,${c.oy.toFixed(1)}px) rotate(${(c.ox * 0.6).toFixed(1)}deg)`
          : '';
      }
      if (moving || pointer) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };

    measure();
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 150); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    el.addEventListener('pointermove', (e) => { pointer = local(el, e); kick(); });
    el.addEventListener('pointerdown', (e) => { pointer = local(el, e); kick(); });
    el.addEventListener('pointerleave', () => { pointer = null; kick(); });
    el.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { pointer = null; kick(); } });
    el.addEventListener('pointercancel', () => { pointer = null; kick(); });
    hint(el, '文字を押しのけても、どの文字も元の場所に戻ろうとする。スピノザはこの力をコナトゥスと呼んだ（『エチカ』第3部定理6）。');
  }

  const kinds = { dragon, vertigo, conatus };
  const init = () => {
    document.querySelectorAll('[data-play]').forEach((el) => {
      const k = el.getAttribute('data-play');
      if (k === 'recurrence') recurrence();
      else if (kinds[k]) kinds[k](el);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
