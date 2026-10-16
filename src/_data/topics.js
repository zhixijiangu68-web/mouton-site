// テーマ別ページ（topic-<key>.html）。記事は front matter の journal.category / science で振り分けられる。
export default [
  {
    key: 'philosophy',
    label: '哲学・生き方',
    en: 'Philosophy',
    ph: 'philosophy',
    intro: '自由、恐怖、セルフイメージ、意味。答えを急がず、問いのまま考えたことを残しています。',
    // topic-philosophy.html は記事一覧ではなく、3人の哲学者を選ぶページ（partials/philosophy-lp.njk）
    lpIntro: '正解を探して決められないあなたへ。哲学を日常の選択につなげる有料記事と、無料で試せる問い・記入例を紹介。内容、価格、読み方を購入前に確認できます。',
  },
  {
    key: 'body',
    label: '身体',
    en: 'Body',
    ph: 'body',
    intro: '体力、血糖値、匂い、口臭。なんとなくの感覚を、研究とデータでもう一度確かめ直しています。',
  },
  {
    key: 'work',
    label: '仕事・働き方',
    en: 'Work',
    ph: 'think',
    intro: '日曜の夜の憂うつ、辞めたい気持ち、転職の怖さ。働くことの迷いを、研究と制度から整理しています。',
  },
  {
    key: 'food',
    label: '食事・化学',
    en: 'Food & Science',
    ph: 'food',
    intro: '食べ物、栄養、代謝、成分。健康についての言葉を、論文とデータから確かめています。',
  },
];
