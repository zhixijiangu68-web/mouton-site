// いまの MOUTON の中心に置く記事（2026-10-17、オーナー「必要な記事だけを残して、あとはアーカイブに移す」）。
// 基準：有料の3本と、連載「哲学者に聞く」の6本、3つの姿勢（没頭・他人の評価からの自由・行動優先）の記事。
// 2026-10-17 同日、オーナーの判断で「1分ワーク」はなくした（安易に与えると受け身になる。読者に考えてほしい）。
// ここにない日本語の記事はアーカイブになる：記事一覧・次に読む・おまかせから外れ、archive.html に並び、
// ページの上に「アーカイブ」の注記が出る。URL はそのまま（外からのリンクと検索を切らないため）。
// 英語版は後回し（2026-10-17、オーナー）なので、src/en/ には使わない。
export default [
  'paid-kierkegaard', 'paid-nietzsche', 'paid-spinoza',
  'kierkegaard', 'nietzsche', 'spinoza',
  'stoicism', 'camus-sisyphus', 'sartre',
  'absorption-freedom-action',
];
