# 「清潔感の科学」安全なStripe納品システム（Cloudflare Worker）

**現在の状態：GitHubにコード追加、未デプロイ。テスト決済と実購入は連携していません。現行商品は75ページ・税込2,980円です。**
この仕組みはGitHub Pagesではなく、別サーバーとして動かすものです。

## 何をするか
- StripeからのWebhookに対してStripe-SignatureをHMAC SHA-256で検証（5分以内）。
- 決済状態、Payment Link ID、JPY 2,980円、商品Price IDと購入数量1をStripe APIで照合。
- D1に注文IDで状態を記録し、重複配布を抑制。メール送信にはResendとIdempotency-Keyを使う。
- 決済確定後にのみ、購入者のメールへ有効期間7日・最大5回の署名付きURLを送る。
- 有料PDFはCloudflare R2の**非公開バケット**に保存。公開GitHubへアップロードしない。
- 返金済み・異議申し立て注文はダウンロード無効化。

## サービス準備（オーナーのアカウントで作業が必要）
1. Cloudflareにログインし、非公開R2バケットを作成する。
   npx wrangler r2 bucket create mouton-paid-pdfs
2. D1データベースを作成する。
   npx wrangler d1 create mouton-orders
3. このフォルダのwrangler.example.tomlをwrangler.tomlにコピーする。D1 ID、送信者アドレス、workers.devの正しいURL、Stripe商品価格ID、Payment Link IDを設定する。
4. D1マイグレーションを適用する。
   npx wrangler d1 migrations apply mouton-orders --remote
5. 完成した**有料75ページPDF**を非公開バケットの `clean-science-2026-10-75p.pdf` にアップロードする。無料サンプルをアップロードしない。公開アクセスは付与しない。原本の SHA-256 は `bfaceb38a2eed3d1f391d2f0976cd773ec6d183c86f7619fd8144d595cbad377`（6,623,742 bytes）。必ず照合する。
6. Resendで送信元ドメインを認証する。リンクのクリック追跡はオフにする（期限付きURLの漏えい防止）。
7. Workerの秘密情報をCloudflare Secretsに登録する。STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY, DOWNLOAD_SIGNING_SECRET（32文字以上）を npx wrangler secret put で設定する。コードやGitHubへ貼らない。
8. Workerをデプロイする。
   npx wrangler deploy
9. /healthが configured を返すことを確認。Stripe管理画面で /stripe/webhook を登録する。次のイベントが必要。
   checkout.session.completed
   checkout.session.async_payment_succeeded
   charge.refunded
   charge.dispute.created
10. Stripe**テスト環境**で支払い→メール→非公開PDFダウンロード→5回上限→重複Webhook→返金後停止を実際に検証し、送信ドメインとプライバシー説明を確定する。
11. Stripe本番口座を接続し、本番決済リンクを発行する。販売者情報・特商法表記・返品条件を整え、E2Eで完成PDFを受け取れることを確認。
12. サイトのcheckoutProviderは既にstripeへ変更済みでcheckoutUrlは空。すべて完了してから本番checkoutUrlとlegalUrlを設定し、fulfillmentReadyをtrueにする。先にtrueにしてはならない。

## 決済リンク（テスト専用）
- 【旧設定・流用禁止】1,980円 テスト商品: prod_VQx4tuODG8P62r
- テスト価格: price_1UQ5BLCL4xG9rfOJ69G0HSle
- テスト決済リンクID: plink_1UQ5BiCL4xG9rfOJbxK2OHUm
- テスト画面: https://buy.stripe.com/test_5kQ14m37v3U3bQ02vc43S00
- このテストリンクは**旧価格1,980円**であり、完成版75ページ／2,980円の商品には使用できません。新価格のテスト商品・Price ID・Payment Link IDを別途作成してください。完成版PDFの自動配布も未接続です。

## テスト
- npm --prefix fulfillment-worker test
- node --test でWebhook署名、偽装リンク、価格・通貨・未払い、署名付きURL改変、期限、返金、上限などを検証。
- フォルダ直下のwrangler.toml、.dev.vars、全PDFはgitignore対象。
- E2E実課金確認、監査、継続運用テストまでは **fulfillmentReady:false** のまま維持すること。

## 注意
- Stripe Payment Linkだけではデジタルファイルを自動配布できません。WebhookとR2配布は別途稼働させる必要があります。
- Webhookの送信は少なくとも1回であり、重複・順序違い・失敗再送に備える必要があります。
- 返金Webhook到着より先に新規注文イベントが届いた場合、返金処理の順序によっては後の注文復旧処理に注意が必要です。実運用ではStripeとの注文状態の定期照合を追加してください。
- 購入メールアドレスをD1に保存するため、保管期限・権限・削除方針をプライバシー規約に明示してください。
- 送信メール処理とDB更新の間で停止すると、重複メールが発生することがあります。Resendの冪等キーとStripeの再送で抑制しますが、完全保証ではありません。

## 2026-10-14 新価格のサンドボックス（テスト専用）
- Account: `acct_1UQ564CL4xG9rfOJ`、livemode=false（ムートンサンドボックス）
- Product: `prod_VRBSv0tp5arY3m`（75ページ版）
- Price: `price_1UQJ5YCL4xG9rfOJ4FfXx6GW`（税込2,980円、JPY）
- Payment Link: `plink_1UQJ5iCL4xG9rfOJ45Ebs9tn`
- テストURL: https://buy.stripe.com/test_14AfZg4bz3U3dY80n443S01
- Stripe APIでラインアイテム数量1・JPY 2,980円を確認済み。**決済・Webhook・メール・R2納品の結合試験はまだ未実施**。
- テスト用Worker変数 `STRIPE_PRICE_ID` と `STRIPE_PAYMENT_LINK_ID` には上記IDを設定する。本番では**別アカウントの本番Priceとリンク**を発行する。
- 2026-10-13の旧1,980円テスト商品・リンクは使用禁止。
- 現在のサイトはStripe販売準備中・購入ボタンなし。テスト用リンクを公開サイトへ掲載しない。

詳しい現状・公開条件：[Stripe発売手順](../docs/stripe-launch-20261014.md)。
