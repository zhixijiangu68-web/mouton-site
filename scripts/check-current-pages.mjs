// オーナーが決めたことを、生成されたページで確かめる。
// 2026-10-21 作り直し（docs/site-renewal-20261021.md）で、トップと記事の型を新しくした：
// - トップの h1 は、オーナーが決めた見出し（君はどういう人間として生きたいのか？／答えられないのなら知識が足りていない。）
// - トップにオープニングの演出（intro-veil）がない（見出しが最初に見える。2026-10-18 コピーライティング第一）
// - 今の記事（src/_data/currentArticles.js）は新しい型：判定表があり、書き込みワーク・穴埋め・○×クイズ・アーカイブの注記が出ない
// - 公開前の下書き（checking: true）は noindex で、上に「公開前の下書き」の注記が出る
// - それ以外の日本語の記事（アーカイブ）と、アーカイブに移したページには、上に「アーカイブ」の注記が出る
// - 記事一覧は今の記事だけ、アーカイブの一覧はアーカイブの記事をすべて載せる
// - 残すページの小見出し（eyebrow など）は日本語
// - 新しいページの CSS（renewal.css）に、文章を行数や「…」で切る指定がない
// - 理解度テスト（test.html、2026-10-22）：問題のデータの形、記事の節へのリンク、記事とテストが切り離されていること
// - 新しい型の今の記事は、本文が1万〜2万字（2026-10-22、オーナー「サイトは決定版だから重厚にして欲しい」）
// - 記事の型の段階1（2026-10-28、docs/article-type-20261028.md）：署名の行・僕の体験の欄・続きの口・問いは一つ・記事の下の順（ファイルの終わりの節）
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import currentArticles from '../src/_data/currentArticles.js';

const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);
const read = f => readFileSync(f, 'utf8');
// タグは1文字ずつ読んで外す（正規表現の置き換えで外すと、CodeQL が「不完全な複数文字の除去」と判定するため）
const stripTags = s => {
  let out = '';
  let inTag = false;
  for (const ch of String(s)) {
    if (ch === '<') inTag = true;
    else if (ch === '>' && inTag) inTag = false;
    else if (!inTag) out += ch;
  }
  return out;
};
const text = html => stripTags(html);
// 2026-10-22（オーナー「サイトは決定版だから重厚にして欲しい」「サイトは1万~2万文字にする」「これからも同じです」）：
// 新しい型の今の記事は、本文が 10,000〜20,000 字。数えないもの：front matter、参考文献（class="rn-refs" の要素から後ろ）、
// テンプレートのタグ（{% %} と {{ }}）、HTML のタグ、空白と改行。数え方は記事を書くときの道具（count.mjs）と同じ。
// タグは stripTags と同じく1文字ずつ読んで外す（正規表現の置き換えで外さない）
const BODY_MIN = 10000;
const BODY_MAX = 20000;
const bodyLength = src => {
  let body = src.split('\n---\n').slice(1).join('\n---\n');
  const refs = body.indexOf('class="rn-refs"');
  if (refs > 0) body = body.slice(0, body.lastIndexOf('<', refs));
  let n = 0;
  let i = 0;
  while (i < body.length) {
    const two = body.slice(i, i + 2);
    if (two === '{%' || two === '{{') {
      const end = body.indexOf(two === '{%' ? '%}' : '}}', i + 2);
      if (end < 0) break;
      i = end + 2;
      continue;
    }
    if (body[i] === '<') {
      const end = body.indexOf('>', i);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    if (!/\s/.test(body[i])) n += 1;
    i += 1;
  }
  return n;
};
const slugs = readdirSync('src/articles').filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));
const archived = slugs.filter(s => !currentArticles.includes(s));

for (const s of currentArticles) {
  if (!slugs.includes(s)) { report('currentArticles.js', `no article "${s}"`); continue; }
  const html = read(`${s}.html`);
  for (const [needle, why] of [['mw-blank', '穴埋めの空欄'], ['＿＿＿', '穴埋めの空欄'], ['class="mini-work"', '1分ワーク'], ['class="quiz-more', '○×クイズ'], ['class="archive-note"', 'アーカイブの注記'], ['data-qloop', '○×クイズ']]) {
    if (html.includes(needle)) report(`${s}.html`, `今の記事に${why}が出ている（${needle}）`);
  }
  if (!html.includes('class="rn-verdicts"')) report(`${s}.html`, '今の記事に判定表がない（front matter の claims と {% verdictTable claims %}）');
  const src = read(`src/articles/${s}.html`);
  if (/^checking:\s*true/m.test(src)) {
    if (!html.includes('<meta name="robots" content="noindex">')) report(`${s}.html`, '公開前の下書きなのに noindex がない');
    if (!html.includes('class="rn-checking"')) report(`${s}.html`, '公開前の下書きなのに、その注記がない');
  }
  if (/^health:\s*true/m.test(src) && !html.includes('class="rn-health"')) report(`${s}.html`, '健康の記事に注意書きがない');
  if (/^layout:\s*renewal-article\.njk\s*$/m.test(src)) {
    const n = bodyLength(src);
    if (n < BODY_MIN || n > BODY_MAX) report(`src/articles/${s}.html`, `本文が ${n.toLocaleString('en-US')} 字。サイトの記事は1万〜2万字（オーナー、2026-10-22「サイトは決定版だから重厚にして欲しい」）`);
  }
}
for (const s of archived) {
  const html = read(`${s}.html`);
  if (!html.includes('class="archive-note"')) report(`${s}.html`, 'アーカイブの記事に注記がない');
}
// 今のページにも、穴埋めとワークの案内は出さない
for (const p of ['index.html', 'journal.html']) {
  const html = read(p);
  if (/mw-blank|＿＿＿/.test(html)) report(p, '穴埋めの空欄が出ている');
  if (/class="quiz-more|data-qloop/.test(html)) report(p, '○×クイズが出ている');
}
// アーカイブに移したページ（テーマ別・哲学の3本・連載・選び方・クイズ・いま取り組んでいること・お気に入り・制作・リンク集）には注記が出る
for (const p of ['topic-philosophy.html', 'topic-body.html', 'topic-work.html', 'topic-food.html', 'series.html', 'guides.html', 'quiz.html', 'now.html', 'favorites.html', 'making.html', 'links.html']) {
  if (!read(p).includes('class="archive-note"')) report(p, 'アーカイブのページに注記がない');
}
const index = read('index.html');
const h1 = index.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
if (!h1 || !text(h1[1]).includes('君はどういう人間として生きたいのか？') || !text(h1[1]).includes('答えられないのなら知識が足りていない。')) {
  report('index.html', 'h1 がオーナーの決めた見出し（君はどういう人間として生きたいのか？／答えられないのなら知識が足りていない。）になっていない');
}
if (index.includes('intro-veil') || index.includes("classList.add('intro'")) report('index.html', 'オープニングの演出（intro-veil）が戻っている。見出しが最初に見えること');
const items = html => (html.match(/class="rn-item"/g) || []).length;
for (const p of ['index.html', 'journal.html']) {
  const html = read(p);
  if (items(html) !== currentArticles.length) report(p, `記事一覧が ${items(html)} 本（今の記事は ${currentArticles.length} 本）`);
  for (const s of currentArticles) if (!html.includes(`href="${s}.html"`)) report(p, `今の記事 "${s}" が一覧にない`);
}
// 2026-10-21（オーナー「新しい順、おすすめ、人気順くらいにする。あとは検索機能をつける」）：一覧には検索と3つの並び順がある
if (!existsSync('renewal.js')) report('renewal.js', '検索と並び替えのスクリプトがない');
for (const p of ['index.html', 'journal.html']) {
  const html = read(p);
  if (!html.includes('id="rn-q"')) report(p, '記事の検索欄がない');
  for (const label of ['新しい順', 'おすすめ', '人気順']) if (!html.includes(`role="tab"`) || !html.includes(`>${label}</button>`)) report(p, `並び順「${label}」がない`);
  if (!html.includes('id="rn-archive"')) report(p, '検索に使うアーカイブの一覧がない');
}
const archive = read('archive.html');
for (const s of archived) if (!archive.includes(`href="${s}.html"`)) report('archive.html', `アーカイブの記事 "${s}" が一覧にない`);

// 言葉を隠す・切る・英語の飾りで置き換える見た目がないこと（2026-10-18、コピーライティング第一）
for (const css of ['renewal.css', 'home.css']) {
  if (existsSync(css) && /line-clamp|text-overflow\s*:\s*ellipsis/.test(read(css))) report(css, '文章を行数や「…」で切る CSS（line-clamp / text-overflow）がある。言葉を見た目に合わせて削らない');
}
const jp = /[぀-ヿ一-鿿]/;
for (const p of ['index.html', 'journal.html', 'archive.html', ...currentArticles.map(s => `${s}.html`)]) {
  const html = read(p);
  for (const m of html.matchAll(/<p class="(eyebrow|rn-pillar|rn-list-h|cover-kicker)">([^<]*)<\/p>/g)) {
    const t = m[2].trim();
    if (!jp.test(t)) report(p, `英語だけの小見出し「${t}」（${m[1]}）。日本語にする（コピーライティング第一）`);
  }
}

// 2026-10-22 理解度テスト（オーナー「記事について、どれくらいの理解度があるのかを測るテストも作成したい」「記事とクイズは切り離す」「奇抜なことをせずに、シンプルに積み重ねていく」）
// - test.html があり、問題のある今の記事をすべて載せる。メニューに「理解度テスト」がある
// - src/_data/understanding/<記事>.json：8〜10問、選択肢は4つ、answer は 0〜3、解説（why）がある、
//   section は記事の見出し（h2）と同じ文字で、生成された記事のその見出しに id があり、test.html からその id へリンクしている
// - 今の記事には、テストの印もテストへのリンクも出さない（メニューの「理解度テスト」は除く）
// - test.js は保存（localStorage など）も時間制限（タイマー）も使わない。renewal.css に動きの演出がない
const udir = 'src/_data/understanding';
const tested = existsSync(udir) ? readdirSync(udir).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')) : [];
const testPage = existsSync('test.html') ? read('test.html') : '';
if (!testPage) report('test.html', '理解度テストのページがない');
if (!existsSync('test.js')) report('test.js', '理解度テストのスクリプトがない');
else if (/localStorage|sessionStorage|indexedDB|document\.cookie|setTimeout|setInterval|requestAnimationFrame/.test(read('test.js'))) report('test.js', '保存やタイマー・動きの演出を使っている（オーナー：シンプルに。保存・時間制限・演出はしない）');
if (/@keyframes|\banimation\s*:|\btransition\s*:/.test(read('renewal.css'))) report('renewal.css', '動きの演出（animation / transition）がある。演出は足さない');
if (testPage && (!/<h1\b[^>]*>理解度テスト<\/h1>/.test(testPage) || !testPage.includes('src="test.js"'))) report('test.html', '見出し「理解度テスト」か test.js がない');
if (!/<nav class="rn-nav"[^>]*>\s*<a href="test.html">理解度テスト<\/a>/.test(index)) report('index.html', 'メニューの最初に「理解度テスト」（test.html）がない');
const unescape = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
for (const s of tested) {
  const file = `${udir}/${s}.json`;
  let data;
  try { data = JSON.parse(read(file)); } catch (e) { report(file, `JSON として読めない（${e.message}）`); continue; }
  if (!slugs.includes(s)) { report(file, `記事 "${s}" がない（ファイル名は記事と同じにする）`); continue; }
  if (data.slug !== undefined && data.slug !== s) report(file, `slug "${data.slug}" がファイル名と違う`);
  const qs = Array.isArray(data.questions) ? data.questions : [];
  if (qs.length < 8 || qs.length > 10) report(file, `問題が ${qs.length} 問（8〜10問にする）`);
  const page = existsSync(`${s}.html`) ? read(`${s}.html`) : '';
  const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const h2s = [...page.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)].map(m => ({ id: (m[1].match(/\sid="([^"]*)"/) || [])[1] || '', text: unescape(text(m[2])).trim() }));
  const listed = currentArticles.includes(s);
  if (listed && testPage && !testPage.includes(`data-test="${s}"`)) report('test.html', `今の記事 "${s}" のテストが一覧にない`);
  qs.forEach((q, i) => {
    const at = `${file} ${i + 1}問目`;
    if (!q || typeof q.q !== 'string' || !q.q.trim()) report(at, '問題文（q）がない');
    if (!Array.isArray(q?.choices) || q.choices.length !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim())) report(at, '選択肢（choices）が4つない');
    else if (new Set(q.choices.map(c => c.trim())).size !== 4) report(at, '同じ選択肢がある');
    if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer > 3) report(at, `answer が 0〜3 ではない（${q?.answer}）`);
    if (typeof q?.why !== 'string' || !q.why.trim()) report(at, '解説（why）がない');
    const want = String(q?.section ?? '').trim();
    const h = h2s.find(x => x.text === want);
    if (!want || !h) report(at, `section「${want}」が記事 ${s}.html の見出し（h2）にない`);
    else if (!h.id || !ids.has(h.id)) report(at, `section「${want}」の見出しに id がない`);
    else if (listed && testPage && !testPage.includes(`href="${s}.html#${h.id}"`)) report('test.html', `"${s}" の${i + 1}問目に、記事の節（${s}.html#${h.id}）へのリンクがない`);
  });
}
for (const s of currentArticles) {
  if (!slugs.includes(s)) continue;
  const html = read(`${s}.html`);
  for (const needle of ['test.js', 'class="rn-test', 'class="rn-quiz', 'class="rn-choice', 'rn-tests-data', 'data-test=']) {
    if (html.includes(needle)) report(`${s}.html`, `今の記事に理解度テストの部品が出ている（${needle}）。記事とテストは切り離す`);
  }
  const article = (html.match(/<article\b[\s\S]*?<\/article>/) || [''])[0];
  if (/href="test\.html|理解度テスト/.test(article)) report(`${s}.html`, '記事の本文に理解度テストへのリンクがある。記事とテストは切り離す（入口はメニューだけ）');
}

// 2026-10-28 記事の型の段階1（docs/article-type-20261028.md。PR のマージで承認）：
// - 新しい型の今の記事には、署名の行（.rn-byline）があり、書いた人（start.html）・判定の決まり（editorial.html#verdicts）・AI の使い方（editorial.html#ai）へのリンクがある。
//   編集方針（editorial.html）には、その2つの id がある
// - 最後の問い（.rn-question）がちょうど一つ。「【本人が書く」の文字が残っていない。文字が「僕の結論」で始まる h2 がない（2026-10-22、オーナー：結論は読む人が考える）
// - 僕の体験の欄（front matter の owner.note。オーナーだけが書く）：書いてあれば .rn-owner に見出しの文字つきで一つだけ出ていて、400字まで（空白と改行は数えない）。書いてなければ .rn-owner がない
//   書いてあるときは、note の段落（改行で分けた一つずつ）がすべて欄の中に出ていて、欄が目次のすぐ下（目次がなければ判定表のすぐ下）にあり、あいだに h2 を挟まない（2026-10-28 の点検で足した）
// - 記事の下の順は「問い → 次に読む → 続きの口（.rn-follow）→ 健康の注意 → 参考文献 → 記事の一覧へ」
// - renewal-article.js（読まれ方の計測）は、保存（localStorage など・Cookie）もタイマーも使わず、gtag のほかへは送らない（fetch・sendBeacon・XMLHttpRequest・WebSocket・EventSource・画像のビーコンなど。2026-10-28 の点検で足した）
const editorialPage = existsSync('editorial.html') ? read('editorial.html') : '';
for (const [id, name] of [['verdicts', '判定の決まり'], ['ai', '記事の作り方と AI の使い方']]) {
  if (!editorialPage.includes(`id="${id}"`)) report('editorial.html', `「${name}」の節（id="${id}"）がない。記事の署名の行から飛ぶ先`);
}
if (/localStorage|sessionStorage|indexedDB|document\.cookie|setTimeout|setInterval|requestAnimationFrame|fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|new\s+Image\b|createElement\s*\(\s*['"`](?:img|script|iframe)/.test(read('renewal-article.js'))) {
  report('renewal-article.js', '保存（localStorage など・Cookie）・タイマー・gtag のほかへの送信（fetch・sendBeacon・XMLHttpRequest・WebSocket・EventSource・画像のビーコンなど）を使っている。読まれ方の計測は、gtag に送るだけにする');
}
// 開始と終わりの印で挟まれた部分の、終わりの位置（見つからなければ -1）。withOwner の置き場所と同じ探し方
const endOf = (html, open, close) => {
  const start = html.indexOf(open);
  const end = start < 0 ? -1 : html.indexOf(close, start);
  return end < 0 ? -1 : end + close.length;
};
const OWNER_MAX = 400;
const bottomOrder = [['class="rn-question"', '問い'], ['class="rn-next"', '次に読む'], ['class="rn-follow"', '続きの口'], ['class="rn-health"', '健康の注意'], ['class="rn-refs"', '参考文献'], ['class="rn-back"', '記事の一覧へ']];
for (const s of currentArticles) {
  if (!slugs.includes(s)) continue;
  const html = read(`${s}.html`);
  const src = read(`src/articles/${s}.html`);
  if (html.includes('【本人が書く')) report(`${s}.html`, '「【本人が書く】」の欄が、埋まらないまま出ている（オーナーが書くか、欄ごと消す）');
  if (!/^layout:\s*renewal-article\.njk\s*$/m.test(src)) continue;
  const byline = (html.match(/<p class="rn-byline">([\s\S]*?)<\/p>/) || [])[1];
  if (byline === undefined) report(`${s}.html`, '署名の行（.rn-byline：書いた人・参考文献の数・判定の決まり・AI の使い方）がない');
  else {
    for (const [href, name] of [['start.html', '書いた人'], ['editorial.html#verdicts', '判定の決まり'], ['editorial.html#ai', 'AI の使い方']]) {
      if (!byline.includes(`href="${href}"`)) report(`${s}.html`, `署名の行に「${name}」（${href}）へのリンクがない`);
    }
  }
  const questions = (html.match(/class="rn-question"/g) || []).length;
  if (questions !== 1) report(`${s}.html`, `最後の問い（.rn-question）が ${questions} つ。読む人への問いは最後に一つだけ`);
  for (const m of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)) {
    const h = text(m[1]).trim();
    if (h.startsWith('僕の結論')) report(`${s}.html`, `「僕の結論」の見出しがある（${h.slice(0, 30)}）。結論は置かない（結論は読む人が考える）`);
  }
  let note = '';
  try { note = String(matter(src).data.owner?.note ?? '').trim(); } catch (e) { report(`src/articles/${s}.html`, `front matter が読めない（${e.message}）`); }
  const owners = (html.match(/class="rn-owner"/g) || []).length;
  if (note) {
    const m = html.match(/<aside class="rn-owner"[^>]*>([\s\S]*?)<\/aside>/);
    const boxText = unescape(text(m ? m[1] : '')).replace(/\s+/g, ' ');
    if (owners !== 1 || !boxText.includes('僕の体験（研究ではない）')) report(`${s}.html`, '僕の体験（owner.note）が、見出し「僕の体験（研究ではない）」つきの欄（.rn-owner）に一つだけ出ていない');
    else {
      const missing = note.split(/\n+/).map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p && !boxText.includes(p));
      if (missing.length) report(`${s}.html`, `僕の体験（owner.note）の文が、欄（.rn-owner）に出ていない（「${[...missing[0]].slice(0, 20).join('')}」から始まる段落）`);
      const tocEnd = endOf(html, '<details class="rn-toc">', '</details>');
      const anchor = tocEnd >= 0 ? tocEnd : endOf(html, '<div class="rn-table-wrap"><table class="rn-verdicts">', '</table></div>');
      if (anchor < 0 || m.index < anchor || /<h2\b/.test(html.slice(anchor, m.index))) report(`${s}.html`, '僕の体験の欄（.rn-owner）が、目次のすぐ下（目次がなければ判定表のすぐ下）にない。あいだに見出しを挟まない');
    }
    const n = [...note.replace(/\s/g, '')].length;
    if (n > OWNER_MAX) report(`src/articles/${s}.html`, `僕の体験（owner.note）が ${n} 字。${OWNER_MAX}字まで`);
  } else if (owners) report(`${s}.html`, '僕の体験（owner.note）が空なのに、その欄（.rn-owner）が出ている');
  if (!html.includes('class="rn-follow"')) report(`${s}.html`, '続きの口（.rn-follow：新しい記事を RSS で知らせていることと、X の案内）がない');
  const found = bottomOrder.map(([needle, name]) => [html.indexOf(needle), name]).filter(([at]) => at >= 0);
  for (let i = 1; i < found.length; i++) {
    if (found[i][0] < found[i - 1][0]) {
      report(`${s}.html`, `記事の下の順がちがう（「${found[i - 1][1]}」が「${found[i][1]}」より後ろにある）。問い → 次に読む → 続きの口 → 健康の注意 → 参考文献 → 記事の一覧へ`);
      break;
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Current pages checks passed (${currentArticles.length} current, ${archived.length} archived, ${tested.length} tests).`);
