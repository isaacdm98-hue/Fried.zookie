/**
 * run.js — ZOOK RUN: a Super-Monkey-Ball-style tilt racer.
 *
 * Your Zook auto-runs down a WINDING ribbon of a track seen from a chase camera.
 * TILT to steer left/right and lean forward to accelerate / back to brake. The
 * track snakes left and right, narrows, and is strewn with obstacles (cones and
 * blocks) you must steer AROUND — clip one and you bog down; stray off the ribbon
 * and you slow to a crawl. Grab the floating pips for a speed boost and points.
 * Same seed → identical track for both players, so online races are fair.
 */

import * as THREE from 'three';
import { Zook } from './model.js';
import { setCamera } from '../engine/renderer.js';
import { fb } from '../sys/feedback.js';
import { guide } from '../sys/guide.js';

const LANE = 3.4;             // half-width of the ribbon
const FINISH = 200;           // track length (world units)
const SEG = 2.2;              // track segment spacing

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class ZookRun {
  constructor({ scene, camera, canvas, mount, bp, seed = 1, onExit, onFinish, vsName }) {
    Object.assign(this, { scene, camera, canvas, mount, bp, seed, onExit, onFinish, vsName });
    this.dist = 0; this.speed = 8; this.x = 0; this.tilt = { lr: 0, fb: 0 }; this._padLR = 0;
    this.score = 0; this.done = false; this.t = 0; this._meshes = [];
    this._obstacles = []; this._pips = []; this._offT = 0; this._camX = 0;
    this._onTilt = this._onTilt.bind(this);
    // Winding centreline of the ribbon, as a function of distance travelled.
    const rnd = mulberry32(seed);
    const a1 = 2.2 + rnd() * 2.0, a2 = 3.0 + rnd() * 2.5;
    const f1 = 0.05 + rnd() * 0.02, f2 = 0.018 + rnd() * 0.01, p1 = rnd() * 6, p2 = rnd() * 6;
    this.path = (d) => Math.sin(d * f1 + p1) * a1 + Math.sin(d * f2 + p2) * a2;
    this._rnd = rnd;
  }

  enter() {
    // Build the winding ribbon out of short segments + edge rails.
    const railL = new THREE.MeshStandardMaterial({ color: 0xff8a1e, roughness: 0.6 });
    for (let d = -2; d < FINISH + 4; d += SEG) {
      const cx = this.path(d), nx = this.path(d + SEG);
      const ang = Math.atan2(nx - cx, SEG);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2, 0.4, SEG + 0.3),
        new THREE.MeshStandardMaterial({ color: (Math.floor(d / SEG) % 2) ? 0xeee7d6 : 0xe6dcc4, roughness: 0.85 }));
      seg.position.set(cx, -0.2, -d); seg.rotation.y = ang; seg.receiveShadow = true;
      this.scene.add(seg); this._meshes.push(seg);
      // edge rails
      for (const s of [-1, 1]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, SEG + 0.3), railL);
        r.position.set(cx + s * LANE, 0.0, -d); r.rotation.y = ang; this.scene.add(r); this._meshes.push(r);
      }
    }
    // Obstacles + pips, spaced from the seed, offset to one side of the centre.
    const rnd = this._rnd;
    for (let d = 16; d < FINISH - 6; d += 6 + rnd() * 6) {
      const side = rnd() < 0.5 ? -1 : 1;
      const off = side * (0.6 + rnd() * (LANE - 1.0));
      const cx = this.path(d) + off;
      if (rnd() < 0.7) this._cone(cx, -d); else this._block(cx, -d, 1.2 + rnd() * 1.2);
      // a pip on the opposite (safe) side
      if (rnd() < 0.6) this._pip(this.path(d) - off * 0.8, -d - 2);
    }

    this.zook = new Zook(this.bp, { scene: this.scene, preview: true, pos: { x: 0, z: 0 } });
    // Finish line.
    const fx = this.path(FINISH);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2, 0.06, 0.6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    fin.position.set(fx, 0.03, -FINISH); this.scene.add(fin); this._meshes.push(fin);

    setCamera({ x: 0, y: 6.5, z: 9 }, { x: 0, y: 0, z: -6 }, true);
    this._buildHud();
    window.addEventListener('deviceorientation', this._onTilt);
    guide.now('Tilt to steer round the cones and off the edges — lean forward to GO, back to brake. Grab the pips!');
  }

  exit() {
    window.removeEventListener('deviceorientation', this._onTilt);
    if (this.zook) this.zook.dispose();
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    this._meshes = []; if (this._hud) this._hud.remove();
  }

  _cone(x, z) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 12),
      new THREE.MeshStandardMaterial({ color: 0xff5a3c, roughness: 0.6, flatShading: true }));
    m.position.set(x, 0.5, z); m.castShadow = true; this.scene.add(m); this._meshes.push(m);
    this._obstacles.push({ x, z, r: 0.7, mesh: m });
  }
  _block(x, z, w) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6b5b8a, roughness: 0.7 }));
    m.position.set(x, 0.45, z); m.castShadow = true; this.scene.add(m); this._meshes.push(m);
    this._obstacles.push({ x, z, r: w / 2 + 0.4, mesh: m });
  }
  _pip(x, z) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({ color: 0x33d6a6, roughness: 0.3, emissive: 0x0a3, emissiveIntensity: 0.3 }));
    m.position.set(x, 0.7, z); this.scene.add(m); this._meshes.push(m);
    this._pips.push({ x, z, got: false, mesh: m });
  }

  // ── input ──────────────────────────────────────────────────────────────────
  _onTilt(e) {
    if (e.gamma != null) this.tilt.lr = Math.max(-1, Math.min(1, e.gamma / 28));
    if (e.beta != null) this.tilt.fb = Math.max(-1, Math.min(1, (e.beta - 45) / 28));
  }

  // ── loop ──────────────────────────────────────────────────────────────────
  update(dt) {
    if (!this.zook) return;
    this.t += dt;
    const steer = Math.max(-1, Math.min(1, this.tilt.lr + this._padLR));
    if (!this.done) {
      // accelerate/brake from forward lean (and pads default to rolling).
      const target = 8 + Math.max(0, -this.tilt.fb) * 12 - Math.max(0, this.tilt.fb) * 5;
      this.speed += (target - this.speed) * Math.min(1, dt * 1.4);

      // steer — authority scales a little with speed (Monkey Ball roll).
      this.x += steer * dt * (5 + this.speed * 0.25);

      // off the ribbon? bog down and warn.
      const cx = this.path(this.dist);
      const off = Math.abs(this.x - cx);
      if (off > LANE) {
        this.x = cx + Math.sign(this.x - cx) * LANE;   // clamp to the rail
        this.speed = Math.max(3, this.speed * 0.9);
        this._offT += dt;
        if (this._offT > 0.1) { this._warn('CAREFUL!', 'bad'); fb.tick(); this._offT = 0; }
      }

      // obstacle hits
      for (const o of this._obstacles) {
        if (o.hit) continue;
        const wz = -this.dist;
        if (Math.abs(wz - o.z) < 0.9 && Math.abs(this.x - o.x) < o.r) {
          o.hit = true; this.speed = Math.max(2.5, this.speed * 0.45);
          this.x += Math.sign(this.x - o.x || 1) * 0.6;       // bounce aside
          o.mesh.material.color.set(0x888888); fb.thud(); this._warn('OOF!', 'bad');
        }
      }
      // pips
      for (const p of this._pips) {
        if (p.got) continue;
        const wz = -this.dist;
        if (Math.abs(wz - p.z) < 0.9 && Math.abs(this.x - p.x) < 0.8) {
          p.got = true; this.score += 50; this.speed = Math.min(22, this.speed + 1.8);
          this.scene.remove(p.mesh); fb.confirm(); this._warn('+50', 'good');
        }
      }

      this.dist += this.speed * dt;
      if (this.dist >= FINISH) { this.done = true; this._finish(); }
    }

    // animate pips spinning
    for (const p of this._pips) if (!p.got) { p.mesh.rotation.y += dt * 3; p.mesh.position.y = 0.7 + Math.sin(this.t * 4 + p.z) * 0.12; }

    // place Zook + chase camera that leans into the steer.
    this.zook.step(dt, { walk: true });
    const cx = this.path(this.dist);
    this.zook.group.position.set(this.x, this.zook.dims.rest, -this.dist);
    this.zook.group.rotation.y = Math.atan2(this.path(this.dist + 2) - cx, 2) - steer * 0.4;
    this._camX += (this.x * 0.6 - this._camX) * Math.min(1, dt * 3);
    setCamera({ x: this._camX, y: 6.5, z: -this.dist + 9 }, { x: this.x * 0.4, y: 0.3, z: -this.dist - 6 });
    this._hudUpdate();
  }

  _finish() {
    const time = this.t; fb.win();
    let best = 0; try { best = +localStorage.getItem('fz-runscore') || 0; } catch (_) {}
    const isBest = this.score > best;
    if (isBest) { try { localStorage.setItem('fz-runscore', this.score); } catch (_) {} }
    if (this.onFinish) this.onFinish(time, this.score);
    else this._result(`Finished! ${time.toFixed(1)}s · ${this.score} pts${isBest ? ' · 🏆 NEW BEST!' : ` · best ${best}`}`);
  }
  result(text) { this._result(text); }    // online wrapper calls this
  _result(text) {
    const r = document.createElement('div'); r.className = 'overlay';
    r.innerHTML = `<div class="result-modal"><h1 class="win">RUN!</h1><p>${text}</p>
      <div class="row"><button class="m-btn" data-x><b>DONE</b></button></div></div>`;
    r.querySelector('[data-x]').onclick = () => { fb.press(); r.remove(); this.onExit && this.onExit(); };
    this.mount.appendChild(r);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _buildHud() {
    const h = document.createElement('div'); h.className = 'run-hud';
    h.innerHTML = `
      <button class="game-back" data-back><img src="./assets/btn-back.png" alt="Menu"/></button>
      <div class="run-best">BEST ${(() => { try { return +localStorage.getItem('fz-runscore') || 0; } catch (_) { return 0; } })()}</div>
      <div class="run-warn"></div>
      <div class="run-stats"><span class="run-time">0.0s</span><div class="run-prog"><i></i></div><span class="run-spd">8.0</span></div>
      <div class="run-pads">
        <button class="run-pad steer" data-d="L">◀</button>
        <button class="run-pad" data-d="GO">GO</button>
        <button class="run-pad steer" data-d="R">▶</button>
      </div>`;
    this.mount.appendChild(h); this._hud = h;
    h.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.onExit && this.onExit(); });
    const set = (d, on) => {
      if (d === 'L') this._padLR = on ? -1 : 0;
      else if (d === 'R') this._padLR = on ? 1 : 0;
      else if (d === 'GO') this.tilt.fb = on ? -1 : 0;
    };
    h.querySelectorAll('[data-d]').forEach(b => {
      const d = b.dataset.d;
      const dn = (e) => { e.preventDefault(); set(d, true); b.classList.add('on'); };
      const up = () => { set(d, false); b.classList.remove('on'); };
      b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
    this._warnEl = h.querySelector('.run-warn');
  }
  _warn(text, cls) { this._warnEl.textContent = text; this._warnEl.className = 'run-warn ' + cls; this._fadeT = 0; }
  _hudUpdate() {
    const h = this._hud; if (!h) return;
    if (this._warnEl.textContent) { this._fadeT = (this._fadeT || 0) + 0.016; if (this._fadeT > 0.6) { this._warnEl.className = 'run-warn'; this._warnEl.textContent = ''; } }
    h.querySelector('.run-time').textContent = this.t.toFixed(1) + 's';
    h.querySelector('.run-spd').textContent = this.speed.toFixed(1);
    h.querySelector('.run-prog i').style.width = Math.min(100, (this.dist / FINISH) * 100) + '%';
  }
}

/** iOS needs a user-gesture permission for motion. Safe no-op elsewhere. */
export async function requestTilt() {
  try {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') { const s = await D.requestPermission(); return s === 'granted'; }
  } catch (_) {}
  return true;
}
