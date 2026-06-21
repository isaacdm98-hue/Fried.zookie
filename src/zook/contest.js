/**
 * contest.js — the BAMZOOKi Simulator.
 *
 * Two Zooks head-to-head (green = yours, red = rival), performing autonomously
 * exactly as the manual describes. Several of the show's real contests are
 * implemented; each defines an environment and a win condition. A countdown
 * starts the action, then a winner is judged.
 */

import * as THREE from 'three';
import { Zook } from './model.js';
import { setCamera } from '../engine/renderer.js';
import { fb } from '../sys/feedback.js';

/** Contest catalogue (names & blurbs straight from the manual). */
export const CONTESTS = [
  { id: 'sprint',  name: 'Sprint',         desc: 'First Zook to the finish line.',                goal: 'race' },
  { id: 'hurdles', name: 'Zook Hurdles',   desc: 'Over the hurdles and across the line.',         goal: 'race', hurdles: true },
  { id: 'sumo',    name: 'Zook Sumo',      desc: 'Barge your rival out of the ring.',             goal: 'ring', radius: 3.0 },
  { id: 'weakest', name: 'Weakest Zook',   desc: 'Shove the weakest Zook into the pit.',          goal: 'ring', radius: 2.2 },
  { id: 'merry',   name: 'Merry-Go-Zook',  desc: 'Stay on the spinning platform!',                goal: 'merry', radius: 2.8 },
  { id: 'ball',    name: 'Zookball',       desc: 'Boot the ball into the rival goal.',            goal: 'ball' },
  { id: 'marbles', name: 'Zook Marbles',   desc: 'Barge through the marbles to the line.',         goal: 'race', marbles: true },
  { id: 'dodge',   name: 'Dodgy Zook',     desc: 'Slip past the sliding doors.',                  goal: 'race', doors: true },
  { id: 'tag',     name: 'Zook Tag',       desc: 'Catch the rival before time runs out!',         goal: 'tag' },
  { id: 'smash',   name: 'Zook Smash',     desc: 'Smash through the blocks to the line.',          goal: 'race', smash: true },
  { id: 'china',   name: 'China Shop',     desc: 'Knock over more china than your rival!',         goal: 'china' },
];

const GREEN = 0x37c46a, RED = 0xe8466e;
const r3 = (n) => Math.round(n * 100) / 100;

export class ContestScene {
  constructor({ scene, world, RAPIER, camera, onResult }) {
    this.scene = scene; this.world = world; this.RAPIER = RAPIER; this.camera = camera;
    this.onResult = onResult;
    this._meshes = []; this._bodies = []; this._rings = [];
    this.green = null; this.red = null;
    this._t = 0; this._state = 'count'; this._count = 3; this._countT = 0;
    this._ball = null; this._ballMesh = null; this._platform = null; this._doors = []; this._dynamic = [];
    this._rec = []; this._recT = 0;     // motion-player recording
    this._china = []; this._chinaG = 0; this._chinaR = 0;
  }

  getRecording() { return this._rec; }

  enter(contest, greenBp, redBp, opts = {}) {
    this.contest = contest;
    this.remote = !!opts.remote;      // joiner renders streamed state, no sim
    this.tabletop = !!opts.tabletop;  // bird's-eye, camera driven by the app (cross-screen)
    this._remoteCount = null; this._lastState = null;
    this._buildEnv(contest);

    const startZ = contest.goal === 'race' ? 7 : 2.4;
    this.green = this._spawn(greenBp, { x: contest.goal === 'race' ? -1 : -1.4, z: startZ }, GREEN);
    this.red   = this._spawn(redBp,   { x: contest.goal === 'race' ?  1 :  1.4, z: startZ }, RED);
    if (!this.remote && contest.goal === 'merry') { this.green.zook._body.setTranslation({ x: -1, y: 1, z: 0 }, true); this.red.zook._body.setTranslation({ x: 1, y: 1, z: 0 }, true); }
    if (!this.remote && contest.goal === 'tag') { this.green.zook._body.setTranslation({ x: 0, y: 1, z: 4.5 }, true); this.red.zook._body.setTranslation({ x: 0, y: 1, z: -4.5 }, true); }

    this._t = 0; this._state = 'count'; this._count = 3; this._countT = 0;
    fb.count(false);
    setCamera({ x: 6, y: 5, z: 12 }, { x: 0, y: 0, z: 2 }, true);
  }

  exit() {
    for (const e of [this.green, this.red]) if (e) e.zook.dispose();
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    for (const b of this._bodies) { try { this.world.removeRigidBody(b); } catch (_) {} }
    for (const r of this._rings) this.scene.remove(r);
    this._meshes = []; this._bodies = []; this._rings = []; this._doors = []; this._dynamic = [];
    this._china = []; this._chinaG = 0; this._chinaR = 0;
    this.green = this.red = this._ball = this._ballMesh = this._platform = null;
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  onStep(dt) {
    if (this.remote) return;            // joiner: state comes from the host
    if (this._state === 'count') {
      this._countT += dt;
      if (this._countT >= 1) {
        this._countT = 0; this._count--;
        if (this._count < 0) { this._state = 'run'; fb.count(true); }
        else fb.count(false);
      }
      return;
    }
    if (this._state !== 'run') return;
    this._t += dt;

    const g = this.green, r = this.red;
    const drive = (me, foe) => {
      const c = this.contest;
      if (c.goal === 'race')  return { x: me === g ? -1 : 1, z: -40 };
      if (c.goal === 'ring' || c.goal === 'merry') {
        if (c.goal === 'merry') return { x: 0, z: 0 };          // head to centre
        return foe.zook.position;                                // barge the rival
      }
      if (c.goal === 'ball')  return this._ball ? { x: this._ball.translation().x, z: this._ball.translation().z } : { x: 0, z: -10 };
      if (c.goal === 'tag') {
        if (me === g) return foe.zook.position;                  // green chases
        const rp = me.zook.position, gp = foe.zook.position;     // red flees
        return { x: rp.x + (rp.x - gp.x) * 3, z: rp.z + (rp.z - gp.z) * 3 };
      }
      if (c.goal === 'china') {                                  // head for the nearest standing cup
        const mp = me.zook.position; let best = null, bd = 1e9;
        for (const k of this._china) { if (k.owner) continue; const t = k.body.translation(); const d = Math.hypot(t.x - mp.x, t.z - mp.z); if (d < bd) { bd = d; best = t; } }
        return best ? { x: best.x, z: best.z } : { x: 0, z: 0 };
      }
      return { x: 0, z: -10 };
    };
    g.zook.step(dt, { walk: true, target: drive(g, r) });
    r.zook.step(dt, { walk: true, target: drive(r, g) });

    // Sliding doors (Dodgy Zook) oscillate across the lane.
    for (const d of this._doors) {
      const x = Math.sin(this._t * d.spd + d.phase) * d.amp;
      d.body.setNextKinematicTranslation({ x, y: d.y, z: d.z });
    }
    if (this._platform) this._spinPlatform(dt);
    // China Shop: a knocked-over cup is credited to the nearer Zook.
    if (this.contest.goal === 'china') {
      for (const k of this._china) {
        if (k.owner) continue;
        const t = k.body.translation();
        if (t.y < 0.25 || Math.hypot(t.x - k.start.x, t.z - k.start.z) > 1.2) {
          const gp = g.zook.position, rp = r.zook.position;
          k.owner = Math.hypot(t.x - gp.x, t.z - gp.z) <= Math.hypot(t.x - rp.x, t.z - rp.z) ? 'g' : 'r';
          if (k.owner === 'g') this._chinaG++; else this._chinaR++;
          fb.thud();
        }
      }
    }
    this._judge();
  }

  update(dt = 1 / 60) {
    if (this.remote) {
      const s = this._lastState;
      for (const [e, d] of [[this.green, s && s.g], [this.red, s && s.r]]) {
        if (!e) continue;
        e.zook.step(dt, { walk: true });                 // animate legs only (preview)
        if (d) { e.zook.group.position.set(d[0], d[1], d[2]); e.zook.group.quaternion.set(d[3], d[4], d[5], d[6]); }
        this._followRing(e);
      }
      this._frameCamera();
      return;
    }
    for (const e of [this.green, this.red]) if (e) { e.zook.syncMeshes(); this._followRing(e); }
    // Record frames (~20Hz) for the Motion Player.
    this._recT += dt;
    if (this._recT >= 0.05 && this._rec.length < 1600) { this._recT = 0; this._rec.push(this.serializeState()); }
    if (this._ball && this._ballMesh) {
      const t = this._ball.translation(); this._ballMesh.position.set(t.x, t.y, t.z);
    }
    for (const d of this._doors) { const t = d.body.translation(); d.mesh.position.set(t.x, t.y, t.z); }
    for (const o of this._dynamic) { const t = o.body.translation(), r = o.body.rotation(); o.mesh.position.set(t.x, t.y, t.z); o.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
    this._frameCamera();
  }

  // Broadcast camera that frames BOTH Zooks — pulls back as they separate.
  _frameCamera() {
    if (this.tabletop) return;        // app drives the top-down ortho camera
    if (!this.green || !this.red) return;
    const a = this.green.zook.position, b = this.red.zook.position;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const dist = Math.hypot(a.x - b.x, a.z - b.z);
    const back = Math.min(20, 8 + dist * 0.7);
    setCamera({ x: mx + back * 0.45, y: back * 0.6, z: mz + back }, { x: mx, y: 0.4, z: mz });
  }

  // ── networking (host streams these; joiner applies) ───────────────────────
  serializeState() {
    const t = (e) => { const p = e.zook.group.position, q = e.zook.group.quaternion;
      return [r3(p.x), r3(p.y), r3(p.z), r3(q.x), r3(q.y), r3(q.z), r3(q.w)]; };
    return { g: t(this.green), r: t(this.red), c: this.countLabel };
  }
  applyState(s) { this._lastState = s; this._remoteCount = s.c; }

  // ── judging ──────────────────────────────────────────────────────────────
  _finish(playerWon, line) {
    if (this._state === 'done') return;
    this._state = 'done';
    playerWon ? fb.win() : fb.lose();
    if (this.onResult) this.onResult({ playerWon, line });
  }

  _judge() {
    const c = this.contest, g = this.green.zook.position, r = this.red.zook.position;
    if (c.goal === 'race') {
      if (g.z <= -18) return this._finish(true,  'Your Zook takes the win!');
      if (r.z <= -18) return this._finish(false, 'The rival pips you to it!');
    } else if (c.goal === 'ring' || c.goal === 'merry') {
      const R = c.radius, go = Math.hypot(g.x, g.z) > R || g.y < -1;
      const ro = Math.hypot(r.x, r.z) > R || r.y < -1;
      if (ro && !go) return this._finish(true,  'Rival out — you win!');
      if (go && !ro) return this._finish(false, 'You went out! Rival wins.');
      if (go && ro)  return this._finish(false, 'Both out — rival wins on the tiebreak.');
    } else if (c.goal === 'ball' && this._ball) {
      const z = this._ball.translation().z;
      if (z < -9)  return this._finish(true,  'GOAL! You score!');
      if (z >  9)  return this._finish(false, 'Own goal! Rival scores.');
    } else if (c.goal === 'tag') {
      if (Math.hypot(g.x - r.x, g.z - r.z) < 1.4) return this._finish(true, 'Tagged! You caught it!');
      if (this._t > 20) return this._finish(false, 'Time up — it got away!');
    } else if (c.goal === 'china') {
      if (this._chinaG + this._chinaR >= this._china.length || this._t > 25) {
        const win = this._chinaG >= this._chinaR;
        return this._finish(win, win ? `You smashed ${this._chinaG} to ${this._chinaR}!` : `Rival smashed ${this._chinaR} to ${this._chinaG}.`);
      }
    }
    // time limit
    if (this._t > 30) {
      if (c.goal === 'race') return this._finish(g.z < r.z, g.z < r.z ? 'You were ahead at time!' : 'Rival was ahead.');
      const gc = Math.hypot(g.x, g.z), rc = Math.hypot(r.x, r.z);
      return this._finish(gc < rc, gc < rc ? 'You held the centre!' : 'Rival held the centre.');
    }
  }

  // ── build ────────────────────────────────────────────────────────────────
  _spawn(bp, pos, color) {
    const zook = this.remote
      ? new Zook(bp, { scene: this.scene, preview: true, pos })
      : new Zook(bp, { scene: this.scene, world: this.world, RAPIER: this.RAPIER, pos });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; this.scene.add(ring); this._rings.push(ring);
    return { zook, ring };
  }
  _followRing(e) { const p = e.zook.position; e.ring.position.set(p.x, 0.04, p.z); }

  _box({ pos, size, color, rot, sensor }) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
    m.position.set(pos.x, pos.y, pos.z); if (rot) m.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    m.receiveShadow = m.castShadow = true; this.scene.add(m); this._meshes.push(m);
    const R = this.RAPIER, d = R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);
    if (rot) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x || 0, rot.y || 0, rot.z || 0)); d.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }); }
    const b = this.world.createRigidBody(d);
    this.world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.9).setSensor(!!sensor), b);
    this._bodies.push(b); return m;
  }

  _buildEnv(c) {
    if (c.goal === 'race') {
      this._box({ pos: { x: 0, y: -0.2, z: -6 }, size: { x: 7, y: 0.4, z: 32 }, color: 0xeee7d6 });
      // finish line
      this._box({ pos: { x: 0, y: 0.01, z: -18 }, size: { x: 7, y: 0.02, z: 0.4 }, color: 0x222222 });
      if (c.hurdles) for (const z of [-2, -7, -12]) this._box({ pos: { x: 0, y: 0.25, z }, size: { x: 6, y: 0.5, z: 0.4 }, color: 0xff8a1e });
      if (c.marbles) this._marbles();
      if (c.doors) this._slidingDoors();
      if (c.smash) for (const z of [-1, -6, -11]) for (let i = 0; i < 4; i++)
        this._dynBox({ pos: { x: -2.4 + i * 1.6, y: 0.5 + Math.random() * 0.1, z }, size: { x: 1.3, y: 1.0, z: 1.0 }, color: 0xff8a1e, mass: 0.5 });
    } else if (c.goal === 'tag') {
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 13, y: 0.4, z: 13 }, color: 0xeee7d6 });
    } else if (c.goal === 'china') {
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 12, y: 0.4, z: 12 }, color: 0xeee7d6 });
      this._china = [];
      for (let i = 0; i < 16; i++) {
        const x = (Math.random() - 0.5) * 8, z = (Math.random() - 0.5) * 8;
        const b = this._dynBox({ pos: { x, y: 0.45, z }, size: { x: 0.6, y: 0.9, z: 0.6 }, color: 0xdfeaf2, mass: 0.15 });
        this._china.push({ body: b, start: { x, z }, owner: null });
      }
    } else if (c.goal === 'ring' || c.goal === 'merry') {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(c.radius, c.radius + 0.2, 0.4, 40),
        new THREE.MeshStandardMaterial({ color: c.goal === 'merry' ? 0xf0782d : 0xeee7d6, roughness: 0.7 }));
      disc.position.y = -0.2; disc.receiveShadow = true; this.scene.add(disc); this._meshes.push(disc);
      const R = this.RAPIER, d = R.RigidBodyDesc.fixed().setTranslation(0, -0.2, 0);
      const b = this.world.createRigidBody(d);
      this.world.createCollider(R.ColliderDesc.cylinder(0.2, c.radius).setFriction(1.0), b);
      this._bodies.push(b);
      if (c.goal === 'merry') this._platform = b;
    } else if (c.goal === 'ball') {
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 8, y: 0.4, z: 22 }, color: 0xeee7d6 });
      for (const z of [-10, 10]) this._box({ pos: { x: 0, y: 1, z }, size: { x: 4, y: 2, z: 0.2 }, color: z < 0 ? GREEN : RED });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      ball.position.set(0, 0.35, 0); ball.castShadow = true; this.scene.add(ball); this._meshes.push(ball);
      const R = this.RAPIER, bd = R.RigidBodyDesc.dynamic().setTranslation(0, 0.35, 0).setLinearDamping(0.4);
      this._ball = this.world.createRigidBody(bd);
      this.world.createCollider(R.ColliderDesc.ball(0.35).setRestitution(0.5).setDensity(0.4), this._ball);
      this._bodies.push(this._ball); this._ballMesh = ball;
    }
  }

  _dynBox({ pos, size, color = 0xff8a1e, mass = 0.5 }) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    m.castShadow = m.receiveShadow = true; this.scene.add(m); this._meshes.push(m);
    const R = this.RAPIER;
    const b = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setAdditionalMass(mass));
    this.world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(0.7).setRestitution(0.1), b);
    this._dynamic.push({ mesh: m, body: b }); this._bodies.push(b); return b;
  }

  _marbles() {
    const R = this.RAPIER;
    for (let i = 0; i < 22; i++) {
      const x = (Math.random() - 0.5) * 5.5, z = -2 - Math.random() * 11, r = 0.3 + Math.random() * 0.2;
      const hue = Math.random();
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.7, 0.55), roughness: 0.35 }));
      mesh.castShadow = true; this.scene.add(mesh); this._meshes.push(mesh);
      const b = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x, r + 0.05, z).setLinearDamping(0.2));
      this.world.createCollider(R.ColliderDesc.ball(r).setRestitution(0.45).setDensity(0.25), b);
      this._bodies.push(b); this._dynamic.push({ mesh, body: b });
    }
  }

  _slidingDoors() {
    const R = this.RAPIER;
    const rows = [-2, -7, -12];
    rows.forEach((z, i) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xe8466e, roughness: 0.6 }));
      mesh.castShadow = mesh.receiveShadow = true; this.scene.add(mesh); this._meshes.push(mesh);
      const body = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.7, z));
      this.world.createCollider(R.ColliderDesc.cuboid(1.5, 0.7, 0.2), body);
      this._bodies.push(body);
      this._doors.push({ body, mesh, y: 0.7, z, amp: 2.0, spd: 1.6 + i * 0.4, phase: i * 1.3 });
    });
  }

  _spinPlatform(dt) {
    // Drift the Zooks tangentially to mimic a rotating platform.
    for (const e of [this.green, this.red]) {
      const p = e.zook.position;
      e.zook._body.applyImpulse({ x: -p.z * 0.15 * dt, y: 0, z: p.x * 0.15 * dt }, true);
    }
  }

  get countLabel() {
    if (this.remote) return this._remoteCount;
    if (this._state === 'count') return this._count <= 0 ? 'GO!' : String(this._count);
    return null;
  }
}
