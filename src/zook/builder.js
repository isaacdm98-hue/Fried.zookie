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
  /** @param {{ scene, mount, onTest, onBack }} o */
  constructor({ scene, mount, onTest, onBack }) {
    this.scene = scene; this.mount = mount; this.onTest = onTest; this.onBack = onBack;
    this.bp = defaultBlueprint();
    this.name = 'My Zook';
    this.zook = null; this.turntable = null; this._deck = null;
    this._spin = 0; this._walk = true; this._page = 'shape';
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

    // Frame the Zook in the upper portion of the screen, clear of the deck.
    setCamera({ x: 0, y: 2.7, z: 4.4 }, { x: 0, y: 1.15, z: 0 }, true);
    this._buildDeck();
    guide.now(TIPS.build);
  }

  exit() {
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this.turntable) { this.scene.remove(this.turntable); this.turntable = null; }
    if (this._deck) { this._deck.remove(); this._deck = null; }
  }

  update(dt) {
    this._spin += dt * 0.5;
    if (this.turntable) this.turntable.rotation.y = this._spin;
    if (this.zook) { this.zook.step(dt, { walk: this._walk }); this.zook.syncMeshes(); }
  }

  _apply() { if (this.zook) this.zook.setBlueprint(this.bp); }
  _pushUndo() { this._undo.push({ ...this.bp }); if (this._undo.length > 30) this._undo.shift(); this._redo.length = 0; }

  // ── deck UI ─────────────────────────────────────────────────────────────────
  _buildDeck() {
    const deck = document.createElement('div'); deck.className = 'deck';
    deck.innerHTML = `
      <div class="deck-head">
        <button class="mini-btn" data-act="back">‹</button>
        <input class="name-in" value="${this.name}" maxlength="14" />
        <button class="mini-btn" data-act="collapse" title="Hide controls">▾</button>
      </div>`;
    deck.querySelector('[data-act=back]').addEventListener('click', () => { fb.press(); this.onBack(); });
    deck.querySelector('.name-in').addEventListener('input', e => { this.name = e.target.value || 'My Zook'; });
    const collapseBtn = deck.querySelector('[data-act=collapse]');
    collapseBtn.addEventListener('click', () => {
      fb.tick();
      const c = deck.classList.toggle('collapsed');
      collapseBtn.textContent = c ? '▴' : '▾';
    });

    // Tabs.
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    const body = document.createElement('div'); body.className = 'deck-body';
    const pages = { shape: 'SHAPE', add: 'ADD', move: 'MOVE', paint: 'PAINT' };
    const render = () => {
      body.innerHTML = '';
      tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.p === this._page));
      this._builders[this._page](body);
      if (this.zook) this.zook.setHighlight(this._page === 'add' ? Math.min(this._selLeg, this.bp.legs.length - 1) : -1);
      if (TIPS[this._page] && this._lastTipPage !== this._page) { this._lastTipPage = this._page; guide.now(TIPS[this._page]); }
    };
    Object.entries(pages).forEach(([p, label]) => {
      const t = document.createElement('button'); t.className = 'tab'; t.dataset.p = p; t.textContent = label;
      t.addEventListener('click', () => { fb.tick(); this._page = p; render(); });
      tabs.appendChild(t);
    });
    deck.append(tabs, body);

    // Footer: UNDO · WALK · SAVE · TEST.
    const foot = document.createElement('div'); foot.className = 'deck-foot';
    const undo = document.createElement('button'); undo.className = 'mini-btn'; undo.textContent = '↶';
    undo.addEventListener('click', () => { if (this._undo.length) { this._redo.push({ ...this.bp }); this.bp = this._undo.pop(); this._apply(); this._refresh(); fb.press(); } });
    const walk = Switch({ label: 'WALK', value: this._walk, onChange: v => { this._walk = v; } });
    const save = document.createElement('button'); save.className = 'mini-btn save-btn';
    save.innerHTML = `<img src="./assets/btn-check.png" alt=""/>SAVE`;
    save.addEventListener('click', () => { saveZook(this.name, this.bp); fb.confirm(); guide.now(`Saved ${this.name}! A fine specimen.`); });
    const test = document.createElement('button'); test.className = 'test-btn'; test.textContent = 'TEST ▶';
    test.addEventListener('click', () => { fb.press(); this.onTest(this.bp, this.name); });
    foot.append(undo, walk.root, save, test);
    deck.appendChild(foot);

    this.mount.appendChild(deck);
    this._deck = deck;
    this._tabsEl = tabs; this._bodyEl = body; this._renderPage = render;
    render();
  }

  _refresh() { if (this._renderPage) this._renderPage(); const n = this._deck?.querySelector('.name-in'); if (n) n.value = this.name; }

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
    if (legs.length <= 1) { guide.now("Keep at least one leg, or it'll never move!"); return; }
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
        this._selLeg = Math.max(0, Math.min(this._selLeg, legs.length - 1));
        const leg = legs[this._selLeg] || legs[0];

        // Toolbar: select ◀ ▶ · add · delete.
        const tb = document.createElement('div'); tb.className = 'leg-tools';
        const btn = (t, fn) => { const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = t; b.addEventListener('click', () => { fb.press(); fn(); }); return b; };
        const lbl = document.createElement('span'); lbl.className = 'leg-count'; lbl.textContent = `LEG ${this._selLeg + 1}/${legs.length}`;
        tb.append(
          btn('◀', () => { this._selLeg = (this._selLeg - 1 + legs.length) % legs.length; this._refresh(); }),
          lbl,
          btn('▶', () => { this._selLeg = (this._selLeg + 1) % legs.length; this._refresh(); }),
          btn('+ LEG', () => this._addLeg()),
          btn('DEL', () => this._delLeg()),
        );

        const mir = Switch({ label: 'MIRROR', value: this._mirror, onChange: v => { this._mirror = v; this._refresh(); } });
        const style = Selector({ label: 'LEG PART', value: leg.style,
          options: [{ v: 'crawl', t: 'CRAWL' }, { v: 'paddle', t: 'PADDLE' }, { v: 'stalk', t: 'STALK' }],
          onChange: v => this._editLeg('style', v, true) });

        const r = document.createElement('div'); r.className = 'knob-row';
        if (!this._mirror) r.append(K({ label: 'SIDE', min: -1, max: 1, step: 2, value: leg.side, format: v => v < 0 ? 'L' : 'R', onChange: v => this._editLeg('side', v < 0 ? -1 : 1, true) }));
        r.append(
          K({ label: 'ALONG',  min: -1, max: 1, step: 0.05, value: leg.along, format: v => v.toFixed(2), onChange: v => this._editLeg('along', v) }),
          K({ label: 'LENGTH', min: 0.35, max: 1.2, step: 0.05, value: leg.len, onChange: v => this._editLeg('len', v) }),
          K({ label: 'THICK',  min: 0.1, max: 0.32, step: 0.02, value: leg.thick, onChange: v => this._editLeg('thick', v) }),
          K({ label: 'CYCLE',  min: 0, max: 1, step: 0.05, value: leg.cycle, format: v => v.toFixed(2), onChange: v => this._editLeg('cycle', v, false, true) }),
        );

        const toggles = document.createElement('div'); toggles.className = 'deck-foot';
        toggles.append(Switch({ label: 'ANTENNAE', value: this.bp.antennae, onChange: v => set('antennae', v) }).root,
                       Switch({ label: 'TAIL', value: this.bp.tail, onChange: v => set('tail', v) }).root);
        const note = document.createElement('div'); note.className = 'deck-note';
        note.textContent = this._mirror ? 'MIRROR on — edits both sides · CYCLE is per-leg' : 'MIRROR off — placing single legs';
        el.append(tb, mir.root, style.root, r, toggles, note);
      },
      move: (el) => {
        const r = document.createElement('div'); r.className = 'knob-row';
        r.append(
          K({ label: 'SPEED',  min: 1, max: 4, step: 0.1, value: this.bp.speed,  onChange: v => set('speed', v) }),
          K({ label: 'STRIDE', min: 0.3, max: 1.3, step: 0.05, value: this.bp.stride, onChange: v => set('stride', v) }),
          K({ label: 'FOOT',   min: 0, max: 0.6, step: 0.05, value: this.bp.footAngle, format: v => v.toFixed(2), onChange: v => set('footAngle', v) }),
          K({ label: 'TURN',   min: 0.5, max: 3, step: 0.1, value: this.bp.turnSharp, onChange: v => set('turnSharp', v) }),
          K({ label: 'SMOOTH', min: 0, max: 1, step: 0.05, value: this.bp.turnSmooth, format: v => `${Math.round(v * 100)}`, onChange: v => set('turnSmooth', v) }),
        );
        const note = document.createElement('div'); note.className = 'deck-note';
        note.textContent = 'set each leg’s CYCLE on the ADD page to stagger the gait';
        el.append(r, note);
      },
      paint: (el) => {
        const hue  = HueSlider({ label: 'BODY COLOUR', value: this.bp.hue,     onChange: v => set('hue', v) });
        const feet = HueSlider({ label: 'FEET COLOUR', value: this.bp.footHue, onChange: v => set('footHue', v) });
        const pat = Selector({ label: 'PATTERN', value: this.bp.pattern,
          options: [{ v: 'none', t: 'PLAIN' }, { v: 'stripes', t: 'STRIPES' }, { v: 'spots', t: 'SPOTS' }],
          onChange: v => { this._pushUndo(); this.bp.pattern = v; this._apply(); } });
        el.append(hue.root, feet.root, pat.root);
      },
    };
  }
}
