/**
 * gait-sound.js — Per-creature footstep audio driven by genome.
 * Pitch and volume are derived from genome properties.
 */

export class GaitSound {
  /**
   * @param {object} genome  — creature genome (needs gait.freq, mass, legs[].length)
   * @param {AudioContext} ctx
   */
  constructor(genome, ctx) {
    this._ctx = ctx;
    this._genome = genome;

    // Create a master gain node for this creature's footsteps
    this._gain = ctx.createGain();
    this._gain.connect(ctx.destination);

    this._updateParams(genome);
  }

  _updateParams(genome) {
    // Pitch: 80 Hz base + gait freq contribution
    this._pitch = 80 + (genome.gait?.freq ?? 0) * 30;

    // Volume: proportional to mass, inversely proportional to average leg length
    const mass = genome.mass ?? 1;
    const avgLegLen = genome.legs && genome.legs.length
      ? genome.legs.reduce((s, l) => s + (l.length ?? 1), 0) / genome.legs.length
      : 1;

    // Clamp volume to a reasonable range
    const vol = Math.min(0.6, Math.max(0.05, (mass / 10) / Math.max(0.1, avgLegLen)));
    this._gain.gain.value = vol;
  }

  /** Play one footstep click. Very short — meant to be called per leg contact. */
  tick() {
    const ctx = this._ctx;
    const t = ctx.currentTime;

    // Noise click (attack)
    const bufSize = Math.ceil(ctx.sampleRate * 0.025);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    // Low-pass filter to give it a "thud" character
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this._pitch * 4;

    // Sine component at pitch for tonal body
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = this._pitch;

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(this._gain);
    osc.connect(oscGain);
    oscGain.connect(this._gain);

    noise.start(t);
    noise.stop(t + 0.03);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Update the footstep pitch — call when genome changes.
   * @param {number} freq — new gait.freq value
   */
  setFreq(freq) {
    this._genome = { ...this._genome, gait: { ...this._genome.gait, freq } };
    this._pitch = 80 + freq * 30;
    this._updateParams(this._genome);
  }

  /** Disconnect and clean up all nodes. */
  dispose() {
    try {
      this._gain.disconnect();
    } catch (_) {
      // already disconnected
    }
  }
}
