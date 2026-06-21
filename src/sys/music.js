/**
 * music.js — generative ambient soundtrack, per game mode.
 *
 * No audio files (keeps the PWA tiny + offline): a slow chord PAD with a tremolo
 * LFO, an optional low DRONE, and a sparse generative MELODY, all tuned per mood.
 * Different bed for each screen; tense & minor for the championship. Runs on the
 * same AudioContext as the SFX and obeys the global mute.
 */

import { audioCtx, isMuted } from './feedback.js';

// root (Hz), chord (semitones), melody scale, waveform, levels, melody spacing,
// tremolo rate, and a sub drone level.
const MOODS = {
  menu:    { root: 220.00, chord: [0, 7, 12, 16], scale: [0, 2, 4, 7, 9],     wave: 'sine',     pad: 0.040, mel: 0.045, every: [1.8, 3.2], trem: 0.06, drone: 0.000 },
  build:   { root: 174.61, chord: [0, 7, 14],     scale: [0, 3, 5, 7, 10],    wave: 'triangle', pad: 0.038, mel: 0.040, every: [1.3, 2.6], trem: 0.10, drone: 0.000 },
  contest: { root: 261.63, chord: [0, 4, 7, 11],  scale: [0, 2, 4, 7, 9],     wave: 'triangle', pad: 0.036, mel: 0.045, every: [0.8, 1.4], trem: 0.18, drone: 0.000 },
  champ:   { root: 130.81, chord: [0, 3, 7, 10],  scale: [0, 2, 3, 5, 7, 10], wave: 'sawtooth', pad: 0.045, mel: 0.050, every: [0.6, 1.1], trem: 0.28, drone: 0.040 },
  run:     { root: 196.00, chord: [0, 7],         scale: [0, 3, 5, 7, 10],    wave: 'sawtooth', pad: 0.030, mel: 0.045, every: [0.4, 0.6], trem: 0.5,  drone: 0.030 },
};

let want = null;       // desired mood (survives mute)
let active = null;     // currently sounding mood
let pad = [], padGain = null, lfo = null, lfoGain = null, drone = null, droneGain = null, melTimer = null;

function blip(freq, dur, type, g) {
  const a = audioCtx(); if (!a) return;
  const o = a.createOscillator(), gn = a.createGain();
  o.type = type; o.frequency.value = freq;
  const t = a.currentTime;
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(g, t + 0.09);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function teardown() {
  if (melTimer) { clearTimeout(melTimer); melTimer = null; }
  const a = audioCtx();
  try { if (padGain && a) { padGain.gain.cancelScheduledValues(a.currentTime); padGain.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.4); } } catch (_) {}
  try { if (droneGain && a) droneGain.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.4); } catch (_) {}
  const old = { pad, lfo, drone };
  setTimeout(() => {
    try { old.pad.forEach(o => o.stop()); } catch (_) {}
    try { old.lfo && old.lfo.stop(); } catch (_) {}
    try { old.drone && old.drone.stop(); } catch (_) {}
  }, 500);
  pad = []; padGain = lfo = lfoGain = drone = droneGain = null;
}

function build(mood) {
  const a = audioCtx(); if (!a) return;
  const M = MOODS[mood] || MOODS.menu;
  padGain = a.createGain(); padGain.gain.value = 0.0001; padGain.connect(a.destination);
  padGain.gain.linearRampToValueAtTime(M.pad, a.currentTime + 2.5);
  pad = M.chord.map(semi => { const o = a.createOscillator(); o.type = M.wave; o.frequency.value = M.root * Math.pow(2, semi / 12); o.connect(padGain); o.start(); return o; });
  // tremolo LFO modulating the pad level
  lfo = a.createOscillator(); lfoGain = a.createGain();
  lfo.frequency.value = M.trem; lfoGain.gain.value = M.pad * 0.5;
  lfo.connect(lfoGain); lfoGain.connect(padGain.gain); lfo.start();
  // sub drone (tension)
  if (M.drone) {
    drone = a.createOscillator(); droneGain = a.createGain();
    drone.type = 'sine'; drone.frequency.value = M.root / 2; droneGain.gain.value = M.drone;
    drone.connect(droneGain); droneGain.connect(a.destination); drone.start();
  }
  // sparse generative melody
  const step = () => {
    if (active !== mood) return;
    const semi = M.scale[Math.floor(Math.random() * M.scale.length)] + 12;
    blip(M.root * Math.pow(2, semi / 12), 0.5 + Math.random() * 0.6, M.wave, M.mel);
    const [lo, hi] = M.every; melTimer = setTimeout(step, (lo + Math.random() * (hi - lo)) * 1000);
  };
  melTimer = setTimeout(step, 900);
}

export const music = {
  /** Switch to a mood's bed (no-op if already playing it). */
  play(mood) {
    want = mood;
    if (isMuted()) { if (active) { teardown(); active = null; } return; }
    if (active === mood) return;
    teardown(); active = mood; build(mood);
  },
  stop() { teardown(); active = null; },             // keeps `want`
  /** Called from the SOUND toggle. */
  mute(on) { if (on) { teardown(); active = null; } else if (want) this.play(want); },
};
