// いまの MOUTON の中心に置く記事（2026-10-17、オーナー「必要な記事だけを残して、あとはアーカイブに移す」）。
// 基準：有料の3本と、連載「哲学者に聞く」の6本、3つの姿勢（没頭・他人の評価からの自由・行動優先）の記事。
// 2026-10-17、行動優先を掘り下げた action-bias を追加（オーナー「ムートンサイトへ移して」）。
// 2026-10-17 同日、オーナーの判断で「1分ワーク」はなくした（安易に与えると受け身になる。読者に考えてほしい）。
// ここにない日本語の記事はアーカイブになる：記事一覧・次に読む・おまかせから外れ、archive.html に並び、
// ページの上に「アーカイブ」の注記が出る。URL はそのまま（外からのリンクと検索を切らないため）。
// 英語版は後回し（2026-10-17、オーナー）なので、src/en/ には使わない。
export default [
  'paid-kierkegaard', 'paid-nietzsche', 'paid-spinoza',
  'kierkegaard', 'nietzsche', 'spinoza',
  'stoicism', 'camus-sisyphus', 'sartre',
  'absorption-freedom-action', 'action-bias',
  // 2026-10-19：オーナーの依頼「サイトの記事が100個ほど欲しい。noteと全く同じ記事は作らない。コピーライティング第一で、次のコンテンツにつなげて」。
  // 悩みごとの20の連なり（各4〜6本）。どの連なりも最後は入門（kierkegaard／nietzsche／spinoza）につなぎ、そこから有料の3本へ。
  // K1 後回しが積もった部屋の5本
  'laozi-easy-things-later', 'roka-weeding', 'rohan-where-to-start', 'pascal-first-line', 'kenji-forever-unfinished',
  // K2 「いつか」を話す人の5本
  'kierkegaard-banquet-only-talk', 'aristotle-wish-and-choice', 'fukuzawa-today-not-someday', 'fukuzawa-ideal-and-work', 'schopenhauer-ad-interim',
  // K3 決めないまま夜が来る5本
  'kierkegaard-busy-fire-tongs', 'montaigne-runaway-horse', 'lycon-distorted-mirror', 'akutagawa-box-of-matches', 'montaigne-bottle-and-ham',
  // K4 むだになるのが怖い6本
  'terada-clever-head', 'gojo-wasted-effort', 'schopenhauer-postponed-relief', 'james-faint-but', 'augustine-fun-and-still-not', 'miki-uncertainty-work',
  // K5 やめる・続ける・選び直す5本
  'thoreau-leaving-the-woods', 'seneca-the-way-we-began', 'cicero-planting-trees', 'descartes-only-my-opinions', 'descartes-no-binding-promise',
  // K6 自分で選ぶ力の6本
  'dhammapada-others-cows', 'mill-choosing-muscle', 'emerson-objections-everywhere', 'socrates-voice-that-forbids', 'nishida-hope-disunity', 'nietzsche-stillest-hour',
  // N1 言い出せない人の5本
  'diogenes-begging-a-statue', 'emerson-no-need-to-explain', 'emerson-afraid-of-grim', 'nitobe-sick-excuse', 'franklin-it-appears-to-me',
  // N2 褒められるのが怖い5本
  'plutarch-praise-against-conviction', 'laozi-favour-and-disgrace', 'boethius-false-praise', 'pascal-what-we-hear-praised', 'soseki-borrowed-clothes',
  // N3 人の評価が離れない5本
  'nitobe-strangers-criticism', 'seneca-what-they-say-about-me', 'nietzsche-waiting-for-verdict', 'bakin-bad-reviews', 'boethius-praise-changes-by-place',
  // N4 その場に合わせてしまう5本
  'augustine-lets-go-lets-do-it', 'chomei-follow-or-not', 'socrates-ready-made-words', 'socrates-in-my-own-manner', 'marcus-others-opinion',
  // N5 比べるのが止まらない5本
  'miki-envy-busy', 'descartes-slow-mind', 'ogai-resignation', 'james-what-you-staked', 'mill-even-sheep-differ',
  // N6 まだ誰にも見せていない5本
  'sangetsuki-hidden-gem', 'uchimura-write-as-you-felt', 'abe-someone-did-it-first', 'epictetus-laughed-at-for-changing', 'shiki-against-custom',
  // N7 見え方で暮らしを選ぶ4本
  'schopenhauer-tailors-tape', 'schopenhauer-what-people-say', 'thoreau-respected-or-respectable', 'nietzsche-no-the-way',
  // S1 つい手が伸びる5本
  'epictetus-wait-a-little', 'aristotle-sweets-in-the-theatre', 'dhammapada-water-drops', 'augustine-the-hand-obeys', 'nietzsche-gardener-of-impulses',
  // S2 気分が崩れた日の5本
  'pyrrho-and-the-dog', 'akutagawa-trifles', 'laozi-muddy-water', 'schopenhauer-night-black', 'mill-strong-feelings',
  // S3 張り切ったあとの5本
  'terada-tulip-hyacinth', 'soseki-skin-deep', 'aristotle-milo-too-little', 'bennett-windfall-days', 'nietzsche-promise-actions',
  // S4 自分を責める夜の5本
  'franklin-errata', 'ango-no-regrets', 'cicero-angry-at-correction', 'seneca-not-a-wise-man', 'franklin-black-spots',
  // S5 冷めてしまった5本
  'yanagi-repetition', 'james-interest-starves', 'boethius-having-been-happy', 'james-feelings-evaporate', 'spinoza-enjoy-without-guilt',
  // S6 何のために続けるかの5本
  'plutarch-diogenes-and-the-mouse', 'roka-carrying-water', 'okakura-process-not-finish', 'marcus-one-more-hour', 'james-unclamp',
  // S7 また同じ年を繰り返す4本
  'rohan-same-script', 'uchimura-carlyle-ten-days', 'abe-ideal-distance', 'miki-habit-not-reason',
];
