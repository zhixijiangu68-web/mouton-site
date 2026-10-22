// MOUTON 理解度テスト（2026-10-22、test.html）。一覧から記事を選び、4択の問題に1問ずつ答える。
// 問題はページに書き出した JSON（#rn-tests-data、元は src/_data/understanding/<記事>.json）から読む。
// 答えると、○ 正解／× 不正解（色だけに頼らず文字で）、解説、記事のその節へのリンクを出す。最後に「理解度 X / N」と、間違えた問題。
// 演出・時間制限・点数の記録（保存）はしない。外のサービスは使わない。
// JS が無いとき・ここで失敗したときは、ページに書き出した問題と答え（<details>）がそのまま読める。
(() => {
  'use strict';
  const root = document.querySelector('.rn-test');
  if (!root) return;
  const pick = root.querySelector('.rn-test-pick');
  const quiz = root.querySelector('.rn-quiz');
  let tests = [];
  try { tests = JSON.parse(document.getElementById('rn-tests-data').textContent); } catch (_) { return; }
  if (!pick || !quiz || !tests.length) return;

  const $ = sel => quiz.querySelector(sel);
  const name = $('.rn-quiz-name');
  const ask = $('.rn-quiz-ask');
  const step = $('.rn-quiz-step');
  const question = $('.rn-quiz-q');
  const choices = $('.rn-choices');
  const feedback = $('.rn-feedback');
  const next = $('[data-act="next"]');
  const end = $('.rn-quiz-end');
  const score = $('.rn-quiz-score');
  const missedBox = $('.rn-quiz-missed');
  const bySlug = new Map(tests.map(t => [t.slug, t]));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let test = null;
  let at = 0;
  let right = 0;
  let missed = [];
  let answered = false;

  function start(slug) {
    test = bySlug.get(slug);
    if (!test) return;
    at = 0;
    right = 0;
    missed = [];
    name.textContent = test.title;
    pick.hidden = true;
    end.hidden = true;
    ask.hidden = false;
    quiz.hidden = false;
    show();
  }

  function show() {
    const q = test.questions[at];
    answered = false;
    step.textContent = `${test.questions.length}問中 ${at + 1}問目`;
    question.textContent = q.q;
    choices.innerHTML = q.choices.map((c, k) => `<button type="button" class="rn-choice" data-k="${k}">${esc(c)}</button>`).join('');
    feedback.innerHTML = '';
    next.hidden = true;
    next.textContent = at === test.questions.length - 1 ? '結果を見る' : '次へ';
    question.focus();
  }

  function choose(k) {
    if (answered) return;
    answered = true;
    const q = test.questions[at];
    const ok = k === q.answer;
    if (ok) right += 1; else missed.push(q);
    choices.querySelectorAll('.rn-choice').forEach((b, j) => {
      b.setAttribute('aria-disabled', 'true');
      if (j === q.answer) {
        b.classList.add('is-answer');
        b.insertAdjacentHTML('beforeend', '<span class="rn-choice-tag">○ 正解</span>');
      } else if (j === k) {
        b.classList.add('is-chosen');
        b.insertAdjacentHTML('beforeend', '<span class="rn-choice-tag">× 選んだ答え</span>');
      }
    });
    feedback.innerHTML = `<p class="rn-judge ${ok ? 'is-right' : 'is-wrong'}">${ok ? '○ 正解' : '× 不正解'}</p>`
      + (ok ? '' : `<p class="rn-judge-answer">正解は「${esc(q.choices[q.answer])}」。</p>`)
      + `<p class="rn-why">${esc(q.why)}</p>`
      + `<p class="rn-sec"><a href="${esc(q.href)}">記事のこの節を読む</a></p>`;
    next.hidden = false;
  }

  function finish() {
    ask.hidden = true;
    end.hidden = false;
    score.textContent = `理解度 ${right} / ${test.questions.length}`;
    missedBox.innerHTML = missed.length
      ? '<h3 class="rn-sub">間違えた問題</h3><ol class="rn-missed">' + missed.map(q => '<li>'
        + `<p class="rn-missed-q">${esc(q.q)}</p>`
        + `<p class="rn-missed-a">正解：${esc(q.choices[q.answer])}</p>`
        + `<p class="rn-sec"><a href="${esc(q.href)}">記事のこの節を読む</a></p></li>`).join('') + '</ol>'
      : '<p class="rn-missed-none">間違えた問題は、ありませんでした。</p>';
    score.focus();
  }

  function backToList() {
    const slug = test && test.slug;
    quiz.hidden = true;
    pick.hidden = false;
    const btn = slug && pick.querySelector(`[data-test="${slug}"]`);
    if (btn) btn.focus();
  }

  pick.addEventListener('click', e => {
    const btn = e.target.closest('[data-test]');
    if (btn) start(btn.dataset.test);
  });
  choices.addEventListener('click', e => {
    const btn = e.target.closest('.rn-choice');
    if (btn) choose(Number(btn.dataset.k));
  });
  quiz.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'next') {
      at += 1;
      if (at < test.questions.length) show(); else finish();
    } else if (act.dataset.act === 'again') {
      start(test.slug);
    } else if (act.dataset.act === 'list') {
      backToList();
    }
  });

  // ここまで来たら、一覧に「始める」を出し、JS が無いとき用の問題の一覧をしまう。
  root.classList.add('is-ready');
})();
