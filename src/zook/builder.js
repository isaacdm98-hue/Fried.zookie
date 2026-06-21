/**
 * builder.js — the Workshop (the Zook Kit).
 *
 * The Zook turns centre-stage with its red direction arrow while a deck of
 * tactile controls — SHAPE / ADD / MOVE / PAINT (covering the manual's Forming
 * a Body, Add menu, Movement and Colour chapters) — tunes it live. SAVE stores
 * it to your roster; TEST sends it to the test table. Styled like a Teenage
 * Engineering device; guided by the animalese mascot.
 */

import * as THREE from 'three';
import { Zook, defaultBlueprint, makeLeg, newPairId, ensureLegs } from './model.js';
import { Knob, Switch, HueSlider, Selector } from './controls.js';
import { setCamera } from '../engine/renderer.js';
import { saveZook } from './library.js';
import { guide, TIPS } from '../sys/guide.js';
import { fb } from '../sys/feedback.js';

export class Builder {
  /** @param {{ scene, mount, camera, canvas, onTest, onBack }} o */
  constructor({ scene, mount, camera, canvas, onTest, onBack }) {
    this.scene = scene; this.mount = mount; this.camera = camera; this.canvas = canvas;
    this.onTest = onTest; this.onBack = onBack;
    this._ray = new THREE.Raycaster(); this._drag = null; this._spinPaused = false;
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this.bp = defaultBlueprint();
    this.name = 'My Zook';
    this.zook = null; this.turntable = null; this._deck = null;
    this._spin = 0; this._walk = true; this._page = 'shape'; this._open = true;
    this._undo = []; this._redo = [];
    this._selLeg = 0;        // selected leg index
    this._mirror = true;     // mirror toggle (on by default)
    this._addSide = 1;       // side for new legs when mirror is off
  }

  enter(blueprint, name) {
    if (blueprint) this.bp = { ...blueprint };
    if (name) this.name = name;
    ensureLegs(this.bp);
    this._selLeg = 0;

    this.turntable = new THREE.Group();
    this.scene.add(this.turntable);
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.3, 56),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7 }),
    );
    plinth.position.y = -0.15; plinth.receiveShadow = true;
    this.turntable.add(plinth);

    this.turntable.position.y = 0.5;     // lift the stage so the deck never hides it
    this.zook = new Zook(this.bp, { preview: true, showArrow: true });
    this.turntable.add(this.zook.group);

    setCamera({ x: 0, y: 2.4, z: 4.6 }, { x: 0, y: 1.0, z: 0 }, true);
    this._buildPanel();
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', this._onPointerDown);
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);
    }
    guide.now(TIPS.build);
  }

  exit() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this._onPointerDown);
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
    }
    this._drag = null;
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this.turntable) { this.scene.remove(this.turntable); this.turntable = null; }
    if (this._deck) { this._deck.remove(); this._deck = null; }
  }

  update(dt) {
    // Stop the turntable while you're working on legs (ADD/PATH) or dragging, so
    // you can touch-drag parts precisely; otherwise it slowly turns to show off.
    this._spinPaused = this._drag != null || (this._open && (this._page === 'add' || this._page === 'path'));
    if (!this._spinPaused) this._spin += dt * 0.5;
    if (this.turntable) this.turntable.rotation.y = this._spin;
    if (this.zook) { this.zook.step(dt, { walk: this._walk }); this.zook.syncMeshes(); }
  }

  // ── direct touch manipulation: tap a leg to select it, drag it along the body
  // (its mirror partner follows). Mirrors the Zook Kit's drag-to-place parts.
  _toScreen(x, y, z) {
    const v = new THREE.Vector3(x, y, z);
    this.zook.group.localToWorld(v); v.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * r.width + r.left, y: (-v.y * 0.5 + 0.5) * r.height + r.top };
  }

  _pickLeg(e) {
    if (!this.zook) return -1;
    const r = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    this._ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const hits = this._ray.intersectObjects(this.zook.group.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) { if (o.userData && o.userData.legIndex != null) return o.userData.legIndex; o = o.parent; }
    }
    return -1;
  }

  _onPointerDown(e) {
    const idx = this._pickLeg(e);
    if (idx < 0) return;
    e.preventDefault();
    this._selLeg = idx;
    if (!this._open || (this._page !== 'add' && this._page !== 'path')) { this._page = 'add'; this._open = true; }
    this._renderPage();
    const leg = this.bp.legs[idx];
    const x = leg.side * this.bp.width * 0.4, y = -this.bp.height * 0.32;
    this._drag = { idx, A: this._toScreen(x, y, -this.bp.len * 0.46), B: this._toScreen(x, y, this.bp.len * 0.46) };
    fb.tick();
  }

  _onPointerMove(e) {
    if (!this._drag) return;
    const { A, B } = this._drag;
    const abx = B.x - A.x, aby = B.y - A.y, len2 = abx * abx + aby * aby || 1;
    let t = ((e.clientX - A.x) * abx + (e.clientY - A.y) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const along = Math.round((-1 + t * 2) * 20) / 20;
    const leg = this.bp.legs[this._drag.idx]; if (!leg) return;
    leg.along = along;
    const partner = this.bp.legs.find(l => l !== leg && l.pair === leg.pair);
    if (partner) partner.along = along;            // mirrored legs move together
    this._apply();
  }

  _onPointerUp() {
    if (!this._drag) return;
    this._drag = null; fb.tick(); this._refresh();
  }

  _apply() { if (this.zook) this.zook.setBlueprint(this.bp); }

  // Coach the build from the real Zook Kit fix-it table (research paper, Table 2:
  // "Possible Zook Problems and Solutions"). Returns the single most useful tip.
  _diagnose() {
    const bp = this.bp, legs = bp.legs || [];
    const L = legs.filter(l => l.side < 0).length, R = legs.filter(l => l.side > 0).length;
    if (!legs.length) return "No legs yet — add some on the ADD page or your Zook just sits there!";
    if (legs.length < 2) return "One leg won't do — it'll just flop about. Add more, on both sides!";
    if (L === 0 || R === 0) return "All the legs are on one side — mirror them or it'll topple straight over.";
    if (bp.width < 0.9) return "It's narrow and will tip — widen the body for a stable stance.";
    const phases = new Set(legs.map(l => Math.round((l.cycle || 0) * 12)));
    if (phases.size < 2) return "Every leg steps together — stagger each leg's CYCLE so it doesn't limp or hop.";
    if (bp.stride < 0.5) return "Small steps! Raise STRIDE on the MOVE page for a longer step.";
    if (legs.every(l => l.len < 0.6) && bp.len > 2.2) return "Legs look short for that long body — lengthen them for a bigger stride.";
    if (bp.speed < 2) return "It'll walk, not run — raise SPEED to quicken the gait cycle.";
    return "Looking sharp! Send it to the test table and see how it scurries.";
  }
  _pushUndo() { this._undo.push({ ...this.bp }); if (this._undo.length > 30) this._undo.shift(); this._redo.length = 0; }

  // ── panel UI (a left tool-rail with fly-out controls, like a drawing app) ────
  // The viewport stays clear: tools live on a thin left rail; tapping one opens
  // a translucent fly-out beside it (tap again or × to close). The Zook pans to
  // the right so the open panel never covers what you're building.
  _buildPanel() {
    const wrap = document.createElement('div'); wrap.className = 'bpanel';
    wrap.innerHTML = `
      <div class="btopbar">
        <button class="b-back" title="Back"><img src="./assets/btn-back.png" alt="Back"/></button>
        <input class="name-in" value="${this.name}" maxlength="14" />
        <button class="b-walk" title="Walk in place">WALK</button>
        <button class="b-save" title="Save"><img src="./assets/btn-check.png" alt="Save"/></button>
        <button class="b-test">TEST ▶</button>
      </div>
      <div class="brail"></div>
      <div class="bfly">
        <div class="bfly-head"><span class="bfly-title"></span><button class="bfly-x" title="Close">×</button></div>
        <div class="bfly-body deck"></div>
      </div>`;
    this.mount.appendChild(wrap); this._deck = wrap;

    wrap.querySelector('.b-back').addEventListener('click', () => { fb.press(); this.onBack(); });
    wrap.querySelector('.name-in').addEventListener('input', e => { this.name = e.target.value || 'My Zook'; });
    wrap.querySelector('.b-save').addEventListener('click', () => { saveZook(this.name, this.bp); fb.confirm(); guide.now(`Saved ${this.name}! A fine specimen.`); });
    wrap.querySelector('.b-test').addEventListener('click', () => { fb.press(); guide.now(this._diagnose()); this.onTest(this.bp, this.name); });
    const walkBtn = wrap.querySelector('.b-walk');
    const setWalk = () => walkBtn.classList.toggle('on', this._walk); setWalk();
    walkBtn.addEventListener('click', () => { this._walk = !this._walk; setWalk(); fb.tick(); });

    const rail = wrap.querySelector('.brail');
    const fly = wrap.querySelector('.bfly');
    const flyBody = wrap.querySelector('.bfly-body');
    const flyTitle = wrap.querySelector('.bfly-title');
    const pages = { shape: 'SHAPE', add: 'ADD', path: 'PATH', move: 'MOVE', paint: 'PAINT' };
    const icons = { shape: '●', add: '＋', path: '∿', move: '➜', paint: '✦' };

    const render = () => {
      flyTitle.textContent = pages[this._page] || '';
      flyBody.innerHTML = '';
      if (this._open) this._builders[this._page](flyBody);
      rail.querySelectorAll('.btool').forEach(t => t.classList.toggle('on', t.dataset.p === this._page && this._open));
      fly.classList.toggle('open', this._open);
      this._panCam(this._open);
      if (this.zook) this.zook.setHighlight((this._open && (this._page === 'add' || this._page === 'path')) ? Math.min(this._selLeg, this.bp.legs.length - 1) : -1);
    };

    Object.entries(pages).forEach(([p, label]) => {
      const t = document.createElement('button'); t.className = 'btool'; t.dataset.p = p;
      t.innerHTML = `<b>${icons[p]}</b><i>${label}</i>`;
      t.addEventListener('click', () => { fb.tick(); if (this._open && this._page === p) this._open = false; else { this._page = p; this._open = true; } render(); });
      rail.appendChild(t);
    });
    const undo = document.createElement('button'); undo.className = 'btool b-undo'; undo.innerHTML = '<b>↶</b><i>UNDO</i>';
    undo.addEventListener('click', () => { if (this._undo.length) { this._redo.push({ ...this.bp }); this.bp = this._undo.pop(); this._apply(); this._refresh(); fb.press(); } });
    rail.appendChild(undo);
    wrap.querySelector('.bfly-x').addEventListener('click', () => { fb.tick(); this._open = false; render(); });

    this._renderPage = render;
    render();
  }

  // Pan the camera right while the panel is open so the model stays visible.
  _panCam(open) {
    const x = open ? -1.5 : 0;
    setCamera({ x, y: 2.4, z: 4.6 }, { x, y: 1.0, z: 0 }, true);
  }

  _refresh() { if (this._renderPage) this._renderPage(); const n = this._deck?.querySelector('.name-in'); if (n && document.activeElement !== n) n.value = this.name; }

  // ── leg-part operations (Add menu) ────────────────────────────────────────
  _addLeg() {
    this._pushUndo();
    const legs = this.bp.legs;
    const src = legs[this._selLeg] || { len: 0.72, thick: this.bp.legThick, style: 'crawl', along: 0 };
    if (this._mirror) {
      const pair = newPairId();
      legs.push(makeLeg( 1, 0, { len: src.len, thick: src.thick, style: src.style, cycle: 0, pair }));
      legs.push(makeLeg(-1, 0, { len: src.len, thick: src.thick, style: src.style, cycle: 0.5, pair }));
      this._selLeg = legs.length - 2;
    } else {
      legs.push(makeLeg(this._addSide, 0, { len: src.len, thick: src.thick, style: src.style, cycle: 0 }));
      this._selLeg = legs.length - 1;
    }
    this._apply(); this._refresh(); fb.confirm();
  }

  _delLeg() {
    const legs = this.bp.legs;
    if (!legs.length) return;
    this._pushUndo();
    const leg = legs[this._selLeg];
    const remove = this._mirror ? (l => l.pair === leg.pair) : (l => l === leg);
    this.bp.legs = legs.filter(l => !remove(l));
    this._selLeg = Math.max(0, this._selLeg - 1);
    this._apply(); this._refresh();
  }

  _editLeg(key, val, refresh = false, cycleOnly = false) {
    const legs = this.bp.legs, leg = legs[this._selLeg];
    if (!leg) return;
    leg[key] = val;
    // Mirror geometry edits to the partner; cycle and side stay per-leg.
    if (this._mirror && !cycleOnly && key !== 'side') {
      const partner = legs.find(l => l !== leg && l.pair === leg.pair);
      if (partner) partner[key] = val;
    }
    this._apply();
    if (refresh) this._refresh();
  }

  get _builders() {
    const K = (o) => Knob(o).root;
    const set = (k, v) => { this._pushUndo(); this.bp[k] = v; this._apply(); };
    return {
      shape: (el) => {
        const r1 = document.createElement('div'); r1.className = 'knob-row';
        r1.append(
          K({ label: 'LENGTH', min: 1.0, max: 3.2, step: 0.1, value: this.bp.len,    onChange: v => set('len', v) }),
          K({ label: 'WIDTH',  min: 0.5, max: 1.8, step: 0.05, value: this.bp.width,  onChange: v => set('width', v) }),
          K({ label: 'HEIGHT', min: 0.4, max: 1.4, step: 0.05, value: this.bp.height, onChange: v => set('height', v) }),
          K({ label: 'SQUARE', min: 0, max: 1, step: 0.05, value: this.bp.square, format: v => `${Math.round(v * 100)}`, onChange: v => set('square', v) }),
          K({ label: 'POINTY', min: 0, max: 1, step: 0.05, value: this.bp.pointy, format: v => `${Math.round(v * 100)}`, onChange: v => set('pointy', v) }),
        );
        const r2 = document.createElement('div'); r2.className = 'knob-row';
        r2.append(
          K({ label: 'FLAT END',  min: 0, max: 1, step: 0.05, value: this.bp.flatEnd,  format: v => `${Math.round(v * 100)}`, onChange: v => set('flatEnd', v) }),
          K({ label: 'FLAT SIDE', min: 0, max: 1, step: 0.05, value: this.bp.flatSide, format: v => `${Math.round(v * 100)}`, onChange: v => set('flatSide', v) }),
        );
        el.append(r1, r2);
      },
      add: (el) => {
        const legs = this.bp.legs;
        const btn = (t, fn) => { const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = t; b.addEventListener('click', () => { fb.press(); fn(); }); return b; };
        const mir = Switch({ label: 'MIRROR', value: this._mirror, onChange: v => { this._mirror = v; this._refresh(); } });
        // Empty Zook: just prompt to add the first legs.
        if (!legs.length) {
          const tb0 = document.createElement('div'); tb0.className = 'leg-tools';
          tb0.append(btn('+ LEG', () => this._addLeg()));
          const note0 = document.createElement('div'); note0.className = 'deck-note';
          note0.textContent = 'no legs yet — add some to make your Zook move';
          el.append(tb0, mir.root, note0); return;
        }
        this._selLeg = Math.max(0, Math.min(this._selLeg, legs.length - 1));
        const leg = legs[this._selLeg];

        // Toolbar: select ◀ ▶ · add · delete.
        const tb = document.createElement('div'); tb.className = 'leg-tools';
        const lbl = document.createElement('span'); lbl.className = 'leg-count'; lbl.textContent = `LEG ${this._selLeg + 1}/${legs.length}`;
        tb.append(
          btn('◀', () => { this._selLeg = (this._selLeg - 1 + legs.length) % legs.length; this._refresh(); }),
          lbl,
          btn('▶', () => { this._selLeg = (this._selLeg + 1) % legs.length; this._refresh(); }),
          btn('+ LEG', () => this._addLeg()),
          btn('DEL', () => this._delLeg()),
        );

        const style = Selector({ label: 'LEG PART', value: leg.style,
          options: [{ v: 'crawl', t: 'CRAWL' }, { v: 'paddle', t: 'PADDLE' }, { v: 'stalk', t: 'STALK' },
                    { v: 'step', t: 'STEP' }, { v: 'stomp', t: 'STOMP' }, { v: 'push', t: 'PUSH' }, { v: 'flipper', t: 'FLIP' }],
          onChange: v => this._editLeg('style', v, true) });

        const r = document.createElement('div'); r.className = 'knob-row';
        if (!this._mirror) r.append(K({ label: 'SIDE', min: -1, max: 1, step: 2, value: leg.side, format: v => v < 0 ? 'L' : 'R', onChange: v => this._editLeg('side', v < 0 ? -1 : 1, true) }));
        r.append(
          K({ label: 'ALONG',  min: -1, max: 1, step: 0.05, value: leg.along, format: v => v.toFixed(2), onChange: v => this._editLeg('along', v) }),
          K({ label: 'LENGTH', min: 0.35, max: 1.2, step: 0.05, value: leg.len, onChange: v => this._editLeg('len', v) }),
          K({ label: 'THICK',  min: 0.1, max: 0.32, step: 0.02, value: leg.thick, onChange: v => this._editLeg('thick', v) }),
          K({ label: 'CYCLE',  min: 0, max: 1, step: 0.05, value: leg.cycle, format: v => v.toFixed(2), onChange: v => this._editLeg('cycle', v, false, true) }),
        );

        const setR = (k, v) => { set(k, v); this._refresh(); };
        const aimOpts = [{ v: 'off', t: 'OFF' }, { v: 'normal', t: 'AWAY' }, { v: 'inverted', t: 'TOWARD' }];
        const toggles = document.createElement('div'); toggles.className = 'deck-foot';
        toggles.append(Switch({ label: 'ANTENNAE', value: this.bp.antennae, onChange: v => setR('antennae', v) }).root,
                       Switch({ label: 'TAIL', value: this.bp.tail, onChange: v => setR('tail', v) }).root);
        const note = document.createElement('div'); note.className = 'deck-note';
        note.textContent = this._mirror ? 'MIRROR on — edits both sides · CYCLE is per-leg' : 'MIRROR off — placing single legs';
        el.append(tb, mir.root, style.root, r, toggles);
        // Part Targeting (manual Ch13) for the decorative parts.
        if (this.bp.antennae) el.append(Selector({ label: 'ANT AIM', value: this.bp.antTarget || 'normal', options: aimOpts, onChange: v => set('antTarget', v) }).root);
        if (this.bp.tail) el.append(Selector({ label: 'TAIL AIM', value: this.bp.tailTarget || 'off', options: aimOpts, onChange: v => set('tailTarget', v) }).root);
        el.append(note);
      },
      path: (el) => {
        const legs = this.bp.legs;
        if (!legs.length) { const n = document.createElement('div'); n.className = 'deck-note'; n.textContent = 'add a leg on the ADD page first, then shape its step here'; el.append(n); return; }
        this._selLeg = Math.max(0, Math.min(this._selLeg, legs.length - 1));
        const leg = legs[this._selLeg];

        const tb = document.createElement('div'); tb.className = 'leg-tools';
        const btn = (t, fn) => { const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = t; b.addEventListener('click', () => { fb.press(); fn(); }); return b; };
        const lbl = document.createElement('span'); lbl.className = 'leg-count'; lbl.textContent = `FOOT PATH · LEG ${this._selLeg + 1}/${legs.length}`;
        tb.append(
          btn('◀', () => { this._selLeg = (this._selLeg - 1 + legs.length) % legs.length; this._refresh(); }),
          lbl,
          btn('▶', () => { this._selLeg = (this._selLeg + 1) % legs.length; this._refresh(); }),
        );

        const move = Selector({ label: 'MOVEMENT', value: leg.move,
          options: [{ v: 'two', t: 'TWO-PART' }, { v: 'single', t: 'SINGLE' }],
          onChange: v => { this._pushUndo(); leg.move = v; this._apply(); this._refresh(); } });
        const mtype = Selector({ label: 'TURN ROLE', value: leg.moveType || 'auto',
          options: [{ v: 'auto', t: 'AUTO' }, { v: 'always', t: 'ALWAYS' }, { v: 'left', t: 'LEFT' }, { v: 'right', t: 'RIGHT' }],
          onChange: v => { this._pushUndo(); leg.moveType = v; this._apply(); } });

        // Draggable IK pad: x = fore/aft, y = lift. Drag the numbered points.
        const pad = document.createElement('div'); pad.className = 'path-pad';
        pad.innerHTML = `<span class="pad-ax pad-fwd">◀ back · fwd ▶</span><span class="pad-ax pad-up">lift ▲</span><span class="pad-ground">ground</span>`;
        const place = (dot, pt) => { dot.style.left = `${(pt.f + 1) / 2 * 100}%`; dot.style.top = `${(1 - pt.h) * 100}%`; };
        leg.path.forEach((pt, i) => {
          const dot = document.createElement('div'); dot.className = 'path-dot'; dot.textContent = i + 1; place(dot, pt);
          let drag = false;
          dot.addEventListener('pointerdown', e => { drag = true; dot.setPointerCapture?.(e.pointerId); e.preventDefault(); });
          dot.addEventListener('pointermove', e => {
            if (!drag) return;
            const r = pad.getBoundingClientRect();
            pt.f = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
            pt.h = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
            place(dot, pt); this._apply();
          });
          dot.addEventListener('pointerup', e => { drag = false; dot.releasePointerCapture?.(e.pointerId); fb.tick(); });
          pad.appendChild(dot);
        });
        const note = document.createElement('div'); note.className = 'deck-note';
        note.textContent = 'drag the foot path — points low & moving back PUSH the Zook along';
        el.append(tb, move.root, mtype.root, pad, note);
      },
      move: (el) => {
        const r = document.createElement('div'); r.className = 'knob-row';
        r.append(
          K({ label: 'SPEED',  min: 1, max: 4, step: 0.1, value: this.bp.speed,  onChange: v => set('speed', v) }),
          K({ label: 'STRIDE', min: 0.3, max: 1.3, step: 0.05, value: this.bp.stride, onChange: v => set('stride', v) }),
          K({ label: 'FOOT',   min: 0, max: 0.6, step: 0.05, value: this.bp.footAngle, format: v => v.toFixed(2), onChange: v => set('footAngle', v) }),
          K({ label: 'STIFF',  min: 0.5, max: 2, step: 0.1, value: this.bp.stiffness, format: v => v.toFixed(1), onChange: v => set('stiffness', v) }),
          K({ label: 'TURN',   min: 0.5, max: 3, step: 0.1, value: this.bp.turnSharp, onChange: v => set('turnSharp', v) }),
          K({ label: 'SMOOTH', min: 0, max: 1, step: 0.05, value: this.bp.turnSmooth, format: v => `${Math.round(v * 100)}`, onChange: v => set('turnSmooth', v) }),
          K({ label: 'AIM', min: 0, max: 1.2, step: 0.1, value: this.bp.targetAngle != null ? this.bp.targetAngle : 0.5, format: v => v.toFixed(1), onChange: v => set('targetAngle', v) }),
        );
        const note = document.createElement('div'); note.className = 'deck-note';
        note.textContent = 'set each leg’s CYCLE on the ADD page to stagger the gait · AIM is the Part Targeting angle';
        el.append(r, note);
      },
      paint: (el) => {
        // Modern colour swatches — quick-pick a body+feet colour.
        const sw = document.createElement('div'); sw.className = 'swatches';
        [0.02, 0.07, 0.13, 0.22, 0.33, 0.45, 0.55, 0.63, 0.74, 0.88, 0.95].forEach(h => {
          const b = document.createElement('button'); b.className = 'swatch';
          b.style.background = `hsl(${h * 360},72%,55%)`;
          b.addEventListener('click', () => { this._pushUndo(); this.bp.hue = h; this.bp.footHue = h; this._apply(); fb.tick(); this._refresh(); });
          sw.appendChild(b);
        });
        const hue  = HueSlider({ label: 'BODY COLOUR', value: this.bp.hue,     onChange: v => set('hue', v) });
        const feet = HueSlider({ label: 'FEET COLOUR', value: this.bp.footHue, onChange: v => set('footHue', v) });
        const pat = Selector({ label: 'PATTERN', value: this.bp.pattern,
          options: [{ v: 'none', t: 'PLAIN' }, { v: 'stripes', t: 'STRIPES' }, { v: 'spots', t: 'SPOTS' },
                    { v: 'dots', t: 'DOTS' }, { v: 'checker', t: 'CHECK' }, { v: 'camo', t: 'CAMO' }, { v: 'plaster', t: 'SPECK' }],
          onChange: v => { this._pushUndo(); this.bp.pattern = v; this._apply(); } });
        const r2 = document.createElement('div'); r2.className = 'knob-row';
        r2.append(
          K({ label: 'BRIGHT', min: -1, max: 1, step: 0.1, value: this.bp.bright || 0, format: v => v.toFixed(1), onChange: v => set('bright', v) }),
          K({ label: 'TEX SIZE', min: 0.5, max: 3, step: 0.25, value: this.bp.patternScale || 1, format: v => v.toFixed(2), onChange: v => set('patternScale', v) }),
        );
        el.append(sw, hue.root, feet.root, pat.root, r2);
      },
    };
  }
}
