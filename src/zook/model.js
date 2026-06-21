/**
 * model.js — the Zook.
 *
 * Built to the BAMZOOKi Zook Kit model (see the manual):
 *  • A shapeable root body — Length, Width, Height, Squareness, Pointiness —
 *    with a red direction arrow showing which way it moves.
 *  • Leg parts added in mirrored pairs, each running the same cycle but
 *    phase-offset (the "Movement Cycle" 0..1) so legs sweep in a wave.
 *  • The Zook walks toward a target on the floor.
 *
 * One class serves both the spinning workshop preview (no physics) and the
 * test table (a driven rigid body that walks on its gait toward a target).
 */

import * as THREE from 'three';

// ── Blueprint ────────────────────────────────────────────────────────────────

export function defaultBlueprint() {
  return {
    // Proportions follow the Zook Kit "Baseline Zook" (research paper, Table 1):
    // ~10cm high × 30cm wide × 30cm long — i.e. WIDE and FLAT, which is what
    // keeps it stable (Table 2: "falls over → increase width"). Our units are
    // ~10× life size so the creature reads well on a phone.
    hue:       0.08,   // body colour 0..1
    footHue:   0.08,   // foot colour 0..1
    len:       1.7,    // body length  (nose↔tail, Z)
    width:     1.5,    // body width   (X) — wide for a stable stance
    height:    0.58,   // body height  (Y) — low and flat
    square:    0.55,   // 0 round … 1 boxy
    pointy:    0.35,   // nose taper 0..1
    flatEnd:   0.0,    // flatten the tail end 0..1
    flatSide:  0.0,    // flatten the sides 0..1
    // Extra body blobs (modelling-clay lumps) added to the root, each a scaled
    // blob at an offset — build up an organic shape like the real Zook Kit.
    blobs:     [],     // [{ x,y,z, sx,sy,sz }]
    // Legs are individual parts: each placed on the body with its own side,
    // along-body position, size, style and Movement Cycle (phase 0..1).
    // Mirroring is an optional action, not forced.
    legs:      makeDefaultLegs(3),
    legThick:  0.16,   // default thickness for new legs
    antennae:  false,  // decorative part
    tail:      false,  // decorative part
    antTarget: 'normal', // Part Targeting for antennae: off | normal(away) | inverted(toward)
    tailTarget:'off',    // Part Targeting for the tail
    targetAngle: 0.5,    // global Part Targeting Angle (how far targeted parts swing)
    pattern:   'none', // none | stripes | spots
    patternScale: 1.0, // texture size (manual: scroll to size the texture)
    bright:    0.0,    // body brightness -1..1 (manual: brightness slider)
    speed:     2.4,    // 1..4 cycle frequency (Hz)
    stride:    0.5,    // 0.3..1.3 swing amplitude
    footAngle: 0.2,
    turnSharp: 1.5,    // how hard it turns toward a target
    turnSmooth:0.85,   // steering damping
    stiffness: 1.0,    // limb stiffness 0.5..2 — stronger push & more upright
  };
}

let _pairSeq = 1;
export function newPairId() { return _pairSeq++; }

/** The default foot path (IK points): plant → push back → lift → swing forward. */
export function defaultPath() {
  return [
    { f:  0.6, h: 0.0 },   // 1 forward contact
    { f:  0.1, h: 0.0 },   // 2 mid stance
    { f: -0.5, h: 0.0 },   // 3 push back (on ground → propels)
    { f: -0.6, h: 0.55 },  // 4 lift off
    { f:  0.0, h: 1.0 },   // 5 swing up
    { f:  0.5, h: 0.5 },   // 6 reach forward
  ];
}

/** A new leg part. `pair` links mirror partners (same id, opposite side). */
export function makeLeg(side, along, { len = 0.72, thick = 0.16, style = 'crawl', cycle = 0, pair = newPairId(), move = 'two', moveType = 'auto', path } = {}) {
  return { side, along, len, thick, style, cycle, pair, move, moveType, path: path || defaultPath() };
}

/** Default crawl: pairs down the body, staggered movement cycles. */
export function makeDefaultLegs(pairs = 3) {
  const legs = [];
  for (let p = 0; p < pairs; p++) {
    const along = pairs > 1 ? 0.4 * (0.5 - p / (pairs - 1)) : 0;
    const c = pairs > 1 ? p / pairs : 0;
    const pair = newPairId();
    legs.push(makeLeg( 1, along, { cycle: c, pair }));
    legs.push(makeLeg(-1, along, { cycle: (c + 0.5) % 1, pair }));   // opposite side, half-cycle
  }
  return legs;
}

/** Ensure a blueprint has a legs array (synthesising from old fields if needed). */
export function ensureLegs(bp) {
  if (Array.isArray(bp.legs)) {
    // Back-compat: make sure every leg has a foot path + movement type.
    for (const l of bp.legs) { if (!Array.isArray(l.path)) l.path = defaultPath(); if (!l.move) l.move = 'two'; if (!l.moveType) l.moveType = 'auto'; }
    return bp.legs;
  }
  const pairs = bp.legPairs || 3;
  bp.legs = makeDefaultLegs(pairs).map(l => ({ ...l, len: bp.legLen || 0.72, thick: bp.legThick || 0.16, style: bp.legStyle || 'crawl' }));
  return bp.legs;
}
/** A brand-new Zook: just the root body, no legs — you build it yourself. */
export function blankBlueprint() { return { ...defaultBlueprint(), legs: [] }; }

export function cloneBlueprint(b) {
  return {
    ...b,
    legs: Array.isArray(b.legs)
      ? b.legs.map(l => ({ ...l, path: Array.isArray(l.path) ? l.path.map(p => ({ ...p })) : l.path }))
      : b.legs,
    blobs: Array.isArray(b.blobs) ? b.blobs.map(x => ({ ...x })) : [],
  };
}

/** Sample a looped foot path at phase u (0..1) → { f, h }. */
function samplePath(path, u) {
  const n = path.length, x = ((u % 1) + 1) % 1 * n, i = Math.floor(x) % n, fr = x - Math.floor(x);
  const a = path[i], b = path[(i + 1) % n];
  return { f: a.f + (b.f - a.f) * fr, h: a.h + (b.h - a.h) * fr };
}

// ── Materials ────────────────────────────────────────────────────────────────

const mat = (hue, l = 0.55, rough = 0.45) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.72, l), roughness: rough, metalness: 0.05 });
const EYE_WHITE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
const EYE_DARK  = new THREE.MeshStandardMaterial({ color: 0x140f1c, roughness: 0.2 });
const ARROW_MAT = new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.5, emissive: 0x330000 });
const HILITE    = new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xf0782d, emissiveIntensity: 0.5, roughness: 0.4, flatShading: true });
// Shared unit blob (low-poly sphere) — limbs are scaled blobs, like the real
// Zook Kit (every part is a squished "Blob" mesh) so the creature reads as one.
const BLOB_GEO  = new THREE.SphereGeometry(0.5, 10, 8);

// ── Locomotion physics (the BAMZOOKi / Karma feel) ────────────────────────────
// The Zook is one rigid body, but it walks through GENUINE foot-ground contact:
// each leg's foot follows its IK path; while a foot is planted, it (a) holds the
// body up with a support spring and (b) grips the floor, so the path's backstroke
// drives the body forward — and the forces enter the body at the hips, off the
// centre of mass, so the creature balances, wobbles and tips just like the real
// thing. A good walker has to be *designed*: plant the feet, sweep them back,
// stagger the cycle. Nothing is scripted.
const GROUND_Y = 0;     // floor / table top in every arena
const LIFT     = 0.55;  // swing-foot lift, as a fraction of leg reach
const FREACH   = 0.55;  // forward foot travel (× stride × reach)
const PLANT_H  = 0.34;  // path height below which the foot is "planted"
const K_SUP    = 200;   // support-spring stiffness  (N per m of compression)
const C_SUP    = 26;    // support-spring damping (near-critical → no pogo bounce)
const MU       = 1.3;   // foot↔floor traction coefficient (caps grip by load)
const GRIP     = 72;    // traction stiffness (N per m/s of contact slip)
const F_MAX    = 70;    // hard clamp on any single foot's vertical force (no blowups)
const UPRIGHT  = 0.4;   // body up·worldUp below this ⇒ flopped, feet can't get purchase

function quatRot(q, v) {
  // rotate vector v by quaternion q (x,y,z,w)
  const ix =  q.w * v.x + q.y * v.z - q.z * v.y;
  const iy =  q.w * v.y + q.z * v.x - q.x * v.z;
  const iz =  q.w * v.z + q.x * v.y - q.y * v.x;
  const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}
function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function legReach(leg) { const S = LEG_STYLES[leg.style] || LEG_STYLES.crawl; return leg.len * (S.u + S.l); }

// ── Zook ─────────────────────────────────────────────────────────────────────

export class Zook {
  constructor(bp, opts = {}) {
    this.bp      = cloneBlueprint(bp);
    this.scene   = opts.scene || null;
    this.world   = opts.world || null;
    this.RAPIER  = opts.RAPIER || null;
    this.preview = !!opts.preview;
    this._pos    = opts.pos || { x: 0, y: 0, z: 0 };
    this.showArrow = !!opts.showArrow;

    this.group  = new THREE.Group();
    this._legs  = [];
    this._body  = null;
    this._highlight = (opts.highlight == null ? -1 : opts.highlight);
    this._t = 0; this._steer = 0; this._onGround = true; this._bob = 0;

    this._buildMeshes();
    if (this.scene) this.scene.add(this.group);
    if (!this.preview) this._buildBody();
    this._place();
  }

  get dims() {
    const { len, width, height } = this.bp;
    const legs = ensureLegs(this.bp);
    // Standing height: the hip sits a little below the body centre, and the leg
    // reaches down to the floor from there. No legs ⇒ it rests on its belly.
    const maxReach = legs.length ? Math.max(...legs.map(legReach)) : 0;
    const rest = legs.length ? height * 0.32 + maxReach : height / 2;
    return { w: width, h: height, l: len, rest };
  }

  // ── Geometry ──────────────────────────────────────────────────────────────
  _buildMeshes() {
    // Dispose the previous build's unique geometries/materials (not shared ones).
    this.group.traverse(o => {
      if (o.isMesh) {
        if (o.geometry && o.geometry !== BLOB_GEO) o.geometry.dispose();
        if (o.material && o.material !== HILITE && o.material !== EYE_WHITE && o.material !== EYE_DARK && o.material !== ARROW_MAT) o.material.dispose();
      }
    });
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this._legs = []; this._antennae = [];
    const bp = this.bp;
    const bri = Math.max(-1, Math.min(1, bp.bright || 0));
    const bMat = mat(bp.hue, 0.55 + bri * 0.32), lMat = mat(bp.footHue, 0.48 + bri * 0.28, 0.55);
    bMat.flatShading = true; lMat.flatShading = true;   // faceted, organic look
    const tex = patternTexture(bp.pattern);
    if (tex) {
      const t = tex.clone(); t.needsUpdate = true;
      const base = (bp.pattern === 'camo' || bp.pattern === 'plaster') ? 2 : 3;
      const s = bp.patternScale || 1; t.repeat.set(base * s, 2 * s);
      bMat.map = t;
    }

    // Shapeable root body.
    const body = new THREE.Mesh(shapeBody(bp), bMat);
    body.castShadow = body.receiveShadow = true;
    body.userData.isBody = true;                 // tap-target for placing parts
    this.group.add(body);

    // Extra body blobs (modelling clay): scaled blobs merged onto the root.
    this._blobs = [];
    (bp.blobs || []).forEach((bl, i) => {
      const mb = new THREE.Mesh(BLOB_GEO, bMat);
      mb.scale.set(bl.sx || 0.7, bl.sy || 0.7, bl.sz || 0.7);
      mb.position.set(bl.x || 0, bl.y || 0, bl.z || 0);
      mb.castShadow = mb.receiveShadow = true;
      mb.userData.blobIndex = i;
      this.group.add(mb);
      this._blobs.push(mb);
    });

    // Red direction arrow on the back (workshop only).
    if (this.showArrow) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(bp.width * 0.16, bp.len * 0.4, 4), ARROW_MAT);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, bp.height * 0.5 + 0.02, -bp.len * 0.1);
      this.group.add(arrow);
    }

    // Big friendly googly eyes near the nose (forward = -Z); pupil + glint face
    // the viewer. Each eye is a group so we can blink it (squash on Y).
    this._eyes = [];
    const eyeR = bp.height * 0.21, noseZ = -bp.len / 2 * (1 - bp.pointy * 0.45);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(sx * bp.width * 0.26, bp.height * 0.27, noseZ + eyeR * 0.25);
      const w = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 16, 12), EYE_WHITE);
      const p = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.56, 12, 10), EYE_DARK);
      p.position.set(sx * eyeR * 0.1, -eyeR * 0.04, -eyeR * 0.55);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.2, 8, 8), EYE_WHITE);
      glint.position.set(sx * eyeR * 0.3, eyeR * 0.24, -eyeR * 0.72);
      eye.add(w, p, glint);
      this.group.add(eye); this._eyes.push(eye);
    }

    // Legs: individual parts, each with its own placement, size, style and
    // Movement Cycle. The selected leg (workshop) is highlighted.
    const legs = ensureLegs(bp);
    const hipY = -bp.height * 0.32;
    legs.forEach((leg, i) => {
      const S = LEG_STYLES[leg.style] || LEG_STYLES.crawl;
      const thick = leg.thick * 1.5, len = leg.len, u = len * S.u, l = len * S.l;
      const m = (i === this._highlight) ? HILITE : lMat;
      // Hips sit slightly inside the body so the limb merges into it.
      const x = leg.side * bp.width * 0.4;
      const z = leg.along * bp.len * 0.46;
      const pivot = new THREE.Group();
      pivot.position.set(x, hipY, z);
      pivot.rotation.z = leg.side * S.splay;
      // Upper limb: a stretched blob whose top overlaps the body (attached).
      const up = new THREE.Mesh(BLOB_GEO, m);
      up.scale.set(thick, u * 1.15, thick); up.position.y = -u / 2; up.castShadow = true; pivot.add(up);
      const knee = new THREE.Group(); knee.position.y = -u; knee.rotation.z = -leg.side * S.splay; pivot.add(knee);
      const low = new THREE.Mesh(BLOB_GEO, m);
      low.scale.set(thick * 0.9, l * 1.1, thick * 0.9); low.position.y = -l / 2; low.castShadow = true; knee.add(low);
      const foot = new THREE.Mesh(BLOB_GEO, m);
      foot.scale.set(thick * 1.5, thick * 0.7, thick * 2.0); foot.position.set(0, -l, thick * 0.4); foot.castShadow = true; knee.add(foot);
      up.userData.legIndex = i; low.userData.legIndex = i; foot.userData.legIndex = i;   // for touch-picking
      this.group.add(pivot);
      this._legs.push({ pivot, knee, foot, side: leg.side, swingMul: S.swing, moveType: leg.moveType || 'auto',
        path: leg.path || defaultPath(), cycle: leg.cycle || 0, move: leg.move || 'two', style: leg.style || 'crawl',
        hip: { x, y: hipY, z }, reach: u + l, splay: S.splay, S,
        _footLocal: null, _footPrev: null, _planted: false });
    });

    // Decorative parts (Add menu): antennae on the nose, a tail at the back.
    // Antennae do Part Targeting — they lean toward the floor target.
    if (bp.antennae) {
      const at = bp.legThick;
      const aGeo = new THREE.CylinderGeometry(at * 0.18, at * 0.3, bp.height * 0.9, 6);
      for (const sx of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(sx * bp.width * 0.18, bp.height * 0.5, -bp.len * 0.35);
        const a = new THREE.Mesh(aGeo, lMat);
        a.position.y = bp.height * 0.45; a.rotation.set(-0.5, 0, sx * 0.4);
        pivot.add(a); this.group.add(pivot);
        this._antennae.push(pivot);
      }
    }
    this._tailPivot = null;
    if (bp.tail) {
      const tGeo = new THREE.ConeGeometry(bp.height * 0.22, bp.len * 0.5, 6);
      const pivot = new THREE.Group();
      pivot.position.set(0, bp.height * 0.2, bp.len * 0.45);
      const tail = new THREE.Mesh(tGeo, lMat);
      tail.position.set(0, 0, bp.len * 0.1);
      tail.rotation.x = Math.PI * 0.62;
      pivot.add(tail); this.group.add(pivot);
      this._tailPivot = pivot;
    }
  }

  _buildBody() {
    const { w, h, l, rest } = this.dims;
    const R = this.RAPIER;
    // The body floats on its feet (the support springs hold it up). Light damping
    // stops it drifting forever but the feet do the work. Spawn at rest height.
    const desc = R.RigidBodyDesc.dynamic()
      .setTranslation(this._pos.x, rest + 0.02, this._pos.z)
      .setLinearDamping(0.45).setAngularDamping(2.4);
    this._body = this.world.createRigidBody(desc);
    // Just the body shape — sits well above the floor while standing, and only
    // touches down (belly-flop) if the legs fail to hold it up. Low friction so
    // a toppled body slides rather than sticking; the feet supply real grip.
    const col = R.ColliderDesc.cuboid(w / 2, h / 2, l / 2)
      .setFriction(0.3).setRestitution(0).setDensity(0.85);
    if (R.CoefficientCombineRule) col.setFrictionCombineRule(R.CoefficientCombineRule.Min);
    this.world.createCollider(col, this._body);

    // "Wonkiness": how lop-sided / under-built this Zook is. A balanced design
    // walks clean; a strange one (legs all one side, too few, too narrow) gets a
    // comical seeded waddle — random across designs but predictable for any given
    // one, which is exactly what made the original kit fun.
    const legs = ensureLegs(this.bp);
    const Lc = legs.filter(l => l.side < 0).length, Rc = legs.filter(l => l.side > 0).length, n = legs.length || 1;
    const asym = Math.abs(Lc - Rc) / n, sparse = n < 4 ? (4 - n) / 4 : 0, narrow = Math.max(0, 1.0 - this.bp.width);
    this._wonk = Math.max(0, Math.min(1, asym * 0.6 + sparse * 0.35 + narrow * 0.45));
    this._wonkSeed = ((this.bp.len * 7 + this.bp.width * 13 + n * 3) % (Math.PI * 2));
  }

  _place() {
    if (this.preview || !this._body) this.group.position.set(this._pos.x, this.dims.rest, this._pos.z);
  }

  setBlueprint(bp, highlight) {
    if (highlight != null) this._highlight = highlight;
    const sig = (b) => JSON.stringify([b.len, b.width, b.height, b.square, b.pointy, b.flatEnd, b.flatSide, b.antennae, b.tail, b.legs]);
    const changed = sig(bp) !== sig(this.bp);
    this.bp = cloneBlueprint(bp);
    this._buildMeshes();
    if (!this.preview && changed && this._body) { this.world.removeRigidBody(this._body); this._buildBody(); }
  }

  setHighlight(i) { this._highlight = i; this._buildMeshes(); }

  /** Hop (High Jump trial). */
  jump() { if (this._body && this._onGround) this._body.applyImpulse({ x: 0, y: 7.5 * (this.bp.stiffness || 1), z: 0 }, true); }

  // ── Animation / driving ──────────────────────────────────────────────────────
  // Drive every foot along its IK path → a body-local foot position, then aim the
  // 2-blob leg at it (so feet visibly plant and stay on the floor) and remember
  // the foot's local position + velocity for the contact-physics in step().
  _animateLegs(amount, dt = 1 / 60) {
    const { speed, stride, footAngle } = this.bp;
    const fwd = stride * FREACH;
    for (const leg of this._legs) {
      const reach = leg.reach;
      const u  = (this._t * speed + (leg.cycle || 0));
      const cur  = samplePath(leg.path, u);
      const prev = samplePath(leg.path, u - speed * dt);
      // Body-local foot offset from the hip. Planted ⇒ straight down to the floor;
      // swinging ⇒ lifted and carried forward/back along the path.
      const splayX = leg.side * Math.sin(leg.splay) * reach * 0.7;
      const off = (p) => ({
        x: leg.hip.x + splayX,
        y: leg.hip.y - reach * (1 - p.h * LIFT * amount),
        z: leg.hip.z - p.f * fwd * reach * amount,
      });
      const fl = off(cur), flp = off(prev);
      leg._footLocal = fl;
      leg._footVel = { x: (fl.x - flp.x) / dt, y: (fl.y - flp.y) / dt, z: (fl.z - flp.z) / dt };
      leg._planted = (cur.h * amount) < PLANT_H;

      // Visual 2-bone IK: aim the pivot at the foot, bend the knee to reach it.
      const dx = fl.x - leg.hip.x, dy = fl.y - leg.hip.y, dz = fl.z - leg.hip.z;
      const dist = Math.hypot(dx, dy, dz);
      leg.pivot.rotation.x = Math.atan2(dz, -dy);
      leg.pivot.rotation.z = leg.side * leg.splay;
      leg.knee.rotation.x = Math.max(0, Math.min(2.3, (1 - dist / (reach * 0.99)) * 2.6));
      leg.foot.rotation.x = footAngle + cur.h * 0.3 * amount;
    }
    this._bob = 0;
  }

  /** @param {{walk?:boolean, target?:{x,z}}} inputs */
  step(dt, inputs = {}) {
    this._t += dt;
    const walk = inputs.walk !== false;
    this._animateLegs(walk ? 1 : 0, dt);
    // Idle blink — a quick eye-squash every few seconds for a bit of life.
    if (this._eyes && this._eyes.length) {
      if (this._blinkT == null) this._blinkT = Math.random() * 3;
      this._blinkT += dt;
      const c = this._blinkT % 3.8;
      const s = c > 3.6 ? Math.max(0.12, 1 - Math.sin((c - 3.6) / 0.2 * Math.PI)) : 1;
      for (const e of this._eyes) e.scale.y = s;
    }
    if (this.preview || !this._body) return;

    const stiff = this.bp.stiffness || 1;
    const b = this._body, rot = b.rotation(), pos = b.translation();
    const lv = b.linvel(), av = b.angvel();
    const yaw = Math.atan2(2 * (rot.w * rot.y + rot.x * rot.z), 1 - 2 * (rot.y * rot.y + rot.z * rot.z));

    // Steer toward a floor target (manual: Zooks turn by slowing one side's legs).
    let steer = 0;
    if (inputs.target) {
      const want = Math.atan2(-(inputs.target.x - pos.x), -(inputs.target.z - pos.z));
      let d = want - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      steer = Math.max(-1, Math.min(1, d * this.bp.turnSharp));
    } else if (inputs.steerLeft) steer = 1; else if (inputs.steerRight) steer = -1;
    this._steer += (steer - this._steer) * (1 - this.bp.turnSmooth * 0.6);

    // Part Targeting (manual Ch13): NORMAL swings a part AWAY from the target,
    // INVERTED swings it TOWARD it, OFF leaves it be — scaled by Targeting Angle.
    if (inputs.target) {
      const want = Math.atan2(-(inputs.target.x - pos.x), -(inputs.target.z - pos.z));
      let d = want - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const ang = this.bp.targetAngle != null ? this.bp.targetAngle : 0.5;
      const aim = (parts, mode) => {
        const dir = mode === 'normal' ? -1 : mode === 'inverted' ? 1 : 0;
        if (!dir) return;
        const tgt = Math.max(-1, Math.min(1, d)) * ang * dir;
        for (const p of parts) p.rotation.y += (tgt - p.rotation.y) * 0.2;
      };
      if (this._antennae.length) aim(this._antennae, this.bp.antTarget || 'normal');
      if (this._tailPivot) aim([this._tailPivot], this.bp.tailTarget || 'off');
    }

    // ── Genuine foot–ground contact ────────────────────────────────────────────
    // For each planted foot: a support spring holds the body up, and traction
    // grips the floor. The path sweeps the foot backwards, so the gripped foot
    // drives the body FORWARD; forces apply at the hip (off-COM) → real balance.
    // If the body has toppled (up-axis well off vertical) the feet can't get any
    // purchase, so it simply flops — a badly-built Zook genuinely fails, exactly
    // like the real Zook Kit. This gate also stops a tip becoming a blow-up.
    const upY = 1 - 2 * (rot.x * rot.x + rot.z * rot.z);   // body up · world up
    // Comedy flop: fire once when it topples (and re-arm when it gets back up).
    if (upY < 0.25 && !this._flopped) { this._flopped = true; if (this.onFlop) this.onFlop(); }
    else if (upY > 0.55) this._flopped = false;
    let planted = 0;
    if (upY > UPRIGHT) {
      for (const leg of this._legs) {
        if (!leg._footLocal) continue;
        const flw = quatRot(rot, leg._footLocal);
        const F = { x: pos.x + flw.x, y: pos.y + flw.y, z: pos.z + flw.z };
        if (!(leg._planted && F.y <= GROUND_Y + 0.14)) continue;
        planted++;
        const hipw = quatRot(rot, leg.hip);
        const H = { x: pos.x + hipw.x, y: pos.y + hipw.y, z: pos.z + hipw.z };
        // contact-point velocity = body linear + ω×r + foot actuation (path) velocity
        const r = { x: F.x - pos.x, y: F.y - pos.y, z: F.z - pos.z };
        const wxr = cross(av, r);
        const act = quatRot(rot, leg._footVel);
        const cl = (n) => n < -8 ? -8 : n > 8 ? 8 : n;     // clamp slip → no spikes
        const vc = { x: cl(lv.x + wxr.x + act.x), y: cl(lv.y + wxr.y + act.y), z: cl(lv.z + wxr.z + act.z) };
        // Support: spring up on how far the foot is below the floor, damped + clamped.
        let Fy = K_SUP * stiff * Math.max(0, GROUND_Y - F.y) - C_SUP * vc.y;
        Fy = Fy < 0 ? 0 : Fy > F_MAX ? F_MAX : Fy;
        // Traction: oppose horizontal slip, capped by friction × load (μN).
        let Tx = -GRIP * vc.x, Tz = -GRIP * vc.z;
        // Movement Type: slow the inside legs when turning (manual Ch13) → the
        // backstroke is weaker on one side, so the Zook arcs round.
        const mt = leg.moveType || 'auto';
        const side = mt === 'always' ? 0 : mt === 'left' ? 1 : mt === 'right' ? -1 : leg.side;
        if (side !== 0 && Math.sign(this._steer) === Math.sign(side) && Math.abs(this._steer) > 0.05) {
          const k = 1 - Math.min(0.7, Math.abs(this._steer) * 0.7); Tx *= k; Tz *= k;
        }
        const Tmag = Math.hypot(Tx, Tz), Tmax = MU * Fy + 1.5;
        if (Tmag > Tmax) { const s = Tmax / Tmag; Tx *= s; Tz *= s; }
        b.applyImpulseAtPoint({ x: Tx * dt, y: Fy * dt, z: Tz * dt }, H, true);
      }
    }
    this._onGround = planted > 0;

    if (this._onGround) {
      // A gentle steering nudge so target-seeking is responsive (the real turning
      // still comes from the leg asymmetry above). Only while feet grip.
      if (Math.abs(this._steer) > 0.01) b.applyTorqueImpulse({ x: 0, y: this._steer * 0.7 * dt, z: 0 }, true);
      // Mild self-righting — recovers small wobbles but won't lift a real flop
      // back up; a top-heavy or lopsided Zook stays down (it's a bad design).
      const upK = 3.2 * stiff;
      b.applyTorqueImpulse({ x: -rot.x * upK * dt, y: 0, z: -rot.z * upK * dt }, true);
      // Comical waddle for wonky builds — a seeded side-to-side roll + lazy weave.
      // Predictable per design, daft across the roster (the BAMZOOKi charm).
      if (walk && this._wonk > 0.05) {
        const w = this._wonk, sd = this._wonkSeed || 0;
        b.applyTorqueImpulse({ x: 0, y: Math.sin(this._t * 1.6 + sd) * w * 0.45 * dt, z: Math.sin(this._t * (3 + sd)) * w * 1.15 * dt }, true);
      }
    } else if (walk) {
      // FLOPPED but still trying — a daft little struggle (legs keep paddling via
      // _animateLegs). A complete failure should look funny, never just dead.
      b.applyTorqueImpulse({ x: Math.sin(this._t * 7 + 1) * 0.16 * dt, y: Math.sin(this._t * 5) * 0.1 * dt, z: Math.cos(this._t * 6) * 0.16 * dt }, true);
    }

    // Cap the turn rate for controlled steering (Karma MaxAngularVelocity).
    const a2 = b.angvel(), maxA = 3.0;
    if (Math.abs(a2.y) > maxA) b.setAngvel({ x: a2.x, y: Math.sign(a2.y) * maxA, z: a2.z }, true);
  }

  syncMeshes() {
    if (this.preview || !this._body) { this.group.position.y = this.dims.rest + this._bob; return; }
    const t = this._body.translation(), r = this._body.rotation();
    this.group.position.set(t.x, t.y + this._bob, t.z);
    this.group.quaternion.set(r.x, r.y, r.z, r.w);
  }

  get position() {
    if (this._body) { const t = this._body.translation(); return { x: t.x, y: t.y, z: t.z }; }
    return { x: this.group.position.x, y: this.group.position.y, z: this.group.position.z };
  }
  get yaw() {
    if (!this._body) return this.group.rotation.y;
    const r = this._body.rotation();
    return Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.z * r.z));
  }
  dispose() {
    if (this.scene) this.scene.remove(this.group);
    this.group.traverse(o => { if (o.isMesh && o.geometry && o.geometry !== BLOB_GEO) o.geometry.dispose(); });
    if (this._body && this.world) { try { this.world.removeRigidBody(this._body); } catch (_) {} this._body = null; }
  }
}

// ── Shapeable body geometry ──────────────────────────────────────────────────
// A superellipsoid-style blob: round↔boxy via `square`, tapered nose via `pointy`.
function shapeBody(bp) {
  const { width, height, len, square, pointy, flatEnd = 0, flatSide = 0 } = bp;
  const geo = new THREE.SphereGeometry(1, 18, 14);   // low-poly → faceted
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const p = 1 - 0.8 * square;                   // exponent: 1 round → 0.2 boxy
  const hx = width / 2, hy = height / 2, hz = len / 2;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.set(
      Math.sign(v.x) * Math.pow(Math.abs(v.x), p),
      Math.sign(v.y) * Math.pow(Math.abs(v.y), p),
      Math.sign(v.z) * Math.pow(Math.abs(v.z), p),
    );
    v.x *= hx; v.y *= hy; v.z *= hz;
    // Taper toward the nose (-z).
    const noseFrac = Math.max(0, Math.min(1, (-(v.z) / hz + 1) / 2));
    v.x *= 1 - pointy * 0.8 * noseFrac; v.y *= 1 - pointy * 0.8 * noseFrac;
    // Flatten the tail end (+z): pull the back face inward.
    const tailFrac = Math.max(0, Math.min(1, (v.z / hz + 1) / 2));
    v.x *= 1 - flatEnd * 0.7 * tailFrac;
    // Flatten the sides: squash width.
    v.x *= 1 - flatSide * 0.5;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Leg-part styles from the Add menu (crawl legs, paddles, stalks).
// Proportions distilled from the Zook Kit's component library.
const LEG_STYLES = {
  crawl:   { u: 0.5,  l: 0.62, splay: 0.6,  footW: 1.5, footH: 0.5, footL: 2.0, swing: 1.0 },
  paddle:  { u: 0.35, l: 0.35, splay: 0.3,  footW: 3.2, footH: 0.4, footL: 1.4, swing: 1.5 },
  stalk:   { u: 0.6,  l: 0.6,  splay: 0.15, footW: 1.0, footH: 0.6, footL: 1.0, swing: 0.7 },
  step:    { u: 0.7,  l: 0.8,  splay: 0.4,  footW: 1.4, footH: 0.5, footL: 2.4, swing: 1.1 },
  stomp:   { u: 0.55, l: 0.7,  splay: 0.12, footW: 1.3, footH: 1.2, footL: 1.3, swing: 1.3 },
  push:    { u: 0.3,  l: 0.3,  splay: 0.25, footW: 3.6, footH: 0.6, footL: 1.0, swing: 1.2 },
  flipper: { u: 0.25, l: 0.5,  splay: 0.2,  footW: 3.0, footH: 0.3, footL: 2.2, swing: 1.6 },
};

// Generated grayscale pattern textures (white base shows the body hue).
let _patCache = {};
function patternTexture(kind) {
  if (!kind || kind === 'none') return null;
  if (_patCache[kind]) return _patCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
  const dark = 'rgba(0,0,0,0.30)', mid = 'rgba(0,0,0,0.16)';
  x.fillStyle = dark;
  if (kind === 'stripes') { for (let i = 0; i < 64; i += 16) x.fillRect(i, 0, 7, 64); }
  else if (kind === 'spots') { for (let a = 8; a < 64; a += 20) for (let b = 8; b < 64; b += 20) { x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); } }
  else if (kind === 'dots') { for (let a = 6; a < 64; a += 12) for (let b = 6; b < 64; b += 12) { x.beginPath(); x.arc(a, b, 2.4, 0, 7); x.fill(); } }
  else if (kind === 'checker') { for (let a = 0; a < 64; a += 16) for (let b = 0; b < 64; b += 16) if (((a + b) / 16) % 2 === 0) x.fillRect(a, b, 16, 16); }
  else if (kind === 'camo') {
    x.fillStyle = mid; blobs(x, 7, 9, 13);
    x.fillStyle = dark; blobs(x, 6, 5, 9);
  } else if (kind === 'plaster') {
    for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.18})`; x.fillRect(Math.random() * 64, Math.random() * 64, 1.5, 1.5); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(kind === 'camo' || kind === 'plaster' ? 2 : 3, 2);
  _patCache[kind] = tex;
  return tex;
}
function blobs(x, n, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const cx = Math.random() * 64, cy = Math.random() * 64, r = rmin + Math.random() * (rmax - rmin);
    x.beginPath(); x.ellipse(cx, cy, r, r * (0.6 + Math.random() * 0.5), Math.random() * 3, 0, 7); x.fill();
  }
}
