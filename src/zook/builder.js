/**
 * builder.js — the Workshop.
 *
 * The Zook stands on a slowly turning turntable, centre-stage, with the red
 * direction arrow visible (as in the Zook Kit). A slim deck of tactile controls
 * — grouped into SHAPE / LEGS / PAINT pages — tunes it live. One TEST button
 * sends it to the table. Sleek and minimal, with retro-hardware quirks.
 */

import * as THREE from 'three';
import { Zook, defaultBlueprint } from './model.js';
import { Knob, Switch, HueSlider } from './controls.js';
import { setCamera } from '../engine/renderer.js';

export class Builder {
  /** @param {{ scene:THREE.Scene, mount:HTMLElement, onTest:(bp:object)=>void }} o */
  constructor({ scene, mount, onTest }) {
    this.scene = scene; this.mount = mount; this.onTest = onTest;
    this.bp = defaultBlueprint();
    this.zook = null; this.turntable = null; this._deck = null;
    this._spin = 0; this._walk = true; this._page = 'shape';
  }

  enter(blueprint) {
    if (blueprint) this.bp = { ...blueprint };

    this.turntable = new THREE.Group();
    this.scene.add(this.turntable);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.3, 56),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7, metalness: 0.0 }),
    );
    plinth.position.y = -0.15; plinth.receiveShadow = true;
    this.turntable.add(plinth);

    this.zook = new Zook(this.bp, { preview: true, showArrow: true });
    this.turntable.add(this.zook.group);

    setCamera({ x: 0, y: 2.0, z: 4.6 }, { x: 0, y: 0.4, z: 0 }, true);
    this._buildDeck();
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

  // ── deck UI ─────────────────────────────────────────────────────────────────
  _buildDeck() {
    const deck = document.createElement('div');
    deck.className = 'deck';

    const head = document.createElement('div');
    head.className = 'deck-head';
    head.innerHTML = `<span class="brand"><b>Zook</b>&#8202;Kit</span><span class="led"></span>`;
    deck.appendChild(head);

    // Page tabs (retro tab switch).
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    const pages = { shape: 'SHAPE', legs: 'LEGS', paint: 'PAINT' };
    const body = document.createElement('div'); body.className = 'deck-body';
    const renderPage = () => {
      body.innerHTML = '';
      tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.p === this._page));
      (this._builders[this._page] || (() => {}))(body);
    };
    Object.entries(pages).forEach(([p, label]) => {
      const t = document.createElement('button'); t.className = 'tab'; t.dataset.p = p; t.textContent = label;
      t.addEventListener('click', () => { this._page = p; renderPage(); });
      tabs.appendChild(t);
    });
    deck.append(tabs, body);

    // Footer: WALK switch + TEST.
    const foot = document.createElement('div'); foot.className = 'deck-foot';
    const walk = Switch({ label: 'WALK', value: this._walk, onChange: v => { this._walk = v; } });
    const test = document.createElement('button'); test.className = 'test-btn'; test.textContent = 'TEST ▶';
    test.addEventListener('click', () => this.onTest(this.bp));
    foot.append(walk.root, test);
    deck.appendChild(foot);

    this.mount.appendChild(deck);
    this._deck = deck;
    renderPage();
  }

  get _builders() {
    const K = (o) => Knob(o).root;
    const apply = () => this._apply();
    return {
      shape: (el) => {
        const row = document.createElement('div'); row.className = 'knob-row';
        row.append(
          K({ label: 'LENGTH', min: 1.0, max: 3.2, step: 0.1, value: this.bp.len,    onChange: v => { this.bp.len = v; apply(); } }),
          K({ label: 'WIDTH',  min: 0.5, max: 1.8, step: 0.05, value: this.bp.width,  onChange: v => { this.bp.width = v; apply(); } }),
          K({ label: 'HEIGHT', min: 0.4, max: 1.4, step: 0.05, value: this.bp.height, onChange: v => { this.bp.height = v; apply(); } }),
          K({ label: 'SQUARE', min: 0,   max: 1,   step: 0.05, value: this.bp.square, format: v => `${Math.round(v * 100)}`, onChange: v => { this.bp.square = v; apply(); } }),
          K({ label: 'POINTY', min: 0,   max: 1,   step: 0.05, value: this.bp.pointy, format: v => `${Math.round(v * 100)}`, onChange: v => { this.bp.pointy = v; apply(); } }),
        );
        el.appendChild(row);
      },
      legs: (el) => {
        const row = document.createElement('div'); row.className = 'knob-row';
        row.append(
          K({ label: 'LEGS',   min: 1, max: 4, step: 1, value: this.bp.legPairs, format: v => `${Math.round(v)}pr`, onChange: v => { this.bp.legPairs = v; apply(); } }),
          K({ label: 'LEG LEN',min: 0.35, max: 1.2, step: 0.05, value: this.bp.legLen, onChange: v => { this.bp.legLen = v; apply(); } }),
          K({ label: 'SPEED',  min: 1, max: 4, step: 0.1, value: this.bp.speed,  onChange: v => { this.bp.speed = v; apply(); } }),
          K({ label: 'STRIDE', min: 0.3, max: 1.3, step: 0.05, value: this.bp.stride, onChange: v => { this.bp.stride = v; apply(); } }),
        );
        el.appendChild(row);
      },
      paint: (el) => {
        const hue  = HueSlider({ label: 'BODY COLOUR', value: this.bp.hue,     onChange: v => { this.bp.hue = v; apply(); } });
        const feet = HueSlider({ label: 'FEET COLOUR', value: this.bp.footHue, onChange: v => { this.bp.footHue = v; apply(); } });
        el.append(hue.root, feet.root);
      },
    };
  }
}
