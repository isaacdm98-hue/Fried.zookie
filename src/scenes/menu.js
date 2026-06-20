/**
 * menu.js — MenuScene
 *
 * Background scene shown behind the title screen.
 * Three small AI Zooks wander across a flat plane while the
 * camera slowly orbits the scene.
 *
 * The game loop is managed externally (main.js calls startLoop and
 * routes onStep / onFrame to this scene).  MenuScene does NOT start
 * its own loop.
 */

import * as THREE from 'three';
import { Zook }        from '../creature/builder.js';
import { Environment } from '../engine/env.js';
import { AI_GENOMES }  from '../creature/genome.js';
import { setCamera, updateCamera } from '../engine/renderer.js';

// Wander AI constants
const WANDER_INTERVAL  = 3000;  // ms between direction changes

export class MenuScene {
  /**
   * @param {{
   *   scene:    THREE.Scene,
   *   world:    import('@dimforge/rapier3d-compat').World,
   *   RAPIER:   any,
   *   camera:   THREE.Camera,
   *   renderer: THREE.WebGLRenderer,
   *   clock:    THREE.Clock,
   * }} opts
   */
  constructor({ scene, world, RAPIER, camera, renderer, clock }) {
    this._scene    = scene;
    this._world    = world;
    this._RAPIER   = RAPIER;
    this._camera   = camera;
    this._renderer = renderer;
    this._clock    = clock;

    this._env    = null;
    this._zooks  = [];
    this._steers = [];
    this._wanderTimers = [];

    // Orbit state
    this._orbitAngle  = 0;
    this._orbitRadius = 9;
    this._orbitY      = 4.5;
    this._orbitTarget = new THREE.Vector3(0, 0.5, -2);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  enter() {
    // Build flat sprint environment
    // Environment(scene, RAPIER, world)
    this._env = new Environment(this._scene, this._RAPIER, this._world);
    this._env.buildSprint();

    // Spawn three background AI creatures spread across the plane
    const placements = [
      { x: -3, z: -4, heading: 0 },
      { x:  2, z: -7, heading: Math.PI * 0.15 },
      { x:  0, z: -2, heading: -Math.PI * 0.1 },
    ];

    for (let i = 0; i < 3; i++) {
      const genome = AI_GENOMES[i % AI_GENOMES.length];
      const p = placements[i];

      const zook = new Zook(
        genome,
        this._world,
        this._RAPIER,
        this._scene,
        { x: p.x, z: p.z, heading: p.heading, tint: null, isPreview: false }
      );

      this._zooks.push(zook);
      this._steers.push((Math.random() - 0.5) > 0);

      // Schedule periodic wander direction changes
      const idx = i;
      const wander = () => {
        if (idx >= this._zooks.length) return;
        // Randomly flip steer direction
        this._steers[idx] = Math.random() > 0.5;
        this._wanderTimers[idx] = setTimeout(wander, WANDER_INTERVAL + Math.random() * 2000);
      };
      this._wanderTimers[i] = setTimeout(wander, Math.random() * WANDER_INTERVAL);
    }

    // Snap camera to orbit start position
    setCamera(
      { x: this._orbitRadius, y: this._orbitY, z: 0 },
      this._orbitTarget,
      true
    );
  }

  exit() {
    // Clear wander timers
    for (const t of this._wanderTimers) clearTimeout(t);
    this._wanderTimers = [];

    // Dispose zooks
    for (const zook of this._zooks) {
      if (typeof zook.dispose === 'function') zook.dispose();
    }
    this._zooks  = [];
    this._steers = [];

    // Dispose environment
    if (this._env && typeof this._env.dispose === 'function') {
      this._env.dispose();
    }
    this._env = null;
  }

  // ── Public hooks (called by main.js loop) ──────────────────────────────────

  /** Fixed physics step hook — called each 1/60 s by startLoop onStep. */
  onStep(dt = 1 / 60) {
    for (let i = 0; i < this._zooks.length; i++) {
      const zook = this._zooks[i];
      const steerLeft  = this._steers[i] === false;
      const steerRight = this._steers[i] === true;
      zook.step(dt, { steerLeft, steerRight, jump: false });
    }
  }

  /** Per-frame update — called by startLoop onFrame. */
  update(dt) {
    // Sync meshes
    for (const zook of this._zooks) zook.syncMeshes();

    // Slowly orbit the camera around the scene
    this._orbitAngle += dt * 0.12;   // ~7 deg/s
    const x = Math.sin(this._orbitAngle) * this._orbitRadius;
    const z = Math.cos(this._orbitAngle) * this._orbitRadius;

    setCamera(
      { x, y: this._orbitY, z },
      this._orbitTarget
    );
    // Note: updateCamera(dt) is called by main.js after update()
  }
}
