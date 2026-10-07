# 01-research：年収が一定額を超えると幸福は頭打ち、は本当か（slug: income-happiness）

作成：note-researcher／2026-10-07

> **最初に読んでほしい注意（重要）**
> 今回のリサーチ環境では、Web ページの取得（WebFetch）が**ネットワークのポリシー（egress proxy）で拒否**された。確認したドメイン：www.pnas.org、pubmed.ncbi.nlm.nih.gov、pmc.ncbi.nlm.nih.gov、www.princeton.edu、behavioralpolicy.princeton.edu、andrewmbailey.com、sciencedaily.com、www.cao.go.jp、www5.cao.go.jp。ポリシーによる拒否なので迂回はしていない。
> Web 検索（結果一覧と要約）は使えたが、**原典を開いて中身を確かめた外部資料は一つもない**。ルールに従い、このファイルには**外部資料の数字（年収の金額、サンプル数、割合など）を一つも載せていない**。
> 指示どおり、**材料はサイト内の記事とその参考文献に限定**し、**外部資料は未確認**と明記する。サイト記事の参考文献も、今回あらためて原典を開いたわけではない（サイト掲載済みであることだけを根拠にしている）。
> 本来のテーマ（Kahneman & Deaton 2010 → Killingsworth 2021 → 2023 の共同研究、内閣府の調査）で書くには、**人が下の「確認待ちの一次資料」を開いて数字を写す**か、ネットワークを使える環境でやり直す必要がある。

---

## テーマと想定読者

- テーマ：「年収が一定額を超えると幸福は頭打ち」という通説は本当か。お金の使い方と幸福の関係も含む
- 柱：お金
- 想定読者：20〜40代。年収を上げるために転職や副業を考えているが、「上げても幸せになれないのでは」「どこまで稼げば十分なのか」と迷っている人
- 文体：常体、一人称「僕」（指定どおり。サイトの work カテゴリーの最近の記事とも一致）
- 最後に案内するサイト記事：`salary-change.html`（後述の「サイト内の関連記事」参照）

## 読者の疑問（5 個）

1. 「年収○○万円を超えると幸福度は上がらない」という話は、本当なのか。どこから出てきた話なのか
2. もし頭打ちが本当なら、年収を上げるための転職や頑張りは意味がないのか
3. 「幸福」と一口に言っても、毎日の気分と人生の満足度は同じなのか（お金はどちらに効くのか）
4. 日本でも同じことが言えるのか（日本の公的調査では、世帯年収と満足度はどういう関係か）
5. 同じ金額なら、何に使うと満足度につながりやすいのか（モノ・経験・時間・人のため）

## 分かっていること

### A. 外部資料（すべて未確認。記事に数字を使わないこと）

外部資料は一つも開けていないので、**根拠付きの主張としては書けない**。検索結果の一覧から、次の一次資料が存在する可能性が高いことだけは分かった（タイトルと URL のみ。中身・数字は未確認）。

- Kahneman & Deaton（2010, PNAS）：検索結果の要約では、「人生の評価（life evaluation）」と「感情的な幸福（emotional well-being）」を分けて分析し、後者だけがある年収額で頭打ちになったとされる。**金額・サンプル数は原典で要確認** → 確認待ち [W1]
- Killingsworth（2021, PNAS）：検索結果の要約では、経験サンプリング法（日常のランダムな瞬間に気分を答えてもらう方法）で、頭打ちは見られなかったとされる。**データ点数・人数・金額は原典で要確認** → 確認待ち [W2]
- Killingsworth, Kahneman & Mellers（2023, PNAS, "Income and emotional well-being: A conflict resolved"）：検索結果の要約では、対立する研究者どうしの共同研究（adversarial collaboration）で、頭打ちは「最も幸福度の低い層」に限って見られ、それ以外の層では収入とともに幸福度が上がり続けたとされる。**その層の割合と金額は原典で要確認** → 確認待ち [W3]
- 内閣府「満足度・生活の質に関する調査報告書」：世帯年収別の生活満足度の集計がある可能性が高い。**検索要約には年収と満足度に関する記述が出たが、要約どうしで内容が食い違って見え、信用できない。必ず報告書の該当ページで確認すること** → 確認待ち [W4]
- お金の使い方：Dunn, Aknin & Norton（2008, Science, "Spending money on others promotes happiness"）[W5]、Whillans ほか（2017, PNAS, "Buying time promotes happiness"）[W6] が検索結果に出た。**実験の人数・金額は原典で要確認**。経験とモノの比較（Van Boven & Gilovich, 2003 とされる研究）は、今回の検索では確認できなかった

### B. サイト内の記事から使える材料（外部資料は未確認。サイト掲載済みの内容）

- 2024年の1年間に転職した人のうち、前の職場と比べて賃金が「増加」した人は40.5%、「減少」した人は29.4%（厚生労働省「令和6年 雇用動向調査」）［S1／`salary-change.html` に掲載］
- 年収の多くは、どの業界・会社・職種にいるかで決まる、という整理［S1／`salary-change.html` の論点。統計の数字ではなく記事の考察］
- 人は同じ金額でも、失う痛みを得る喜びより大きく感じる（損失回避）。損失は得の2倍前後の重さで感じられると推定されている（Kahneman & Tversky, 1979 と、その後の研究）［S2／`fear-of-change.html` に掲載］
- 人は自分を他人と比べることで自分を知る（社会的比較理論, Festinger, 1954）。SNS を眺めるだけの「受け身の使い方」は幸福感の低さと関係しやすい（Verduyn ほか, 2017 のレビュー）［S3／`comparison.html` に掲載］
- 心が目の前の活動から離れていることと、低い幸福感との関連（Killingsworth & Gilbert, 2010, Science）［S4／`doing-nothing.html` に掲載］。※ 2021年の年収研究の Killingsworth と同じ研究者で、同じ「スマホで気分を記録する」手法の系譜である可能性が高いが、**今回は原典で確認できていない**。記事で「同じ研究者」と書くなら要確認
- 転職直後に満足度が上がり、その後下がる（ハネムーン－ハングオーバー効果）。コイン投げで変化を選んだ人は、約半年後に現状維持の人より幸福度が高かった（Levitt, 2021）［S5／`job-change-happiness.html` に掲載］
- Facebook を4週間止めた人は、主観的なウェルビーイングがわずかに高くなった（Allcott ほか, 2020）［S6／`social-media-time.html` に掲載］

### 冒頭で手を止めさせる材料の候補

- **確認できれば最強**：「頭打ち説を出した本人（Kahneman）が、反対の結果を出した研究者と組んで、自分の結論を一部修正した」という事実 [W3]。常識の否定と意外性が両方ある。**ただし原典未確認なので、確認後にしか使えない**
- **今すぐ使える（サイト掲載済み）**：「転職した人の3割は、賃金が下がっている」［S1］／「損は得の2倍前後の重さで感じる」［S2］。年収の数字そのものより「比べ方・感じ方」が幸福を左右する、という入口に使える

## まだ分かっていないこと・意見が分かれていること

- 頭打ちの有無（2010 と 2021 の対立）と、2023 の共同研究がどう整理したか：**原典未確認のため、正確な記述は確認できなかった**
- 米国の研究の金額を、日本の年収にそのまま置き換えられるか：物価・為替・社会保障が違うので単純には置き換えられない、というのが一般的な注意点。日本で同じ設計の研究があるかは**確認できなかった**
- 内閣府の調査で、世帯年収と生活満足度の関係がどういう形になっているか（頭打ちがあるのか、どの額からか）：**確認できなかった**。検索要約どうしも食い違っていた
- 「経験にお金を使うほうがモノより幸福につながる」説は広く知られるが、その後の研究で条件付き（人や状況による）とする議論もあると言われる。今回は**どちらも確認できなかった**
- 相関と因果：年収が高いから幸福なのか、幸福な人が稼ぎやすいのか。上の研究の多くは調査データの関連であり、因果の向きは別の議論になる（一般的な注意点。個別論文での扱いは未確認）

## 記事の切り口の候補

1. **「頭打ち説は、提唱者自身が書き換えた」**（本来の切り口。原典確認が条件）
   2010 → 2021 → 2023 の順に、通説がどう生まれてどう修正されたかを追う。「毎日の気分」と「人生の満足度」の区別、「多くの人には頭打ちはない／一部の人にはある」という結論、日本の内閣府データ、最後にお金の使い方（時間・人のため）。冒頭は「この説を言い出した本人が、13年後に修正した」。
2. **「年収の額より、何と比べているか」**（サイト内の材料だけで書ける）
   年収が上がっても満足しにくい理由を、比較（Festinger／SNS の受け身の使い方）と損失回避（損は得の2倍前後）から考える。転職で3割は賃金が下がっている事実（salary-change）につなげ、「上げるなら何のために上げるか」を決めるワークで締める。頭打ち研究そのものには「研究者の間でも議論が続いている」とだけ触れ、数字は出さない。
3. **「お金で買える幸福、買いにくい幸福」**（使い方の研究。原典確認が条件）
   時間を買う（Whillans 2017）、人のために使う（Dunn 2008）を中心に、年収を上げることと使い方を変えることを比べる。

### 推薦（自分で決めた）

**案2を推薦する。** 理由：外部資料を一つも確認できておらず、案1・案3は核となる数字と結論がすべて未確認で、今の材料では事実に基づいて書けない。案2はサイト掲載済みの材料だけで成り立ち、最後に `salary-change.html` へ自然につながる（X → note → サイトの流れにも合う）。
ただし、記事作成の前に人が [W1]〜[W3] を開いて確認できた場合は、**案1に切り替える**のがいちばん「つい見てしまう」力が強い（タイトル候補の方向：「年収○○で幸福は頭打ち、を言い出した本人が撤回した話」※金額と「撤回」か「修正」かの表現は原典どおりに）。

## サイト内の関連記事

URL の形：`https://moutonarchive.com/<ファイル名>?utm_source=note&utm_medium=referral&utm_campaign=income-happiness`（`src/_data/site.js` の `url` は `https://moutonarchive.com/`）

- `src/articles/salary-change.html`「転職で、年収は上がるのか」— **最後に案内する第一候補**。雇用動向調査（増加40.5%・減少29.4%）、年収は業界・会社・職種で決まる、今日のワーク（年収の内訳・時給）。affiliate なし
  - https://moutonarchive.com/salary-change.html?utm_source=note&utm_medium=referral&utm_campaign=income-happiness
- `src/articles/comparison.html`「人と比べるのを、やめることはできるのか」— 社会的比較・SNS。案2の中心材料
- `src/articles/job-change-happiness.html`「転職すれば、幸せになれるのか」— ハネムーン－ハングオーバー効果、Levitt（2021）。「年収と幸福」の隣のテーマ
- `src/articles/fear-of-change.html`「転職が怖くて、踏み出せないとき」— 損失回避（Kahneman & Tversky, 1979）。Kahneman つながり
- `src/articles/doing-nothing.html`「何もしない時間は、本当に無駄なのか」— Killingsworth & Gilbert（2010）。Killingsworth つながり（敬体の記事なので引用時は文体に注意）
- `src/articles/social-media-time.html`「SNSを見る時間は、減らしたほうがいいのか」— Allcott ほか（2020）
- `src/articles/books-career.html`「転職を考えはじめたときに読む本」— 年収の考え方の本を含む。**`affiliate: true` の記事なので、リンクする場合は note の冒頭に「広告を含みます」の1行が必要**
- 重複の注意：雇用動向調査の数字・損失回避・ハネムーン効果はサイトで扱い済み。note では「紹介して詳しくはサイトへ」にとどめ、同じ説明を繰り返さない

## 参考文献

### サイト掲載済み（今回原典は未確認。サイト記事の記載を写したもの）

- [S1] 厚生労働省「令和6年 雇用動向調査結果の概況」（`salary-change.html` の参考文献。URL はサイト記事に記載なし）／労働新聞社「令和6年 雇用動向調査」 https://www.rodo.co.jp/series/205462/
- [S2] Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291.（`fear-of-change.html`）
- [S3] Festinger, L. (1954). A theory of social comparison processes. Human Relations, 7(2), 117–140.／Verduyn, P., Ybarra, O., Résibois, M., Jonides, J., & Kross, E. (2017). Do social network sites enhance or undermine subjective well-being? A critical review. Social Issues and Policy Review, 11(1), 274–302.（`comparison.html`）
- [S4] Killingsworth, M. A., & Gilbert, D. T. (2010). A wandering mind is an unhappy mind. Science, 330(6006), 932.（`doing-nothing.html`）
- [S5] Levitt（2021）ほか（`job-change-happiness.html` の参考文献欄を参照。書誌の詳細はサイト記事のとおり）
- [S6] Allcott, H., Braghieri, L., Eichmeyer, S., & Gentzkow, M. (2020). The welfare effects of social media. American Economic Review, 110(3), 629–676.（`social-media-time.html`）

### 確認待ちの一次資料（検索結果に出ただけ。開いて確認できていない。記事に使う前に必ず人が確認）

- [W1] Kahneman, D., & Deaton, A. (2010). High income improves evaluation of life but not emotional well-being. PNAS. 候補 URL：https://pmc.ncbi.nlm.nih.gov/articles/PMC2944762 ／ https://www.princeton.edu/~deaton/downloads/deaton_kahneman_high_income_improves_evaluation_August2010.pdf
- [W2] Killingsworth, M. A. (2021). Experienced well-being rises with income, even above $75,000 per year. PNAS.（タイトルは検索クエリ由来で、正確な表記は要確認）候補 URL：https://www.sciencedaily.com/releases/2021/01/210119085249.htm（報道）。原典 URL は未特定
- [W3] Killingsworth, M. A., Kahneman, D., & Mellers, B. (2023). Income and emotional well-being: A conflict resolved. PNAS, 120(10). 候補 URL：https://www.pnas.org/doi/10.1073/pnas.2208661120 ／ https://behavioralpolicy.princeton.edu/news/DK_wellbeing0323
- [W4] 内閣府「満足度・生活の質に関する調査報告書」 候補 URL：https://www5.cao.go.jp/keizai2/wellbeing/manzoku/index.html（報告書 PDF：https://www5.cao.go.jp/keizai2/wellbeing/manzoku/pdf/report08.pdf など。どの年度の報告書かを確認すること）
- [W5] Dunn, E. W., Aknin, L. B., & Norton, M. I. (2008). Spending money on others promotes happiness. Science, 319(5870).（ページ番号未確認）
- [W6] Whillans, A. V., ほか (2017). Buying time promotes happiness. PNAS.（著者の全員・巻号は未確認）

※ 本の紹介はしていないため、ASIN・ISBN の記載はなし。
