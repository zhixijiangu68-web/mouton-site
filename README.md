# ムートン

ムートンの個人サイト。

ページは `src/` のテンプレートから [Eleventy](https://www.11ty.dev/) で生成し、リポジトリ直下に HTML として書き出します。
公開されるのはリポジトリ直下のファイルなので、ホスティングの設定はこれまでと変わりません。

**リポジトリ直下の `*.html` は生成されたファイルです。直接編集せず、`src/` を編集してから `npm run build` してください。**

## はじめに

```sh
npm install      # 初回だけ
npm run build    # src/ から HTML を生成
npm start        # 生成しながら http://localhost:8080 で確認
```

コミットの前に `npm run build` を忘れると、GitHub の「Build check」が失敗して知らせてくれます。

## どこに何があるか

| 場所 | 中身 |
|---|---|
| `src/_data/site.js` | サイト全体の設定（ドメイン、アクセス解析、広告、問い合わせ先、書き手の紹介） |
| `src/_data/projects.json` | トップの「制作」に出すもの。`url` を入れるとカードがリンクになる |
| `src/_data/notes.json` | 記事一覧に出す、ページのない短いメモ |
| `src/_data/topics.js` | テーマ別ページ（`topic-philosophy.html` など）の名前と紹介文 |
| `src/articles/*.html` | 記事。1ファイル = 1ページ |
| `src/index.njk` | トップページ |
| `src/operator.njk` / `privacy.njk` / `contact.njk` | 運営者情報 / プライバシーポリシー / お問い合わせ |
| `src/_includes/` | 共通部分（`<head>`、ナビ、記事の末尾、フッター） |
| `site.css` / `site.js` | 全ページ共通のデザインと動き |
| `home.css` | トップページのデザイン |
| `article-base.css` / `reading.css` / `article-share.js` | 記事ページの共通スタイルと読書補助 |
| `images/` | 画像。置き場所と名前は `images/README.md` |

## 記事を追加する

`src/articles/` に `記事の名前.html` を作ります。ファイル名がそのまま URL（`記事の名前.html`）になります。
既存の記事をコピーして、先頭の設定と本文を書き換えるのが簡単です。

```yaml
---
title: "記事のタイトル — ムートン"     # ブラウザのタブや共有時に出るタイトル
headline: "記事のタイトル"              # 検索エンジン向けの見出し
description: "検索結果や共有時に出る説明文（80〜120字くらい）"
date: 2026-10-06                        # 公開日
updated: 2026-10-20                     # 内容を直したら追加（任意）
category: philosophy                    # philosophy / body / food / books（カバー画像の種類）
health: false                           # 健康の記事なら true（末尾に医療の注意書きが出る）
back:
  href: "index.html#journal"
  text: "記事一覧へ戻る"
journal:                                # 書くとトップの記事一覧とテーマ別ページに出る
  category: "philosophy"                # philosophy / body / making
  title: "一覧に出すタイトル"
  excerpt: "一覧に出す一言"
science:                                # 書くとトップの「食事・化学」と食事・化学のページに出る（任意）
  tag: "FOOD / ..."
  title: "カードのタイトル"
  text: "カードの説明"
  order: 5
related: ["nietzsche", "freedom"]       # 「次に読む」に優先して出す記事（ファイル名）。足りない分は同じテーマの新しい記事で埋まる
styles: |
  /* この記事だけのデザイン（任意） */
---
```

本文の決まった位置に、次のものが自動で入ります。

- `約{{ readMinutes }}分で読めます`：本文の文字数から計算した読了時間（1分500字）。トップや一覧の分数も同じ値
- `{% include "partials/article-end.njk" %}`：医療の注意書き・広告枠・メールマガジン登録欄・「この記事を書いた人」
- `{% include "partials/reading-next.njk" %}`：「次に読む」とテーマ別ページへのリンク

見出し（h1〜h3）と記事一覧のタイトルは、生成するときに [BudouX](https://github.com/google/budoux) で文節に区切られ、単語の途中で改行しないようになります。
Amazon へのリンクは `{% amazonLink "ASIN", "Amazonでこの本を見る", "book-buy" %}` と書くと、アフィリエイトの設定に合わせてタグと「PR」表示が自動で付きます。

## 収益化の設定

`src/_data/site.js` に値を入れて `npm run build` すると、全ページにまとめて反映されます。
空のままなら何も読み込まず、プライバシーポリシーも「利用していない」という内容になります。

| 設定 | 入れると起きること |
|---|---|
| `url` | canonical、og:url、共有用画像（`images/og-default.jpg`）、`sitemap.xml`、`robots.txt`、RSS（`feed.xml`）が出力される |
| `analytics.ga4` | Google アナリティクスを読み込み、プライバシーポリシーに説明が載る |
| `affiliate.amazonTag` | Amazon リンクにタグ・`rel="sponsored"`・「PR」が付き、フッターと本棚ページに広告の表記が出る |
| `ads.adsenseClient` / `ads.adsenseSlot` | 記事ページの末尾に広告枠が出る（トップには出さない） |
| `newsletter.action` / `newsletter.service` | 記事末尾・テーマ別ページ・トップにメールマガジンの登録欄が出て、プライバシーポリシーに説明が載る |
| `contact.formUrl` / `contact.email` | お問い合わせページに表示する |

## 注意

- `src/articles/` から記事を消しても、生成済みのリポジトリ直下の HTML は残ります。直下の同じ名前のファイルも一緒に消してください。
- 健康の記事で商品を紹介するときは、薬機法（「治る」「効く」と言い切らない）と、広告であることの表示（ステマ規制）に気をつけてください。
