/**
 * arena.js — the test environments (manual Ch14).
 *
 * A Zook is set loose to see how it moves. Tap the floor to set a target it
 * walks to; tap the Zook (or FLOAT) to lift it into the air to study its gait.
 * A timer records runs (SprintEnv auto-times to the finish line), and a passport
 * panel shows the Zook's stats. The environment can be swapped through the real
 * set: Box, Sprint, Hurdle, ZigZag, Slope, Step, Strong, Shift, Ram, Sloppy.
 */

import * as THREE from 'three';
import { Zook } from './model.js';
import { setCamera } from '../engine/renderer.js';
import { fb } from '../sys/feedback.js';
import { guide } from '../sys/guide.js';

export const ENVIRONMENTS = [
  { id: 'box',    name: 'BoxEnv',    blurb: 'a plain table, no obstacles' },
  { id: 'sprint', name: 'SprintEnv', blurb: 'timed dash to the finish line' },
  { id: 'hurdle', name: 'HurdleEnv', blurb: 'a series of hurdles' },
  { id: 'zigzag', name: 'ZigZagEnv', blurb: 'a slalom course' },
  { id: 'slope',  name: 'SlopeEnv',  blurb: 'increasingly steep slopes' },
  { id: 'step',   name: 'StepEnv',   blurb: 'a flight of steps' },
  { id: 'strong', name: 'StrongEnv', blurb: 'barrels to push over the line' },
  { id: 'shift',  name: 'ShiftEnv',  blurb: 'balls & boxes to shove' },
  { id: 'ram',    name: 'RamEnv',    blurb: 'a heavy gate to barge through' },
  { id: 'sloppy', name: 'SloppyEnv', blurb: 'a see-saw' },
  { id: 'lap',    name: 'LapEnv',    blurb: 'four targets — race a lap' },
  { id: 'blockpush', name: 'BlockPushEnv', blurb: 'shove the blocks along' },
  { id: 'highjump', name: 'HighJumpEnv', blurb: 'run up and JUMP the bar' },
];

const TW = 9, TL = 34;

export class Arena {
  constructor({ scene, world, RAPIER, camera, canvas, mount, onBack }) {
    Object.assign(this, { scene, world, RAPIER, camera, canvas, mount, onBack });
    this.zook = null; this._statics = []; this._dyn = []; this._meshes = [];
    this._marker = null; this.target = null; this._envIdx = 0;
    this._ray = new THREE.Raycaster(); this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._float = false; this._timer = 0; this._timing = false; this._best = {};
    this._topSpeed = 0; this._lastPos = null;
    this._onPointer = this._onPointer.bind(this);
  }

  enter(blueprint) {
    this.bp = blueprint;
    this._spawnAll();
    this.canvas.addEventListener('pointerdown', this._onPointer);
    this._buildHud();
    guide.now('Tap the floor to send your Zook there. Tap the Zook to float it for a look!');
  }

  _spawnAll() {
    this._buildBase();
    this._buildEnv(ENVIRONMENTS[this._envIdx].id);
    this.zook = new Zook(this.bp, { scene: this.scene, world: this.world, RAPIER: this.RAPIER, pos: { x: 0, z: TL / 2 - 3 } });
    this._marker = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0x551015, roughness: 0.4 }));
    this.scene.add(this._marker);
    this.target = { x: 0, z: -TL / 2 + 4 };
    this._marker.position.set(0, 0.03, this.target.z);
    this._float = false; this._timer = 0; this._timing = false; this._topSpeed = 0; this._lastPos = null;
    this._maxH = 0; this._lap = null; this._lapIdx = 0; this._laps = 0; this._pushBlocks = null;
    setCamera({ x: 5.5, y: 4.5, z: TL / 2 + 1 }, { x: 0, y: 0, z: 0 }, true);
  }

  _reset() {
    if (this.zook) this.zook.dispose();
    for (const m of this._meshes) this.scene.remove(m);
    for (const b of this._statics) { try { this.world.removeRigidBody(b); } catch (_) {} }
    for (const d of this._dyn) { try { this.world.removeRigidBody(d.body); } catch (_) {} }
    if (this._marker) this.scene.remove(this._marker);
    this._meshes = []; this._statics = []; this._dyn = [];
    this._spawnAll();
    this._syncHud();
  }

  exit() {
    this.canvas.removeEventListener('pointerdown', this._onPointer);
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this._marker) { this.scene.remove(this._marker); this._marker = null; }
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    for (const b of this._statics) { try { this.world.removeRigidBody(b); } catch (_) {} }
    for (const d of this._dyn) { try { this.world.removeRigidBody(d.body); } catch (_) {} }
    this._meshes = []; this._statics = []; this._dyn = [];
    if (this._hud) { this._hud.remove(); this._hud = null; }
  }

  // ── input ──────────────────────────────────────────────────────────────────
  _onPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(ndc, this.camera);
    // Tap the Zook itself → toggle float.
    const hit = this._ray.intersectObject(this.zook.group, true);
    if (hit.length) { this._toggleFloat(); return; }
    const p = new THREE.Vector3();
    if (this._ray.ray.intersectPlane(this._plane, p)) {
      this.target = { x: Math.max(-TW / 2, Math.min(TW / 2, p.x)), z: Math.max(-TL / 2, Math.min(TL / 2, p.z)) };
      this._marker.position.set(this.target.x, 0.03, this.target.z);
      if (ENVIRONMENTS[this._envIdx].id === 'sprint' && !this._timing && !this._float) { this._timing = true; this._timer = 0; }
    }
  }

  _toggleFloat() {
    this._float = !this._float; fb.toggle(this._float);
    if (this._float) {
      const b = this.zook._body;
      this._hoverFrom = { x: this.zook.position.x, z: this.zook.position.z };
    }
    this._syncHud();
  }

  // ── loop ──────────────────────────────────────────────────────────────────
  onStep(dt) {
    if (!this.zook) return;
    if (this._float) {
      const b = this.zook._body;
      b.setTranslation({ x: this._hoverFrom.x, y: 2.4, z: this._hoverFrom.z }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.zook.step(dt, { walk: true });            // animate gait in the air
      return;
    }
    const env = ENVIRONMENTS[this._envIdx].id;
    // LapEnv: cycle through four waypoints, time a full lap.
    if (env === 'lap' && this._lap) {
      const wp = this._lap[this._lapIdx]; this.target = wp;
      if (this._marker) this._marker.position.set(wp.x, 0.03, wp.z);
      const zp = this.zook.position;
      if (Math.hypot(zp.x - wp.x, zp.z - wp.z) < 1.2) {
        this._lapIdx = (this._lapIdx + 1) % 4;
        if (this._lapIdx === 1 && !this._timing) { this._timing = true; this._timer = 0; }
        else if (this._lapIdx === 0) { this._timing = false; this._best.lap = Math.min(this._best.lap || 99, this._timer); fb.win(); guide.now(`Lap done — ${this._timer.toFixed(2)}s!`); }
      }
    }
    this.zook.step(dt, { walk: true, target: this.target });
    // timing + top speed + jump height
    const p = this.zook.position;
    this._maxH = Math.max(this._maxH || 0, p.y - this.zook.dims.rest);
    if (this._lastPos) {
      const v = Math.hypot(p.x - this._lastPos.x, p.z - this._lastPos.z) / dt;
      this._topSpeed = Math.max(this._topSpeed, v);
    }
    this._lastPos = { x: p.x, z: p.z };
    if (this._timing) {
      this._timer += dt;
      if (ENVIRONMENTS[this._envIdx].id === 'sprint' && p.z <= -TL / 2 + 3) {
        this._timing = false;
        this._best.sprint = Math.min(this._best.sprint || 99, this._timer);
        fb.win(); guide.now(`Finish! ${this._timer.toFixed(2)}s. ${this._best.sprint === this._timer ? 'New best!' : ''}`);
      }
    }
  }

  update() {
    if (!this.zook) return;
    this.zook.syncMeshes();
    for (const d of this._dyn) { const t = d.body.translation(), r = d.body.rotation(); d.mesh.position.set(t.x, t.y, t.z); d.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
    if (this._marker) this._marker.rotation.y += 0.04;
    // Smoothly follow the Zook in both X and Z so it never wanders off-screen.
    const p = this.zook.position;
    if (!this._camAt) this._camAt = { x: p.x, z: p.z };
    this._camAt.x += (p.x - this._camAt.x) * 0.09;
    this._camAt.z += (p.z - this._camAt.z) * 0.09;
    const cx = this._camAt.x, cz = this._camAt.z;
    setCamera({ x: cx + 5.0, y: this._float ? 4.4 : 3.8, z: cz + 5 }, { x: cx, y: this._float ? 1.6 : 0.4, z: cz - 1.2 });
    if (this._timeEl) this._timeEl.textContent = this._fmt(this._timer);
  }

  // ── build helpers ───────────────────────────────────────────────────────────
  _mat(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05 }); }
  _static({ pos, size, color = 0xeee7d6, rot, friction = 0.95 }) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), this._mat(color));
    m.position.set(pos.x, pos.y, pos.z); if (rot) m.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    m.receiveShadow = m.castShadow = true; this.scene.add(m); this._meshes.push(m);
    const R = this.RAPIER, d = R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);
    if (rot) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x || 0, rot.y || 0, rot.z || 0)); d.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }); }
    const body = this.world.createRigidBody(d);
    this.world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(friction), body);
    this._statics.push(body); return body;
  }
  _dynBox({ pos, size, color = 0xff8a1e, mass = 1 }) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), this._mat(color));
    m.castShadow = m.receiveShadow = true; this.scene.add(m); this._meshes.push(m);
    const R = this.RAPIER;
    const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setAdditionalMass(mass));
    this.world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.8).setRestitution(0.1), body);
    this._dyn.push({ mesh: m, body }); return body;
  }
  _dynBall({ pos, r = 0.4, color = 0xffffff }) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), this._mat(color));
    m.castShadow = true; this.scene.add(m); this._meshes.push(m);
    const R = this.RAPIER;
    const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setLinearDamping(0.3));
    this.world.createCollider(R.ColliderDesc.ball(r).setRestitution(0.5).setDensity(0.5), body);
    this._dyn.push({ mesh: m, body }); return body;
  }

  _buildBase() {
    this._static({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: TW, y: 0.4, z: TL }, color: 0xeee7d6 });
    this._static({ pos: { x: 0, y: -0.36, z: 0 }, size: { x: TW + 0.4, y: 0.2, z: TL + 0.4 }, color: 0xb9a98a });
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      this._static({ pos: { x: sx * (TW / 2 - 0.5), y: -1.9, z: sz * (TL / 2 - 0.8) }, size: { x: 0.4, y: 3.4, z: 0.4 }, color: 0x8a7a5c });
  }

  _buildEnv(id) {
    const O = 0xff8a1e;
    if (id === 'box') return;
    if (id === 'sprint') { this._static({ pos: { x: 0, y: 0.02, z: -TL / 2 + 3 }, size: { x: TW, y: 0.04, z: 0.5 }, color: 0x222222 }); return; }
    if (id === 'hurdle') { for (let i = 0; i < 4; i++) this._static({ pos: { x: 0, y: 0.25 + i * 0.12, z: 4 - i * 4 }, size: { x: TW - 0.6, y: 0.5 + i * 0.24, z: 0.3 }, color: O }); return; }
    if (id === 'zigzag') { for (let i = 0; i < 6; i++) this._static({ pos: { x: (i % 2 ? 1 : -1) * 1.6, y: 0.6, z: 6 - i * 2.6 }, size: { x: 0.6, y: 1.2, z: 0.6 }, color: O }); return; }
    if (id === 'slope') { for (let i = 0; i < 3; i++) this._static({ pos: { x: 0, y: 0.3 + i * 0.2, z: 4 - i * 5 }, size: { x: TW, y: 0.4, z: 3.4 }, color: O, rot: { x: -0.2 - i * 0.12 } }); return; }
    if (id === 'step') { for (let i = 0; i < 4; i++) this._static({ pos: { x: 0, y: 0.2 + i * 0.4, z: 2 - i * 1.4 }, size: { x: TW, y: 0.4 + i * 0.8, z: 1.4 }, color: O }); return; }
    if (id === 'strong') { for (let i = 0; i < 3; i++) this._dynBox({ pos: { x: 0, y: 0.6, z: 1 - i * 2 }, size: { x: 1.4, y: 1.2, z: 1.4 }, color: O, mass: 0.6 + i * 0.6 }); this._static({ pos: { x: 0, y: 0.02, z: -TL / 2 + 4 }, size: { x: TW, y: 0.04, z: 0.4 }, color: 0x222222 }); return; }
    if (id === 'shift') { for (let i = 0; i < 6; i++) (i % 2 ? this._dynBall({ pos: { x: (i % 3 - 1) * 1.4, y: 0.5, z: 3 - i * 1.6 }, r: 0.45, color: 0xffd23e }) : this._dynBox({ pos: { x: (i % 3 - 1) * 1.4, y: 0.5, z: 3 - i * 1.6 }, size: { x: 0.9, y: 0.9, z: 0.9 }, color: O, mass: 0.4 })); return; }
    if (id === 'ram') { this._static({ pos: { x: -2, y: 1, z: -1 }, size: { x: 0.6, y: 2, z: 0.6 }, color: 0x8a7a5c }); this._static({ pos: { x: 2, y: 1, z: -1 }, size: { x: 0.6, y: 2, z: 0.6 }, color: 0x8a7a5c }); this._dynBox({ pos: { x: 0, y: 1, z: -1 }, size: { x: 3.4, y: 1.6, z: 0.4 }, color: O, mass: 1.4 }); return; }
    if (id === 'sloppy') { this._seesaw(); return; }
    if (id === 'lap') {
      this._lap = [{ x: -2, z: -TL / 2 + 4 }, { x: 2, z: -TL / 2 + 4 }, { x: 2, z: TL / 2 - 4 }, { x: -2, z: TL / 2 - 4 }];
      this._lapIdx = 0; this._laps = 0; this._lapStart = 0;
      this._lapRings = this._lap.map((p, i) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 20), new THREE.MeshBasicMaterial({ color: 0x3f6fd8, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(p.x, 0.03, p.z); this.scene.add(r); this._meshes.push(r); return r; });
      return;
    }
    if (id === 'blockpush') {
      this._pushBlocks = [];
      for (let i = 0; i < 5; i++) this._pushBlocks.push(this._dynBox({ pos: { x: -2 + i, y: 0.5, z: -2 }, size: { x: 0.9, y: 0.9, z: 0.9 }, color: O, mass: 0.5 }));
      this._pushStart = this._pushBlocks.map(b => b.translation().z);
      return;
    }
    if (id === 'highjump') {
      this._barH = 0.6; this._bar = this._static({ pos: { x: 0, y: this._barH, z: -2 }, size: { x: TW, y: 0.2, z: 0.3 }, color: O });
      return;
    }
  }

  _seesaw() {
    const R = this.RAPIER;
    // fulcrum
    this._static({ pos: { x: 0, y: 0.15, z: 0 }, size: { x: TW - 1, y: 0.3, z: 0.5 }, color: 0x8a7a5c });
    // plank (dynamic) joined by a revolute hinge along X so it tips fore/aft
    const plank = new THREE.Mesh(new THREE.BoxGeometry(TW - 1, 0.2, 7), this._mat(0xff8a1e));
    plank.castShadow = plank.receiveShadow = true; this.scene.add(plank); this._meshes.push(plank);
    const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, 0.5, 0));
    this.world.createCollider(R.ColliderDesc.cuboid((TW - 1) / 2, 0.1, 3.5).setFriction(0.9), body);
    this._dyn.push({ mesh: plank, body });
    const anchor = this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, 0.5, 0));
    this._statics.push(anchor);
    const jd = R.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    this.world.createImpulseJoint(jd, anchor, body, true);
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  _fmt(t) { return t.toFixed(2) + 's'; }
  _buildHud() {
    const hud = document.createElement('div'); hud.className = 'test-hud';
    hud.innerHTML = `
      <button class="back-btn" data-back><img src="./assets/btn-back.png" alt="Back"/></button>
      <div class="test-top">
        <button class="chip" data-env="-1">‹</button>
        <div class="env-name"><b>${ENVIRONMENTS[this._envIdx].name}</b><span>${ENVIRONMENTS[this._envIdx].blurb}</span></div>
        <button class="chip" data-env="1">›</button>
      </div>
      <div class="test-timer">⏱ <span class="t-val">0.00s</span></div>
      <div class="test-tools">
        <button class="chip" data-tool="float"><img class="chip-ic" src="./assets/icon-eye.png" alt=""/>FLOAT</button>
        <button class="chip" data-tool="jump">JUMP</button>
        <button class="chip" data-tool="time">START</button>
        <button class="chip" data-tool="reset">RESET</button>
        <button class="chip" data-tool="passport">PASSPORT</button>
      </div>`;
    this.mount.appendChild(hud); this._hud = hud;
    this._timeEl = hud.querySelector('.t-val');
    hud.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.onBack(); });
    hud.querySelectorAll('[data-env]').forEach(b => b.addEventListener('click', () => { fb.tick(); this._cycleEnv(+b.dataset.env); }));
    hud.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => this._tool(b.dataset.tool)));
    this._syncHud();
  }
  _cycleEnv(d) {
    this._envIdx = (this._envIdx + d + ENVIRONMENTS.length) % ENVIRONMENTS.length;
    const e = this._hud.querySelector('.env-name');
    e.innerHTML = `<b>${ENVIRONMENTS[this._envIdx].name}</b><span>${ENVIRONMENTS[this._envIdx].blurb}</span>`;
    this._reset();
    guide.now(`${ENVIRONMENTS[this._envIdx].name} — ${ENVIRONMENTS[this._envIdx].blurb}.`);
  }
  _tool(t) {
    if (t === 'jump') { fb.press(); this.zook && this.zook.jump(); }
    else if (t === 'float') { this._toggleFloat(); }
    else if (t === 'time') { fb.press(); this._timing = !this._timing; if (this._timing) this._timer = 0; this._syncHud(); }
    else if (t === 'reset') { fb.press(); this._reset(); }
    else if (t === 'passport') { fb.confirm(); this._passport(); }
  }
  _syncHud() {
    if (!this._hud) return;
    this._hud.querySelector('[data-tool=float]').classList.toggle('on', this._float);
    const tb = this._hud.querySelector('[data-tool=time]');
    tb.classList.toggle('on', this._timing); tb.textContent = this._timing ? 'STOP' : 'START';
  }
  _passport() {
    const bp = this.bp, legs = this.zook.bp.legs.length;
    const size = `${bp.len.toFixed(1)} × ${bp.width.toFixed(1)} × ${bp.height.toFixed(1)}`;
    const weight = (bp.len * bp.width * bp.height * 1.1).toFixed(2);
    const old = this.mount.querySelector('.passport'); if (old) { old.remove(); return; }
    let photo = '';
    try { photo = document.getElementById('scene').toDataURL('image/png'); } catch (_) {}
    const card = document.createElement('div'); card.className = 'passport';
    card.innerHTML = `
      <div class="pp-card">
        <h3>PASSPORT</h3>
        ${photo ? `<img class="pp-photo" src="${photo}" alt="snapshot"/>` : ''}
        <div class="pp-row"><span>Size (L×W×H)</span><b>${size}</b></div>
        <div class="pp-row"><span>Weight</span><b>${weight}</b></div>
        <div class="pp-row"><span>Legs</span><b>${legs}</b></div>
        <div class="pp-row"><span>Top speed</span><b>${this._topSpeed.toFixed(2)} m/s</b></div>
        <div class="pp-row"><span>Top jump</span><b>${(this._maxH || 0).toFixed(2)} m</b></div>
        <div class="pp-row"><span>Best sprint</span><b>${this._best.sprint ? this._best.sprint.toFixed(2) + 's' : '—'}</b></div>
        <div class="pp-row"><span>Best lap</span><b>${this._best.lap ? this._best.lap.toFixed(2) + 's' : '—'}</b></div>
        <button class="chip wide" data-close>CLOSE</button>
      </div>`;
    card.querySelector('[data-close]').addEventListener('click', () => { fb.press(); card.remove(); });
    this.mount.appendChild(card);
  }
}
