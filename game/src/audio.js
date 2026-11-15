// audio.js — every sound is synthesised in code with WebAudio:
// no audio files, no network. A tiny synth voice per effect, plus a
// filtered-noise gust for the wind. Mute is a single flag.
export function createSfx() {
  const sfx = {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch (err) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(freq, dur, type, vol, slideTo) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    noise(dur, vol, freq) {
      if (this.muted || !this.ctx) return;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq || 800;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start();
    },
    shoot(kind) {
      if (kind === 'windmill') this.tone(180, 0.16, 'triangle', 0.12, 90);
      else if (kind === 'saltcart') this.tone(660, 0.06, 'square', 0.04, 520);
      else this.tone(880, 0.07, 'square', 0.05, 440);
    },
    pop() { this.tone(320, 0.12, 'sine', 0.1, 90); },
    coin() { this.tone(990, 0.08, 'sine', 0.08); this.tone(1320, 0.14, 'sine', 0.08); },
    place() { this.tone(220, 0.1, 'triangle', 0.12, 140); this.noise(0.08, 0.05, 400); },
    deny() { this.tone(140, 0.15, 'sawtooth', 0.06, 110); },
    thud() { this.noise(0.1, 0.08, 220); },
    cartHit() { this.tone(110, 0.18, 'sawtooth', 0.1, 70); this.noise(0.12, 0.08, 300); },
    horn() {
      this.tone(196, 0.35, 'triangle', 0.14);
      this.tone(294, 0.4, 'triangle', 0.12);
    },
    gust() { this.noise(0.7, 0.14, 1200); },
    waveClear() {
      this.tone(523, 0.12, 'sine', 0.09);
      this.tone(659, 0.12, 'sine', 0.09);
      this.tone(784, 0.2, 'sine', 0.09);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => this.tone(f, 0.3, 'triangle', 0.12), i * 140);
      });
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => {
        setTimeout(() => this.tone(f, 0.35, 'sawtooth', 0.07), i * 160);
      });
    },
  };
  return sfx;
}
