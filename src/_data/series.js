// 連載（series）: articles meant to be read in order. Each article belongs to at most one series.
// The order of `slugs` is the reading order. Shown as "連載｜<title> n/m" at the top of each article,
// a box with the whole list at the end, and on series.html.
// 2026-10-16：オーナーの判断で、連載は「哲学者に聞く」だけにした（ほかの5つは記事ページの絞りこみと役割が重なるため）。
export default [
  {
    key: 'thinkers',
    title: '哲学者に聞く',
    en: 'Asking the philosophers',
    intro: 'ストア派、キルケゴール、ニーチェ、スピノザ、カミュ、サルトル。2000年のあいだに生きた哲学者たちに、いまの悩みを持っていって聞いてみる連載です。',
    enIntro: 'The Stoics, Nietzsche, Camus, Sartre. Taking today\'s worries to two thousand years of philosophers.',
    // 2026-10-17：本の記事（books-philosophy）はアーカイブに移したので外した。
    slugs: ['stoicism', 'kierkegaard', 'nietzsche', 'spinoza', 'camus-sisyphus', 'sartre'],
  },
];
