// 2026-10-28 記事の型の段階1（docs/article-type-20261028.md）：記事のテンプレートのフィルターを、ビルドせずに確かめる。
// - withOwner（僕の体験の欄）：空なら何もしない／文字をエスケープする／改行で段落に分ける／
//   置き場所（目次のすぐ下 → 判定表のすぐ下 → 参考文献より前の最初の h2 の前 → 参考文献の節の前 → 本文の終わり）
// - refCount（署名の行の「参考文献 N本」の N）
// 今の記事には owner.note を書いていないので、生成物の検査（scripts/check-current-pages.mjs）は欄を出す側を通らない。その側をここで確かめる。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../eleventy.config.js';

// eleventy.config.js に、フィルターだけを集める仮の設定を渡す（ほかの登録は何もしない）
const filters = {};
config(new Proxy({}, { get: (_, name) => (name === 'addFilter' ? (key, fn) => { filters[key] = fn; } : () => {}) }));
const { withOwner, beforeRefs, refCount } = filters;

const toc = '<details class="rn-toc"><summary>目次（3）</summary><ol><li><a href="#s-2">二</a></li></ol></details>';
const table = '<div class="rn-table-wrap"><table class="rn-verdicts"><tbody><tr><td>行</td></tr></tbody></table></div>';
const refs = '<section class="rn-refs" aria-labelledby="refs-h">\n<h2 id="refs-h">参考文献</h2>\n<ol><li id="ref-1">文献</li><li id="ref-2">文献</li></ol>\n</section>';
const box = paras => `<aside class="rn-owner" aria-label="僕の体験"><p class="rn-owner-h">僕の体験（研究ではない）</p>${paras}</aside>`;
const one = box('<p>体験</p>');

test('withOwner: an empty note leaves the article as it is', () => {
  const html = `<h2 id="s-1">判定</h2>${table}${toc}<h2 id="s-2">二</h2>${refs}`;
  for (const owner of [undefined, null, {}, { note: '' }, { note: '  \n ' }]) assert.equal(withOwner(html, owner), html);
});

test('withOwner: escapes the text and makes one paragraph per line', () => {
  const out = withOwner(`<h2 id="s-1">判定</h2>${table}${toc}<h2 id="s-2">二</h2>`, { note: ' 一つ目の<b>段落</b> & "引用"\n\n  二つ目 \n' });
  assert.ok(out.includes(box('<p>一つ目の&lt;b&gt;段落&lt;/b&gt; &amp; &quot;引用&quot;</p><p>二つ目</p>')));
  assert.equal((out.match(/class="rn-owner"/g) || []).length, 1);
  assert.ok(!out.includes('<b>'));
});

test('withOwner: right under the table of contents, else right under the verdict table', () => {
  const owner = { note: '体験' };
  assert.ok(withOwner(`<p>冒頭</p><h2 id="s-1">判定</h2>${table}${toc}<h2 id="s-2">二</h2>${refs}`, owner).includes(`${toc}${one}<h2 id="s-2">`));
  assert.ok(withOwner(`<p>冒頭</p><h2 id="s-1">判定</h2>${table}<h2 id="s-2">二</h2>${refs}`, owner).includes(`${table}${one}<h2 id="s-2">`));
});

test('withOwner: without a table of contents or a verdict table, stays before the references and before "next reads"', () => {
  const owner = { note: '体験' };
  assert.equal(withOwner(`<p>冒頭</p><h2 id="s-1">一</h2><p>本文</p>${refs}`, owner), `<p>冒頭</p>${one}<h2 id="s-1">一</h2><p>本文</p>${refs}`);
  // 本文の h2 が参考文献の見出しだけ：参考文献の節の中には入れず、節の前に置く。テンプレートと同じ順で「次に読む」を足しても、欄はその前
  const next = '<nav class="rn-next" aria-label="次に読む"></nav><p class="rn-follow">続き</p>';
  assert.equal(beforeRefs(withOwner(`<p>冒頭</p><p>本文</p>${refs}`, owner), next), `<p>冒頭</p><p>本文</p>${one}${next}${refs}`);
  // h2 も参考文献もない：本文の終わり
  assert.equal(withOwner('<p>冒頭</p>', owner), `<p>冒頭</p>${one}`);
});

test('refCount counts the reference items', () => {
  assert.equal(refCount(refs), 2);
  assert.equal(refCount('<p>参考文献なし</p>'), 0);
});
