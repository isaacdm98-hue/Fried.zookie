/**
 * guide.js — the immersive curation guide ("Fried").
 *
 * An Animal-Crossing-style speaking mascot: text types out character by
 * character while a pitched blip plays per letter (animalese). Used throughout
 * the game to teach and curate, drawing its lines from the BAMZOOKi manual.
 */

import { voice, fb } from './feedback.js';

let bubble = null, avatar = null, nameEl = null, textEl = null, mount = null;
let queue = [], speaking = false, skip = false, rate = 1.06;

function ensure() {
  if (bubble) return;
  mount = document.getElementById('ui') || document.body;
  bubble = document.createElement('div');
  bubble.className = 'guide hidden';
  bubble.innerHTML = `
    <div class="guide-avatar"><div class="g-face"><span class="g-eye"></span><span class="g-eye"></span></div></div>
    <div class="guide-bubble"><span class="guide-name">Fried</span><p class="guide-text"></p></div>`;
  mount.appendChild(bubble);
  avatar = bubble.querySelector('.guide-avatar');
  nameEl = bubble.querySelector('.guide-name');
  textEl = bubble.querySelector('.guide-text');
  // Tap the bubble to skip/advance.
  bubble.addEventListener('pointerdown', () => { skip = true; });
}

function typeOut(text) {
  return new Promise((resolve) => {
    let i = 0; skip = false;
    textEl.textContent = '';
    bubble.classList.add('talking');
    const step = () => {
      if (skip) { textEl.textContent = text; finish(); return; }
      const ch = text[i++];
      textEl.textContent += ch;
      if (ch && ch.trim()) voice(ch, rate);
      if (i < text.length) { setTimeout(step, ch === ' ' ? 18 : 34); }
      else setTimeout(finish, 450);
    };
    const finish = () => { bubble.classList.remove('talking'); resolve(); };
    step();
  });
}

let _hideTimer = null;
async function run() {
  if (speaking) return;
  speaking = true;
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
  while (queue.length) {
    const { text, name, voiceRate } = queue.shift();
    nameEl.textContent = name || 'Fried';
    rate = voiceRate || 1.06;
    bubble.classList.remove('hidden');
    await typeOut(text);
  }
  speaking = false;
  // Auto-hide so Fried isn't always on screen.
  _hideTimer = setTimeout(() => { if (!speaking && !queue.length) bubble.classList.add('hidden'); }, 3200);
}

let enabled = true;
try { enabled = localStorage.getItem('fz-guide') !== 'off'; } catch (_) {}

export const guide = {
  /** Queue a line. Returns nothing; lines play in order. */
  say(text, opts = {}) { if (!enabled) return; ensure(); queue.push({ text, ...opts }); run(); },
  /** Speak immediately, clearing the queue (e.g. on screen change). */
  now(text, opts = {}) { if (!enabled) return; ensure(); queue = [{ text, ...opts }]; if (!speaking) run(); },
  hide() { if (bubble) { bubble.classList.add('hidden'); queue = []; } },
  setName(n) { if (nameEl) nameEl.textContent = n; },
  /** Turn Fried's commentary on/off (persisted). */
  setEnabled(on) { enabled = !!on; try { localStorage.setItem('fz-guide', on ? 'on' : 'off'); } catch (_) {} if (!on) { queue = []; this.hide(); } },
  get enabled() { return enabled; },
};

// A few manual-flavoured lines, keyed by screen, for curation.
export const TIPS = {
  title:   "Now then! Welcome to FriedZooki. Tap to begin, and let's build ourselves a Zook!",
  menu:    "What shall we do? Build a new Zook, enter a contest, or link up for two-player!",
  build:   "This round part is the body — the root. Use the dials to stretch and squash it. The red arrow shows the way it'll go!",
  add:     "Now add some legs! More legs, more grip. Mirror makes a matching pair on the other side.",
  move:    "Make it move! Movement Cycle staggers the legs so it doesn't trip. Speed and Stride set the pace.",
  paint:   "Give it some colour! Pick a shade for the body and the feet. Make it YOURS.",
  test:    "Tap the floor to set a target — your Zook will scurry to it. Tap the Zook to float it for a better look!",
  contest: "Two Zooks enter, one wins! Green is yours, red is the rival. Pick a contest and we'll find out who's best.",
  versus:  "Link up! Player one, then player two — pass it along, just like the old handhelds. Best Zook takes it!",
};
