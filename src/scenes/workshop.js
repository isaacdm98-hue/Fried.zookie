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
import { narrator }       from '../audio/narrator.js';
import { setCamera } from '../engine/renderer.js';

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

  /** Build the HTML for one retro dial module. */
  _dialHTML(param, label, min, max, step, value) {
    const fmt = step < 0.1 ? value.toFixed(2) : (step < 1 ? value.toFixed(1) : String(Math.round(value)));
    return `
      <div class="wp-mod">
        <div class="knob" data-param="${param}" data-min="${min}" data-max="${max}"
             data-step="${step}" data-value="${value}">
          <div class="knob-dial"></div>
        </div>
        <div class="knob-val">${fmt}</div>
        <div class="wp-mod-label">${label}</div>
      </div>`;
  }

  _panelHTML() {
    const g = this._genome;
    const d = (p, l, mn, mx, st, v) => this._dialHTML(p, l, mn, mx, st, v);

    return `
      <!-- Top floating bar -->
      <div class="wp-top">
        <button id="build-back" class="wp-icon-btn" title="Back">‹</button>
        <div class="wp-nameplate">
          <input id="build-name" class="wp-name-input" type="text"
                 value="${_esc(g.name)}" placeholder="NAME YOUR ZOOK" maxlength="16" />
        </div>
        <button id="build-new" class="wp-icon-btn" title="Randomise">⟳</button>
      </div>

      <!-- Left rack: CHASSIS -->
      <div class="wp-rack wp-rack-left">
        <div class="wp-rack-label">CHASSIS</div>
        <div class="wp-rack-screw tl"></div><div class="wp-rack-screw tr"></div>
        ${d('bodyW',     'WIDTH',  0.30, 1.00, 0.05, g.body.w)}
        ${d('bodyH',     'HEIGHT', 0.30, 0.80, 0.05, g.body.h)}
        ${d('bodyL',     'LENGTH', 0.60, 1.60, 0.05, g.body.l)}
        ${d('mass',      'MASS',   0.60, 5.00, 0.10, g.body.mass)}
        ${d('legRadius', 'THICK',  0.08, 0.22, 0.01, g.leg.radius)}
        ${d('eyeSize',   'EYES',   0.04, 0.13, 0.01, g.eyeSize ?? 0.07)}
        <div class="wp-rack-screw bl"></div><div class="wp-rack-screw br"></div>
      </div>

      <!-- Right rack: MOTION -->
      <div class="wp-rack wp-rack-right">
        <div class="wp-rack-label">MOTION</div>
        <div class="wp-rack-screw tl"></div><div class="wp-rack-screw tr"></div>
        ${d('drive',     'POWER',  4.0, 22.0, 0.5,  g.gait.drive)}
        ${d('freq',      'FREQ',   1.0,  5.0, 0.1,  g.gait.freq)}
        ${d('amplitude', 'STRIDE', 0.25, 1.20, 0.05, g.gait.amplitude)}
        ${d('legLen',    'REACH',  0.55, 1.40, 0.05, g.leg.len)}
        ${d('jump',      'HOP',    0.0,  9.0, 0.5,  g.gait.jump ?? 0)}
        ${d('steer',     'STEER', -0.8,  0.8, 0.05, g.gait.steer)}
        <div class="wp-rack-screw bl"></div><div class="wp-rack-screw br"></div>
      </div>

      <!-- Bottom dock: switches + colours + actions -->
      <div class="wp-dock">
        <div class="wp-dock-row">
          <button id="legs-switch" class="wp-switch" data-value="${g.legCount}">
            <span class="wp-switch-label">LEGS</span>
            <span class="wp-switch-val" id="legs-switch-val">${g.legCount}</span>
          </button>
          <label class="wp-swatch" title="Body colour">
            <input id="color-body" class="color-wheel" type="color" value="${g.color}" />
            <span class="wp-swatch-cap">BODY</span>
          </label>
          <label class="wp-swatch" title="Leg colour">
            <input id="color-accent" class="color-wheel" type="color" value="${g.accent || g.color}" />
            <span class="wp-swatch-cap">LEGS</span>
          </label>
          <div class="wp-readout" id="wp-stats"></div>
        </div>
        <div class="wp-dock-row wp-dock-actions">
          <button id="build-save" class="wp-btn wp-btn-primary">SAVE</button>
          <button id="build-test" class="wp-btn wp-btn-accent">TEST ▶</button>
        </div>
      </div>
    `;
  }

  _injectPanelCSS() {
    if (document.getElementById('workshop-panel-style')) return;
    const style = document.createElement('style');
    style.id = 'workshop-panel-style';
    style.textContent = `
      /* ── Workshop: floating retro-synth control surface ──
         Racks float at the screen edges; the 3-D creature stays
         fully visible in the centre.  No element fills the viewport. */
      #workshop-panel {
        position: fixed; inset: 0; z-index: 40;
        pointer-events: none;            /* only the modules catch input */
        font-family: var(--font-ui), 'Patrick Hand', sans-serif;
      }
      #workshop-panel > * { pointer-events: auto; }

      /* Shared brushed-metal chassis look */
      .wp-rack, .wp-dock, .wp-nameplate, .wp-switch, .wp-btn, .wp-icon-btn {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.18)),
          linear-gradient(135deg, #2c2436, #1a1422);
        border: 1.5px solid #4a3d5e;
        box-shadow: 0 6px 18px rgba(0,0,0,0.45),
                    inset 0 1px 0 rgba(255,255,255,0.12);
      }

      /* ── Top bar ── */
      .wp-top {
        position: absolute; top: 10px; left: 10px; right: 10px; height: 46px;
        display: flex; align-items: center; gap: 10px; pointer-events: none;
      }
      .wp-top > * { pointer-events: auto; }
      .wp-nameplate {
        flex: 1; height: 100%; border-radius: 12px;
        display: flex; align-items: center; padding: 0 12px;
      }
      .wp-name-input {
        width: 100%; background: none; border: none; outline: none;
        color: var(--synth-accent2, #ffc040); font-size: 20px; font-weight: 400;
        letter-spacing: 0.06em; text-align: center;
        text-shadow: 0 0 8px rgba(255,192,64,0.35);
      }
      .wp-name-input::placeholder { color: #6b5a82; }
      .wp-icon-btn {
        width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
        color: var(--synth-accent, #ff8040); font-size: 24px; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: transform 0.08s, filter 0.12s;
      }
      .wp-icon-btn:active { transform: translateY(1px); filter: brightness(1.25); }

      /* ── Side racks ── */
      .wp-rack {
        position: absolute; top: 66px; bottom: 132px;
        width: 76px; border-radius: 14px;
        display: flex; flex-direction: column; align-items: center;
        gap: 2px; padding: 16px 0 8px;
        overflow: visible;
      }
      .wp-rack-left  { left: 8px; }
      .wp-rack-right { right: 8px; }
      .wp-rack-label {
        position: absolute; top: 4px; left: 0; right: 0; text-align: center;
        font-family: monospace; font-size: 8px; letter-spacing: 2px;
        color: #7a6a96;
      }
      .wp-rack-screw {
        position: absolute; width: 6px; height: 6px; border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #6a5a82, #1a1422);
        box-shadow: inset 0 0 1px rgba(0,0,0,0.8);
      }
      .wp-rack-screw.tl { top: 5px; left: 5px; }
      .wp-rack-screw.tr { top: 5px; right: 5px; }
      .wp-rack-screw.bl { bottom: 5px; left: 5px; }
      .wp-rack-screw.br { bottom: 5px; right: 5px; }

      /* ── Dial module ── */
      .wp-mod {
        display: flex; flex-direction: column; align-items: center; gap: 1px;
        flex: 1 1 0; justify-content: center; min-height: 0;
      }
      .knob {
        --d: 42px;
        width: var(--d); height: var(--d); border-radius: 50%;
        position: relative; cursor: grab; touch-action: none; flex-shrink: 0;
        background:
          radial-gradient(circle at 38% 30%, #5a4d72 0%, #2a2238 55%, #15101e 100%);
        box-shadow:
          0 3px 6px rgba(0,0,0,0.6),
          inset 0 1px 2px rgba(255,255,255,0.18),
          0 0 0 2px #0d0b14,
          0 0 0 3px #4a3d5e;
        transition: box-shadow 0.1s;
      }
      .knob:active { cursor: grabbing;
        box-shadow: 0 3px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.18),
                    0 0 0 2px var(--synth-accent,#ff8040), 0 0 12px rgba(255,128,64,0.5); }
      /* tick ring */
      .knob::after {
        content: ''; position: absolute; inset: -7px; border-radius: 50%;
        background:
          repeating-conic-gradient(from -135deg,
            #6a5a86 0deg 2deg, transparent 2deg 24deg);
        -webkit-mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
                mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
        opacity: 0.55; pointer-events: none;
      }
      .knob-dial {
        position: absolute; width: 4px; height: 13px; left: calc(50% - 2px); top: 4px;
        background: var(--synth-accent2, #ffc040); border-radius: 2px;
        transform-origin: 50% calc(var(--d) / 2 - 4px); transform: rotate(0deg);
        box-shadow: 0 0 5px var(--synth-accent2, #ffc040); pointer-events: none;
      }
      .knob-val {
        font-family: monospace; font-size: 9px; line-height: 1;
        color: var(--synth-accent2, #ffc040); letter-spacing: 0;
        background: rgba(0,0,0,0.35); border-radius: 3px; padding: 1px 3px;
        min-width: 26px; text-align: center;
      }
      .wp-mod-label {
        font-family: monospace; font-size: 8px; letter-spacing: 1px; color: #8a7aa6;
      }

      /* ── Bottom dock ── */
      .wp-dock {
        position: absolute; left: 8px; right: 8px; bottom: 8px;
        border-radius: 16px; padding: 8px 10px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .wp-dock-row { display: flex; align-items: center; gap: 8px; }
      .wp-switch {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 56px; height: 42px; border-radius: 10px; cursor: pointer; flex-shrink: 0;
        transition: filter 0.12s;
      }
      .wp-switch:active { filter: brightness(1.2); }
      .wp-switch-label { font-family: monospace; font-size: 8px; letter-spacing: 1px; color: #8a7aa6; }
      .wp-switch-val {
        font-size: 18px; font-weight: 400; line-height: 1;
        color: var(--synth-accent2,#ffc040); text-shadow: 0 0 6px rgba(255,192,64,0.4);
      }
      .wp-swatch {
        position: relative; width: 42px; height: 42px; border-radius: 10px;
        overflow: hidden; flex-shrink: 0; cursor: pointer;
        border: 1.5px solid #4a3d5e; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.5);
      }
      .wp-swatch .color-wheel {
        position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px);
        border: none; padding: 0; background: none; cursor: pointer;
      }
      .wp-swatch-cap {
        position: absolute; bottom: 0; left: 0; right: 0; text-align: center;
        font-family: monospace; font-size: 7px; letter-spacing: 1px;
        color: #fff; background: rgba(0,0,0,0.5); padding: 1px 0;
      }
      .wp-readout {
        flex: 1; font-family: monospace; font-size: 9px; line-height: 1.35;
        color: #9a8ab6; letter-spacing: 0.04em; text-align: right;
      }
      .wp-readout b { color: var(--synth-accent2,#ffc040); }
      .wp-dock-actions { gap: 10px; }
      .wp-btn {
        flex: 1; padding: 11px 4px; border-radius: 10px; cursor: pointer;
        font-family: var(--font-ui), sans-serif; font-size: 17px; letter-spacing: 0.06em;
        transition: transform 0.08s, filter 0.12s;
      }
      .wp-btn:active { transform: translateY(1px); filter: brightness(1.15); }
      .wp-btn-primary { color: #1a1020;
        background: linear-gradient(180deg, #ffc040, #f0901a); border-color: #c0700a; }
      .wp-btn-accent  { color: #0a2014;
        background: linear-gradient(180deg, #6ef09a, #2bbf66); border-color: #1a8044; }

      /* Landscape: shrink racks so they stay at the very edges */
      @media (orientation: landscape) and (max-height: 520px) {
        .wp-rack { top: 60px; bottom: 70px; width: 64px; }
        .wp-dock { left: 80px; right: 80px; }
        .knob { --d: 36px; }
      }
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

    // Body colour
    const bodyColor = panel.querySelector('#color-body');
    if (bodyColor) {
      bodyColor.addEventListener('input', () => {
        this._genome.color = bodyColor.value;
        haptic.tick();
        this._onGenomeChange(true);   // colour lives on the mesh — rebuild
      });
    }

    // Accent / leg colour
    const accentColor = panel.querySelector('#color-accent');
    if (accentColor) {
      accentColor.addEventListener('input', () => {
        this._genome.accent = accentColor.value;
        haptic.tick();
        this._onGenomeChange(true);
      });
    }

    // Legs switch — taps cycle 2 → 4 → 6 → 8 → 2
    const legsSwitch = panel.querySelector('#legs-switch');
    if (legsSwitch) {
      legsSwitch.addEventListener('click', () => {
        const next = this._genome.legCount >= 8 ? 2 : this._genome.legCount + 2;
        this._genome.legCount = next;
        const valEl = panel.querySelector('#legs-switch-val');
        if (valEl) valEl.textContent = String(next);
        haptic.double();
        this._onGenomeChange(true);
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
    panel.querySelector('#build-back')?.addEventListener('click', () => navigate('title'));
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

    const valEl  = knobEl.parentElement?.querySelector('.knob-val');
    const applyVal = (val) => {
      this._writeParam(param, val);
      knobEl.dataset.value = val;
      const dialEl = knobEl.querySelector('.knob-dial');
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

      const meshParams = ['legCount','bodyW','bodyH','bodyL','legLen','legRadius','eyeSize'];
      this._onGenomeChange(meshParams.includes(param));
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
      case 'jump':       g.gait.jump       = val;  break;
      case 'bodyW':      g.body.w          = val;  break;
      case 'bodyH':      g.body.h          = val;  break;
      case 'bodyL':      g.body.l          = val;  break;
      case 'legLen':     g.leg.len         = val;  break;
      case 'legRadius':  g.leg.radius      = val;  break;
      case 'eyeSize':    g.eyeSize         = val;  break;
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
    narrator.play('save');

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
