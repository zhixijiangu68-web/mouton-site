// いまの MOUTON の中心に置く記事（2026-10-17、オーナー「必要な記事だけを残して、あとはアーカイブに移す」）。
// 基準：有料の3本と、読んだあとに書く「1分ワーク」がある哲学の記事（読むだけで終わらない記事）。
// ここにない日本語の記事はアーカイブになる：記事一覧・次に読む・おまかせから外れ、archive.html に並び、
// ページの上に「アーカイブ」の注記が出る。URL はそのまま（外からのリンクと検索を切らないため）。
// 英語版は後回し（2026-10-17、オーナー）なので、src/en/ には使わない。
export default [
  'paid-kierkegaard', 'paid-nietzsche', 'paid-spinoza',
  'kierkegaard', 'nietzsche', 'spinoza',
  'stoicism', 'camus-sisyphus', 'sartre',
  'absorption-freedom-action',
];
