/**
 * library.js — example Zooks + the player's saved roster.
 *
 * Curation: a set of ready-made Zooks to test and compete against (echoing the
 * Zook Kit's example library — Spider, Worm, Ant…), plus localStorage save/load
 * for the Zooks the player builds.
 */

import { defaultBlueprint, makeDefaultLegs } from './model.js';

const base = defaultBlueprint;

// Build a staggered set of mirrored legs, then stamp shared per-leg properties
// (length, thickness, style, movement type, part-targeting) across them.
function legsFor(pairs, { len = 0.72, thick = 0.16, style = 'crawl', moveType = 'auto', target = 'off', spread = 0.42 } = {}) {
  const legs = makeDefaultLegs(pairs);
  const n = pairs;
  legs.forEach((l, i) => {
    l.len = len; l.thick = thick; l.style = style; l.moveType = moveType; l.target = target;
    // spread the pairs along the body so long creatures read as segmented
    const p = Math.floor(i / 2);
    l.along = n > 1 ? spread * (0.5 - p / (n - 1)) * 2 : 0;
  });
  return legs;
}

/** A daft name to suggest for a new Zook. */
const FUNNY_NAMES = [
  'Sir Wobblesworth', 'Leg Zeppelin', 'Wobbledore', 'Trip Hazard', 'Sir Flops-a-Lot',
  'Lord Lurch', 'Mc Stumble', 'Count Tumbula', 'Noodle Legs', 'Wobbly McWobbleface',
  'Captain Carnage', 'General Flop', 'Tippy Longstocking', 'The Lurchminator', 'Sir Scuttle',
  'Crab Boss', 'Hexapod Harry', 'Baron von Bumble', 'Scuttlebug', 'Sir Topples',
];
export function randomName() { return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)]; }

/** Named example Zooks, each a tuned blueprint. */
// The original Zook Kit example roster (Spider, Wormthing, Ant, Twigger, Leapsa,
// Scrabber), recreated faithfully — proportions and gaits echo the manual's
// descriptions, with the new movement features (Wormthing flexes its spine via
// Part Targeting; styles vary per creature).
export const EXAMPLES = [
  { name: 'Spider',   bp: { ...base(), hue: 0.02, footHue: 0.02, len: 1.8, width: 1.55, height: 0.48, square: 0.45, pointy: 0.3, speed: 3.0, stride: 0.7,  turnSharp: 1.6,
      legs: legsFor(4, { len: 0.9,  thick: 0.15, style: 'crawl', spread: 0.4 }) } },
  { name: 'Wormthing',bp: { ...base(), hue: 0.33, footHue: 0.30, len: 3.2, width: 1.0, height: 0.45, square: 0.3,  pointy: 0.55, speed: 3.0, stride: 0.6,  targetAngle: 0.5,
      legs: legsFor(5, { len: 0.5,  thick: 0.14, style: 'crawl', target: 'inverted', spread: 0.46 }) } },
  { name: 'Ant',      bp: { ...base(), hue: 0.07, footHue: 0.02, len: 2.2, width: 1.0, height: 0.6,  square: 0.45, pointy: 0.5,  speed: 2.8, stride: 0.8,
      legs: legsFor(3, { len: 0.7,  thick: 0.15, style: 'crawl', spread: 0.44 }) } },
  { name: 'Twigger',  bp: { ...base(), hue: 0.14, footHue: 0.14, len: 1.6, width: 1.3, height: 0.5, square: 0.4,  pointy: 0.5,  speed: 2.6, stride: 0.8,
      legs: legsFor(3, { len: 0.95, thick: 0.13, style: 'crawl', spread: 0.42 }) } },
  { name: 'Leapsa',   bp: { ...base(), hue: 0.55, footHue: 0.55, len: 1.5, width: 1.35, height: 0.55, square: 0.6, pointy: 0.35, speed: 2.6, stride: 0.85, stiffness: 1.1,
      legs: legsFor(3, { len: 0.8,  thick: 0.18, style: 'stomp', spread: 0.4 }) } },
  { name: 'Scrabber', bp: { ...base(), hue: 0.6,  footHue: 0.6,  len: 1.6, width: 1.5, height: 0.45, square: 0.55, pointy: 0.3,  speed: 3.3, stride: 0.65,
      legs: legsFor(4, { len: 0.55, thick: 0.16, style: 'push',  spread: 0.42 }) } },
];

export function randomExample() { return EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]; }

// ── Roster (localStorage) ─────────────────────────────────────────────────────
const KEY = 'friedzooki.roster.v1';

export function loadRoster() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { return []; }
}
export function saveRoster(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
}
/** Add/replace a named Zook in the roster; returns the new roster. */
export function saveZook(name, bp) {
  const list = loadRoster();
  const i = list.findIndex(z => z.name === name);
  const entry = { name, bp: { ...bp }, ts: Date.now() };
  if (i >= 0) list[i] = entry; else list.push(entry);
  saveRoster(list);
  return list;
}
