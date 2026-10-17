// MOUTON・COUNT: ものがたり (the story). Rules and words only, no screen;
// main.js shows it and tests/story.test.mjs checks it.
//
// The story rides on the fifteen quest nights. It is optional: the player
// starts it from the quest list, and nothing else in the game changes. While
// it is on, each night has a line before and a line after, and the way the
// player treats the black sheep (surround them and send them home, walk them
// off with the whistle, or drive them off with the dog) decides how the story
// reads. Skill never decides it: only clearing a night moves it on, and no
// ending is better than another. Nothing is lost by taking a break.
//
// Words follow BRAND.md of mouton-site: no orders, no "right way", no
// promises about health (a test checks the lines for that).

export const LAST_NIGHT = 15;
export const ASK_NIGHT = 11;               // end of the second act: the question
const HISTORY_MAX = 5;

// What is in the fog tonight. Chosen once, on a tap; it can be skipped.
export const WORDS = ['決められないこと', '人にどう思われるか', '続かない自分', '言葉にならないもの', 'いまは、見たくない'];
const NO_WORD = 'いまは、見たくない';

export const VIEWS = [
  { id: 'thing', label: 'そういうものかもしれない', reply: 'そういう夜もある。黒い羊は、羊の群れの一部なのかもしれない。' },
  { id: 'eye', label: '気にするほど、目に入るのかもしれない', reply: '見る目が、羊の数を変えることもある。' },
  { id: 'unknown', label: 'まだ、わからない', reply: 'わからないままで、次の夜へ行ける。' },
];

export const PROLOGUE = [
  '眠れない夜がある。理由を言葉にできないまま、天井を見ている夜が。',
  '羊を数えれば、眠れるのかもしれない。数えてみることにした。',
  'この夜を始めるのは、あなた。',
];
export const WORD_ASK = '頭のなかに、霧のようなものがあります。いま、いちばん近いのは。';
export const WORD_REPLY = {
  named: '霧に、名前がついた。',
  none: '名前がなくても、数えていける。',
};
export const VIEW_ASK = '数えても、黒い羊は残る。それは——';
export const DAWN = ['160匹。空が、白んでいく。', 'この夜を終わらせるのは、あなた。'];
export const CLOSING = ['霧は、薄くなった。消えたわけではない。それでも、朝は来た。', 'この夜を終わらせたのは、あなた。'];
export const CARE = '眠れない夜や、つらい気持ちが長く続くときは、身近な人や、医師・相談窓口に話してみるのも一つです。';

// {word} becomes the chosen word in quotes, or "あの霧" when none was chosen.
// after: one line, or one per way the night's black sheep were handled.
export const NIGHTS = {
  1: { before: '羊が一匹、柵の前に立っている。まずは、1列そろえてみる。',
    after: '1列そろうと、羊は柵を跳んだ。数えているあいだは、考えごとが少し静かだった。' },
  2: { before: '数える手は、だんだん慣れてくる。',
    after: '静かな時間は、長くは続かない。ふと、{word}のことを思い出した。' },
  3: { before: '20匹。数えれば数えるほど、夜は更けていく。',
    after: '数えても、霧は晴れなかった。それでも、数えているあいだは、息がしやすかった。' },
  4: { before: '列がそろっても、残る羊がいる。黒い羊。数えても、数に入らないもの。',
    after: {
      home: '黒い羊を、白い羊で囲んだ。囲まれた黒い羊は、帰っていった。',
      walk: '黒い羊を、散歩に出した。どこへ行ったのかは、羊にしか分からない。',
      dog: '犬が、黒い羊ごと追い立てた。夜は、そのまま続いた。',
      mix: '黒い羊の帰し方は、一つではなかった。',
      none: '黒い羊は、数に入らないまま、夜の中にいた。',
    } },
  5: { before: 'ひとつ動くと、ほかの羊も動く。続けて動くことがある。',
    after: 'ひとつ跳んだら、続けて跳んだ。きっかけは、小さくてもよかった。' },
  6: { before: '夜は、まだ半分も過ぎていない。',
    after: '30匹。数えながら、黒い羊のことを考えていた。' },
  7: { before: '黒い羊は、一匹では終わらなかった。',
    after: {
      home: '二匹とも、囲んで帰した。白い羊が、そばにいてくれた。',
      walk: '何匹かは、散歩に出した。牧場の外にも、夜はある。',
      dog: '犬に任せた夜だった。夜は、少し早く進んだ。',
      mix: '帰し方は、いろいろだった。',
      none: '黒い羊は、また夜の中にいた。',
    } },
  8: { before: '手を動かしているあいだ、考えごとは静かになる。静かになるだけで、消えたわけではない。',
    after: '4列。霧は、まだそこにある。' },
  9: { before: '白い羊のあいだに、黒い羊がまじっている。いつから、いたのだろう。',
    after: '50匹。黒い羊は、ふえたり、帰ったりしていた。' },
  10: { before: '積もったものが、高く見える夜がある。',
    after: '高く見えたのは、積んだ羊のせいか。見ている目のせいか。' },
  11: { before: '黒い羊が、三匹。ここまで、いろいろな帰し方をしてきた。',
    after: '三匹。夜の半分は、もう過ぎた。' },
  12: { before: '60匹。夜は、いちばん深いところを通る。',
    after: '深い夜を、数えて抜けた。霧の向こうに、うすく空が見える。' },
  13: { before: '6列。そろえ続けた手は、もう覚えている。',
    after: '霧は、さっきより薄い。消えたわけではない。' },
  14: { before: '黒い羊が、群れで来た。',
    after: {
      home: '四匹とも、囲んで帰した。囲まれた羊は、静かに帰っていった。',
      walk: '何匹かは、散歩に出した。戻ってくるかは、また別の夜のこと。',
      dog: '犬が追った。それでも、夜は進んだ。',
      mix: '帰し方は、いろいろだった。どれも、この夜の羊の帰し方。',
      none: '黒い羊の群れは、夜の中にいた。',
    } },
  15: { before: '最後の夜。160匹で、朝になる。',
    after: '160匹。数えきった。' },
};

// How the morning is named and told, by how the black sheep were treated over all the nights.
export const ENDINGS = {
  home: { name: '囲んだ朝', text: '黒い羊は、囲まれて、帰っていった。数えても残るものと、一緒に朝まで来た。' },
  walk: { name: '散歩の朝', text: '黒い羊の多くは、散歩に出た。戻ってくるかどうかは、また別の夜のこと。' },
  dog: { name: '追い立てた朝', text: '犬に任せて、数えきった。急いだ夜にも、朝は来る。' },
  mix: { name: 'いろいろな朝', text: '帰し方は、いろいろだった。どれも、あなたの夜のやり方。' },
  none: { name: '静かな朝', text: '黒い羊に会わないまま、朝が来た。' },
};
const VIEW_LINE = { thing: '黒い羊は、羊の群れの一部なのかもしれない。', eye: '見る目が、羊の数を変えることもある。', unknown: 'わからないままでも、朝は来る。' };

export function fresh() {
  return { v: 1, status: 'idle', night: 1, pending: null, word: null, view: null, homed: 0, walked: 0, dogged: 0, started: '', ended: '', ending: null, history: [] };
}

const num = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
const str = s => (typeof s === 'string' ? s.slice(0, 40) : '');

// Whatever is in storage (damaged, older, empty) becomes a usable state.
export function normalize(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  if (['idle', 'active', 'ended'].includes(raw.status)) s.status = raw.status;
  s.night = Math.min(LAST_NIGHT, Math.max(1, num(raw.night) || 1));
  s.pending = raw.pending === 'ask' || raw.pending === 'dawn' ? raw.pending : null;
  s.word = WORDS.includes(raw.word) ? raw.word : null;
  s.view = VIEWS.some(v => v.id === raw.view) ? raw.view : null;
  s.homed = num(raw.homed); s.walked = num(raw.walked); s.dogged = num(raw.dogged);
  s.started = str(raw.started); s.ended = str(raw.ended);
  s.ending = ENDINGS[raw.ending] ? raw.ending : null;
  if (Array.isArray(raw.history)) {
    s.history = raw.history.slice(0, HISTORY_MAX).map(h => ({
      started: str(h?.started), ended: str(h?.ended), word: WORDS.includes(h?.word) ? h.word : null,
      homed: num(h?.homed), walked: num(h?.walked), dogged: num(h?.dogged), ending: ENDINGS[h?.ending] ? h.ending : 'none',
    }));
  }
  if (s.status === 'ended' && !s.ending) s.status = 'idle';
  return s;
}

export const isActive = s => s.status === 'active';

// Start a story (the player tapped). An ended one goes into the keepsakes.
export function begin(s, date) {
  const history = s.status === 'ended' ? [keepsake(s), ...s.history].slice(0, HISTORY_MAX) : s.history;
  return { ...fresh(), status: 'active', started: date, history };
}

export function chooseWord(s, word) {
  return { ...s, word: WORDS.includes(word) ? word : null };
}

const wordPhrase = s => (s.word && s.word !== NO_WORD ? `「${s.word}」` : 'あの霧');
const fill = (text, s) => text.replaceAll('{word}', wordPhrase(s));

// Which way the black sheep were mostly treated: home (surrounded), walk
// (whistle), dog, mix (no one way is most), none.
export function way({ homed = 0, walked = 0, dogged = 0 }) {
  const total = homed + walked + dogged;
  if (!total) return 'none';
  const top = Math.max(homed, walked, dogged);
  if (top / total < 0.6) return 'mix';
  return top === homed ? 'home' : top === walked ? 'walk' : 'dog';
}

// What to show before a night, or null (story off, not this night, or waiting on a choice).
export function before(s, night) {
  if (!isActive(s) || s.pending || s.night !== night || !NIGHTS[night]) return null;
  return fill(NIGHTS[night].before, s);
}

// A night was cleared. c: that night's black sheep { homed, walked, dogged }.
// Returns the new state and what to show: `after` (a line), then `pending`
// ('ask': the question after the eleventh night; 'dawn': the last night).
export function afterNight(s, night, c = {}) {
  const none = { state: s, after: '', pending: null };
  if (!isActive(s) || s.pending || s.night !== night || !NIGHTS[night]) return none;
  const counts = { homed: num(c.homed), walked: num(c.walked), dogged: num(c.dogged) };
  const next = { ...s, homed: s.homed + counts.homed, walked: s.walked + counts.walked, dogged: s.dogged + counts.dogged };
  const line = NIGHTS[night].after;
  const text = typeof line === 'string' ? line : line[way(counts)] || line.mix;
  let pending = null;
  if (night === LAST_NIGHT) pending = 'dawn';
  else if (night === ASK_NIGHT) pending = 'ask';
  next.pending = pending;
  next.night = night === LAST_NIGHT ? LAST_NIGHT : night + 1;
  return { state: next, after: fill(text, s), pending };
}

// The look back before the question: what the player did with the black sheep.
export function mirror(s) {
  const parts = [];
  if (s.homed) parts.push(`黒い羊を${s.homed}匹、囲んで帰した。`);
  if (s.walked) parts.push(`${s.walked}匹は、散歩に出た。`);
  if (s.dogged) parts.push(`${s.dogged}匹は、犬が追い立てた。`);
  return parts.length ? parts.join('') : 'ここまで、黒い羊とは、あまり出会わなかった。';
}

export function answer(s, id) {
  const v = VIEWS.find(x => x.id === id);
  if (!v || s.pending !== 'ask') return { state: s, reply: '' };
  return { state: { ...s, view: v.id, pending: null }, reply: v.reply };
}

// The player ends the story (tapped "朝にする" after the last night).
export function finish(s, date) {
  if (!isActive(s) || s.pending !== 'dawn') return { state: s, lines: [] };
  const ending = way(s);
  const state = { ...s, status: 'ended', pending: null, ended: date, ending };
  const lines = [ENDINGS[ending].text, ...(s.view ? [VIEW_LINE[s.view]] : []), ...CLOSING];
  return { state, lines };
}

function keepsake(s) {
  return { started: s.started, ended: s.ended, word: s.word, homed: s.homed, walked: s.walked, dogged: s.dogged, ending: s.ending || 'none' };
}

// 夜のしおり: the player's own record of a story. Shown on the device and
// copyable by the player; it never leaves the device by itself.
export function shiori(k) {
  const e = ENDINGS[k.ending] || ENDINGS.none;
  const sheep = [`囲んで ${k.homed}匹`, `散歩 ${k.walked}匹`, `犬 ${k.dogged}匹`].join('・');
  const rows = [
    ['朝の名前', e.name],
    ['はじまり', k.started || '—'],
    ['おわり', k.ended || '—'],
    ['霧の言葉', k.word || 'なし'],
    ['黒い羊', sheep],
  ];
  return { title: '夜のしおり', rows, text: ['MOUTON・COUNT 夜のしおり', ...rows.map(([a, b]) => `${a}：${b}`)].join('\n') };
}

export const lastKeepsake = s => (s.status === 'ended' ? keepsake(s) : s.history[0] || null);
