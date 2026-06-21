/**
 * library.js — example Zooks + the player's saved roster.
 *
 * Curation: a set of ready-made Zooks to test and compete against (echoing the
 * Zook Kit's example library — Spider, Worm, Ant…), plus localStorage save/load
 * for the Zooks the player builds.
 */

import { defaultBlueprint } from './model.js';

const base = defaultBlueprint;

/** Named example Zooks, each a tuned blueprint. */
export const EXAMPLES = [
  { name: 'Spider',  bp: { ...base(), hue: 0.02, footHue: 0.02, len: 1.7, width: 1.3, height: 0.55, square: 0.5, pointy: 0.3, legPairs: 4, legLen: 0.95, speed: 3.0, stride: 0.7 } },
  { name: 'Worm',    bp: { ...base(), hue: 0.33, footHue: 0.33, len: 3.0, width: 0.7, height: 0.6, square: 0.3, pointy: 0.6, legPairs: 4, legLen: 0.4, speed: 3.4, stride: 0.6 } },
  { name: 'Ant',     bp: { ...base(), hue: 0.07, footHue: 0.02, len: 2.2, width: 0.9, height: 0.7, square: 0.45, pointy: 0.5, legPairs: 3, legLen: 0.7, speed: 2.8, stride: 0.8 } },
  { name: 'Tank',    bp: { ...base(), hue: 0.58, footHue: 0.58, len: 2.0, width: 1.6, height: 1.0, square: 0.85, pointy: 0.1, legPairs: 3, legLen: 0.6, speed: 2.0, stride: 0.6 } },
  { name: 'Twigger', bp: { ...base(), hue: 0.13, footHue: 0.13, len: 1.5, width: 0.8, height: 0.5, square: 0.4, pointy: 0.5, legPairs: 2, legLen: 1.1, speed: 2.6, stride: 0.9 } },
  { name: 'Nipper',  bp: { ...base(), hue: 0.92, footHue: 0.92, len: 1.4, width: 1.1, height: 0.6, square: 0.6, pointy: 0.4, legPairs: 3, legLen: 0.65, speed: 3.2, stride: 0.75 } },
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
