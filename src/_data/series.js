// 連載（series）: articles meant to be read in order. Each article belongs to at most one series.
// The order of `slugs` is the reading order. Shown as "連載｜<title> n/m" at the top of each article,
// a box with the whole list at the end, and on series.html.
export default [
  {
    key: 'job',
    title: '転職を考える',
    en: 'Thinking about changing jobs',
    intro: '日曜の夜の憂うつから、辞めるかどうか、何から始めるか、お金、言い出し方、その後まで。迷う順番に並べています。',
    enIntro: 'From Sunday-night dread to whether to quit, where to start, money, how to say it, and what comes after, in the order the doubts tend to come.',
    slugs: ['sunday-blues', 'quit-or-escape', 'job-fit', 'fear-of-change', 'job-change-start', 'job-agent', 'multiple-agents', 'salary-change', 'quit-cant-say', 'job-change-happiness', 'books-career'],
  },
  {
    key: 'clean',
    title: '清潔感を、確かめる',
    en: 'Looking clean, checked',
    intro: '第一印象、匂い、口臭、日焼け。見た目の清潔感を、研究と公的な情報から一つずつ確かめています。',
    enIntro: 'First impressions, smell, bad breath, sun damage. Checking what makes someone look clean, one study at a time.',
    slugs: ['cleanliness', 'first-impression-sleep', 'smell', 'odor-care', 'deodorant-guide', 'halitosis', 'oral-care-guide', 'sunscreen-guide'],
  },
  {
    key: 'thinkers',
    title: '哲学者に聞く',
    en: 'Asking the philosophers',
    intro: 'ストア派、ニーチェ、カミュ、サルトル。2000年分の哲学者に、いまの悩みを持っていって聞いてみる連載です。',
    enIntro: 'The Stoics, Nietzsche, Camus, Sartre. Taking today\'s worries to two thousand years of philosophers.',
    slugs: ['stoicism', 'nietzsche', 'camus-sisyphus', 'sartre', 'books-philosophy'],
  },
  {
    key: 'sleep',
    title: '眠りを確かめる',
    en: 'Sleep, checked',
    intro: '昼寝の長さ、寝だめ、朝型と夜型、寝室の音と光、画面の光。眠りについて言われていることを確かめています。',
    enIntro: 'Nap length, weekend catch-up sleep, morning and night types, noise and light, screens. Checking what we are told about sleep.',
    slugs: ['nap', 'weekend-sleep', 'chronotype', 'earplug-eyemask-guide', 'blue-light'],
  },
  {
    key: 'food-check',
    title: 'その健康法、本当？',
    en: 'Is that health claim true?',
    intro: 'コーヒー、ダークチョコ、オリーブ油、ブルーベリー、血糖値。「体にいい」「体に悪い」を、論文から確かめ直しています。',
    enIntro: 'Coffee, dark chocolate, olive oil, blueberries, blood sugar. Rechecking "good for you" and "bad for you" against the papers.',
    slugs: ['coffee', 'dark-chocolate', 'olive-oil', 'blueberry', 'blood-glucose'],
  },
  {
    key: 'habits',
    title: '自分を変える仕組み',
    en: 'How people change',
    intro: 'なりたい自分、セルフイメージ、目標と仕組み、恐怖。変わりたいときに、意志の前に知っておきたいこと。',
    enIntro: 'Who you want to be, self-image, goals and systems, fear. What to understand before relying on willpower.',
    slugs: ['identity', 'self-image', 'system-goal', 'fear', 'book-habits-brain', 'books-habits'],
  },
];
