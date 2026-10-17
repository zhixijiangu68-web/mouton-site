// The two things that can be bought, both once (non-consumable): skipping
// the story's nights, and no ads. No consumables, no tickets, no timers.
//
// This file only holds the logic. services.js hands it the real store plugin
// (the app) or nothing (the browser). With no plugin and no test switch,
// nothing is offered at all: a button that cannot work is not shown.
//
// App: the plugin is @capgo/native-purchases (v8 for Capacitor 8; its README
// shows isBillingSupported, getProducts, purchaseProduct, restorePurchases and
// getPurchases). It is NOT installed yet: see docs/length-and-purchases.md.
// Browser: `?test-purchases` in the address makes a stand-in that "buys" for
// free and only on that device, to try the screens. It never runs in the app.

export const ENT_KEY = 'mouton.sheep.ent';

// What is sold, in the player's words. Shown once, plainly, in the purchase
// screen; never as a pop-up. (Prices come from the store.)
export const WARES = {
  skip: {
    name: '夜をとばす',
    text: 'ものがたりの夜を、遊ばずにとばせるようになります。ものがたりの文・質問・結末はとばせません。とばした夜の数は、夜のしおりに残ります。',
  },
  noads: {
    name: '広告なし',
    text: '「広告を見て」のボタンが、広告なしでそのままもらえるようになります（もらえる回数はそのまま）。',
  },
};
export const WARE_IDS = Object.keys(WARES);

export const FREE_NOTE = '買わなくても、ものがたりは最後まで遊べます。';

const clean = raw => {
  const out = {};
  if (raw && typeof raw === 'object') for (const id of WARE_IDS) if (raw[id] === true) out[id] = true;
  return out;
};

// ids: { skip: 'store product id', noads: '...' }. plugin: the store plugin, or null.
// storage: { get(key, fallback), set(key, value) }.
export function createPurchases({ plugin = null, storage, test = false, ids }) {
  let owned = clean(storage.get(ENT_KEY, {}));
  let prices = {};
  let supported = false;
  const mode = test ? 'test' : plugin ? 'native' : 'none';
  const listeners = [];
  const grant = id => {
    if (!WARES[id] || owned[id]) return false;
    owned = { ...owned, [id]: true };
    storage.set(ENT_KEY, owned);
    for (const fn of listeners) fn(id);
    return true;
  };
  const idOf = product => WARE_IDS.find(id => ids[id] === product);
  const fromStore = async () => {
    const { purchases = [] } = await plugin.getPurchases({ productType: 'inapp' });
    for (const p of purchases) { const id = idOf(p.productIdentifier); if (id) grant(id); }
  };

  return {
    mode,
    available: () => mode === 'test' || (mode === 'native' && supported),
    owns: id => Boolean(owned[id]),
    price: id => (mode === 'test' ? 'テスト（無料）' : prices[id] || ''),
    onChange: fn => { listeners.push(fn); },

    // At launch (app): is billing possible, what do the products cost, what is already bought.
    async load() {
      if (mode !== 'native') return;
      try {
        const { isBillingSupported } = await plugin.isBillingSupported();
        if (!isBillingSupported) return;
        const { products = [] } = await plugin.getProducts({ productIdentifiers: WARE_IDS.map(id => ids[id]), productType: 'inapp' });
        for (const p of products) { const id = idOf(p.identifier); if (id) prices[id] = p.priceString || ''; }
        supported = WARE_IDS.some(id => prices[id]);      // nothing is offered until the store knows the products
        await fromStore().catch(() => {});
      } catch {
        supported = false;
      }
    },

    // -> { ok: true } | { ok: false, reason: 'unavailable' | 'cancelled' | 'failed' }
    async buy(id) {
      if (!WARES[id]) return { ok: false, reason: 'unavailable' };
      if (owned[id]) return { ok: true };
      if (mode === 'test') { grant(id); return { ok: true }; }
      if (mode !== 'native' || !supported) return { ok: false, reason: 'unavailable' };
      try {
        await plugin.purchaseProduct({ productIdentifier: ids[id], productType: 'inapp', quantity: 1 });
        grant(id);
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: /cancel/i.test(String(e?.message || e)) ? 'cancelled' : 'failed' };
      }
    },

    // For a new phone or a reinstall. -> { ok, found: [ids owned now] }
    async restore() {
      if (mode === 'test') return { ok: true, found: WARE_IDS.filter(id => owned[id]) };
      if (mode !== 'native') return { ok: false, found: [] };
      try {
        await plugin.restorePurchases();
        await fromStore();
        return { ok: true, found: WARE_IDS.filter(id => owned[id]) };
      } catch {
        return { ok: false, found: [] };
      }
    },
  };
}
