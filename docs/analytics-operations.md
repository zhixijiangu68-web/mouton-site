# MOUTON — アクセス解析・集客計測の運用手順（BD-05）

**更新**：2026-10-13 / **版**：v0.1  
**対象**：https://moutonarchive.com/  
**上位文書**：[REQUIREMENTS.md](../REQUIREMENTS.md) / [DESIGN.md](../DESIGN.md) / [docs/cleanliness-prelaunch.md](cleanliness-prelaunch.md)

> **重要**：「コードに測定タグがある」「Googleの管理画面で実際にイベントを受信した」「売上が確定した」は別の事実。現在はGA4管理画面・Search Console管理画面での実測値と所有権を確認していないため、**数値を実績として記入しない**。この文書は導入手順・指標の定義・未検証事項を管理するものであり、すべてが接続完了という意味ではない。

## 1. 現在の状態と計測責任

| 領域 | GitHubソースでの状態 | 管理画面での実測 | 判定と次の作業 |
| --- | --- | --- | --- |
| GA4測定タグ | `src/_data/site.js` の `analytics.ga4` にIDがあり、`src/_includes/base.njk` がgtag設定 | **未確認** | GA4プロパティのウェブデータストリームにある**正しい測定ID**と一致するか、Google側で確認する |
| `page_view` | `gtag('config',...)` を1回読み込み。自動送信の設定 | **未確認** | Tag AssistantとGA4 DebugViewでテスト端末からの1ページ1回を確認する |
| `lp_entry_click`／`view_item`／`sample_click` 等 | `site.js`、`cleanliness-science.js` に送信コード | **未確認** | DebugViewで、該当操作に対応するイベント名・パラメータ・重複なしを確認する |
| GSC（Search Console） | `site.searchConsole` は空。HTMLタグを生成できるテンプレートはある | **未確認** | **本人が所有するプロパティ**を選び、DNSまたはHTMLタグでサイト所有権を確認する |
| 自然検索のクエリ／指名検索 | Search Consoleが一次データソース | **未取得** | 所有権確認とデータ収集後に「ムートン」「moutonarchive」等を検索クエリで集計 |
| SNS流入 | 参照元はGA4に記録されうる。UTMの統一規約は下記 | **未確認** | UTM付きの外部投稿リンクでテスト訪問し、GA4トラフィック獲得を確認 |
| 先行案内の登録完了 | `prelaunch.waitlistAction` 未設定 | **取得不可** | 配信サービス決定後、登録成功を**サービス側**で確認 |
| 商品購入・利益 | BOOTH販売準備中／本番決済未接続 | **取得不可** | BOOTH等の**確定注文**・返金・手数料に基づく。クリックで代用しない |

**運用開始判定**：タグが存在するだけでは「計測稼働中」と書かない。測定ID照合 → DebugViewで実受信 → 標準レポートで取得確認、を実際に終えてから状態を「確認済み」に変更する。

## 2. GA4の初期確認

1. Google Analyticsで**ムートンの管理権限があるGA4プロパティ**を開き、対象ウェブデータストリームの測定IDを確認する。リポジトリの `src/_data/site.js` `analytics.ga4` と**完全一致**するか照合する。ソース値だけでは正しいプロパティか断定できない。
2. 公開サイト https://moutonarchive.com/ を確認し、Google Tag Assistant（`https://tagassistant.google.com/`）で自分のブラウザのデバッグモードを有効にする。**公開サイト全利用者をデバッグモードにしない**。
3. GA4の**管理 → データの表示 → DebugView**を開き、自分の端末からトップ、`/cleanliness-science.html`、`/cleanliness-sample.html`へ移動する。Page view、`view_item`、`sample_click`、`sample_pdf_click` などを操作ごとに確認。
4. `view_item`の`value`＝1980、`currency`＝JPY、`product_id`＝`cleanliness_001`を確認。GA4の`page_view`はgtagのconfigにより自動計測し、サイト側では手動で同名イベントを追加しない。
5. 通常レポート（ライフサイクルの集客・エンゲージメント、必要な場合は探索）でも反映を確認。標準レポートは即時とは限らず、DebugViewとも反映タイミングが異なる。広告ブロッカー、ブラウザのプライバシー設定、同意設定によって収集されない場合がある。
6. 下記の結果表に**検証日・担当者・プロパティIDの照合結果・実際に確認したイベント**を記録する。**アクセス数・売上を推測で埋めない**。

### 計測イベント一覧

| イベント | 行動 | 参考パラメータ | 指標としての意味 |
| --- | --- | --- | --- |
| `page_view` | ページ表示 | `page_location`等の標準項目 | 閲覧の確認。購入ではない |
| `lp_entry_click` | 記事・トップ等のLP入口クリック | `placement`、`source_article`、`product_id` | LP遷移**の試行**。LP到達とは違う |
| `view_item` | 商品LPでの商品閲覧 | `product_id`、`currency`、`value`、`items` | 商品への関心。注文ではない |
| `lp_cta_click` | LP内の価格・発売案内クリック | `placement`、`cta_target` | 関心を示す操作 |
| `sample_click` | Webサンプルのリンククリック | `placement`、`cta_target` | Webサンプルへの遷移試行 |
| `sample_pdf_click` | PDFサンプルのリンククリック | `placement`、`cta_target` | PDF保存・読了完了ではない |
| `sample_print_click` | 印刷ボタンを押した | `placement` | 印刷／PDF保存成功ではない |
| `waitlist_submit` | フォーム送信試行（現在無効） | `placement` | **登録成功ではない** |
| `begin_checkout` | 外部販売ページへのリンク（現在無効） | `items`、`currency`、`value` | **購入確定ではない** |
| `affiliate_click` | Amazon・楽天リンククリック | `shop`、`product`、`placement` | アフィリエイトの報酬確定ではない |

GA4の「カスタム定義」で、まず**イベントスコープのカスタムディメンション**として `placement`、`cta_target`、`source_article`、`product_id` を必要に応じ登録する。標準の既存ディメンションは無理に重複登録しない。登録は**GA4管理権限があるアカウント側の操作**であり、コード変更だけでは完了しない。

### 手動チェックシート（証拠が得られたら更新）

| 確認項目 | 状態 | 確認日時・証拠 |
| --- | --- | --- |
| GA4 IDが自分のデータストリームと一致 | 未確認 | — |
| Tag Assistantで公開ドメインのgtag検出 | 未確認 | — |
| DebugViewで`page_view`の実受信 | 未確認 | — |
| DebugViewで`view_item`の実受信 | 未確認 | — |
| サンプルクリック各種の1回発火 | **Chromium自動テストのみ** | 自動テスト結果はGitHub Actionsを参照 |
| カスタムディメンション登録 | 未確認 | — |
| 流入元`x / organic_social`の記録 | 未確認 | — |

## 3. Google Search Consoleの導入

Google Search Consoleの `https://search.google.com/search-console` に、自分のGoogleアカウントでログインする。

- **推奨：ドメインプロパティ `moutonarchive.com`**。DNS管理者がGoogleの指示したTXTレコードをDNSに追加して所有権確認する。サブドメインも含めて管理できる。
- **代替：URLプレフィックス `https://moutonarchive.com/`**。HTMLタグ方式の場合は、Googleが提示した `<meta name="google-site-verification" ...>` の**content値のみ**を `src/_data/site.js` の `searchConsole` に設定し、PR→ビルド→デプロイ後に所有権を確認する。タグの値を推測して作らない。
- 所有権を確認した後に `sitemap.xml` を送信し、主要URLのインデックス状態を「URL検査」で確認。データは遅れて反映されることがあり、今の段階で検索回数をゼロと断定しない。
- 検索パフォーマンスを**クエリ別**に集計し、ブランド名「ムートン」「mouton」「moutonarchive」を含むクエリのクリック・表示回数・CTRなどを継続して見る。一般的な名詞の「ムートン」は別ブランドや革製品の検索と混同しうるため、**単語だけでブランドの指名検索だと断定しない**。
- GSCの検索パフォーマンスの「クリック」とGA4の「セッション」には定義・収集条件の違いがある。無理に同じ数に揃えない。

参考：[Google公式・所有権確認](https://support.google.com/webmasters/answer/9008080?hl=ja)

## 4. SNS・外部流入のUTMルール

GA4はURLの`utm_source`、`utm_medium`、`utm_campaign`などを収集できる。**SNS・メールなど外部に投稿する入口リンクだけに付ける。サイト内部のリンクにUTMを付けない**（流入元の判定が壊れるため）。

### 必須とする値

| サイト外の配布先 | `utm_source` | `utm_medium` | `utm_campaign`（例） |
| --- | --- | --- | --- |
| Xの通常投稿 | `x` | `organic_social` | `cleanliness_sample_202610` |
| Instagramプロフィール・ストーリーズ | `instagram` | `organic_social` | `brand_intro_202610` |
| note記事 | `note` | `referral` | `brand_intro_202610` |
| メールの案内（将来） | `newsletter` | `email` | `cleanliness_sample_202610` |

- キャンペーン名は**小文字の英数字・ハイフン・アンダースコア**で統一し、継続的に同じ企画には同じ`utm_campaign`を使う。例えば投稿別に`utm_content=post01`、`post02`として区別する。
- **氏名・メールアドレス・アカウントID・電話番号・その他個人識別情報**をURLのUTMに入れない。投稿の計測に個人の識別子は不要。
- 使っていない媒体を「運用済み」と記録しない。X以外の配布は公開した時点でログに記載する。
- GA4のデフォルトチャネル分類と自分の `utm_medium` が一致するか、取得データで確認する。メディア別の名称ゆれをつくらない。

### URL作成コマンド

GitHub内の `scripts/campaign-url.mjs` で、**moutonarchive.comのみ**を目的地としてUTM付きURLを生成する。

```sh
node scripts/campaign-url.mjs \
  https://moutonarchive.com/cleanliness-science.html \
  x organic_social cleanliness_sample_202610 post01
```

生成例：

```text
https://moutonarchive.com/cleanliness-science.html?utm_source=x&utm_medium=organic_social&utm_campaign=cleanliness_sample_202610&utm_content=post01
```

第5引数（`utm_content`）は任意。既存のクエリ文字列・他社ドメイン・HTTP・大文字や空白を含むUTM値は拒否する。実際に外部へ投稿していなければ、作成だけではGA4に数値は入らない。

参考：[Google公式・キャンペーンURL](https://support.google.com/analytics/answer/10917952?hl=ja)

## 5. 週次の計測KPI（例：直近7日／前の7日を比較）

| 指標 | 計算単位・真の取得元 | 取り扱いの注意 |
| --- | --- | --- |
| サイト訪問セッション | GA4・セッション | イベント数・PVと混同しない |
| Xからの流入セッション | GA4・セッションの参照元／メディアまたはキャンペーン | UTMがない既存流入は別分類になりうる |
| ブランド指名検索 | GSC・該当クエリのクリックと表示回数 | ブランド名と一致しても意図が曖昧なものを確認 |
| LP訪問セッション | GA4・ランディング／ページ別セッション | `lp_entry_click`回数とは別物 |
| LP入口クリック | GA4・`lp_entry_click`のイベント数 | 必ずしもLPに到達していない |
| サンプルクリック | GA4・`sample_click`、`sample_pdf_click` | **ユニーク閲覧者数や実DLではない** |
| サンプルCTR（参考） | 同じ期間のLP内サンプルクリック数 ÷ LP表示回数 | 集計スコープの違いに注意、厳密な訪問者転換率ではない |
| 登録完了・購入件数・利益 | **メール配信先／BOOTH等の決済データ** | サービスが未稼働なら「未計測」と記録 |
| 再訪 | GA4・リピーターや継続したエンゲージメント | トラッキング制限を考慮し単独でファン数と断定しない |

### 週次レポートに残す項目

**対象期間**、**参照したプロパティ／レポート**、**新たに実行した施策（投稿URL）**、**上表の取得できた値と前週差**、**データ欠損・設定変更**、**翌週の小さな改善1件**。

取得できない値は**「未計測」**、数値が実際に0だった場合のみ**「0」**と書く。広告費／販売手数料を未反映の売上を利益と呼ばない。直近の期間で短期的に数が変動してもすぐに成果と断定しない。

## 6. 開発時の検証と未完了作業

- `npm test`：UTM URL作成単体テスト、Eleventyの出力、リンク・基本構造・販売前表示のチェック。これは**ローカルのコード検証**でありGA4のサーバー到達確認ではない。
- PR：GitHub ActionsのBuild check、Browser smoke、Security scanをすべて確認。測定IDや個人情報を記録するコードの変更はレビューする。
- プライバシー：GA4へメールアドレスや自由記述内容を送信しない。URLはHTTPSを使い、外部計測ツールの設定時はプライバシーポリシーとの整合を確認。
- 外部管理者に依存するもの：GA4とSearch Consoleのログイン権限、確認コード、DebugViewの実受信、カスタムディメンション登録、SNSへの公開投稿、商品の購入／登録データ。**この文書の追加だけでは完了しない**。

参考：[Google公式・DebugView](https://support.google.com/analytics/answer/7201382?hl=ja) / [Google公式・カスタムディメンション](https://support.google.com/analytics/answer/14240153?hl=ja)

## 2026-10-16：哲学LPの購入前導線

`philosophy-lp.js` は既存の `gtag` が利用可能な場合だけ、リンクのクリックを送信する。本文・メモ・自由入力は収集しない。

| イベント | 意味 | パラメータ |
| --- | --- | --- |
| `philosophy_sample_click` | LP内の無料の問いへ移動する操作 | `product_id`, `placement` |
| `philosophy_preview_click` | 各商品の無料冒頭へ移動する操作 | `product_id`, `placement` |
| `philosophy_checkout_click` | 設定済みのnote商品ページへ移動する操作 | `product_id`, `placement` |

いずれも**実購入・読了・成果ではない**。GA4での実受信は未確認。実購入はnote側の確定注文で確認する。現在は3記事の `paid.url` が未設定なので、checkoutリンクは生成されない。価格は既存の各500円を保持し、未公開時は予定価格と表示。

販売開始に残る作業：有料全文の仕上げ・内容照合 → noteの有料範囲、価格、購入条件、閲覧方法の確認 → 公開済み商品URLを該当記事の `paid.url` に設定 → 購入から全文閲覧までの実動作確認。LPだけの変更で販売開始や収益化完了とは扱わない。
