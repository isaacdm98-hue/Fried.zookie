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
import { Zook, defaultBlueprint, makeLeg, newPairId, ensureLegs, defaultPath, SKINS } from './model.js';
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
    this._mode = 'shape'; this._walk = false; this._helper = false;   // creature stands still while you build (walks only in Test / WALK preview)
    this._mirror = true; this._addType = 'leg';
    this._sel = null;            // { type:'leg'|'blob', idx }
    this._drag = null;
    this._selBox = null; this._handles = [];
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
    this._clearSelBox();
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this.turntable) { this.scene.remove(this.turntable); this.turntable = null; }
    if (this._deck) { this._deck.remove(); this._deck = null; }
  }

  update(dt) {
    if (this.zook) { this.zook.step(dt, { walk: this._walk }); this.zook.syncMeshes(); }
    this._updateSelBox();
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
        <button class="b-undo2" title="Undo">↶</button>
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
    wrap.querySelector('.b-undo2').addEventListener('click', () => { if (this._undo.length) { this._redo.push(JSON.parse(JSON.stringify(this.bp))); this.bp = this._undo.pop(); this._sel = null; this._apply(); this._renderBar(); fb.press(); } else fb.tick(); });
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
    if (m === 'shape') this._select(null);   // add/move/paint keep the selection (paint a chosen part)
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
        // Per-part size like the real kit: overall LENgth + 3-axis scale (W/H/D).
        el.append(K({ label: 'LEN', min: 0.35, max: 1.2, step: 0.05, value: leg.len, onChange: v => this._editLeg('len', v) }),
          K({ label: 'WIDE', min: 0.4, max: 2.6, step: 0.1, value: leg.sx || 1, format: v => v.toFixed(1), onChange: v => this._editLeg('sx', v) }),
          K({ label: 'TALL', min: 0.4, max: 2.0, step: 0.1, value: leg.sy || 1, format: v => v.toFixed(1), onChange: v => this._editLeg('sy', v) }),
          K({ label: 'DEEP', min: 0.4, max: 2.6, step: 0.1, value: leg.sz || 1, format: v => v.toFixed(1), onChange: v => this._editLeg('sz', v) }),
          this._copyBtn(), this._mirrorBtn(), this._delBtn());
        hint('drag to move · WIDE/TALL/DEEP shape the part · COPY/MIRROR');
      } else if (s && s.type === 'blob' && this.bp.blobs[s.idx]) {
        const bl = this.bp.blobs[s.idx];
        el.append(K({ label: 'SIZE', min: 0.2, max: 1.8, step: 0.05, value: bl.sx, onChange: v => { this._pushUndo(); bl.sx = bl.sy = bl.sz = v; this._apply(); } }), this._delBtn());
        hint('drag the blob to move it');
      } else {
        hint(this._addType === 'leg' ? 'TAP THE BODY where you want a leg' : 'TAP THE BODY to add a clay blob');
      }
    } else if (this._mode === 'move') {
      // Root motion (manual Ch13): the whole-Zook movement settings.
      el.append(
        K({ label: 'SPEED', min: 1, max: 4, step: 0.1, value: this.bp.speed, onChange: v => set('speed', v) }),
        K({ label: 'STRIDE', min: 0.3, max: 1.3, step: 0.05, value: this.bp.stride, onChange: v => set('stride', v) }),
        K({ label: 'STIFF', min: 0.5, max: 2, step: 0.1, value: this.bp.stiffness, format: v => v.toFixed(1), onChange: v => set('stiffness', v) }),
        K({ label: 'SHARP', min: 0.5, max: 3, step: 0.1, value: this.bp.turnSharp, onChange: v => set('turnSharp', v) }),
        K({ label: 'SMOOTH', min: 0.5, max: 0.98, step: 0.02, value: this.bp.turnSmooth, format: v => v.toFixed(2), onChange: v => set('turnSmooth', v) }),
        K({ label: 'AIM°', min: 0, max: 1.2, step: 0.05, value: this.bp.targetAngle, format: v => v.toFixed(2), onChange: v => set('targetAngle', v) }),
      );
      const s = this._sel;
      if (s && s.type === 'leg' && this.bp.legs[s.idx]) {
        const leg = this.bp.legs[s.idx];
        el.append(
          K({ label: 'CYCLE', min: 0, max: 1, step: 0.05, value: leg.cycle, format: v => v.toFixed(2), onChange: v => { this._pushUndo(); leg.cycle = v; this._apply(); } }),
          K({ label: 'MUSCLE', min: 0.4, max: 2.2, step: 0.1, value: leg.muscle || 1, format: v => v.toFixed(1), onChange: v => this._editLeg('muscle', v) }),
          Selector({ label: 'MODE', value: leg.move || 'two',
            options: [{ v: 'two', t: '2-PART' }, { v: 'single', t: '1-PART' }, { v: 'none', t: 'STILL' }], onChange: v => this._editLeg('move', v, true) }).root,
          Selector({ label: 'TURN', value: leg.moveType || 'auto',
            options: [{ v: 'auto', t: 'AUTO' }, { v: 'always', t: 'ALWAYS' }, { v: 'left', t: 'LEFT' }, { v: 'right', t: 'RIGHT' }], onChange: v => this._editLeg('moveType', v) }).root,
          Selector({ label: 'AIM', value: leg.target || 'off',
            options: [{ v: 'off', t: 'OFF' }, { v: 'normal', t: 'AWAY' }, { v: 'inverted', t: 'TOWARD' }], onChange: v => this._editLeg('target', v) }).root,
          this._pathBtn());
        hint('CYCLE staggers · MODE/TURN/AIM set behaviour · PATH shapes the step');
      } else hint('tap a leg to tune its step · SPEED & STRIDE set pace, SHARP/SMOOTH the turns');
    } else { // paint — colour the WHOLE body, or a single selected part (like the kit's Colour tab)
      const sel = this._sel, legSel = sel && sel.type === 'leg' && this.bp.legs[sel.idx];
      const sw = document.createElement('div'); sw.className = 'swatches';
      [0.02, 0.07, 0.13, 0.22, 0.33, 0.45, 0.55, 0.63, 0.74, 0.88, 0.95].forEach(h => {
        const b = document.createElement('button'); b.className = 'swatch'; b.style.background = `hsl(${h * 360},72%,55%)`;
        b.addEventListener('click', () => { fb.tick();
          if (legSel) this._editLeg('hue', h);
          else { this._pushUndo(); this.bp.hue = h; this.bp.footHue = h; this._apply(); } });
        sw.appendChild(b);
      });
      el.append(sw);
      if (legSel) {
        el.append(HueSlider({ label: 'THIS PART', value: legSel.hue != null ? legSel.hue : this.bp.footHue, onChange: v => this._editLeg('hue', v) }).root);
        const clr = document.createElement('button'); clr.className = 'mini-btn'; clr.textContent = 'USE BODY COLOUR';
        clr.addEventListener('click', () => { fb.press(); this._editLeg('hue', null); });
        el.append(this._skinGrid(legSel.skin, n => this._editLeg('skin', n)), clr);
        hint('colour & SKIN the selected part · tap the body for everything');
      } else {
        el.append(
          HueSlider({ label: 'BODY', value: this.bp.hue, onChange: v => set('hue', v) }).root,
          HueSlider({ label: 'FEET', value: this.bp.footHue, onChange: v => set('footHue', v) }).root,
          this._skinGrid(this.bp.skin, n => { this._pushUndo(); this.bp.skin = n; this._apply(); }));
        hint('pick a colour & a real Zook SKIN · tap a leg to paint just it');
      }
    }
  }

  // A grid of the real Zook Kit skin textures, plus PLAIN. `onPick(name|null)`.
  _skinGrid(current, onPick) {
    const wrap = document.createElement('div'); wrap.className = 'skin-grid';
    const none = document.createElement('button'); none.className = 'skin plain' + (current ? '' : ' on'); none.textContent = 'PLAIN';
    none.addEventListener('click', () => { fb.tick(); onPick(null); this._renderBar(); });
    wrap.appendChild(none);
    SKINS.forEach(name => {
      const b = document.createElement('button'); b.className = 'skin' + (current === name ? ' on' : '');
      b.style.backgroundImage = `url(./assets/skins/${name}.png)`; b.title = name;
      b.addEventListener('click', () => { fb.tick(); onPick(name); this._renderBar(); });
      wrap.appendChild(b);
    });
    return wrap;
  }
  _delBtn() {
    const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'DELETE';
    b.addEventListener('click', () => { fb.press(); this._deleteSel(); });
    return b;
  }
  _copyBtn() {
    const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'COPY';
    b.addEventListener('click', () => { fb.confirm(); this._copyLeg(); });
    return b;
  }
  _mirrorBtn() {
    const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'MIRROR';
    b.addEventListener('click', () => { fb.confirm(); this._mirrorLeg(); });
    return b;
  }
  // Copy (manual Ch7): an INDEPENDENT duplicate — its own pair id, nudged along
  // the body so you can see it. Later edits don't touch the original.
  _copyLeg() {
    const s = this._sel; if (!s || s.type !== 'leg') return; const src = this.bp.legs[s.idx]; if (!src) return;
    this._pushUndo();
    const along = Math.max(-1, Math.min(1, (src.along || 0) + 0.18));
    const dup = { ...src, along, pair: newPairId(), path: (src.path || []).map(p => ({ ...p })) };
    this.bp.legs.push(dup);
    this._select({ type: 'leg', idx: this.bp.legs.length - 1 });
    this._apply(); this._renderBar();
  }
  // Mirror (manual Ch8): a LINKED partner on the opposite side (same pair id, so
  // edits to either keep both in step), offset half a cycle for a natural gait.
  _mirrorLeg() {
    const s = this._sel; if (!s || s.type !== 'leg') return; const src = this.bp.legs[s.idx]; if (!src) return;
    if (this.bp.legs.some(l => l !== src && l.pair === src.pair)) { if (this._helper) guide.pop('That leg already has a mirror partner.'); return; }
    this._pushUndo();
    const twin = { ...src, side: -src.side, cycle: ((src.cycle || 0) + 0.5) % 1, path: (src.path || []).map(p => ({ ...p })) };
    this.bp.legs.push(twin);
    this._apply(); this._renderBar();
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
    this._updateSelBox();
  }

  // ── The see-through selection box (the Zook Kit signature) ──────────────────
  // A green wireframe box wraps the selected part, with little face handles you
  // DRAG to scale it — exactly like squishing modelling clay in the original.
  _selObj() {
    const s = this._sel; if (!s || !this.zook) return null;
    if (s.type === 'leg') { const lg = this.zook._legs[s.idx]; return lg && lg.pivot; }
    if (s.type === 'blob') { return this.zook._blobs && this.zook._blobs[s.idx]; }
    return null;
  }
  _ensureSelBox() {
    if (this._selBox) return;
    const lm = new THREE.LineBasicMaterial({ color: 0x39c46a, depthTest: false, transparent: true, opacity: 0.95 });
    this._selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), lm);
    this._selBox.renderOrder = 999; this.scene.add(this._selBox);
    const hm = new THREE.MeshBasicMaterial({ color: 0x2bb66a, depthTest: false, transparent: true, opacity: 0.98 });
    for (const [axis, sign] of [['x', 1], ['x', -1], ['y', 1], ['y', -1], ['z', 1], ['z', -1]]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), hm);
      h.renderOrder = 1000; h.userData = { handleAxis: axis, handleSign: sign }; this.scene.add(h); this._handles.push(h);
    }
  }
  _hideSelBox() { if (this._selBox) this._selBox.visible = false; for (const h of this._handles) h.visible = false; }
  _updateSelBox() {
    const obj = this._selObj();
    if (!obj) { this._hideSelBox(); return; }
    this._ensureSelBox();
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) { this._hideSelBox(); return; }
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    this._selBox.visible = true; this._selBox.position.copy(c);
    this._selBox.scale.set(Math.max(0.06, sz.x), Math.max(0.06, sz.y), Math.max(0.06, sz.z));
    for (const h of this._handles) { h.visible = true; const p = c.clone(); p[h.userData.handleAxis] += h.userData.handleSign * sz[h.userData.handleAxis] / 2; h.position.copy(p); }
    this._selCenter = c; this._selSize = sz;
  }
  _clearSelBox() {
    if (this._selBox) { this.scene.remove(this._selBox); this._selBox.geometry.dispose(); this._selBox.material.dispose(); this._selBox = null; }
    for (const h of this._handles) { this.scene.remove(h); h.geometry.dispose(); }
    if (this._handles.length) this._handles[0].material.dispose();
    this._handles = [];
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

  _worldToScreen(v) {
    const p = v.clone().project(this.camera); const r = this.canvas.getBoundingClientRect();
    return { x: (p.x * 0.5 + 0.5) * r.width + r.left, y: (-p.y * 0.5 + 0.5) * r.height + r.top };
  }
  _hitHandle(e) {
    if (!this._handles.length || !this._selBox || !this._selBox.visible) return null;
    const r = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    this._ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const hh = this._ray.intersectObjects(this._handles.filter(h => h.visible));
    return hh.length ? hh[0].object : null;
  }
  // Begin dragging a face handle to scale the selected part along that axis.
  _beginScale(handle, e) {
    const axis = handle.userData.handleAxis;
    const cs = this._worldToScreen(this._selCenter), hs = this._worldToScreen(handle.position);
    let dx = hs.x - cs.x, dy = hs.y - cs.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const field = axis === 'x' ? 'sx' : axis === 'y' ? 'sy' : 'sz';
    const part = this._sel.type === 'leg' ? this.bp.legs[this._sel.idx] : this.bp.blobs[this._sel.idx];
    this._pushUndo();
    this._drag = { kind: 'scale', field, dx, dy, sx: e.clientX, sy: e.clientY, startVal: part[field] || 1, type: this._sel.type, idx: this._sel.idx };
  }

  _onDown(e) {
    if (!this.zook) return;
    e.preventDefault();
    // Grabbing a selection-box handle scales the part (the clay-squish interaction).
    const handle = this._hitHandle(e);
    if (handle && this._sel) { this._beginScale(handle, e); return; }
    const hit = this._hit(e);
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
    } else if (this._mode === 'paint') {
      if (hit && hit.type === 'leg') { this._select({ type: 'leg', idx: hit.idx }); this._renderBar(); }
      else if (hit && hit.type === 'body') { this._select(null); this._renderBar(); }
      else this._orbit(e);
    } else this._orbit(e);
  }
  _orbit(e) { this._drag = { kind: 'orbit', x: e.clientX, base: this.turntable.rotation.y }; }

  _onMove(e) {
    const d = this._drag; if (!d) return;
    e.preventDefault();
    if (d.kind === 'orbit') { this.turntable.rotation.y = d.base + (e.clientX - d.x) * 0.01; return; }
    if (d.kind === 'scale') {
      const proj = (e.clientX - d.sx) * d.dx + (e.clientY - d.sy) * d.dy;   // drag distance along the handle's outward axis
      const nv = Math.max(0.3, Math.min(2.8, d.startVal + proj * 0.012));
      if (d.type === 'leg') { const leg = this.bp.legs[d.idx]; if (!leg) return; leg[d.field] = nv; const p = this.bp.legs.find(l => l !== leg && l.pair === leg.pair); if (p) p[d.field] = nv; }
      else { const bl = this.bp.blobs[d.idx]; if (!bl) return; bl[d.field] = nv; }
      this._apply(); return;
    }
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
  _onUp() { if (!this._drag) return; const k = this._drag.kind; this._drag = null; if (k === 'leg' || k === 'blob' || k === 'shape' || k === 'scale') { fb.tick(); this._renderBar(); } }

  // ── foot-path popover (MOVE) ────────────────────────────────────────────────
  // The full IK editor from the manual (Ch12): drag points, tap empty space to
  // ADD a point (inserted into the nearest segment so the loop stays sensible),
  // and REMOVE the selected point. More points on the back-stroke = a slower,
  // stronger push; fewer on the swing = a quick recovery.
  _openPath() {
    const leg = this._sel && this._sel.type === 'leg' && this.bp.legs[this._sel.idx]; if (!leg) return;
    if (!Array.isArray(leg.path)) leg.path = defaultPath();
    let selPt = 0;
    const pop = document.createElement('div'); pop.className = 'overlay path-pop';
    pop.innerHTML = `<div class="path-card">
      <div class="bar"><b>FOOT PATH</b><span class="path-tools"><button class="mini-btn" data-rm>REMOVE PT</button><button class="mini-btn" data-x>DONE</button></span></div>
      <div class="path-pad"><span class="pad-ax pad-fwd">◀ back · fwd ▶</span><span class="pad-ax pad-up">lift ▲</span><span class="pad-ground">ground</span></div>
      <div class="deck-note">drag points · tap empty space to ADD · low &amp; sweeping BACK drives it</div></div>`;
    const pad = pop.querySelector('.path-pad');
    const xy = (ev) => { const r = pad.getBoundingClientRect();
      return { f: Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width) * 2 - 1)),
               h: Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / r.height)) }; };
    const render = () => {
      pad.querySelectorAll('.path-dot, .path-link').forEach(n => n.remove());
      const pts = leg.path;
      // connecting links (so you can see the loop the foot traces)
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const ax = (a.f + 1) / 2 * 100, ay = (1 - a.h) * 100, bx = (b.f + 1) / 2 * 100, by = (1 - b.h) * 100;
        const link = document.createElement('div'); link.className = 'path-link';
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        link.style.left = ax + '%'; link.style.top = ay + '%'; link.style.width = len + '%';
        link.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        pad.appendChild(link);
      }
      pts.forEach((pt, i) => {
        const dot = document.createElement('div'); dot.className = 'path-dot' + (i === selPt ? ' sel' : ''); dot.textContent = i + 1;
        dot.style.left = `${(pt.f + 1) / 2 * 100}%`; dot.style.top = `${(1 - pt.h) * 100}%`;
        let drag = false;
        dot.addEventListener('pointerdown', ev => { drag = true; selPt = i; dot.setPointerCapture?.(ev.pointerId); ev.preventDefault(); ev.stopPropagation(); render(); });
        dot.addEventListener('pointermove', ev => { if (!drag) return; const p = xy(ev); pt.f = p.f; pt.h = p.h;
          dot.style.left = `${(pt.f + 1) / 2 * 100}%`; dot.style.top = `${(1 - pt.h) * 100}%`; this._apply(); });
        dot.addEventListener('pointerup', ev => { drag = false; dot.releasePointerCapture?.(ev.pointerId); fb.tick(); render(); });
        pad.appendChild(dot);
      });
    };
    // tap empty pad space → insert a point into the nearest segment
    pad.addEventListener('pointerdown', ev => {
      if (ev.target !== pad && !ev.target.classList.contains('path-link') && !ev.target.classList.contains('pad-ax') && !ev.target.classList.contains('pad-ground')) return;
      const p = xy(ev), pts = leg.path; let best = 0, bd = 1e9;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], mf = (a.f + b.f) / 2, mh = (a.h + b.h) / 2;
        const d = Math.hypot(mf - p.f, mh - p.h); if (d < bd) { bd = d; best = i; }
      }
      pts.splice(best + 1, 0, p); selPt = best + 1; this._pushUndo(); this._apply(); fb.confirm(); render();
    });
    pop.querySelector('[data-rm]').addEventListener('click', () => {
      if (leg.path.length <= 3) { if (this._helper) guide.pop('A path needs at least 3 points.'); return; }
      leg.path.splice(selPt, 1); selPt = Math.max(0, selPt - 1); this._pushUndo(); this._apply(); fb.press(); render();
    });
    pop.querySelector('[data-x]').addEventListener('click', () => { fb.press(); pop.remove(); });
    this.mount.appendChild(pop);
    render();
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
