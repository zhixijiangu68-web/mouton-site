// The player's record across nights: totals, the shepherd rank, achievements
// and a calendar of nights played. Rules only; tests/profile.test.mjs checks them.
//
// Things this game will never do (see docs/design.md): no paid random draws,
// no penalty for days off, no notifications, no ads the player did not choose.
// Nothing here is lost by taking a break.

// Ranks by sheep counted over all nights. Each new rank gives wool once.
export const RANKS = [
  { name: '見習い羊飼い', at: 0, wool: 0 },
  { name: '羊飼い', at: 300, wool: 50 },
  { name: '一人前の羊飼い', at: 1000, wool: 100 },
  { name: '腕利きの羊飼い', at: 2500, wool: 150 },
  { name: '夜の名人', at: 5000, wool: 200 },
  { name: '月の羊飼い', at: 10000, wool: 300 },
  { name: '伝説の羊飼い', at: 20000, wool: 500 },
];

export function rankOf(total) {
  let i = 0;
  while (i < RANKS.length - 1 && total >= RANKS[i + 1].at) i++;
  const next = RANKS[i + 1] || null;
  const progress = next ? (total - RANKS[i].at) / (next.at - RANKS[i].at) : 1;
  return { index: i, rank: RANKS[i], next, progress, toNext: next ? next.at - total : 0 };
}

// s: lifetime numbers (see Profile.stats) with the best single-night values.
export const ACHIEVEMENTS = [
  { id: 'row', name: '最初の1列', text: '列を1回そろえる', wool: 20, test: s => s.rows >= 1 },
  { id: 'black1', name: '黒い羊、おかえり', text: '黒い羊を1匹帰す', wool: 30, test: s => s.blacks >= 1 },
  { id: 'black50', name: '黒い羊の友だち', text: '黒い羊を通算50匹帰す', wool: 150, test: s => s.blacks >= 50 },
  { id: 'chain3', name: '3れんさ', text: '3れんさを起こす', wool: 60, test: s => s.bestChain >= 3 },
  { id: 'chain5', name: '5れんさ', text: '5れんさを起こす', wool: 200, test: s => s.bestChain >= 5 },
  { id: 'streak5', name: '5連続', text: '5回続けて列を消す', wool: 60, test: s => s.bestStreak >= 5 },
  { id: 'streak10', name: '10連続', text: '10回続けて列を消す', wool: 200, test: s => s.bestStreak >= 10 },
  { id: 'gold1', name: '金の羊', text: '金の羊を数える', wool: 50, test: s => s.golds >= 1 },
  { id: 'gold20', name: '金の羊飼い', text: '金の羊を通算20匹数える', wool: 200, test: s => s.golds >= 20 },
  { id: 'moon', name: '満月', text: '満月を見る（3列いっしょ・3れんさ）', wool: 80, test: s => s.moons >= 1 },
  { id: 'perfect', name: 'からっぽの牧場', text: '牧場の羊をぜんぶ消す', wool: 100, test: s => s.perfects >= 1 },
  { id: 'star', name: '流れ星に願いを', text: '流れ星の間に列を消す', wool: 40, test: s => s.starClears >= 1 },
  { id: 'dawn', name: '朝まで数えた', text: '1夜で160匹数える', wool: 100, test: s => s.bestNight >= 160 },
  { id: 'night300', name: '眠れない夜', text: '1夜で300匹数える', wool: 200, test: s => s.bestNight >= 300 },
  { id: 'nights10', name: '10の夜', text: '10回遊ぶ', wool: 50, test: s => s.nights >= 10 },
  { id: 'week', name: '7日の記録', text: '7つの日に遊ぶ', wool: 100, test: s => s.days >= 7 },
  { id: 'quests', name: '15の夜', text: 'クエストを全部クリア', wool: 300, test: s => s.questsCleared >= 15 },
  { id: 'stars45', name: '満天の星', text: 'クエストの★を45個', wool: 500, test: s => s.questStars >= 45 },
];

const SUMS = ['total', 'rows', 'blacks', 'golds', 'moons', 'perfects', 'starClears'];
const MAXES = ['bestChain', 'bestStreak', 'bestNight'];

// What a game has added so far, as numbers the profile adds up.
export const gameStats = g => ({
  total: g.count, rows: g.rows, blacks: g.blacks, golds: g.golds, moons: g.moons,
  perfects: g.perfects, starClears: g.starClears, bestChain: g.best, bestStreak: g.bestStreak, bestNight: g.count,
});

export class Profile {
  constructor(saved = {}) {
    const st = saved.stats || {};
    this.stats = { nights: st.nights || 0 };
    for (const k of [...SUMS, ...MAXES]) this.stats[k] = Math.max(0, st[k] || 0);
    this.done = new Set(Array.isArray(saved.done) ? saved.done : []);
    this.days = saved.days && typeof saved.days === 'object' ? { ...saved.days } : {};
  }

  toJSON() { return { stats: this.stats, done: [...this.done], days: this.days }; }

  // Add what happened since the last call: now is gameStats(game) now, before
  // is gameStats(game) at the last call (or zeros for a new game).
  // Returns new ranks and achievements, and the wool they give.
  absorb(now, before, date, quests = {}) {
    const rankBefore = rankOf(this.stats.total).index;
    for (const k of SUMS) this.stats[k] += Math.max(0, now[k] - (before[k] || 0));
    for (const k of MAXES) this.stats[k] = Math.max(this.stats[k], now[k]);
    const added = Math.max(0, now.total - (before.total || 0));
    if (added) {
      const day = this.days[date] || { count: 0, plays: 0 };
      this.days[date] = { ...day, count: day.count + added };
    }
    return this.rewards(rankBefore, quests);
  }

  // A night (free play or a quest) was started on this date.
  played(date) {
    const day = this.days[date] || { count: 0, plays: 0 };
    this.days[date] = { ...day, plays: day.plays + 1 };
  }

  // A night ended.
  finished(quests = {}) {
    this.stats.nights += 1;
    return this.rewards(rankOf(this.stats.total).index, quests);
  }

  view(quests = {}) {
    const results = Object.values(quests);
    return {
      ...this.stats,
      days: Object.keys(this.days).length,
      questsCleared: results.filter(n => n > 0).length,
      questStars: results.reduce((a, b) => a + b, 0),
    };
  }

  rewards(rankBefore, quests) {
    const rankNow = rankOf(this.stats.total).index;
    const ranks = RANKS.slice(rankBefore + 1, rankNow + 1);
    const s = this.view(quests);
    const earned = ACHIEVEMENTS.filter(a => !this.done.has(a.id) && a.test(s));
    for (const a of earned) this.done.add(a.id);
    const wool = ranks.reduce((n, r) => n + r.wool, 0) + earned.reduce((n, a) => n + a.wool, 0);
    return { ranks, achievements: earned, wool };
  }
}

// Where the moon is in its cycle on a date: 0 new, 0.5 full, back to 1.
// Counted from a known new moon (2000-01-06 18:14 UTC); the cycle is 29.53 days.
export function moonPhase(date) {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const p = (days / 29.530588853) % 1;
  return p < 0 ? p + 1 : p;
}

// The local date as YYYY-MM-DD.
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// A gentle word after long play: after 20 minutes late at night (23:00–5:00),
// or after an hour at any time. Once per session; never stops the game.
export function goodnightMessage(hour, playMs, alreadySaid) {
  if (alreadySaid) return '';
  const late = hour >= 23 || hour < 5;
  if (late && playMs > 20 * 60000) return 'もう遅い時間です。今夜はこのへんで、おやすみなさい。';
  if (playMs > 60 * 60000) return 'たくさん数えました。少し目を休めませんか。';
  return '';
}
