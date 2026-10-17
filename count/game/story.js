// MOUTON・COUNT: ものがたり (the story). Rules and words only, no screen;
// main.js shows it and tests/story.test.mjs checks it. The long version of the
// reasoning is in docs/story-bible.md.
//
// "I" is the player's sheep and "you" is the player. The story has its own
// fifty nights (storynights.js, about four hours in all) and is optional: the
// player starts it from the quest list. Scenes sit on nights 1, 5 and 10 of
// each act (fifteen "beats"); the nights between have a short line. After ten
// of the beats the sheep asks one question (two or three answers, never more,
// never typed).
// Five acts follow MOUTON's "変わる順番" (BRAND.md of mouton-site): who you
// want to be, what you believe, thoughts and feelings as tools, subtracting,
// results that arrive late.
//
// The ending is one of thirty and is chosen by the answers:
//   27 = the answer to the sheep's riddle (plain / mystery / surprise)
//        x what the player wants most (core) x how they stand towards the
//        black sheep (stance)
//    3 = hidden: the player chose the first, the middle or the last answer
//        every single time
// Skill never decides anything: only clearing a night moves the story on.
// Nothing here is a test or a diagnosis, and no ending is better than another.
//
// Words follow BRAND.md: no orders, no "right way", no promises about health,
// nothing that blames the player (tests/story.test.mjs checks every line).

export const VERSION = 3;
export const LAST_NIGHT = 50;               // the story's nights (a saved night is one of these)
export const BEATS = 15;                    // the scenes: three in each of the five acts
// Beat k (1 to 15) falls on this night: nights 1, 5, 10 of act one, 11, 15, 20 of act two, ...
export const beatNight = k => 10 * Math.floor((k - 1) / 3) + [1, 5, 10][(k - 1) % 3];
const BEAT_AT = Object.fromEntries(Array.from({ length: BEATS }, (_, i) => [beatNight(i + 1), i + 1]));
export const beatOf = night => BEAT_AT[night] || 0;
const HISTORY_MAX = 5;

// ---- what the player is asked ------------------------------------------------

// The fog: three of the worries MOUTON writes about, or "あとで" (no name).
export const WORRIES = {
  decide: '決められないこと',
  eyes: '人にどう思われるか',
  keep: '続かないこと',
};
const worryPhrase = s => (s.worry ? `「${WORRIES[s.worry]}」` : 'あの霧');

// Each question is asked after a night. vote: which stance an answer leans to.
// Order of answers is mixed on purpose (see the "first, middle, last" endings).
export const QUESTIONS = {
  core: {
    prompt: () => ['もし、お金も、評価も、人の目も、なかったとしたら。', 'いまの時間を、どう使いたいですか。'],
    options: [
      { id: 'tie', label: 'だれかと、一緒に過ごしたい', reply: ['だれかのそばにいたいのですね。', '羊は、群れで眠ります。'] },
      { id: 'make', label: 'ひとりで、何かをつくりたい', reply: ['手を動かしたいのですね。', '私の毛も、昔は、誰かが紡いだものです。'] },
      { id: 'roam', label: '知らない場所へ、行ってみたい', reply: ['遠くへ行きたいのですね。', '柵の向こうも、ひとつの「遠く」です。'] },
    ],
  },
  curio: {
    prompt: () => ['柵の板の文字は、半分しか読めませんでした。', '「これは、あなたが——」。', '続きを、知りたいですか。'],
    options: [
      { id: 'know', label: '知りたい', reply: ['では、もう少し、柵を見ていきましょう。'] },
      { id: 'later', label: 'いまは、知らなくていい', reply: ['そのままにしておきます。', '時が来たら、また読めるかもしれません。'] },
    ],
  },
  creed: {
    prompt: () => ['結果ではなく、やり方で書いてみませんか。', '「私は、◯◯する人間だ」。いちばん近いのは。'],
    options: [
      { id: 'persist', label: '最後まで、あきらめずにやる人間だ', reply: ['あきらめない、は、結果ではなく、やり方ですね。'] },
      { id: 'careful', label: 'ひとつずつ、丁寧にやる人間だ', reply: ['丁寧に、は、速さを競わない、という選び方でもあります。'] },
      { id: 'act', label: 'まず、動いてみる人間だ', reply: ['動いてから考える、も、ひとつの考え方です。'] },
    ],
  },
  talk: {
    prompt: () => ['あなたなら、どうしますか。'],
    options: [
      { id: 'listen', label: '話を聞く', vote: 'hold', reply: ['黒い羊は、小さな声で言いました。', '「見てほしかっただけ」。', 'あなたの声に、少し、似ていました。'] },
      { id: 'distance', label: '少し、距離を置く', vote: 'part', reply: ['黒い羊は、しばらく私を見ていました。', 'そして、遠くへ行きました。'] },
      { id: 'name', label: '名前をつけてみる', vote: 'face', reply: ['名前をつけると、黒い羊は、少しだけ小さく見えました。'] },
    ],
  },
  sort: {
    prompt: s => ['あなたの霧を、仕分けてみませんか。', s.worry ? `${worryPhrase(s)}は、どれに近いですか。` : 'いま気になっていることは、どれに近いですか。'],
    options: [
      { id: 'change', label: '自分で、変えられること', vote: 'face', reply: ['変えられるものなら、動かせるところが、きっとあります。'] },
      { id: 'keep', label: '自分では、変えられないこと', vote: 'hold', reply: ['変えられないものは、持ったまま歩く、という選び方もあります。'] },
      { id: 'unknown', label: 'どちらか、まだ分からないこと', vote: 'part', reply: ['分からないものは、分からないままでも、置いておけます。'] },
    ],
  },
  alarm: {
    prompt: () => ['不安で、胸がざわつくことがあります。', 'それは、何の合図だと思いますか。'],
    options: [
      { id: 'danger', label: '危険を知らせる合図', reply: ['守ろうとしてくれているのですね。', '体は、あなたを守ろうとしています。'] },
      { id: 'ready', label: '何かの準備をしている合図', reply: ['ざわつきと、わくわくは、体の中では、よく似ています。'] },
    ],
  },
  stop: {
    prompt: s => [mirror(s), '足す前に、ひとつだけ、やめてみるなら。'],
    options: [
      { id: 'research', label: '調べつづけること', vote: 'face', reply: ['調べても、足りない夜があります。', '足りないまま、動く日があっても。'] },
      { id: 'yardstick', label: '人の物差しに合わせること', vote: 'part', reply: ['ほかの人の物差しで、自分を測らない日。', 'あなたの物差しは、ありますか。'] },
      { id: 'blame', label: '自分を責めること', vote: 'hold', reply: ['責める声が、少し静かになる夜。', '黒い羊も、耳をすましているかもしれません。'] },
    ],
  },
  step: {
    prompt: () => ['明日、いちばん小さな一歩を決めるなら。'],
    options: [
      { id: 'now', label: '今夜、5分だけ', reply: ['5分は、小さくて、ちょうどいい長さです。'] },
      { id: 'plan', label: '明日、時間と場所を決めて', reply: ['いつ、どこで、を決めておく。', '迷う前に、道ができます。'] },
      { id: 'share', label: 'だれかに話してから', reply: ['話すと、一歩が、ひとりのものではなくなります。'] },
    ],
  },
  wait: {
    prompt: () => ['変わらないように見える時期が、きっと来ます。', 'そのあいだ、どう過ごしたいですか。'],
    options: [
      { id: 'record', label: '記録をつける', reply: ['小さな変化は、記録にだけ、残ることがあります。'] },
      { id: 'share', label: 'だれかと分かち合う', reply: ['分かち合うと、夜は、少し短くなります。'] },
      { id: 'rest', label: '何もせず、待つ', reply: ['待つ時間も、道のうちです。'] },
    ],
  },
  who: {
    prompt: () => ['ここまで、ありがとうございました。', '最後に、聞かせてください。', '私は、誰だと思いますか。'],
    options: [
      { id: 'mine', label: 'あなたを守ろうとする、あなたの一部', genre: 'plain', reply: ['私が、あなたの一部。そうだったら、うれしいです。'] },
      { id: 'left', label: 'あなたが昔、置いてきたもの', genre: 'twist', reply: ['置いてきたもの……。', '少し、どきっとしました。'] },
      { id: 'other', label: 'あなたとは、別の誰か', genre: 'turn', reply: ['別の誰か、ですか。', 'どうして、そう思ったのでしょう。'] },
    ],
  },
};

// After which beat each question is asked.
export const ASK_AFTER = { 2: 'core', 3: 'curio', 5: 'creed', 6: 'talk', 8: 'sort', 9: 'alarm', 11: 'stop', 12: 'step', 14: 'wait', 15: 'who' };
export const askAfter = night => ASK_AFTER[beatOf(night)] || null;

export const WORD = {
  prompt: ['霧が見えます。あなたの頭のなかの、霧です。', 'いま、いちばん近いのは。'],
  skip: 'あとで',
  replyNamed: ['霧に、名前がついました。'],
  replyNone: ['名前がなくても、数えていけます。'],
};

export const PROLOGUE = [
  'こんばんは。眠れないのですね。',
  '私は、あなたの羊です。あなたが数えてくれる夜にだけ、会えます。',
  '私には、分からないことが三つあります。私は、どうして「あなたの」羊なのか。柵の向こうに、何があるのか。黒い羊は、どこから来るのか。',
  'このものがたりは、診断ではありません。あなたが、考えるための夜です。つらくなったら、いつでも閉じてかまいません。',
  'この夜を始めるのは、あなた。',
];

// ---- the nights --------------------------------------------------------------

const pick = (map, key) => map[key] || map.mix;

// The black sheep, told the way the night went (home / walk / dog / mix / none).
const WAY_4 = {
  home: ['黒い羊を、白い羊で囲みました。囲まれた黒い羊は、帰っていきました。', '消えたのではなく、帰ったのです。'],
  walk: ['黒い羊を、散歩に出しました。どこへ行ったのかは、あの子にしか分かりません。'],
  dog: ['犬が、黒い羊ごと追い立てました。夜は、そのまま続きました。'],
  mix: ['黒い羊の帰し方は、一つではありませんでした。'],
  none: ['黒い羊は、数に入らないまま、夜の中にいました。'],
};
const WAY_7 = {
  home: ['黒い羊を、囲んで帰しました。白い羊が、そばにいてくれました。'],
  walk: ['何匹かは、散歩に出しました。牧場の外にも、夜はあります。'],
  dog: ['犬に任せた夜でした。夜は、少し早く進みました。'],
  mix: ['帰し方は、いろいろでした。'],
  none: ['黒い羊は、また夜の中にいました。'],
};
const WAY_14 = {
  home: ['囲まれた黒い羊は、静かに帰っていきました。'],
  walk: ['何匹かは、散歩に出しました。戻ってくるかは、また別の夜のことです。'],
  dog: ['犬が追いました。それでも、夜は進みました。'],
  mix: ['帰し方は、いろいろでした。どれも、この夜の羊の帰し方です。'],
  none: ['黒い羊は、まだ夜の中にいました。'],
};

// before(s): lines under the night's name. after(s, way): lines on the clear screen.
export const NIGHTS = {
  1: { before: () => ['第一幕　在り方', 'こんばんは。羊が一匹、柵の前に立っています。私です。', 'まずは、数えてくれますか。'],
    after: () => ['あなたが数えてくれると、私は柵を跳べます。', '跳ぶと、不思議と、考えごとが静かになります。あなたは、どうでしたか。'] },
  2: { before: () => ['あなたのことを、少し聞かせてください。数えながらで構いません。'],
    after: s => ['静かな時間は、長くは続きません。', `ふと、${worryPhrase(s)}のことを、思い出しませんか。`] },
  3: { before: () => ['柵の板に、文字が彫ってあることに気づきました。'],
    after: () => ['数えても、霧は晴れませんでした。', 'それでも、数えているあいだは、息がしやすかったです。'] },
  4: { before: () => ['第二幕　信念', '列がそろっても、残る羊がいます。黒い羊。', '私は、あの子たちが、少し苦手です。'],
    after: (s, way) => pick(WAY_4, way) },
  5: { before: () => ['ひとつ動くと、ほかの羊も動きます。続けて、動くことがあります。'],
    after: () => ['ひとつ跳ぶと、続けて跳ぶ羊もいます。', 'きっかけは、小さくてもいいのかもしれません。'] },
  6: { before: s => ['夜は、まだ半分も過ぎていません。', '黒い羊のことが、頭から離れません。',
    ...(optionOf('creed', s.answers.creed) ? [`あなたは、「${optionOf('creed', s.answers.creed).label}」と書きました。`] : [])],
    after: () => ['黒い羊の一匹が、私のそばに来ました。', '何か、言いたそうです。'] },
  7: { before: s => ['第三幕　道具', '黒い羊は、一匹では終わりませんでした。',
    ...(s.answers.talk === 'listen' ? ['あの子の声が、まだ耳に残っています。'] : s.answers.talk === 'name' ? ['名前をつけた子の姿が、まだ目に残っています。'] : s.answers.talk === 'distance' ? ['遠くへ行った子のことが、少し気になっています。'] : [])],
    after: (s, way) => pick(WAY_7, way) },
  8: { before: () => ['手を動かしているあいだ、考えごとは静かになります。', '静かになるだけで、消えたわけではありません。'],
    after: () => ['霧は、まだそこにあります。'] },
  9: { before: () => ['ときどき、あなたではない誰かの声が、遠くから聞こえます。', '柵の向こうからでしょうか。', '白い羊のあいだに、黒い羊がまじっています。いつから、いたのでしょう。'],
    after: () => ['胸のあたりが、ざわざわします。'] },
  10: { before: s => ['第四幕　引き算', '積もったものが、高く見える夜があります。',
    ...(s.answers.alarm === 'danger' ? ['胸のざわつきは、守ろうとする合図だと、あなたは言いました。'] : s.answers.alarm === 'ready' ? ['胸のざわつきは、準備の合図かもしれないと、あなたは言いました。'] : [])],
    after: () => ['高く見えるのは、積んだ羊のせいでしょうか。見ている目のせいでしょうか。'] },
  11: { before: () => ['ここまでの夜を、少し振り返ります。'],
    after: () => ['夜の半分は、もう過ぎました。'] },
  12: { before: () => ['夜は、いちばん深いところを通ります。'],
    after: () => ['深い夜を、数えて抜けました。', '霧の向こうに、うすく空が見えます。'] },
  13: { before: () => ['第五幕　遅れてくるもの', 'そろえ続けた手は、もう覚えています。', '明日の一歩を、決めましたね。'],
    after: () => ['霧は、さっきより薄いです。消えたわけではありません。'] },
  14: { before: () => ['黒い羊が、群れで来る夜もあります。'],
    after: (s, way) => pick(WAY_14, way) },
  15: { before: () => ['最後の夜です。朝は、もうすぐです。'],
    after: () => ['夜を、数えきりました。', '空が、白んでいきます。'] },
};

// The nights between the scenes: a line before and/or after. Rest nights (7, 17, 27, 37, 47) say so.
export const INTERLUDES = {
  2: { after: ['羊が、また一匹、柵を跳びました。数えるほど、夜は静かになります。'] },
  3: { after: ['あなたは、数えるのが、上手ですね。……そう言われると、困りますか。'] },
  4: { after: ['柵は、いつも同じ場所に立っています。跳ぶ私が、毎回、違うだけです。'] },
  6: { after: ['星が、ひとつ、増えた気がします。気のせいでしょうか。'] },
  7: { before: ['今夜は、休みの夜です。急がなくて、大丈夫です。'], after: ['休むのも、夜の仕事です。'] },
  8: { after: ['柵の板の文字が、少しだけ、読みやすくなった気がします。'] },
  9: { after: ['長い列でした。ここまで来たことも、ひとつ、数えられそうです。'] },
  12: { after: ['霧が、少し濃くなりました。見えないものがあると、足を止めたくなります。'] },
  13: { after: ['「私は、こういう人間だ」。そう決めると、楽になることも、窮屈になることもあるようです。'] },
  14: { after: ['やり方で書いた言葉は、結果が出なくても、残ります。'] },
  16: { after: ['遠くから、誰かの声が、聞こえた気がします。あなたの声に、似ているような。'] },
  17: { before: ['休みの夜です。黒い羊も、今夜は、のんびりしています。'], after: ['静かな夜も、ちゃんと夜です。'] },
  18: { after: ['名前のないものに、名前をつけると、少しだけ、扱いやすくなります。'] },
  19: { after: ['黒い羊は、増えたのではなく、見えるようになったのかもしれません。'] },
  22: { before: ['考えも、気持ちも、道具のように持てたらいいのに、と私は思います。'], after: ['道具は、使い方を選べます。気持ちも、少しだけ。'] },
  23: { after: ['変えられることと、変えられないこと。どちらも、あなたの夜のものです。'] },
  24: { after: ['黒い羊は、誰かを困らせたいわけではないようです。'] },
  26: { after: ['胸のざわつきは、まだそこにあります。いなくならなくても、一緒に数えられます。'] },
  27: { before: ['休みの夜です。ざわつきも、今夜は、小さめです。'], after: ['小さな静けさを、ひとつ、拾いました。'] },
  28: { after: ['遠くの声が、さっきより、近くなりました。誰の声でしょう。'] },
  29: { after: ['深くなる夜は、こわいだけではありません。星が、よく見えます。'] },
  32: { before: ['足すことは得意でも、引くことは、少し苦手です。'], after: ['ひとつ引くと、風通しがよくなります。'] },
  33: { after: ['やめることは、あきらめることとは、少し違います。'] },
  34: { after: ['手放したものは、どこへ行くのでしょう。柵の向こうでしょうか。'] },
  36: { after: ['高く見えたものも、近づくと、ただの柵でした。ときどき、ですが。'] },
  37: { before: ['休みの夜です。何も足さず、何も引かない夜。'], after: ['何もしない時間も、あなたの時間です。'] },
  38: { after: ['小さな一歩の話を、していましたね。私の一歩は、跳ぶことです。'] },
  39: { after: ['深い夜でした。それでも、数えきりました。'] },
  42: { before: ['変化は、いつも少し遅れて、やってきます。'], after: ['遅れてきたものに、気づく夜があります。'] },
  43: { after: ['見えない変化も、積もっています。柵の下の、小さな土のように。'] },
  44: { after: ['黒い羊の群れが、少し違って見えます。数が減ったのではなく、私の見方が。'] },
  46: { after: ['変わらない夜に見えても、数えた夜は、ちゃんと増えています。'] },
  47: { before: ['最後のひとつ前の、休みの夜です。'], after: ['ここまで、一緒に来てくれて、ありがとうございます。'] },
  48: { after: ['空の色が、ほんの少し、変わった気がします。'] },
  49: { before: ['あと一夜です。'], after: ['柵が、さっきより、低く見えます。……私が、大きくなったのかもしれません。'] },
};

export const DAWN = ['答え合わせを、しましょうか。', 'この夜を終わらせるのは、あなたです。'];
export const CLOSING = ['霧は、薄くなりました。消えたわけではありません。それでも、朝は来ました。', 'この夜を終わらせたのは、あなたです。'];
export const CARE = '眠れない夜や、つらい気持ちが長く続くときは、身近な人や、医師・相談窓口に話してみるのも一つです。';

// ---- the thirty endings -------------------------------------------------------

export const CORES = { tie: 'つながり', make: 'つくること', roam: '遠くへ' };
export const STANCES = { hold: 'そばに置く', face: '向き合う', part: '距離を置く' };
export const GENRES = { plain: '正統派', twist: 'ミステリー', turn: '予想外' };

const PLANK = {
  plain: 'これは、あなたが守ってきたもの',
  twist: 'これは、あなたが置いていったもの',
  turn: 'これは、あなたたちが越えるもの',
};

// What the clues add to the telling.
const CLUE_LINES = {
  know: g => `柵の板の文字の続きは、『${PLANK[g]}』でした。`,
  listen: g => ({
    plain: '黒い羊の声は、あなたの声に似ていました。あなたの一部だったからです。',
    twist: '黒い羊の声は、あなたの声に似ていました。あの夜の、あなたの声だったからです。',
    turn: '黒い羊の声は、あなたの声に似ていました。そして、遠くの誰かの声にも。',
  })[g],
  record: () => 'あなたが残した記録を読み返すと、点と点が、つながりました。',
};
const NO_CLUES = '手がかりは、ほとんど拾えませんでした。それでも、答えは、ちゃんとそこにありました。';

// The riddle's answer, by what the player chose to be most important.
const REVEAL = {
  plain: {
    tie: ['柵の向こうに何があるのか、分かりました。誰かの「おはよう」が聞こえる、ふつうの朝です。',
      '私は、あなたの中の、あなたを守ろうとする部分でした。黒い羊は、数えきれなかった気がかり。あなたが「つながり」を選んだ夜に、気づいたのです。守りたかったのは、あなたと、大切な人との距離でした。'],
    make: ['柵の向こうに何があるのか、分かりました。机と、白い紙と、ふつうの朝です。',
      '私は、あなたの中の、あなたを守ろうとする部分でした。黒い羊は、数えきれなかった気がかり。あなたが「つくること」を選んだ夜に、気づいたのです。守りたかったのは、あなたの手が動く時間でした。'],
    roam: ['柵の向こうに何があるのか、分かりました。開いた窓と、遠くまで続く、ふつうの朝です。',
      '私は、あなたの中の、あなたを守ろうとする部分でした。黒い羊は、数えきれなかった気がかり。あなたが「遠くへ」を選んだ夜に、気づいたのです。守りたかったのは、自分で選べる、という感覚でした。'],
  },
  twist: {
    tie: ['私は、あなたが昔、跳べなかった夜の羊でした。柵は、あの夜の目印。黒い羊は、あの夜に言えなかった言葉たち。',
      'あなたが「つながり」を選んだのは、あの夜、言いたかった相手がいたからかもしれません。ここまで来て、私は、ようやく、柵を跳べそうです。'],
    make: ['私は、あなたが昔、跳べなかった夜の羊でした。柵は、あの夜の目印。黒い羊は、あの夜に手放した、やりかけのものたち。',
      'あなたが「つくること」を選んだのは、あの続きを、まだ覚えているからかもしれません。ここまで来て、私は、ようやく、柵を跳べそうです。'],
    roam: ['私は、あなたが昔、跳べなかった夜の羊でした。柵は、あの夜の目印。黒い羊は、あの夜に行けなかった場所たち。',
      'あなたが「遠くへ」を選んだのは、あの場所を、まだ地図に残しているからかもしれません。ここまで来て、私は、ようやく、柵を跳べそうです。'],
  },
  turn: {
    tie: ['私は、あなた一人の羊ではありませんでした。あなたが眠れない夜、どこかで、もう一人も眠れずにいます。柵の向こうにいたのは、その人でした。',
      'あなたが「つながり」を選んだのは、その人の気配を、どこかで感じていたからかもしれません。'],
    make: ['私は、あなた一人の羊ではありませんでした。柵の向こうには、もう一人、眠れない人がいました。',
      'あなたが「つくること」を選んだものは、いつか、その人のところへ届くのかもしれません。'],
    roam: ['私は、あなた一人の羊ではありませんでした。柵の向こうには、もう一人、眠れない人がいました。',
      'あなたが「遠くへ」を選んだのは、その人のいる方角を、どこかで感じていたからかもしれません。'],
  },
};

// How you go on, by how you stand towards the black sheep.
const AFTERMATH = {
  plain: {
    hold: '黒い羊は、これからも来るでしょう。そのときは、囲んで、そばに置く。帰っていくまで、一緒に。それも、ひとつの方法だと、私は思います。',
    face: '黒い羊は、これからも来るでしょう。そのときは、正面から見て、名前を呼んでみる。それも、ひとつの方法だと、私は思います。',
    part: '黒い羊は、これからも来るでしょう。そのときは、少し距離を置いて、散歩に出す。それも、ひとつの方法だと、私は思います。',
  },
  twist: {
    hold: '跳べなかった夜の羊を、置いていくのではなく、そばに置いたまま、一緒に跳びます。',
    face: 'あの夜と、まっすぐに向き合って、跳びます。怖いままで。怖さと一緒に。',
    part: 'あの夜は、もう、遠くから見送ります。跳べなかった夜があったことを、認めたまま。',
  },
  turn: {
    hold: '眠れない誰かのことを、そっと、そばに置いておきます。会えなくても、同じ夜にいること。',
    face: '眠れない誰かに、いつか、声をかけてみます。まず、自分の夜から。',
    part: 'それぞれの夜は、それぞれのものです。距離を置いたまま、同じ朝を待つことも、できます。',
  },
};

// A name and one last line for each of the twenty-seven.
const TITLES = {
  plain: {
    tie: { hold: ['そばで聞く朝', '今日の「おはよう」は、私にも、聞こえます。'], face: ['言いに行く朝', '言いたかった一言を、今日は、少しだけ。'], part: ['ちょうどいい距離の朝', '近すぎず、遠すぎず。それでも、つながっています。'] },
    make: { hold: ['机のそばの朝', '白い紙の端に、黒い羊が一匹いても、いいのです。'], face: ['最初の一行の朝', '最初の一行は、下手でもかまいません。あなたの手が、動いたのですから。'], part: ['手を休める朝', 'つくらない日も、つくる人の一日です。'] },
    roam: { hold: ['窓を開ける朝', '窓の外の空気に、黒い羊の分も、ひとつ。'], face: ['歩き出す朝', '行き先は、歩きながら決めても、遅くありません。'], part: ['遠くを見る朝', 'いまは、遠くを見るだけの朝。それも、旅のはじまりです。'] },
  },
  twist: {
    tie: { hold: ['言えなかった言葉の朝', '言えなかった言葉を、連れて行くことも、できます。'], face: ['宛先のある朝', 'あの夜の宛先に、いつか、あなたの声が届きますように。'], part: ['見送る朝', '届かなかった言葉を、私は、責めません。'] },
    make: { hold: ['やりかけの朝', 'やりかけのものは、そのままでも、あなたのものです。'], face: ['続きを描く朝', '続きは、昔の続きではなく、いまのあなたの続きです。'], part: ['しまう朝', 'しまっておくのは、捨てるのとは、違います。'] },
    roam: { hold: ['地図に残した場所の朝', '行かなかった場所も、地図の一部です。'], face: ['出発の朝', 'あの夜に行けなかった場所へ、今度は、歩いて。'], part: ['遠くから眺める朝', '行かない、という選び方も、地図の描き方のひとつです。'] },
  },
  turn: {
    tie: { hold: ['同じ夜にいる朝', '会えなくても、同じ夜を、同じ空の下で。'], face: ['声をかける朝', 'まず、あなたの夜から。声は、それからでも間に合います。'], part: ['それぞれの夜の朝', 'それぞれの夜が、それぞれの朝に、つながっています。'] },
    make: { hold: ['届くかもしれない朝', 'あなたのつくったものは、あなたの知らない夜を、照らすかもしれません。'], face: ['柵の向こうへ贈る朝', '最初のひとつは、誰かに贈るためではなく、あなたのために。'], part: ['手放してつくる朝', '届くかどうかは、手放して、つくります。'] },
    roam: { hold: ['方角を知る朝', 'どの方角にも、誰かの夜があります。'], face: ['会いに行く朝', '会いに行く旅も、まず、一歩から。'], part: ['別々の道の朝', '別々の道でも、朝は、同じ空から来ます。'] },
  },
};

// Hidden: the first, the middle or the last answer, every time.
export const HIDDEN = {
  first: { title: 'いつも一番目の朝',
    lines: ['気づきましたか。あなたは、いつも、いちばん上を選びました。',
      '迷わなかったのでしょうか。それとも、考えるのを、少しお休みしたのでしょうか。どちらでも、かまいません。',
      'もし、速く選ぶことが癖なら、次の夜は、ゆっくり。私は、待てます。羊ですから。'] },
  middle: { title: 'いつも真ん中の朝',
    lines: ['気づきましたか。あなたは、いつも、真ん中を選びました。',
      'どちらにも寄らない、という選び方。慎重さかもしれませんし、決めたくない気持ちかもしれません。',
      'どちらなのか、私には分かりません。分かるのは、あなただけです。'] },
  last: { title: 'いつも最後の朝',
    lines: ['気づきましたか。あなたは、いつも、いちばん下を選びました。',
      '最後まで読んでから決める、丁寧な人なのかもしれません。',
      'いちばん上にも、ほんとうの答えがあったかもしれません。次の夜は、最初から、聞いてみませんか。'] },
};

export const ENDING_LIST = [
  ...Object.keys(TITLES).flatMap(genre => Object.keys(TITLES[genre]).flatMap(core =>
    Object.keys(TITLES[genre][core]).map(stance => ({ id: `${genre}-${core}-${stance}`, genre, core, stance, title: TITLES[genre][core][stance][0] })))),
  ...Object.entries(HIDDEN).map(([id, h]) => ({ id, genre: 'hidden', title: h.title })),
];
export const ENDING_IDS = ENDING_LIST.map(e => e.id);
export const ENDING_COUNT = ENDING_LIST.length;
const ENDING = Object.fromEntries(ENDING_LIST.map(e => [e.id, e]));
export const endingTitle = id => (ENDING[id] ? ENDING[id].title : '');

// ---- state --------------------------------------------------------------------

export function fresh() {
  return { v: VERSION, status: 'idle', night: 1, pending: null, worry: null, answers: {}, homed: 0, walked: 0, dogged: 0, played: 0, skipped: 0,
    credit: 0, bank: { homed: 0, walked: 0, dogged: 0 }, owed: [], freed: 0, started: '', ended: '', ending: null, seen: [], history: [] };
}

const num = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
const str = s => (typeof s === 'string' ? s.slice(0, 40) : '');
const optionOf = (q, id) => (QUESTIONS[q] ? QUESTIONS[q].options.find(o => o.id === id) : undefined);
const isPending = p => p === 'dawn' || (typeof p === 'string' && p.startsWith('ask:') && Boolean(QUESTIONS[p.slice(4)]));

function cleanAnswers(raw) {
  const out = {};
  if (raw && typeof raw === 'object') for (const q of Object.keys(QUESTIONS)) if (optionOf(q, raw[q])) out[q] = raw[q];
  return out;
}

// Whatever is in storage (damaged, older, empty) becomes a usable state.
export function normalize(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object' || raw.v !== VERSION) return s;
  if (['idle', 'active', 'ended'].includes(raw.status)) s.status = raw.status;
  s.night = Math.min(LAST_NIGHT, Math.max(1, num(raw.night) || 1));
  s.pending = isPending(raw.pending) ? raw.pending : null;
  s.worry = WORRIES[raw.worry] ? raw.worry : null;
  s.answers = cleanAnswers(raw.answers);
  s.homed = num(raw.homed); s.walked = num(raw.walked); s.dogged = num(raw.dogged);
  s.played = num(raw.played); s.skipped = Math.min(LAST_NIGHT, num(raw.skipped));
  s.credit = num(raw.credit); s.freed = Math.min(LAST_NIGHT, num(raw.freed));
  s.bank = { homed: num(raw.bank?.homed), walked: num(raw.bank?.walked), dogged: num(raw.bank?.dogged) };
  s.owed = Array.isArray(raw.owed) ? raw.owed.filter(o => o && beatOf(o.night) && WAY_IDS.includes(o.way)).slice(0, BEATS).map(o => ({ night: o.night, way: o.way })) : [];
  s.started = str(raw.started); s.ended = str(raw.ended);
  s.ending = ENDING[raw.ending] ? raw.ending : null;
  s.seen = Array.isArray(raw.seen) ? [...new Set(raw.seen.filter(id => ENDING[id]))] : [];
  if (Array.isArray(raw.history)) {
    s.history = raw.history.slice(0, HISTORY_MAX).map(h => ({
      started: str(h?.started), ended: str(h?.ended), worry: WORRIES[h?.worry] ? h.worry : null, answers: cleanAnswers(h?.answers),
      homed: num(h?.homed), walked: num(h?.walked), dogged: num(h?.dogged), played: num(h?.played), skipped: Math.min(LAST_NIGHT, num(h?.skipped)), freed: Math.min(LAST_NIGHT, num(h?.freed)),
      ending: ENDING[h?.ending] ? h.ending : null,
    }));
  }
  if (s.status === 'ended' && !s.ending) s.status = 'idle';
  if (s.status !== 'active') { s.credit = 0; s.owed = []; s.bank = { homed: 0, walked: 0, dogged: 0 }; }
  return s;
}

export const isActive = s => s.status === 'active';
export const askOf = s => (typeof s.pending === 'string' && s.pending.startsWith('ask:') ? s.pending.slice(4) : null);

// Start a story (the player tapped). An ended one goes into the keepsakes.
export function begin(s, date) {
  const history = s.status === 'ended' ? [keepsake(s), ...s.history].slice(0, HISTORY_MAX) : s.history;
  return { ...fresh(), status: 'active', started: date, seen: s.seen, history };
}

// The fog word: one of WORRIES, or null ("あとで").
export function setWorry(s, id) {
  return { ...s, worry: WORRIES[id] ? id : null };
}

const WAY_IDS = ['home', 'walk', 'dog', 'mix', 'none'];

// Which way the black sheep were mostly treated: home (surrounded), walk
// (whistle), dog, mix (no one way is most), none.
export function way({ homed = 0, walked = 0, dogged = 0 }) {
  const total = homed + walked + dogged;
  if (!total) return 'none';
  const top = Math.max(homed, walked, dogged);
  if (top / total < 0.6) return 'mix';
  return top === homed ? 'home' : top === walked ? 'walk' : 'dog';
}

// What to show before a night (a list of lines, maybe empty), or null (story off,
// not this night, or waiting on an answer).
export function before(s, night) {
  if (!isActive(s) || s.pending || s.night !== night || night < 1 || night > LAST_NIGHT) return null;
  const beat = beatOf(night);
  if (beat) return NIGHTS[beat].before(s);
  return (INTERLUDES[night] && INTERLUDES[night].before) || [];
}

// A night was cleared. c: that night's black sheep { homed, walked, dogged }.
// Returns the new state, the lines for the clear screen, and what waits next:
// 'ask:<question>' (after most of the scenes) or 'dawn' (or null).
export function afterNight(s, night, c = {}) {
  const none = { state: s, after: [], pending: null };
  if (!isActive(s) || s.pending || s.night !== night || night < 1 || night > LAST_NIGHT) return none;
  const counts = { homed: num(c.homed), walked: num(c.walked), dogged: num(c.dogged) };
  const next = { ...s, homed: s.homed + counts.homed, walked: s.walked + counts.walked, dogged: s.dogged + counts.dogged };
  const q = askAfter(night);
  const pending = q ? `ask:${q}` : null;
  next.pending = pending;
  next.night = night === LAST_NIGHT ? LAST_NIGHT : night + 1;
  const beat = beatOf(night);
  const after = beat ? NIGHTS[beat].after(s, way(counts)) : (INTERLUDES[night] && INTERLUDES[night].after) || [];
  return { state: next, after, pending };
}

// A night skipped (a purchase, see purchases.js): it counts as cleared with no black sheep
// treated either way, and is counted in the keepsake. The scenes and questions still come.
export function skipNight(s, night) {
  const r = afterNight(s, night, {});
  return r.state === s ? r : { ...r, state: { ...r.state, skipped: s.skipped + 1 } };
}

// Free play moves the story too (2026-10-17, the owner: progress while playing free play, in the
// gaps, with rests). Every flock put down in free play while the story is on is banked, with the
// black sheep treated; when the bank covers the night's cost (storynights.js), the night passes as
// if it had been played. A scene night that passes this way waits in `owed` to be read, and its
// question waits as after any night. Nothing is lost by resting, and nothing passes while a
// question waits: the bank only grows. gain: { flocks, homed, walked, dogged }. costOf(night): flocks.
export function addCredit(s, gain = {}, costOf = () => Infinity) {
  if (!isActive(s)) return { state: s, passed: [] };
  const g = { flocks: num(gain.flocks), homed: num(gain.homed), walked: num(gain.walked), dogged: num(gain.dogged) };
  let t = g.flocks || g.homed || g.walked || g.dogged
    ? { ...s, credit: s.credit + g.flocks, bank: { homed: s.bank.homed + g.homed, walked: s.bank.walked + g.walked, dogged: s.bank.dogged + g.dogged } }
    : s;
  const passed = [];
  for (;;) {
    const cost = costOf(t.night);
    if (t.pending || !(cost > 0) || t.credit < cost) break;
    const night = t.night;
    const r = afterNight(t, night, t.bank);
    if (r.state === t) break;
    t = { ...r.state, credit: t.credit - cost, bank: { homed: 0, walked: 0, dogged: 0 }, freed: Math.min(LAST_NIGHT, t.freed + 1),
      owed: beatOf(night) ? [...t.owed, { night, way: way(t.bank) }] : t.owed };
    passed.push(night);
  }
  return { state: t, passed };
}

// A scene night that passed in free play, read later: its lines before and after, in one go.
export function sceneLines(s, item) {
  const beat = item ? beatOf(item.night) : 0;
  return beat ? [...NIGHTS[beat].before(s), ...NIGHTS[beat].after(s, item.way)] : [];
}
export const readOwed = s => (s.owed.length ? { ...s, owed: s.owed.slice(1) } : s);

// Time spent playing while the story is on: its nights, and free play (which moves it too), not
// menus or scenes. Kept in the keepsake so the length can be checked against the four hours.
export function addPlayed(s, ms) {
  return ms > 0 && isActive(s) ? { ...s, played: s.played + Math.floor(ms) } : s;
}
export function formatPlayed(ms) {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60}分`;
}

// The look back before the question on the eleventh night.
export function mirror(s) {
  const parts = [];
  if (s.homed) parts.push(`黒い羊を${s.homed}匹、囲んで帰しました。`);
  if (s.walked) parts.push(`${s.walked}匹は、散歩に出ました。`);
  if (s.dogged) parts.push(`${s.dogged}匹は、犬が追い立てました。`);
  return parts.length ? parts.join('') : 'ここまで、黒い羊とは、あまり出会いませんでした。';
}

// The question being asked: { id, prompt: [lines], options: [{ id, label }] }.
export function question(s, id = askOf(s)) {
  const q = QUESTIONS[id];
  if (!q) return null;
  return { id, prompt: q.prompt(s), options: q.options.map(o => ({ id: o.id, label: o.label })) };
}

// The player answered the question that waits. Returns the new state and the sheep's reply.
export function answer(s, optionId) {
  const id = askOf(s);
  const o = id && optionOf(id, optionId);
  if (!o) return { state: s, reply: [] };
  return { state: { ...s, answers: { ...s.answers, [id]: o.id }, pending: id === 'who' ? 'dawn' : null }, reply: o.reply };
}

// ---- reading the answers --------------------------------------------------------

// Where the stance leans: three answers and the way the black sheep were treated.
export function stanceOf(s) {
  const votes = { hold: 0, face: 0, part: 0 };
  for (const q of ['talk', 'sort', 'stop']) {
    const o = optionOf(q, s.answers[q]);
    if (o && o.vote) votes[o.vote] += 1;
  }
  const w = way(s);
  if (w === 'home') votes.hold += 1;
  else if (w === 'walk') votes.part += 1;
  else if (w === 'dog') votes.face += 1;
  return ['hold', 'face', 'part'].reduce((best, k) => (votes[k] > votes[best] ? k : best), 'hold');
}

// The clues the player picked up along the way (the sheep's notes).
export const CLUE_NAMES = { know: '柵の板の文字', listen: '黒い羊の声', record: 'あなたの記録' };
export function cluesOf(s) {
  return [
    s.answers.curio === 'know' && 'know',
    s.answers.talk === 'listen' && 'listen',
    s.answers.wait === 'record' && 'record',
  ].filter(Boolean);
}

const PATTERN = ['core', 'creed', 'talk', 'sort', 'stop', 'step', 'wait', 'who'];
function pattern(s) {
  const at = PATTERN.map(q => (QUESTIONS[q].options.findIndex(o => o.id === s.answers[q])));
  if (at.some(i => i < 0)) return null;
  if (at.every(i => i === 0)) return 'first';
  if (at.every(i => i === 1)) return 'middle';
  if (at.every(i => i === 2)) return 'last';
  return null;
}

// Which of the thirty endings these answers lead to.
export function endingFor(s) {
  const hidden = pattern(s);
  if (hidden) return hidden;
  const genre = (optionOf('who', s.answers.who) || {}).genre || 'plain';
  const core = s.answers.core || 'tie';
  return `${genre}-${core}-${stanceOf(s)}`;
}

// The ending's title and lines for these answers.
export function endingLines(s) {
  const id = endingFor(s);
  const step = optionOf('step', s.answers.step);
  const creed = optionOf('creed', s.answers.creed);
  const tomorrow = [
    ...(creed ? [`あなたは、「${creed.label}」と書きました。`] : []),
    ...(step ? [`あなたが決めた、明日の小さな一歩は、「${step.label}」でしたね。`] : []),
  ];
  if (HIDDEN[id]) return { id, title: HIDDEN[id].title, lines: [...HIDDEN[id].lines, ...tomorrow, ...CLOSING] };
  const { genre, core, stance } = ENDING[id];
  const clues = cluesOf(s);
  const found = clues.length ? clues.map(c => CLUE_LINES[c](genre)) : [NO_CLUES];
  const [name, closer] = TITLES[genre][core][stance];
  return { id, title: name, lines: [...found, ...REVEAL[genre][core], AFTERMATH[genre][stance], closer, ...tomorrow, ...CLOSING] };
}

// The player ends the story (tapped "朝にする" after the last answer).
export function finish(s, date) {
  if (!isActive(s) || s.pending !== 'dawn') return { state: s, title: '', lines: [] };
  const e = endingLines(s);
  const seen = s.seen.includes(e.id) ? s.seen : [...s.seen, e.id];
  return { state: { ...s, status: 'ended', pending: null, ended: date, ending: e.id, seen }, title: e.title, lines: e.lines };
}

// "別の朝を見る": the same night, the last question asked again.
export function reopen(s) {
  if (s.status !== 'ended') return s;
  const answers = { ...s.answers };
  delete answers.who;
  return { ...s, status: 'active', pending: 'ask:who', answers, ending: null, ended: '' };
}

function keepsake(s) {
  return { started: s.started, ended: s.ended, worry: s.worry, answers: s.answers, homed: s.homed, walked: s.walked, dogged: s.dogged, played: s.played, skipped: s.skipped, freed: s.freed, ending: s.ending };
}

// ---- the keepsake: 夜のしおり ---------------------------------------------------

// MOUTON's five steps in the order of the acts, with the question that fills each.
const STAGES = [['在り方', ['core']], ['信念', ['creed']], ['道具', ['sort', 'alarm']], ['引き算', ['stop', 'step']], ['遅れてくるもの', ['wait']]];

// The player's own words, a record of what they chose. Copyable by the
// player; it never leaves the device by itself.
export function shiori(k) {
  const title = endingTitle(k.ending) || '—';
  const chosen = STAGES.flatMap(([stage, qs]) => qs.map(q => {
    const o = optionOf(q, k.answers[q]);
    return o ? [stage, o.label] : null;
  }).filter(Boolean));
  const sheep = [`囲んで ${k.homed}匹`, `散歩 ${k.walked}匹`, `犬 ${k.dogged}匹`].join('・');
  const memo = cluesOf({ answers: k.answers }).map(c => CLUE_NAMES[c]);
  const rows = [
    ['朝の名前', title],
    ['はじまり', k.started || '—'],
    ['おわり', k.ended || '—'],
    ['霧の言葉', k.worry ? WORRIES[k.worry] : 'なし'],
    ['黒い羊', sheep],
    ['遊んだ時間', formatPlayed(k.played || 0)],
    ['とばした夜', `${k.skipped || 0}夜`],
    ['フリープレイで進んだ夜', `${k.freed || 0}夜`],
  ];
  return {
    title: '夜のしおり', rows, chosen, memo,
    text: ['MOUTON・COUNT 夜のしおり', ...rows.map(([a, b]) => `${a}：${b}`), '', 'あなたが選んだ言葉', ...chosen.map(([a, b]) => `${a}：${b}`), ...(memo.length ? ['', `私のメモ：${memo.join('、')}`] : [])].join('\n'),
  };
}

export const lastKeepsake = s => (s.status === 'ended' ? keepsake(s) : s.history[0] || null);

// ---- "考え方の元": where the ideas come from (checked, 2026-10-17) ---------------
// Shown on the "このものがたりについて" page. These are the ideas the questions
// are made from, not claims the story makes; the story only asks.
export const SOURCES = [
  ['在り方（つながり・つくること・遠くへ）', 'Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. Psychological Inquiry, 11(4), 227–268.'],
  ['名前をつけてみる', 'Lieberman, M. D., Eisenberger, N. I., Crockett, M. J., Tom, S. M., Pfeifer, J. H., & Way, B. M. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science, 18(5), 421–428.'],
  ['変えられること・変えられないこと', 'Epictetus. Enchiridion（『提要』）, 1. 邦訳は『人生談義（下）』國方栄二訳、岩波文庫に『要録』として収録。'],
  ['ざわつきの捉え直し', 'Brooks, A. W. (2014). Get excited: Reappraising pre-performance anxiety as excitement. Journal of Experimental Psychology: General, 143(3), 1144–1158.'],
  ['調べつづけること', 'Schwartz, B., Ward, A., Monterosso, J., Lyubomirsky, S., White, K., & Lehman, D. R. (2002). Maximizing versus satisficing: Happiness is a matter of choice. Journal of Personality and Social Psychology, 83(5), 1178–1197.（結果は「関連」であり、原因を示すものではありません）'],
  ['自分を責めること', 'Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. Self and Identity, 2(2), 85–101.'],
  ['明日の一歩（いつ・どこで）', 'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493–503.'],
  ['変わらないように見える時期', 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.'],
  ['別の朝を見る（語り直し）', 'McAdams, D. P. (2001). The psychology of life stories. Review of General Psychology, 5, 100–122.'],
  ['不安は、自由のめまい', 'Kierkegaard, S. (1844). Begrebet Angest（『不安の概念』）.'],
];
export const ABOUT = [
  'このものがたりは、診断でも、心理テストでもありません。結果であなたを決めつけることはしません。',
  'ここにある問いは、考えるきっかけです。答えは、ひとつではありません。どれを選んでも、朝は来ます。',
  '選んだ言葉は、この端末の中だけに残ります。どこにも送りません。',
  CARE,
];
