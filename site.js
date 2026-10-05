'use strict';
// サイト共通の設定。空欄のあいだは何もしない。
// GoatCounter のコード: https://<ここ>.goatcounter.com の <ここ> の部分
const GOATCOUNTER_CODE = '';
// Amazon アソシエイトのトラッキング ID（例: mouton-22）
const AMAZON_TAG = '';

if (GOATCOUNTER_CODE && !/^(localhost|127\.)/.test(location.hostname)) {
 const s = document.createElement('script');
 s.async = true;
 s.src = 'https://gc.zgo.at/count.js';
 s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
 document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', () => {
 if (!AMAZON_TAG) return;
 const links = [...document.querySelectorAll('a[href*="amazon.co.jp/"]')];
 if (!links.length) return;
 links.forEach(a => {
  const url = new URL(a.href);
  url.searchParams.set('tag', AMAZON_TAG);
  a.href = url.toString();
  a.rel = 'sponsored noopener';
 });
 // ステマ規制への対応: 広告リンクを含むページには、その旨を本文の先頭に表示する
 const article = document.querySelector('#books, main article, main');
 if (article && !document.querySelector('.pr-notice')) {
  const notice = document.createElement('p');
  notice.className = 'pr-notice';
  notice.innerHTML = 'PR｜このページには広告（Amazonアソシエイト）のリンクが含まれます。<a href="policy.html" style="color:inherit">詳しく</a>';
  notice.style.cssText = 'font-size:.75rem;letter-spacing:.04em;opacity:.7;margin:0 0 20px';
  article.prepend(notice);
 }
});
