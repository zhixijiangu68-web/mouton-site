// What the game needs from the outside world, behind small interfaces: storage,
// rewarded ads, the ranking (this device), vibration and the back button.
// In the app (Capacitor) they use the phone's own features; in a browser,
// the browser's (and a stand-in screen for ads).
import { ADMOB_REWARDED } from './config.js';

// Capacitor puts its bridge and the installed plugins on window.Capacitor.
const cap = globalThis.Capacitor;
export const native = Boolean(cap?.isNativePlatform?.());
export const platform = native ? cap.getPlatform() : 'web';
const plugin = name => (native ? cap.Plugins?.[name] || null : null);
const Preferences = plugin('Preferences');
const Haptics = plugin('Haptics');
const AdMob = plugin('AdMob');
const App = plugin('App');

// Saves live in localStorage, which the game reads at once. In the app they
// are also kept with the phone's own storage (Preferences), which the system
// does not clear; at launch they are copied back before the game starts.
const PREFIX = 'mouton.';
if (Preferences) {
  try {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      if (!key.startsWith(PREFIX)) continue;
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) localStorage.setItem(key, value);
    }
  } catch {}
}

export const storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    const text = JSON.stringify(value);
    try { localStorage.setItem(key, text); } catch {}
    Preferences?.set({ key, value: text }).catch(() => {});
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
    Preferences?.remove({ key }).catch(() => {});
  },
};

// Rewarded ads. In the app: AdMob, with ads that are not personalized (no
// tracking, so no tracking prompt on iPhone). One ad is loaded ahead; the
// reward is given only if the ad was watched to the end (AdMob says so).
const adUnit = ADMOB_REWARDED[platform];
const nativeAds = {
  started: false,
  ready: false,
  loading: false,
  async start() {
    if (this.started) return;
    this.started = true;
    try {
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === 'REQUIRED') consent = await AdMob.showConsentForm();
      if (consent.canRequestAds === false) return;
      await AdMob.initialize({ maxAdContentRating: 'ParentalGuidance' });
      this.load();
    } catch {
      this.started = false;
    }
  },
  load() {
    if (this.ready || this.loading) return;
    this.loading = true;
    AdMob.prepareRewardVideoAd({ adId: adUnit, npa: true })
      .then(() => { this.ready = true; })
      .catch(() => { setTimeout(() => this.load(), 60000); })
      .finally(() => { this.loading = false; });
  },
  show() {
    if (!this.ready) return Promise.resolve(false);
    this.ready = false;
    return new Promise(resolve => {
      let earned = false;
      let settled = false;
      const subs = [];
      const done = ok => {
        if (settled) return;
        settled = true;
        for (const s of subs) Promise.resolve(s).then(h => h?.remove?.()).catch(() => {});
        this.load();
        resolve(ok);
      };
      subs.push(AdMob.addListener('onRewardedVideoAdReward', () => { earned = true; }));
      subs.push(AdMob.addListener('onRewardedVideoAdDismissed', () => done(earned)));
      subs.push(AdMob.addListener('onRewardedVideoAdFailedToShow', () => done(false)));
      AdMob.showRewardVideoAd().then(() => { earned = true; }).catch(() => done(false));
    });
  },
};

export const ads = AdMob && adUnit ? {
  prepare: () => nativeAds.start(),
  available: () => nativeAds.ready,
  showRewarded: () => nativeAds.show(),
} : {
  prepare() {},
  available: () => true,
  // Stand-in for a rewarded ad: a three-second screen that says it is a test.
  // Resolves true only when it was watched to the end.
  showRewarded(host) {
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.className = 'ad-mock';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', '試作の広告');
      el.innerHTML = '<p class="ad-mock-tag">試作版</p><p class="ad-mock-text">ここに広告が流れます</p><p class="ad-mock-time" aria-live="polite"></p><button type="button" class="ad-mock-close">閉じる</button>';
      host.append(el);
      const time = el.querySelector('.ad-mock-time');
      let left = 3;
      const done = ok => { clearInterval(timer); el.remove(); resolve(ok); };
      const tick = () => { time.textContent = left > 0 ? `あと${left}秒` : '見終わりました'; if (left-- < 0) done(true); };
      const timer = setInterval(tick, 1000);
      tick();
      el.querySelector('.ad-mock-close').addEventListener('click', () => done(false));
    });
  },
};

const SCORES = 'mouton.sheep.scores';
export const leaderboard = {
  top: () => {
    const list = storage.get(SCORES, []);
    return Array.isArray(list) ? list : [];
  },
  save: list => storage.set(SCORES, list),
};

// Vibration patterns in milliseconds. Android browsers vibrate; iPhone
// browsers have no vibration, but on iOS 18 and later flipping a switch
// control gives a light tap, which is used instead (one tap per buzz). The
// app will use Capacitor Haptics on both.
let tapSwitch = null;
function iosTap() {
  try {
    if (!tapSwitch) {
      tapSwitch = document.createElement('label');
      tapSwitch.setAttribute('aria-hidden', 'true');
      tapSwitch.style.display = 'none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      tapSwitch.append(input);
      document.head.append(tapSwitch);
    }
    tapSwitch.click();
  } catch {}
}

// In the app, each "on" part of a pattern becomes one tap of the phone's
// haptic engine, firmer for longer parts.
function nativeBuzz(pattern) {
  const parts = Array.isArray(pattern) ? pattern : [pattern];
  let at = 0;
  parts.forEach((ms, i) => {
    if (i % 2 === 0) {
      const style = ms <= 12 ? 'LIGHT' : ms <= 30 ? 'MEDIUM' : 'HEAVY';
      const tap = () => Haptics.impact({ style }).catch(() => {});
      if (at) setTimeout(tap, at); else tap();
    }
    at += ms;
  });
}

export const haptics = {
  on: true,
  buzz(pattern) {
    if (!this.on) return;
    if (Haptics) { nativeBuzz(pattern); return; }
    if (navigator.vibrate) { navigator.vibrate(pattern); return; }
    iosTap();
  },
  move() { this.buzz(10); },
  turn() { this.buzz(12); },
  land() { this.buzz(18); },
  clear(chain) { this.buzz(chain > 1 ? [25, 40, 25, 40, 35] : 30); },
  black() { this.buzz([20, 40, 20]); },
  pinch() { this.buzz([40, 60, 40]); },
  over() { this.buzz([80, 60, 160]); },
};

// Android's back button: the game decides what it means (pause, go back a
// page); returning false lets the app close.
export function onBack(handler) {
  App?.addListener('backButton', () => { if (!handler()) App.exitApp(); });
}
