# X の投稿文（下書き）

@kodoku__alone から投稿する用の下書きです。投稿・返信・DM はオーナーが行い、X担当（AI）は下書きと記録までを受け持ちます。

- サイトのドメインは **https://moutonarchive.com/** で確定です
- **投稿の型（2026-10-07 から）**：ふだんはインプレッションを増やすため、**リンクなしで読み切れる有益な投稿**にします
  - **リプリンク**（基本）：本文はリンクなしで投稿し、すぐ自分の投稿にリプライして、各案の「リプライ」の1行（URL つき）を貼る
  - **本文リンク**（1日1本まで）：本文の最後に1行あけて、リプライの URL の末尾 `utm_content=reply` を `utm_content=body` に変えたものを付ける。リプライはしない。新しい選び方記事の告知などに使う
  - どちらの型で出すかは、順番表の「メモ」欄に書いてあります
- リンクには `?utm_source=x&utm_medium=social&utm_campaign=<記事のファイル名>&utm_content=<reply か body>` が付いています。GA4 で、X からの流入を記事ごと・型ごとに見分けるためです。**リンクの末尾を消さずに投稿してください**
- 本文はどれも140字以内（URL を除く）。本文リンクにしても、X の重み付きの文字数（日本語は1字＝2、URL は一律23）で280以内に収まることを確かめています
- 商品や本を名指しで推す投稿には、先頭に「【PR】」を付けています。消さずに投稿してください
- 「効く」「治る」とは言い切らず、記事に書いてあることと数字だけを使っています
- 投稿の順番は下の「順番表（10/7〜10/31）」に従います。投稿したら「投稿」の欄に ✓ を付けてください（X担当が毎朝、前日分を確認します）

## 選び方（商品紹介がある記事。収益につながる）

`src/articles/` で front matter に `guide` がある11本。最初の9本は切り口の違う案を4本ずつ、10/7 に加わった2本（TR・ES）は2本ずつ。BP-4・TR-2・ES-2 は予備。

### OL オリーブオイルの選び方（olive-oil-guide）

#### OL-1 「エキストラバージン」の表示
```
「エキストラバージン」と書いてあるオリーブオイル。

実は日本の規格（JAS）には、エキストラバージンという区分がない。

じゃあ店で何を見ればいいのか。容器、日付、表示、量。研究をもとに5つに絞った。
```
リプライ（自分の投稿に返信）：
```
「オリーブオイルの選び方」の記事はこちら → https://moutonarchive.com/olive-oil-guide.html?utm_source=x&utm_medium=social&utm_campaign=olive-oil-guide&utm_content=reply
```

#### OL-2 容器
```
オリーブオイル、透明な瓶を選んでない？

光の下で10か月保存した研究では、緑色の瓶やUVカットの瓶より、光を通さない紙パック容器のほうが酸化を抑えた。

店では、缶、色の濃い瓶、箱入りを。照明の当たる棚の前列にあった透明な瓶は避けたい。
```
リプライ（自分の投稿に返信）：
```
「オリーブオイルの選び方」の記事はこちら → https://moutonarchive.com/olive-oil-guide.html?utm_source=x&utm_medium=social&utm_campaign=olive-oil-guide&utm_content=reply
```

#### OL-3 日付と量
```
オリーブオイルの賞味期限は、びん詰めした日が基準のことが多い。いつ搾ったかは分からない。

だから見るのは、収穫日や搾油日。

それと、大容量は割安でも、使い切るまでに酸化が進む。まずは250〜500mLくらいから試すといい。
```
リプライ（自分の投稿に返信）：
```
「オリーブオイルの選び方」の記事はこちら → https://moutonarchive.com/olive-oil-guide.html?utm_source=x&utm_medium=social&utm_campaign=olive-oil-guide&utm_content=reply
```

#### OL-4 使い方
```
オリーブオイルは、たくさんとるほど良いわけではなかった。

研究に一番沿っていたのは、バターやマヨネーズを使っていた分を、オリーブオイルに置き換える使い方。

量を増やすより、置き換える。選び方と一緒にまとめた。
```
リプライ（自分の投稿に返信）：
```
「オリーブオイルの選び方」の記事はこちら → https://moutonarchive.com/olive-oil-guide.html?utm_source=x&utm_medium=social&utm_campaign=olive-oil-guide&utm_content=reply
```

### CH ダークチョコの選び方（dark-chocolate-guide）

#### CH-1 カカオ分の数字
```
カカオ86%と95%、どっちがいい？

調べてみると、カカオ分の数字には脂肪（ココアバター）も含まれていて、数字だけでは成分の量は決まらなかった。

ダークチョコとココアを選ぶときに見るところをまとめた。
```
リプライ（自分の投稿に返信）：
```
「ダークチョコの選び方」の記事はこちら → https://moutonarchive.com/dark-chocolate-guide.html?utm_source=x&utm_medium=social&utm_campaign=dark-chocolate-guide&utm_content=reply
```

#### CH-2 パッケージ裏の「名称」
```
ダークチョコを買うとき、パッケージの裏を見てる？

「名称」の欄に「チョコレート」「準チョコレート」「チョコレート菓子」などと書いてある。

カカオが目当てなら、まず「チョコレート」と書いてあるものを選ぶ。
```
リプライ（自分の投稿に返信）：
```
「ダークチョコの選び方」の記事はこちら → https://moutonarchive.com/dark-chocolate-guide.html?utm_source=x&utm_medium=social&utm_campaign=dark-chocolate-guide&utm_content=reply
```

#### CH-3 ココアの加工
```
ココアは、加工でフラバノールの量が大きく変わる。

調べた研究では、アルカリ処理をしていないココアは平均で1gあたり約35mg。強く処理したものは約4mgだった。

選ぶなら、砂糖の入っていない「純ココア」。処理の有無も確かめたい。
```
リプライ（自分の投稿に返信）：
```
「ダークチョコの選び方」の記事はこちら → https://moutonarchive.com/dark-chocolate-guide.html?utm_source=x&utm_medium=social&utm_campaign=dark-chocolate-guide&utm_content=reply
```

#### CH-4 重金属
```
アメリカで72のカカオ製品を調べた研究では、鉛やカドミウムが、カリフォルニア州の基準をもとにした上限を超える製品が一定の割合であった。オーガニックでも少ないとは限らない。

日本の製品に当てはまるとは限らないが、毎日たくさん食べない、同じ製品に偏らない。
```
リプライ（自分の投稿に返信）：
```
「ダークチョコの選び方」の記事はこちら → https://moutonarchive.com/dark-chocolate-guide.html?utm_source=x&utm_medium=social&utm_campaign=dark-chocolate-guide&utm_content=reply
```

### CF コーヒーの選び方と淹れ方（coffee-guide）

#### CF-1 ペーパーフィルター
```
同じコーヒーでも、淹れ方でコレステロールへの影響が変わる。

煮出したコーヒーは上げやすく、紙のフィルターで淹れたコーヒーはほとんど上げなかった（メタ解析）。

デカフェの選び方と一緒にまとめた。
```
リプライ（自分の投稿に返信）：
```
「コーヒーの選び方と淹れ方」の記事はこちら → https://moutonarchive.com/coffee-guide.html?utm_source=x&utm_medium=social&utm_campaign=coffee-guide&utm_content=reply
```

#### CF-2 デカフェ
```
デカフェは、カフェインゼロではない。

日本では業界の基準で、カフェインを90%以上取り除いたものが「カフェインレスコーヒー」。たくさん飲めば、そのぶんカフェインもとる。

夜に飲むなら、商品ページで除去率を確かめたい。
```
リプライ（自分の投稿に返信）：
```
「コーヒーの選び方と淹れ方」の記事はこちら → https://moutonarchive.com/coffee-guide.html?utm_source=x&utm_medium=social&utm_campaign=coffee-guide&utm_content=reply
```

#### CF-3 ノルウェーの追跡研究
```
ノルウェーで50万人あまりを平均20年追った研究では、死亡リスクが最も低かったのは、フィルターで淹れたコーヒーを1日1〜4杯飲む人だった。

観察研究なので、淹れ方だけが原因とは言えない。それでも、コレステロールの実験と同じ方向を向いている。
```
リプライ（自分の投稿に返信）：
```
「コーヒーの選び方と淹れ方」の記事はこちら → https://moutonarchive.com/coffee-guide.html?utm_source=x&utm_medium=social&utm_campaign=coffee-guide&utm_content=reply
```

#### CF-4 甘いコーヒー飲料
```
「コーヒーは体に悪くないらしい」を、甘い缶コーヒーにそのまま当てはめていいのか。

研究の結果は、砂糖がたっぷり入った飲料にはそのまま当てはまらない。

毎日飲むなら、原材料の最初に砂糖が来ていないか、糖質の量を見る。
```
リプライ（自分の投稿に返信）：
```
「コーヒーの選び方と淹れ方」の記事はこちら → https://moutonarchive.com/coffee-guide.html?utm_source=x&utm_medium=social&utm_campaign=coffee-guide&utm_content=reply
```

### PT プロテインの選び方（protein-guide）

#### PT-1 効果の大きさ
```
プロテインは「飲めば筋肉がつくもの」ではなかった。

49の試験をまとめると、筋トレと一緒なら効果はある。ただし小さい。そして体重1kgあたり約1.6gを超えると、それ以上は増えにくかった。

まず食事で足りているかを確かめる。
```
リプライ（自分の投稿に返信）：
```
「プロテインの選び方」の記事はこちら → https://moutonarchive.com/protein-guide.html?utm_source=x&utm_medium=social&utm_campaign=protein-guide&utm_content=reply
```

#### PT-2 食事で足りているか
```
プロテインを買う前に、食事で足りているかを見る。

食事摂取基準（2025年版）では、18〜64歳のたんぱく質の推奨量は男性65g、女性50g。

肉、魚、卵、大豆製品、乳製品をふだん食べていれば、食事で満たせることが多い。
```
リプライ（自分の投稿に返信）：
```
「プロテインの選び方」の記事はこちら → https://moutonarchive.com/protein-guide.html?utm_source=x&utm_medium=social&utm_campaign=protein-guide&utm_content=reply
```

#### PT-3 ホエイかソイか
```
ホエイとソイ、どっちがいい？

筋トレと組み合わせた9つの研究のメタ解析では、筋力や除脂肪量の増え方に差は見られなかった。

牛乳でお腹がゆるくなりやすいならソイ。あとは味や溶けやすさ、価格の好みで選んでいい。
```
リプライ（自分の投稿に返信）：
```
「プロテインの選び方」の記事はこちら → https://moutonarchive.com/protein-guide.html?utm_source=x&utm_medium=social&utm_campaign=protein-guide&utm_content=reply
```

#### PT-4 袋の表示
```
プロテインの袋で見るのは4つ。

1回分のたんぱく質量。糖質とエネルギー。原材料（ホエイかソイか、アレルギー）。量と価格。

味付きは糖質が多いこともある。まずは少量で試す。

腎臓の病気がある人は、自己判断で足さず医師に相談を。
```
リプライ（自分の投稿に返信）：
```
「プロテインの選び方」の記事はこちら → https://moutonarchive.com/protein-guide.html?utm_source=x&utm_medium=social&utm_campaign=protein-guide&utm_content=reply
```

### OR 口臭ケアの道具の選び方（oral-care-guide）

#### OR-1 舌ブラシ
```
舌の汚れ、歯ブラシで落としてない？

舌専用のクリーナーのほうが、口臭の原因物質をわずかに多く減らしたというレビューがある。

舌ブラシ、フロス、歯間ブラシ、洗口液。何をどう使うかを研究から整理した。
```
リプライ（自分の投稿に返信）：
```
「口臭ケアの道具の選び方」の記事はこちら → https://moutonarchive.com/oral-care-guide.html?utm_source=x&utm_medium=social&utm_campaign=oral-care-guide&utm_content=reply
```

#### OR-2 フロスか歯間ブラシか
```
フロスと歯間ブラシ、どっち？

35の研究をまとめたコクランレビューでは、歯みがきに足すと歯ぐきの炎症が減る可能性が示され、フロスより歯間ブラシのほうが良い結果だった。ただし確かさは低い。

すき間が狭いならフロス、あるなら歯間ブラシ。
```
リプライ（自分の投稿に返信）：
```
「口臭ケアの道具の選び方」の記事はこちら → https://moutonarchive.com/oral-care-guide.html?utm_source=x&utm_medium=social&utm_campaign=oral-care-guide&utm_content=reply
```

#### OR-3 洗口液
```
洗口液で口臭を消そうとしてない？

洗口液は、においを一時的に抑えるのには役立つ。でも、舌の汚れや歯周病という発生源を取り除くものではない。

舌の清掃と歯間の清掃が先。洗口液は、その補助。
```
リプライ（自分の投稿に返信）：
```
「口臭ケアの道具の選び方」の記事はこちら → https://moutonarchive.com/oral-care-guide.html?utm_source=x&utm_medium=social&utm_campaign=oral-care-guide&utm_content=reply
```

#### OR-4 舌の磨き方
```
舌ブラシは、強くこするほど良いわけではない。

鏡で舌の汚れを確かめて、奥に軽く当てて手前に引く。回数は起床時の1回で十分。やりすぎると粘膜を傷つけるおそれがある。

道具は、舌専用でやわらかいものを。
```
リプライ（自分の投稿に返信）：
```
「口臭ケアの道具の選び方」の記事はこちら → https://moutonarchive.com/oral-care-guide.html?utm_source=x&utm_medium=social&utm_campaign=oral-care-guide&utm_content=reply
```

### DE 制汗剤とデオドラントの選び方（deodorant-guide）

#### DE-1 役割の違い
```
制汗剤とデオドラント、同じだと思ってない？

制汗剤は汗を抑える。デオドラントは菌と匂いを抑える。

パッケージの「有効成分」を見れば、どっちか分かる。アルミニウムの安全性の評価も含めてまとめた。
```
リプライ（自分の投稿に返信）：
```
「制汗剤とデオドラントの選び方」の記事はこちら → https://moutonarchive.com/deodorant-guide.html?utm_source=x&utm_medium=social&utm_campaign=deodorant-guide&utm_content=reply
```

#### DE-2 汗か匂いか
```
脇のケアで最初に決めるのは、「汗」と「匂い」のどっちを抑えたいか。

シャツの脇がぬれるのが気になるなら、汗を抑える成分のあるもの。
汗の量より匂いが気になるなら、菌や匂いを抑える成分のあるもの。

パッケージの「有効成分」で分かる。
```
リプライ（自分の投稿に返信）：
```
「制汗剤とデオドラントの選び方」の記事はこちら → https://moutonarchive.com/deodorant-guide.html?utm_source=x&utm_medium=social&utm_campaign=deodorant-guide&utm_content=reply
```

#### DE-3 アルミニウムの安全性
```
「制汗剤のアルミニウムは危ない」って本当？

欧州の科学委員会（SCCS）は、決められた濃度までなら安全に使えると結論づけた。一方、乳がんとの関係を調べたレビューは、結果が一致せず結論を出せなかった。

気になるなら、アルミニウム不使用のデオドラントもある。
```
リプライ（自分の投稿に返信）：
```
「制汗剤とデオドラントの選び方」の記事はこちら → https://moutonarchive.com/deodorant-guide.html?utm_source=x&utm_medium=social&utm_campaign=deodorant-guide&utm_content=reply
```

#### DE-4 汗が多すぎるとき
```
汗の量が、日常生活に困るほど多い。

それなら、市販品で我慢し続けるより、皮膚科で相談する選択肢がある。

日本皮膚科学会の診療ガイドラインでも、わきの多汗症の治療では、塩化アルミニウムの外用が第一選択として勧められている。
```
リプライ（自分の投稿に返信）：
```
「制汗剤とデオドラントの選び方」の記事はこちら → https://moutonarchive.com/deodorant-guide.html?utm_source=x&utm_medium=social&utm_campaign=deodorant-guide&utm_content=reply
```

### BH 習慣を変えたいときに読む本（books-habits）

#### BH-1 名著の「その後」
```
【PR】自己啓発の名著には、出版後の追試で「思ったより効果が小さい」と分かった話もある。

習慣、意志力、GRIT、マインドセット。6冊を、その後の研究で分かった注意点と一緒に紹介した。
```
リプライ（自分の投稿に返信）：
```
「習慣を変えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-habits.html?utm_source=x&utm_medium=social&utm_campaign=books-habits&utm_content=reply
```

#### BH-2 「21日で身につく」
```
【PR】「習慣は21日で身につく」は、目安にしないほうがいい。

研究では、習慣が自動化するまでの期間は、18日から254日まで幅があった。

『ジェームズ・クリアー式 複利で伸びる1つの習慣』を、この注意点と一緒に紹介した。
```
リプライ（自分の投稿に返信）：
```
「習慣を変えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-habits.html?utm_source=x&utm_medium=social&utm_campaign=books-habits&utm_content=reply
```

#### BH-3 「意志力は使うと減る」
```
【PR】「意志力は使うと減る」。

『スタンフォードの自分を変える教室』でも紹介されているこの研究は、23の研究室での大規模な追試で、効果がほとんど確認されなかった。

読みながら試しやすい本。でも、そこは言い切らずに読みたい。
```
リプライ（自分の投稿に返信）：
```
「習慣を変えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-habits.html?utm_source=x&utm_medium=social&utm_campaign=books-habits&utm_content=reply
```

#### BH-4 「いつ・どこで・何をするか」
```
「いつ・どこで・何をするか」を先に決めておく。

94の研究を集めた分析では、この方法（実行意図）で、目標の達成に中程度から大きい効果が示されていた。

習慣の本6冊を、その後の研究で分かった注意点と一緒にまとめた。
```
リプライ（自分の投稿に返信）：
```
「習慣を変えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-habits.html?utm_source=x&utm_medium=social&utm_campaign=books-habits&utm_content=reply
```

### BC 転職を考えはじめたときに読む本（books-career）

#### BC-1 迷いの段階
```
転職の迷いは、ひとつじゃない。

何をしたいのか。会社をどう見極めるか。年収はどうなるか。この先の人生をどう組み立てるか。

迷っている段階ごとに、1冊ずつ選んだ。
```
リプライ（自分の投稿に返信）：
```
「転職を考えはじめたときに読む本」の記事はこちら → https://moutonarchive.com/books-career.html?utm_source=x&utm_medium=social&utm_campaign=books-career&utm_content=reply
```

#### BC-2 「向かう理由」
```
【PR】転職の理由が「今の会社が嫌だ」だけだと、次の会社でも同じことが起きやすい。

『世界一やさしい「やりたいこと」の見つけ方』は、好きなこと、得意なこと、大事なことを分けて書き出す本。

逃げる理由の先にある「向かう理由」を探すのに使える。
```
リプライ（自分の投稿に返信）：
```
「転職を考えはじめたときに読む本」の記事はこちら → https://moutonarchive.com/books-career.html?utm_source=x&utm_medium=social&utm_campaign=books-career&utm_content=reply
```

#### BC-3 年収の本の読み方
```
【PR】『転職と副業のかけ算』は、著者が転職を重ね、副業と組み合わせて収入を増やしてきた経験の本。

ただ、一人の経験で、誰もが同じ結果になるわけではない。

転職で賃金が増えた人・減った人の公的な統計と合わせて読むと、期待と現実の距離がつかみやすい。
```
リプライ（自分の投稿に返信）：
```
「転職を考えはじめたときに読む本」の記事はこちら → https://moutonarchive.com/books-career.html?utm_source=x&utm_medium=social&utm_campaign=books-career&utm_content=reply
```

#### BC-4 読んだあとに
```
転職の本を読み終えたら、やってほしいことがある。

「なぜ転職したいのか」と「次の職場で大事にしたいこと」を、3行ずつ書く。

本は迷いを言葉にするのを助けてくれる。でも、決めるのは自分だ。段階別に4冊選んだ。
```
リプライ（自分の投稿に返信）：
```
「転職を考えはじめたときに読む本」の記事はこちら → https://moutonarchive.com/books-career.html?utm_source=x&utm_medium=social&utm_campaign=books-career&utm_content=reply
```

### BP 生き方を考えたいときに読む本（books-philosophy）

#### BP-1 ニーチェとフランクル
```
【PR】ニーチェは「意味は与えられない」と言った。フランクルは、どんな状況でも人は意味を見いだしうると考えた。

『ツァラトゥストラ』と『夜と霧』。続けて読むと、問いの両側が見える。

生き方を考えたいときの古典4冊。
```
リプライ（自分の投稿に返信）：
```
「生き方を考えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-philosophy.html?utm_source=x&utm_medium=social&utm_campaign=books-philosophy&utm_content=reply
```

#### BP-2 自由の重さ
```
【PR】人は自由を求める。でも、自由に伴う孤独や不安に耐えられず、自分から手放してしまうことがある。

フロム『自由からの逃走』は、1941年に、その重さを論じた本。

僕が「自由」について書いた記事の問いを、深めるために選んだ。
```
リプライ（自分の投稿に返信）：
```
「生き方を考えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-philosophy.html?utm_source=x&utm_medium=social&utm_campaign=books-philosophy&utm_content=reply
```

#### BP-3 課題の分離
```
【PR】他人がどう評価するかは、自分の課題ではない。

アドラーの考え方を対話で紹介した『嫌われる勇気』の「課題の分離」。

心理学の研究と合わせて見直した記事と一緒に読むと、言い切りすぎない読み方ができると思う。
```
リプライ（自分の投稿に返信）：
```
「生き方を考えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-philosophy.html?utm_source=x&utm_medium=social&utm_campaign=books-philosophy&utm_content=reply
```

#### BP-4 古典の読み方（予備）
```
古典は、一度で分からなくていい。

分からないところは飛ばして、引っかかった一文だけを持ち帰る。その一文が自分の生活のどこに当てはまるかを考えたとき、本ははじめて自分のものになる。

生き方を考えたいときに開いてきた4冊。
```
リプライ（自分の投稿に返信）：
```
「生き方を考えたいときに読む本」の記事はこちら → https://moutonarchive.com/books-philosophy.html?utm_source=x&utm_medium=social&utm_campaign=books-philosophy&utm_content=reply
```

### TR 家庭用ミニトランポリンの選び方（mini-trampoline-guide）

#### TR-1 決める順番
```
家で使うミニトランポリン、何から決める？

置き場所に合う直径。体重に余裕のある耐荷重。音と振動が気になるならゴム式。ふらつきが心配なら手すり付き。

この順に決めていけば、大きく外さない。研究と公的機関の注意喚起をもとに整理した。
```
リプライ（自分の投稿に返信）：
```
「家庭用ミニトランポリンの選び方」の記事はこちら → https://moutonarchive.com/mini-trampoline-guide.html?utm_source=x&utm_medium=social&utm_campaign=mini-trampoline-guide&utm_content=reply
```

#### TR-2 集合住宅と安全
```
集合住宅でミニトランポリンを使うなら。

金属のバネがきしむ音が出ないゴム式を選び、下に防振・防音のマットを敷く。それでも振動はゼロにはならないので、使う時間帯に気を配る。

跳ぶのは1人ずつ。宙返りはしない。
```
リプライ（自分の投稿に返信）：
```
「家庭用ミニトランポリンの選び方」の記事はこちら → https://moutonarchive.com/mini-trampoline-guide.html?utm_source=x&utm_medium=social&utm_campaign=mini-trampoline-guide&utm_content=reply
```

### ES 耳栓とアイマスクの選び方（earplug-eyemask-guide）

#### ES-1 寝室の光
```
寝室の音と光、そのままにしてない？

照明をつけた部屋で眠った晩は、暗い部屋より睡眠中の心拍数が高く、翌朝のインスリン抵抗性が上がっていた実験がある（人数の少ない短期間の実験）。

耳栓とアイマスクの選び方をまとめた。
```
リプライ（自分の投稿に返信）：
```
「耳栓とアイマスクの選び方」の記事はこちら → https://moutonarchive.com/earplug-eyemask-guide.html?utm_source=x&utm_medium=social&utm_campaign=earplug-eyemask-guide&utm_content=reply
```

#### ES-2 耳栓は耳に合うか
```
耳栓は、遮音の数値より「耳に合うか」。

正しく入っていなければ、数値ほど遮音できない。フォームで耳が痛いなら、耳の入口をふさぐシリコンの耳栓もある。

アイマスクは、目を押さない立体型か、鼻の横のすき間を見る。
```
リプライ（自分の投稿に返信）：
```
「耳栓とアイマスクの選び方」の記事はこちら → https://moutonarchive.com/earplug-eyemask-guide.html?utm_source=x&utm_medium=social&utm_campaign=earplug-eyemask-guide&utm_content=reply
```

## 読み物（読者を増やす記事）

選び方の記事へつながる記事（R10〜R14）も足しています。

### R1 日曜の夜が憂うつなのは、なぜか（sunday-blues）
```
月曜より、日曜の夜のほうがつらい。

約34万人の気分を曜日ごとに調べた研究では、「ブルーマンデー」は思われているほど大きくなかった。

つらさの中心は、月曜そのものではなく、月曜を待つ時間なのかもしれない。
```
リプライ（自分の投稿に返信）：
```
「日曜の夜が憂うつなのは、なぜか」の記事はこちら → https://moutonarchive.com/sunday-blues.html?utm_source=x&utm_medium=social&utm_campaign=sunday-blues&utm_content=reply
```

### R2 恐怖の正体は「不快感」かもしれない（fear）
```
怖いと感じたら、まず見分けてみる。

これは本当に危険なのか。それとも、ただ不快なだけなのか。

危険なら守る。不快なだけなら、小さく進む。
```
リプライ（自分の投稿に返信）：
```
「恐怖の正体は「不快感」かもしれない」の記事はこちら → https://moutonarchive.com/fear.html?utm_source=x&utm_medium=social&utm_campaign=fear&utm_content=reply
```

### R3 コーヒーは、本当に体に悪いのか（coffee）
```
コーヒーは体に悪い？いい？

200本以上のメタ解析をまとめた研究では、リスクが最も低かったのは1日3〜4杯あたり。

ただし見落としやすいのが睡眠。寝る6時間前のカフェインでも、眠りが短くなった実験がある。
```
リプライ（自分の投稿に返信）：
```
「コーヒーは、本当に体に悪いのか」の記事はこちら → https://moutonarchive.com/coffee.html?utm_source=x&utm_medium=social&utm_campaign=coffee&utm_content=reply
```

### R4 休日の「寝だめ」で、睡眠不足は取り返せるのか（weekend-sleep）
```
平日5時間、休日に寝だめ。

寿命を追った研究では「埋め合わせ」になっていた。
代謝を調べた実験では「戻らなかった」。

矛盾じゃなくて、見ているものが違う。
```
リプライ（自分の投稿に返信）：
```
「休日の「寝だめ」で、睡眠不足は取り返せるのか」の記事はこちら → https://moutonarchive.com/weekend-sleep.html?utm_source=x&utm_medium=social&utm_campaign=weekend-sleep&utm_content=reply
```

### R5 人と比べるのを、やめることはできるのか（comparison）
```
「人と比べるな」と言われても、比べてしまう。

比べるのは、ものさしがないから。それは人が自分を知るしくみなのかもしれない。

やめるんじゃなくて、比べる相手を選び直す。
```
リプライ（自分の投稿に返信）：
```
「人と比べるのを、やめることはできるのか」の記事はこちら → https://moutonarchive.com/comparison.html?utm_source=x&utm_medium=social&utm_campaign=comparison&utm_content=reply
```

### R6 昼寝は、何分がいいのか（nap）
```
昼寝のあと、かえって頭が重い。

長さを変えて比べた実験では、10分の昼寝で、起きた直後から眠気が減り、作業の成績も良くなった。30分寝ると、起きた直後はかえって悪くなった。

昼寝は、短く切り上げるほうがいい。
```
リプライ（自分の投稿に返信）：
```
「昼寝は、何分がいいのか」の記事はこちら → https://moutonarchive.com/nap.html?utm_source=x&utm_medium=social&utm_campaign=nap&utm_content=reply
```

### R7 SNSを見る時間は、減らしたほうがいいのか（social-media-time）
```
SNSを1日30分に制限した実験では、3週間で孤独感と落ち込みが減った。

Facebookを4週間止めた実験では、幸福感がわずかに上がった。

やめなくていい。でも、見る時間は自分で決めたい。
```
リプライ（自分の投稿に返信）：
```
「SNSを見る時間は、減らしたほうがいいのか」の記事はこちら → https://moutonarchive.com/social-media-time.html?utm_source=x&utm_medium=social&utm_campaign=social-media-time&utm_content=reply
```

### R8 朝型と夜型は、変えられるのか（chronotype）
```
朝が弱いのは、生まれつき？

約70万人の遺伝子研究では、朝型に関わる遺伝子の差で変わる眠る時刻は平均25分ほど。

一方、自然の光だけで1週間キャンプしたら、夜型の人ほど体内時計が早まった。
```
リプライ（自分の投稿に返信）：
```
「朝型と夜型は、変えられるのか」の記事はこちら → https://moutonarchive.com/chronotype.html?utm_source=x&utm_medium=social&utm_campaign=chronotype&utm_content=reply
```

### R9 ブルーライトカットの眼鏡は、目の疲れに効くのか（blue-light）
```
ブルーライトカットの眼鏡で、目の疲れは減る？

ランダム化比較試験をまとめたコクランレビューでは、目の疲れへの短期的な利点はおそらくない、という結論だった。

それより試したいのは、もっと地味な「休憩」。
```
リプライ（自分の投稿に返信）：
```
「ブルーライトカットの眼鏡は、目の疲れに効くのか」の記事はこちら → https://moutonarchive.com/blue-light.html?utm_source=x&utm_medium=social&utm_campaign=blue-light&utm_content=reply
```

### R10 オリーブ油は、本当に体にいいのか（olive-oil）
```
オリーブオイルは「飲めば健康になる魔法の油」ではない。

米国の観察研究では、マーガリンやバター、マヨネーズなど1日5gを同量のオリーブオイルに置き換えると、心血管疾患のリスクが5〜7%低かった。

注目したいのは、油そのものより「置き換え」。
```
リプライ（自分の投稿に返信）：
```
「オリーブ油は、本当に体にいいのか」の記事はこちら → https://moutonarchive.com/olive-oil.html?utm_source=x&utm_medium=social&utm_campaign=olive-oil&utm_content=reply
```

### R11 ダークチョコは、本当に体にいいのか（dark-chocolate）
```
ダークチョコで、血圧は下がる？

35試験をまとめたコクランレビューでは、下がり幅は平均1.76mmHg。血圧が正常な人ではほとんど変わらず、高血圧の人で約4mmHg。

食べるなら、ほかのお菓子の代わりに、少量。
```
リプライ（自分の投稿に返信）：
```
「ダークチョコは、本当に体にいいのか」の記事はこちら → https://moutonarchive.com/dark-chocolate.html?utm_source=x&utm_medium=social&utm_campaign=dark-chocolate&utm_content=reply
```

### R12 口臭の多くは「胃」ではなく、口の中から生まれる（halitosis）
```
口臭が気になると、胃を疑いたくなる。

でも、口臭外来を受診した2,000人の分析では、76%は口の中に原因があり、その多くに舌の汚れか歯周病が関わっていた。耳鼻科や口の外の原因は4%。

まず見るのは、舌と歯ぐきと口の乾き。
```
リプライ（自分の投稿に返信）：
```
「口臭の多くは「胃」ではなく、口の中から生まれる」の記事はこちら → https://moutonarchive.com/halitosis.html?utm_source=x&utm_medium=social&utm_campaign=halitosis&utm_content=reply
```

### R13 匂いケアは「脇と足の裏」から（odor-care）
```
自分の匂いは、自分では分かりにくい。

人の嗅覚には、同じ匂いを嗅ぎ続けると感じにくくなる「順応」がある。

それに脇の匂いは、汗そのものではなく、皮膚の菌が分解してできる。脇と足では、原因も対策も違う。
```
リプライ（自分の投稿に返信）：
```
「匂いケアは「脇と足の裏」から」の記事はこちら → https://moutonarchive.com/odor-care.html?utm_source=x&utm_medium=social&utm_campaign=odor-care&utm_content=reply
```

### R14 転職で、年収は上がるのか（salary-change）
```
転職で、年収は上がるのか。

2024年に転職した人のうち、賃金が増えた人は40.5%、減った人は29.4%（厚生労働省の雇用動向調査）。

上がる人は増えている。でも全員ではない。残業代が減った分だけ下がった、というケースもある。
```
リプライ（自分の投稿に返信）：
```
「転職で、年収は上がるのか」の記事はこちら → https://moutonarchive.com/salary-change.html?utm_source=x&utm_medium=social&utm_campaign=salary-change&utm_content=reply
```

### R15 神は死んだ。それでも、なぜ生きるのか。（nietzsche）
```
「神は死んだ」は、「神なんて存在しない」という意味だけではない。

生きる理由を教えてくれた大きな何かを、信じられなくなったらどうするのか。

意味が最初から決められていないなら、自分でつくる余地がある。僕はまだ答えを持っていない。
```
リプライ（自分の投稿に返信）：
```
「神は死んだ。それでも、なぜ生きるのか。」の記事はこちら → https://moutonarchive.com/nietzsche.html?utm_source=x&utm_medium=social&utm_campaign=nietzsche&utm_content=reply
```

## 順番表（10/7〜10/31）

- 朝は 7〜8時ごろ、夜は 21〜22時ごろが目安（時間はオーナーの都合で動かしてよい）
- 50枠のうち、選び方の記事が37枠（74%）、その他の記事が13枠（26%）。10/7 に、新しい選び方2本（TR-1・ES-1）を読み物の2枠（R12・R1）と差し替えた。R12・R1 は予備
- 朝は食事・体の「選び方」、夜は本の「選び方」か読み物。同じ記事の案は5日以上あけています
- 「メモ」欄は投稿の型（本文リンク／リプリンク）。10/12〜10/18 は朝を本文リンク、夜をリプリンクにして、インプレッションとリンクのクリック数を比べる。ほかに本文リンクにするのは、新しい選び方記事の告知（10/9 夜 TR-1、10/11 夜 ES-1）だけ
- 投稿したら「投稿」に ✓。気づいたこと（インプレッション・リンクのクリック数など）は、型のあとに続けてメモへ

| 日付 | 枠 | 案 | 種類 | 記事 | 投稿 | メモ |
|---|---|---|---|---|---|---|
| 10/7（水） | 朝 | OL-1 | 選び方 | オリーブオイルの選び方 | ✓ | 本文リンク（旧型） |
| 10/7（水） | 夜 | R3 | 読み物 | コーヒーは、本当に体に悪いのか | ✓ | 本文リンク（旧型） |
| 10/8（木） | 朝 | CH-1 | 選び方 | ダークチョコの選び方 |  | リプリンク |
| 10/8（木） | 夜 | BH-1 | 選び方 | 習慣を変えたいときに読む本 |  | リプリンク |
| 10/9（金） | 朝 | OR-1 | 選び方 | 口臭ケアの道具の選び方 |  | リプリンク |
| 10/9（金） | 夜 | TR-1 | 選び方 | 家庭用ミニトランポリンの選び方 |  | 本文リンク |
| 10/10（土） | 朝 | CF-1 | 選び方 | コーヒーの選び方と淹れ方 |  | リプリンク |
| 10/10（土） | 夜 | BC-1 | 選び方 | 転職を考えはじめたときに読む本 |  | リプリンク |
| 10/11（日） | 朝 | DE-1 | 選び方 | 制汗剤とデオドラントの選び方 |  | リプリンク |
| 10/11（日） | 夜 | ES-1 | 選び方 | 耳栓とアイマスクの選び方 |  | 本文リンク |
| 10/12（月） | 朝 | PT-1 | 選び方 | プロテインの選び方 |  | 本文リンク |
| 10/12（月） | 夜 | R6 | 読み物 | 昼寝は、何分がいいのか |  | リプリンク |
| 10/13（火） | 朝 | OL-2 | 選び方 | オリーブオイルの選び方 |  | 本文リンク |
| 10/13（火） | 夜 | BP-1 | 選び方 | 生き方を考えたいときに読む本 |  | リプリンク |
| 10/14（水） | 朝 | CH-2 | 選び方 | ダークチョコの選び方 |  | 本文リンク |
| 10/14（水） | 夜 | R10 | 読み物 | オリーブ油は、本当に体にいいのか |  | リプリンク |
| 10/15（木） | 朝 | OR-2 | 選び方 | 口臭ケアの道具の選び方 |  | 本文リンク |
| 10/15（木） | 夜 | BH-2 | 選び方 | 習慣を変えたいときに読む本 |  | リプリンク |
| 10/16（金） | 朝 | CF-2 | 選び方 | コーヒーの選び方と淹れ方 |  | 本文リンク |
| 10/16（金） | 夜 | R7 | 読み物 | SNSを見る時間は、減らしたほうがいいのか |  | リプリンク |
| 10/17（土） | 朝 | DE-2 | 選び方 | 制汗剤とデオドラントの選び方 |  | 本文リンク |
| 10/17（土） | 夜 | R13 | 読み物 | 匂いケアは「脇と足の裏」から |  | リプリンク |
| 10/18（日） | 朝 | PT-2 | 選び方 | プロテインの選び方 |  | 本文リンク |
| 10/18（日） | 夜 | BC-2 | 選び方 | 転職を考えはじめたときに読む本 |  | リプリンク |
| 10/19（月） | 朝 | OL-3 | 選び方 | オリーブオイルの選び方 |  | リプリンク |
| 10/19（月） | 夜 | R14 | 読み物 | 転職で、年収は上がるのか |  | リプリンク |
| 10/20（火） | 朝 | CH-3 | 選び方 | ダークチョコの選び方 |  | リプリンク |
| 10/20（火） | 夜 | BP-2 | 選び方 | 生き方を考えたいときに読む本 |  | リプリンク |
| 10/21（水） | 朝 | OR-3 | 選び方 | 口臭ケアの道具の選び方 |  | リプリンク |
| 10/21（水） | 夜 | R11 | 読み物 | ダークチョコは、本当に体にいいのか |  | リプリンク |
| 10/22（木） | 朝 | CF-3 | 選び方 | コーヒーの選び方と淹れ方 |  | リプリンク |
| 10/22（木） | 夜 | R4 | 読み物 | 休日の「寝だめ」で、睡眠不足は取り返せるのか |  | リプリンク |
| 10/23（金） | 朝 | DE-3 | 選び方 | 制汗剤とデオドラントの選び方 |  | リプリンク |
| 10/23（金） | 夜 | BH-3 | 選び方 | 習慣を変えたいときに読む本 |  | リプリンク |
| 10/24（土） | 朝 | PT-3 | 選び方 | プロテインの選び方 |  | リプリンク |
| 10/24（土） | 夜 | R8 | 読み物 | 朝型と夜型は、変えられるのか |  | リプリンク |
| 10/25（日） | 朝 | OL-4 | 選び方 | オリーブオイルの選び方 |  | リプリンク |
| 10/25（日） | 夜 | BC-3 | 選び方 | 転職を考えはじめたときに読む本 |  | リプリンク |
| 10/26（月） | 朝 | CH-4 | 選び方 | ダークチョコの選び方 |  | リプリンク |
| 10/26（月） | 夜 | R9 | 読み物 | ブルーライトカットの眼鏡は、目の疲れに効くのか |  | リプリンク |
| 10/27（火） | 朝 | OR-4 | 選び方 | 口臭ケアの道具の選び方 |  | リプリンク |
| 10/27（火） | 夜 | R5 | 読み物 | 人と比べるのを、やめることはできるのか |  | リプリンク |
| 10/28（水） | 朝 | CF-4 | 選び方 | コーヒーの選び方と淹れ方 |  | リプリンク |
| 10/28（水） | 夜 | BP-3 | 選び方 | 生き方を考えたいときに読む本 |  | リプリンク |
| 10/29（木） | 朝 | DE-4 | 選び方 | 制汗剤とデオドラントの選び方 |  | リプリンク |
| 10/29（木） | 夜 | R2 | 読み物 | 恐怖の正体は「不快感」かもしれない |  | リプリンク |
| 10/30（金） | 朝 | PT-4 | 選び方 | プロテインの選び方 |  | リプリンク |
| 10/30（金） | 夜 | BH-4 | 選び方 | 習慣を変えたいときに読む本 |  | リプリンク |
| 10/31（土） | 朝 | BC-4 | 選び方 | 転職を考えはじめたときに読む本 |  | リプリンク |
| 10/31（土） | 夜 | R15 | 読み物 | 神は死んだ。それでも、なぜ生きるのか。 |  | リプリンク |

## 測り方（10月末に見る）

- GA4：レポート → 集客 → トラフィック獲得で「セッションのソース / メディア」が `x / social` の行。「セッションのキャンペーン」で記事ごとに分かれる
- X：各投稿のアナリティクスで「リンクのクリック数」をメモ欄へ
- Amazon・楽天のレポートで売れた日と、その前後の投稿を照らし合わせる
