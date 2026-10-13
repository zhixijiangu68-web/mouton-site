# MOUTON RESEARCH 001 — 清潔感の科学：発売前LP

## 目的
980円予定のPDFに対し、無料サンプルの閲覧・先行案内登録・後日の有料購入で需要を段階的に確かめる。
まだ販売を開始していない。商品の購入・予約・クレジットカード決済はこのLPではできない。

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
