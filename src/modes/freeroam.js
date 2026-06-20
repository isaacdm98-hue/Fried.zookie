/**
 * freeroam.js — FreeRoamMode
 *
 * Lets the player drive their creature around a flat open area
 * using an on-screen joystick (and optional jump button).
 *
 * Joystick UI is pure HTML/CSS — a floating circle pad with an
 * inner thumb that tracks touch/pointer position.
 */

import { Zook }           from '../creature/builder.js';
import { Environment }    from '../engine/env.js';
import { startLoop }      from '../engine/loop.js';
import { setCamera, updateCamera } from '../engine/renderer.js';
import { navigate }       from '../router.js';
import { S }              from '../state.js';
import { cloneGenome }    from '../creature/genome.js';

// Joystick sizing
const JOY_RADIUS  = 60;   // px — outer ring
const THUMB_R     = 24;   // px — inner thumb radius

export class FreeRoamMode {
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

    this._env      = null;
    this._zook     = null;
    this._stopLoop = null;

    // Joystick state (normalized -1 … 1)
    this._joyX = 0;
    this._joyY = 0;
    this._joyActive   = false;
    this._joyPointerId = null;
    this._joyOrigin   = { x: 0, y: 0 };

    // DOM elements
    this._joyEl      = null;
    this._thumbEl     = null;
    this._jumpBtn     = null;
    this._backBtn     = null;
    this._hudEl       = null;

    // Camera follow
    this._camTheta = 0;

    // Bound handlers
    this._onJoyDown = this._onJoyDown.bind(this);
    this._onJoyMove = this._onJoyMove.bind(this);
    this._onJoyUp   = this._onJoyUp.bind(this);
    this._onJump    = this._onJump.bind(this);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * @param {object} [genome]  defaults to S.activeGenome
   */
  enter(genome) {
    const g = cloneGenome(genome || S.activeGenome);

    // Build flat environment
    this._env = new Environment(this._scene, this._RAPIER, this._world);
    this._env.buildSprint();   // flat ground is all we need

    // Spawn player creature
    this._zook = new Zook(
      g, this._world, this._RAPIER, this._scene,
      { x: 0, z: 0, heading: 0, tint: null, isPreview: false }
    );

    // Build joystick UI
    this._buildJoystickUI();

    // Initial camera
    setCamera({ x: 0, y: 4, z: 6 }, { x: 0, y: 0.5, z: 0 }, true);

    // Start loop
    this._stopLoop = startLoop({
      world:    this._world,
      renderer: this._renderer,
      scene:    this._scene,
      camera:   this._camera,
      clock:    this._clock,
      onStep:   (dt) => this._physicsStep(dt),
      onFrame:  (dt) => this._frame(dt),
    });
  }

  exit() {
    if (this._stopLoop) { this._stopLoop(); this._stopLoop = null; }

    if (this._zook && typeof this._zook.dispose === 'function') this._zook.dispose();
    this._zook = null;

    if (this._env && typeof this._env.dispose === 'function') this._env.dispose();
    this._env = null;

    this._destroyJoystickUI();
  }

  // ── Public controls ───────────────────────────────────────────────────────

  /**
   * Feed normalised joystick offsets.
   * @param {number} dx  — -1 (left) to +1 (right)
   * @param {number} dy  — -1 (forward) to +1 (back)
   */
  handleJoystick(dx, dy) {
    this._joyX = Math.max(-1, Math.min(1, dx));
    this._joyY = Math.max(-1, Math.min(1, dy));
  }

  /** Trigger a jump impulse on the creature. */
  handleJump() {
    if (this._zook) {
      const steerLeft  = this._joyX < -0.15;
      const steerRight = this._joyX >  0.15;
      this._zook.step(0, { steerLeft, steerRight, jump: true });
    }
  }

  // ── Internal: physics & render ────────────────────────────────────────────

  _physicsStep(dt) {
    if (!this._zook) return;

    const steerLeft  = this._joyX < -0.15;
    const steerRight = this._joyX >  0.15;

    this._zook.step(dt, { steerLeft, steerRight, jump: false });
  }

  /** Public onStep shim for main.js loop integration. */
  onStep(dt) {
    this._physicsStep(dt);
  }

  /** Public update shim for main.js loop integration. */
  update(dt) {
    this._frame(dt);
  }

  _frame(dt) {
    if (!this._zook) { updateCamera(dt); return; }

    this._zook.syncMeshes();

    // Follow camera — stay behind and above the creature
    const pos = this._zook.position;
    if (pos) {
      const targetX = pos.x;
      const targetZ = pos.z + 5.5;
      const targetY = pos.y + 3.0;

      setCamera(
        { x: targetX, y: targetY, z: targetZ },
        { x: pos.x, y: pos.y + 0.5, z: pos.z - 2 }
      );
    }

    updateCamera(dt);
  }

  // ── Joystick UI ───────────────────────────────────────────────────────────

  _buildJoystickUI() {
    this._destroyJoystickUI();
    this._injectCSS();

    // Outer ring
    const joy = document.createElement('div');
    joy.id = 'fr-joystick';
    joy.className = 'fr-joy-ring';

    // Inner thumb
    const thumb = document.createElement('div');
    thumb.className = 'fr-joy-thumb';
    joy.appendChild(thumb);

    this._joyEl   = joy;
    this._thumbEl = thumb;

    // Jump button
    const jump = document.createElement('button');
    jump.id = 'fr-jump';
    jump.className = 'fr-jump-btn';
    jump.textContent = 'JUMP';
    this._jumpBtn = jump;

    // Back button
    const back = document.createElement('button');
    back.id = 'fr-back';
    back.className = 'fr-back-btn';
    back.textContent = '✕ Exit';
    this._backBtn = back;

    document.body.appendChild(joy);
    document.body.appendChild(jump);
    document.body.appendChild(back);

    // Events
    joy.addEventListener('pointerdown', this._onJoyDown);
    window.addEventListener('pointermove', this._onJoyMove);
    window.addEventListener('pointerup', this._onJoyUp);
    jump.addEventListener('click', this._onJump);
    back.addEventListener('click', () => navigate('title'));
  }

  _destroyJoystickUI() {
    if (this._joyEl) {
      this._joyEl.removeEventListener('pointerdown', this._onJoyDown);
      this._joyEl.remove();
      this._joyEl = null;
    }
    window.removeEventListener('pointermove', this._onJoyMove);
    window.removeEventListener('pointerup',   this._onJoyUp);

    if (this._jumpBtn) { this._jumpBtn.remove(); this._jumpBtn = null; }
    if (this._backBtn) { this._backBtn.remove(); this._backBtn = null; }
  }

  // ── Joystick pointer events ───────────────────────────────────────────────

  _onJoyDown(e) {
    e.preventDefault();
    this._joyEl.setPointerCapture(e.pointerId);
    this._joyActive    = true;
    this._joyPointerId = e.pointerId;
    const rect = this._joyEl.getBoundingClientRect();
    this._joyOrigin.x = rect.left + rect.width / 2;
    this._joyOrigin.y = rect.top  + rect.height / 2;
    this._updateThumb(e.clientX, e.clientY);
  }

  _onJoyMove(e) {
    if (!this._joyActive || e.pointerId !== this._joyPointerId) return;
    this._updateThumb(e.clientX, e.clientY);
  }

  _onJoyUp(e) {
    if (e.pointerId !== this._joyPointerId) return;
    this._joyActive = false;
    this._joyPointerId = null;
    this._joyX = 0;
    this._joyY = 0;
    this._centerThumb();
  }

  _updateThumb(cx, cy) {
    const dx = cx - this._joyOrigin.x;
    const dy = cy - this._joyOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = JOY_RADIUS - THUMB_R;
    const clamped = Math.min(dist, maxDist);
    const angle   = Math.atan2(dy, dx);

    const thumbX = Math.cos(angle) * clamped;
    const thumbY = Math.sin(angle) * clamped;

    if (this._thumbEl) {
      this._thumbEl.style.transform =
        `translate(${thumbX}px, ${thumbY}px)`;
    }

    this.handleJoystick(dx / maxDist, dy / maxDist);
  }

  _centerThumb() {
    if (this._thumbEl) {
      this._thumbEl.style.transform = 'translate(0,0)';
    }
  }

  _onJump() {
    this.handleJump();
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById('freeroam-style')) return;
    const style = document.createElement('style');
    style.id = 'freeroam-style';
    style.textContent = `
      .fr-joy-ring {
        position: fixed;
        bottom: 48px;
        left: 48px;
        width: ${JOY_RADIUS * 2}px;
        height: ${JOY_RADIUS * 2}px;
        border-radius: 50%;
        background: rgba(20,15,28,0.55);
        border: 2px solid rgba(240,120,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        user-select: none;
        z-index: 60;
        backdrop-filter: blur(4px);
      }

      .fr-joy-thumb {
        width: ${THUMB_R * 2}px;
        height: ${THUMB_R * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, #f07800, #a04000);
        box-shadow: 0 0 10px rgba(240,120,0,0.5);
        transition: transform 0.04s linear;
        pointer-events: none;
      }

      .fr-jump-btn {
        position: fixed;
        bottom: 68px;
        right: 48px;
        width: 72px; height: 72px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, #4ade80, #1a8040);
        border: 2px solid #4ade80;
        color: #1a1020;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.08em;
        cursor: pointer;
        z-index: 60;
        box-shadow: 0 0 16px rgba(74,222,128,0.4);
        transition: filter 0.1s;
      }
      .fr-jump-btn:active { filter: brightness(0.8); }

      .fr-back-btn {
        position: fixed;
        top: 16px;
        right: 16px;
        background: rgba(20,15,28,0.8);
        border: 1.5px solid #f07800;
        color: #f07800;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: 900;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        z-index: 60;
        backdrop-filter: blur(4px);
        transition: filter 0.15s;
      }
      .fr-back-btn:hover { filter: brightness(1.2); }
    `;
    document.head.appendChild(style);
  }
}
