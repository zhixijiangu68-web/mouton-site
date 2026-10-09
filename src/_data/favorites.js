// 運営者のお気に入り（favorites.html）。順位は運営者の好みで、効果や安全性の順位ではない。
// tier を書き換えれば並びが変わる。note に運営者のひとことを書くと、カードに出る。
// article は関連する記事のファイル名。記事がまだない（公開前の）ときは、リンクを出さない。
export default {
  updated: '2026-10-09',
  tiers: [
    { tier: 'S', label: '手放せない' },
    { tier: 'A', label: 'かなり好き' },
    { tier: 'B', label: '好き' },
    { tier: 'C', label: 'ときどき' },
  ],
  items: [
    { name: '百草丸', tier: 'S', kind: '医薬品', what: 'オウバク（キハダの樹皮）を中心にした生薬の胃腸薬。木曽御嶽山のふもとで受け継がれてきた。', note: '' },
    { name: 'EGCG', tier: 'S', kind: '成分', what: '緑茶に多いカテキンの一種。', note: '', article: 'egcg-soy-dht' },
    { name: 'コーヒー', tier: 'A', kind: '食品', what: '淹れ方で、体への影響が変わる飲み物。', note: '', article: 'coffee-guide' },
    { name: 'ブルーベリー', tier: 'B', kind: '食品', what: 'アントシアニンを多く含む果物。', note: '', article: 'blueberry' },
    { name: 'チロシン', tier: 'B', kind: '成分', what: 'アミノ酸の一種。ドーパミンの材料になる。', note: '', article: 'tyrosine-androgen' },
    { name: 'グルタミン', tier: 'B', kind: '成分', what: 'アミノ酸の一種。', note: '' },
    { name: 'アスピリン', tier: 'C', kind: '医薬品', what: '解熱鎮痛薬。血を固まりにくくする働きもある。', note: '', article: 'aspirin' },
    { name: 'クレアチン', tier: 'C', kind: '成分', what: '筋肉でエネルギーを素早く作るのにかかわる物質。', note: '' },
  ],
};
