# 01-research：人の目が気になる。「何からの自由か」ではなく「何のための自由か」（ニーチェ『ツァラトゥストラ』第1部「創造者の道」）（slug: others-eyes）

作成：note-researcher／2026-10-18

> **最初に読んでほしい注意（確認の程度について）**
> 今回の環境では、WebFetch（ページを開く）が **DNS の名前解決で失敗**した（americanliterature.com、www.projekt-gutenberg.org の2件。どちらも `getaddrinfo ENOTFOUND`）。指示どおり2回で打ち切り、迂回はしていない。
> 代わりに WebSearch（standard と extended）を使った。今回の検索結果は、ページ本文を**要約して返す**ことが多く、逐語の抜粋が出たのは一部だけだった。下の「分かっていること」で原文・訳文を「」や引用で書いたものは、**検索結果に逐語で出た文言**か、こちらが引用符つきで検索した文言について「その文言がページにある」と返ってきたものに限った。**ページそのものは一つも開けていない**。
> 参考文献には「確認の程度」を付けた（先週の `note/cannot-decide/01-research.md` と同じ記号）。
> - ◎：抄録または本文の文言を検索結果で読み、書誌（著者・年・誌名・巻号・頁）まで一致を確かめた
> - ○：書誌は確認できたが、本文・抄録の文言は読めていない（または一部だけ）
> - △：二次資料（解説ブログ・報道・まとめ）でしか見ていない。本文には使わない
>
> **note-writer はこの材料で下書きを書いてよい。note-editor は公開前に、本文で使った出典の URL を人が開いて、数字と文言を照合すること。** △ の数字・文言は本文に入れない。

---

## テーマと想定読者

- テーマ：人の目が気になる（有料の3本のうち、ニーチェの悩み）。「周りは、自分が思うほど厳しく見ていない」と知っても気にするのは止まらなかった、そこから「何からの自由か」ではなく「何のための自由か」へ
- 想定読者：20〜30代。転職・独立・人間関係の岐路にいて、「どう思われるか」で選んでしまう一人。飲み会や会議で言った一言を帰りの電車で何度も再生する／書いた投稿を下書きに戻す／「転職したい」と言ったらどう思われるかを先に考えて黙る
- この note の役割：サイトの無料の入門記事 `nietzsche.html`（竜「汝なすべし」）へ、読者を自然につなぐ。有料記事 `paid-nietzsche.html` は販売準備中なので、「近く、このサイトで PDF にする」までにとどめ、値段・購入の案内は書かない
- 入門記事・有料記事とは別の角度で書く：**研究（他人の目の見積もり違い）→ 知っても止まらなかった（本人）→ 『ツァラトゥストラ』第1部「創造者の道」の「何からの自由か。何のための自由か」**。入門記事は「すべき」の声の正体、有料記事は三つの変化・君自身であれ・永劫回帰。この note は「自由のその先」を問う
- 文体：常体、一人称は「僕」。命令・断定・結果の約束・あおりをしない。手順・ワーク・「今日やること」を渡さず、考える材料と、最後に答えを書かない問いを一つ置いて終える（`docs/content-quality.md`）
- サイトへのリンク（note から）
  - つなぎ先（1本に決める）：`https://moutonarchive.com/nietzsche.html?utm_source=note&utm_medium=referral&utm_campaign=others-eyes`
  - スポットライト効果を渡す先（使うなら）：`https://moutonarchive.com/absorption-freedom-action.html?utm_source=note&utm_medium=referral&utm_campaign=others-eyes`（「他人の評価からの自由」の節は `#section-2`）
  - どちらも `src/_data/currentArticles.js` にある残す記事。アーカイブの記事（`boundaries`・`disliked-priority`・`narcissism-art`・`books-philosophy` など）には案内しない
- 「広告を含みます」の一行について（人が確認）：リンク先2本にアフィリエイトはない（front matter に `affiliate` なし、`category` は philosophy）。ただし **AdSense のコードは全ページで読み込まれている**（`src/_includes/base.njk` 104〜107行目、「AdSense の審査と自動広告のため全ページで読み込む」）。記事末尾の広告枠は `src/_data/site.js` の `adsenseSlot: ''` なので出ない。**AdSense の自動広告が有効なら、リンク先に広告が出うる**。CLAUDE.md の「広告のある記事へリンクするときは冒頭に『広告を含みます』」に当たるかは、オーナーが AdSense の自動広告の設定を見て決める（先週の `cannot-decide` は「広告はない」として一行を入れていない。同じ判断でよいかもあわせて確認）

## 読者の疑問（5 個）

1. 帰りの電車で何度も再生しているあの一言を、相手はどれくらい覚えていて、どれくらい厳しく見ているのか
2. 「気にしすぎ」だと頭では分かっているのに、なぜ止まらないのか。研究を知れば止まるのか
3. 「転職したい」「本当はこうしたい」と、弱いところや本音を見せたら、どう思われるのか
4. 人の目を気にしないようにしたら、わがままな人・空気の読めない人にならないか（→ 有料記事の FAQ「人の意見を無視するようになりませんか？」と重なる。note では深追いしない）
5. 人の目から自由になれたとして、そのあと何をしたいのか分からない。何のために自由になりたいのか（→ 記事は答えを書かず、問いで終える。何を試すかは読者が決める）

## 分かっていること

### A. ニーチェ『ツァラトゥストラ』第1部「創造者の道」（Vom Wege des Schaffenden）

**書誌と場所**

- 『ツァラトゥストラはこう語った』第1部（Also sprach Zarathustra. Ein Buch für Alle und Keinen. [Erster Theil]）、Chemnitz: Ernst Schmeitzner、1883年。「ツァラトゥストラの説教（Die Reden Zarathustras）」の中の一章「Vom Wege des Schaffenden」[1]
  - 初版の翻刻（Deutsches Textarchiv）では、章の見出しが初版の **87頁**（画像93枚目、表示は [87/0093]）にある。「Frei nennst du dich?」の段は画像94枚目（印刷の頁番号は確認できなかった。93枚目が87頁なので88頁と推定）[1]
  - Zeno.org の本文は Schlechta 版（Werke in drei Bänden, München 1954）第2巻 S. 325–328 による [1]
  - 第1部の中では「隣人愛」（岩波は「隣人への愛」）の次、「老いた女と若い女」の前。岩波・光文社・講談社の目次で同じ並び [5][6][7]。Common の英訳では第1部の **XVII**（17番目）。ドイツ語のサイトには「18」と数えるものもある（序説の数え方の違い）[2]
- 注意：検索の要約の中に、「Frei wovon? … frei wozu?」を「三つの変化」（獅子の場面）の言葉だと説明したものがあった。**誤り**。出典は第1部「創造者の道」。ネットに混同した説明があるので、本文の出典表記で章名を必ず書く

**原文（検索結果で逐語に確かめた文。綴りは版で違う：初版・Gutenberg は Heerde／giebt／Werth、Zeno.org・textlog は Herde／gibt／Wert）** [1]

- 冒頭：「Willst du, mein Bruder, in die Vereinsamung gehn? Willst du den Weg zu dir selber suchen? Zaudere noch ein wenig und höre mich.」（兄弟よ、君は孤独の中へ行こうというのか。自分自身への道を探そうというのか。もう少しだけためらって、私の話を聞いてくれ。——仮訳）◎
- 「„Wer sucht, der geht leicht selber verloren. Alle Vereinsamung ist Schuld“: also spricht die Heerde.」（「探す者は、自分を見失いやすい。孤独になることは、すべて罪だ」と、群れは言う。——仮訳）◎
  - このあとに「君は長く群れに属していた」という文がある（英訳の検索結果で確認。ドイツ語の文言は未確認）○
- 「Die Stimme der Herde wird auch in dir noch tönen.」（群れの声は、君の中でもまだ鳴りつづけるだろう。——仮訳）◎（textlog は Herde、Gutenberg は Heerde）
  - 続けて、君が「ich habe nicht mehr Ein Gewissen mit euch」（私はもう、おまえたちと一つの良心を持っていない）と言うとき、それは嘆きと痛みになるだろう、とある。「nicht mehr Ein Gewissen mit euch」は◎、「嘆きと痛み」の部分のドイツ語の文言は要約でしか見ていない ○
- **中心の段**（文ごとに、確かめた版の綴りで）：
  - 「Frei nennst du dich? Deinen herrschenden Gedanken will ich hören und nicht, daß du einem Joche entronnen bist.」◎（Zeno.org）
  - 「Bist du ein solcher, der einem Joche entrinnen durfte?」◎（textlog、現代の綴り）
  - 「Es giebt Manchen, der seinen letzten Werth wegwarf, als er seine Dienstbarkeit wegwarf.」◎（Gutenberg、古い綴り）
  - 「Frei wovon? Was schiert das Zarathustra! Hell aber soll mir dein Auge künden: frei wozu?」◎（Gutenberg ほか。「Was schiert das Zarathustra」の後の記号は「!」で照合したが、版ごとの句読点の揺れは確かめていない。Zeno.org の検索結果では wozu が強調されて表示されたが、原文の隔字体かどうかは未確認）
  - 仮訳（記事で使うなら「（要約・僕の訳）」と添える）：「自由だと、君は言うのか。君を支配している考えを聞かせてほしい。くびきから逃れた、という話ではなく。／君は、くびきから逃れることを許された者なのか。自分の隷属を投げ捨てたとき、自分の最後の価値まで投げ捨ててしまった者もいる。／何からの自由か。そんなことはツァラトゥストラの知ったことではない。だが、君の目は、はっきりと私に告げてほしい。何のための自由かを。」
- 「Kannst du dir selber dein Böses und dein Gutes geben und deinen Willen über dich aufhängen wie ein Gesetz? Kannst du dir selber Richter sein und Rächer deines Gesetzes?」（君は、自分の悪と善を自分に与え、自分の意志を法のように自分の上に掲げられるか。自分の法の裁き手となり、報復者となれるか。——仮訳）◎（textlog）
  - 続けて「Furchtbar ist das Alleinsein …」で始まる文（自分の法の裁き手・報復者と二人きりでいるのは恐ろしい、という趣旨）がある ○（文の後半の文言は未照合）
- 「… um so kleiner sieht dich das Auge des Neides. Am meisten aber wird der Fliegende gehasst.」（〔高く昇るほど〕妬みの目には君が小さく見える。いちばん憎まれるのは、飛ぶ者だ。——仮訳）◎（Zeno.org、LingQ。gehasst／gehaßt の綴りの違いあり。前半の「je höher du steigst」の部分は未照合）
- 「Aber der schlimmste Feind, dem du begegnen kannst, wirst du immer dir selber sein; du selber lauerst dir auf in Höhlen und Wäldern.」（だが、君が出会いうる最悪の敵は、いつも君自身だろう。君は洞窟や森で、自分を待ち伏せている。——仮訳）◎（aphorismen.de ほか）。直後に「Einsamer, du gehst den Weg zu dir selber!」（孤独な者よ、君は自分自身への道を行く）、さらに「Ketzer wirst du dir selber sein …」（君は自分自身にとって異端者になるだろう……）、「Verbrennen musst du dich wollen in deiner eignen Flamme」（自分の炎で自分を焼こうとしなければならない）と続く ◎（同じ抜粋）

**英訳**

- Thomas Common 訳（1909年。Standard Ebooks・Project Gutenberg #1998。章名「XVII. The Way of the Creating One」）[2]：
  > Free, dost thou call thyself? Thy ruling thought would I hear of, and not that thou hast escaped from a yoke. Art thou one ENTITLED to escape from a yoke? Many a one hath cast away his final worth when he hath cast away his servitude. Free from what? What doth that matter to Zarathustra! Clearly, however, shall thine eye show unto me: free FOR WHAT?

  ◎（各文を別々の検索結果で照合。段落としての通しは未照合）。ほかに「The voice of the herd will still echo in thee」「I have no longer a conscience in common with you」「But the worst enemy thou canst meet, wilt thou thyself always be; thou waylayest thyself in caverns and forests.」◎
- Walter Kaufmann 訳（*The Portable Nietzsche*, Viking, 1954 所収）[3]：Wikiquote は第1部第17章を「On the Way of the Creator」とし、「Free *from* what? … free *for* what?」を載せている。「Free from what? As if that mattered to Zarathustra! But your eyes should tell me brightly: free for what?」と「The voice of the herd will still be audible in you.」の文言は複数のページで一致したが、**Kaufmann 訳であることは確認できなかった** △。*The Portable Nietzsche* の書誌（Viking Portable Library 1954、Penguin 版あり）は ○
- Adrian Del Caro 訳（Cambridge University Press, 2006。Del Caro & Pippin 編、Cambridge Texts in the History of Philosophy）[4]：書誌のみ ○。この章の訳文は確認できなかった（公開されている抜粋は第1部の冒頭まで）

**邦訳での章の題**

| 訳 | 章の題 | 確認 |
|---|---|---|
| 氷上英廣訳『ツァラトゥストラはこう言った（上）』岩波文庫（青639-2）、1967年 [5] | 「創造者の道」（国立国会図書館の書誌で p103） | ◎（目次） |
| 森一郎訳『ツァラトゥストラはこう言った』講談社学術文庫、2023年 [7] | 「創造者の道」（第一部の目次で「隣人愛」の次） | ◎（目次） |
| 丘沢静也訳『ツァラトゥストラ（上）』光文社古典新訳文庫、2010年11月 [6] | 「創造する者の道について」（「隣人愛について」の次） | ◎（目次） |
| 手塚富雄訳『ツァラトゥストラ』中公文庫 [8] | 「創造者の道」。この章の要旨として「何からの自由か」ではなく「何を目ざしての自由か」と書く解説あり | △（個人ブログの記載のみ） |
| 佐々木中訳『ツァラトゥストラかく語りき』河出文庫、2015年8月6日 [9] | 確認できなかった（公開の目次は「三つの変化について」などの抜粋だけ） | ○（書誌のみ） |

- サイトの表記に合わせるなら、出典は「『ツァラトゥストラはこう語った』第1部「創造者の道」（Vom Wege des Schaffenden）」。入門記事の参考文献（「三つの変化」（Von den drei Verwandlungen））と同じ書き方にそろう。訳文は特定の邦訳から写さず、「（要約・僕の訳）」とする（どの邦訳の文言も、今回は確認していない）

**章の流れ（確かめた範囲）と、「人の目」に当てる読み方は原文を歪めないか**

- 流れ：孤独の中へ自分への道を探しに行こうとする「兄弟」への語りかけ → 群れは「孤独はすべて罪だ」と言う → 群れの声は君の中でまだ鳴る、離れると言えば嘆きと痛みになる → 自由だと言うのか、くびきから逃れたことより君を支配している考えを聞きたい、何からの自由かはどうでもいい、何のための自由か → 自分の善悪を自分で決め、自分の法の裁き手になれるか → 妬みの目、飛ぶ者は憎まれる → 最悪の敵は君自身 → 孤独な者よ、君は自分への道を行く [1][2]（LitCharts などの学習ガイドも、この章を「何からの自由より、何のための自由が大事」「自分で善悪を決める」と要約している △。章の終わり近くに「自分を越えて創造しようとして滅びる者」を語る一節がある、とする解説もある △）
- **歪めない読み方**：
  - 原文の「群れ（Herde）」は、みんなで共有している価値・良心（Gewissen）のこと。「どう見られるか」の不安そのものではないが、**「みんなの物差しの声が、離れたあとも自分の中で鳴る」**と読むのは文脈の内側にある。入門記事 `nietzsche.html` の読み方（自分の声に聞こえる「すべき」は、誰かの物差しが張りついたもの）とも合う。ただし「人の目」に当てるのは**ムートンの読み替え**だと一言添える
  - 「何からの自由か。そんなことはどうでもいい」とツァラトゥストラ自身が言っている。だから**「人の目から自由になろう」で終える記事は、この章の向きと逆**。事業部長の案（人の目から自由になることより、その自由で何をしたいかへ）は、原文の向きに沿っている
  - 「Hell aber soll mir dein Auge künden」（君の目が、はっきり告げてほしい）の「目」を、「人の目」から「自分の目」への言葉遊びに使うのは、原文にある語なので成り立つ。ただし原文は「目」の対比をしていない。使うなら僕の読み方として
- **歪める読み方（避ける）**：
  - ニーチェは「周りは思うほど厳しくない」とは言っていない。むしろ**妬まれる、飛ぶ者は憎まれる**と書いている。研究（日常の小さな失敗・会話）とニーチェ（みんなと違う道を行くとき）は扱う場面が違う。ニーチェを研究の裏づけに使わない。誠実に書くなら「ニーチェは、周りが優しいとは言っていない」と一文添える
  - 「隷属を投げ捨てたとき、最後の価値まで投げ捨てた者もいる」「くびきから逃れることを許された者なのか」は試しの問いで、励ましではない。「辞めればいい」とも「あなたには資格がない」とも読めないように書く
  - 「群れ」をムートンの地の文で人を指す言葉に使わない（見下し・「私たち対あいつら」になる。BRAND「信者をつくらない」「目立ち方」）。引用の中だけにする
  - 「最悪の敵は君自身」は、「悪いのは自分だ」と自分を責める方向（BRAND の「取り入れないこと」：うまくいかないのは全部自分のせい／自己嫌悪を燃料にする）に読まれやすい。使うなら「いちばん厳しい目は、外より内にあった」という見え方として
  - 同じ章の「自分の炎で自分を焼こうとしなければならない」や、滅びる者を語る一節は、自分を追い込む・退路を断つ（取り入れないこと）に読まれやすい。使わない
- **有料記事を先取りしないために**：「何からの自由／何のための自由」を、「三つの変化」の獅子（自由を勝ちとる）と子ども（新しく創る）に結びつけて説明しない。三つの変化は有料記事の中心（`paid-nietzsche.html` の `learn`「駱駝・獅子・子ども：竜から静かに降りる」）。入門記事も「竜の前に立つのは獅子で、物語はその先へ続いていく」で止めている。また「孤独はすべて罪だ」と群れは言う、の一文は、有料の「なぜ、人の目はこんなに重いのか」（有料本文は『悦ばしき知識』第117節などを使っている。中身はこのリサーチでは確かめていない）と重なる可能性があるので、使っても一文にとどめる

### B. 「他人は、自分が思うほど厳しく見ていない」の研究（抄録で確かめた範囲）

**B1. 失敗のあと、思っているほど厳しくは見られていない**

- Savitsky, Epley & Gilovich（2001）は4つの研究で、いくつかの社会的な失敗をしたと想像した人（研究1）、人前で知的な失敗をした人（研究2・3）、恥ずかしい形で紹介された人（研究4）が、**実際よりも厳しく評価されると予想していた**ことを示した。著者はこの過大な不安を、本人が**自分の失敗に過度に注意を向け**、その結果、**見ている側の印象をやわらげる状況の要因を考えに入れない**ことで説明している [10] ◎（抄録）。本文ではこれを「焦点化の錯覚（focusing illusion）」とも呼んでいる ○（本文の要約による）
  - 対象の大学・人数、効果の大きさは抄録では確認できなかった
  - 使い方：この note の研究の柱。「帰りの電車で再生している一言」に直接当たる。「相手は覚えていない」とまでは言っていない（「厳しさの見積もり」の研究）。言い過ぎない
- Epley, Savitsky & Gilovich（2002）は、失敗した本人は、見ている側が**本人の立場に身を置いて、厳しい推論をやわらげる**ことを考えに入れていない（empathy neglect）と論じた [20] ◎（抄録の要旨）。B1 の「なぜ」の補足に一文なら使える

**B2. 緊張や気持ちは、思っているほど外から見えていない（透明性の錯覚）**

- Gilovich, Savitsky & Medvec（1998）は、自分の内側の状態が実際以上に他人に見えていると思いこむ傾向を「透明性の錯覚」と呼んだ。うそをついた人は、うそが見抜かれる程度を高く見積もり（研究1a〜1c）、まずい飲み物を飲んだ人は嫌悪が顔に出ている程度を高く見積もった（研究2a・2b）。研究3a・3b は緊急事態で人が動かない理由への含意。説明は、自分の感じ方を起点（係留）にして、他人の視点への調整が足りないこと [11] ◎（著者の並びは索引によって Gilovich, Medvec, Savitsky の順もある）
- **日本の大学生での追試**：
  - 鎌田晶子（2007）は Gilovich ら（1998）の研究2の手続き（飲み物の味）に基づく3つの実験で、日本人でも透明性の錯覚が起きることを確かめた（研究1a n=45、研究1b は対面の条件を加えて n=46）。研究2（n=116）では本人の主観的な衝撃の強さを操作し、衝撃の強さが錯覚の量に影響する傾向を示し、係留と調整の説明を支持した [18] ◎（抄録）
  - 遠藤由美（2007）「自己紹介場面での緊張と透明性錯覚」は、人前で話したときに緊張の強かった人ほど、その緊張が聞き手に見えている程度を実際より大きく見積もったと報告（研究1）。研究2は特性としての社会不安に広げ、研究3は結果を再現し、動機づけによる説明を退けた [19] ◎（CiNii の英文抄録の要旨。和文の抄録は読めていない）
  - 使い方：会議や飲み会の一言、自己紹介の場面に近い。読者が日本の20〜30代なので、「日本の大学生でも確かめられている」は一文で効く。ただし「社会不安」の語は病気の枠に読まれやすいので、本文では使わない

**B3. 会話のあと、相手は思っているより自分を好いていた（ライキング・ギャップ）**

- Boothby, Cooney, Sandstrom & Clark（2018）は、会話のあと、人は**相手が自分をどれだけ好いているか、一緒にいて楽しんだかを、系統的に低く見積もる**ことを示し、これを「好かれ度の見積もり違い（liking gap）」と呼んだ。実験室で知り合う知らない人どうし、大学1年生の寮の同室者、自己啓発のワークショップに来た一般の人で見られ、会話の長さを変えても続き、寮の同室者では**新しい関係ができていく数か月のあいだ続いた** [12] ◎（抄録）
  - 理由について：著者側の要約では、人は自分の会話の出来を厳しく見すぎる、好意のサインは会話の中に出ているのに自分の考えに気をとられて気づかない、とされる ○（抄録の文言では確かめていない）
  - 研究の数、会話の時間（「2〜45分」などの数字）、ワークショップの国・人数は確認できなかった。本文に書かない
  - 使い方：「帰りの電車で再生する」に、B1 とは別の角度（厳しさではなく、好かれ度）から当たる。「何か月一緒に暮らしても続いた」は、**経験を重ねても、この見積もり違いはすぐには消えない**、という本人の欄への橋渡しに使える（ただし「研究を知っても止まらない」ことを示した研究ではない。混同しない）

**B4. 広がりと限界**

- **グループとチーム**：Mastroianni, Cooney, Boothby & Reece（2021）は、小さなグループでの会話（研究1）、一緒にプロジェクトに取り組む工学のチーム（研究2）、働く大人（研究3）で見積もり違いを確かめた。**対等な間柄でいちばん大きく**、自分が与えた印象の**悪い面に目を向ける程度**が一部を決めていた。チームの意思疎通、効力感、仕事の満足といった結果とも結びついていた [13] ◎（抄録・ハイライト）
  - 使い方：「会議の一言」に当たる。一文で足りる
- **子ども**：Wolf, Nafe & Tomasello（2021）は、米国の4〜11歳の子ども241人で、この見積もり違いが5歳ごろに現れ、年齢とともに広がると報告。子どもが他人からの評価を気にし始める時期と重なる、と著者は結びつけている [14] ◎（抄録の要旨）。note では使わなくてよい（読者の関心から遠い）
- **別の研究者による広がり**：Zheng, Trofimovich, Lindberg, McDonough & Sato（2024）は、知り合いでない大学生58人が母語話者と第二言語話者のペアで10分間の学術的な話し合いをしたあと、**どちらの話し手も、相手からの好かれ度・話す力・やりとりの振る舞いの評価を低く見積もった**と報告 [15] ◎（抄録。雑誌名は Cambridge のファイル名から *Studies in Second Language Acquisition* と推定、未確認）
- **独立した追試・メタ分析**：好かれ度の見積もり違いについて、元の研究グループ以外の大規模な追試や、効果をまとめたメタ分析は、検索では**見つからなかった**（ないとは言えない）。スポットライト効果も、大規模な追試は見つからなかった
- **人によって差がある**：元の研究の一つの標本では、内気さの低い参加者には見積もり違いが見られなかった、という記述がある [25] △（Wikipedia の要約。原論文で未確認。本文に使わない。書くなら「人によって差があるらしい」程度）
- **弱みを見せたとき**：Bruk, Scholl & Bless（2018）は7つの研究で、気持ちを打ち明ける、体の不完全さを見せる、助けを求めるといった「弱さを見せる」場面を、**自分がするときは他人がするときより否定的に評価する**ことを示し（「美しい混乱効果（beautiful mess effect）」）、自分の場面は具体的に、他人の場面は抽象的に思い描くこと（解釈レベル）で説明した [21] ◎（抄録の要旨。研究の数を6とする二次資料あり。対象の多くがドイツの大学生で、書かれた場面を使った、という限界の指摘は △）
  - 使い方：「転職したい、と言ったらどう思われるか」に近い。ただし「打ち明ければ好かれる」と約束に読ませない
- **立場によっては逆になる**：Gibson, Harari & Marr（2018）は3つの実験室実験で、**立場が上の同僚**が弱みを打ち明けると、受け手から見たその人の地位が下がり、影響力が減り、仕事上の対立が増え、関係の質が下がったが、**対等な同僚**ではそうならなかったと報告 [22] ◎（抄録の要旨。参加者の数は二次資料で「667人」と「762人」に割れる △。使わない）
  - 使い方：「周りは厳しくない」は、いつ・誰に対しても成り立つわけではない、の材料。誠実さのために一文入れる価値がある
- **害のある失敗は別**：Göksel, Sezer & Berman（2026）は、事前登録した6つの研究（N = 3,204）で、他人への害がほとんどない失敗のあとに**自分を笑う人**は、恥ずかしがる人より温かく、有能で、本物らしく見られたと報告。APA の発表では、他人への害が大きいほど、その利点は弱まるとしている [23] ◎（抄録）。ただし「笑えばいい」という手順に転びやすいので、**本文では使わない**（使うなら「研究が扱っているのは、害のない小さな失敗だ」という限界の確認として）
- **対象の偏り**：B1〜B3 の主な研究は米国の大学生・実験室の場面・知らない人どうしの会話が中心。日本では透明性の錯覚の追試がある（B2）が、B1（厳しさの見積もり）と B3（好かれ度）の日本での追試は見つからなかった

**B5. 知れば、楽になるのか（本人の欄の手前に置く材料）**

- Savitsky & Gilovich（2003）は、人前で話す人が、自分の緊張が聞き手に気づかれている程度を高く見積もること（研究1）、そして**透明性の錯覚について知らされた話し手は、本人の評価でも、見ていた人の評価でも、スピーチの出来が良かった**こと（研究2）を報告した。著者はスピーチの不安やほかの社会的な不安への応用を論じている [16] ◎（抄録の要旨）。「不安が減った」「落ち着いて見えた」という細部は二次資料 △
  - **大事**：この研究があるので、「知っても意味がない」とは書けない。「研究では、知ることが助けになった場面もある。それでも僕の場合は……」と、**本人の経験として**書く
- MacInnis, MacKinnon & MacIntyre（2010）は、人前のスピーチで透明性の錯覚を支持する結果を得たが、一部の参加者（36%）は聞き手が自分を実際より不安そうだと評価すると考えていて、著者はこれを「人前で話すのは誰でも不安なものだ」という社会的な筋書きに従った結果だと考えた（研究2の調査で、ほとんど誰もが強い不安を感じると人々が思っていることを示した）[17] ◎（ERIC の抄録）。**数字は解釈が込み入るので本文に使わない**。「錯覚の出方には個人差がある」の裏づけ程度
- 「スポットライト効果を知ったら、日常の気にしすぎが減った」ことを直接調べた研究は、**見つからなかった**

**B6. スポットライト効果（サイトの記事に書いてある表現だけを使う）**

- `absorption-freedom-action.html` の「他人の評価からの自由」の節：「コーネル大学のギロビッチたちは、学生に目立つTシャツを着てもらい、ほかの学生がいる部屋に入ってもらった。着た本人は、部屋のおよそ半分の人が気づいたと予想した。実際に気づいていたのは、4分の1ほどだった。人は、自分がどれだけ見られているかを、実際よりかなり大きく見積もる。研究者はこれを「スポットライト効果」と呼んだ。」[24]
- note では、数字は **「およそ半分」「4分の1ほど」** だけを使い、詳しくは同記事へリンクで渡す（検索の二次資料には 46%・23% などの数字があるが、サイトの表現にそろえる）。中央の一文「思っているほど、見られていない。」は同記事の `.identity` にあるので、note で同じ一文を中央に置かない
- X の順番表でも AF-2（10/18 昼）でこの研究を使っている（`promo/x-posts.md` 1110行目）

### C. 日本の公的な統計

- **確認できなかった。使わない**。候補として、こども家庭庁（もと内閣府）「こども・若者の意識と生活に関する調査（令和4年度）」の15〜39歳対象の報告書に「他者との関わり方」の章があること、内閣府「我が国と諸外国の若者の意識に関する調査（平成30年度）」（13〜29歳、7か国）があることまでは検索で分かったが、「人の目が気になる」「どう思われているか気になる」に当たる項目と数字は、一次資料の検索結果で確かめられなかった

### D. サイトですでに書いてあること（重複を避ける）

- 入門記事 `nietzsche.html`：日曜の夜・会議の無難な答え・「普通は、そうすべきだから」の場面。『悦ばしき知識』第125節「神は死んだ」（1882）。ニーチェの経歴（1844年、牧師の家、24歳でバーゼル大学の教授、34歳で辞職、評価の外で書く）。第1部「三つの変化」の竜「汝なすべし」（要約・僕の訳）。読み方＝自分の声に聞こえる「すべき」の多くは、誰かの物差しが鱗になって張りついたもの。終わり近く＝「竜の名前が分かっただけでは、竜はいなくならない」「竜の前に立つのは獅子で、物語はその先へ」。最後の問い＝「いまあなたの中で鳴っている「すべき」は、誰の声だろう」
- 有料記事 `paid-nietzsche.html`（販売準備中、`checkoutUrl` 空）：無料の見本＝投稿を送信の手前で消す・求人を見て親の顔・会議で意見を飲みこむ／気になっているのは「目」ではなく「物差し」／外の物差しは一本ではない／ニーチェの経歴（父の死、ボン大学で神学をやめる、『悲劇の誕生』とヴィラモーヴィッツ、1879年に辞職、シルス・マリア、第4部の私家版）／『この人を見よ』序言第1節「私を取り違えないでくれ」／『反時代的考察』第3篇第1節（慣習と意見の陰、臆病より怠惰、「君自身であれ」）／「他人の物差しは、楽なのだ」。有料本文＝三つの変化、永劫回帰、『悦ばしき知識』第117・270・341節、序説第5節。目次語＝「竜の名前は「汝なすべし」」「なぜ、人の目はこんなに重いのか」「自分の物差しは、もう手の中にある」「誰も見ていない場所で、もう一度選びたいか」「今日からの使い方」。FAQ＝人の声は「情報」、物差しは自分のもの
- 3つの姿勢 `absorption-freedom-action.html`：「人の目が気になるのは、性格が弱いからではない」、スポットライト効果（B6）、「人の目を消すことはできなくても、『思っているほど見られていない』と知ることはできる」、問い＝「誰にも評価されないとしたら、あなたは何を選びたいだろう」、`nietzsche.html` へのリンク
- **note が新しく出せるもの**：第1部「創造者の道」（サイトのどこにもまだない）の「群れの声は君の中でまだ鳴る」と「何からの自由か。何のための自由か」／失敗の厳しさの見積もり違い（Savitsky 2001）／好かれ度の見積もり違い（Boothby 2018、Mastroianni 2021）／日本の大学生での透明性の錯覚（鎌田 2007、遠藤 2007）／知らされると話がうまくなった実験（Savitsky & Gilovich 2003）／立場が上だと弱みの開示が裏目に出る（Gibson 2018）／そして、知っても止まらなかったムートン自身の経験
- **最後の問いの重なりに注意**：absorption の「誰にも評価されないとしたら、何を選びたいだろう」、有料の目次「誰も見ていない場所で、もう一度選びたいか」、入門記事の「その『すべき』は、誰の声だろう」と、**同じ問いにしない**。「何のための自由か」は、評価がない場面を想像させる問いではなく、**自由の使い道**を聞く問いとして立てる（下の案A の例）

## まだ分かっていないこと・意見が分かれていること

- **効果の大きさと対象の詳細**：B1〜B3 のどれも、効果の大きさ・参加者の数・大学名を抄録で確かめられなかった。本文では「〜という研究がある」「〜の場面で」と条件を添え、数字を足さない
- **どこまで一般化できるか**：主な研究は米国の大学生・実験室・知らない人どうし。日本での追試は透明性の錯覚（B2）にはあるが、厳しさの見積もり（B1）と好かれ度（B3）には見つからなかった。好かれ度の見積もり違いの独立した追試・メタ分析も見つからなかった
- **いつも成り立つわけではない**：対等な間柄でいちばん大きい（[13]）、立場が上の人が弱みを見せると評価が下がった実験がある（[22]）、害のある失敗は別（[23]）、人によって差があるらしい（[17]、[25] △）。いじめ・ハラスメントのように実際に厳しく扱われている状況には、この研究は当てはまらない（有料記事の「向かない人」にも同じ配慮がある）
- **知れば楽になるのか**：知らされた話し手のスピーチが良くなった実験はある（[16]）。一方、日常の「気にしすぎ」が、スポットライト効果などを知ることで減るかを調べた研究は見つからなかった。「知っても止まらなかった」はムートンの経験として書き、一般論にしない
- **ニーチェの読み方**：この章の「群れ」は共有された道徳・良心の話で、「人の目」に当てるのは読み替え。また、ツァラトゥストラは「離れれば妬まれ、憎まれる」とも書いていて、研究の「思っているほど厳しくない」とは向きが逆の箇所がある。扱う場面（日常の小さな失敗／みんなと違う道を行くこと）が違うと考えるのが誠実。学術的な解釈（「許された者なのか」をどう読むか、など）は、学習ガイド以外の資料を確認できなかった
- **原典の細部**：「Was schiert das Zarathustra」の後の記号、初版での頁（88頁か）、Kaufmann 訳・Del Caro 訳の文言、手塚訳・佐々木訳の章の題は確認できなかった

## 記事の切り口の候補

### 案A（推薦）：思っているほど見られていない。それでも、声は鳴りつづけた——「何のための自由か」

- 流れ：
  1. 場面（1〜3段落）：帰りの電車で、会議で言った一言を何度も再生する。家に着いて、書いた投稿を下書きに戻す。「転職したい」は、まだ誰にも言っていない
  2. 太字の問い（例）：「あの一言を、相手はいまも覚えているだろうか。」
  3. 研究（柱は2本）：失敗のあと、人は実際より厳しく評価されると予想していた。自分の失敗に目が行きすぎて、見ている側がくみとる事情を考えに入れないから [10]。会話のあと、相手は思っているより自分を好いていた。寮の同室者では何か月も続いた [12]（会議・チームでも、対等な間柄でいちばん大きい [13] は一文）。日本の大学生でも、緊張が見えていると思いすぎる傾向が確かめられている [19]（一文）。スポットライト効果はサイトの記事へリンクで渡す [24]
  4. 限界を一段落：研究の多くは大学生・実験室。立場が上の人が弱みを見せると裏目に出た実験もある [22]。「誰に対しても、いつも」ではない
  5. **ムートン本人が書く欄**：知っても、止まらなかった。研究では知ることが助けになった場面もある [16]。それでも僕の場合は……【本人が書く：知ったあと、何が変わり、何が変わらなかったか】
  6. ニーチェ（橋）：「群れの声は、君の中でもまだ鳴りつづけるだろう」[1]。外の目は思っているほど厳しくなかった。鳴っていたのは、内側に残った声だった（読み替えと明記）。その声の正体は入門記事へ（「すべき」の竜。リンク1本）
  7. ニーチェ（中心）：「自由だと、君は言うのか。……何からの自由か。そんなことはどうでもいい。……何のための自由か」（第1部「創造者の道」、要約・僕の訳）[1][2]。くびきから逃れたことより、君を支配している考えを聞きたい
  8. 僕の読み方：人の目から自由になることを、いつのまにか目標にしていた。でもそれは「何からの自由」だった。中央の一文（例：「何から自由になりたいかは、すぐ言えた。何のための自由かは、言えなかった。」——本人の実感と合うか要確認）
  9. 別の角度：ニーチェは「周りは優しい」とは言っていない。妬まれることもあると書いている。研究が扱うのは日常の小さな失敗で、みんなと違う道を行くことではない（誠実さのための一段落）
  10. 最後の問い一つ（例）：「何から自由になりたいかは、言えるかもしれない。では、何のために自由になりたいのだろう。」（答えを書かない。「人の目が気にならなくなった日に、何をするか」のような、評価がない場面を想像させる形は absorption の問いと重なるので避ける）
  11. 参考 → 「人の物差しから降りて、自分の物差しで選ぶところまでは、近く、このサイトで PDF にする」程度の一文 → リンク
- 推薦する理由：事業部長の案の骨組みを保ったまま、「知っても止まらない」と「自由のその先」のあいだに、原文にある「群れの声は、君の中でまだ鳴る」を橋として置ける。研究（外の目）→ ニーチェ（内の声）→ 問い（自由の使い道）と、角度が一つずつずれていくので、広く浅く並べた感じにならない。第1部「創造者の道」はサイトのどこにもまだなく、note だけの言葉になる。入門記事の終わり（「竜の前に立つのは獅子で、物語はその先へ」「代わりに何を置くのか」）と同じ方向を向いているので、リンク先へ自然に渡せる
- 注意：「知っても止まらなかった」は本人の経験。研究 [16] と矛盾しない書き方にする。研究を「だから気にしなくていい」に使わない。「人の目から自由になれる」と約束しない

### 案B：群れの声は、まだ鳴る——知っても止まらない理由から入る

- 流れ：場面 → 「気にしすぎだと分かっているのに、なぜ止まらないのか」→ ニーチェ「群れの声は君の中でまだ鳴る」「離れると言えば、嘆きと痛みになる」を先に置く → 研究（外の目は思うほど厳しくない [10][12]）で「鳴っているのは外ではなく内」を確かめる → 最悪の敵は君自身（扱いに注意）→ 本人の欄 → 問い
- 良い点：「知っても止まらない」に、原文が直接答えている。文学的で note の読者に届きやすい
- 弱い点：入門記事（「すべき」は自分の声のふりをした誰かの物差し）とほぼ同じ角度になる。群れ・孤独・良心の話を厚くすると、有料の「なぜ、人の目はこんなに重いのか」（『悦ばしき知識』第117節ほか）を先取りするおそれ。「何のための自由か」まで届かず、入門記事の言い換えで終わりやすい

### 案C：自由だと、君は言うのか——転職・独立の岐路で

- 流れ：会社を辞めたい・独立したい、「くびきから逃れたい」夜 → ツァラトゥストラ「くびきから逃れた話ではなく、君を支配している考えを聞きたい」「隷属を投げ捨てたとき、最後の価値まで投げ捨てた者もいる」→ 何のための自由か → 研究は最小限 → 問い
- 良い点：想定読者（転職・独立の岐路）の場面にまっすぐ当たる
- 弱い点：「辞める前に目的を持て」という説教、あるいは「辞めるな」という警告に読まれやすい（命令・断定に近づく）。「人の目」の研究の出番が減り、テーマ（人の目が気になる）からずれる。キルケゴールの「決められない」と悩みが混ざる

**推薦：案A**。案B の「群れの声」は案A の6に一文だけ入れる。案C の「隷属を投げ捨てたとき、最後の価値まで」は、使うなら案A の7で原文の続きとして一文だけ（励ましにも脅しにも読めない置き方で）。

### 書き手への注意（本文で気をつけること）

- 研究は「〜という研究がある」「〜の場面では」と条件を添える。「人は誰でも〜」「必ず〜」と一般化しない。数字は上の ◎ の表現どおり（スポットライト効果は「およそ半分」「4分の1ほど」だけ）
- 研究を「だから気にしなくていい」「人の目から自由になれる」という約束に使わない。「〜という見方を手元に置ける」
- ニーチェの訳文は「（要約・僕の訳）」とし、出典は「『ツァラトゥストラはこう語った』第1部「創造者の道」（Vom Wege des Schaffenden）」。「三つの変化」の獅子・子どもと結びつけない（有料の中身）
- 「群れ」は引用の中だけ。ムートンの地の文で人を「群れ」と呼ばない
- 有料の目次語（「竜の名前は『汝なすべし』」「なぜ、人の目はこんなに重いのか」「自分の物差しは、もう手の中にある」「誰も見ていない場所で、もう一度選びたいか」）を見出しや本文に使わない。「物差し」という語自体は入門記事でも使っているので使ってよい
- 最後の問いは一つ。absorption・有料・入門記事の問いと同じにしない（D の末尾）
- 「社会不安」「反すう」など臨床の言葉で読者を名づけない（事後の反すう＝post-event processing は社交不安症の研究の概念。使わない）
- 値段・購入の案内は書かない。「近く、このサイトで PDF にする」まで

### ムートン本人が書く欄（本人にしか書けないので空けておく）

下書きではこの欄を `【本人が書く：〇〇】` の形で空けておき、note-writer は埋めない。本人が書くときの手がかり（答える義務はない）：

- 帰りの電車で何度も再生した一言（いつ・どんな場で・何を言ったか。差し支えない範囲で）。翌日、相手はそれを覚えていたか。確かめたか、確かめなかったか
- 「思っているほど見られていない」（スポットライト効果）を知ったのはいつか。知ったあと、何が変わって、何が変わらなかったか。変わらなかったなら、そのまま
- 下書きに戻した投稿、言わずにおいた「転職したい」。そのとき頭に浮かんだのは誰の顔だったか（運用の文書 `docs/operations-20261018.md` では X の投稿はまだ 0 本となっている。人の目と関係があるかは本人にしか分からないので、関係がなければ触れない）
- 「何から自由になりたいか」は言えるか。「何のために」と聞かれたら、いま何と答えるか。答えられないなら、答えられないと書いてよい
- それでも出した一つ（出した投稿、言った一言）があれば、そのあと何が起きたか。何も起きなかったことも含めて
- 読者に向けては書かない。自分に起きたことだけを書く（「だから〜するといい」で締めない。手順にしない）

## サイト内の関連記事

| ファイル | 役割 | そこで使っている出典・言葉 | この note との関係 |
|---|---|---|---|
| `/home/user/mouton-site/src/articles/nietzsche.html` | 無料の入門記事（残す記事） | 『悦ばしき知識』第125節（1882）、『ツァラトゥストラ』第1部「三つの変化」（1883、竜「汝なすべし」、要約・僕の訳）。最後の問い「いまあなたの中で鳴っている『すべき』は、誰の声だろう」 | **note のつなぎ先**。竜の場面を長く再引用しない。問いを重ねない |
| `/home/user/mouton-site/src/articles/paid-nietzsche.html` | 有料記事の販売ページ（販売準備中） | 無料部分：『この人を見よ』序言第1節、『反時代的考察』第3篇第1節「君自身であれ」、経歴。有料本文：三つの変化、永劫回帰、『悦ばしき知識』第117・270・341節、序説第5節。目次語・FAQ は D に | 値段・購入案内は書かない。目次の中身・三つの変化を先に書かない |
| `/home/user/mouton-site/src/articles/absorption-freedom-action.html` | 3つの姿勢（残す記事） | Gilovich, Medvec & Savitsky（2000）スポットライト効果（およそ半分→4分の1ほど）。中央の一文「思っているほど、見られていない。」。問い「誰にも評価されないとしたら、あなたは何を選びたいだろう」 | スポットライト効果はここへリンクで渡す。中央の一文・問いを重ねない |
| `/home/user/mouton-site/src/articles/kierkegaard.html`・`paid-kierkegaard.html` | 決められない（キルケゴール） | 自由のめまい | 「決められない」をこの note に混ぜない（転職の場面でも、悩みは「人の目」に絞る） |
| `/home/user/mouton-site/src/articles/boundaries.html`・`disliked-priority.html`・`narcissism-art.html`・`books-philosophy.html` | アーカイブ | カントの尊厳と境界線、『嫌われる勇気』、初対面で好かれるナルシシスト、本棚（丘沢静也訳『ツァラトゥストラ』、フロム『自由からの逃走』） | 案内しない。内容の重複だけ避ける（フロムの「〜からの自由／〜への自由」に話を広げない） |
| `/home/user/mouton-site/promo/x-posts.md` | X の順番表 | NI-2（竜「汝なすべし」）、AF-2（スポットライト効果） | 告知（`05-sns.md`）で同じ言葉を重ねない |
| `/home/user/mouton-site/note/cannot-decide/01-research.md`・`04-review.md` | 先週の1本目 | 確認の程度の印、本人が書く欄、`【要確認】` は参考文献の中だけ | 同じ形にそろえた |
| `/home/user/mouton-site/docs/content-quality.md` | 品質基準 | 命令・断定・約束の禁止、最後に問い一つ、出典の書き方 | 下書き・チェックの物差し |

## 参考文献

番号は上の [n] に対応（note の本文で使うときは、使ったものだけを初出順に振り直す）。「確認」欄は冒頭の注意の記号（◎／○／△）。URL はいずれも**今回は開けていない**（検索結果に出たもの）。

1. Nietzsche, F. (1883). *Also sprach Zarathustra. Ein Buch für Alle und Keinen.* [Erster Theil]. Chemnitz: Ernst Schmeitzner. 「Vom Wege des Schaffenden」（第1部「創造者の道」）. 初版の翻刻：Deutsches Textarchiv https://www.deutschestextarchiv.de/book/view/nietzsche_zarathustra01_1883?p=93 （章の見出し、87頁）・?p=94（「Frei nennst du dich?」の段）. 本文：Zeno.org（Werke in drei Bänden, München 1954, Bd. 2, S. 325–328）http://www.zeno.org/Philosophie/M/Nietzsche,+Friedrich/Also+sprach+Zarathustra/Die+Reden+Zarathustras/Vom+Wege+des+Schaffenden ／textlog https://www.textlog.de/nietzsche/schriften/zarathustra/vom-wege-des-schaffenden ／Project Gutenberg #7205 https://www.gutenberg.org/files/7205/7205-h/7205-h.htm 　確認：◎（A に引いた文言。初版での頁は 87 のみ確認、句読点の揺れは未確認）
2. Nietzsche, F. *Thus Spake Zarathustra: A Book for All and None*, trans. T. Common (1909). "XVII. The Way of the Creating One". Standard Ebooks https://standardebooks.org/ebooks/friedrich-nietzsche/thus-spake-zarathustra/thomas-common/text/chapter-17 ／Project Gutenberg #1998 https://gutenberg.org/files/1998/1998-h/1998-h.htm 　確認：◎（A に引いた各文）
3. Nietzsche, F. *Thus Spoke Zarathustra*, trans. W. Kaufmann. In *The Portable Nietzsche*. New York: Viking, 1954（Penguin 版あり）. 章名「On the Way of the Creator」は Wikiquote https://en.wikiquote.org/wiki/Thus_Spoke_Zarathustra の記載. 確認：書誌は ○、章の訳文が Kaufmann 訳であることは未確認 △
4. Nietzsche, F. *Thus Spoke Zarathustra: A Book for All and None*, ed. A. Del Caro & R. Pippin, trans. A. Del Caro. Cambridge University Press, 2006（Cambridge Texts in the History of Philosophy）. https://cambridge.org/highereducation/isbn/9780511812095 　確認：○（書誌のみ。この章の訳文は未確認）
5. ニーチェ（氷上英廣訳）『ツァラトゥストラはこう言った（上）』岩波文庫（青639-2）、岩波書店、1967年. 「創造者の道」p103（国立国会図書館の書誌）. https://www.iwanami.co.jp/book/b246790.html ／https://mina.ndl.go.jp/en/books/R100000039-I2983132 　確認：◎（目次と頁）。ISBN 9784003363928 は紀伊國屋・楽天の URL と Amazon の書名（dp/4003363922）で一致を見たが、ページは開けていない（本文に ISBN を書くなら人が出版社か Amazon のページを開いて確かめる）
6. ニーチェ（丘沢静也訳）『ツァラトゥストラ（上）』光文社古典新訳文庫、光文社、2010年11月. 「創造する者の道について」. https://www.kotensinyaku.jp/books/book116/ 　確認：◎（目次。検索結果の要約による）。ISBN 9784334752170（サイトのアーカイブ記事 `books-philosophy.html` は ASIN 4334752179 を使っている。今回は出版社・Amazon のページを開けていない）
7. ニーチェ（森一郎訳）『ツァラトゥストラはこう言った』講談社学術文庫、講談社、2023年（発売日 2023/06/12 は書店の記載）. 「創造者の道」. https://www.kodansha.co.jp/book/products/0000378667 ／目次 https://www.kinokuniya.co.jp/f/dsg-08-EK-1479229 　確認：◎（目次）。ISBN は未確認
8. ニーチェ（手塚富雄訳）『ツァラトゥストラ』中公文庫、中央公論新社（2018年5月の版あり）. https://www.chuko.co.jp/bunko/2018/05/206593.html 　章の題「創造者の道」と「何を目ざしての自由か」は個人ブログ（https://ameblo.jp/a6web/entry-12730718357.html ）の記載. 確認：書誌は ○、章の題・訳文は △
9. ニーチェ（佐々木中訳）『ツァラトゥストラかく語りき』河出文庫、河出書房新社、2015年8月6日、568頁、ISBN 978-4-309-46412-1. https://www.kawade.co.jp/np/isbn/9784309464121/ 　確認：○（出版社ページの書誌。章の題は確認できなかった）
10. Savitsky, K., Epley, N., & Gilovich, T. (2001). Do others judge us as harshly as we think? Overestimating the impact of our failures, shortcomings, and mishaps. *Journal of Personality and Social Psychology*, 81(1), 44–56. DOI 10.1037/0022-3514.81.1.44. https://pubmed.ncbi.nlm.nih.gov/11474724/ （全文 PDF：https://cdn.prod.website-files.com/5c484e0f4aa6f839dc553c45/5c818f250431906545090748_SavitskyEpleyGilovich2001.pdf ）　確認：◎（抄録）
11. Gilovich, T., Savitsky, K., & Medvec, V. H. (1998). The illusion of transparency: Biased assessments of others' ability to read one's emotional states. *Journal of Personality and Social Psychology*, 75(2), 332–346. https://www.semanticscholar.org/paper/The-illusion-of-transparency:-biased-assessments-of-Gilovich-Savitsky/2435f6ac54022415a841f12040f74393ef054f7b 　確認：◎（抄録の要旨。著者の並びは索引で揺れる）
12. Boothby, E. J., Cooney, G., Sandstrom, G. M., & Clark, M. S. (2018). The liking gap in conversations: Do people like us more than we think? *Psychological Science*, 29(11), 1742–1756. DOI 10.1177/0956797618783714. https://pubmed.ncbi.nlm.nih.gov/30183512/ （全文 PDF：https://clarkrelationshiplab.yale.edu/sites/default/files/files/BoothbyCooneySandstromClark2018.pdf ）　確認：◎（抄録。理由の説明は ○）
13. Mastroianni, A. M., Cooney, G., Boothby, E. J., & Reece, A. G. (2021). The liking gap in groups and teams. *Organizational Behavior and Human Decision Processes*, 162, 109–122. DOI 10.1016/j.obhdp.2020.10.013. https://ideas.repec.org/a/eee/jobhdp/v162y2021icp109-122.html ／https://www.sciencedirect.com/science/article/abs/pii/S074959782030399X 　確認：◎（抄録・ハイライト）
14. Wolf, W., Nafe, A., & Tomasello, M. (2021). The development of the liking gap: Children older than 5 years think that partners evaluate them less positively than they evaluate their partners. *Psychological Science*, 32(5), 789–798. https://scholars.duke.edu/publication/1481249 ／https://www.psychologicalscience.org/journals/psychological-science/0956797620980754/ 　確認：◎（抄録の要旨：N = 241 の米国の子ども、4〜11歳。副題の後半の文言は照合していない）
15. Zheng, C., Trofimovich, P., Lindberg, R., McDonough, K., & Sato, M. (2024). Do they like me? Exploring the role of metaperception in L1–L2 speaker interaction. Cambridge University Press（*Studies in Second Language Acquisition* と推定）. https://core-cms.cambridgecore.org/core/services/aop-cambridge-core/content/view/B18E5818E800E27BF72D33B5FD2BB77A/S0272263124000469a.pdf/do-they-like-me-exploring-the-role-of-metaperception-in-l1-l2-speaker-interaction.pdf 　確認：◎（抄録）。雑誌名・巻号は未確認
16. Savitsky, K., & Gilovich, T. (2003). The illusion of transparency and the alleviation of speech anxiety. *Journal of Experimental Social Psychology*, 39(6), 618–625. DOI 10.1016/S0022-1031(03)00056-8. https://www.sciencedirect.com/science/article/abs/pii/S0022103103000568 　確認：◎（抄録の要旨。「不安が減った」などの細部は △）
17. MacInnis, C. C., MacKinnon, S. P., & MacIntyre, P. D. (2010). The illusion of transparency and normative beliefs about anxiety during public speaking. *Current Research in Social Psychology*, 15(4), 42–52. https://eric.ed.gov/?id=EJ899041 ／https://crisp.org.uiowa.edu/sites/crisp.org.uiowa.edu/files/2020-04/15.4.pdf 　確認：◎（ERIC の抄録）
18. 鎌田晶子（2007）. 透明性の錯覚：日本人における錯覚の生起と係留の効果. 『実験社会心理学研究』46(1), 78–89. DOI 10.2130/jjesp.46.78. https://www.jstage.jst.go.jp/article/jjesp/46/1/46_1_78/_article/-char/ja/ 　確認：◎（抄録）
19. 遠藤由美（2007）. 自己紹介場面での緊張と透明性錯覚. 『実験社会心理学研究』46(1), 53–62. https://www.jstage.jst.go.jp/article/jjesp/46/1/46_1_53/_pdf ／英文抄録 https://cir.nii.ac.jp/crid/1390282679293651456 　確認：◎（CiNii の英文抄録の要旨。和文の抄録・DOI は未確認）
20. Epley, N., Savitsky, K., & Gilovich, T. (2002). Empathy neglect: Reconciling the spotlight effect and the correspondence bias. *Journal of Personality and Social Psychology*, 83(2), 300–312. DOI 10.1037/0022-3514.83.2.300. https://pubmed.ncbi.nlm.nih.gov/12150229/ 　確認：◎（抄録の要旨）
21. Bruk, A., Scholl, S. G., & Bless, H. (2018). Beautiful mess effect: Self–other differences in evaluation of showing vulnerability. *Journal of Personality and Social Psychology*, 115(2), 192–205. https://www.semanticscholar.org/paper/Beautiful-Mess-Effect:-Self%E2%80%93Other-Differences-in-of-Bruk-Scholl/cfbaaa8e5d1d3e4319437eeb2a117d2efafb8784 　確認：◎（抄録の要旨。限界の指摘は △）
22. Gibson, K. R., Harari, D., & Marr, J. C. (2018). When sharing hurts: How and why self-disclosing weakness undermines the task-oriented relationships of higher status disclosers. *Organizational Behavior and Human Decision Processes*, 144, 25–43. DOI 10.1016/j.obhdp.2017.09.001. https://ideas.repec.org/a/eee/jobhdp/v144y2018icp25-43.html ／全文 PDF https://faculty.wharton.upenn.edu/wp-content/uploads/2019/10/when_sharing_hurts.pdf 　確認：◎（題名と抄録の要旨。参加者の数は二次資料で割れる △）
23. Göksel, S., Sezer, Ö., & Berman, J. (2026). Transcending embarrassment: On the reputational benefits of laughing at yourself. *Journal of Personality and Social Psychology*, 130(6), 1078–1101. DOI 10.1037/pspa0000477. https://www.apa.org/pubs/journals/releases/psp-pspa0000477.pdf ／APA の発表 https://www.apa.org/news/press/releases/2026/02/laughter-beats-embarrassment 　確認：◎（抄録）
24. Gilovich, T., Medvec, V. H., & Savitsky, K. (2000). The spotlight effect in social judgment: An egocentric bias in estimates of the salience of one's own actions and appearance. *Journal of Personality and Social Psychology*, 78(2), 211–222. 　確認：○（サイトの記事 `absorption-freedom-action.html` の参考文献6と本文に依拠。今回は抄録を読み直していない。数字はサイトの表現だけを使う）
25. Wikipedia "Liking gap" https://en.wikipedia.org/wiki/Liking_gap （内気さの低い参加者には見積もり違いがなかった、という記述）　確認：△（本文に使わない）

### 今回、使わないもの・タイトルだけ見て載せなかったもの

- Brooks, A. W., Gino, F., & Schweitzer, M. (2015). Smart people ask for (my) advice: Seeking advice boosts perceptions of competence. *Management Science*, 61(6), 1421–1435.——「相談すると有能に見える」は「転職したいと相談する」場面に合うが、共著者 Gino 氏の論文には2023年以降データの問題で撤回を求められたものがあり、この論文のデータの扱いは確認できなかった（共著者たちの Many Co-Authors の一覧で、この論文の個別の記載は見られなかった）。**根拠に使わない**
- Brozovich, F., & Heimberg, R. G. (2008). An analysis of post-event processing in social anxiety disorder. *Clinical Psychology Review*, 28, 891–903.——「出来事のあとで頭の中で何度も再生する」に当たる臨床の概念（事後の反すう）。書誌のみ確認、抄録は読めていない。読者を病気の枠に入れることになるので使わない
- Trofimovich ほか（2023, *Languages*）の第二言語の会話での見積もり違い（「約14ポイント」は報道の数字 △）、2024年の *Frontiers in Communication* のベトナム語の継承話者の研究——抄録を読めていない
- 子どもの研究の続き（中国とオランダの4〜17歳で7〜8歳から、という記述）——学生の論文で、査読誌で確認できない
- 『悦ばしき知識』第117節の文言——有料記事が使っているので確認を試みたが、検索で原文を確かめられなかった。note では使わない
- フロム『自由からの逃走』の「〜からの自由／〜への自由」——話が広がる。サイトではアーカイブの本棚記事にしかない
- スポットライト効果の二次資料の数字（46%・23%・20% など）——サイトの表現（およそ半分・4分の1ほど）にそろえる

商品・ASP リンク：この note では提案しない（哲学の有料記事はサイトで販売する方針。販売準備中のため案内も書かない）。邦訳を紹介するなら、ISBN・ASIN は人が出版社か Amazon のページを開いて確かめてから。
