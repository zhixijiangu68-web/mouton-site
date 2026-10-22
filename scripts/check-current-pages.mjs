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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Current pages checks passed (${currentArticles.length} current, ${archived.length} archived, ${tested.length} tests).`);
