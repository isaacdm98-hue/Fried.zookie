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
    legPairs:  3,      // 1..4 mirrored pairs
    legLen:    0.72,   // 0.35..1.2
    legThick:  0.16,
    speed:     2.4,    // 1..4 cycle frequency (Hz)
    stride:    0.5,    // 0.3..1.3 swing amplitude
    footAngle: 0.2,
  };
}
export function cloneBlueprint(b) { return { ...b }; }

// ── Materials ────────────────────────────────────────────────────────────────

const mat = (hue, l = 0.55, rough = 0.45) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.72, l), roughness: rough, metalness: 0.05 });
const EYE_WHITE = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
const EYE_DARK  = new THREE.MeshStandardMaterial({ color: 0x140f1c, roughness: 0.2 });
const ARROW_MAT = new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.5, emissive: 0x330000 });

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
    this._t = 0; this._steer = 0; this._onGround = true; this._bob = 0;

    this._buildMeshes();
    if (this.scene) this.scene.add(this.group);
    if (!this.preview) this._buildBody();
    this._place();
  }

  get dims() {
    const { len, width, height, legLen } = this.bp;
    return { w: width, h: height, l: len, rest: legLen + height / 2 };
  }

  // ── Geometry ──────────────────────────────────────────────────────────────
  _buildMeshes() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this._legs = [];
    const bp = this.bp;
    const bMat = mat(bp.hue), lMat = mat(bp.footHue, 0.42, 0.55);
    bMat.flatShading = true;   // faceted, blocky BAMZOOKi look

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

    // Legs: mirrored pairs along the body sides — two-segment, spider-style.
    const total = bp.legPairs * 2;
    const thick = bp.legThick;
    const u = bp.legLen * 0.5;          // upper segment
    const l = bp.legLen * 0.62;         // lower segment
    const upGeo   = new THREE.BoxGeometry(thick, u, thick);
    const lowGeo  = new THREE.BoxGeometry(thick * 0.85, l, thick * 0.85);
    const footGeo = new THREE.BoxGeometry(thick * 1.5, thick * 0.5, thick * 2.0);
    const hipY = -bp.height * 0.32, hipX = bp.width * 0.46;
    let idx = 0;
    for (let p = 0; p < bp.legPairs; p++) {
      const z = bp.legPairs > 1 ? (bp.len * 0.40) * (0.5 - p / (bp.legPairs - 1)) : 0;
      for (const side of [1, -1]) {
        const pivot = new THREE.Group();         // hip
        pivot.position.set(side * hipX, hipY, z);
        pivot.rotation.z = side * 0.6;           // splay upper segment outward

        const up = new THREE.Mesh(upGeo, lMat);
        up.position.y = -u / 2; up.castShadow = true;
        pivot.add(up);

        const knee = new THREE.Group();          // knee at end of upper
        knee.position.y = -u;
        knee.rotation.z = -side * 0.6;           // bring lower segment back to vertical
        pivot.add(knee);

        const low = new THREE.Mesh(lowGeo, lMat);
        low.position.y = -l / 2; low.castShadow = true;
        knee.add(low);
        const foot = new THREE.Mesh(footGeo, lMat);
        foot.position.set(0, -l, thick * 0.4); foot.castShadow = true;
        knee.add(foot);

        this.group.add(pivot);
        const phase = (idx / total) * Math.PI * 2 + (side < 0 ? Math.PI : 0);
        this._legs.push({ pivot, knee, foot, side, phase });
        idx++;
      }
    }
  }

  _buildBody() {
    const { w, h, l, rest } = this.dims;
    const legLen = this.bp.legLen;
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

  setBlueprint(bp) {
    const struct = ['len', 'width', 'height', 'square', 'pointy', 'legPairs', 'legLen', 'legThick'];
    const changed = struct.some(k => bp[k] !== this.bp[k]);
    this.bp = cloneBlueprint(bp);
    this._buildMeshes();
    if (!this.preview && changed && this._body) { this.world.removeRigidBody(this._body); this._buildBody(); }
  }

  // ── Animation / driving ──────────────────────────────────────────────────────
  _animateLegs(amount) {
    const { speed, stride, footAngle } = this.bp;
    const w = 2 * Math.PI * speed;
    for (const leg of this._legs) {
      const ph = w * this._t + leg.phase;
      leg.pivot.rotation.x = Math.sin(ph) * stride * amount;     // fore-aft swing
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
      steer = Math.max(-1, Math.min(1, d * 1.5));
    } else if (inputs.steerLeft) steer = 1; else if (inputs.steerRight) steer = -1;

    if (walk && this._onGround) {
      const drive = speed * stride * this.bp.legPairs * 1.4;
      b.applyImpulse({ x: fwdX * drive * dt, y: 0, z: fwdZ * drive * dt }, true);
    }
    if (Math.abs(steer) > 0.01) b.applyTorqueImpulse({ x: 0, y: steer * 1.6 * dt, z: 0 }, true);
    b.applyTorqueImpulse({ x: -rot.x * 6 * dt, y: 0, z: -rot.z * 6 * dt }, true);
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
  const { width, height, len, square, pointy } = bp;
  const geo = new THREE.SphereGeometry(1, 18, 14);   // low-poly → faceted
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const p = 1 - 0.8 * square;                   // exponent: 1 round → 0.2 boxy
  const hx = width / 2, hy = height / 2, hz = len / 2;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Superellipsoid deform on the unit sphere.
    v.set(
      Math.sign(v.x) * Math.pow(Math.abs(v.x), p),
      Math.sign(v.y) * Math.pow(Math.abs(v.y), p),
      Math.sign(v.z) * Math.pow(Math.abs(v.z), p),
    );
    v.x *= hx; v.y *= hy; v.z *= hz;
    // Taper toward the nose (-z).
    const noseFrac = Math.max(0, Math.min(1, (-(v.z) / hz + 1) / 2));
    const f = 1 - pointy * 0.8 * noseFrac;
    v.x *= f; v.y *= f;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
