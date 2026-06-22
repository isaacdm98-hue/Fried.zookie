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

const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
const compose = (x, y, z, rx, ry, rz) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), ONE);

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
    const local = compose(b.x || 0, b.y || 0, b.z || 0, b.pitch || 0, b.yaw || 0, b.twist || 0);
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
export function buildArticulated({ bp, world, RAPIER, pos = { x: 0, y: 0, z: 0 } }) {
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
    world.createCollider(col, rb);
    p.body = rb; bodies.push(rb); colliders.push(col);
  }
  // Joints at each child's connection point (its near end on the length axis).
  const muscles = [];
  for (const p of parts) {
    if (p.root) continue;
    const parent = parts[p.parentPart];
    const connWorld = new THREE.Vector3(0, 0, -p.half.z).applyMatrix4(
      new THREE.Matrix4().makeTranslation(0, lift, 0).multiply(p.world));
    const a1 = parent.body.translation(), r1 = parent.body.rotation();
    const a2 = p.body.translation(), r2 = p.body.rotation();
    const toLocal = (t, r) => {
      const inv = new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y, t.z), new THREE.Quaternion(r.x, r.y, r.z, r.w), ONE).invert();
      return connWorld.clone().applyMatrix4(inv);
    };
    const l1 = toLocal(a1, r1), l2 = toLocal(a2, r2);
    const jd = RAPIER.JointData.spherical({ x: l1.x, y: l1.y, z: l1.z }, { x: l2.x, y: l2.y, z: l2.z });
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
    muscles.push({ parent, child: p, restRel, target: restRel.clone(),
      K: 1.6 * ms, C: 1.4 * md });
  }

  // PD muscle servo — call once per physics tick before world.step(). Torque is
  // applied to the CHILD only (a servo toward its target angle relative to the
  // parent); a reaction on the parent feeds back up the chain and pumps energy, so
  // the heavier root/parents anchor the chain instead. Overdamped + clamped to stay
  // stable under the 50 Hz explicit step.
  const _qp = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qt = new THREE.Quaternion(), _qe = new THREE.Quaternion(), _ax = new THREE.Vector3();
  const TMAX = 3.5, WMAX = 14;
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
      let tx = m.K * _ax.x * ang - m.C * wc.x;
      let ty = m.K * _ax.y * ang - m.C * wc.y;
      let tz = m.K * _ax.z * ang - m.C * wc.z;
      const mag = Math.hypot(tx, ty, tz);
      if (mag > TMAX) { const k = TMAX / mag; tx *= k; ty *= k; tz *= k; }
      m.child.body.addTorque({ x: tx, y: ty, z: tz }, true);
      // hard cap runaway spin so a stiff chain can never explode
      const ws = Math.hypot(wc.x, wc.y, wc.z);
      if (ws > WMAX) { const k = WMAX / ws; m.child.body.setAngvel({ x: wc.x * k, y: wc.y * k, z: wc.z * k }, true); }
    }
  }

  return { parts, bodies, joints, muscles, lift,
    rootBody: parts[0].body,
    drive,
    readTransforms() { return parts.map((p) => ({ idx: p.idx, t: p.body.translation(), r: p.body.rotation() })); },
    dispose() { for (const j of joints) try { world.removeImpulseJoint(j, true); } catch (_) {} for (const b of bodies) try { world.removeRigidBody(b); } catch (_) {} },
  };
}

/**
 * ArticulatedZook — the real engine wrapped with graphics, exposing the same
 * surface the arena expects (step / syncMeshes / position / dims / _body). Each
 * part is rendered as its genome Blob (superellipsoid) so it looks like the exe.
 */
export class ArticulatedZook {
  constructor(bp, { scene, world, RAPIER, pos = { x: 0, y: 0, z: 0 } }) {
    this.bp = bp; this.scene = scene; this._spawn = { x: pos.x || 0, z: pos.z || 0 };
    this._A = buildArticulated({ bp, world, RAPIER, pos: { x: pos.x || 0, y: 0.4, z: pos.z || 0 } });
    this.group = new THREE.Group(); scene.add(this.group);
    this._meshes = this._A.parts.map((p) => {
      const shape = p.root ? bp.bodyShape : (p.blob && p.blob.shape);
      const rgb = p.root ? (bp.bodyRgb != null ? bp.bodyRgb : 0xcf5a5a) : (p.blob && p.blob.rgb != null ? p.blob.rgb : 0xcf5a5a);
      const geo = p.mesh === 'cube' ? new THREE.BoxGeometry(1, 1, 1) : p.mesh === 'sphere' ? new THREE.SphereGeometry(0.5, 16, 12) : makeBlobGeo(shape);
      const mat = new THREE.MeshStandardMaterial({ color: rgb, roughness: 0.62, metalness: 0.02 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(p.half.x * 2, p.half.y * 2, p.half.z * 2);
      mesh.castShadow = mesh.receiveShadow = true;
      this.group.add(mesh); return mesh;
    });
    this._body = this._A.rootBody;       // arena float/camera reads this
    this.onFlop = null;
    this.syncMeshes();
  }
  step(dt, _inputs) { this._A.drive(); }          // muscles; world.step() is driven by the loop
  syncMeshes() {
    const T = this._A.readTransforms();
    for (let i = 0; i < this._meshes.length; i++) {
      const t = T[i].t, r = T[i].r;
      this._meshes[i].position.set(t.x, t.y, t.z);
      this._meshes[i].quaternion.set(r.x, r.y, r.z, r.w);
    }
  }
  get position() { const t = this._A.rootBody.translation(); return { x: t.x, y: t.y, z: t.z }; }
  get dims() { return { rest: 0.6, w: this.bp.width || 1, h: this.bp.height || 1, l: this.bp.len || 1.6 }; }
  jump() { this._A.rootBody.applyImpulse({ x: 0, y: 5, z: 0 }, true); }
  dispose() { this._A.dispose(); if (this.group.parent) this.group.parent.remove(this.group); }
}

export { ENGINE };
