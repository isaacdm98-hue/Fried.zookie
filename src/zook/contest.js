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
];

const GREEN = 0x37c46a, RED = 0xe8466e;

export class ContestScene {
  constructor({ scene, world, RAPIER, camera, onResult }) {
    this.scene = scene; this.world = world; this.RAPIER = RAPIER; this.camera = camera;
    this.onResult = onResult;
    this._meshes = []; this._bodies = []; this._rings = [];
    this.green = null; this.red = null;
    this._t = 0; this._state = 'count'; this._count = 3; this._countT = 0;
    this._ball = null; this._ballMesh = null; this._platform = null; this._doors = []; this._dynamic = [];
  }

  enter(contest, greenBp, redBp) {
    this.contest = contest;
    this._buildEnv(contest);

    const startZ = contest.goal === 'race' ? 7 : 2.4;
    this.green = this._spawn(greenBp, { x: contest.goal === 'race' ? -1 : -1.4, z: startZ }, GREEN);
    this.red   = this._spawn(redBp,   { x: contest.goal === 'race' ?  1 :  1.4, z: startZ }, RED);
    if (contest.goal === 'merry') { this.green.zook._body.setTranslation({ x: -1, y: 1, z: 0 }, true); this.red.zook._body.setTranslation({ x: 1, y: 1, z: 0 }, true); }
    if (contest.goal === 'tag') { this.green.zook._body.setTranslation({ x: 0, y: 1, z: 4.5 }, true); this.red.zook._body.setTranslation({ x: 0, y: 1, z: -4.5 }, true); }

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
    this.green = this.red = this._ball = this._ballMesh = this._platform = null;
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  onStep(dt) {
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
    this._judge();
  }

  update() {
    for (const e of [this.green, this.red]) if (e) { e.zook.syncMeshes(); this._followRing(e); }
    if (this._ball && this._ballMesh) {
      const t = this._ball.translation(); this._ballMesh.position.set(t.x, t.y, t.z);
    }
    for (const d of this._doors) { const t = d.body.translation(); d.mesh.position.set(t.x, t.y, t.z); }
    for (const o of this._dynamic) { const t = o.body.translation(), r = o.body.rotation(); o.mesh.position.set(t.x, t.y, t.z); o.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
    // Camera frames the midpoint of the two Zooks.
    if (this.green && this.red) {
      const a = this.green.zook.position, b = this.red.zook.position;
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      setCamera({ x: mx + 5, y: 5, z: mz + 9 }, { x: mx, y: 0.3, z: mz });
    }
  }

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
    const zook = new Zook(bp, { scene: this.scene, world: this.world, RAPIER: this.RAPIER, pos });
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
    } else if (c.goal === 'tag') {
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 13, y: 0.4, z: 13 }, color: 0xeee7d6 });
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
    if (this._state === 'count') return this._count <= 0 ? 'GO!' : String(this._count);
    return null;
  }
}
