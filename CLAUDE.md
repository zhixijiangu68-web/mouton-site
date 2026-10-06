# ムートン（mouton-site）

ムートンの個人サイト。ページは `src/` のテンプレートから Eleventy で生成し、リポジトリ直下に HTML として書き出している。

**リポジトリ直下の `*.html`・`search.json` は生成物。直接編集しない。** `src/` を編集してから `npm run build` で生成し、生成物も一緒にコミットする。

## 目標（2026年10月）

- **10月中に最初の収益を出す**（「最初の1件が売れる」＋「どの記事から売れたか分かる」）
- 流れは **X → 「選び方」記事 → Amazon・楽天**。検索からの流入は10月には間に合わない前提。Instagram は休止中（`instagram/README.md`）
- 日々の運用は AI社員チーム（`.claude/skills/mouton-team/`）で回す。進み具合は `promo/status.md`
- どの仕事も「この流れを太くするか」で優先度を決める。10月末に結果を測り、11月の計画を立てる

## 構成

- `src/articles/*.html`: 記事。1ファイル = 1ページ（ファイル名がそのまま URL になる）。先頭の front matter にタイトル・日付・カテゴリーなど、その下に本文
- `src/index.njk`: トップページ。記事一覧・「食事・化学」のカードは記事の front matter から自動で作られる（手で書き足さない）
- `src/_data/site.js`: サイト全体の設定。`src/_data/topics.js`: テーマ別ページ。`src/_data/notes.json`: ページのない短いメモ
- `src/_includes/`: 共通部分（head、ナビ、記事の末尾、フッター）
- `site.css` / `site.js` / `home.css` / `article-base.css` / `reading.css` / `article-share.js`: デザインと動き（これらは直接編集してよい）
- 詳しい書き方は README.md の「記事を追加する」

## 記事を追加するとき

1. 同じカテゴリーの既存の記事（`src/articles/` の中）をコピーして、front matter と本文を書き換える
   - `title`（末尾に「 — ムートン」）、`headline`、`description`（80〜120字）、`date`、`category`（philosophy / body / food / books / work）、`health`（健康の記事なら true）
   - トップの記事一覧に出すなら `journal`（`category` は body / philosophy / work / making、`title`、`excerpt`）を書く
   - 「次に読む」に優先して出したい記事があれば `related: ["ファイル名", ...]`
   - 商品を紹介するときは `{% productCard "商品名", "ひとこと", { asin: "ASIN", rakuten: "検索語かURL" } %}` を使い、front matter に `affiliate: true` を書く（冒頭のPR表示・リンクのPRラベル・末尾の注意書きが自動で付く。IDは `src/_data/site.js` の `affiliate`）
   - 「選び方」の記事は front matter に `guide`（`tag`、`title`、`text`、`order`）を書くと、トップの「選び方」に自動で並ぶ
   - 読了時間は `約{{ readMinutes }}分で読めます（目安）` と書けば自動で計算される
   - 本文の末尾近くに `{% include "partials/article-end.njk" %}` と `{% include "partials/reading-next.njk" %}` を置く（既存の記事と同じ位置）
2. ファイル名は英小文字とハイフン（例: `olive-oil.html`）
3. `npm ci`（初回）→ `npm run build` → `npm test` を実行し、エラーがないことを確かめる
   - シェア用の画像（`images/og/<ファイル名>.jpg`）は `cd scripts/og && npm install && node make.mjs` で作り直せる（記事を足したら実行し、画像もコミットする）
4. `src/articles/` の記事と、生成されたリポジトリ直下の HTML・`search.json` をまとめてコミットする

## 文章のルール

- 日本語。一人称は「僕」。常体の記事と敬体（です・ます）の記事があるので、1 本の記事の中では文体を統一し、Issue で指定がなければ同じカテゴリーの最近の記事に合わせる
- 健康・科学の記事は研究や公的機関の情報に基づき、末尾に参考文献を番号付きで載せる。存在を確認できない文献は書かない
- 本文中の出典番号は `<a href="#ref-1">[1]</a>`、参考文献の側は `id="ref-1"` を付けるとリンクになる
- 医療に関わる記事は front matter の `health: true` で末尾に注意書きが自動で入る。本文でも「治る」「効く」と言い切らない

## 確認

- `npm test` が通ること（リンク切れ・ID の重複・title や description の書き忘れ・h1 の数を調べる）
- スマホ幅（390px）でも崩れないよう、既存のクラスを使い、独自の固定幅を増やさない
