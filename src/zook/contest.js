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
  { id: 'sumo',    name: 'Zook Sumo',      desc: 'Barge your rival out of the ring.',             goal: 'ring', radius: 3.8 },
  { id: 'weakest', name: 'Weakest Zook',   desc: 'Tug-of-war — drag your rival into the pit!',    goal: 'tug' },
  { id: 'merry',   name: 'Merry-Go-Zook',  desc: 'Stay on the spinning platform!',                goal: 'merry', radius: 3.6 },
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
    // Weakest Zook = tug-of-war: stand them apart on the two halves and tether
    // them together (a rope joint), so the stronger walker drags the weaker in.
    if (!this.remote && contest.goal === 'tug') {
      this.green.zook._body.setTranslation({ x: -5, y: 1, z: 0 }, true);
      this.red.zook._body.setTranslation({ x: 5, y: 1, z: 0 }, true);
      const R = this.RAPIER;
      const jd = R.JointData.rope(9.5, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
      this._tether = this.world.createImpulseJoint(jd, this.green.zook._body, this.red.zook._body, true);
    }

    this._t = 0; this._state = 'count'; this._count = 3; this._countT = 0;
    fb.count(false);
    setCamera({ x: 6, y: 5, z: 12 }, { x: 0, y: 0, z: 2 }, true);
    // Tap the arena (the 3D canvas) to cycle camera angle: broadcast/low/top.
    this._camMode = 0;
    this._onCamTap = (e) => { if (!this.tabletop && e.target && e.target.id === 'scene') { this._camMode = (this._camMode + 1) % 3; fb.tick(); } };
    window.addEventListener('pointerdown', this._onCamTap);
  }

  exit() {
    if (this._onCamTap) { window.removeEventListener('pointerdown', this._onCamTap); this._onCamTap = null; }
    if (this._tether) { try { this.world.removeImpulseJoint(this._tether, true); } catch (_) {} this._tether = null; }
    for (const e of [this.green, this.red]) if (e) e.zook.dispose();
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    for (const b of this._bodies) { try { this.world.removeRigidBody(b); } catch (_) {} }
    for (const r of this._rings) this.scene.remove(r);
    if (this._shards) for (const sh of this._shards) { this.scene.remove(sh.mesh); sh.mesh.geometry?.dispose?.(); sh.mesh.material?.dispose?.(); }
    this._meshes = []; this._bodies = []; this._rings = []; this._doors = []; this._dynamic = []; this._shards = [];
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
      if (c.goal === 'tug')   return { x: me === g ? -40 : 40, z: 0 };   // each hauls toward its own end
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
    // China Shop: a cup knocked off its plinth is credited to the nearer Zook,
    // then SMASHES on the floor in a burst of shards.
    if (this.contest.goal === 'china') {
      for (const k of this._china) {
        if (k.smashed) continue;
        const t = k.body.translation();
        const fellOff = t.y < k.top + 0.15 || Math.hypot(t.x - k.start.x, t.z - k.start.z) > 0.9;
        if (fellOff) {
          const gp = g.zook.position, rp = r.zook.position;
          k.owner = Math.hypot(t.x - gp.x, t.z - gp.z) <= Math.hypot(t.x - rp.x, t.z - rp.z) ? 'g' : 'r';
          if (k.owner === 'g') this._chinaG++; else this._chinaR++;
          k.smashed = true;
          this._smashCup(k);
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
    // Victory dance — the winner faces the camera and busts daft, tongue-in-cheek
    // moves under the WINNER card: butt-in-the-air waggle, hops, a spin, a shimmy.
    if (this._victor && this._victor.zook) {
      this._danceT = (this._danceT || 0) + dt;
      const t = this._danceT, g = this._victor.zook.group, rest = this._victor.zook.dims.rest, p = this._victor.zook.position;
      const seg = (t * 0.7) % 4;
      let rx = 0, ry = Math.PI, rz = 0, hop = 0;
      if (seg < 1)      { rx = 0.9; ry = Math.PI + Math.sin(t * 12) * 0.6; }              // 🍑 butt in the air, waggling
      else if (seg < 2) { hop = Math.abs(Math.sin(t * 10)) * 0.6; }                        // bouncy hops
      else if (seg < 3) { ry = Math.PI + (seg - 2) * Math.PI * 2; hop = 0.15; }            // victory spin
      else              { rz = Math.sin(t * 11) * 0.34; hop = Math.abs(Math.sin(t * 7)) * 0.18; } // shimmy
      g.position.set(p.x, rest + hop, p.z);
      g.rotation.set(rx, ry, rz);
      g.scale.set(1, 1 + Math.sin(t * 5) * 0.06, 1);
    }
    // Record frames (~20Hz) for the Motion Player.
    this._recT += dt;
    if (this._recT >= 0.05 && this._rec.length < 1600) { this._recT = 0; this._rec.push(this.serializeState()); }
    if (this._ball && this._ballMesh) {
      const t = this._ball.translation(); this._ballMesh.position.set(t.x, t.y, t.z);
    }
    for (const d of this._doors) { const t = d.body.translation(); d.mesh.position.set(t.x, t.y, t.z); }
    for (const o of this._dynamic) { const t = o.body.translation(), r = o.body.rotation(); o.mesh.position.set(t.x, t.y, t.z); o.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
    this._stepShards(dt);
    this._frameCamera();
  }

  // Camera that frames BOTH Zooks. Tap the arena to cycle broadcast / low / top.
  _frameCamera() {
    if (this.tabletop) return;        // app drives the top-down ortho camera
    // On a win, push in on the dancing champion (lower third, under the card).
    if (this._victor && this._victor.zook) {
      const p = this._victor.zook.position;
      setCamera({ x: p.x, y: 2.0, z: p.z + 4.3 }, { x: p.x, y: 0.7, z: p.z });
      return;
    }
    if (!this.green || !this.red) return;
    const a = this.green.zook.position, b = this.red.zook.position;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const dist = Math.hypot(a.x - b.x, a.z - b.z);
    const back = Math.min(22, 8 + dist * 0.7);
    const m = this._camMode || 0;
    if (m === 1) setCamera({ x: mx + back * 0.9, y: back * 0.28, z: mz + back * 0.5 }, { x: mx, y: 0.5, z: mz });      // low, side-on
    else if (m === 2) setCamera({ x: mx + 0.01, y: back * 1.4, z: mz + 0.1 }, { x: mx, y: 0, z: mz });                 // top-down
    else setCamera({ x: mx + back * 0.45, y: back * 0.6, z: mz + back }, { x: mx, y: 0.4, z: mz });                    // broadcast
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
    this._victor = playerWon ? this.green : this.red; this._danceT = 0;   // victory dance
    playerWon ? fb.win() : fb.lose();
    if (this.onResult) this.onResult({ playerWon, line });
  }

  _judge() {
    const c = this.contest, g = this.green.zook.position, r = this.red.zook.position;
    if (c.goal === 'race') {
      if (g.z <= -18) return this._finish(true,  'Across the line — get in! 🏁');
      if (r.z <= -18) return this._finish(false, 'Pipped at the post. Gutting.');
    } else if (c.goal === 'ring' || c.goal === 'merry') {
      const R = c.radius, go = Math.hypot(g.x, g.z) > R || g.y < -1;
      const ro = Math.hypot(r.x, r.z) > R || r.y < -1;
      if (ro && !go) return this._finish(true,  'Rival yeeted off the edge — you win!');
      if (go && !ro) return this._finish(false, 'And off you go! Rival wins.');
      if (go && ro)  return this._finish(false, 'Both off! Rival wins the tiebreak.');
    } else if (c.goal === 'ball' && this._ball) {
      const z = this._ball.translation().z;
      if (z < -9)  return this._finish(true,  'GOOOAL! Back of the net! ⚽');
      if (z >  9)  return this._finish(false, 'Oof — own goal. Classic.');
    } else if (c.goal === 'tag') {
      if (Math.hypot(g.x - r.x, g.z - r.z) < 1.4) return this._finish(true, 'Gotcha! Tagged it!');
      if (this._t > 20) return this._finish(false, 'Time up — slippery little thing!');
    } else if (c.goal === 'china') {
      if (this._chinaG + this._chinaR >= this._china.length || this._t > 25) {
        const win = this._chinaG >= this._chinaR;
        return this._finish(win, win ? `SMASH! ${this._chinaG} to ${this._chinaR} — a bull in a china shop!` : `Rival went full demolition: ${this._chinaR} to ${this._chinaG}.`);
      }
    } else if (c.goal === 'tug') {
      if (g.y < -1) return this._finish(false, 'Hauled into the pit! Rival had the muscle.');
      if (r.y < -1) return this._finish(true,  'HEAVE! You dragged the rival into the pit!');
    }
    // time limit
    if (this._t > 30) {
      if (c.goal === 'race') return this._finish(g.z < r.z, g.z < r.z ? 'Ahead when the whistle blew — win!' : 'Behind at the whistle. So close.');
      if (c.goal === 'tug') { const win = Math.abs(g.x) >= Math.abs(r.x); return this._finish(win, win ? 'You held your ground — strongest Zook!' : 'Rival out-muscled you. Beef it up!'); }
      const gc = Math.hypot(g.x, g.z), rc = Math.hypot(r.x, r.z);
      return this._finish(gc < rc, gc < rc ? 'You held the centre — champion!' : 'Rival held the middle. Tune it up!');
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
    if (c.goal === 'tug') {
      // Tug-of-war table: two halves split by a central PIT, a coloured "home"
      // wall behind each Zook (matches the Zook Kit's Weakest Zook layout).
      for (const s of [-1, 1]) this._box({ pos: { x: s * 7, y: -0.2, z: 0 }, size: { x: 8, y: 0.4, z: 6 }, color: 0xcfc7b4 });
      this._box({ pos: { x: -11.4, y: 0.6, z: 0 }, size: { x: 0.6, y: 2, z: 6 }, color: GREEN });   // green's home wall
      this._box({ pos: { x:  11.4, y: 0.6, z: 0 }, size: { x: 0.6, y: 2, z: 6 }, color: RED });      // red's home wall
      this._box({ pos: { x: 0, y: -2.6, z: 0 }, size: { x: 22, y: 0.4, z: 8 }, color: 0x6b6457 });   // pit floor below the gap
      return;
    }
    if (c.goal === 'race') {
      this._box({ pos: { x: 0, y: -0.2, z: -6 }, size: { x: 9, y: 0.4, z: 32 }, color: 0xeee7d6 });
      // finish line
      this._box({ pos: { x: 0, y: 0.01, z: -18 }, size: { x: 7, y: 0.02, z: 0.4 }, color: 0x222222 });
      if (c.hurdles) for (const z of [-2, -7, -12]) this._box({ pos: { x: 0, y: 0.25, z }, size: { x: 6, y: 0.5, z: 0.4 }, color: 0xff8a1e });
      if (c.marbles) this._marbles();
      if (c.doors) this._slidingDoors();
      if (c.smash) for (const z of [-1, -6, -11]) for (let i = 0; i < 4; i++)
        this._dynBox({ pos: { x: -2.4 + i * 1.6, y: 0.5 + Math.random() * 0.1, z }, size: { x: 1.3, y: 1.0, z: 1.0 }, color: 0xff8a1e, mass: 0.5 });
    } else if (c.goal === 'tag') {
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 16, y: 0.4, z: 16 }, color: 0xeee7d6 });
    } else if (c.goal === 'china') {
      // A china shop: cups perch on little display plinths. Bump a plinth and the
      // cup topples off, falls, and SMASHES on the floor in a burst of shards.
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 15, y: 0.4, z: 15 }, color: 0xe7ddc8 });
      this._china = []; this._shards = [];
      const CHINA = [0xdfeaf2, 0xf2dfe6, 0xe2f2df, 0xf2ecdf, 0xdfe6f2];
      const plinthTop = 0.55;
      for (let i = 0; i < 16; i++) {
        const x = (Math.random() - 0.5) * 9, z = (Math.random() - 0.5) * 9;
        // the plinth (fixed display stand)
        this._box({ pos: { x, y: plinthTop / 2 - 0.05, z }, size: { x: 0.5, y: plinthTop, z: 0.5 }, color: 0xb9a98a });
        // the cup, resting on top
        const cy = plinthTop + 0.3;
        const col = CHINA[i % CHINA.length];
        this._dynBox({ pos: { x, y: cy, z }, size: { x: 0.45, y: 0.6, z: 0.45 }, color: col, mass: 0.1 });
        const entry = this._dynamic[this._dynamic.length - 1];
        this._china.push({ body: entry.body, mesh: entry.mesh, entry, start: { x, z }, top: plinthTop, color: col, owner: null, smashed: false });
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
      this._box({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: 11, y: 0.4, z: 22 }, color: 0xeee7d6 });
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

  // Remove a toppled cup and replace it with a short-lived burst of shards.
  _smashCup(k) {
    const t = k.body.translation();
    const x = t.x, y = Math.max(0.15, t.y), z = t.z;
    // drop the physics cup and its mesh
    const idx = this._dynamic.indexOf(k.entry);
    if (idx >= 0) this._dynamic.splice(idx, 1);
    try { this.world.removeRigidBody(k.body); } catch (e) {}
    this.scene.remove(k.mesh);
    const mi = this._meshes.indexOf(k.mesh); if (mi >= 0) this._meshes.splice(mi, 1);
    k.mesh.geometry.dispose(); k.mesh.material.dispose();
    // shards
    if (!this._shards) this._shards = [];
    for (let i = 0; i < 9; i++) {
      const s = 0.07 + Math.random() * 0.1;
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(s),
        new THREE.MeshStandardMaterial({ color: k.color, roughness: 0.6, flatShading: true }));
      m.position.set(x, y, z); m.castShadow = true; this.scene.add(m);
      const a = Math.random() * Math.PI * 2, sp = 1.4 + Math.random() * 2.4;
      this._shards.push({ mesh: m, life: 0.9 + Math.random() * 0.4,
        vel: { x: Math.cos(a) * sp, y: 1.6 + Math.random() * 2.2, z: Math.sin(a) * sp },
        spin: { x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 14, z: (Math.random() - 0.5) * 14 } });
    }
    fb.thud();
  }

  _stepShards(dt) {
    if (!this._shards || !this._shards.length) return;
    for (let i = this._shards.length - 1; i >= 0; i--) {
      const sh = this._shards[i];
      sh.life -= dt; sh.vel.y -= 12 * dt;
      const p = sh.mesh.position;
      p.x += sh.vel.x * dt; p.y += sh.vel.y * dt; p.z += sh.vel.z * dt;
      if (p.y < 0.06) { p.y = 0.06; sh.vel.y *= -0.35; sh.vel.x *= 0.6; sh.vel.z *= 0.6; }
      sh.mesh.rotation.x += sh.spin.x * dt; sh.mesh.rotation.z += sh.spin.z * dt;
      sh.mesh.scale.setScalar(Math.max(0.02, Math.min(1, sh.life * 1.4)));
      if (sh.life <= 0) {
        this.scene.remove(sh.mesh); sh.mesh.geometry.dispose(); sh.mesh.material.dispose();
        this._shards.splice(i, 1);
      }
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
    if (this.remote) return this._remoteCount;
    if (this._state === 'count') return this._count <= 0 ? 'GO!' : String(this._count);
    return null;
  }
}
