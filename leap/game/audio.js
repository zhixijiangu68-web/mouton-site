// MOUTON・LEAP sounds, made with the Web Audio API: no files to load.
// Browsers only allow sound after a touch, so unlock() runs from the first tap.

export class Sound {
  constructor() {
    this.ctx = null;
    this.on = true;
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch { /* no sound is fine */ }
  }

  // One note: a pitch gliding from `f0` to `f1`, with a quick fade.
  tone({ f0, f1 = f0, dur = 0.12, type = 'sine', vol = 0.12, delay = 0 }) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noise(dur = 0.25, vol = 0.18) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
  }

  jump() { this.tone({ f0: 330, f1: 700, dur: 0.14, type: 'triangle', vol: 0.11 }); }
  land() { this.tone({ f0: 130, f1: 60, dur: 0.09, vol: 0.1 }); }
  lane() { this.tone({ f0: 260, f1: 190, dur: 0.05, type: 'triangle', vol: 0.05 }); }
  fence() { this.tone({ f0: 523, dur: 0.09, vol: 0.06 }); }
  star(n = 0) {
    const f = 880 * Math.pow(2, Math.min(n, 7) / 12);   // each star in a row a little higher
    this.tone({ f0: f, dur: 0.1, vol: 0.09 });
    this.tone({ f0: f * 1.5, dur: 0.16, vol: 0.08, delay: 0.07 });
  }
  hit() {
    this.tone({ f0: 180, f1: 50, dur: 0.35, type: 'sawtooth', vol: 0.14 });
    this.noise(0.3, 0.2);
  }
}

export function vibrate(ms) {
  try { navigator.vibrate?.(ms); } catch { /* not supported */ }
}
