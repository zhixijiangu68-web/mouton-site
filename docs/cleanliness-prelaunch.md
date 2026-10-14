# MOUTON RESEARCH 001 — 清潔感の科学。発売前LP

**2026-10-14 現行方針：Stripe Payment Linksで税込2,980円のPDF75ページを販売する。旧BOOTH計画は廃止。**

## 購入体験
SNS/記事→`/cleanliness-science.html`（14章・参考文献133件）→`/cleanliness-sample.html`（5ページ無料Webサンプル）→Stripe決済→Webhook決済照合→購入者メールへ非公開PDF取得リンク。

有料原本を公開GitHub/GitHub Pagesに置かない。テストPayment Linkは**公開LPに掲載禁止**。

## 状態
- `src/_data/site.js` の `product.cleanScience` はStripe指定済み。
- `checkoutUrl:''`, `legalUrl:''`, `fulfillmentReady:false` のため購入不可。
- 2026-10-14 Stripeサンドボックスで現価格2,980円のテストProduct/Price/Linkが作成済み。テストリンクは納品につながっておらず、実課金不可。
- Stripe本番環境の接続、特商法表示、R2、D1、Resend、Webhook、E2Eテスト、iPhone Safari確認は未完了。
- 既存5ページ無料サンプルPDFの実内容と原本の整合は販売前に点検する。

## 導入手順
詳細なID、原本SHA、R2キー、秘密情報、テスト手順、販売条件は [Stripe販売手順](stripe-launch-20261014.md) と [Worker README](../fulfillment-worker/README.md) に記載。全条件が揃うまで本番決済を有効化しない。

## 先行案内
未設定のメール配信フォームは引き続き非表示（`enabled:false`）。ダブルオプトイン・配信停止・個人情報利用目的・送信者情報確認前に有効化しない。

## GA4（購入意図と実購入を混同しない）
`lp_entry_click`:記事・トップからのLPクリック／`view_item`:商品閲覧／`lp_cta_click`:販売欄への移動／`sample_click`:無料Webサンプルのクリック／`sample_pdf_click`:無料PDFのリンククリック／`sample_print_click`:印刷の起動／`waitlist_submit`:配信先への送信試行／`begin_checkout`:Stripeリンククリック。

売上・決済完了は本番Stripe側の支払い・Webhook注文記録のみを正とする。ブラウザ側の `purchase` 擬似送信はしない。GA4 DebugViewの実受信とSafari実機動作は別途確認する。

## 検証
```sh
npm install
npm run build
npm test
node scripts/check-cleanliness-prelaunch.mjs
npm --prefix fulfillment-worker test
```
GitHub Actions: Build check、Browser smoke、Security scan、Secure PDF delivery testsを確認する。失敗・進行中を成功とみなさない。

## 履歴
- 2026-10-13：Stripe旧1,980円テスト商品（今後流用しない）。
- 2026-10-14：完成版75ページ・2,980円へ確定。一時的なBOOTH案は同日撤回。
- 2026-10-14：Stripeを正式採用、現価格の新サンドボックス商品・リンク作成。
