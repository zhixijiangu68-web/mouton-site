# 画像の置き場所

サイトの絵は、このフォルダに決まった名前で画像を置くだけで差し替わります。
画像がまだないところには、色のグラデーションで描いた仮の絵が表示されます。

- 形式は JPG。WebP など別形式を使いたい場合は、HTML の `data-img` の拡張子も変えてください
- 横長のものは 2400×1500px 前後、ファイルサイズは 1 枚 500KB 以下が目安です
- 画面の大きさに合わせて切り抜かれるので、大事なものは中央寄りに置いてください
- スマホでは縦長に切り抜かれます。左右の端は見えなくなることがあります

## トップページ（スクロールの場面）

| ファイル | 場面 | 文字の色 |
|---|---|---|
| `images/hero.jpg` | 最初の画面「作る。記録する。残していく。」 | 白 |
| `images/scene-think.jpg` | 01 考える（哲学・生き方） | 白 |
| `images/scene-body.jpg` | 02 身体で、確かめる。 | 黒 |
| `images/scene-food.jpg` | 03 食べることを、evidenceで。 | 白 |
| `images/scene-about.jpg` | 好奇心を、形に。（ムートンについて） | 黒 |

文字の色は、その場面の絵が暗いか明るいかに合わせてあります。
明るい絵の上に白い文字が乗って読みにくいときは、`index.html` のその場面の `<section>` に `data-tone="light"`（黒い文字）を付けてください。
暗い絵の上で黒い文字が読みにくいときは、`data-tone="light"` を外してください（白い文字）。
ナビの文字色も同じ `<section>` の `data-nav`（`dark` で白、`light` で黒）で切り替わります。

## 記事ページの上部（カバー）

記事ごとの画像がなければカテゴリーの画像を、それもなければ仮の絵を表示します。
まずカテゴリーの画像を用意して、特に見せたい記事だけ個別の画像を足していくのがおすすめです。

| カテゴリー画像 | 使われる記事 |
|---|---|
| `images/cover-philosophy.jpg` | 哲学・生き方 |
| `images/cover-body.jpg` | 身体 |
| `images/cover-food.jpg` | 食事・化学 |
| `images/cover-books.jpg` | 本棚の紹介ページ |

記事ごとの画像:

| ファイル | 記事 | なければ使われる画像 |
|---|---|---|
| `images/articles/blood-glucose.jpg` | 血糖値は、なぜこれほど健康に重要なのか | `images/cover-food.jpg` |
| `images/articles/blueberry.jpg` | ブルーベリーは、本当にそんなにすごいのか | `images/cover-food.jpg` |
| `images/articles/book-habits-brain.jpg` | 変われない理由を、仕組みから考える。 | `images/cover-books.jpg` |
| `images/articles/book-ruthless-management.jpg` | 忙しさを、成果につなげるために。 | `images/cover-books.jpg` |
| `images/articles/boundaries.jpg` | 誰にでも好かれようとすると、なぜ安っぽくなるのか | `images/cover-philosophy.jpg` |
| `images/articles/dark-chocolate.jpg` | ダークチョコは、本当に体にいいのか | `images/cover-food.jpg` |
| `images/articles/disliked-priority.jpg` | 嫌われることを「気にしなくなる」のではない。優先順位が下がるだけだ | `images/cover-philosophy.jpg` |
| `images/articles/doing-nothing.jpg` | 何もしない時間は、本当に無駄なのか | `images/cover-philosophy.jpg` |
| `images/articles/fear.jpg` | 恐怖の正体は「危険」ではなく「不快感」かもしれない | `images/cover-philosophy.jpg` |
| `images/articles/freedom.jpg` | 愛ではなく、自由を求める | `images/cover-philosophy.jpg` |
| `images/articles/goggins.jpg` | デイビッド・ゴギンズという変人を、僕は尊敬している | `images/cover-philosophy.jpg` |
| `images/articles/halitosis.jpg` | 口臭の多くは「胃」ではなく、口の中から生まれる | `images/cover-body.jpg` |
| `images/articles/hill.jpg` | 「思考は現実化する」は、本当なのか。 | `images/cover-philosophy.jpg` |
| `images/articles/identity.jpg` | あなたはどんな人間になりたいですか？ | `images/cover-philosophy.jpg` |
| `images/articles/influence.jpg` | 人は、あらゆるものに影響されて生きている | `images/cover-philosophy.jpg` |
| `images/articles/music-life.jpg` | 音楽は人生を豊かにするのか。頭は良くならなくても、残るもの | `images/cover-philosophy.jpg` |
| `images/articles/nietzsche.jpg` | 神は死んだ。それでも、なぜ生きるのか。 | `images/cover-philosophy.jpg` |
| `images/articles/odor-care.jpg` | 匂いケアは「脇と足の裏」から。原因が違えば、対策も違う | `images/cover-body.jpg` |
| `images/articles/olive-oil.jpg` | オリーブ油は、本当に身体にいいのか | `images/cover-food.jpg` |
| `images/articles/refined-taste.jpg` | 目が肥えると、満足できなくなる | `images/cover-philosophy.jpg` |
| `images/articles/self-image.jpg` | セルフイメージは、長期の行動を変える | `images/cover-philosophy.jpg` |
| `images/articles/smell.jpg` | 匂いは、人の印象をどこまで決めているのか | `images/cover-body.jpg` |
| `images/articles/stamina.jpg` | 筋トレを減らしたら、なぜか「体力」がついた | `images/cover-body.jpg` |
| `images/articles/system-goal.jpg` | システムのないゴールは、動かない | `images/cover-philosophy.jpg` |
| `images/articles/trampoline.jpg` | 大人は、いつから跳ばなくなったのか。 | `images/cover-body.jpg` |
