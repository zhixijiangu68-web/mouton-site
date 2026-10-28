// 2026-10-28 記事の型の段階1（docs/article-type-20261028.md）：記事のテンプレートのフィルターを、ビルドせずに確かめる。
// - withOwner（僕の体験の欄）：空なら何もしない／文字をエスケープする／改行で段落に分ける／
//   置き場所（目次のすぐ下 → 判定表のすぐ下 → 参考文献より前の最初の h2 の前 → 参考文献の節の前 → 本文の終わり）
// - refCount（署名の行の「参考文献 N本」の N）
// 今の記事には owner.note を書いていないので、生成物の検査（scripts/check-current-pages.mjs）は欄を出す側を通らない。その側をここで確かめる。
// 2026-10-28 記事の型の段階2（同じ文書の 6-3）：
// - verdictTable：section のない表は今の出力のまま／section のある表は、行の目印・× の種類・表の上の一行（内訳・健康の記事の注）
// - sectionIds：h3 の id（s-N-M）は、渡されたときだけ。すでにある id は変えない
// - claimLinks：h2・h3 の文字を id に結ぶ。結べないとき、同じ文字の見出しが二つ以上あるときは止める
// - resultsBox：結果の3行。順・エスケープ・空のとき
import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../eleventy.config.js';

// eleventy.config.js に、フィルターと shortcode だけを集める仮の設定を渡す（ほかの登録は何もしない）
const filters = {};
const shortcodes = {};
config(new Proxy({}, {
  get: (_, name) => (name === 'addFilter' ? (key, fn) => { filters[key] = fn; }
    : name === 'addShortcode' ? (key, fn) => { shortcodes[key] = fn; }
      : () => {}),
}));
const { withOwner, withToc, beforeRefs, refCount, sectionIds, claimLinks, resultsBox, hasSections } = filters;
const { verdictTable } = shortcodes;

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

// ---- 段階2（2026-10-28） ----
const head = '<div class="rn-table-wrap"><table class="rn-verdicts"><thead><tr><th scope="col">よく言われること</th><th scope="col">判定</th><th scope="col">確かさ</th><th scope="col">主な根拠</th></tr></thead><tbody>';

test('verdictTable: without any section, the table is exactly the step-1 table (no links, no kinds, no lead line)', () => {
  const claims = [
    { claim: 'A & <B>', verdict: 'refute', refute: 'nodiff', certainty: '中', basis: '根拠', refs: [1, 2] },
    { claim: 'C', verdict: 'weak', basis: '根拠2' },
  ];
  assert.equal(verdictTable(claims), `${head}<tr><th scope="row">A &amp; &lt;B&gt;</th><td class="rn-verdict is-refute" data-label="判定"><span aria-hidden="true">×</span> 否定</td><td data-label="確かさ">中</td><td data-label="根拠">根拠 <a href="#ref-1">[1]</a><a href="#ref-2">[2]</a></td></tr>`
    + '<tr><th scope="row">C</th><td class="rn-verdict is-weak" data-label="判定"><span aria-hidden="true">△</span> 弱い</td><td data-label="確かさ">―</td><td data-label="根拠">根拠2</td></tr></tbody></table></div>');
  assert.equal(hasSections(claims), false);
  assert.equal(hasSections(undefined), false);
});

test('verdictTable: with sections, rows carry a section marker, × shows its kind, and a lead line counts the verdicts', () => {
  const claims = [
    { claim: '題の主張', section: ' 節 "一" & 二 ', verdict: 'refute', refute: 'nodiff', certainty: '中', basis: 'b1' },
    { claim: '二', section: '節二', verdict: 'refute', refute: 'opposite', certainty: '低', basis: 'b2' },
    { claim: '三', section: '節三', verdict: 'refute', certainty: '低', basis: 'b3' },
    { claim: '四', section: '節四', verdict: 'support', certainty: '中', basis: 'b4' },
    { claim: '五', section: '節五', verdict: 'mystery', basis: 'b5' },
  ];
  const out = verdictTable(claims);
  // 内訳の一つずつは、折り返さない span（.rn-nowrap）で包む。文字は「5のうち、○ 支持 1・× 否定 3・― 証拠なし 1。…」
  assert.ok(out.startsWith('<p class="rn-table-lead">5のうち、<span class="rn-nowrap">○ 支持 1</span>・<span class="rn-nowrap">× 否定 3</span>・<span class="rn-nowrap">― 証拠なし 1</span>。確かさは、研究の数・大きさ・質から付けた目安。決め方は<a href="editorial.html#verdicts">判定の決まり</a>に書いた。</p><div class="rn-table-wrap"><table class="rn-verdicts">'), out.slice(0, 300));
  assert.ok(!out.includes('△'), 'a verdict with no rows is not listed');
  assert.ok(out.includes('<th scope="row"><a class="rn-claim" data-section="節 &quot;一&quot; &amp; 二">題の主張</a></th>'));
  assert.ok(out.includes('<span aria-hidden="true">×</span> 否定<span class="rn-refute-kind">（差がない）</span></td>'));
  assert.ok(out.includes('<span aria-hidden="true">×</span> 否定<span class="rn-refute-kind">（主張と逆）</span></td>'));
  assert.ok(out.includes('<th scope="row"><a class="rn-claim" data-section="節三">三</a></th><td class="rn-verdict is-refute" data-label="判定"><span aria-hidden="true">×</span> 否定</td>'), 'a × without refute stays plain');
  assert.equal(hasSections(claims), true);
  // 健康の記事（front matter の health）では、表の上の一行に医療の注を足す
  const health = verdictTable.call({ ctx: { health: true } }, claims);
  assert.ok(health.includes('に書いた。この表は、医療の助言ではない。</p><div class="rn-table-wrap">'));
});

test('sectionIds: h3 ids (s-N-M) only when asked; existing ids and the h2 numbers stay', () => {
  const html = '<h3>前</h3><h2>一</h2><h3>一の一</h3><h3 id="keep">一の二</h3><h3>一の三</h3><h2 id="refs-h">参考</h2><h2>三</h2><h3>三の一</h3>';
  assert.equal(sectionIds(html), '<h3>前</h3><h2 id="s-1">一</h2><h3>一の一</h3><h3 id="keep">一の二</h3><h3>一の三</h3><h2 id="refs-h">参考</h2><h2 id="s-3">三</h2><h3>三の一</h3>');
  assert.equal(sectionIds(html, true), '<h3 id="s-0-1">前</h3><h2 id="s-1">一</h2><h3 id="s-1-1">一の一</h3><h3 id="keep">一の二</h3><h3 id="s-1-3">一の三</h3><h2 id="refs-h">参考</h2><h2 id="s-3">三</h2><h3 id="s-3-1">三の一</h3>');
});

test('claimLinks: binds each row to the h2 or h3 with the same words, and stops the build when one does not match', () => {
  const claims = [
    { claim: '題', section: '節二の見出し', verdict: 'support', basis: 'b' },
    { claim: '小', section: '小見出し "A" & B', verdict: 'weak', basis: 'b' },
  ];
  const body = `<h2>判定</h2>${verdictTable(claims)}<h2>節<b>二</b>の見出し</h2><h3>小見出し &quot;A&quot; &amp; B</h3><h2>節三</h2><h2>終わり</h2>`;
  const out = claimLinks(sectionIds(body, true));
  assert.ok(out.includes('<a class="rn-claim" href="#s-2">題</a>'), 'h2, tags and entities normalized');
  assert.ok(out.includes('<a class="rn-claim" href="#s-2-1">小</a>'), 'h3');
  assert.ok(!out.includes('data-section'));
  // section と同じ文字の見出しが二つ以上あれば、どれへ結ぶか決められないので止める（黙って先のほうへ結ばない）。どの行で、どの id か、言葉で分かる
  const same = `<h2>判定</h2>${verdictTable(claims)}<h2>節<b>二</b>の見出し</h2><h3>小見出し &quot;A&quot; &amp; B</h3><h2>節二の見出し</h2><h2>終わり</h2>`;
  assert.throws(() => claimLinks(sectionIds(same, true)), /「題」の section「節二の見出し」と同じ文字の見出しが2つある（#s-2・#s-3）/);
  const sameH3 = `<h2>判定</h2>${verdictTable(claims)}<h2>前の節</h2><h3>節二の見出し</h3><h2>節二の見出し</h2><h3>小見出し "A" &amp; B</h3>`;
  assert.throws(() => claimLinks(sectionIds(sameH3, true)), /同じ文字の見出しが2つある（#s-2-1・#s-3）/);
  // 目次と僕の体験の欄は、今までどおり判定表のすぐ下（表の上の一行があっても）
  const withBoxes = withOwner(withToc(out), { note: '体験' });
  assert.ok(withBoxes.includes('</table></div><details class="rn-toc">'));
  assert.ok(/<\/details><aside class="rn-owner"/.test(withBoxes));
  // 結べない行があれば止める（どの行か、言葉で分かる）
  const broken = `<h2>判定</h2>${verdictTable([{ claim: '迷子の行', section: 'ない見出し', verdict: 'weak', basis: 'b' }, { claim: '空の行', verdict: 'weak', basis: 'b' }])}<h2>ある見出し</h2>`;
  assert.throws(() => claimLinks(sectionIds(broken, true)), /「迷子の行」の section 「ない見出し」.*「空の行」の section がない/);
  // 目印のない本文は、そのまま
  const plain = '<h2 id="s-1">一</h2><p>本文</p>';
  assert.equal(claimLinks(plain), plain);
});

test('resultsBox: three rows in a fixed order, escaped; nothing for a missing or malformed value', () => {
  assert.equal(resultsBox({ open: '分からない', yes: '研究では <b>A</b> & "B"', no: 'C' }),
    '<section class="rn-results" aria-label="この記事の結果"><dl>'
    + '<div><dt>支持されたこと</dt><dd>研究では &lt;b&gt;A&lt;/b&gt; &amp; &quot;B&quot;</dd></div>'
    + '<div><dt>支持されなかったこと</dt><dd>C</dd></div>'
    + '<div><dt>分かっていないこと</dt><dd>分からない</dd></div></dl></section>');
  // 空の行は出さない（npm test が見出しのそろい方で止める）
  assert.ok(!resultsBox({ yes: 'A', no: ' ', open: 'C' }).includes('支持されなかったこと'));
  for (const v of [undefined, null, '', 'まだ', {}, { yes: '' }]) assert.equal(resultsBox(v), '');
});
