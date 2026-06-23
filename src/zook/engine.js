/**
 * engine.js — the BAMZOOKi articulated body, reconstructed faithfully on Rapier.
 *
 * Per the decompiled Evo.lua model (reference/decompile/02-locomotion-engine.md):
 *   • Every part is its own rigid "segment" (Karma body); +Z is the bone length,
 *     the JOINT is at the part's −Z "connect" end, the foot is the +Z end.
 *   • Every non-root part is joined by a 2-DOF powered CARDAN at that connect point
 *     (axes = part-local X,Y; ±90°; no Z DOF). We hold the parts together with a
 *     spherical joint and reproduce the powered cardan EXACTLY as the spec prescribes:
 *     a clamped PD muscle  torque = K·(θ_target − θ) − C·θ̇  about local X (elevation)
 *     and Y (sweep), with Z suppressed.
 *   • Moving parts get θ_target from the genome IK foot-path (ik_positions) baked into
 *     a phase→angle curve: aim the bone (+Z) at each path point — xAngle=−atan2(x,z)
 *     (sweep about Y), yAngle=atan2(y,r) (elevation about X). Per-leg `leg_phase`
 *     offsets the clock; a MasterAmplitude ramp eases the gait in.
 *   • Self-collision OFF; balance is EMERGENT (gait + ±90° limits) — nothing scripts
 *     the body forward.
 */
import * as THREE from 'three';
import { ENGINE } from './engine-constants.js';
import { makeBlobGeo } from './model.js';

const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), _S = new THREE.Vector3();

// Part placement matches the builder's model.js: centre at (x,y,z) relative to the
// parent, oriented by Euler(pitch,yaw,twist), +Z = bone length. So what you build is
// what the engine simulates. (Demo Zooks are pre-seated in tools/decode-zooks.mjs.)
function localMat(b) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(b.x || 0, b.y || 0, b.z || 0),
    Q.setFromEuler(E.set(b.pitch || 0, b.yaw || 0, b.twist || 0)), ONE);
}

/** Flatten the blueprint into a part list (root body + clay tree), each with its
 *  creature-local matrix and parent links. */
export function layout(bp) {
  const parts = [];
  parts.push({ idx: -1, parent: null, mat: new THREE.Matrix4(),
    half: { x: (bp.width || 1) / 2, y: (bp.height || 1) / 2, z: (bp.len || 1.6) / 2 },
    mesh: bp.bodyMesh || 'blob', root: true });
  const blobs = bp.blobs || [];
  const matOf = [];
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
  const partOfBlob = {}; parts.forEach((p, k) => { if (p.idx >= 0) partOfBlob[p.idx] = k; });
  for (const p of parts) {
    if (p.root) continue;
    p.parentPart = (p.parentBlob == null) ? 0 : (partOfBlob[p.parentBlob] ?? 0);
  }
  return parts;
}

const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
const HALFPI = Math.PI / 2;

// Bake a single-link IK foot-path into phase→angle samples (radians). Points are leg-
// local (origin = the connect end, +Z = bone); aim the bone at each point. Mirror by side.
function bakeIK(points, mirror) {
  return points.map((p) => {
    const x = mirror ? -(p.x || 0) : (p.x || 0), y = p.y || 0, z = p.z || 0;
    const r = Math.hypot(x, z);
    return { ax: Math.atan2(y, r), ay: -Math.atan2(x, z) };   // ax = elevation(about X), ay = sweep(about Y)
  });
}
function sampleCurve(s, t) {
  const n = s.length, u = (((t % 1) + 1) % 1) * n;
  const i = Math.floor(u) % n, f = u - Math.floor(u), a = s[i], b = s[(i + 1) % n];
  return { ax: a.ax + (b.ax - a.ax) * f, ay: a.ay + (b.ay - a.ay) * f };
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
        .setLinearDamping(0.2).setAngularDamping(0.85)
        .setCcdEnabled(true));
    const rad = Math.min(p.half.x, p.half.y, p.half.z) * 0.35;
    const col = (RAPIER.ColliderDesc.roundCuboid
      ? RAPIER.ColliderDesc.roundCuboid(Math.max(0.01, p.half.x - rad), Math.max(0.01, p.half.y - rad), Math.max(0.01, p.half.z - rad), rad)
      : RAPIER.ColliderDesc.cuboid(p.half.x, p.half.y, p.half.z))
      .setDensity(1.0).setFriction(1.1).setRestitution(0.02);
    if (RAPIER.CoefficientCombineRule) col.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);
    // Self-collidability OFF (Karma.SetAgentCollidabilityOff): a Zook's own parts pass
    // through each other but still collide with the world.
    col.setCollisionGroups(0x0002FFFD);
    const collider = world.createCollider(col, rb);
    p.body = rb; p.collider = collider; bodies.push(rb); colliders.push(collider);
  }

  // ── Cardan muscles ────────────────────────────────────────────────────────────
  // Spherical joint at each part's −Z connect end keeps it attached (no snap — both
  // anchors map to the same world point at build); the 2-DOF powered cardan is applied
  // as a manual clamped PD torque each tick (see the file header).
  const muscles = [];
  for (const p of parts) {
    if (p.root) continue;
    const parent = parts[p.parentPart];
    const ct = p.body.translation(), cr = p.body.rotation();
    const cpos = new THREE.Vector3(ct.x, ct.y, ct.z), cq = new THREE.Quaternion(cr.x, cr.y, cr.z, cr.w);
    const pt = parent.body.translation(), pr = parent.body.rotation();
    const ppos = new THREE.Vector3(pt.x, pt.y, pt.z), pq = new THREE.Quaternion(pr.x, pr.y, pr.z, pr.w);
    const connectWorld = new THREE.Vector3(0, 0, -p.half.z).applyQuaternion(cq).add(cpos);
    const aParent = connectWorld.clone().sub(ppos).applyQuaternion(pq.clone().invert());
    const aChild = new THREE.Vector3(0, 0, -p.half.z);
    const jd = RAPIER.JointData.spherical({ x: aParent.x, y: aParent.y, z: aParent.z }, { x: aChild.x, y: aChild.y, z: aChild.z });
    joints.push(world.createImpulseJoint(jd, parent.body, p.body, true));

    const b = p.blob || {};
    const curve = (b.move && b.gait && b.gait.length >= 2) ? bakeIK(b.gait, (b.phi || 0) < 0) : null;
    muscles.push({
      child: p.body, parent: parent.body,
      qRelRest: pq.clone().invert().multiply(cq),    // child-rel-parent at rest (cardan zero)
      curve, phase: (b.cycle != null ? b.cycle : 0),
      K: 5.0 * ((b.muscleStiffness || 1000) / 1000), // PD gains (Rapier-tuned from the genome muscle)
      C: 5.2 * ((b.muscleDamping || 1000) / 1000),
    });
  }

  // ── Drive ───────────────────────────────────────────────────────────────────
  const GAIT_CADENCE = 0.7;             // cycles/sec (≈ IKspeed·tickrate)
  const TMAX = 9;                       // clamp per-joint torque (stability)
  const VMAX = 16, WMAX = 26;           // velocity governor — no Zook can ever explode
  let clock = 0, amp = 0;               // amp = MasterAmplitude ramp 0→1
  const qP = new THREE.Quaternion(), qC = new THREE.Quaternion(), qRel = new THREE.Quaternion(), qDev = new THREE.Quaternion(), qRestInv = new THREE.Quaternion();
  const torque = new THREE.Vector3(), lx = new THREE.Vector3(), ly = new THREE.Vector3(), lz = new THREE.Vector3(), wRel = new THREE.Vector3(), eul = new THREE.Euler();

  function governVelocities() {
    for (const rb of bodies) {
      const v = rb.linvel(); const sp = Math.hypot(v.x, v.y, v.z);
      if (sp > VMAX) { const k = VMAX / sp; rb.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true); }
      const w = rb.angvel(); const ws = Math.hypot(w.x, w.y, w.z);
      if (ws > WMAX) { const k = WMAX / ws; rb.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true); }
      // Hard floor guard: a long soft chain can squeeze a part under the floor; never let it.
      const t = rb.translation();
      if (t.y < -0.3) { rb.setTranslation({ x: t.x, y: -0.3, z: t.z }, true); if (v.y < 0) rb.setLinvel({ x: v.x, y: 0, z: v.z }, true); }
    }
  }

  function gait(dt, steer = 0) {
    governVelocities();
    clock += dt * GAIT_CADENCE;
    amp = Math.min(1, amp + dt * 0.35);
    for (const m of muscles) {
      const pr = m.parent.rotation(), cr = m.child.rotation();
      qP.set(pr.x, pr.y, pr.z, pr.w); qC.set(cr.x, cr.y, cr.z, cr.w);
      qRel.copy(qP).invert().multiply(qC);              // child relative to parent
      qRestInv.copy(m.qRelRest).invert();
      qDev.copy(qRestInv).multiply(qRel);               // deviation from the rest pose
      eul.setFromQuaternion(qDev, 'XYZ');               // current cardan angles (X=elev, Y=sweep, Z=twist)
      let tAx = 0, tAy = 0;
      if (m.curve) { const s = sampleCurve(m.curve, clock + m.phase); tAx = s.ax * amp; tAy = s.ay * amp; }
      tAx = Math.max(-HALFPI, Math.min(HALFPI, tAx));
      tAy = Math.max(-HALFPI, Math.min(HALFPI, tAy));
      // Relative angular velocity (child − parent), projected onto the child's local axes.
      const cw = m.child.angvel(), pw = m.parent.angvel();
      wRel.set(cw.x - pw.x, cw.y - pw.y, cw.z - pw.z);
      lx.copy(_X).applyQuaternion(qC); ly.copy(_Y).applyQuaternion(qC); lz.copy(_Z).applyQuaternion(qC);
      torque.set(0, 0, 0);
      torque.addScaledVector(lx, m.K * (tAx - eul.x) - m.C * wRel.dot(lx));
      torque.addScaledVector(ly, m.K * (tAy - eul.y) - m.C * wRel.dot(ly));
      torque.addScaledVector(lz, m.K * 1.5 * (0 - eul.z) - m.C * wRel.dot(lz));   // suppress Z (no DOF)
      if (torque.length() > TMAX) torque.setLength(TMAX);
      // Apply to child + equal/opposite reaction to parent (conserves angular momentum —
      // dropping the reaction injects spurious spin that floats/launches big Zooks).
      m.child.applyTorqueImpulse({ x: torque.x * dt, y: torque.y * dt, z: torque.z * dt }, true);
      m.parent.applyTorqueImpulse({ x: -torque.x * dt, y: -torque.y * dt, z: -torque.z * dt }, true);
    }
  }
  function drive() { /* torque is applied in gait(); nothing else to do */ }

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
 * meshes statically for the BUILDER, so what you design is what you simulate.
 */
export class ArticulatedZook {
  constructor(bp, { scene, world, RAPIER, pos = { x: 0, y: 0, z: 0 }, preview = false }) {
    this.bp = bp; this.scene = scene; this.preview = !!preview; this.world = world; this.RAPIER = RAPIER;
    this._spawn = { x: pos.x || 0, z: pos.z || 0 };
    this.group = new THREE.Group(); scene.add(this.group);
    this.onFlop = null; this._hi = -1; this._legs = [];
    if (this.preview) { this._buildPreview(bp); }
    else {
      this._A = buildArticulated({ bp, world, RAPIER, pos: { x: pos.x || 0, y: 0.4, z: pos.z || 0 } });
      this._body = this._A.rootBody;
      this._makeMeshes(this._A.parts);
      this.syncMeshes();
    }
  }
  _makeMeshes(parts) {
    while (this.group.children.length) {
      const c = this.group.children.pop();
      c.traverse((o) => { if (o.isMesh && o.material && o.material !== _HILITE) o.material.dispose(); });
    }
    this._meshes = []; this._blobs = []; this._blobObj = [];
    for (const p of parts) {
      const shape = p.root ? this.bp.bodyShape : (p.blob && p.blob.shape);
      const rgb = p.root ? (this.bp.bodyRgb != null ? this.bp.bodyRgb : 0xcf5a5a) : (p.blob && p.blob.rgb != null ? p.blob.rgb : 0xcf5a5a);
      const geo = p.mesh === 'cube' ? _PREVIEW_BOX : p.mesh === 'sphere' ? _PREVIEW_BALL : makeBlobGeo(shape);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: rgb, roughness: 0.62, metalness: 0.02 }));
      mesh.scale.set(p.half.x * 2, p.half.y * 2, p.half.z * 2);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.baseMat = mesh.material;
      if (p.root) mesh.userData.isBody = true; else mesh.userData.blobIndex = p.idx;
      if (this.preview && p.mat) {
        p.mat.decompose(V, Q, _S);
        const frame = new THREE.Object3D(); frame.position.copy(V); frame.quaternion.copy(Q);
        frame.add(mesh); this.group.add(frame);
        if (!p.root) this._blobObj[p.idx] = frame;
      } else {
        this.group.add(mesh);
      }
      this._meshes.push(mesh);
      if (!p.root) this._blobs[p.idx] = mesh;
    }
    this._meshKinds = parts.map((p) => p.root ? (this.bp.bodyMesh || 'blob') : (p.mesh || 'blob'));
  }
  _updateMeshes(parts) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i], mesh = this._meshes[i]; if (!mesh) continue;
      const shape = p.root ? this.bp.bodyShape : (p.blob && p.blob.shape);
      const rgb = p.root ? (this.bp.bodyRgb != null ? this.bp.bodyRgb : 0xcf5a5a) : (p.blob && p.blob.rgb != null ? p.blob.rgb : 0xcf5a5a);
      if (p.mesh !== 'cube' && p.mesh !== 'sphere') mesh.geometry = makeBlobGeo(shape);
      mesh.scale.set(p.half.x * 2, p.half.y * 2, p.half.z * 2);
      if (mesh.userData.baseMat) mesh.userData.baseMat.color.setHex(rgb);
      if (mesh.parent && mesh.parent !== this.group && p.mat) { p.mat.decompose(V, Q, _S); mesh.parent.position.copy(V); mesh.parent.quaternion.copy(Q); }
    }
  }
  _buildPreview(bp) {
    this.bp = bp;
    const parts = layout(bp);
    const kinds = parts.map((p) => p.root ? (bp.bodyMesh || 'blob') : (p.mesh || 'blob'));
    if (this._meshes && this._meshes.length === parts.length && this._meshKinds &&
        kinds.length === this._meshKinds.length && kinds.every((k, i) => k === this._meshKinds[i])) {
      this._updateMeshes(parts);
    } else {
      this._makeMeshes(parts);
    }
    this.setHighlight(this._hi);
  }
  setBlueprint(bp, hi = -1) { this.bp = bp; this._hi = hi; if (this.preview) this._buildPreview(bp); }
  setHighlight(idx) {
    this._hi = idx;
    if (!this._blobs) return;
    this._blobs.forEach((m) => { if (m && m.userData.baseMat) m.material = m.userData.baseMat; });
    const sel = idx != null && idx >= 0 && this._blobs[idx];
    if (sel) sel.material = _HILITE;
  }
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
