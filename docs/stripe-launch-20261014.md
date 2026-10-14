# 清潔感の科学。— Stripe決済・納品導入計画（2026-10-14）

## 最終決定
- 販売先：**Stripe Payment Links**。従来のBOOTH案は採用しない。
- 商品：MOUTON RESEARCH 001『清潔感の科学。』2026年10月第1版
- 価格：**税込2,980円（JPY）・一回払い**。
- 形式：A4 PDF 全75ページ／理論・各論・実践の3部・全14章／参考文献133件
- MOUTONのLP：`https://moutonarchive.com/cleanliness-science.html`（本番決済開始までは発売準備中）
- 納品方法：Stripe署名確認済みWebhook → Cloudflare Worker + D1 → 非公開R2 → Resendメール（期限7日・5回上限）。
- PDFの原本を**公開GitHub/GitHub Pagesにアップロードしない**。

## 新しく作成済みのStripeテスト商品（本番では使用禁止）
| 項目 | 内容 |
| --- | --- |
| Stripeアカウント | ムートンサンドボックス（`acct_1UQ564CL4xG9rfOJ`、livemode=false） |
| 商品ID | `prod_VRBSv0tp5arY3m` |
| Price ID | `price_1UQJ5YCL4xG9rfOJ4FfXx6GW` |
| 金額 | `2980 JPY`・tax_behavior=inclusive・一回払い |
| Payment Link ID | `plink_1UQJ5iCL4xG9rfOJ45Ebs9tn` |
| テストリンク | https://buy.stripe.com/test_14AfZg4bz3U3dY80n443S01 |
| 検証 | Stripe APIで価格・通貨・数量1・合計2,980円を確認済み |
| 実際の決済・納品 | **未実施**。Webhooks・非公開R2配布・メール送信は未接続 |

> このリンクはStripeサンドボックス専用です。公開サイトの `checkoutUrl` に絶対に設定しないでください。旧1,980円のテスト商品やリンクを流用しないでください。

## 非公開PDFの準備
- 完成版PDF：`清潔感の科学.pdf`（6,623,742 bytes）
- 元ファイルSHA-256：`bfaceb38a2eed3d1f391d2f0976cd773ec6d183c86f7619fd8144d595cbad377`
- R2バケット：`mouton-paid-pdfs`（**public accessなし**）
- R2キー：`clean-science-2026-10-75p.pdf`
- Cloudflare D1：`mouton-orders`
- Workerコード：`fulfillment-worker/src/index.js`
- ローカル設定の参考：`fulfillment-worker/wrangler.example.toml`

## ステップ（公開まで）
1. Cloudflareにログインし、非公開R2・D1を作成。D1マイグレーションを適用。
2. 原本PDFを非公開R2の正しいキーにアップロードし、サイズ・75ページ・SHA-256を照合する。
3. Resendでメール送信ドメインを認証。期限付きURL漏えいを避けるためクリック追跡は無効化。
4. Wrangler Secretsに `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`RESEND_API_KEY`、`DOWNLOAD_SIGNING_SECRET`（32文字以上）を設定。公開GitHubやIssueへ貼らない。
5. Workerテスト用環境を構築し、上記の**新しいテストPrice ID / Payment Link ID**を設定する。Webhookの署名、金額2,980円・数量1・支払済み・IDを厳密に照合する。
6. Stripeサンドボックスで実際にテスト決済し、Webhook → メール → PDF取得まで実機検証。重複Webhook、未払い、期限切れ、5回制限、返金後の失効を確かめる。
7. Stripe本番アカウントを接続し、本番の商品・Price・Payment Link・Webhook秘密情報を**別々に**準備。販売者情報、特定商取引法表示URL、キャンセル・返金条件、消費税・電子書籍の取扱い、個人情報の取り扱いを確認。
8. 本番と同等の安全確認に成功してから `src/_data/site.js` に検証済み**本番** `checkoutUrl` と `legalUrl` を設定し、 `fulfillmentReady:true` を設定する。それまでは下記のまま維持。
9. `npm run build`、`npm test`、`npm --prefix fulfillment-worker test`、GitHub Actions、Safari実機と購入者メールを確認してリリースする。

## 現時点のサイト安全設定
```js
cleanScience: {
  priceJPY: 2980,
  priceText: '2,980',
  pages: 75,
  checkoutProvider: 'stripe',
  checkoutUrl: '',
  legalUrl: '',
  fulfillmentReady: false
}
```
**本番決済と納品はまだ有効になっていません。**

## 計測上の注意
- `view_item` は閲覧、`begin_checkout` はStripeリンクへの遷移であり `purchase` ではない。
- 実売上は本番Stripe注文の支払確認とWebhookで管理する。
- 無料5ページPDFの改版との一致も販売前に点検する。
- 以前のBOOTH商品登録計画は `docs/booth-launch-20261014.md` に**廃止案**として保管する。
