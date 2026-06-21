/**
 * feedback.js — tactile feedback: synthesised clicks/beeps + haptics.
 *
 * No audio assets: everything is generated with the Web Audio API so the PWA
 * stays tiny and offline. Gives the controls that satisfying TE-hardware feel.
 * The AudioContext is created lazily and resumed on the first user gesture.
 */

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Hush audio while the app is backgrounded; resume on return (saves battery and
// stops generative music droning to an empty room).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { try { ctx.suspend(); } catch (_) {} }
    else if (!muted)     { try { ctx.resume(); } catch (_) {} }
  });
}

/** Call once from the first tap so audio is unlocked. */
export function unlockAudio() { ac(); }
export function setMuted(m) { muted = m; }
/** Shared with the music module so everything runs on one AudioContext. */
export function audioCtx() { return ac(); }
export function isMuted() { return muted; }

function tone(freq, dur, type = 'square', gain = 0.06) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(a.destination);
  const t = a.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur);
}

function buzz(ms) { if (!muted && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} }

/**
 * Animalese-style voice blip for a single character. Pitch is derived from the
 * character so speech has melodic, gibberish-y variation (Animal Crossing feel).
 * @param {string} ch   one character
 * @param {number} rate pitch multiplier (per-speaker voice)
 */
export function voice(ch, rate = 1) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const code = ch.toLowerCase().charCodeAt(0) || 0;
  const semis = (code % 13) - 6;                  // -6..+6 semitones
  const freq = 440 * Math.pow(2, semis / 12) * rate;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'square'; o.frequency.value = freq;
  const t = a.currentTime, dur = 0.055;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur);
}

export const fb = {
  /** A knob detent / small UI tick. */
  tick()    { tone(880, 0.03, 'square', 0.04); buzz(4); },
  /** A button press. */
  press()   { tone(420, 0.05, 'square', 0.06); buzz(8); },
  /** A toggle flip. */
  toggle(on){ tone(on ? 660 : 440, 0.06, 'square', 0.06); buzz(10); },
  /** Confirm / select. */
  confirm() { tone(523, 0.07, 'triangle', 0.07); setTimeout(() => tone(784, 0.09, 'triangle', 0.07), 70); buzz([8, 20, 8]); },
  /** Countdown blip. */
  count(go) { tone(go ? 988 : 587, go ? 0.18 : 0.08, 'square', 0.08); buzz(go ? 40 : 12); },
  /** Win fanfare. */
  win()     { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.08), i * 110)); buzz([12, 30, 12, 30]); },
  /** Lose. */
  lose()    { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'sawtooth', 0.06), i * 130)); buzz(60); },
  /** A soft thud / contact. */
  thud()    { tone(140, 0.08, 'sine', 0.09); buzz(15); },
  /** Comedy "oof" — a quick descending blip when a Zook flops over. */
  oof()     { if (muted) return; const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain();
              o.type = 'sawtooth'; const t = a.currentTime;
              o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.18);
              g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
              o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.2); buzz(20); },
};
