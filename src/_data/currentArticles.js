// いまの MOUTON の中心に置く記事。
// 2026-10-21 作り直し（docs/site-renewal-20261021.md）：新しい型（判定表つき）の記事だけを置く。
// 今までの記事（哲学の有料3本、連載「哲学者に聞く」、3つの姿勢を含む）は、すべてアーカイブに移した。
// ここにない日本語の記事はアーカイブになる：記事一覧から外れ、archive.html に並び、
// ページの上に「アーカイブ」の注記が出る。URL はそのまま（外からのリンクと検索を切らないため）。
// 英語版は後回し（2026-10-17、オーナー）なので、src/en/ には使わない。
// 2026-11-04 オーナー「ムートンサイトをガラッと変更したい。セキュリティの個人研究サイト、勉強用にしたい」。
// 今までの記事（食・身体・お金・生き方）は、すべてアーカイブに移した（URL はそのまま）。
// セキュリティの記事を書いたら、ここにファイル名を足す（docs/security-renewal-20261104.md）。
// 2026-11-04 オーナー「記事が長い。分割を求める」：SIEM の記事を3本に分けた。読む順に並べる。
// 2026-11-06 オーナー「最初にルーティングについての記事を作る」：ルーティングを SIEM の3本より前に置く。
// 2026-11-07 オーナー「記事を10個」：ルーティングと IP アドレスから広げた土台の10本を、SIEM の3本の前に置く。
// 2026-11-13 オーナー「会話を覗いて、新しい記事を作成して欲しい」：SOC・支援士のレッスンと IT朝刊から広げた6本（ログ → 認証 → 脆弱性 → 攻撃）を、SIEM の前に置く。
export default [
  'routing',
  'ip-address',
  'arp',
  'dhcp',
  'tcp-udp',
  'icmp',
  'nat',
  'firewall',
  'dns',
  'dns-security',
  'tls',
  'http',
  'windows-event-log',
  'linux-log',
  'mfa',
  'kev',
  'ntlm',
  'rmm',
  'siem',
  'siem-detection',
  'siem-ecosystem',
  // 2026-11-13 オーナー「セキュリティに限らず、幅広いテーマを扱いたい」（docs/broad-themes-20261113.md）：
  // 2026-11-04 にアーカイブへ移した食・身体・生き方の16本（判定表つき）を、いまの記事に戻す。
  'meat-and-libido',
  'libido-and-food',
  'libido-what-moves-it',
  'prolactin',
  'habit-design',
  'color-impression',
  'sleep-evidence',
  'before-sleep-hour',
  'patience',
  'sincerity-word-deed',
  'vascular-endothelium',
  'sex-in-daily-life',
  'good-habits',
  'sauna-evidence',
  'd2-receptor-evidence',
  'subconscious-evidence',
];
