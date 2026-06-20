/**
 * workshop.js — WorkshopScene
 *
 * The creature-building workshop. The creature sits on a slowly-rotating
 * pedestal in the 3-D viewport; the synth-panel controls are a semi-transparent
 * HTML overlay.
 *
 * Layout:
 *   Mobile portrait  → controls slide up from bottom (max 40 % screen height)
 *   Landscape/tablet → controls float on the right (40 % width)
 *
 * The game loop is managed externally by main.js — WorkshopScene exposes
 * update(dt) and does NOT call startLoop itself.
 */

import * as THREE from 'three';
import { Zook }           from '../creature/builder.js';
import { cloneGenome, randomGenome, saveRoster } from '../creature/genome.js';
import { navigate }       from '../router.js';
import { S, setState }    from '../state.js';
import { haptic }         from '../ui/haptic.js';
import { setCamera, updateCamera } from '../engine/renderer.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const PANEL_ID       = 'workshop-panel';
const REBUILD_DELAY  = 150;   // ms debounce before rebuild on body/leg change

const PEDESTAL_RADIUS = 0.55;
const PEDESTAL_H      = 0.12;
const PEDESTAL_SPIN   = 0.25; // rad/s

// Orbit drag
const ORBIT_SENSITIVITY = 0.007;

export class WorkshopScene {
  /**
   * @param {{
   *   scene:    THREE.Scene,
   *   world:    import('@dimforge/rapier3d-compat').World,
   *   RAPIER:   any,
   *   renderer: THREE.WebGLRenderer,
   *   camera:   THREE.Camera,
   *   clock:    THREE.Clock,
   * }} opts
   */
  constructor({ scene, world, RAPIER, renderer, camera, clock }) {
    this._scene    = scene;
    this._world    = world;
    this._RAPIER   = RAPIER;
    this._renderer = renderer;
    this._camera   = camera;
    this._clock    = clock;

    this._genome      = null;
    this._zook        = null;
    this._pedestal    = null;
    this._pedestalRim = null;
    this._panel       = null;

    // Pedestal spin
    this._pedestalAngle = 0;

    // Orbit
    this._orbitTheta  = 0;
    this._orbitPhi    = 0.45;   // vertical angle (rad)
    this._orbitR      = 3.5;
    this._orbitTarget = new THREE.Vector3(0, 0.5, 0);
    this._dragging    = false;
    this._lastMouse   = { x: 0, y: 0 };

    // Rebuild debounce
    this._rebuildTimer = null;

    // Bound handlers
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp   = this._onPointerUp.bind(this);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Enter the workshop with the given genome.
   * @param {object} genome
   */
  enter(genome) {
    this._genome = cloneGenome(genome || S.activeGenome);

    // Build pedestal mesh
    this._buildPedestal();

    // Spawn creature preview (no physics — isPreview: true)
    this._spawnCreature();

    // Set up synth-panel HTML overlay
    this._buildPanel();

    // Wire orbit drag on the renderer's canvas
    const canvas = this._renderer.domElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup',   this._onPointerUp);

    // Camera start position
    this._updateCameraGoal(true);
  }

  exit() {
    // Remove drag listeners
    const canvas = this._renderer.domElement;
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup',   this._onPointerUp);

    this._disposeCreature();
    this._disposePedestal();
    this._removePanel();

    if (this._rebuildTimer) { clearTimeout(this._rebuildTimer); this._rebuildTimer = null; }
  }

  /** Per-frame update hook (called by main.js loop). */
  update(dt) {
    // Spin pedestal
    this._pedestalAngle += PEDESTAL_SPIN * dt;
    if (this._pedestal) {
      this._pedestal.rotation.y = this._pedestalAngle;
      if (this._pedestalRim) this._pedestalRim.rotation.z = this._pedestalAngle;
    }

    // Sync creature meshes (preview — no physics step needed)
    if (this._zook && typeof this._zook.syncMeshes === 'function') {
      this._zook.syncMeshes();
    }

    // Note: updateCamera(dt) called by main.js after update()
  }

  /** Dispose + respawn the creature (called after significant genome changes). */
  rebuildCreature() {
    this._disposeCreature();
    this._spawnCreature();
  }

  // ── Internal: creature ─────────────────────────────────────────────────────

  _spawnCreature() {
    this._zook = new Zook(
      this._genome,
      null,       // no world — preview mode
      null,       // no RAPIER — preview mode
      this._scene,
      { x: 0, z: 0, heading: 0, tint: null, isPreview: true }
    );
  }

  _disposeCreature() {
    if (this._zook) {
      if (typeof this._zook.dispose === 'function') this._zook.dispose();
      this._zook = null;
    }
  }

  // ── Internal: pedestal ────────────────────────────────────────────────────

  _buildPedestal() {
    const geo = new THREE.CylinderGeometry(PEDESTAL_RADIUS, PEDESTAL_RADIUS + 0.05, PEDESTAL_H, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2030,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0xf07800,
      emissiveIntensity: 0.08,
    });
    this._pedestal = new THREE.Mesh(geo, mat);
    this._pedestal.position.set(0, 0, 0);
    this._pedestal.receiveShadow = true;
    this._scene.add(this._pedestal);

    // Glowing rim light ring
    const rimGeo = new THREE.TorusGeometry(PEDESTAL_RADIUS + 0.02, 0.018, 8, 48);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf07800 });
    this._pedestalRim = new THREE.Mesh(rimGeo, rimMat);
    this._pedestalRim.rotation.x = Math.PI / 2;
    this._pedestalRim.position.y = PEDESTAL_H / 2 + 0.005;
    this._scene.add(this._pedestalRim);
  }

  _disposePedestal() {
    if (this._pedestal) {
      this._pedestal.geometry.dispose();
      this._pedestal.material.dispose();
      this._scene.remove(this._pedestal);
      this._pedestal = null;
    }
    if (this._pedestalRim) {
      this._pedestalRim.geometry.dispose();
      this._pedestalRim.material.dispose();
      this._scene.remove(this._pedestalRim);
      this._pedestalRim = null;
    }
  }

  // ── Internal: camera ──────────────────────────────────────────────────────

  _updateCameraGoal(instant = false) {
    const x = this._orbitR * Math.sin(this._orbitTheta) * Math.cos(this._orbitPhi);
    const y = this._orbitR * Math.sin(this._orbitPhi) + 0.5;
    const z = this._orbitR * Math.cos(this._orbitTheta) * Math.cos(this._orbitPhi);
    setCamera({ x, y, z }, this._orbitTarget, instant);
  }

  // ── Internal: orbit drag ──────────────────────────────────────────────────

  _onPointerDown(e) {
    if (e.target !== this._renderer.domElement) return;
    this._dragging = true;
    this._lastMouse.x = e.clientX;
    this._lastMouse.y = e.clientY;
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._lastMouse.x;
    const dy = e.clientY - this._lastMouse.y;
    this._lastMouse.x = e.clientX;
    this._lastMouse.y = e.clientY;

    this._orbitTheta -= dx * ORBIT_SENSITIVITY;
    this._orbitPhi    = Math.max(0.1, Math.min(Math.PI / 2 - 0.05,
      this._orbitPhi - dy * ORBIT_SENSITIVITY));

    this._updateCameraGoal(false);
  }

  _onPointerUp() {
    this._dragging = false;
  }

  // ── Internal: panel ───────────────────────────────────────────────────────

  _buildPanel() {
    this._removePanel();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = this._panelHTML();
    document.body.appendChild(panel);
    this._panel = panel;

    this._injectPanelCSS();
    this._wireControls();
    this._updateStatsDisplay();
    this._attachCoachSteps();
  }

  _removePanel() {
    if (this._panel) {
      this._panel.remove();
      this._panel = null;
    }
    const style = document.getElementById('workshop-panel-style');
    if (style) style.remove();
  }

  _panelHTML() {
    const g = this._genome;
    return `
      <div class="wp-header">
        <input id="build-name" class="wp-name-input" type="text"
               value="${_esc(g.name)}" placeholder="Name your Zook" maxlength="20" />
      </div>

      <div class="wp-knobs">
        <label class="wp-label">Legs
          <div class="knob" data-param="legCount" data-min="2" data-max="8" data-step="2"
               data-value="${g.legCount}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.legCount}</span>
          </div>
        </label>

        <label class="wp-label">Drive
          <div class="knob" data-param="drive" data-min="4" data-max="20" data-step="0.5"
               data-value="${g.gait.drive.toFixed(1)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.gait.drive.toFixed(1)}</span>
          </div>
        </label>

        <label class="wp-label">Freq
          <div class="knob" data-param="freq" data-min="1" data-max="5" data-step="0.1"
               data-value="${g.gait.freq.toFixed(1)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.gait.freq.toFixed(1)}</span>
          </div>
        </label>

        <label class="wp-label">Amp
          <div class="knob" data-param="amplitude" data-min="0.2" data-max="1.2" data-step="0.05"
               data-value="${g.gait.amplitude.toFixed(2)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.gait.amplitude.toFixed(2)}</span>
          </div>
        </label>

        <label class="wp-label">Mass
          <div class="knob" data-param="mass" data-min="0.5" data-max="5" data-step="0.1"
               data-value="${g.body.mass.toFixed(1)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.body.mass.toFixed(1)}</span>
          </div>
        </label>

        <label class="wp-label">Steer
          <div class="knob" data-param="steer" data-min="-1.5" data-max="1.5" data-step="0.05"
               data-value="${g.gait.steer.toFixed(2)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.gait.steer.toFixed(2)}</span>
          </div>
        </label>

        <label class="wp-label">Width
          <div class="knob" data-param="bodyW" data-min="0.3" data-max="1.0" data-step="0.05"
               data-value="${g.body.w.toFixed(2)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.body.w.toFixed(2)}</span>
          </div>
        </label>

        <label class="wp-label">Height
          <div class="knob" data-param="bodyH" data-min="0.3" data-max="0.8" data-step="0.05"
               data-value="${g.body.h.toFixed(2)}">
            <div class="knob-dial"></div>
            <span class="knob-val">${g.body.h.toFixed(2)}</span>
          </div>
        </label>
      </div>

      <div class="wp-color-row">
        <label class="wp-label">Colour
          <input class="color-wheel" type="color" value="${g.color}" />
        </label>
      </div>

      <div class="wp-stats" id="wp-stats"></div>

      <div class="wp-coach" id="wp-coach">
        <span id="wp-coach-text">Drag the knobs to shape your Zook!</span>
      </div>

      <div class="wp-actions">
        <button id="build-new"  class="wp-btn wp-btn-ghost">Randomise</button>
        <button id="build-save" class="wp-btn wp-btn-primary">Save</button>
        <button id="build-test" class="wp-btn wp-btn-accent">Test</button>
      </div>
    `;
  }

  _injectPanelCSS() {
    if (document.getElementById('workshop-panel-style')) return;
    const style = document.createElement('style');
    style.id = 'workshop-panel-style';
    style.textContent = `
      #workshop-panel {
        position: fixed;
        z-index: 40;
        background: rgba(20,15,28,0.85);
        backdrop-filter: blur(8px);
        border: 1.5px solid #f07800;
        font-family: 'Courier New', monospace;
        color: #ffb347;
        overflow-y: auto;
        box-sizing: border-box;
        padding: 12px 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* Portrait mobile: slides up from bottom, 40% height */
      @media (max-aspect-ratio: 1/1) {
        #workshop-panel {
          left: 0; right: 0; bottom: 0;
          max-height: 40vh;
          border-radius: 18px 18px 0 0;
          border-bottom: none;
        }
      }

      /* Landscape / tablet: right sidebar, 40% width */
      @media (min-aspect-ratio: 1/1) {
        #workshop-panel {
          right: 0; top: 0; bottom: 0;
          width: 40vw;
          max-width: 360px;
          border-radius: 14px 0 0 14px;
          border-right: none;
        }
      }

      .wp-header { display:flex; align-items:center; gap:8px; }
      .wp-name-input {
        flex:1; background: rgba(255,255,255,0.06);
        border: 1.5px solid #f07800; border-radius: 8px;
        color: #ffb347; font-family: inherit; font-size: 15px;
        font-weight: 900; padding: 5px 10px; outline: none;
      }
      .wp-knobs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      @media (max-width: 480px) {
        .wp-knobs { grid-template-columns: repeat(4, 1fr); gap: 6px; }
      }
      .wp-label {
        display: flex; flex-direction: column; align-items: center;
        font-size: 9px; letter-spacing: 0.1em; color: #a07040; gap: 4px;
        user-select: none;
      }
      .knob {
        width: 44px; height: 44px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #3a2a3a, #1a1020);
        border: 2px solid #f07800;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        cursor: grab; position: relative;
        box-shadow: 0 0 8px rgba(240,120,0,0.3);
        touch-action: none;
      }
      .knob:active { cursor: grabbing; }
      .knob-dial {
        position: absolute;
        width: 6px; height: 14px;
        background: #f07800;
        border-radius: 3px;
        top: 4px;
        transform-origin: bottom center;
        transform: rotate(0deg);
        left: calc(50% - 3px);
      }
      .knob-val {
        position: absolute;
        bottom: 5px;
        font-size: 8px;
        color: #ffb347;
        letter-spacing: 0;
        pointer-events: none;
      }
      .wp-color-row { display:flex; gap:10px; align-items:center; }
      .color-wheel {
        width: 36px; height: 36px; padding: 2px;
        border: 2px solid #f07800; border-radius: 8px;
        background: none; cursor: pointer;
      }
      .wp-stats {
        font-size: 10px; color: #a07040; letter-spacing: 0.08em;
        background: rgba(255,255,255,0.03);
        border-radius: 6px; padding: 6px 8px;
      }
      .wp-coach {
        font-size: 11px; color: #ffb347; min-height: 18px;
        background: rgba(240,120,0,0.08);
        border-left: 3px solid #f07800;
        padding: 4px 8px; border-radius: 0 6px 6px 0;
      }
      .wp-actions { display:flex; gap:8px; }
      .wp-btn {
        flex:1; padding: 9px 4px;
        border-radius: 8px; border: none;
        font-family: inherit; font-size: 12px;
        font-weight: 900; letter-spacing: 0.08em;
        cursor: pointer; transition: filter 0.15s;
      }
      .wp-btn:active { filter: brightness(0.8); }
      .wp-btn-ghost   { background: rgba(255,255,255,0.08); color: #a07040; border: 1.5px solid #a07040; }
      .wp-btn-primary { background: #f07800; color: #1a1020; }
      .wp-btn-accent  { background: #4ade80; color: #1a1020; }
    `;
    document.head.appendChild(style);
  }

  // ── Controls wiring ───────────────────────────────────────────────────────

  _wireControls() {
    const panel = this._panel;
    if (!panel) return;

    // Rotary knobs
    panel.querySelectorAll('.knob').forEach(knobEl => {
      this._wireKnob(knobEl);
    });

    // Colour wheel
    const colorInput = panel.querySelector('.color-wheel');
    if (colorInput) {
      colorInput.addEventListener('input', () => {
        this._genome.color = colorInput.value;
        haptic.tick();
        this._onGenomeChange(false);
      });
    }

    // Name
    const nameInput = panel.querySelector('#build-name');
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        this._genome.name = nameInput.value.trim() || 'Zook';
        setState({ activeGenome: cloneGenome(this._genome) });
      });
    }

    // Buttons
    panel.querySelector('#build-save')?.addEventListener('click', () => this._save());
    panel.querySelector('#build-test')?.addEventListener('click', () => this._test());
    panel.querySelector('#build-new')?.addEventListener('click', () => {
      this._genome = randomGenome();
      setState({ activeGenome: cloneGenome(this._genome) });
      this.rebuildCreature();
      this._refreshPanel();
    });
  }

  _wireKnob(knobEl) {
    const param = knobEl.dataset.param;
    const min   = parseFloat(knobEl.dataset.min);
    const max   = parseFloat(knobEl.dataset.max);
    const step  = parseFloat(knobEl.dataset.step);

    let startY   = 0;
    let startVal = parseFloat(knobEl.dataset.value);

    const applyVal = (val) => {
      this._writeParam(param, val);
      knobEl.dataset.value = val;
      const dialEl = knobEl.querySelector('.knob-dial');
      const valEl  = knobEl.querySelector('.knob-val');
      if (dialEl) {
        const t   = (val - min) / (max - min);
        const deg = -135 + t * 270;
        dialEl.style.transform = `rotate(${deg}deg)`;
      }
      if (valEl) valEl.textContent = step < 0.1 ? val.toFixed(2) : (step < 1 ? val.toFixed(1) : String(Math.round(val)));
    };

    // Initial dial position
    applyVal(parseFloat(knobEl.dataset.value));

    knobEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      knobEl.setPointerCapture(e.pointerId);
      startY   = e.clientY;
      startVal = parseFloat(knobEl.dataset.value);
    });

    knobEl.addEventListener('pointermove', (e) => {
      if (!knobEl.hasPointerCapture(e.pointerId)) return;
      const delta = (startY - e.clientY) * 0.015 * (max - min);
      const raw   = startVal + delta;
      const val   = _clamp(_snap(raw, step, min), min, max);
      applyVal(val);
      haptic.tick();

      const needsRebuild = (param === 'legCount' || param === 'bodyW' || param === 'bodyH');
      this._onGenomeChange(needsRebuild);
    });
  }

  /** Write a knob param value back into the genome */
  _writeParam(param, val) {
    const g = this._genome;
    switch (param) {
      case 'legCount':   g.legCount        = Math.max(2, Math.min(8, Math.round(val / 2) * 2)); break;
      case 'drive':      g.gait.drive      = val;  break;
      case 'freq':       g.gait.freq       = val;  break;
      case 'amplitude':  g.gait.amplitude  = val;  break;
      case 'mass':       g.body.mass       = val;  break;
      case 'steer':      g.gait.steer      = val;  break;
      case 'bodyW':      g.body.w          = val;  break;
      case 'bodyH':      g.body.h          = val;  break;
    }
  }

  _onGenomeChange(needsRebuild) {
    setState({ activeGenome: cloneGenome(this._genome) });
    this._updateStatsDisplay();

    if (needsRebuild) {
      if (this._rebuildTimer) clearTimeout(this._rebuildTimer);
      this._rebuildTimer = setTimeout(() => {
        this.rebuildCreature();
        this._rebuildTimer = null;
      }, REBUILD_DELAY);
    }
  }

  _updateStatsDisplay() {
    const el = this._panel?.querySelector('#wp-stats');
    if (!el) return;
    const g = this._genome;
    const speed = (g.gait.drive * g.gait.freq * 0.04).toFixed(2);
    el.innerHTML =
      `Legs: <b>${g.legCount}</b> &nbsp; ` +
      `Mass: <b>${g.body.mass.toFixed(1)}</b> kg &nbsp; ` +
      `Est. Speed: <b>~${speed}</b> m/s`;
  }

  _attachCoachSteps() {
    const steps = [
      [2000,  'Try adjusting Drive to make your Zook go faster!'],
      [6000,  'Frequency controls how fast the legs cycle.'],
      [12000, 'Amplitude sets how big each step is.'],
      [20000, 'More legs = more grip, but more mass too!'],
      [30000, 'Use Steer to bias left or right in a straight race.'],
    ];
    for (const [delay, text] of steps) {
      setTimeout(() => {
        const el = this._panel?.querySelector('#wp-coach-text');
        if (el) el.textContent = text;
      }, delay);
    }
  }

  _refreshPanel() {
    this._removePanel();
    this._buildPanel();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  _save() {
    const g = cloneGenome(this._genome);
    const roster = [...S.roster];
    const idx = roster.findIndex(r => r.name === g.name);
    if (idx >= 0) roster[idx] = g; else roster.push(g);
    saveRoster(roster);
    setState({ roster, activeGenome: g });
    haptic.burst();

    const btn = this._panel?.querySelector('#build-save');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Saved!';
      setTimeout(() => { if (btn) btn.textContent = orig; }, 1200);
    }
  }

  _test() {
    setState({ activeGenome: cloneGenome(this._genome) });
    navigate('trials');
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function _clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function _snap(v, step, min) {
  return Math.round((v - min) / step) * step + min;
}
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
