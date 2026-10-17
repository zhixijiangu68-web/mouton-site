// Wool: the points kept between nights. Every sheep counted in a night adds
// one wool; wool buys new looks for the sheep. Rules only (no screen), so
// tests/wool.test.mjs can check them.

// Looks for the sheep, cheapest first. Every look has a light version (the
// white sheep) and a dark one (the black sheep), so the game reads the same.
export const SKINS = [
  { id: 'sheep', name: 'ひつじ', price: 0, note: 'いつもの羊' },
  { id: 'sleepy', name: 'ねむりひつじ', price: 200, note: 'もう半分ねている' },
  { id: 'yarn', name: '毛糸玉', price: 500, note: '羊毛を、丸めて' },
  { id: 'cloud', name: 'くも', price: 800, note: '夜空にうかぶ' },
  { id: 'star', name: 'ほしひつじ', price: 1200, note: '毛に星がとまる' },
  { id: 'gold', name: '金の羊毛', price: 2000, note: '伝説の羊' },
];
export const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];

export class Wallet {
  constructor(saved = {}) {
    this.wool = Math.max(0, Math.floor(saved.wool || 0));
    this.owned = new Set(['sheep', ...(Array.isArray(saved.owned) ? saved.owned : [])].filter(id => SKINS.some(s => s.id === id)));
    this.skin = this.owned.has(saved.skin) ? saved.skin : 'sheep';
  }

  toJSON() { return { wool: this.wool, owned: [...this.owned], skin: this.skin }; }

  earn(n) {
    const add = Math.max(0, Math.floor(n));
    this.wool += add;
    return add;
  }

  canBuy(id) {
    const skin = SKINS.find(s => s.id === id);
    return Boolean(skin) && !this.owned.has(id) && this.wool >= skin.price;
  }

  // Buying a look also puts it on.
  buy(id) {
    if (!this.canBuy(id)) return false;
    this.wool -= skinById(id).price;
    this.owned.add(id);
    this.skin = id;
    return true;
  }

  wear(id) {
    if (!this.owned.has(id)) return false;
    this.skin = id;
    return true;
  }
}
