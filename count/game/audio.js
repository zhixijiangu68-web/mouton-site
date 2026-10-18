// Music and sounds, made in the browser with Web Audio: no audio files, so
// the game stays small, works offline and owns every note.
//
// Four pieces follow the night: yoru (a music-box lullaby), shinya (late night,
// a quiet beat), pinch (fast and driving, when the field is nearly full) and
// asa (dawn). A fifth, chance, plays while a shooting star doubles the count.
// Changes wait for the next bar, except the pinch and the chance, which come
// in on the next beat (and the chance also leaves on the next beat).

const midi = name => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return base + (Number(m[3]) + 1) * 12;
};
const hz = n => 440 * 2 ** ((n - 69) / 12);
const chord = s => s.split(' ').map(midi);
// "A5:0:4 C6:4:4" → [[note, step, length in 16ths]]
const line = s => s.trim().split(/\s+/).map(x => { const [n, st, len] = x.split(':'); return [midi(n), +st, +len]; });

const MOODS = {
  yoru: {
    bpm: 70,
    chords: ['F3 A3 C4 E4', 'D3 F3 A3 C4', 'Bb2 D3 F3 A3', 'C3 E3 G3 Bb3'].map(chord),
    bass: [[0, 12]],
    arp: { every: 2, order: [0, 1, 2, 3, 2, 1, 2, 3], octave: 24, voice: 'box', vel: 0.09 },
    pad: 0.08,
    melody: [
      line('A5:0:4 C6:4:4 A5:8:2 G5:10:2 F5:12:4  F5:16:4 A5:20:4 D6:24:6 C6:30:2  D6:32:4 C6:36:2 Bb5:38:2 A5:40:4 F5:44:4  G5:48:4 A5:52:2 Bb5:54:2 C6:56:8'),
      line('C6:0:8 A5:8:8  D6:16:8 A5:24:8  F5:32:6 G5:38:2 A5:40:8  G5:48:8 E5:56:8'),
    ],
    lead: 'bell',
  },
  shinya: {
    bpm: 84,
    chords: ['D3 F3 A3 C4 E4', 'Bb2 D3 F3 A3', 'G2 Bb2 D3 F3', 'A2 C#3 E3 G3'].map(chord),
    bass: [[0, 4], [6, 2], [8, 4], [14, 2]],
    arp: { every: 1, order: [0, 2, 1, 3, 2, 4, 3, 1], octave: 24, voice: 'pluck', vel: 0.06 },
    pad: 0.07,
    drums: { kick: [0, 8, 10], hat: [2, 6, 10, 14], rim: [12], vel: 0.5 },
    melody: [
      line('A5:0:6 F5:6:2 E5:8:8  D5:16:4 F5:20:4 A5:24:8  G5:32:6 F5:38:2 D5:40:8  E5:48:4 C#5:52:4 E5:56:4 A5:60:4'),
      line('D6:0:8 C6:8:4 A5:12:4  F5:16:12  G5:32:4 A5:36:4 Bb5:40:8  A5:48:16'),
    ],
    lead: 'bell',
  },
  pinch: {
    bpm: 138,
    chords: ['D3 F3 A3', 'Bb2 D3 F3', 'C3 E3 G3', 'A2 C#3 E3'].map(chord),
    bass: 'pump',
    arp: { every: 1, order: [0, 1, 2, 1, 0, 2, 1, 2], octave: 24, voice: 'saw', vel: 0.04 },
    stabs: [0, 6, 10],
    drums: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], vel: 0.8 },
    melody: [
      line('D5:0:4 F5:4:2 A5:6:4 G5:10:2 F5:12:4  F5:16:4 D5:20:2 F5:22:2 Bb5:24:8  C6:32:4 Bb5:36:2 A5:38:2 G5:40:4 E5:44:4  A5:48:6 C#6:54:2 E6:56:8'),
      line('A5:0:2 A5:2:2 D6:4:4 C6:8:4 A5:12:4  Bb5:16:4 A5:20:4 F5:24:8  G5:32:2 G5:34:2 C6:36:4 Bb5:40:4 G5:44:4  E6:48:4 D6:52:4 C#6:56:8'),
    ],
    lead: 'lead',
  },
  // Chance time: bright and fast, over the "royal road" chords (IV–V–iii–vi in G)
  // that climb toward a high note at the end of every four bars.
  chance: {
    bpm: 152,
    chords: ['C3 E3 G3 B3', 'D3 F#3 A3 C4', 'B2 D3 F#3 A3', 'E3 G3 B3 D4'].map(chord),
    bass: 'pump',
    arp: { every: 1, order: [0, 2, 1, 3, 2, 1, 3, 2], octave: 24, voice: 'pluck', vel: 0.07 },
    stabs: [2, 6, 10, 14],
    drums: { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], shaker: true, vel: 0.85 },
    sparkle: [0, 32],
    melody: [
      line('E6:0:3 D6:3:3 B5:6:2 C6:8:2 D6:10:2 E6:12:4  F#6:16:3 E6:19:3 D6:22:2 A5:24:4 D6:28:4  D6:32:3 B5:35:3 A5:38:2 B5:40:2 D6:42:2 F#6:44:4  G6:48:4 F#6:52:2 E6:54:2 D6:56:2 E6:58:2 B6:60:4'),
      line('G5:0:2 G5:2:2 B5:4:2 D6:6:2 G6:8:4 E6:12:4  F#6:16:2 F#6:18:2 E6:20:2 D6:22:2 A6:24:8  F#6:32:2 F#6:34:2 E6:36:2 D6:38:2 B5:40:4 D6:44:4  E6:48:2 F#6:50:2 G6:52:4 A6:56:4 B6:60:4'),
    ],
    lead: 'lead',
  },
  asa: {
    bpm: 92,
    chords: ['C3 E3 G3 D4', 'B2 D3 G3', 'A2 C3 E3 G3', 'F2 A2 C3 E3'].map(chord),
    bass: [[0, 6], [8, 4], [12, 4]],
    arp: { every: 2, order: [0, 1, 2, 3, 2, 1, 0, 2], octave: 24, voice: 'bell', vel: 0.05 },
    pad: 0.07,
    drums: { kick: [0, 8], hat: [2, 6, 10, 14], clap: [4, 12], vel: 0.45 },
    melody: [
      line('E5:0:4 G5:4:4 C6:8:6 B5:14:2  B5:16:4 D6:20:4 G5:24:8  A5:32:4 C6:36:4 E6:40:6 D6:46:2  C6:48:4 A5:52:4 F5:56:4 G5:60:4'),
      line('G5:0:8 E5:8:8  D5:16:4 G5:20:4 B5:24:8  C6:32:8 A5:40:8  A5:48:4 G5:52:4 E5:56:8'),
    ],
    lead: 'bell',
  },
};
export const MOOD_NAMES = Object.keys(MOODS);
const MUSIC_LEVEL = 0.85;

// iPhone: a page's sound follows the silent switch unless it says it plays
// music. With music on, ask to play like a music player (it sounds even in
// silent mode); with music off, behave like other sounds (silent mode mutes).
function audioSession(music) {
  try { if (navigator.audioSession) navigator.audioSession.type = music ? 'playback' : 'ambient'; } catch {}
}

// Half a second of silence as a WAV file, for the media element below.
function silentWav() {
  const rate = 8000, n = rate / 2, bytes = new Uint8Array(44 + n * 2);
  const v = new DataView(bytes.buffer);
  const text = (o, t) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  text(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  text(36, 'data'); v.setUint32(40, n * 2, true);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export class Sound {
  constructor(settings) {
    this.settings = settings;   // { music, sfx }
    this.ctx = null;
    this.mood = null;
    this.pending = null;
    this.timer = 0;
    this.slow = 1;
    this.loop = 0;
  }

  // Must run inside a tap: phones only allow sound after the player touches the screen.
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioSession(this.settings.music);
    if (!this.ctx) {
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.settings.music ? MUSIC_LEVEL : 0;
      this.musicBus.connect(this.master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfx ? 0.8 : 0;
      this.sfxBus.connect(this.master);
      // A soft room for bells and pads.
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.impulse(2.4);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.35;
      this.reverb.connect(this.wet).connect(this.master);
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    // Older iPhones start a page's sound only if something plays during the touch.
    const blip = this.ctx.createBufferSource();
    blip.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    blip.connect(this.ctx.destination);
    blip.start(0);
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    this.keepOpen();
  }

  // iPhone: while a media element plays (here, silence), the page counts as
  // playing music, so the game's sound is heard even with the silent switch on.
  keepOpen() {
    if (!this.settings.music) { this.silent?.pause(); return; }
    if (!this.silent) {
      const a = this.silent = document.createElement('audio');
      a.setAttribute('x-webkit-airplay', 'deny');
      a.setAttribute('playsinline', '');
      a.loop = true;
      a.preload = 'auto';
      a.src = silentWav();
    }
    this.silent.play().catch(() => {});
  }

  // What the "check the sound" button reports, in words a player can pass on.
  status() {
    if (!(window.AudioContext || window.webkitAudioContext)) return 'この端末のブラウザでは音が使えません';
    if (!this.ctx) return '音はまだ始まっていません';
    const state = { running: '鳴らせる状態', suspended: '止まっている', interrupted: 'ほかのアプリに止められている', closed: '閉じている' }[this.ctx.state] || this.ctx.state;
    const ios = navigator.audioSession ? `・iPhoneの音の設定：${navigator.audioSession.type}` : '';
    return `音の状態：${state}（${this.ctx.state}）${ios}`;
  }

  // A short chime through every setting, to check the speaker.
  test() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => this.bell(t + i * 0.12, midi(n), 0.8, 0.25, this.master));
  }

  impulse(sec) {
    const { sampleRate } = this.ctx;
    const buf = this.ctx.createBuffer(2, sampleRate * sec, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    return buf;
  }

  apply(settings) {
    this.settings = settings;
    audioSession(settings.music);
    if (this.ctx) this.keepOpen();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(settings.music ? MUSIC_LEVEL : 0, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(settings.sfx ? 0.8 : 0, t, 0.05);
  }

  // ---- Music --------------------------------------------------------------

  play(name) {
    if (!this.ctx) return;
    if (!this.timer) {
      this.mood = name;
      this.pending = null;
      this.step = 0;
      this.loop = 0;
      this.next = this.ctx.currentTime + 0.08;
      this.musicBus.gain.cancelScheduledValues(this.next);
      this.musicBus.gain.setTargetAtTime(this.settings.music ? MUSIC_LEVEL : 0, this.ctx.currentTime, 0.05);
      this.timer = setInterval(() => this.schedule(), 25);
      return;
    }
    this.pending = name === this.mood ? null : name;
  }

  stop(fade = 0.6) {
    if (!this.ctx || !this.timer) return;
    clearInterval(this.timer);
    this.timer = 0;
    this.mood = null;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(0, t, fade / 4);
  }

  setSlow(on) { this.slow = on ? 0.8 : 1; }
  suspend() {
    this.silent?.pause();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  schedule() {
    const ctx = this.ctx;
    while (this.next < ctx.currentTime + 0.12) {
      // A change of piece waits for the start of a bar; the pinch and the
      // chance come in (and the chance goes) at the start of a beat.
      const onBeat = this.pending === 'pinch' || this.pending === 'chance' || this.mood === 'chance';
      if (this.pending && (this.step % 16 === 0 || (onBeat && this.step % 4 === 0))) {
        this.mood = this.pending;
        this.pending = null;
        this.step = 0;
        this.loop = 0;
      }
      this.beat(MOODS[this.mood], this.step, this.next);
      this.next += 60 / (MOODS[this.mood].bpm * this.slow) / 4;
      this.step += 1;
      if (this.step === 64) { this.step = 0; this.loop += 1; }
    }
  }

  beat(m, step, t) {
    const bar = Math.floor(step / 16), s = step % 16;
    const ch = m.chords[bar];
    const sixteenth = 60 / (m.bpm * this.slow) / 4;
    const out = this.musicBus;
    if (s === 0 && m.pad) this.pad(t, ch, sixteenth * 16, m.pad, out);
    // Bass
    if (m.bass === 'pump') {
      if (s % 2 === 0) this.bass(t, ch[0] - 12 + (s % 4 === 2 ? 12 : 0), sixteenth * 1.6, 0.22, true, out);
    } else {
      for (const [st, len] of m.bass) if (st === s) this.bass(t, ch[0] - 12, sixteenth * len, 0.2, false, out);
    }
    // Broken chords
    if (m.arp && s % m.arp.every === 0) {
      const i = m.arp.order[(s / m.arp.every) % m.arp.order.length] % ch.length;
      this[m.arp.voice](t, ch[i] + m.arp.octave, sixteenth * m.arp.every * 1.5, m.arp.vel, out);
    }
    if (m.stabs && m.stabs.includes(s)) for (const n of ch) this.saw(t, n + 12, sixteenth * 1.2, 0.025, out);
    // Drums
    const d = m.drums;
    if (d) {
      if (d.kick.includes(s)) this.kick(t, 0.5 * d.vel + 0.2, out);
      if (d.snare?.includes(s)) this.snare(t, 0.35 * d.vel, out);
      if (d.clap?.includes(s)) this.snare(t, 0.16 * d.vel, out, true);
      if (d.rim?.includes(s)) this.hat(t, 0.12 * d.vel, out, 0.03, 2600);
      if (d.hat.includes(s)) this.hat(t, (s % 4 === 2 ? 0.12 : 0.06) * d.vel, out);
      if (d.shaker && !d.hat.includes(s)) this.hat(t, (s % 2 ? 0.03 : 0.05) * d.vel, out, 0.025, 9000);
    }
    // A shimmer of bells at the top of a phrase.
    if (m.sparkle && m.sparkle.includes(step)) {
      for (let k = 0; k < 4; k++) this.bell(t + k * sixteenth * 0.5, ch[k % ch.length] + 36, 0.6, 0.035, out);
    }
    // Melody: the first tune, then the second, then again.
    for (const [n, st, len] of m.melody[this.loop % 2]) {
      if (st === step) this[m.lead](t, n, sixteenth * len, m.lead === 'lead' ? 0.08 : 0.15, out);
    }
  }

  // ---- Instruments ----------------------------------------------------------

  env(g, t, a, peak, decay, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    return end ?? t + decay + 0.05;
  }

  osc(type, f, t, stop, dest, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(stop);
    return o;
  }

  // Bell: two sines a few octaves apart, with a fast-fading metallic edge (FM).
  bell(t, n, d, v, out) {
    const g = this.ctx.createGain();
    const stop = this.env(g, t, 0.004, v, Math.max(d, 1.4));
    g.connect(out);
    g.connect(this.reverb);
    const car = this.osc('sine', hz(n), t, stop, g);
    const mod = this.ctx.createOscillator();
    const mg = this.ctx.createGain();
    mod.frequency.value = hz(n) * 3.5;
    mg.gain.setValueAtTime(hz(n) * 1.2, t);
    mg.gain.exponentialRampToValueAtTime(1, t + 0.4);
    mod.connect(mg).connect(car.frequency);
    mod.start(t);
    mod.stop(stop);
  }

  box(t, n, d, v, out) {
    const g = this.ctx.createGain();
    const stop = this.env(g, t, 0.003, v, 0.9);
    g.connect(out);
    g.connect(this.reverb);
    this.osc('sine', hz(n), t, stop, g);
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.25;
    g2.connect(g);
    this.osc('sine', hz(n) * 4, t, stop, g2);
  }

  pluck(t, n, d, v, out) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.25);
    const stop = this.env(g, t, 0.004, v, 0.35);
    f.connect(g).connect(out);
    g.connect(this.reverb);
    this.osc('triangle', hz(n), t, stop, f);
  }

  saw(t, n, d, v, out) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + Math.max(0.12, d));
    f.Q.value = 4;
    const stop = this.env(g, t, 0.005, v, Math.max(0.15, d));
    f.connect(g).connect(out);
    this.osc('sawtooth', hz(n), t, stop, f, -7);
    this.osc('sawtooth', hz(n), t, stop, f, 7);
  }

  lead(t, n, d, v, out) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.setValueAtTime(v, t + d * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
    f.connect(g).connect(out);
    g.connect(this.reverb);
    const stop = t + d + 0.1;
    this.osc('square', hz(n), t, stop, f, -5);
    const o = this.osc('sawtooth', hz(n), t, stop, f, 6);
    // A little vibrato on long notes.
    if (d > 0.3) {
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = 9;
      lfo.connect(lg).connect(o.detune);
      lfo.start(t + 0.15);
      lfo.stop(stop);
    }
  }

  pad(t, notes, d, v, out) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + d * 0.25);
    g.gain.setValueAtTime(v, t + d * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.4);
    f.connect(g).connect(out);
    g.connect(this.reverb);
    for (const n of notes) {
      this.osc('triangle', hz(n + 12), t, t + d + 0.5, f, -6);
      this.osc('sawtooth', hz(n + 12), t, t + d + 0.5, f, 6);
    }
  }

  bass(t, n, d, v, gritty, out) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = gritty ? 520 : 380;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    f.connect(g).connect(out);
    this.osc(gritty ? 'sawtooth' : 'triangle', hz(n), t, t + d + 0.05, f);
    this.osc('sine', hz(n), t, t + d + 0.05, g);
  }

  kick(t, v, out) {
    const g = this.ctx.createGain();
    g.connect(out);
    const stop = this.env(g, t, 0.002, v, 0.28);
    const o = this.osc('sine', 150, t, stop, g);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  }

  hat(t, v, out, len = 0.04, cut = 7000) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = cut;
    const g = this.ctx.createGain();
    this.env(g, t, 0.001, v, len);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.02);
  }

  snare(t, v, out, clap = false) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = clap ? 1400 : 1900;
    f.Q.value = 0.8;
    const g = this.ctx.createGain();
    this.env(g, t, 0.001, v, clap ? 0.12 : 0.17);
    src.connect(f).connect(g).connect(out);
    g.connect(this.reverb);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.25);
    if (!clap) {
      const tg = this.ctx.createGain();
      tg.connect(out);
      this.osc('triangle', 190, t, this.env(tg, t, 0.001, v * 0.6, 0.08), tg);
    }
  }

  // ---- Sound effects ----------------------------------------------------------

  sfx(name, a = 0, b = 0) {
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime + 0.005;
    const out = this.sfxBus;
    const s = this.sfxTable[name];
    if (s) s.call(this, t, out, a, b);
  }

  sweep(t, out, from, to, len, v, type = 'bandpass') {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = 1.5;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + len);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + len * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + len + 0.05);
  }

  // A sheep's "baa": a buzzy voice with a wobble, shaped like a vowel.
  baa(t, out, pitch = 1, v = 0.12) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.04);
    g.gain.setValueAtTime(v, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 850;
    f1.Q.value = 3;
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 2300;
    f2.Q.value = 5;
    f1.connect(g);
    f2.connect(g);
    g.connect(out);
    const o = this.osc('sawtooth', 320 * pitch, t, t + 0.55, f1);
    o.connect(f2);
    o.frequency.setValueAtTime(320 * pitch, t);
    o.frequency.linearRampToValueAtTime(300 * pitch, t + 0.45);
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 9;
    lg.gain.value = 14 * pitch;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + 0.55);
  }
}

const PENTA = [0, 2, 4, 7, 9];
Sound.prototype.sfxTable = {
  move(t, out) {
    const g = this.ctx.createGain();
    this.osc('sine', 1500, t, this.env(g, t, 0.001, 0.025, 0.025), g);
    g.connect(out);
  },
  rotate(t, out) {
    const g = this.ctx.createGain();
    const o = this.osc('triangle', 880, t, this.env(g, t, 0.002, 0.07, 0.09), g);
    o.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
    g.connect(out);
  },
  // A sheep landing on wool: a soft thump.
  land(t, out, hard) {
    this.sweep(t, out, 900, 200, 0.09, hard ? 0.22 : 0.12, 'lowpass');
    const g = this.ctx.createGain();
    const o = this.osc('sine', hard ? 140 : 120, t, this.env(g, t, 0.002, hard ? 0.3 : 0.14, 0.14), g);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    g.connect(out);
  },
  // One rising note per jumping sheep, in time with the jumps; a chain starts higher.
  jumps(t, out, count, chain) {
    const base = midi('C5') + (chain - 1) * 5;
    for (let i = 0; i < Math.min(count, 24); i++) {
      const n = base + PENTA[i % 5] + 12 * Math.floor(i / 5);
      this.box(t + i * 0.025, n, 0.2, 0.05, out);
    }
    if (chain > 1) for (let k = 0; k < 3; k++) this.bell(t + 0.08 * k, midi('E6') + chain * 2 + k * 4, 0.3, 0.05, out);
  },
  black(t, out) {
    this.baa(t, out, 0.8, 0.1);
    this.bell(t + 0.1, midi('D5'), 0.8, 0.06, out);
    this.bell(t + 0.1, midi('A5'), 0.8, 0.05, out);
  },
  dog(t, out) {
    for (const k of [0, 0.16]) {
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 900;
      f.Q.value = 2;
      const o = this.osc('sawtooth', 420, t + k, this.env(g, t + k, 0.005, 0.16, 0.11), f);
      o.frequency.exponentialRampToValueAtTime(210, t + k + 0.1);
      f.connect(g).connect(out);
    }
  },
  swap(t, out) { this.sweep(t, out, 400, 2600, 0.2, 0.12); },
  slow(t, out) {
    const g = this.ctx.createGain();
    const o = this.osc('sine', 880, t, this.env(g, t, 0.01, 0.1, 0.6), g);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.55);
    g.connect(out);
  },
  reward(t, out) { ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => this.bell(t + i * 0.08, midi(n), 0.6, 0.07, out)); },
  // The field is nearly full: a rising whoosh before the pinch music.
  pinch(t, out) {
    this.sweep(t, out, 300, 5000, 0.7, 0.12, 'bandpass');
    const g = this.ctx.createGain();
    const o = this.osc('sawtooth', 110, t, this.env(g, t, 0.3, 0.05, 0.75), g);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.7);
    g.connect(out);
  },
  dawn(t, out) {
    ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => this.bell(t + i * 0.09, midi(n), 1.2, 0.07, out));
    this.baa(t + 0.6, out, 1.1, 0.08);
  },
  over(t, out) {
    ['A5', 'F5', 'D5', 'A4'].forEach((n, i) => this.box(t + i * 0.28, midi(n), 0.5, 0.09, out));
    this.baa(t + 1.2, out, 0.7, 0.07);
  },
  // A golden sheep counted: a bright shimmer.
  gold(t, out) {
    ['E6', 'G#6', 'B6', 'E7'].forEach((n, i) => this.bell(t + i * 0.05, midi(n), 0.7, 0.06, out));
    this.sweep(t, out, 3000, 9000, 0.4, 0.05, 'highpass');
  },
  // The full moon: a warm wide chord under a bell.
  moon(t, out) {
    this.pad(t, ['F3', 'A3', 'C4', 'E4', 'G4'].map(midi), 1.4, 0.12, out);
    ['C6', 'G5', 'E6'].forEach((n, i) => this.bell(t + 0.1 + i * 0.16, midi(n), 1.6, 0.09, out));
  },
  // The field emptied: a rising run that lands on a chord.
  perfect(t, out) {
    ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'].forEach((n, i) => this.bell(t + i * 0.06, midi(n), 0.6, 0.07, out));
    ['C6', 'E6', 'G6'].forEach(n => this.bell(t + 0.55, midi(n), 1.6, 0.07, out));
    this.baa(t + 0.7, out, 1.15, 0.08);
  },
  // A new best: a little fanfare.
  best(t, out) {
    [['G5', 0], ['G5', 0.12], ['G5', 0.24], ['E6', 0.38]].forEach(([n, d]) => this.lead(t + d, midi(n), d < 0.3 ? 0.1 : 0.5, 0.07, out));
    this.bell(t + 0.38, midi('C6'), 1.2, 0.07, out);
  },
  // A shooting star crosses the sky.
  star(t, out) {
    this.sweep(t, out, 8000, 1500, 0.9, 0.08, 'bandpass');
    ['B6', 'F#6', 'D#6'].forEach((n, i) => this.bell(t + 0.2 + i * 0.1, midi(n), 0.6, 0.05, out));
  },
  // The shepherd's whistle: two rising notes, then the black sheep's "baa" as it walks off.
  whistle(t, out) {
    for (const [f0, f1, d, len] of [[1700, 2300, 0, 0.16], [2100, 2900, 0.2, 0.32]]) {
      const g = this.ctx.createGain();
      const o = this.osc('sine', f0, t + d, this.env(g, t + d, 0.02, 0.09, len), g);
      o.frequency.exponentialRampToValueAtTime(f1, t + d + len * 0.6);
      g.connect(out);
      g.connect(this.reverb);
    }
    this.baa(t + 0.55, out, 0.85, 0.08);
  },
  // The last seconds of a shooting star: a soft tick, higher as it runs out.
  tick(t, out, left) {
    const g = this.ctx.createGain();
    this.osc('sine', [0, 1760, 1568, 1397][left] || 1397, t, this.env(g, t, 0.002, 0.07, 0.08), g);
    g.connect(out);
  },
  // The shooting star is gone: a falling sparkle that lands softly.
  chanceEnd(t, out) {
    ['B6', 'G6', 'D6', 'B5'].forEach((n, i) => this.bell(t + i * 0.06, midi(n), 0.5, 0.05, out));
    this.box(t + 0.3, midi('G5'), 0.6, 0.07, out);
  },
  // Clearing again: each run step one note higher.
  combo(t, out, n) {
    const note = midi('C5') + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][Math.min(9, Math.max(0, n - 1))];
    this.box(t, note, 0.3, 0.08, out);
    this.box(t + 0.07, note + 7, 0.3, 0.06, out);
  },
  achieve(t, out) { ['A5', 'E6'].forEach((n, i) => this.bell(t + i * 0.12, midi(n), 0.9, 0.08, out)); },
  rankup(t, out) {
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => this.lead(t + i * 0.1, midi(n), 0.18, 0.06, out));
    this.bell(t + 0.42, midi('E6'), 1.4, 0.08, out);
    this.baa(t + 0.6, out, 1.05, 0.07);
  },
  tap(t, out) {
    const g = this.ctx.createGain();
    this.osc('sine', 660, t, this.env(g, t, 0.002, 0.05, 0.06), g);
    g.connect(out);
  },
};
