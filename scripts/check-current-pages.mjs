// 2026-10-17 にオーナーが決めたことを、生成されたページで確かめる。
// - 残す記事（src/_data/currentArticles.js）には、書き込みワーク・穴埋め・○×クイズ・アーカイブの注記が出ない
// - それ以外の日本語の記事（アーカイブ）には、上に「アーカイブ」の注記が出る
// - トップの最初の画面に、ムートン／つくるもの／あなたに の3行と「いまの悩みから選ぶ」がある
// - 記事一覧は残す記事だけ、アーカイブの一覧はアーカイブの記事をすべて載せる
import { readdirSync, readFileSync } from 'node:fs';
import currentArticles from '../src/_data/currentArticles.js';

const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);
const read = f => readFileSync(f, 'utf8');
const slugs = readdirSync('src/articles').filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, ''));
const archived = slugs.filter(s => !currentArticles.includes(s));

for (const s of currentArticles) {
  if (!slugs.includes(s)) { report('currentArticles.js', `no article "${s}"`); continue; }
  const html = read(`${s}.html`);
  for (const [needle, why] of [['mw-blank', '穴埋めの空欄'], ['＿＿＿', '穴埋めの空欄'], ['class="mini-work"', '1分ワーク'], ['class="quiz-more', '○×クイズ'], ['class="archive-note"', 'アーカイブの注記'], ['data-qloop', '○×クイズ']]) {
    if (html.includes(needle)) report(`${s}.html`, `残す記事に${why}が出ている（${needle}）`);
  }
}
for (const s of archived) {
  const html = read(`${s}.html`);
  if (!html.includes('class="archive-note"')) report(`${s}.html`, 'アーカイブの記事に注記がない');
}
// 残すページ（記事以外）にも、穴埋めとワークの案内は出さない
for (const p of ['index.html', 'start.html', 'topic-philosophy.html', 'journal.html', 'series.html']) {
  const html = read(p);
  if (/mw-blank|＿＿＿/.test(html)) report(p, '穴埋めの空欄が出ている');
  if (/class="quiz-more|data-qloop/.test(html)) report(p, '○×クイズが出ている');
}
// アーカイブに移したページ（テーマ別・選び方・クイズ・いま取り組んでいること・お気に入り・制作・リンク集）には注記が出る。哲学のページには出ない
for (const p of ['topic-body.html', 'topic-work.html', 'topic-food.html', 'guides.html', 'quiz.html', 'now.html', 'favorites.html', 'making.html', 'links.html']) {
  if (!read(p).includes('class="archive-note"')) report(p, 'アーカイブのページに注記がない');
}
if (read('topic-philosophy.html').includes('class="archive-note"')) report('topic-philosophy.html', '残すページにアーカイブの注記が出ている');
const index = read('index.html');
for (const label of ['ムートン', 'つくるもの', 'あなたに']) {
  if (!new RegExp(`<dt>${label}</dt>`).test(index)) report('index.html', `最初の画面の3行に「${label}」がない`);
}
if (!index.includes('data-home-entry="worry"')) report('index.html', '「いまの悩みから選ぶ」がない');
const items = html => (html.match(/class="journal-item/g) || []).length;
const journal = read('journal.html');
if (items(journal) !== currentArticles.length) report('journal.html', `記事一覧が ${items(journal)} 本（残す記事は ${currentArticles.length} 本）`);
for (const s of currentArticles) if (!journal.includes(`href="${s}.html"`)) report('journal.html', `残す記事 "${s}" が一覧にない`);
const archive = read('archive.html');
for (const s of archived) if (!archive.includes(`href="${s}.html"`)) report('archive.html', `アーカイブの記事 "${s}" が一覧にない`);

// 2026-10-18（コピーライティング第一）：トップに、言葉を隠すオープニングの演出が戻っていないこと
if (index.includes('intro-veil') || index.includes("classList.add('intro'")) report('index.html', 'オープニングの演出（intro-veil）が戻っている。見出しが最初に見えること');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Current pages checks passed (${currentArticles.length} current, ${archived.length} archived).`);
