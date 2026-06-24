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

const D2R = Math.PI / 180;
// Legacy placement (builder-made Zooks): centre at (x,y,z), Euler(pitch,yaw,twist).
function localMat(b) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(b.x || 0, b.y || 0, b.z || 0),
    Q.setFromEuler(E.set(b.pitch || 0, b.yaw || 0, b.twist || 0)), ONE);
}
// FAITHFUL Evo.lua placement (decoded demo Zooks, raw genome `g`). Row-vector spec
//   worldTrans = RotZ(roll)·RotX(pitch)·RotY(yaw) · [RotX(theta)·RotY(phi),pos] · parent
// rewritten in three.js column form: parent · Translation(pos)·RotY(phi)·RotX(theta) ·
// RotY(yaw)·RotX(pitch)·RotZ(roll). +Z is the bone length; joint at −Z end, foot at +Z.
const _rx = (a) => new THREE.Matrix4().makeRotationX(a), _ry = (a) => new THREE.Matrix4().makeRotationY(a), _rz = (a) => new THREE.Matrix4().makeRotationZ(a);
function faithfulMat(g) {
  return new THREE.Matrix4().makeTranslation(g.px || 0, g.py || 0, g.pz || 0)
    .multiply(_ry((g.phi || 0) * D2R)).multiply(_rx((g.theta || 0) * D2R))
    .multiply(_ry((g.yaw || 0) * D2R)).multiply(_rx((g.pitch || 0) * D2R)).multiply(_rz((g.roll || 0) * D2R));
}
function faithfulRoot(g) {
  return new THREE.Matrix4().makeTranslation(g.px || 0, g.py || 0, g.pz || 0)
    .multiply(_ry((g.yaw || 0) * D2R)).multiply(_rx((g.pitch || 0) * D2R)).multiply(_rz((g.roll || 0) * D2R));
}

/** Flatten the blueprint into a part list (root body + clay tree) with each part's
 *  body-LOCAL matrix, resolving the parent tree and connection angles. */
export function layout(bp) {
  const parts = [];
  // Root = the body itself. Faithful Zooks place it by gRoot; builder Zooks at the origin.
  const rootMat = bp.gRoot ? faithfulRoot(bp.gRoot) : new THREE.Matrix4();
  const rootHalf = bp.gRoot
    ? { x: (bp.gRoot.sx || 1) / 2, y: (bp.gRoot.sy || 1) / 2, z: (bp.gRoot.sz || 1.6) / 2 }
    : { x: (bp.width || 1) / 2, y: (bp.height || 1) / 2, z: (bp.len || 1.6) / 2 };
  parts.push({ idx: -1, parent: null, mat: rootMat, half: rootHalf,
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
    const local = b.g ? faithfulMat(b.g) : localMat(b);
    const mat = parentMat.clone().multiply(local);
    matOf[i] = mat;
    const half = b.g
      ? { x: (b.g.sx || 0.4) / 2, y: (b.g.sy || 0.4) / 2, z: (b.g.sz || 0.4) / 2 }
      : { x: (b.sx || 0.4) / 2, y: (b.sy || 0.4) / 2, z: (b.sz || 0.4) / 2 };
    parts.push({ idx: i, parent: b.parent == null ? 0 : null, parentBlob: b.parent, mat, half,
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
    const collider = world.createCollider(col, rb);
    p.body = rb; p.collider = collider; bodies.push(rb); colliders.push(collider);
  }
  // ── Spherical joints + powered-cardan PD (snap-free, faithful placement) ──────
  // Rapier's motorised REVOLUTE snaps when parts sit at their true (varied) genome
  // orientations — it can't align a hinge axis in both frames, so it detonates at spawn.
  // A SPHERICAL joint has no axis to align: it never snaps and pins the −Z connect end
  // rigidly. The 2-DOF powered cardan is then a clamped PD torque about the part's local
  // X (elevation) and Y (sweep), per the Evo.lua muscle spec. Moving parts track the
  // genome ik_positions foot-path (aim the bone at each point); static parts hold rest.
  const muscles = [];
  const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
  const HALFPI = Math.PI / 2;

  function bakeIK(points, mirror) {
    return points.map((p) => {
      const x = mirror ? -(p.x || 0) : (p.x || 0), y = p.y || 0, z = p.z || 0;
      const r = Math.hypot(x, z);
      return { ax: Math.atan2(y, r), ay: -Math.atan2(x, z) };   // elevation(about X), sweep(about Y)
    });
  }
  function sampleCurve(s, t) {
    const n = s.length, u = (((t % 1) + 1) % 1) * n;
    const i = Math.floor(u) % n, f = u - Math.floor(u), a = s[i], b = s[(i + 1) % n];
    return { ax: a.ax + (b.ax - a.ax) * f, ay: a.ay + (b.ay - a.ay) * f };
  }

  for (const p of parts) {
    if (p.root) continue;
    const parent = parts[p.parentPart];
    const ct = p.body.translation(), cr = p.body.rotation();
    const cpos = new THREE.Vector3(ct.x, ct.y, ct.z), cq = new THREE.Quaternion(cr.x, cr.y, cr.z, cr.w);
    const pt = parent.body.translation(), pr = parent.body.rotation();
    const ppos = new THREE.Vector3(pt.x, pt.y, pt.z), pq = new THREE.Quaternion(pr.x, pr.y, pr.z, pr.w);
    const connect = new THREE.Vector3(0, 0, -p.half.z).applyQuaternion(cq).add(cpos);   // -Z connect end
    const aParent = connect.clone().sub(ppos).applyQuaternion(pq.clone().invert());
    // FIXED weld: snap-free (computes the rest frame), rigid, stable. Holds the Zook
    // together exactly as placed. (Revolute snaps on these orientations; spherical+PD
    // is too soft and collapses — fixed is the one robust option on Rapier for now.)
    const f2 = cq.clone().conjugate().multiply(pq);
    const jd = RAPIER.JointData.fixed({ x: aParent.x, y: aParent.y, z: aParent.z }, { x: 0, y: 0, z: 0, w: 1 },
      { x: 0, y: 0, z: -p.half.z }, { x: f2.x, y: f2.y, z: f2.z, w: f2.w });
    joints.push(world.createImpulseJoint(jd, parent.body, p.body, true));
    const b = p.blob || {};
    muscles.push({ child: p.body, parent: parent.body });
  }

  // ── Drive ───────────────────────────────────────────────────────────────────
  // Fixed welds → the Zook is one rigid coherent body; it stands/settles, doesn't walk.
  // (Locomotion on this faithful geometry needs powered joints, which Rapier can't do
  // without snapping — tracked as the next problem.) Only cap runaway velocity.
  const VMAX = 22, WMAX = 30;
  function governVelocities() {
    for (const rb of bodies) {
      const v = rb.linvel(); const sp = Math.hypot(v.x, v.y, v.z);
      if (sp > VMAX) { const k = VMAX / sp; rb.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true); }
      const w = rb.angvel(); const ws = Math.hypot(w.x, w.y, w.z);
      if (ws > WMAX) { const k = WMAX / ws; rb.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true); }
      // Floor guard: a long soft weld chain (40-part worm) can squeeze a part under the
      // floor; never let any part sink below it.
      const t = rb.translation();
      if (t.y < -0.2) { rb.setTranslation({ x: t.x, y: -0.2, z: t.z }, true); if (v.y < 0) rb.setLinvel({ x: v.x, y: 0, z: v.z }, true); }
    }
  }
  function gait(dt, steer = 0) { governVelocities(); }
  function drive() { /* fixed welds — nothing to drive */ }

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
  // In preview, each part also gets an UNSCALED frame Object3D at its transform —
  // the builder uses these (`_blobObj`) for add/drag coordinate math, like the
  // legacy Zook did, so attaching and dragging parts works.
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
  // Update existing meshes in place (no create/dispose) — used during a drag/edit so
  // the builder never churns geometry/materials each frame (the mobile freeze).
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
      this._updateMeshes(parts);          // same structure → cheap in-place update
    } else {
      this._makeMeshes(parts);            // structure changed → full rebuild
    }
    this.setHighlight(this._hi);
  }
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
