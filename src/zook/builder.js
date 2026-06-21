/**
 * builder.js — the Workshop (the Zook Kit), rebuilt touch-first.
 *
 * The model fills the screen. You work on it DIRECTLY, with touch as the mouse
 * (just like the original Zook Kit):
 *   • SHAPE — drag on the body to stretch it (across = wider, up/down = taller).
 *   • ADD   — TAP THE BODY where you want a leg (or blob); it appears there.
 *             Drag a part to move it; its mirror partner follows.
 *   • MOVE  — tune how it walks; tap a leg to edit its cycle / foot path.
 *   • PAINT — colour it.
 * Drag empty space to orbit the model. A single thin bar at the very bottom holds
 * the few controls each mode needs — nothing covers the creature.
 */

import * as THREE from 'three';
import { Zook, defaultBlueprint, makeLeg, newPairId, ensureLegs, defaultPath } from './model.js';
import { Knob, Switch, HueSlider, Selector } from './controls.js';
import { setCamera } from '../engine/renderer.js';
import { saveZook, randomExample } from './library.js';
import { guide, TIPS } from '../sys/guide.js';
import { fb } from '../sys/feedback.js';

export class Builder {
  constructor({ scene, mount, camera, canvas, onTest, onBack }) {
    this.scene = scene; this.mount = mount; this.camera = camera; this.canvas = canvas;
    this.onTest = onTest; this.onBack = onBack;
    this.bp = defaultBlueprint();
    this.name = 'My Zook';
    this.zook = null; this.turntable = null; this._deck = null;
    this._mode = 'shape'; this._walk = true; this._helper = false;
    this._mirror = true; this._addType = 'leg';
    this._sel = null;            // { type:'leg'|'blob', idx }
    this._drag = null;
    this._undo = []; this._redo = [];
    this._ray = new THREE.Raycaster();
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
  }

  enter(blueprint, name) {
    if (blueprint) this.bp = { ...blueprint };
    if (name) this.name = name;
    ensureLegs(this.bp); if (!Array.isArray(this.bp.blobs)) this.bp.blobs = [];
    this._sel = null;

    this.turntable = new THREE.Group();
    this.scene.add(this.turntable);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.3, 56),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7 }));
    plinth.position.y = -0.15; plinth.receiveShadow = true; this.turntable.add(plinth);
    this.turntable.position.y = 0.5;
    this.turntable.rotation.y = -0.5;            // a friendly 3/4 view to start

    this.zook = new Zook(this.bp, { preview: true, showArrow: true });
    this.turntable.add(this.zook.group);

    setCamera({ x: -0.7, y: 2.4, z: 5.2 }, { x: -0.7, y: 1.05, z: 0 }, true);
    this._buildUI();
    this.canvas.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    guide.hide();        // builder is help-on-demand only (tap the ? button)
  }

  exit() {
    this.canvas.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    this._drag = null;
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this.turntable) { this.scene.remove(this.turntable); this.turntable = null; }
    if (this._deck) { this._deck.remove(); this._deck = null; }
  }

  update(dt) {
    if (this.zook) { this.zook.step(dt, { walk: this._walk }); this.zook.syncMeshes(); }
  }

  _apply() { if (this.zook) this.zook.setBlueprint(this.bp, this._sel && this._sel.type === 'leg' ? this._sel.idx : -1); }
  _pushUndo() { this._undo.push(JSON.parse(JSON.stringify(this.bp))); if (this._undo.length > 40) this._undo.shift(); this._redo.length = 0; }

  // ── chrome ──────────────────────────────────────────────────────────────────
  // A thin LEFT side-panel (drawing-app style): mode tabs + the mode's tactile
  // controls stacked vertically. The model stays fully visible to the right.
  _buildUI() {
    const wrap = document.createElement('div'); wrap.className = 'bld';
    wrap.innerHTML = `
      <div class="btopbar">
        <button class="b-back" title="Back"><img src="./assets/btn-back.png" alt="Back"/></button>
        <input class="name-in" value="${this.name}" maxlength="14" />
        <button class="b-dice" title="Surprise me">🎲</button>
        <button class="b-guide" title="Helper on/off">💬</button>
        <button class="b-walk" title="Walk in place">WALK</button>
        <button class="b-save" title="Save"><img src="./assets/btn-check.png" alt="Save"/></button>
        <button class="b-test">TEST ▶</button>
      </div>
      <div class="bside">
        <div class="bmodes"></div>
        <div class="b-hint"></div>
        <div class="bctl deck"></div>
      </div>`;
    this.mount.appendChild(wrap); this._deck = wrap;

    wrap.querySelector('.b-back').addEventListener('click', () => { fb.press(); this.onBack(); });
    wrap.querySelector('.name-in').addEventListener('input', e => { this.name = e.target.value || 'My Zook'; });
    wrap.querySelector('.b-save').addEventListener('click', () => { saveZook(this.name, this.bp); fb.confirm(); if (this._helper) guide.pop(`Saved ${this.name}!`); });
    wrap.querySelector('.b-test').addEventListener('click', () => { fb.press(); this.onTest(this.bp, this.name); });
    const walk = wrap.querySelector('.b-walk');
    const sw = () => walk.classList.toggle('on', this._walk); sw();
    walk.addEventListener('click', () => { this._walk = !this._walk; sw(); fb.tick(); });
    // tiny helper toggle — Fried only speaks when this is on
    wrap.querySelector('.b-dice').addEventListener('click', () => { fb.confirm(); this._pushUndo(); this.bp = JSON.parse(JSON.stringify(randomExample().bp)); this._sel = null; this._apply(); this._renderBar(); if (this._helper) guide.pop('Surprise! Tweak it, or roll again.'); });
    const gb = wrap.querySelector('.b-guide');
    const gs = () => gb.classList.toggle('on', this._helper); gs();
    gb.addEventListener('click', () => { fb.tick(); this._helper = !this._helper; gs(); if (this._helper) guide.pop(this._helpText()); else guide.hide(); });

    const modes = wrap.querySelector('.bmodes');
    [['shape', 'SHAPE'], ['add', 'ADD'], ['move', 'MOVE'], ['paint', 'PAINT']].forEach(([m, label]) => {
      const c = document.createElement('button'); c.className = 'bmode'; c.dataset.m = m; c.textContent = label;
      c.addEventListener('click', () => { fb.tick(); this._setMode(m); });
      modes.appendChild(c);
    });
    this._barEl = wrap.querySelector('.bctl');
    this._hintEl = wrap.querySelector('.b-hint');
    this._setMode(this._mode);
  }

  _setMode(m) {
    this._mode = m;
    if (m !== 'add' && m !== 'move') this._select(null);
    this._deck.querySelectorAll('.bmode').forEach(c => c.classList.toggle('on', c.dataset.m === m));
    this._renderBar();
    if (this._helper) guide.pop(this._helpText());
  }

  _coach(text) {
    if (!this._coachEl) { this._coachEl = document.createElement('div'); this._coachEl.className = 'b-coach'; this._deck.appendChild(this._coachEl); }
    this._coachEl.textContent = text; this._coachEl.style.display = text ? 'block' : 'none';
  }

  _renderBar() {
    const el = this._barEl; el.innerHTML = '';
    const K = (o) => Knob(o).root;
    const set = (k, v) => { this._pushUndo(); this.bp[k] = v; this._apply(); };
    const hint = (t) => { this._hintEl.textContent = t; };
    // Cold-start coach: a big hint over the model until the first leg is placed.
    this._coach(this._mode === 'add' && (this.bp.legs || []).length === 0 && this._addType === 'leg' ? '👆 Tap the body to add a leg' : '');

    if (this._mode === 'shape') {
      el.append(
        K({ label: 'LENGTH', min: 1.0, max: 3.2, step: 0.1, value: this.bp.len, onChange: v => set('len', v) }),
        K({ label: 'WIDTH', min: 0.5, max: 1.8, step: 0.05, value: this.bp.width, onChange: v => set('width', v) }),
        K({ label: 'HEIGHT', min: 0.4, max: 1.4, step: 0.05, value: this.bp.height, onChange: v => set('height', v) }),
        K({ label: 'SQUARE', min: 0, max: 1, step: 0.05, value: this.bp.square, format: v => `${Math.round(v * 100)}`, onChange: v => set('square', v) }),
        K({ label: 'POINTY', min: 0, max: 1, step: 0.05, value: this.bp.pointy, format: v => `${Math.round(v * 100)}`, onChange: v => set('pointy', v) }),
      );
      hint('drag the body to stretch it · drag the floor to spin it round');
    } else if (this._mode === 'add') {
      const type = Selector({ label: 'PART', value: this._addType,
        options: [{ v: 'leg', t: 'LEG' }, { v: 'blob', t: 'BLOB' }], onChange: v => { this._addType = v; this._select(null); this._renderBar(); } });
      el.append(type.root, Switch({ label: 'MIRROR', value: this._mirror, onChange: v => { this._mirror = v; } }).root);
      if (this._addType === 'leg') {
        el.append(Selector({ label: 'STYLE', value: this._legStyle || 'crawl',
          options: [{ v: 'crawl', t: 'CRAWL' }, { v: 'paddle', t: 'PADDLE' }, { v: 'stalk', t: 'STALK' }, { v: 'step', t: 'STEP' }, { v: 'stomp', t: 'STOMP' }, { v: 'push', t: 'PUSH' }, { v: 'flipper', t: 'FLIP' }],
          onChange: v => { this._legStyle = v; if (this._sel && this._sel.type === 'leg') this._editLeg('style', v, true); } }).root);
      }
      const s = this._sel;
      if (s && s.type === 'leg' && this.bp.legs[s.idx]) {
        const leg = this.bp.legs[s.idx];
        el.append(K({ label: 'LEN', min: 0.35, max: 1.2, step: 0.05, value: leg.len, onChange: v => this._editLeg('len', v) }),
          K({ label: 'THICK', min: 0.1, max: 0.32, step: 0.02, value: leg.thick, onChange: v => this._editLeg('thick', v) }),
          this._delBtn());
        hint('drag the leg to move it · its mirror follows');
      } else if (s && s.type === 'blob' && this.bp.blobs[s.idx]) {
        const bl = this.bp.blobs[s.idx];
        el.append(K({ label: 'SIZE', min: 0.2, max: 1.8, step: 0.05, value: bl.sx, onChange: v => { this._pushUndo(); bl.sx = bl.sy = bl.sz = v; this._apply(); } }), this._delBtn());
        hint('drag the blob to move it');
      } else {
        hint(this._addType === 'leg' ? 'TAP THE BODY where you want a leg' : 'TAP THE BODY to add a clay blob');
      }
    } else if (this._mode === 'move') {
      el.append(
        K({ label: 'SPEED', min: 1, max: 4, step: 0.1, value: this.bp.speed, onChange: v => set('speed', v) }),
        K({ label: 'STRIDE', min: 0.3, max: 1.3, step: 0.05, value: this.bp.stride, onChange: v => set('stride', v) }),
        K({ label: 'STIFF', min: 0.5, max: 2, step: 0.1, value: this.bp.stiffness, format: v => v.toFixed(1), onChange: v => set('stiffness', v) }),
        K({ label: 'TURN', min: 0.5, max: 3, step: 0.1, value: this.bp.turnSharp, onChange: v => set('turnSharp', v) }),
      );
      const s = this._sel;
      if (s && s.type === 'leg' && this.bp.legs[s.idx]) {
        const leg = this.bp.legs[s.idx];
        el.append(K({ label: 'CYCLE', min: 0, max: 1, step: 0.05, value: leg.cycle, format: v => v.toFixed(2), onChange: v => { leg.cycle = v; this._apply(); } }), this._pathBtn());
        hint('CYCLE staggers this leg · tap PATH to shape its step');
      } else hint('tap a leg to tune its step · SPEED & STRIDE set the pace');
    } else { // paint
      const sw = document.createElement('div'); sw.className = 'swatches';
      [0.02, 0.07, 0.13, 0.22, 0.33, 0.45, 0.55, 0.63, 0.74, 0.88, 0.95].forEach(h => {
        const b = document.createElement('button'); b.className = 'swatch'; b.style.background = `hsl(${h * 360},72%,55%)`;
        b.addEventListener('click', () => { this._pushUndo(); this.bp.hue = h; this.bp.footHue = h; this._apply(); fb.tick(); });
        sw.appendChild(b);
      });
      el.append(sw,
        HueSlider({ label: 'BODY', value: this.bp.hue, onChange: v => set('hue', v) }).root,
        HueSlider({ label: 'FEET', value: this.bp.footHue, onChange: v => set('footHue', v) }).root,
        Selector({ label: 'PATTERN', value: this.bp.pattern,
          options: [{ v: 'none', t: 'PLAIN' }, { v: 'stripes', t: 'STRIPE' }, { v: 'spots', t: 'SPOTS' }, { v: 'dots', t: 'DOTS' }, { v: 'checker', t: 'CHECK' }, { v: 'camo', t: 'CAMO' }, { v: 'plaster', t: 'SPECK' }],
          onChange: v => { this._pushUndo(); this.bp.pattern = v; this._apply(); } }).root);
      hint('pick a colour for the body and the feet');
    }
  }

  _delBtn() {
    const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'DELETE';
    b.addEventListener('click', () => { fb.press(); this._deleteSel(); });
    return b;
  }
  _pathBtn() {
    const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'PATH ✎';
    b.addEventListener('click', () => { fb.press(); this._openPath(); });
    return b;
  }

  // ── selection + part ops ────────────────────────────────────────────────────
  _select(sel) {
    this._sel = sel;
    if (this.zook) this.zook.setHighlight(sel && sel.type === 'leg' ? sel.idx : -1);
  }
  _editLeg(key, val, rebuild = false) {
    const leg = this._sel && this._sel.type === 'leg' && this.bp.legs[this._sel.idx]; if (!leg) return;
    leg[key] = val;
    const partner = this.bp.legs.find(l => l !== leg && l.pair === leg.pair);
    if (partner && key !== 'cycle') partner[key] = val;
    this._apply(); if (rebuild) this._renderBar();
  }
  _deleteSel() {
    const s = this._sel; if (!s) return; this._pushUndo();
    if (s.type === 'leg') {
      const leg = this.bp.legs[s.idx]; this.bp.legs = this.bp.legs.filter(l => l !== leg && l.pair !== leg.pair);
    } else { this.bp.blobs.splice(s.idx, 1); }
    this._select(null); this._apply(); this._renderBar();
  }

  _addLegAt(along, side) {
    this._pushUndo();
    const legs = this.bp.legs, last = legs[legs.length - 1];
    const len = last ? last.len : 0.72, thick = last ? last.thick : this.bp.legThick, style = this._legStyle || (last ? last.style : 'crawl');
    if (this._mirror) {
      const pair = newPairId();
      legs.push(makeLeg(1, along, { len, thick, style, cycle: 0, pair }));
      legs.push(makeLeg(-1, along, { len, thick, style, cycle: 0.5, pair }));
      this._select({ type: 'leg', idx: legs.length - 2 });
    } else {
      legs.push(makeLeg(side, along, { len, thick, style, cycle: 0 }));
      this._select({ type: 'leg', idx: legs.length - 1 });
    }
    this._apply(); this._renderBar(); fb.confirm();
  }
  _addBlobAtLocal(loc) {
    this._pushUndo();
    this.bp.blobs.push({ x: loc.x, y: loc.y, z: loc.z, sx: 0.6, sy: 0.6, sz: 0.6 });
    this._select({ type: 'blob', idx: this.bp.blobs.length - 1 });
    this._apply(); this._renderBar(); fb.confirm();
  }

  // ── touch interaction (touch = mouse) ───────────────────────────────────────
  _hit(e) {
    const r = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    this._ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const hits = this._ray.intersectObjects(this.zook.group.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData) {
          if (o.userData.legIndex != null) return { type: 'leg', idx: o.userData.legIndex, point: h.point };
          if (o.userData.blobIndex != null) return { type: 'blob', idx: o.userData.blobIndex, point: h.point };
          if (o.userData.isBody) return { type: 'body', point: h.point };
        }
        o = o.parent;
      }
    }
    return null;
  }
  _toScreen(x, y, z) {
    const v = new THREE.Vector3(x, y, z); this.zook.group.localToWorld(v); v.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * r.width + r.left, y: (-v.y * 0.5 + 0.5) * r.height + r.top };
  }
  _legDrag(idx) {
    const leg = this.bp.legs[idx]; const x = leg.side * this.bp.width * 0.4, y = -this.bp.height * 0.32;
    return { kind: 'leg', idx, A: this._toScreen(x, y, -this.bp.len * 0.46), B: this._toScreen(x, y, this.bp.len * 0.46) };
  }
  _blobDrag(idx, e) {
    const bl = this.bp.blobs[idx];
    const O = this._toScreen(bl.x, bl.y, bl.z), Pz = this._toScreen(bl.x, bl.y, bl.z + 1), Py = this._toScreen(bl.x, bl.y + 1, bl.z);
    return { kind: 'blob', idx, az: { x: Pz.x - O.x, y: Pz.y - O.y }, ay: { x: Py.x - O.x, y: Py.y - O.y }, startPx: { x: e.clientX, y: e.clientY }, sz: bl.z, sy: bl.y };
  }

  _onDown(e) {
    if (!this.zook) return;
    const hit = this._hit(e);
    e.preventDefault();
    if (this._mode === 'shape') {
      if (hit && hit.type === 'body') this._drag = { kind: 'shape', w: this.bp.width, h: this.bp.height, x: e.clientX, y: e.clientY };
      else this._orbit(e);
    } else if (this._mode === 'add') {
      if (hit && hit.type === 'leg') { this._select({ type: 'leg', idx: hit.idx }); this._renderBar(); this._drag = this._legDrag(hit.idx); }
      else if (hit && hit.type === 'blob') { this._select({ type: 'blob', idx: hit.idx }); this._renderBar(); this._drag = this._blobDrag(hit.idx, e); }
      else if (hit && hit.type === 'body') {
        const loc = this.zook.group.worldToLocal(hit.point.clone());
        if (this._addType === 'blob') { this._addBlobAtLocal(loc); this._drag = this._blobDrag(this._sel.idx, e); }
        else { const along = Math.max(-1, Math.min(1, loc.z / (this.bp.len * 0.46))); this._addLegAt(along, loc.x < 0 ? -1 : 1); this._drag = this._legDrag(this._sel.idx); }
      } else this._orbit(e);
    } else if (this._mode === 'move') {
      if (hit && hit.type === 'leg') { this._select({ type: 'leg', idx: hit.idx }); this._renderBar(); this._drag = this._legDrag(hit.idx); }
      else this._orbit(e);
    } else this._orbit(e);
  }
  _orbit(e) { this._drag = { kind: 'orbit', x: e.clientX, base: this.turntable.rotation.y }; }

  _onMove(e) {
    const d = this._drag; if (!d) return;
    e.preventDefault();
    if (d.kind === 'orbit') { this.turntable.rotation.y = d.base + (e.clientX - d.x) * 0.01; return; }
    if (d.kind === 'shape') {
      this.bp.width = Math.max(0.5, Math.min(1.8, d.w + (e.clientX - d.x) * 0.006));
      this.bp.height = Math.max(0.4, Math.min(1.4, d.h - (e.clientY - d.y) * 0.006));
      this._apply(); return;
    }
    if (d.kind === 'leg') {
      const A = d.A, B = d.B, abx = B.x - A.x, aby = B.y - A.y, l2 = abx * abx + aby * aby || 1;
      let t = ((e.clientX - A.x) * abx + (e.clientY - A.y) * aby) / l2; t = Math.max(0, Math.min(1, t));
      const along = Math.round((-1 + t * 2) * 20) / 20;
      const leg = this.bp.legs[d.idx]; if (!leg) return;
      leg.along = along; const partner = this.bp.legs.find(l => l !== leg && l.pair === leg.pair); if (partner) partner.along = along;
      this._apply(); return;
    }
    if (d.kind === 'blob') {
      const dx = e.clientX - d.startPx.x, dy = e.clientY - d.startPx.y, det = d.az.x * d.ay.y - d.ay.x * d.az.y || 1;
      const dz = (dx * d.ay.y - d.ay.x * dy) / det, dyl = (d.az.x * dy - dx * d.az.y) / det;
      const bl = this.bp.blobs[d.idx]; if (!bl) return;
      bl.z = Math.max(-1.6, Math.min(1.6, Math.round((d.sz + dz) * 20) / 20));
      bl.y = Math.max(-1.0, Math.min(1.6, Math.round((d.sy + dyl) * 20) / 20));
      this._apply(); return;
    }
  }
  _onUp() { if (!this._drag) return; const k = this._drag.kind; this._drag = null; if (k === 'leg' || k === 'blob' || k === 'shape') { fb.tick(); this._renderBar(); } }

  // ── foot-path popover (MOVE) ────────────────────────────────────────────────
  _openPath() {
    const leg = this._sel && this._sel.type === 'leg' && this.bp.legs[this._sel.idx]; if (!leg) return;
    if (!Array.isArray(leg.path)) leg.path = defaultPath();
    const pop = document.createElement('div'); pop.className = 'overlay path-pop';
    pop.innerHTML = `<div class="path-card">
      <div class="bar"><b>FOOT PATH</b><button class="mini-btn" data-x>DONE</button></div>
      <div class="path-pad"><span class="pad-ax pad-fwd">◀ back · fwd ▶</span><span class="pad-ax pad-up">lift ▲</span><span class="pad-ground">ground</span></div>
      <div class="deck-note">drag the points — low &amp; sweeping BACK pushes the Zook along</div></div>`;
    const pad = pop.querySelector('.path-pad');
    const place = (dot, pt) => { dot.style.left = `${(pt.f + 1) / 2 * 100}%`; dot.style.top = `${(1 - pt.h) * 100}%`; };
    leg.path.forEach((pt, i) => {
      const dot = document.createElement('div'); dot.className = 'path-dot'; dot.textContent = i + 1; place(dot, pt);
      let drag = false;
      dot.addEventListener('pointerdown', ev => { drag = true; dot.setPointerCapture?.(ev.pointerId); ev.preventDefault(); ev.stopPropagation(); });
      dot.addEventListener('pointermove', ev => {
        if (!drag) return; const r = pad.getBoundingClientRect();
        pt.f = Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width) * 2 - 1));
        pt.h = Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / r.height));
        place(dot, pt); this._apply();
      });
      dot.addEventListener('pointerup', ev => { drag = false; dot.releasePointerCapture?.(ev.pointerId); fb.tick(); });
      pad.appendChild(dot);
    });
    pop.querySelector('[data-x]').addEventListener('click', () => { fb.press(); pop.remove(); });
    this.mount.appendChild(pop);
  }

  _helpText() {
    const tips = {
      shape: 'SHAPE — drag the body to stretch it: across for width, up/down for height. The red arrow shows the way it walks.',
      add: 'ADD — tap the body where you want a leg! MIRROR adds a matching pair; drag a leg to move it. Switch to BLOB to add clay lumps.',
      move: 'MOVE — SPEED and STRIDE set the pace. Tap a leg to stagger its CYCLE and shape its foot PATH.',
      paint: 'PAINT — pick a colour for the body and the feet, and a pattern.',
    };
    const d = this._diagnose();
    return (tips[this._mode] || '') + (d.startsWith('Looking') ? '' : ' — ' + d);
  }

  // Coach the build from the real Zook Kit fix-it table (research paper, Table 2).
  _diagnose() {
    const bp = this.bp, legs = bp.legs || [];
    const L = legs.filter(l => l.side < 0).length, R = legs.filter(l => l.side > 0).length;
    if (!legs.length) return "No legs yet — switch to ADD and tap the body to place some!";
    if (legs.length < 2) return "One leg won't do — it'll just flop. Add more, on both sides!";
    if (L === 0 || R === 0) return "All the legs are on one side — mirror them or it'll topple over.";
    if (bp.width < 0.9) return "It's narrow and will tip — widen the body for a stable stance.";
    const phases = new Set(legs.map(l => Math.round((l.cycle || 0) * 12)));
    if (phases.size < 2) return "Every leg steps together — stagger each leg's CYCLE so it doesn't limp.";
    if (bp.stride < 0.5) return "Small steps! Raise STRIDE on the MOVE page for a longer step.";
    if (bp.speed < 2) return "It'll walk, not run — raise SPEED to quicken the gait cycle.";
    return "Looking sharp! Send it to the test table and see how it scurries.";
  }
}
