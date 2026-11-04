# 哲学の有料記事3本を、このサイトで売る（2026-10-16 オーナー決定）

**決定**：キルケゴール・ニーチェ・スピノザの有料記事3本（各 **2,980円・税込**）は、note ではなく**このサイトで販売**する。届け方は **PDF をメールで**（オーナーが選択）。
**今の状態**：**販売していない**。ページは「このサイトでの販売準備中」。購入ボタンは、下の条件がそろうまで出ない（`npm test` の `scripts/check-paid-sales.mjs` が止める）。

## しくみ

清潔感の科学のために作った仕組み（`fulfillment-worker/`）をそのまま使う。

1. 販売ページ（`paid-*.html`）の「購入する（PDF）」→ Stripe の Payment Link（記事ごとに1つ）
2. 支払いが済むと、Stripe が Cloudflare Worker に Webhook を送る
3. Worker が支払い・Payment Link・Price・金額（2,980円）・数量1を確かめ、D1 に注文を記録
4. Resend で、購入者のメールに期限つきのダウンロード用リンクを送る（いまの設定は有効期限7日・最大5回）
5. リンクを開くと、非公開の R2 から PDF が届く。返金・異議申し立ての注文は無効にする

## 販売を始めるまでの順番

変える場所を一度に増やさない（どこで止まっているか分からなくなるため）。1つずつ確かめてから次へ進む。

1. **今ある1商品の納品を通す**：清潔感の科学のテスト決済で起きている Webhook の 503（PR #160）の原因を突き止めて直し、サンドボックスで「支払い → メール → PDF」まで通す。
2. **Worker を複数の商品に対応させる**（下の「Worker の変更点」）。`deliver()` の単体テスト（Stripe・D1・Resend の各段の失敗）も足す。
3. **Stripe サンドボックスに3商品を作る**：商品・価格（2,980円・JPY）・Payment Link を記事ごとに1つ。数量は変えられないようにする。支払い後の画面に「メールで PDF が届く」ことを書く。
4. **R2 に PDF 3本を置く**（非公開のまま。公開リポジトリには絶対に入れない）。置いたあと、ファイルの SHA-256 を下の値と照らし合わせる。
5. **サンドボックスで、記事ごとに通しの確認**：購入 → メール → ダウンロード → 5回で止まる → 同じ Webhook の再送で二重に送られない → 返金でリンクが無効になる。
6. **購入の前に必要なページを整える**
   - **特定商取引法に基づく表記**（テンプレートは `src/_data/legal.js` と `src/legal.njk`。空欄を埋めると `legal.html` ができ、埋まるまでは公開されない。返品の条件と購入者向けのお問い合わせも同じページに出る）。2026-10-16 決定済み：返品は基本なし（重複購入は返金）、住所・電話番号は請求時に開示。**販売事業者の氏名・購入者向けメール・受付と返信の目安・支払方法の4つは、販売の仕組み（手順1〜5）が通ったあと、公開の直前にオーナーが決める**）：販売事業者名、運営責任者、所在地、電話番号、メールアドレス、販売価格、商品代金以外に必要な料金、支払方法と時期、引き渡しの時期（決済後すぐにメール）、返品・キャンセル（デジタル商品の扱い）、動作環境（PDF を開ける端末）。中身はオーナーの情報なので、AI は書き込まない。個人の販売者の住所・電話番号の扱いは、消費者庁の通信販売のガイドで確かめてから決める。
   - **プライバシーポリシー**：購入時のメールアドレスを Stripe・D1・Resend で扱うこと、保管期間、削除の受付。
   - **お問い合わせ**：購入者が連絡できる窓口（いまは X だけ）。メールが届かないときの連絡先として必要。
7. **本番の準備**：Stripe 本番口座で、商品・価格・Payment Link・Webhook の秘密鍵を**サンドボックスとは別に**作る。本番の Worker の設定も別にする。
8. **公開**：各記事の front matter `paid.checkoutUrl` に本番の Payment Link、`src/_data/site.js` の `product.philosophy` に `legalUrl` を入れ、最後に `fulfillmentReady: true`。`npm test` が通ったときだけ、購入ボタンが出る。

## 本番切り替えのチェックリスト（手順 7〜8 の中身。2026-10-19）

サンドボックスと本番は、鍵も Worker も分ける。混ぜると、本番の購入者にサンドボックスの設定で返事をすることになる。

1. **本番の Worker を別名で作る**（例 `mouton-delivery-live`）。D1 も本番用に別に作り（例 `mouton-orders-live`）、`0001`・`0002` のマイグレーションを `--remote` で適用。R2 のバケットは同じでよい（PDF は同じ）。
2. **Secrets を本番口座の鍵で登録**：`STRIPE_SECRET_KEY`（本番の秘密鍵）、`STRIPE_WEBHOOK_SECRET`（本番の Webhook の署名シークレット）、`RESEND_API_KEY`、`DOWNLOAD_SIGNING_SECRET`（サンドボックスとは別の32文字以上）。
3. **変数**：`PRODUCTS` に本番の Payment Link ID・Price ID、`PUBLIC_BASE_URL` に本番 Worker の URL、`FROM_EMAIL` は認証済みのドメイン。
4. **Stripe 本番**：3商品・価格（2,980円 JPY・税込）・Payment Link（数量は変更不可、支払い後の文言に「数分以内にメールで PDF のリンクが届く」）。Webhook エンドポイント `https://<本番 Worker>/stripe/webhook` に4イベント（`checkout.session.completed`・`checkout.session.async_payment_succeeded`・`charge.refunded`・`charge.dispute.created`）。
5. `/health` が `configured`。**自分のカードで1件テスト購入** → メールが受信トレイに届く（迷惑メールに入らないか）→ PDF が開く → 同じイベントを再送して `already delivered` → 返金 → `revoked`、リンクが 403。手数料が返金で戻るかは確かめられず（Stripe の料金ページで見る）。
6. 特定商取引法の表記（`src/_data/legal.js`）を埋め、`npm run build` → `npm test`。`legal.html` が出ることを確かめる。
7. 各販売ページの front matter `paid.checkoutUrl` に本番の Payment Link、`src/_data/site.js` の `product.philosophy.legalUrl`、最後に `fulfillmentReady: true`。`npm test` が緑のときだけ公開。
8. 公開後、最初の実決済は Stripe の支払い記録と D1 の注文で確かめる（GA4 では数えない）。不審請求の申し立てが来たら、Stripe の期限内に D1 の記録（送信・ダウンロード回数）を証拠として出す。

## 購入者から「届かない」と言われたとき（オーナーの手順。2026-10-19）

鍵・購入者のアドレス・ダウンロードの URL は、Issue・ログ・チャットに貼らない。D1 の操作は Cloudflare のコンソールで。

1. **探す**：D1 で `SELECT session_id, status, expires_at, downloads, created_at FROM orders WHERE email = '購入時のアドレス';`
2. **行が無い**：Webhook が届いていない。Stripe の Workbench → Webhooks → Event deliveries で、その支払いの `checkout.session.completed` が失敗していれば Resend（再送）。成功になっているのに行が無ければ、Worker のバインディング先の D1 が別物。
3. **`pending` か `failed`**：メールを送れていない。同じイベントを Resend すれば送られる（Worker は `pending`/`failed` を拾い直す）。
4. **`sent` で期限内（`expires_at` が未来、`downloads` が 5 未満）**：Resend は受け付けている。Resend の Logs で delivered か bounced かを見る。delivered なら迷惑メールのフォルダを確かめてもらう。bounced ならアドレスの誤り。Stripe の Customer に別のアドレスがあれば、そちらに送り直す（下の5）。
5. **期限切れ・5回使い切り・別のアドレスに送り直す**：`UPDATE orders SET status = 'pending', expires_at = strftime('%s','now') + 604800, downloads = 0, updated_at = strftime('%s','now') WHERE session_id = 'cs_…';` のあと、同じイベントを Resend。期限が変わるとリンクも新しくなる。注意（確かめられず）：Resend の Idempotency-Key は一定時間（24時間と言われる）同じ応答を返すので、前回の送信から24時間以内の再送は届かないことがある。急ぐときは、Resend の Logs にある前回のメール本文のリンクを、手で送る。
6. **`revoked`**：返金か異議申し立て済み。再送しない。
7. それでも届かなければ、返金で対応（特定商取引法の表記の「メールが届かない・ファイルが開けない場合」のとおり）。

## Worker の変更点（手順 2。2026-10-19 に実装し、PR にした。Cloudflare に載せるのは手順 1 が `delivered` になってから）

実装：`fulfillment-worker/src/index.js`（商品の一覧 `PRODUCTS`、Payment Link で商品を決める、商品ごとの金額・Price・R2 のファイル・メール）、`migrations/0002_orders_product.sql`、`tests/worker.test.mjs`（14件）、`wrangler.example.toml`。`PRODUCTS` が無いあいだは旧い3変数を清潔感の科学1商品として読むので、手順 1 の診断中の Cloudflare の設定はそのままでよい。

もとの Worker は1商品だけを前提にしていた（`STRIPE_PRICE_ID`・`STRIPE_PAYMENT_LINK_ID`・`PDF_OBJECT_KEY` が1つずつ）。

- 商品の一覧を1つの変数（秘密ではない）にまとめる：商品ID・Payment Link ID・Price ID・金額・R2 のファイル名・メールの件名。
- Webhook：届いた注文の Payment Link から商品を決め、その商品の Price・金額で照らし合わせる。
- D1：注文に商品IDの列を足す（`ALTER TABLE orders ADD COLUMN product_id TEXT NOT NULL DEFAULT 'clean_science';`）。今ある注文は清潔感の科学として扱う。
- ダウンロード：注文の商品IDから R2 のファイルを選ぶ。
- メール：商品ごとの件名と本文（記事名）。
- ログは PR #160 と同じく、段階の名前と Stripe の番号だけ。メールアドレス・鍵・注文ID・リンクは出さない。

## PDF（公開リポジトリには入れない）

note 用に書いた全文から作った。表紙・「この PDF の使い方」（読むだけでいい、いまの状態 → 読むところの地図。見出しを押すとそのページへ移る）・本文・「最後に、一つだけ」（答えを書かない問いを一つ）・「この PDF について」（個人で読むためのもの、要約と訳、治療の代わりにならない）。A5。2026-10-17：オーナーの判断で、書き込みワーク・書き込み用ページ・「次の一歩（今日やること・やめること）」を外した（安易に与えると、それ自体が受け身になる）。同日、オーナーが共有した資料「意志力に頼らない習慣設計」から、ワークや命令形を除いて材料を足した（スピノザ：どうにでもなれ効果、自分への思いやり、すぐのごほうび、区切りの日、アリストテレス／キルケゴール：『反復』／ニーチェ：運命愛）。

| 記事 | Worker の `PRODUCTS` の `id` | R2 に置くファイル名（＝`objectKey`。ダウンロード時の `filename` も同じ） | ページ | SHA-256 |
|---|---|---|---|---|
| キルケゴール | `philosophy_kierkegaard` | `mouton-philosophy-01-kierkegaard.pdf` | 21 | `aac13f3de99beba3edf37bef239364ecd61b3f94d0e6ffcfe21e5a4d1afaa766` |
| ニーチェ | `philosophy_nietzsche` | `mouton-philosophy-02-nietzsche.pdf` | 21 | `e9d9e5fb4bd9b870b52383b21a05201e46a4a8ee11964c0fa7f1c9d10f81c0ec` |
| スピノザ | `philosophy_spinoza` | `mouton-philosophy-03-spinoza.pdf` | 21 | `0abdf4d8bc680ec8da4ac0996b7a74377be10aa2e5f45d5a153bd2b3a5876ba0` |

`PRODUCTS` の `title` は販売ページの `paid.title`（メールの件名と本文に出る）。`amountJPY` は 2980。本文を直したら PDF を作り直し、この表の SHA-256 も書き換える。

## オーナーが決めること

- ダウンロードの期限（いまは7日・5回）。記事は何度も読み返すものなので、延ばすかどうか。変えたら販売ページの表記（`partials/paid-lp-bottom.njk`）も直す。
- 3本セットを作るか、作るなら値段。
- 返品・キャンセルの条件（特定商取引法に基づく表記に載せる）。

## 計測

- `paid_buy_click`：販売ページの「購入する（PDF）」を押した（Stripe の画面へ移った）。購入ではない。
- 実際の購入は Stripe の支払い記録と D1 の注文で確かめる。GA4 では数えない。
