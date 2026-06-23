/**
 * engine.js — the authentic BAMZOOKi articulated body, rebuilt on Rapier.
 *
 * Unlike the legacy single-body model (one capsule + scripted foot forces), this
 * builds the Zook the way the real Bonsai/Karma engine does (Evo.lua): EVERY part
 * is its own rigid body (a Karma "segment"), joined to its parent by a joint at
 * the genome connection point (the "cardanconnector"), using the verbatim engine
 * constants. Locomotion is EMERGENT — the gait drives the joints (muscles) and the
 * feet push the floor; nothing scripts the body forward.
 *
 * This module is standalone and side-effect free: build it against a Rapier world,
 * step that world, then read part transforms to drive the meshes. It does not touch
 * the legacy Zook, so the app keeps working while this is validated.
 */
import * as THREE from 'three';
import { ENGINE } from './engine-constants.js';
import { makeBlobGeo } from './model.js';

const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), _S = new THREE.Vector3();
const compose = (x, y, z, rx, ry, rz) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), ONE);

// Part placement is IDENTICAL to the builder's (model.js composeM): centre at the
// part's (x,y,z) relative to its parent, oriented by Euler(pitch,yaw,twist). No
// re-seating — so what you see in the builder is exactly what the engine simulates.
// (Imported demo Zooks are pre-seated in tools/decode-zooks.mjs so their parts touch.)
function localMat(b) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(b.x || 0, b.y || 0, b.z || 0),
    Q.setFromEuler(E.set(b.pitch || 0, b.yaw || 0, b.twist || 0)), ONE);
}

/** Flatten the blueprint into a part list (root body + clay tree) with each part's
 *  body-LOCAL matrix, resolving the parent tree and connection angles. */
export function layout(bp) {
  const parts = [];
  // Root = the body itself, at the origin of the creature frame.
  parts.push({ idx: -1, parent: null, mat: new THREE.Matrix4(),
    half: { x: (bp.width || 1) / 2, y: (bp.height || 1) / 2, z: (bp.len || 1.6) / 2 },
    mesh: bp.bodyMesh || 'blob', root: true });
  const blobs = bp.blobs || [];
  const matOf = []; // blob index -> world(creature)-local matrix
  // Build in parent-before-child order.
  const order = [], placed = new Array(blobs.length).fill(false);
  for (let g = 0; g <= blobs.length && order.length < blobs.length; g++)
    for (let i = 0; i < blobs.length; i++) {
      if (placed[i]) continue;
      const p = blobs[i].parent;
      if (p == null || p < 0 || p >= blobs.length || placed[p]) { order.push(i); placed[i] = true; }
    }
  for (let i = 0; i < blobs.length; i++) if (!placed[i]) order.push(i);

  for (const i of order) {
    const b = blobs[i];
    const parentMat = (b.parent != null && matOf[b.parent]) ? matOf[b.parent] : parts[0].mat;
    const local = localMat(b);
    const mat = parentMat.clone().multiply(local);
    matOf[i] = mat;
    parts.push({ idx: i, parent: b.parent == null ? 0 : null, parentBlob: b.parent, mat,
      half: { x: (b.sx || 0.4) / 2, y: (b.sy || 0.4) / 2, z: (b.sz || 0.4) / 2 },
      mesh: b.mesh || 'blob', move: b.move, blob: b });
  }
  // Resolve parent part-array indices (root is parts[0]).
  const partOfBlob = {}; parts.forEach((p, k) => { if (p.idx >= 0) partOfBlob[p.idx] = k; });
  for (const p of parts) {
    if (p.root) continue;
    p.parentPart = (p.parentBlob == null) ? 0 : (partOfBlob[p.parentBlob] ?? 0);
  }
  return parts;
}

/** Build the articulated body in a Rapier world. Returns handles for stepping/reading. */
export function buildArticulated({ bp, world, RAPIER, pos = { x: 0, y: 0, z: 0 }, muscleK = 60, muscleC = 14 }) {
  const parts = layout(bp);
  // Lift the whole creature so its lowest point starts just above the floor.
  let minY = Infinity;
  const baseMat = new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z);
  for (const p of parts) {
    const m = baseMat.clone().multiply(p.mat); p.world = m;
    m.decompose(V, Q, new THREE.Vector3());
    minY = Math.min(minY, V.y - Math.max(p.half.x, p.half.y, p.half.z));
  }
  const lift = (minY < 0.05) ? (0.05 - minY) : 0;

  const bodies = [], colliders = [], joints = [];
  for (const p of parts) {
    const m = p.world.clone(); m.premultiply(new THREE.Matrix4().makeTranslation(0, lift, 0));
    m.decompose(V, Q, new THREE.Vector3());
    const rb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(V.x, V.y, V.z)
        .setRotation({ x: Q.x, y: Q.y, z: Q.z, w: Q.w })
        .setLinearDamping(0.2).setAngularDamping(0.6)
        .setCcdEnabled(true));     // continuous collision → thin/fast parts can't tunnel through the floor
    // A slightly rounded box (the part's real footprint) with high friction so feet
    // grip and the body genuinely rests on the floor instead of sliding through it.
    const rad = Math.min(p.half.x, p.half.y, p.half.z) * 0.35;
    const col = (RAPIER.ColliderDesc.roundCuboid
      ? RAPIER.ColliderDesc.roundCuboid(Math.max(0.01, p.half.x - rad), Math.max(0.01, p.half.y - rad), Math.max(0.01, p.half.z - rad), rad)
      : RAPIER.ColliderDesc.cuboid(p.half.x, p.half.y, p.half.z))
      .setDensity(0.7).setFriction(1.4).setRestitution(0.05);
    if (RAPIER.CoefficientCombineRule) col.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);
    // Self-collidability OFF (Karma.SetAgentCollidabilityOff, Evo.lua:127): a Zook's
    // own parts pass through each other (membership bit 0x0002, filter excludes it),
    // but still collide with the world. Stops packed legs from shoving joints apart.
    col.setCollisionGroups(0x0002FFFD);
    world.createCollider(col, rb);
    p.body = rb; bodies.push(rb); colliders.push(col);
  }
  // Joints at each child's connection point (its near end on the length axis).
  const muscles = [];
  for (const p of parts) {
    if (p.root) continue;
    const parent = parts[p.parentPart];
    const a1 = parent.body.translation(), r1 = parent.body.rotation();
    const a2 = p.body.translation(), r2 = p.body.rotation();
    // Anchor the joint at the point on the CHILD's surface that faces the parent —
    // so it connects (and pivots) where the parts meet, for any orientation. Lock
    // translations and the parts can never drift apart from there.
    const cW = new THREE.Vector3(a2.x, a2.y, a2.z), pWc = new THREE.Vector3(a1.x, a1.y, a1.z);
    const dir = pWc.clone().sub(cW); if (dir.lengthSq() < 1e-9) dir.set(0, 0, -1); dir.normalize();
    const cq = new THREE.Quaternion(r2.x, r2.y, r2.z, r2.w);
    const dL = dir.clone().applyQuaternion(cq.clone().invert());
    const support = Math.abs(dL.x) * p.half.x + Math.abs(dL.y) * p.half.y + Math.abs(dL.z) * p.half.z;
    const connWorld = cW.clone().add(dir.clone().multiplyScalar(support));
    const toLocal = (t, r) => {
      const inv = new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y, t.z), new THREE.Quaternion(r.x, r.y, r.z, r.w), ONE).invert();
      return connWorld.clone().applyMatrix4(inv);
    };
    const l1 = toLocal(a1, r1), l2 = toLocal(a2, r2);
    // Generic joint with all THREE translations hard-locked → the parent/child
    // anchor points stay rigidly coincident (a limb can never separate), while
    // rotation is left free for the muscle. (Spherical impulse joints expose no
    // motor here, and external torque was opening them; locking translations fixes
    // the attachment by construction — the real cardanconnector behaviour.)
    const AX = RAPIER.JointAxesMask;
    const lockT = AX.X | AX.Y | AX.Z;
    const jd = RAPIER.JointData.generic({ x: l1.x, y: l1.y, z: l1.z }, { x: l2.x, y: l2.y, z: l2.z }, { x: 1, y: 0, z: 0 }, lockT);
    joints.push(world.createImpulseJoint(jd, parent.body, p.body, true));
    // Muscle: a PD spring/damper that drives the joint toward a target relative
    // orientation (the rest pose by default; the gait shifts the target). This is
    // the Cardan stiffness/damping made explicit — pose is held by muscles, not by
    // a kinematic hack, so locomotion stays emergent.
    const qp = new THREE.Quaternion(r1.x, r1.y, r1.z, r1.w);
    const qc = new THREE.Quaternion(r2.x, r2.y, r2.z, r2.w);
    const restRel = qp.clone().invert().multiply(qc);      // parent-local rest orientation of child
    const b = p.blob || {};
    const ms = (b.muscleStiffness || 5000) / 5000, md = (b.muscleDamping || 5000) / 5000;
    // Inertia estimate so muscle torque scales with the part (a tiny leg and a big
    // body get proportional torque) — this stops a one-size torque from yanking the
    // joint open. Torque = I·(Kp·angleErr − Kd·angvel), capped at I·MAXACC.
    const I = Math.max(1e-4, p.body.mass() * (p.half.x * p.half.x + p.half.y * p.half.y + p.half.z * p.half.z));
    const m = { parent, child: p, restRel, target: restRel.clone(), I, Kp: muscleK * ms, Kd: muscleC * md, maxacc: 90 };
    // Gait: the decoded IK foot-path → a set of directions the leg aims through.
    // Sweeping the leg toward each point in turn makes the foot plant & push, so
    // walking emerges from the muscles (nothing scripts the body forward).
    if (b.move && b.gait && b.gait.length >= 2) {
      m.gait = b.gait.map((g) => new THREE.Vector3(g.x, g.y, g.z).normalize());
      m.phase = b.cycle || 0; m.clock = m.phase;
      // Which side of the body the leg is on (GetNodeSide): used for steering — the
      // inside legs of a turn are slowed so the Zook pivots toward its target.
      const cx = new THREE.Vector3().setFromMatrixPosition(p.mat).x;
      m.side = cx < -0.05 ? -1 : cx > 0.05 ? 1 : 0;   // -1 left, +1 right, 0 centre
      // A moving leg gets a stronger but well-damped muscle: enough to plant and
      // push through the foot-path, but capped so it can't punch the body skyward.
      m.Kp *= 1.8; m.Kd *= 2.0; m.maxacc = 130;
    }
    muscles.push(m);
  }

  // Advance the gait clock and re-aim each leg's muscle target toward the sampled
  // foot-path direction (in the leg's rest frame). Called once per tick before drive().
  const GAIT_RATE = 0.9;     // foot-path loops per second (cadence)
  const _zAxis = new THREE.Vector3(0, 0, 1), _dir = new THREE.Vector3(), _delta = new THREE.Quaternion();
  // steer ∈ [-1,1]: +1 = target is to the right of travel → slow the right legs to
  // pivot right; −1 = mirror. Each leg keeps its own phase clock so slowing one side
  // desynchronises the gait and the body turns (differential drive).
  function gait(dt, steer = 0) {
    for (const m of muscles) {
      if (!m.gait) continue;
      let rate = GAIT_RATE;
      if (steer > 0 && m.side > 0) rate *= Math.max(0.2, 1 - steer * 0.9);
      else if (steer < 0 && m.side < 0) rate *= Math.max(0.2, 1 + steer * 0.9);
      m.clock += dt * rate;
      const n = m.gait.length, u = (m.clock % 1 + 1) % 1;
      const f = u * n, i = Math.floor(f) % n, j = (i + 1) % n, s = f - Math.floor(f);
      _dir.copy(m.gait[i]).lerp(m.gait[j], s);
      if (_dir.lengthSq() < 1e-6) _dir.set(0, 0, 1); else _dir.normalize();
      _delta.setFromUnitVectors(_zAxis, _dir);
      m.target.copy(m.restRel).multiply(_delta);
    }
  }

  // PD muscle servo — call once per physics tick before world.step(). Torque is
  // applied to the CHILD only (a servo toward its target angle relative to the
  // parent); a reaction on the parent feeds back up the chain and pumps energy, so
  // the heavier root/parents anchor the chain instead. Overdamped + clamped to stay
  // stable under the 50 Hz explicit step.
  const _qp = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qt = new THREE.Quaternion(), _qe = new THREE.Quaternion(), _ax = new THREE.Vector3();
  const MAXACC = 90, WMAX = 16;            // angular-accel cap (rad/s²) and a hard spin clamp
  function drive() {
    for (const m of muscles) {
      const rp = m.parent.body.rotation(), rc = m.child.body.rotation();
      _qp.set(rp.x, rp.y, rp.z, rp.w); _qc.set(rc.x, rc.y, rc.z, rc.w);
      _qt.copy(_qp).multiply(m.target);                    // world target orientation for the child
      _qe.copy(_qt).multiply(_qc.clone().invert());        // error rotation (world)
      if (_qe.w < 0) { _qe.x = -_qe.x; _qe.y = -_qe.y; _qe.z = -_qe.z; _qe.w = -_qe.w; }
      const s = Math.sqrt(Math.max(1e-9, 1 - _qe.w * _qe.w)), ang = 2 * Math.acos(Math.min(1, _qe.w));
      _ax.set(_qe.x / s, _qe.y / s, _qe.z / s);
      const wc = m.child.body.angvel();
      // desired angular acceleration (PD), capped, then scaled by inertia → torque
      let ax = m.Kp * _ax.x * ang - m.Kd * wc.x;
      let ay = m.Kp * _ax.y * ang - m.Kd * wc.y;
      let az = m.Kp * _ax.z * ang - m.Kd * wc.z;
      const amag = Math.hypot(ax, ay, az), cap = m.maxacc || MAXACC;
      if (amag > cap) { const k = cap / amag; ax *= k; ay *= k; az *= k; }
      m.child.body.addTorque({ x: ax * m.I, y: ay * m.I, z: az * m.I }, true);
      const ws = Math.hypot(wc.x, wc.y, wc.z);
      if (ws > WMAX) { const k = WMAX / ws; m.child.body.setAngvel({ x: wc.x * k, y: wc.y * k, z: wc.z * k }, true); }
    }
  }

  return { parts, bodies, joints, muscles, lift,
    rootBody: parts[0].body,
    drive, gait,
    readTransforms() { return parts.map((p) => ({ idx: p.idx, t: p.body.translation(), r: p.body.rotation() })); },
    dispose() { for (const j of joints) try { world.removeImpulseJoint(j, true); } catch (_) {} for (const b of bodies) try { world.removeRigidBody(b); } catch (_) {} },
  };
}

const _PREVIEW_BOX = new THREE.BoxGeometry(1, 1, 1), _PREVIEW_BALL = new THREE.SphereGeometry(0.5, 16, 12);
const _HILITE = new THREE.MeshStandardMaterial({ color: 0xffd479, emissive: 0xf0782d, emissiveIntensity: 0.5, roughness: 0.4 });

/**
 * ArticulatedZook — the ONE Zook used everywhere. With a physics world it runs the
 * real engine (test/contests); with `preview:true` it renders the exact same part
 * meshes statically for the BUILDER, so what you design is what you simulate — same
 * body Blob, same materials, one blob per part (no synthesised knee/foot).
 * Exposes the builder's selection surface: `_blobs[idx]`, `userData.blobIndex`/`isBody`,
 * `setBlueprint`, `setHighlight`.
 */
export class ArticulatedZook {
  constructor(bp, { scene, world, RAPIER, pos = { x: 0, y: 0, z: 0 }, preview = false }) {
    this.bp = bp; this.scene = scene; this.preview = !!preview; this.world = world; this.RAPIER = RAPIER;
    this._spawn = { x: pos.x || 0, z: pos.z || 0 };
    this.group = new THREE.Group(); scene.add(this.group);
    this.onFlop = null; this._hi = -1; this._legs = [];   // no separate legs (unified blob model)
    if (this.preview) { this._buildPreview(bp); }
    else {
      this._A = buildArticulated({ bp, world, RAPIER, pos: { x: pos.x || 0, y: 0.4, z: pos.z || 0 } });
      this._body = this._A.rootBody;
      this._makeMeshes(this._A.parts);
      this.syncMeshes();
    }
  }
  // Build one mesh per part (body + clay), tagged for the builder's hit-testing.
  _makeMeshes(parts) {
    for (let i = this.group.children.length - 1; i >= 0; i--) {
      const c = this.group.children[i]; this.group.remove(c);
      if (c.material && c.material !== _HILITE) c.material.dispose();
    }
    this._meshes = []; this._blobs = [];
    for (const p of parts) {
      const shape = p.root ? this.bp.bodyShape : (p.blob && p.blob.shape);
      const rgb = p.root ? (this.bp.bodyRgb != null ? this.bp.bodyRgb : 0xcf5a5a) : (p.blob && p.blob.rgb != null ? p.blob.rgb : 0xcf5a5a);
      const geo = p.mesh === 'cube' ? _PREVIEW_BOX : p.mesh === 'sphere' ? _PREVIEW_BALL : makeBlobGeo(shape);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: rgb, roughness: 0.62, metalness: 0.02 }));
      mesh.scale.set(p.half.x * 2, p.half.y * 2, p.half.z * 2);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.baseMat = mesh.material;
      if (p.root) mesh.userData.isBody = true; else mesh.userData.blobIndex = p.idx;
      if (this.preview && p.mat) { p.mat.decompose(V, Q, _S); mesh.position.copy(V); mesh.quaternion.copy(Q); }
      this.group.add(mesh); this._meshes.push(mesh);
      if (!p.root) this._blobs[p.idx] = mesh;
    }
  }
  _buildPreview(bp) { this.bp = bp; this._makeMeshes(layout(bp)); this.setHighlight(this._hi); }
  // Builder API ----------------------------------------------------------------
  setBlueprint(bp, hi = -1) { this.bp = bp; this._hi = hi; if (this.preview) this._buildPreview(bp); }
  setHighlight(idx) {
    this._hi = idx;
    if (!this._blobs) return;
    this._blobs.forEach((m) => { if (m && m.userData.baseMat) m.material = m.userData.baseMat; });
    const sel = idx != null && idx >= 0 && this._blobs[idx];
    if (sel) sel.material = _HILITE;
  }
  // Simulation API -------------------------------------------------------------
  step(dt, _inputs) { if (!this.preview) { this._A.gait(dt || 1 / 60, 0); this._A.drive(); } }
  syncMeshes() {
    if (this.preview || !this._A) return;
    const T = this._A.readTransforms();
    for (let i = 0; i < this._meshes.length; i++) {
      const t = T[i].t, r = T[i].r;
      this._meshes[i].position.set(t.x, t.y, t.z);
      this._meshes[i].quaternion.set(r.x, r.y, r.z, r.w);
    }
  }
  get position() { const t = this.preview ? { x: 0, y: 0, z: 0 } : this._A.rootBody.translation(); return { x: t.x, y: t.y, z: t.z }; }
  get dims() { return { rest: 0.6, w: this.bp.width || 1, h: this.bp.height || 1, l: this.bp.len || 1.6 }; }
  jump() { if (!this.preview) this._A.rootBody.applyImpulse({ x: 0, y: 5, z: 0 }, true); }
  // Teleport the WHOLE body (all parts together) so a contest placing the Zook can't
  // tear the articulation apart — shift every part by the same delta and zero velocity.
  moveTo(p) {
    if (this.preview) return;
    const t = this._A.rootBody.translation();
    const dx = (p.x || 0) - t.x, dy = (p.y || 0) - t.y, dz = (p.z || 0) - t.z;
    for (const b of this._A.bodies) {
      const bt = b.translation();
      b.setTranslation({ x: bt.x + dx, y: bt.y + dy, z: bt.z + dz }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }
  dispose() { if (this._A) this._A.dispose(); if (this.group.parent) this.group.parent.remove(this.group); }
}

export { ENGINE };
