// ── Zook Passport — genome identity, bloodline & modification tracking ────────
//
// Faithful to the original BAMZOOKi `ZookPassport.lua` (+ `BuilderParts.lua`
// genome passport). In the show every Zook carried a passport: a unique id, a
// moniker, an owner, a "born/adopted" date, an **ownership bloodline** (you could
// adopt a stray Zook someone else built — its lineage followed it), and a record
// of **what kind of changes** each owner made, split into the four official
// modification classes:
//
//   CREATIVE_MOD  — added / removed parts          (sculpting new anatomy)
//   PHYSICAL_MOD  — scale / shape / position       (re-proportioning)
//   DYNAMIC_MOD   — movement (gait, cycle, muscle)  (re-choreographing)
//   COSMETIC_MOD  — colour / skin / texture         (re-decorating)
//
// We store all of this on `bp.passport` so it travels with the genome (saved to
// the roster, carried into contests). Older blueprints get an identity lazily.

export const MOD_TYPES = ['creative', 'physical', 'dynamic', 'cosmetic'];
const MOD_LABEL = { creative: 'Creative', physical: 'Physical', dynamic: 'Movement', cosmetic: 'Cosmetic' };

function hex(n) { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16); return s.toUpperCase(); }
/** 8-hex uid / 16-hex moniker, exactly like GenerateUID(8)/GenerateUID(16). */
export function genUID(len = 8) { return hex(len); }
function today() { return new Date().toISOString().slice(0, 10); }
function zeroMods() { return { creative: 0, physical: 0, dynamic: 0, cosmetic: 0 }; }

/** The current player's owner name (DEFAULT_ZOOK_OWNER_NAME → shown as "You"). */
export function ownerName() { try { return localStorage.getItem('fz-owner') || 'You'; } catch (_) { return 'You'; } }
export function setOwnerName(n) { try { localStorage.setItem('fz-owner', (n || 'You').slice(0, 20)); } catch (_) {} }

/**
 * Attach a passport if one is missing. `creator` seeds the first owner of the
 * bloodline (used to stamp the built-in example Zooks as born to "BAMZOOKi
 * Studios", so adopting & editing one shows a real two-generation lineage).
 */
export function ensurePassport(bp, { creator } = {}) {
  if (!bp) return bp;
  let p = bp.passport;
  if (!p || !p.uid) {
    p = bp.passport = { uid: genUID(8), moniker: genUID(16), born: today(), lineage: [] };
  }
  if (!Array.isArray(p.lineage) || !p.lineage.length) {
    p.lineage = [{ owner: creator || ownerName(), uid: genUID(8), date: p.born || today(), mods: zeroMods() }];
  }
  return bp;
}

/** The owner currently holding the Zook (last in the bloodline). */
export function currentOwner(bp) { ensurePassport(bp); const l = bp.passport.lineage; return l[l.length - 1]; }

/**
 * Make sure the active player owns this Zook — if the last owner is someone else
 * (e.g. a built-in example born to "BAMZOOKi Studios"), the player **adopts** it:
 * a fresh generation is appended to the bloodline. This is exactly the stray /
 * adoption flow from the original.
 */
export function adopt(bp) {
  ensurePassport(bp);
  const me = ownerName();
  const l = bp.passport.lineage;
  if (l[l.length - 1].owner !== me) l.push({ owner: me, uid: genUID(8), date: today(), mods: zeroMods() });
  return l[l.length - 1];
}

/** Record one modification of `type` against the active owner (adopting first). */
export function recordMod(bp, type) {
  if (!bp || !MOD_TYPES.includes(type)) return;
  const gen = adopt(bp);
  gen.mods[type] = (gen.mods[type] || 0) + 1;
}

/** Total tweaks an owner made (sum of the four classes). */
function ownerTotal(g) { return MOD_TYPES.reduce((s, t) => s + (g.mods[t] || 0), 0); }

/**
 * Physical stats in show-units. Our world is ~10× life-size; the manual's Wizard
 * limits are H 15 / W 40 / L 35 cm, ≤ 2 kg, ≤ 25 components — so we map 1 model
 * unit ≈ 18 cm and a light-foam density to land a normal Zook around ~1 kg.
 */
const U2CM = 18;
export function realStats(bp) {
  const legs = bp.legs || [], blobs = bp.blobs || [];
  const L = bp.len * U2CM, W = bp.width * U2CM, H = bp.height * U2CM;
  // crude volume: body ellipsoid + each part's box, in model-units³
  let vol = bp.len * bp.width * bp.height * 0.52;
  for (const l of legs) vol += (l.len || 0.72) * 0.16 * 0.16 * 7 * (l.sx || 1) * (l.sy || 1) * (l.sz || 1) * 0.5;
  for (const b of blobs) vol += (b.sx || 0.7) * (b.sy || 0.7) * (b.sz || 0.7) * 0.52;
  const weight = vol * 1.15;                               // kg-ish, tuned to ~1 kg default
  const components = 1 + legs.length + blobs.length + (bp.antennae ? 2 : 0) + (bp.tail ? 1 : 0);
  return { L, W, H, weight, components };
}

/** Pretty summary for the passport UI. */
export function passportView(bp) {
  ensurePassport(bp);
  const p = bp.passport, l = p.lineage;
  const grandTotal = l.reduce((s, g) => s + ownerTotal(g), 0) || 1;
  const cur = l[l.length - 1];
  return {
    uid: p.uid, moniker: p.moniker, born: p.born,
    owner: cur.owner, ownerSince: cur.date,
    generations: l.length,
    bloodline: l.map(g => ({ owner: g.owner, date: g.date, share: Math.round(ownerTotal(g) / grandTotal * 100) })),
    mods: MOD_TYPES.map(t => ({ key: t, label: MOD_LABEL[t], count: cur.mods[t] || 0 })),
    stats: realStats(bp),
  };
}
