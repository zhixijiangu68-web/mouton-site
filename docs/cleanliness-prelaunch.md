# MOUTON RESEARCH 001 — 清潔感の科学：発売前LP

## 目的
PDFガイド（A4・32ページ、1,980円・税込）を BOOTH で売る。無料サンプルの閲覧 → LP → BOOTH での購入、の順に数字を確かめる。
商品のPDFはこのリポジトリ（公開）には置かない。原稿と完成PDFはオーナーが手元と BOOTH で管理する。

## 販売を始める手順（オーナー）
1. BOOTH にショップを作り、完成PDFをデジタル商品として登録する（価格 1,980円）。返品の条件、特定商取引法に基づく表示の扱いを BOOTH の設定・ヘルプで確認する
2. `src/_data/site.js` の `product.cleanScience` に `checkoutUrl`（BOOTH の商品ページ）と `legalUrl`（特定商取引法に基づく表示のページ）を入れる
3. `npm run build` → `npm test`。`checkoutUrl` だけ入れて `legalUrl` が空だと、テストが失敗する（販売を始められない）
4. 自分で1回買ってみて、ダウンロードできるか確かめる

## 公開されるURL
- `/cleanliness-science.html`：商品LP（構成・FAQ・発売案内）
- `/cleanliness-sample.html`：5ページの無料サンプル（Web版、印刷からPDF保存可）\n- `/cleanliness-sample.pdf`：A4・5ページのダウンロード版
- `/cleanliness.html`：既存記事からのLP導線
- トップの「おすすめ」タブにも小さなリンクを追加（タブやイントロ演出自体は変更しない）

## メール登録の有効化（未設定）
`src/_data/site.js` の `prelaunch` を設定する。**配信サービスの実在するエンドポイント以外は入力しない**。
- `waitlistAction`：メール配信サービスのフォームPOST先URL（HTTPS）。
- `waitlistEmailField`：配信先サービスが受け付けるメールフィールド名（通常は email）。
- `waitlistService`：プライバシーポリシーに掲載するサービス名称。

フォーム送信にはサービス側の契約・本人確認・配信停止方法の設定が必要。
未設定の場合、フォームを非表示にし「先行案内の受付は準備中」と示す。
`base.njk` の CSP form-action には `waitlistAction` の origin を自動追加する。
サービスに特有の hidden input や double opt-in が必要な場合はフォームを修正してから公開する。

**重要：フォーム送信イベントは登録完了ではない。** `generate_lead` は現時点では送信しない。
配信サービス側でダブルオプトインを含む登録完了を確認できる場合のみ、適切な成功イベントの実装を追加する。
GA4にメールアドレスやその他の個人情報を送信しない。

## 計測
共通の `base.njk` は GA4 の `page_view` を既に記録。重複送信しない。

| Event | Where | Description |
| --- | --- | --- |
| `lp_entry_click` | `site.js` | LPへの入り口クリック。 `source_article` / `placement` を記録 |
| `lp_cta_click` | `cleanliness-science.js` | LP内で発売案内へスクロールする意図 |
| `sample_click` | `cleanliness-science.js` | 無料サンプルのページへのクリック（実読了ではない） |
| `sample_pdf_click` | 同上 | PDFファイルのリンククリック（ダウンロード成功とは異なる） |\n| `sample_print_click` | 同上 | 印刷ダイアログ起動（実際のPDF保存成功ではない） |
| `waitlist_submit` | 同上 | メールフォーム送信の試行のみ（登録確定とは異なる） |

共通パラメータ：`product_id=cleanliness_001`、`placement`、`cta_target`。
GA4のカスタムディメンションの登録は、GA4管理画面で別途必要。
登録完了件数の正は配信サービス側のデータ。有料購入件数の正はBOOTHなどの注文記録。

## 初期テスト
初期目標（市場平均ではなく実験用の仮基準）：対象読者からLP訪問200件、サンプルクリック40件、登録完了10件。
メール登録が未設定の段階では、登録率を検証できない。先にサンプル閲覧とヒアリングを行う。
追跡可能なURL・UTMを使い、SEO / X / 既存記事ごとに流入を区別する。
購入予定価格を明示したうえで、完成後の実販売（3〜5件）を別段階で検証する。

## 開発・確認
```sh
npm install
npm run build
npm test
```

iPhoneのSafariで、LPとサンプルの表示・ナビ・リンク・フォーム未設定表示を確認。
サンプルの「印刷・PDFとして保存」はiOS共有・プリント操作へ接続する。ブラウザや環境でPDFの保存操作は異なる。
GA4 DebugViewでは `page_view` とカスタムイベントの重複を確認する。

## Stripe テスト環境と本番切り替え（2026-10-13）

- Stripeに接続済みのアカウントは「ムートンサンドボックス」（**テスト専用**）。1,980円のテスト商品とテストPayment Linkを作成済み。本番の支払いはまだ受け付けない。
- 決済検証：`https://buy.stripe.com/test_5kQ14m37v3U3bQ02vc43S00`。**テストカードのみ**。テスト決済は実際のPDF納品と無関係。
- `src/_data/site.js` の `checkoutProvider` は既定で `booth`。Stripeに切り替えるときに限り `stripe` に変更し、同じ商品価格のStripe本番Payment Linkを設定する。`checkoutUrl` に `test_` のテストリンクを入れることは禁止（CIで失敗）。
- Stripeは自動的にPDFを配布しない。決済完了のリダイレクトURLだけで納品を許可してはならない。`checkout.session.completed` / 非同期決済確定イベントをサーバー側で署名検証し、非公開ストレージの期限付きダウンロードURL等で納品する。または実決済連動の信頼できる外部デジタル配布サービスを設定し、実購入に相当するE2E試験を完了する。
- 自動納品の実働、再送、返金時のアクセス管理、個人情報管理と販売規約を検証してから `fulfillmentReady: true` に変更する。これが未設定の場合Stripeの購入URLは有効にしない。
- Stripeの本番アカウントを別途接続し、本番決済を開始する前に `checkoutUrl`、`legalUrl`、`checkoutProvider`、`fulfillmentReady` をレビューする。
- 現行のBOOTH方式は従来どおり `checkoutProvider: 'booth'` とし、BOOTH側のダウンロード配布を利用する。
