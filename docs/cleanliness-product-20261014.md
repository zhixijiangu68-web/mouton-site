# MOUTON RESEARCH 001 — 完成版PDF商品台帳

更新日：2026-10-14（**Stripe販売に最終決定**）

## 正式商品
- 『清潔感の科学。』／著者ムートン／2026年10月第1版
- 価格：**税込2,980円**（一回払い）
- A4 PDF全75ページ、3部構成・全14章、30日間実践表、参考文献133件
- 原本ファイル：`清潔感の科学.pdf`（6,623,742 bytes）
- SHA-256：`bfaceb38a2eed3d1f391d2f0976cd773ec6d183c86f7619fd8144d595cbad377`
- **公開リポジトリに原本を保存しない。**

## 最終の販売経路
MOUTONサイトLP → Stripe Payment Links → Stripeの決済完了Webhook署名・金額/商品照合 → Cloudflare Worker → 非公開R2 → 購入者にResendで期限付きPDFダウンロードURLを送信。

- Stripeサンドボックス（`acct_1UQ564CL4xG9rfOJ`）に2026-10-14、現価格2,980円の商品・Price・Payment Linkを作成済み。
- 商品ID `prod_VRBSv0tp5arY3m`、価格ID `price_1UQJ5YCL4xG9rfOJ4FfXx6GW`、リンクID `plink_1UQJ5iCL4xG9rfOJ45Ebs9tn`。
- テストURL `https://buy.stripe.com/test_14AfZg4bz3U3dY80n443S01`。**テスト決済専用。サイトへ掲載不可**。
- R2の非公開オブジェクトキー `clean-science-2026-10-75p.pdf`。
- 今回のStripeへの決定により、先に作ったBOOTH案は廃止。
- Stripe本番アカウント・本番Payment Link・法定表示URL・R2原本・Webhook/メール納品・E2Eはまだ未設定／未検証。

## サイトの現状
`src/_data/site.js`：
`checkoutProvider:'stripe'`, `checkoutUrl:''`, `legalUrl:''`, `fulfillmentReady:false`。
表示は「Stripeでの発売準備中」。**購入受付不可**。

## リリース前の未完了
- [x] Stripe販売への切替（本番決済を無効に保つ）
- [x] Stripeサンドボックスに2,980円（税込）の新テスト商品とリンクを作成
- [x] PDF版・ページ数・金額の整合（75ページ、2,980円）
- [ ] 非公開R2へ原本アップロード・SHA照合
- [ ] D1・Resend・WorkerデプロイとWebhookテスト
- [ ] テスト購入→実ファイル配信→期限・上限・返金テスト
- [ ] Stripe本番アカウント、本番商品／Payment Link、販売者・特商法表示URL
- [ ] 本番E2E、CI・セキュリティ検証、Safari実機確認
- [ ] LPの本番購入リンク公開と本番販売

詳細：[Stripe発売手順](stripe-launch-20261014.md)／[Worker README](../fulfillment-worker/README.md)。
