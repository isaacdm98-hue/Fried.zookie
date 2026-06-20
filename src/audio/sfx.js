/**
 * sfx.js — Pure Web Audio API sound effects for FriedZooki.
 * No audio files — all sounds are synthesized.
 */

export const sfx = {
  ctx: null,
  _masterGain: null,
  _muted: false,

  /** Create AudioContext and master gain node. Call once on first user gesture. */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this.ctx.createGain();
    this._masterGain.gain.value = 1;
    this._masterGain.connect(this.ctx.destination);
  },

  /**
   * Play a named sound effect.
   * @param {'blip'|'click'|'jump'|'land'|'win'|'lose'|'start'|'crowd'|'countdown'} name
   */
  play(name) {
    if (!this.ctx) this.init();
    if (this._muted) return;

    const fn = this[`_${name}`];
    if (typeof fn === 'function') {
      fn.call(this);
    } else {
      console.warn(`[sfx] Unknown sound: ${name}`);
    }
  },

  /**
   * Mute or unmute all sound.
   * @param {boolean} bool
   */
  mute(bool) {
    this._muted = bool;
    if (this._masterGain) {
      this._masterGain.gain.value = bool ? 0 : 1;
    }
  },

  // --- Internal sound helpers ---

  _out(node) {
    node.connect(this._masterGain);
    return node;
  },

  /** Short sine tone */
  _makeSine(freq, startTime, duration, peakGain = 0.4) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    this._out(gain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  },

  /** White noise buffer source */
  _makeNoise(startTime, duration, filterFreq = 2000, peakGain = 0.3) {
    const ctx = this.ctx;
    const bufferSize = Math.ceil(ctx.sampleRate * (duration + 0.01));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peakGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    this._out(gain);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  },

  // --- Named sounds ---

  /** blip: short sine 880 Hz, 50 ms */
  _blip() {
    this._makeSine(880, this.ctx.currentTime, 0.05, 0.35);
  },

  /** click: short noise burst, 30 ms */
  _click() {
    this._makeNoise(this.ctx.currentTime, 0.03, 3000, 0.25);
  },

  /** jump: sine sweep 220→440 Hz, 100 ms */
  _jump() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.1);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    this._out(gain);
    osc.start(t);
    osc.stop(t + 0.12);
  },

  /** land: low thud — noise + sine 80 Hz, 80 ms */
  _land() {
    const t = this.ctx.currentTime;
    this._makeNoise(t, 0.08, 400, 0.35);
    this._makeSine(80, t, 0.08, 0.4);
  },

  /** win: major chord arpeggio C4–E4–G4–C5 */
  _win() {
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      this._makeSine(freq, t + i * 0.10, 0.25, 0.3);
    });
  },

  /** lose: descending sweep 440→220 Hz, 300 ms */
  _lose() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    this._out(gain);
    osc.start(t);
    osc.stop(t + 0.32);
  },

  /** start: three ascending beeps then GO whoosh */
  _start() {
    const t = this.ctx.currentTime;
    // Three countdown beeps
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      this._makeSine(freq, t + i * 0.22, 0.12, 0.35);
    });
    // GO whoosh — quick upward sweep
    const ctx = this.ctx;
    const wo = ctx.currentTime + 0.72;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, wo);
    osc.frequency.exponentialRampToValueAtTime(1200, wo + 0.18);
    gain.gain.setValueAtTime(0.45, wo);
    gain.gain.exponentialRampToValueAtTime(0.001, wo + 0.18);
    osc.connect(gain);
    this._out(gain);
    osc.start(wo);
    osc.stop(wo + 0.20);
  },

  /** countdown: tick — sine 1200 Hz, 50 ms */
  _countdown() {
    this._makeSine(1200, this.ctx.currentTime, 0.05, 0.3);
  },

  /** crowd: filtered noise burst, 200 ms */
  _crowd() {
    const t = this.ctx.currentTime;
    this._makeNoise(t, 0.2, 800, 0.4);
    // Slight mid presence
    this._makeNoise(t, 0.15, 1600, 0.15);
  },
};
