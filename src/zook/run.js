/**
 * run.js — ZOOK RUN: a top-down tilt-timing racer (Super Monkey Ball × Tap Hero).
 *
 * Your Zook auto-runs down a track seen from above. A stream of cues — TURN
 * LEFT/RIGHT, INCLINE, DROP — approaches; each flashes a warning ~1s ahead at
 * the top of the screen. Tilt the phone (or tap the on-screen pads) in the cued
 * direction at the right moment to nail it and surge faster; mistime it and you
 * bog down. First to the finish wins. Same seed → identical track for both
 * players, so online races are fair (each renders its own Zook locally).
 */

import * as THREE from 'three';
import { Zook } from './model.js';
import { setCamera } from '../engine/renderer.js';
import { fb } from '../sys/feedback.js';
import { guide } from '../sys/guide.js';

const LANE = 3.2;             // half-width of the track
const FINISH = 160;          // track length (world units)
const TYPES = ['L', 'R', 'UP', 'DOWN'];
const ICON = { L: '◀', R: '▶', UP: '⛰', DOWN: '▽' };
const NAME = { L: 'LEFT', R: 'RIGHT', UP: 'INCLINE', DOWN: 'DROP' };

function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class ZookRun {
  constructor({ scene, camera, canvas, mount, bp, seed = 1, onExit, onFinish, vsName }) {
    Object.assign(this, { scene, camera, canvas, mount, bp, seed, onExit, onFinish, vsName });
    this.dist = 0; this.speed = 7; this.base = 7; this.x = 0; this.tilt = { lr: 0, fb: 0 };
    this._action = { dir: null, t: -9 }; this.combo = 0; this.best = 0; this.score = 0;
    this.done = false; this.started = false; this.t = 0; this._meshes = [];
    this._onTilt = this._onTilt.bind(this);
  }

  enter() {
    // Track + lane markings.
    const track = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2 + 1.2, 0.4, FINISH + 40),
      new THREE.MeshStandardMaterial({ color: 0xeee7d6, roughness: 0.85 }));
    track.position.set(0, -0.2, -FINISH / 2 + 6); track.receiveShadow = true;
    this.scene.add(track); this._meshes.push(track);
    for (let z = 4; z > -FINISH - 6; z -= 4) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 1.6), new THREE.MeshStandardMaterial({ color: 0xcbb98f }));
      m.position.set(0, 0.01, z); this.scene.add(m); this._meshes.push(m);
    }
    // Cues from the seed.
    const rnd = mulberry32(this.seed);
    this.cues = [];
    for (let d = 14; d < FINISH - 6; d += 7 + Math.floor(rnd() * 6)) {
      const type = TYPES[Math.floor(rnd() * TYPES.length)];
      this.cues.push({ d, type, done: false });
      this._cueMarker(d, type);
    }
    // Finish line.
    const fin = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2 + 1.2, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x222222 }));
    fin.position.set(0, 0.03, -FINISH); this.scene.add(fin); this._meshes.push(fin);

    this.zook = new Zook(this.bp, { scene: this.scene, preview: true, pos: { x: 0, z: 0 } });
    setCamera({ x: 0, y: 9, z: 7 }, { x: 0, y: 0, z: -4 }, true);

    this._buildHud();
    window.addEventListener('deviceorientation', this._onTilt);
    guide.now('Lean into the turns and bumps as they hit the line — nail the timing to surge ahead!');
  }

  exit() {
    window.removeEventListener('deviceorientation', this._onTilt);
    if (this.zook) this.zook.dispose();
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    this._meshes = []; if (this._hud) this._hud.remove();
  }

  _cueMarker(d, type) {
    const colour = type === 'L' || type === 'R' ? 0x3f6fd8 : type === 'UP' ? 0xff8a1e : 0x2bb6a6;
    const m = new THREE.Mesh(new THREE.BoxGeometry(type === 'UP' || type === 'DOWN' ? LANE * 2 : 0.7, 0.5, 0.7),
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6 }));
    const x = type === 'L' ? -LANE : type === 'R' ? LANE : 0;
    m.position.set(x, 0.25, -d); if (type === 'UP') m.rotation.x = -0.3;
    this.scene.add(m); this._meshes.push(m);
  }

  // ── input ──────────────────────────────────────────────────────────────────
  _onTilt(e) {
    if (e.gamma != null) this.tilt.lr = Math.max(-1, Math.min(1, e.gamma / 30));
    if (e.beta != null) this.tilt.fb = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    // Derive discrete actions from strong tilts.
    if (this.tilt.lr < -0.5) this._fire('L'); else if (this.tilt.lr > 0.5) this._fire('R');
    if (this.tilt.fb < -0.5) this._fire('UP'); else if (this.tilt.fb > 0.5) this._fire('DOWN');
  }
  _fire(dir) { this._action = { dir, t: this.t }; }

  // ── loop ──────────────────────────────────────────────────────────────────
  update(dt) {
    if (!this.zook) return;
    this.t += dt;
    if (!this.done) {
      this.dist += this.speed * dt;
      this.speed += (this.base - this.speed) * Math.min(1, dt * 1.5);      // ease back to base
      // lateral from tilt (Monkey Ball feel)
      this.x += this.tilt.lr * dt * 5; this.x = Math.max(-LANE, Math.min(LANE, this.x));
      // resolve cues as they reach the Zook (the "hit line")
      for (const c of this.cues) {
        if (c.done || this.dist < c.d) continue;
        c.done = true;
        const hit = this._action.dir === c.type && (this.t - this._action.t) < 0.35;
        if (hit) { this.combo++; this.best = Math.max(this.best, this.combo); this.score += 10 * this.combo; this.speed = Math.min(16, this.speed + 3.2); fb.confirm(); }
        else { this.combo = 0; this.speed = Math.max(3.5, this.speed * 0.55); fb.thud(); }
        this._flash(hit);
      }
      if (this.dist >= FINISH) { this.done = true; this._finish(); }
    }
    // place Zook + follow camera (top-down-ish)
    this.zook.step(dt, { walk: true });
    this.zook.group.position.set(this.x, this.zook.dims.rest, -this.dist);
    this.zook.group.rotation.y = -this.tilt.lr * 0.4;
    setCamera({ x: 0, y: 9, z: -this.dist + 7 }, { x: 0, y: 0, z: -this.dist - 4 });
    this._hudUpdate();
  }

  _finish() {
    const time = this.t;
    fb.win();
    if (this.onFinish) this.onFinish(time, this.score);
    else this._result(`Finished! ${time.toFixed(1)}s · ${this.score} pts`);
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
      <div class="run-warn"></div>
      <div class="run-stats"><span class="run-combo">×0</span><div class="run-prog"><i></i></div><span class="run-spd">7.0</span></div>
      <div class="run-pads">
        <button class="run-pad" data-d="L">◀</button>
        <div class="run-pad-col"><button class="run-pad" data-d="UP">⛰</button><button class="run-pad" data-d="DOWN">▽</button></div>
        <button class="run-pad" data-d="R">▶</button>
      </div>`;
    this.mount.appendChild(h); this._hud = h;
    h.querySelectorAll('[data-d]').forEach(b => b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._fire(b.dataset.d); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 120); }));
    this._warnEl = h.querySelector('.run-warn');
  }
  _flash(hit) {
    this._warnEl.textContent = hit ? 'NICE!' : 'MISS';
    this._warnEl.className = 'run-warn ' + (hit ? 'good' : 'bad');
  }
  _hudUpdate() {
    const h = this._hud; if (!h) return;
    // next upcoming cue → warning ~1s ahead
    let next = null;
    for (const c of this.cues) { if (!c.done && c.d >= this.dist) { next = c; break; } }
    if (next) {
      const tt = (next.d - this.dist) / Math.max(1, this.speed);
      if (tt < 1.0 && !this._warnEl.classList.contains('good') && !this._warnEl.classList.contains('bad')) {
        this._warnEl.textContent = `${ICON[next.type]} ${NAME[next.type]}`;
        this._warnEl.className = 'run-warn live'; this._warnEl.style.opacity = String(Math.min(1, 1.2 - tt));
      }
    }
    if (this._warnEl.classList.contains('good') || this._warnEl.classList.contains('bad')) {
      this._fadeT = (this._fadeT || 0) + 0.016; if (this._fadeT > 0.4) { this._warnEl.className = 'run-warn'; this._warnEl.textContent = ''; this._fadeT = 0; }
    }
    h.querySelector('.run-combo').textContent = '×' + this.combo;
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
