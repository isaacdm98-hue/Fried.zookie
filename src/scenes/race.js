/**
 * race.js — RaceScene
 *
 * Handles all trial types: sprint, hurdles, highJump, lap,
 * blockPush, football, sumo, assault.
 *
 * The game loop is managed externally by main.js.
 * main.js calls:
 *   raceScene.enter(config)  — setup
 *   raceScene.onStep(dt)     — fixed physics step
 *   raceScene.update(dt)     — per-frame render/logic
 *   raceScene.exit()         — teardown
 *
 * config = {
 *   trial:        { id, goal, dist, maxTime, buildEnv, label }
 *   playerGenome: genome
 *   opponents:    [genome, …]
 *   vsMode:       bool
 *   onFinish:     (result) => void   — called by main.js convention
 *   hud:          HUD instance
 *   lowerThird:   LowerThird instance
 * }
 */

import * as THREE from 'three';
import { Zook }           from '../creature/builder.js';
import { Environment }    from '../engine/env.js';
import { setCamera }      from '../engine/renderer.js';
import { S, setState }    from '../state.js';
import { haptic }         from '../ui/haptic.js';
import { cloneGenome }    from '../creature/genome.js';

// ── Camera phase constants ────────────────────────────────────────────────────
const CAM_BROADCAST = 'broadcast';
const CAM_FOLLOW    = 'follow';
const CAM_FINISH    = 'finish';
const CAM_HIGHJUMP  = 'highjump';

// Countdown sequence — 0 maps to "GO!"
const COUNTDOWN_SEQ = [3, 2, 1, 0];

// Spawn spacing (metres, along X)
const SPAWN_SPACING = 1.1;

// Ring radius for sumo
const SUMO_RING_RADIUS = 3.0;   // env rim is at r=3, so eject at 3.0

// Lap gate positions (matches buildLap in env.js)
const LAP_GATES = [
  { x: 0, z: -14 },
  { x: -8, z: 0 },
  { x: 0, z: 14 },
  { x: 8, z: 0 },
];

export class RaceScene {
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

    this._env         = null;
    this._zooks       = [];
    this._hud         = null;
    this._lowerThird  = null;
    this._onFinish    = null;

    // Race state
    this._trial       = null;
    this._started     = false;
    this._finished    = false;
    this._elapsed     = 0;
    this._camPhase    = CAM_BROADCAST;
    this._lastLeadName = null;
    this._vsMode      = false;
    this._countdownTimer = null;

    // Special bodies from env
    this._pushBlockBody   = null;
    this._pushBlockMesh   = null;
    this._footballBall    = null;
    this._footballBody    = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Set up and enter a race.
   *
   * @param {{
   *   trial:        object,
   *   playerGenome: object,
   *   opponents:    object[],
   *   vsMode?:      boolean,
   *   onFinish?:    (result: object) => void,
   *   hud?:         HUD,
   *   lowerThird?:  LowerThird,
   * }} config
   */
  enter(config) {
    const { trial, playerGenome, opponents = [], vsMode = false, onFinish, hud, lowerThird } = config;

    this._trial      = trial;
    this._vsMode     = vsMode;
    this._onFinish   = onFinish || null;
    this._hud        = hud || null;
    this._lowerThird = lowerThird || null;
    this._started    = false;
    this._finished   = false;
    this._elapsed    = 0;
    this._lastLeadName = null;
    this._camPhase   = CAM_BROADCAST;

    setState({ raceConfig: config });

    // Build environment — Environment(scene, RAPIER, world)
    this._env = new Environment(this._scene, this._RAPIER, this._world);
    if (typeof this._env[trial.buildEnv] === 'function') {
      this._env[trial.buildEnv]();
    } else {
      this._env.buildSprint();
    }

    // Cache special physics bodies
    this._pushBlockBody  = this._env.pushBlockBody  || null;
    this._pushBlockMesh  = this._env.pushBlock       || null;
    this._footballBody   = this._env.footballBallBody || null;
    this._footballMesh   = this._env.footballBall     || null;

    // Spawn player + opponents
    const allGenomes = [playerGenome, ...opponents];
    this._zooks = [];

    for (let i = 0; i < allGenomes.length; i++) {
      const genome   = allGenomes[i];
      const isPlayer = (i === 0);
      const xOff     = (i - (allGenomes.length - 1) / 2) * SPAWN_SPACING;

      const zook = new Zook(
        genome,
        this._world,
        this._RAPIER,
        this._scene,
        { x: xOff, z: 0, heading: 0, tint: null, isPreview: false }
      );

      this._zooks.push({
        zook,
        genome:     cloneGenome(genome),
        name:       genome.name || `Zook ${i}`,
        isPlayer,
        lapGateIdx: 0,
        lapsDone:   0,
        maxHeight:  0,
        finished:   false,
        finishTime: Infinity,
        prevZ:      0,
      });
    }

    // Show HUD
    if (this._hud) {
      this._hud.show(trial.id);
      if (typeof this._hud.showLiveBug === 'function') this._hud.showLiveBug();
    }

    // Kick off countdown
    this._runCountdown();
  }

  exit() {
    if (this._countdownTimer) { clearTimeout(this._countdownTimer); this._countdownTimer = null; }

    for (const entry of this._zooks) {
      if (typeof entry.zook.dispose === 'function') entry.zook.dispose();
    }
    this._zooks = [];

    if (this._env && typeof this._env.dispose === 'function') this._env.dispose();
    this._env = null;

    if (this._hud) {
      this._hud.hide();
      if (typeof this._hud.hideLiveBug === 'function') this._hud.hideLiveBug();
    }
    if (this._lowerThird) this._lowerThird.hide();

    this._pushBlockBody = null;
    this._pushBlockMesh = null;
    this._footballBody  = null;
    this._footballMesh  = null;
    this._started  = false;
    this._finished = false;
  }

  // ── Countdown ─────────────────────────────────────────────────────────────

  _runCountdown() {
    let step = 0;
    const next = () => {
      if (step >= COUNTDOWN_SEQ.length) {
        this._started = true;
        haptic.burst();
        return;
      }
      const n = COUNTDOWN_SEQ[step++];
      if (this._hud) this._hud.showCountdown(n);
      haptic.beep();
      this._countdownTimer = setTimeout(next, n === 0 ? 900 : 1000);
    };
    this._countdownTimer = setTimeout(next, 600);
  }

  // ── Public hooks (called by main.js loop) ─────────────────────────────────

  /** Fixed physics step — called each 1/60 s by startLoop onStep. */
  onStep(dt) {
    if (!this._started || this._finished) return;

    for (const entry of this._zooks) {
      if (entry.finished) continue;
      const g = entry.genome;
      // Use genome's inherent steer bias to drive AI;
      // positive steer → steerRight, negative → steerLeft
      const steerLeft  = g.gait.steer < -0.05;
      const steerRight = g.gait.steer >  0.05;
      entry.zook.step(dt, { steerLeft, steerRight, jump: false });
    }

    // Sync push-block mesh to its physics body
    if (this._pushBlockBody && this._pushBlockMesh) {
      const t = this._pushBlockBody.translation();
      this._pushBlockMesh.position.set(t.x, t.y, t.z);
    }
    // Sync football mesh
    if (this._footballBody && this._footballMesh) {
      const t = this._footballBody.translation();
      const r = this._footballBody.rotation();
      this._footballMesh.position.set(t.x, t.y, t.z);
      this._footballMesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  /** Per-frame update — called by startLoop onFrame. */
  update(dt) {
    if (!this._started || this._finished) {
      // updateCamera called by main.js
      return;
    }

    this._elapsed += dt;

    // Sync creature meshes
    for (const entry of this._zooks) entry.zook.syncMeshes();

    // Check win conditions
    this._checkWinConditions();

    // Update HUD
    this._updateHUD(dt);

    // Cinematic camera director
    this._directCamera();

    // Time limit
    if (this._trial.maxTime && this._elapsed >= this._trial.maxTime) {
      this._endRace();
    }
  }

  // ── Win conditions ────────────────────────────────────────────────────────

  _checkWinConditions() {
    const { goal, dist } = this._trial;

    switch (goal) {
      case 'distance': this._checkDistance(dist || 25);    break;
      case 'height':   this._checkHeight();                 break;
      case 'lap':      this._checkLap();                   break;
      case 'blockDist':this._checkBlockPush(dist || 15);   break;
      case 'goal':     this._checkFootball();               break;
      case 'sumo':     this._checkSumo();                  break;
    }
  }

  _checkDistance(dist) {
    for (const entry of this._zooks) {
      if (entry.finished) continue;
      const pos = entry.zook.position;
      if (pos && -pos.z >= dist) {
        entry.finished   = true;
        entry.finishTime = this._elapsed;
        if (entry.isPlayer) {
          this._endRace({ won: true, metric: `${this._elapsed.toFixed(2)}s`, metricLabel: 'Time' });
        } else {
          // Check if all non-player zooks finished
          const opponentsDone = this._zooks.filter(e => !e.isPlayer).every(e => e.finished);
          if (opponentsDone) this._endRace({ won: false, metric: `${this._elapsed.toFixed(2)}s`, metricLabel: 'Time' });
        }
      }
    }
  }

  _checkHeight() {
    for (const entry of this._zooks) {
      const h = entry.zook.position?.y ?? 0;
      if (h > entry.maxHeight) entry.maxHeight = h;
    }
    // Resolved at time-limit via _endRace()
  }

  _checkLap() {
    for (const entry of this._zooks) {
      if (entry.finished) continue;
      const pos = entry.zook.position;
      if (!pos) continue;

      const gate = LAP_GATES[entry.lapGateIdx];
      if (!gate) continue;

      const dx = pos.x - gate.x;
      const dz = pos.z - gate.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        entry.lapGateIdx++;
        if (entry.lapGateIdx >= LAP_GATES.length) {
          entry.lapsDone++;
          entry.lapGateIdx = 0;
          if (entry.lapsDone >= 1) {
            entry.finished = true;
            const won = entry.isPlayer;
            this._endRace({ won, metric: `${this._elapsed.toFixed(2)}s`, metricLabel: 'Lap Time' });
          }
        }
      }
    }
  }

  _checkBlockPush(dist) {
    if (!this._pushBlockBody) return;
    const t = this._pushBlockBody.translation();
    if (-t.z >= dist) {
      this._endRace({ won: true, metric: `${(-t.z).toFixed(1)}m`, metricLabel: 'Block Distance' });
    }
  }

  _checkFootball() {
    if (!this._footballBody) return;
    const t = this._footballBody.translation();
    // Goal is at z = -20 (from env.buildFootball)
    if (t.z <= -19.5 && Math.abs(t.x) <= 2) {
      this._endRace({ won: true, metric: '1 – 0', metricLabel: 'Score' });
    }
  }

  _checkSumo() {
    for (const entry of this._zooks) {
      if (entry.finished) continue;
      const pos = entry.zook.position;
      if (!pos) continue;
      const r    = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      const fell = pos.y < -0.5;

      if (fell || r > SUMO_RING_RADIUS) {
        entry.finished = true;
        haptic.impact();
        if (!entry.isPlayer) {
          this._endRace({ won: true,  metric: `${this._elapsed.toFixed(1)}s`, metricLabel: 'Time' });
        } else {
          this._endRace({ won: false, metric: `${this._elapsed.toFixed(1)}s`, metricLabel: 'Time' });
        }
      }
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  _updateHUD(dt) {
    if (!this._hud) return;

    const playerEntry = this._zooks.find(e => e.isPlayer);
    if (!playerEntry) return;

    const pos   = playerEntry.zook.position;
    const distZ = pos ? Math.max(0, -pos.z) : 0;

    // Estimate speed from delta-z
    const speed = pos
      ? Math.abs((pos.z - playerEntry.prevZ) / Math.max(dt, 0.001))
      : 0;
    if (pos) playerEntry.prevZ = pos.z;

    // Position ranking
    const sorted = [...this._zooks].sort((a, b) => {
      const pa = a.zook.position;
      const pb = b.zook.position;
      if (!pa || !pb) return 0;
      return pa.z - pb.z;
    });
    const playerPos = sorted.findIndex(e => e.isPlayer) + 1;

    // Lead change detection
    const leadEntry = sorted[0];
    if (this._lowerThird && leadEntry && leadEntry.name !== this._lastLeadName && this._elapsed > 3) {
      this._lastLeadName = leadEntry.name;
      this._lowerThird.show(`${leadEntry.name} takes the lead!`);
    }

    this._hud.update({
      time:         this._elapsed * 1000,
      distance:     distZ,
      height:       playerEntry.maxHeight || 0,
      speed,
      playerPos,
      totalPlayers: this._zooks.length,
    });
  }

  // ── Camera director ───────────────────────────────────────────────────────

  _directCamera() {
    const trial    = this._trial;
    const progress = Math.min(1, this._elapsed / (trial.maxTime || 60));

    if (trial.goal === 'height') {
      this._camPhase = CAM_HIGHJUMP;
    } else if (progress < 0.2) {
      this._camPhase = CAM_BROADCAST;
    } else if (progress < 0.9) {
      this._camPhase = CAM_FOLLOW;
    } else {
      this._camPhase = CAM_FINISH;
    }

    // Find lead creature (lowest z = furthest along track)
    const leadEntry = this._zooks.reduce((best, e) => {
      if (!best) return e;
      const pb = best.zook.position;
      const pe = e.zook.position;
      if (!pe) return best;
      if (!pb) return e;
      return pe.z < pb.z ? e : best;
    }, null);

    const lp = leadEntry?.zook?.position;

    switch (this._camPhase) {
      case CAM_BROADCAST:
        setCamera(
          { x: 8, y: 4, z: lp ? lp.z + 2 : 0 },
          { x: 0, y: 0.5, z: lp ? lp.z - 5 : -6 }
        );
        break;

      case CAM_FOLLOW:
        if (lp) {
          setCamera(
            { x: lp.x + 0.5, y: lp.y + 2.5, z: lp.z + 5 },
            { x: lp.x, y: lp.y + 0.5, z: lp.z - 3 }
          );
        }
        break;

      case CAM_FINISH: {
        const finishZ = -(trial.dist || 25);
        setCamera(
          { x: 0, y: 3, z: finishZ - 3 },
          { x: 0, y: 0.5, z: finishZ + 5 }
        );
        break;
      }

      case CAM_HIGHJUMP:
        if (lp) {
          const camY = Math.max(3, lp.y + 2.5);
          setCamera(
            { x: 5, y: camY, z: lp.z + 4 },
            { x: lp.x, y: lp.y, z: lp.z }
          );
        }
        break;
    }
  }

  // ── Race end ──────────────────────────────────────────────────────────────

  _endRace(result = {}) {
    if (this._finished) return;
    this._finished = true;

    if (this._countdownTimer) { clearTimeout(this._countdownTimer); this._countdownTimer = null; }

    const { won = false, metric, metricLabel } = result;

    // Determine final metric for height goal
    const finalMetric = metric ?? (this._trial.goal === 'height'
      ? (() => {
          const playerEntry = this._zooks.find(e => e.isPlayer);
          return `${(playerEntry?.maxHeight ?? 0).toFixed(2)}m`;
        })()
      : `${this._elapsed.toFixed(2)}s`);

    if (won) haptic.win();
    else     haptic.impact();

    const resultObj = {
      won,
      metric:      finalMetric,
      metricStr:   finalMetric,
      metricLabel: metricLabel ?? 'Result',
      trialLabel:  this._trial.label || this._trial.id,
    };

    // Delay slightly so player can see what happened
    setTimeout(() => {
      if (typeof this._onFinish === 'function') {
        this._onFinish(resultObj);
      }
    }, 900);
  }
}
