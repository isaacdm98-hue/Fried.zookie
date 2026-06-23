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
    const collider = world.createCollider(col, rb);
    p.body = rb; p.collider = collider; bodies.push(rb); colliders.push(collider);
  }
  // ── Joints & legs ────────────────────────────────────────────────────────────
  // The original engine drove each leg's FOOT along an authored loop (the genome's
  // ik_positions foot-path): the foot plants and sweeps back (propelling the body),
  // then lifts and swings forward. We reproduce that faithfully with planar 2-link
  // IK over a powered hip + knee. A single hinge can't lift the foot — that's why the
  // old version slid in place — so a "leg" needs both joints powered, hinging on the
  // SAME (natural) lateral axis so the foot moves in the leg's own sagittal plane.
  const motors = [];   // simple sine joints (non-leg moving parts, e.g. worm segments)
  const legs = [];     // 2-link IK legs (hip + knee)
  const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
  const MModel = RAPIER.MotorModel ? RAPIER.MotorModel.AccelerationBased : undefined;

  // Joint anchor on the CHILD's surface facing its parent (where the two parts meet).
  function jointGeom(p) {
    const parent = parts[p.parentPart];
    const a1 = parent.body.translation(), r1 = parent.body.rotation();
    const a2 = p.body.translation(), r2 = p.body.rotation();
    const cW = new THREE.Vector3(a2.x, a2.y, a2.z), pWc = new THREE.Vector3(a1.x, a1.y, a1.z);
    const dir = pWc.clone().sub(cW); if (dir.lengthSq() < 1e-9) dir.set(0, 0, -1); dir.normalize();
    const qp = new THREE.Quaternion(r1.x, r1.y, r1.z, r1.w);
    const qc = new THREE.Quaternion(r2.x, r2.y, r2.z, r2.w);
    const dL = dir.clone().applyQuaternion(qc.clone().invert());
    const support = Math.abs(dL.x) * p.half.x + Math.abs(dL.y) * p.half.y + Math.abs(dL.z) * p.half.z;
    const connWorld = cW.clone().add(dir.clone().multiplyScalar(support));
    const toLocal = (t, r) => {
      const inv = new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y, t.z), new THREE.Quaternion(r.x, r.y, r.z, r.w), ONE).invert();
      return connWorld.clone().applyMatrix4(inv);
    };
    return { parent, a1, r1, a2, r2, qp, qc, connWorld, l1: toLocal(a1, r1), l2: toLocal(a2, r2) };
  }
  parts.forEach((p) => { if (!p.root) p.jg = jointGeom(p); });

  function makeRevolute(p, axisWorld) {
    const jg = p.jg, { parent, l1, l2, qp } = jg;
    const axisP = axisWorld.clone().applyQuaternion(qp.clone().invert()).normalize();   // axis in parent-local frame
    const jd = RAPIER.JointData.revolute({ x: l1.x, y: l1.y, z: l1.z }, { x: l2.x, y: l2.y, z: l2.z }, { x: axisP.x, y: axisP.y, z: axisP.z });
    const j = world.createImpulseJoint(jd, parent.body, p.body, true);
    if (j.configureMotorModel && MModel !== undefined) j.configureMotorModel(MModel);
    joints.push(j); return j;
  }
  function makeFixed(p) {
    const { parent, l1, l2, qp, qc } = p.jg;
    const f2 = qc.clone().conjugate().multiply(qp);
    const jd = RAPIER.JointData.fixed({ x: l1.x, y: l1.y, z: l1.z }, { x: 0, y: 0, z: 0, w: 1 },
      { x: l2.x, y: l2.y, z: l2.z }, { x: f2.x, y: f2.y, z: f2.z, w: f2.w });
    joints.push(world.createImpulseJoint(jd, parent.body, p.body, true));
  }
  const angIn = (d, e1, e2) => Math.atan2(d.dot(e2), d.dot(e1));   // direction → in-plane angle

  // ── Classify into LEGS ───────────────────────────────────────────────────────
  // A leg is the chain from the body out to a moving "foot" (a moving part with no
  // moving descendant). Every joint in the chain — even ones the genome marks static,
  // like a spider's upper-leg — is powered, all hinging on ONE shared lateral axis so
  // the whole leg moves in its own plane. This handles any depth: spider (2-bone),
  // ant (3-bone), twigger (6-bone). General N-link planar IK (CCD) drives the foot
  // along the planted/lifted loop. Joints not claimed by a leg just hold their pose.
  const claimed = new Array(parts.length).fill(false);
  const hasMovingChild = new Array(parts.length).fill(false);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p.root && p.blob && p.blob.move) {
      const pp = p.parentPart; if (pp != null && parts[pp] && !parts[pp].root) hasMovingChild[pp] = true;
    }
  }
  const legSpecs = [];
  for (let i = 0; i < parts.length; i++) {
    const leaf = parts[i];
    if (leaf.root || !(leaf.blob && leaf.blob.move) || hasMovingChild[i]) continue;  // foot = moving leaf
    // Walk up to (and include) the part whose parent is the body root.
    const chain = []; let cur = i, ok = true;
    while (cur != null && !parts[cur].root) {
      if (claimed[cur]) { ok = false; break; }
      chain.push(cur);
      const par = parts[cur].parentPart;
      if (par != null && parts[par] && parts[par].root) break;     // reached the hip segment
      cur = par;
    }
    if (!ok || !chain.length || chain.length > 6) continue;        // long chains are spines, not legs
    chain.reverse();                                               // hip-first … foot-last
    for (const c of chain) claimed[c] = true;
    legSpecs.push(chain.map((c) => parts[c]));
  }

  // LEGS grip the floor; the BODY (and any welded stubs) is slippery so it slides instead
  // of pinning the Zook in place when it sags down — the gripping legs then actually propel
  // it. (Uniform high friction made the Ant's belly drag and scrabble without moving; making
  // only the tiny foot-tip grip starved the Spider, whose long leg segments do the gripping —
  // so the whole leg chain grips.)
  for (const p of parts) if (p.collider) p.collider.setFriction(0.18);
  for (const segs of legSpecs) for (const s of segs) if (s.collider) s.collider.setFriction(1.7);

  // Build each leg's joints + analytic 2-link IK geometry. We lump any intermediate
  // segments into ONE rigid "upper" link: only the HIP (first joint) and ANKLE (last
  // joint) are driven; middle joints hold their rest pose rigidly. So every leg — spider
  // (2-bone), ant (3-bone), twigger (6-bone) — becomes a clean 2-link problem the
  // analytic solver handles, with a big propulsive hip sweep and a lifting ankle.
  let legIx = 0;
  for (const segs of legSpecs) {
    const n = segs.length, hip = segs[0], foot = segs[n - 1];
    const axisW = _X.clone().applyQuaternion(hip.jg.qc).normalize();   // shared lateral hinge axis
    const e1 = _Z.clone().sub(axisW.clone().multiplyScalar(_Z.dot(axisW)));
    if (e1.lengthSq() < 1e-6) e1.copy(_X).sub(axisW.clone().multiplyScalar(_X.dot(axisW)));
    e1.normalize();
    const e2 = axisW.clone().cross(e1).normalize();
    const H = hip.jg.connWorld.clone();                              // hip anchor (on body)
    const ankle = foot.jg.connWorld.clone();                         // last joint anchor
    const footPos = new THREE.Vector3(foot.jg.a2.x, foot.jg.a2.y, foot.jg.a2.z);
    const tip = footPos.clone().add(footPos.clone().sub(ankle));     // far end of the foot
    const planar = (q) => ({ x: q.clone().sub(H).dot(e1), y: q.clone().sub(H).dot(e2) });
    const PA = (n > 1) ? planar(ankle) : { x: 0, y: 0 }, PT = planar(tip);
    const L1 = (n > 1) ? Math.hypot(PA.x, PA.y) : Math.hypot(PT.x, PT.y);
    const L2 = (n > 1) ? Math.hypot(PT.x - PA.x, PT.y - PA.y) : 1e-3;
    const restThigh = (n > 1) ? Math.atan2(PA.y, PA.x) : Math.atan2(PT.y, PT.x);
    const restFoot = Math.atan2(PT.y - PA.y, PT.x - PA.x);
    let bend = ((restThigh - Math.atan2(PT.y, PT.x)) >= 0) ? 1 : -1;
    function ik(px, py) {                                            // 2-link → (thigh, foot) angles
      let D = Math.hypot(px, py);
      D = Math.max(Math.abs(L1 - L2) + 1e-3, Math.min(L1 + L2 - 1e-3, D));
      const base = Math.atan2(py, px);
      let c1 = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D); c1 = Math.max(-1, Math.min(1, c1));
      const thighAng = base + bend * Math.acos(c1);
      const footAng = Math.atan2(py - L1 * Math.sin(thighAng), px - L1 * Math.cos(thighAng));
      return { thighAng, footAng };
    }
    const up = _Y.clone().sub(axisW.clone().multiplyScalar(_Y.dot(axisW)));
    if (up.lengthSq() < 1e-6) up.copy(e2); up.normalize();
    const fwdInPlane = { x: e1.dot(e1), y: e1.dot(e2) }, upInPlane = { x: up.dot(e1), y: up.dot(e2) };
    // STANDING foot target: straight down from the hip to the floor, in plane coords. Driving
    // the foot here (not to its decoded rest tip) means EVERY leg plants on the ground — even
    // legs the genome arches upward (Ant/Leapsa) get pulled down into a real stance. Capped to
    // the leg's reach so a short leg just extends fully instead of being yanked.
    const standDrop = Math.min(H.y, (L1 + L2) * 0.92);
    const anchor = { x: -standDrop * e1.y, y: -standDrop * e2.y };
    // Pick the knee-bend branch that actually reaches the ground anchor with the knee raised
    // (a natural leg), regardless of how the rest pose was authored.
    const bendDown = (() => {
      const tryB = (bb) => { const sv = bend; bend = bb; const r = ik(anchor.x, anchor.y); bend = sv;
        const kx = L1 * Math.cos(r.thighAng), ky = L1 * Math.sin(r.thighAng); return ky; };
      return tryB(1) >= tryB(-1) ? 1 : -1;   // knee higher = more natural
    })();
    bend = bendDown;
    // Motor gain scales with leg count: many legs share the body's weight so each can be
    // stiff (a strong gait), but a lone leg must be gentle or it catapults the whole body.
    const stiff = Math.min(240, 70 + 24 * legSpecs.length), damp = stiff * 0.1;
    const hipJ = makeRevolute(hip, axisW); hipJ.configureMotorPosition(0, stiff, damp);
    for (let k = 1; k < n - 1; k++) { const j = makeRevolute(segs[k], axisW); j.configureMotorPosition(0, 300, 30); }
    const ankleJ = (n > 1) ? makeRevolute(foot, axisW) : null;
    if (ankleJ) ankleJ.configureMotorPosition(0, stiff, damp);
    // Drive a clean walking ellipse — foot plants and sweeps BACK (propelling the body),
    // then lifts and swings forward — sized by the AUTHENTIC stride & lift read from the
    // genome's ik_positions foot-path (its fore-aft and vertical excursion). This keeps each
    // creature's real step size/timing while guaranteeing propulsion (raw-path replay only
    // shuffled). Phase offset = the genome's per-limb Movement Cycle.
    const reach = L1 + L2;
    const raw = (foot.blob && foot.blob.gait) || null;
    let stride, lift;
    if (raw && raw.length >= 2) {
      let zmn = 1e9, zmx = -1e9, ymn = 1e9, ymx = -1e9;
      for (const q of raw) { zmn = Math.min(zmn, q.z); zmx = Math.max(zmx, q.z); ymn = Math.min(ymn, q.y); ymx = Math.max(ymx, q.y); }
      stride = (zmx - zmn) / 2; lift = (ymx - ymn);
    } else { stride = 0.32 * reach; lift = 0.28 * reach; }
    stride = Math.max(0.12, Math.min(stride, reach * 0.55));
    lift = Math.max(0.08, Math.min(lift, reach * 0.5));
    legs.push({ hipJ, ankleJ, ik, restThigh, restFoot, anchor, fwdInPlane, upInPlane,
      clock: (foot.blob && foot.blob.cycle != null) ? foot.blob.cycle : (legIx++ % 2) * 0.5, stiff, damp, stride, lift });
  }

  // Everything not part of a leg gets a rigid weld. This includes "moving" parts that
  // aren't ground legs (e.g. a worm/snake's spine): a long chain of independent hold-pose
  // hinge motors resonates and flings the body, whereas a weld is rock-stable. Such Zooks
  // simply don't locomote yet (no ground-pushing legs) — but they stay intact.
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]; if (p.root || claimed[i]) continue;
    makeFixed(p);
  }

  // Advance the gait: move each leg's FOOT along its planted/lifted loop, solve the
  // analytic 2-link IK, and set the hip + ankle motor targets (relative angle from rest).
  const GAIT_RATE = 1.9, CLAMP = 1.4, FOOTPATH_DIR = -1;   // sign maps path fore-aft → world forward
  const clamp = (v) => Math.max(-CLAMP, Math.min(CLAMP, v));        // no single step can fling a limb
  // Velocity governor: a long fixed-joint chain (e.g. a 40-part worm) can fail to
  // converge in the solver and inject energy. Cap every part's speed so no Zook can
  // ever explode — a hard safety net independent of the articulation's stiffness.
  const VMAX = 14, WMAX = 24;
  function governVelocities() {
    for (const rb of bodies) {
      const v = rb.linvel(); const sp = Math.hypot(v.x, v.y, v.z);
      if (sp > VMAX) { const k = VMAX / sp; rb.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true); }
      const w = rb.angvel(); const ws = Math.hypot(w.x, w.y, w.z);
      if (ws > WMAX) { const k = WMAX / ws; rb.setAngvel({ x: w.x * k, y: w.y * k, z: w.z * k }, true); }
    }
  }
  function gait(dt, steer = 0) {
    governVelocities();
    for (const lg of legs) {
      lg.clock += dt * GAIT_RATE;
      const ph = 2 * Math.PI * lg.clock;
      const horiz = lg.stride * Math.cos(ph) * FOOTPATH_DIR;       // fore-aft sweep
      const s = Math.sin(ph);
      const vert = s < 0 ? lg.lift * (-s) : 0;                     // stance: foot down & sweeping back; swing: lifted
      const px = lg.anchor.x + lg.fwdInPlane.x * horiz + lg.upInPlane.x * vert;
      const py = lg.anchor.y + lg.fwdInPlane.y * horiz + lg.upInPlane.y * vert;
      const { thighAng, footAng } = lg.ik(px, py);
      lg.hipJ.configureMotorPosition(clamp(thighAng - lg.restThigh), lg.stiff, lg.damp);
      if (lg.ankleJ) lg.ankleJ.configureMotorPosition(clamp((footAng - thighAng) - (lg.restFoot - lg.restThigh)), lg.stiff, lg.damp);
    }
  }
  function drive() { /* motors are integrated by world.step(); nothing to apply here */ }

  return { parts, bodies, joints, motors, legs, lift,
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
