# PDF納品Webhookの503 retry調査（2026-10-14）

## 現状
- Stripeテスト決済：2,980円・JPY・数量1、支払済み。
- Stripe `checkout.session.completed` イベントが未完了・Webhookから `HTTP 503 retry`。
- Cloudflare Worker `/health` は `configured`。
- D1 `mouton-orders` に `orders` テーブルは存在し、9列も揃っている。
- `SELECT status, COUNT(*) AS count FROM orders GROUP BY status;` は0件。
- メール未着。原則再購入せず、原因究明後に**既存イベントを再送**する。

## 注意
- `/health` は設定値の存在確認のみ。Stripe API認証・実注文書込・Resendメール・R2キーの存在までは確認できない。
- `retry` は、Worker側で**Stripe APIによるline_itemsの確認またはD1保存/読込/claim**などに例外が発生していることを示す。レスポンスだけでは断定できない。
- `orders` テーブルの存在は、Workerの `ORDERS` バインディングが**同じD1データベース**に向いている証明ではない。
- 有料PDFやStripe/Resend/Webhookの秘密鍵を公開リポジトリ、Issue、ログ、チャットへ掲載しない。

## 診断方法
1. このPRの `fulfillment-worker/src/index.js` をCloudflare Workerの **Edit code** に反映し **Deploy**（初期Hello Worldや以前の古いコードに戻さない）。
2. Cloudflare Worker **Observability → Logs** で実行ログの収集を有効にし、ログを確認できるようにする。
3. Stripeサンドボックスの **Workbench → Webhooks → Event deliveries** で、購入済み `checkout.session.completed` の失敗した配信を **Resend**（再送）する。新しく購入しなくてよい。Stripe側でイベントが再試行中なら重複検証に注意。
4. Cloudflare Logsに出た次の **エラー名とステータス番号のみ**を確認する。メールアドレス・署名・APIキー・Webhook本体は共有しない。

| ログ | 調査対象 |
| --- | --- |
| `mouton_delivery_failure {phase:"stripe_line_items"}` と `mouton_stripe_http_status 401` | Workerに登録した `STRIPE_SECRET_KEY` の認証。Stripeの正しい**ムートンサンドボックス**用秘密鍵であることをStripe管理画面で確認し、CloudflareのSecretへ直接再登録する |
| `mouton_delivery_failure {phase:"stripe_line_items"}` と `mouton_stripe_http_status 403` | StripeのRestricted APIキー権限またはAPI拒否。Stripe管理画面で読み取り権限とサンドボックスIDを点検 |
| `mouton_stripe_line_items_mismatch` | Workerの `STRIPE_PRICE_ID` が `price_1UQJ5YCL4xG9rfOJ4FfXx6GW`、Payment Link IDが `plink_1UQJ5iCL4xG9rfOJ45Ebs9tn` に一致するか点検 |
| `mouton_delivery_failure {phase:"d1_insert"}` | Cloudflare Worker Bindingsの `ORDERS` が `mouton-orders` の正しいDBを指すこと、およびテーブル定義を点検 |
| `mouton_delivery_failure {phase:"d1_read"}` / `d1_claim` | WorkerのD1接続とSQLエラーを確認 |
| `mouton_delivery_failure {phase:"resend_send"}` / `d1_mark_sent` | ResendのLogs、送信ドメイン、D1更新を点検（通常Webhook応答本文は `delivery failed; retry`） |

5. `200 delivered` が出たら、D1の `orders.status` を確認し、Resendの送信ログおよび受信メール・署名URLのPDF取得を確認する。
6. `R2` に `clean-science-2026-10-75p.pdf` があること、外部公開が無効であることを確認する。
7. テスト購入→自動納品→返金失効までのE2Eを終えるまでは、本番LPの `checkoutUrl` は空、`fulfillmentReady:false` を維持する。

## 診断パッチの安全性
- Cloudflareの `console.error` に出すのは固定の `phase` 名とStripe HTTPステータス**番号だけ**。購入者情報・認証情報・Session ID・Webhook署名・ダウンロードURLは出さない。
- HTTPのレスポンス本文は従来どおり `retry` または `delivery failed; retry`。外部から内部の詳細を読み取れない。
- 本パッチはロギング変更のみで決済・配布条件は変更しない。
