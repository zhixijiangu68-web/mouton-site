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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import currentArticles from '../src/_data/currentArticles.js';

const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);
const read = f => readFileSync(f, 'utf8');
const text = html => html.replace(/<[^>]+>/g, '');
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

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Current pages checks passed (${currentArticles.length} current, ${archived.length} archived).`);
