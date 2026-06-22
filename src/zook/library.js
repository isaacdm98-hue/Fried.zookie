/**
 * library.js — example Zooks + the player's saved roster.
 *
 * Curation: a set of ready-made Zooks to test and compete against (echoing the
 * Zook Kit's example library — Spider, Worm, Ant…), plus localStorage save/load
 * for the Zooks the player builds.
 */

import { defaultBlueprint, makeDefaultLegs } from './model.js';
import { REAL_ZOOKS } from './zooks-data.js';

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
// The authentic Series-1 roster, decoded straight from the original encrypted
// .zook genome files (see tools/decode-zooks.mjs). Each carries its real part
// tree — body proportions, every clay part's position/scale/mesh/colour and the
// limbs' movement — so these ARE the original Spider, Wormthing, Ant, Twigger,
// Leapsa and Scrabber, not lookalikes. Legs are expressed as clay parts (the
// genome has no separate "leg" objects), so the leg array stays empty.
export const EXAMPLES = REAL_ZOOKS.map(z => ({ name: z.name, bp: { ...base(), legs: [], antennae: false, ...z.bp } }));

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
