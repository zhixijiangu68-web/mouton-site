// 引き継ぎ (moving to a new phone): everything the game keeps on the device,
// made into one piece of text that the player copies and pastes, with no
// account and no server. Pure logic; main.js does the copying and the loading.
//
// Purchases are NOT in the code: they come back from the store ("購入の復元"),
// so a code cannot be passed around to unlock them.

export const PREFIX = 'mouton.sheep.';
export const EXCLUDED = ['mouton.sheep.ent'];
const MAGIC = 'MOUTON1';
const MAX_CODE = 600000;
const MAX_ENTRIES = 40;
const KEY = /^mouton\.sheep\.[a-z0-9.]+$/;

// A small check so that a code that was cut or mistyped is told apart from a good one.
export function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

const toBase64Url = text => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = text => {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

// Which saved keys go into a code.
export const wanted = key => key.startsWith(PREFIX) && !EXCLUDED.includes(key) && KEY.test(key);

// entries: { key: stored text } (what localStorage holds). -> the code.
export function pack(entries, date = '') {
  const data = {};
  for (const [k, v] of Object.entries(entries)) if (wanted(k) && typeof v === 'string') data[k] = v;
  const body = toBase64Url(JSON.stringify({ v: 1, t: String(date).slice(0, 10), d: data }));
  return `${MAGIC}.${body}.${checksum(body)}`;
}

// -> { ok: true, entries, date } or { ok: false, reason: 'empty' | 'format' | 'damaged' | 'version' | 'invalid' }
export function unpack(code) {
  const text = String(code || '').trim().replace(/\s+/g, '');
  if (!text) return { ok: false, reason: 'empty' };
  const parts = text.split('.');
  if (parts.length !== 3 || parts[0] !== MAGIC || text.length > MAX_CODE) return { ok: false, reason: 'format' };
  if (checksum(parts[1]) !== parts[2]) return { ok: false, reason: 'damaged' };
  let data;
  try { data = JSON.parse(fromBase64Url(parts[1])); } catch { return { ok: false, reason: 'damaged' }; }
  if (!data || data.v !== 1 || typeof data.d !== 'object' || data.d === null || Array.isArray(data.d)) return { ok: false, reason: 'version' };
  const entries = {};
  const keys = Object.keys(data.d);
  if (keys.length > MAX_ENTRIES) return { ok: false, reason: 'invalid' };
  for (const k of keys) {
    if (EXCLUDED.includes(k)) continue;               // purchases never come from a code
    if (!KEY.test(k) || typeof data.d[k] !== 'string') return { ok: false, reason: 'invalid' };
    try { JSON.parse(data.d[k]); } catch { return { ok: false, reason: 'invalid' }; }
    entries[k] = data.d[k];
  }
  return { ok: true, entries, date: typeof data.t === 'string' ? data.t : '' };
}

const parse = text => { try { return JSON.parse(text); } catch { return null; } };

// A few facts about what a code holds, so the player sees what will be replaced.
export function summarize(entries) {
  const story = parse(entries['mouton.sheep.story']) || {};
  const wallet = parse(entries['mouton.sheep.wallet']) || {};
  const night = Number.isFinite(story.night) ? story.night : 0;
  return {
    story: story.status === 'ended' ? 'ended' : story.status === 'active' ? 'active' : 'none',
    night,
    played: Number.isFinite(story.played) ? story.played : 0,
    wool: Number.isFinite(wallet.wool) ? wallet.wool : 0,
    keys: Object.keys(entries).length,
  };
}

// Replace what is saved here with what the code holds: first remove the saved
// keys (all but purchases), then write the code's. io: { keys(), set(k, v), remove(k) }.
export function apply(entries, io) {
  for (const k of io.keys()) if (wanted(k)) io.remove(k);
  for (const [k, v] of Object.entries(entries)) io.set(k, v);
  return Object.keys(entries).length;
}
