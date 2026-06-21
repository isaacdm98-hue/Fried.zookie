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
    hue:       0.08,   // body colour 0..1
    footHue:   0.08,   // foot colour 0..1
    len:       2.0,    // body length  (nose↔tail, Z)
    width:     1.05,   // body width   (X)
    height:    0.78,   // body height  (Y)
    square:    0.6,    // 0 round … 1 boxy (default leans blocky)
    pointy:    0.35,   // nose taper 0..1
    flatEnd:   0.0,    // flatten the tail end 0..1
    flatSide:  0.0,    // flatten the sides 0..1
    // Legs are individual parts: each placed on the body with its own side,
    // along-body position, size, style and Movement Cycle (phase 0..1).
    // Mirroring is an optional action, not forced.
    legs:      makeDefaultLegs(3),
    legThick:  0.16,   // default thickness for new legs
    antennae:  false,  // decorative part
    tail:      false,  // decorative part
    pattern:   'none', // none | stripes | spots
    speed:     2.4,    // 1..4 cycle frequency (Hz)
    stride:    0.5,    // 0.3..1.3 swing amplitude
    footAngle: 0.2,
    turnSharp: 1.5,    // how hard it turns toward a target
    turnSmooth:0.85,   // steering damping
  };
}

let _pairSeq = 1;
export function newPairId() { return _pairSeq++; }

/** A new leg part. `pair` links mirror partners (same id, opposite side). */
export function makeLeg(side, along, { len = 0.72, thick = 0.16, style = 'crawl', cycle = 0, pair = newPairId() } = {}) {
  return { side, along, len, thick, style, cycle, pair };
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
  if (Array.isArray(bp.legs)) return bp.legs;
  const pairs = bp.legPairs || 3;
  bp.legs = makeDefaultLegs(pairs).map(l => ({ ...l, len: bp.legLen || 0.72, thick: bp.legThick || 0.16, style: bp.legStyle || 'crawl' }));
  return bp.legs;
}
export function cloneBlueprint(b) {
  return { ...b, legs: Array.isArray(b.legs) ? b.legs.map(l => ({ ...l })) : b.legs };
}

// ── Materials ────────────────────────────────────────────────────────────────

const mat = (hue, l = 0.55, rough = 0.45) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.72, l), roughness: rough, metalness: 0.05 });
const EYE_WHITE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
const EYE_DARK  = new THREE.MeshStandardMaterial({ color: 0x140f1c, roughness: 0.2 });
const ARROW_MAT = new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.5, emissive: 0x330000 });
const HILITE    = new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xf0782d, emissiveIntensity: 0.5, roughness: 0.4 });

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
    const maxLeg = legs.length ? Math.max(...legs.map(l => l.len)) : 0.5;
    return { w: width, h: height, l: len, rest: maxLeg + height / 2 };
  }

  // ── Geometry ──────────────────────────────────────────────────────────────
  _buildMeshes() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this._legs = [];
    const bp = this.bp;
    const bMat = mat(bp.hue), lMat = mat(bp.footHue, 0.42, 0.55);
    bMat.flatShading = true;   // faceted, blocky BAMZOOKi look
    const tex = patternTexture(bp.pattern);
    if (tex) bMat.map = tex;

    // Shapeable root body.
    const body = new THREE.Mesh(shapeBody(bp), bMat);
    body.castShadow = body.receiveShadow = true;
    this.group.add(body);

    // Red direction arrow on the back (workshop only).
    if (this.showArrow) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(bp.width * 0.16, bp.len * 0.4, 4), ARROW_MAT);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, bp.height * 0.5 + 0.02, -bp.len * 0.1);
      this.group.add(arrow);
    }

    // Eyes near the nose (forward = -Z).
    const eyeR = bp.height * 0.16, noseZ = -bp.len / 2 * (1 - bp.pointy * 0.45);
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 16, 12), EYE_WHITE);
      w.position.set(sx * bp.width * 0.24, bp.height * 0.24, noseZ + eyeR * 0.3);
      const p = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.5, 12, 10), EYE_DARK);
      p.position.set(sx * bp.width * 0.24, bp.height * 0.24, noseZ - eyeR * 0.15);
      this.group.add(w, p);
    }

    // Legs: individual parts, each with its own placement, size, style and
    // Movement Cycle. The selected leg (workshop) is highlighted.
    const legs = ensureLegs(bp);
    const hipY = -bp.height * 0.32;
    legs.forEach((leg, i) => {
      const S = LEG_STYLES[leg.style] || LEG_STYLES.crawl;
      const thick = leg.thick, len = leg.len, u = len * S.u, l = len * S.l;
      const m = (i === this._highlight) ? HILITE : lMat;
      const x = leg.side * bp.width * 0.46;
      const z = leg.along * bp.len * 0.5;
      const pivot = new THREE.Group();
      pivot.position.set(x, hipY, z);
      pivot.rotation.z = leg.side * S.splay;
      const up = new THREE.Mesh(new THREE.BoxGeometry(thick, u, thick), m);
      up.position.y = -u / 2; up.castShadow = true; pivot.add(up);
      const knee = new THREE.Group(); knee.position.y = -u; knee.rotation.z = -leg.side * S.splay; pivot.add(knee);
      const low = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.85, l, thick * 0.85), m);
      low.position.y = -l / 2; low.castShadow = true; knee.add(low);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(thick * S.footW, thick * S.footH, thick * S.footL), m);
      foot.position.set(0, -l, thick * 0.4); foot.castShadow = true; knee.add(foot);
      this.group.add(pivot);
      const phase = (leg.cycle || 0) * Math.PI * 2;
      this._legs.push({ pivot, knee, foot, side: leg.side, phase, swingMul: S.swing });
    });

    // Decorative parts (Add menu): antennae on the nose, a tail at the back.
    if (bp.antennae) {
      const aGeo = new THREE.CylinderGeometry(thick * 0.18, thick * 0.3, bp.height * 0.9, 6);
      for (const sx of [-1, 1]) {
        const a = new THREE.Mesh(aGeo, lMat);
        a.position.set(sx * bp.width * 0.18, bp.height * 0.5, -bp.len * 0.35);
        a.rotation.set(-0.5, 0, sx * 0.4);
        this.group.add(a);
      }
    }
    if (bp.tail) {
      const tGeo = new THREE.ConeGeometry(bp.height * 0.22, bp.len * 0.5, 6);
      const tail = new THREE.Mesh(tGeo, lMat);
      tail.position.set(0, bp.height * 0.2, bp.len * 0.55);
      tail.rotation.x = Math.PI * 0.62;
      this.group.add(tail);
    }
  }

  _buildBody() {
    const { w, h, l, rest } = this.dims;
    const legLen = rest - h / 2;
    const R = this.RAPIER;
    const desc = R.RigidBodyDesc.dynamic()
      .setTranslation(this._pos.x, rest, this._pos.z)
      .setLinearDamping(0.3).setAngularDamping(0.9);
    this._body = this.world.createRigidBody(desc);
    // Collider is a leg-height "skirt": it reaches from the body down to the
    // feet, so the Zook stands at leg height instead of resting on its belly.
    const fullH = h + legLen;
    this.world.createCollider(
      R.ColliderDesc.cuboid(w / 2, fullH / 2, l / 2)
        .setTranslation(0, -legLen / 2, 0)
        .setFriction(1.1).setRestitution(0).setDensity(0.9),
      this._body,
    );
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

  // ── Animation / driving ──────────────────────────────────────────────────────
  _animateLegs(amount) {
    const { speed, stride, footAngle } = this.bp;
    const w = 2 * Math.PI * speed;
    for (const leg of this._legs) {
      const ph = w * this._t + leg.phase;
      leg.pivot.rotation.x = Math.sin(ph) * stride * leg.swingMul * amount; // fore-aft swing
      const lift = Math.max(0, Math.cos(ph));                    // recovery half
      leg.knee.rotation.x = 0.25 + lift * 0.55 * amount;         // knee bends to lift foot
      leg.foot.rotation.x = footAngle + lift * 0.3 * amount;
    }
    this._bob = Math.sin(w * this._t * 2) * 0.02 * amount;
  }

  /** @param {{walk?:boolean, target?:{x,z}}} inputs */
  step(dt, inputs = {}) {
    this._t += dt;
    const walk = inputs.walk !== false;
    this._animateLegs(walk ? 1 : 0);
    if (this.preview || !this._body) return;

    const { speed, stride } = this.bp;
    const b = this._body, rot = b.rotation();
    const yaw = Math.atan2(2 * (rot.w * rot.y + rot.x * rot.z), 1 - 2 * (rot.y * rot.y + rot.z * rot.z));
    const fwdX = -Math.sin(yaw), fwdZ = -Math.cos(yaw);
    const pos = b.translation();
    this._onGround = pos.y < this.dims.rest * 1.4;

    // Steer toward a floor target if given (manual: Zooks move toward a target).
    let steer = 0;
    if (inputs.target) {
      const want = Math.atan2(-(inputs.target.x - pos.x), -(inputs.target.z - pos.z));
      let d = want - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      steer = Math.max(-1, Math.min(1, d * this.bp.turnSharp));
    } else if (inputs.steerLeft) steer = 1; else if (inputs.steerRight) steer = -1;
    // Turn smoothness damps the steer response.
    this._steer += (steer - this._steer) * (1 - this.bp.turnSmooth * 0.6);

    // Emergent locomotion: each leg only propels during its planted backstroke,
    // so motion arises from the gait itself. Staggering the legs (Movement
    // Cycle) keeps a foot pushing at all times → smoother, faster; legs in
    // unison give a lurching, weaker gait. Stride, speed and leg count all feed
    // in naturally, exactly as building a real Zook should reward.
    if (walk && this._onGround) {
      const w = 2 * Math.PI * speed;
      let push = 0;
      for (const leg of this._legs) {
        const back = -Math.cos(w * this._t + leg.phase);   // >0 on power stroke
        if (back > 0.05) push += back * stride * leg.swingMul;
      }
      const drive = push * speed * 0.85;
      b.applyImpulse({ x: fwdX * drive * dt, y: 0, z: fwdZ * drive * dt }, true);
    }
    // Steering: only turn while feet can grip the ground.
    if (this._onGround && Math.abs(this._steer) > 0.01) {
      b.applyTorqueImpulse({ x: 0, y: this._steer * 1.4 * dt, z: 0 }, true);
    }
    // Self-righting: keep the Zook upright (stronger when tilted further).
    b.applyTorqueImpulse({ x: -rot.x * 9 * dt, y: 0, z: -rot.z * 9 * dt }, true);
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
    this.group.traverse(o => { if (o.isMesh) o.geometry?.dispose?.(); });
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
const LEG_STYLES = {
  crawl:  { u: 0.5,  l: 0.62, splay: 0.6,  footW: 1.5, footH: 0.5, footL: 2.0, swing: 1.0 },
  paddle: { u: 0.35, l: 0.35, splay: 0.3,  footW: 3.2, footH: 0.4, footL: 1.4, swing: 1.5 },
  stalk:  { u: 0.6,  l: 0.6,  splay: 0.15, footW: 1.0, footH: 0.6, footL: 1.0, swing: 0.7 },
};

// Generated grayscale pattern textures (white base shows the body hue).
let _patCache = {};
function patternTexture(kind) {
  if (!kind || kind === 'none') return null;
  if (_patCache[kind]) return _patCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'rgba(0,0,0,0.32)';
  if (kind === 'stripes') { for (let i = 0; i < 64; i += 16) x.fillRect(i, 0, 7, 64); }
  else if (kind === 'spots') { for (let a = 8; a < 64; a += 20) for (let b = 8; b < 64; b += 20) { x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); } }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2);
  _patCache[kind] = tex;
  return tex;
}
