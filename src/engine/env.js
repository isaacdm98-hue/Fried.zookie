import * as THREE from 'three';
import { createGround, createBox, createSphere } from './physics.js';

// ── Toon shading (matches the creatures for a cohesive Bamzooki look) ─────────

function makeToonGradient(steps = 3) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const lum = Math.round(120 + t * 135);   // brighter banding = clean studio feel
    ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
    ctx.fillRect(Math.round(t * 256), 0, Math.ceil(256 / steps), 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  return tex;
}
const TOON_GRAD = { _v: null, get() { return this._v || (this._v = makeToonGradient()); } };

function makeMat(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: TOON_GRAD.get() });
}

// Clean, bright Bamzooki palette
const GREEN_MAT   = makeMat(0x8ed158);   // grass
const LANE_MAT    = new THREE.LineBasicMaterial({ color: 0xffffff });
const HURDLE_MAT  = makeMat(0xff8a1e);   // bright orange
const TRUNK_MAT   = makeMat(0x9c6b3f);
const FOLIAGE_MAT = makeMat(0x46a046);
const FOLIAGE_MAT2 = makeMat(0x5cbf5c);  // lighter tier for 2-tone trees
const STAND_MAT   = makeMat(0xf0e2c0);
const GOAL_MAT    = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const RING_MAT    = makeMat(0x38bdf8);   // clean blue mat
const RIM_MAT     = makeMat(0xff8a1e);   // orange rim
const RAMP_MAT    = makeMat(0xffc24a);   // warm yellow
const POLE_MAT    = makeMat(0xff5a5a);
const BAR_MAT     = makeMat(0xff5a5a);
const WALL_MAT    = makeMat(0xb89a6a);
const BLOCK_MAT   = makeMat(0x9b6be0);   // bright purple
const BALL_MAT    = makeMat(0xffffff);

// ── Environment class ─────────────────────────────────────────────────────────

export class Environment {
  /**
   * @param {THREE.Scene} scene
   * @param {typeof import('@dimforge/rapier3d-compat')} RAPIER
   * @param {import('@dimforge/rapier3d-compat').World} world
   */
  constructor(scene, RAPIER, world) {
    this._scene  = scene;
    this._RAPIER = RAPIER;
    this._world  = world;
    this._meshes = [];       // Three.js objects to remove on dispose
    this._bodies = [];       // Rapier bodies to remove on dispose
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _add(mesh) {
    this._scene.add(mesh);
    this._meshes.push(mesh);
    return mesh;
  }

  _addBody(body) {
    this._bodies.push(body);
    return body;
  }

  /**
   * Flat green ground plane (visual only — physics handled by createGround).
   * @param {number} [w=60]
   * @param {number} [d=40]
   */
  _addGroundPlane(w = 60, d = 40) {
    const geo  = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, GREEN_MAT);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this._add(mesh);
  }

  /**
   * @param {number} x
   * @param {number} z
   */
  _addTree(x, z) {
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6),
      TRUNK_MAT,
    );
    trunk.position.set(x, 0.4, z);
    trunk.castShadow = true;
    this._add(trunk);

    // Two-tier stylised fir (clean, cohesive with the toon look)
    const lower = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 8), FOLIAGE_MAT);
    lower.position.set(x, 1.35, z);
    lower.castShadow = true;
    this._add(lower);

    const upper = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.0, 8), FOLIAGE_MAT2);
    upper.position.set(x, 2.05, z);
    upper.castShadow = true;
    this._add(upper);
  }

  /** Low bleacher stands behind the track */
  _addStands() {
    const rows = 3;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.25, 0.5),
          STAND_MAT,
        );
        mesh.position.set(-4.5 + c * 1.25, 0.125 + r * 0.3, 14 + r * 0.6);
        mesh.receiveShadow = true;
        this._add(mesh);
      }
    }
  }

  /** Two white lane lines running along z axis */
  _addLaneLines(halfLen = 30) {
    const pts = (x) => [
      new THREE.Vector3(x, 0.01, -halfLen),
      new THREE.Vector3(x, 0.01,  halfLen),
    ];

    for (const x of [-1.5, 1.5]) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts(x));
      this._add(new THREE.LineSegments(geo, LANE_MAT));
    }

    // Centre dashes
    for (let z = -halfLen; z < halfLen; z += 3) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.01, z),
        new THREE.Vector3(0, 0.01, z + 1.5),
      ]);
      this._add(new THREE.LineSegments(geo, LANE_MAT));
    }
  }

  /** Finish line (solid white bar at given z) */
  _addFinishLine(z, label = 'finish') {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4, 0.02, z),
      new THREE.Vector3( 4, 0.02, z),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: label === 'finish' ? 0xffff00 : 0xffffff,
      linewidth: 3,
    });
    this._add(new THREE.LineSegments(geo, mat));

    // Thick bar using thin box
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.03, 0.1),
      makeMat(label === 'finish' ? 0xffee00 : 0xffffff),
    );
    bar.position.set(0, 0.02, z);
    this._add(bar);
  }

  /** Side trees lining a sprint track */
  _addSideTrees(halfLen = 25, spacing = 5) {
    for (let z = -halfLen; z <= halfLen; z += spacing) {
      this._addTree(-5.5, z);
      this._addTree( 5.5, z);
    }
  }

  // ── Public build methods ────────────────────────────────────────────────────

  /** Flat grass track with ground physics. */
  buildFlat() {
    this._addGroundPlane(60, 40);
    this._addStands();
    const body = createGround(this._world, this._RAPIER);
    this._addBody(body);
  }

  /** Sprint track: flat + lane lines + start/finish + trees. */
  buildSprint() {
    this.buildFlat();
    this._addLaneLines(28);
    this._addFinishLine(-25, 'finish');
    this._addFinishLine(  5, 'start');
    this._addSideTrees(25, 5);
  }

  /** Sprint + 5 hurdle bars. */
  buildHurdles() {
    this.buildSprint();

    const hurdleZ = [-20, -15, -10, -5, 0];
    for (const z of hurdleZ) {
      // Visual bar
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.1, 0.1),
        HURDLE_MAT,
      );
      mesh.position.set(0, 0.75, z);
      mesh.castShadow = true;
      this._add(mesh);

      // Support poles
      for (const x of [-1.4, 1.4]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6),
          HURDLE_MAT,
        );
        pole.position.set(x, 0.4, z);
        this._add(pole);
      }

      // Physics collider for the bar
      const body = createBox(this._world, this._RAPIER, {
        pos:         { x: 0, y: 0.75, z },
        size:        { x: 3.0, y: 0.1, z: 0.1 },
        mass:        0,   // static
        restitution: 0.3,
        friction:    0.4,
      });
      this._addBody(body);
    }
  }

  /** Flat landing pad + a horizontal bar that slides upward. */
  buildHighJump() {
    this.buildFlat();

    // High-jump bar mesh (starts at y=2)
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 4, 8),
      BAR_MAT,
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2, -5);
    bar.castShadow = true;
    this._add(bar);

    // Support poles
    for (const x of [-2, 2]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8),
        POLE_MAT,
      );
      pole.position.set(x, 1.75, -5);
      this._add(pole);
    }

    // Physics body for bar (kinematic – the caller can animate it)
    const barBody = createBox(this._world, this._RAPIER, {
      pos:  { x: 0, y: 2, z: -5 },
      size: { x: 4, y: 0.08, z: 0.08 },
      mass: 0,
    });
    this._addBody(barBody);

    // Attach reference so callers can raise it
    this.highJumpBar      = bar;
    this.highJumpBarBody  = barBody;
  }

  /** Oval track with 4 gate poles at compass points. */
  buildLap() {
    this.buildFlat();

    // Oval outline using a line loop approximation
    const segments = 64;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(8 * Math.cos(t), 0.02, 14 * Math.sin(t)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this._add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff })));

    // Gate poles at cardinal directions
    const gatePositions = [
      { x: 0, z: -14 }, { x: 0, z: 14 },
      { x: -8, z: 0  }, { x: 8, z: 0 },
    ];
    for (const { x, z } of gatePositions) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
        POLE_MAT,
      );
      pole.position.set(x, 1.5, z);
      pole.castShadow = true;
      this._add(pole);
    }
  }

  /** Sprint + one heavy 1 m cube at z = -8. */
  buildBlockPush() {
    this.buildSprint();

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      BLOCK_MAT,
    );
    mesh.position.set(0, 0.5, -8);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this._add(mesh);

    const body = createBox(this._world, this._RAPIER, {
      pos:         { x: 0, y: 0.5, z: -8 },
      size:        { x: 1, y: 1, z: 1 },
      mass:        8,
      restitution: 0.1,
      friction:    0.8,
    });
    this._addBody(body);

    // Let the caller sync mesh to body each frame
    this.pushBlock      = mesh;
    this.pushBlockBody  = body;
  }

  /** Flat field + ball + goal sensor. */
  buildFootball() {
    this.buildFlat();

    // Ball mesh
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 12),
      BALL_MAT,
    );
    ball.position.set(0, 0.3, 0);
    ball.castShadow = true;
    this._add(ball);

    // Ball physics
    const ballBody = createSphere(this._world, this._RAPIER, {
      pos:         { x: 0, y: 0.3, z: 0 },
      r:           0.3,
      mass:        0.5,
      restitution: 0.7,
      friction:    0.3,
    });
    this._addBody(ballBody);

    // Two goal frames — the player attacks the far goal (-z), rivals the near.
    for (const z of [-20, 20]) {
      const goalMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.5, 0.1),
        GOAL_MAT,
      );
      goalMesh.position.set(0, 1.25, z);
      this._add(goalMesh);
    }

    // Goal sensor (far goal — kept for legacy single-goal checks)
    const goalBody = createBox(this._world, this._RAPIER, {
      pos:      { x: 0, y: 1.25, z: -20 },
      size:     { x: 4, y: 2.5, z: 0.5 },
      mass:     0,
      isSensor: true,
    });
    this._addBody(goalBody);

    this.footballBall     = ball;
    this.footballBallBody = ballBody;
    this.goalSensorBody   = goalBody;
  }

  /** Circular sumo ring, slightly raised. */
  buildSumo() {
    this.buildFlat();

    // Raised ring platform
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.1, 0.2, 32),
      RING_MAT,
    );
    ring.position.set(0, 0.1, 0);
    ring.receiveShadow = true;
    this._add(ring);

    // Ring collider (slightly wider so creatures don't slip through edge)
    const ringBody = createBox(this._world, this._RAPIER, {
      pos:  { x: 0, y: 0.1, z: 0 },
      size: { x: 6, y: 0.2, z: 6 },
      mass: 0,
    });
    this._addBody(ringBody);

    // Rim border (thin torus-like ring of boxes)
    const rimSegs = 16;
    for (let i = 0; i < rimSegs; i++) {
      const angle = (i / rimSegs) * Math.PI * 2;
      const rx    = Math.cos(angle) * 3;
      const rz    = Math.sin(angle) * 3;

      const rimMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.35, 0.18),
        RIM_MAT,
      );
      rimMesh.position.set(rx, 0.3, rz);
      this._add(rimMesh);

      const rimBody = createBox(this._world, this._RAPIER, {
        pos:  { x: rx, y: 0.3, z: rz },
        size: { x: 0.18, y: 0.35, z: 0.18 },
        mass: 0,
      });
      this._addBody(rimBody);
    }

    // Out-of-bounds sensor at y = -2
    const oobBody = createBox(this._world, this._RAPIER, {
      pos:      { x: 0, y: -2, z: 0 },
      size:     { x: 40, y: 0.5, z: 40 },
      mass:     0,
      isSensor: true,
    });
    this._addBody(oobBody);
    this.sumoOobBody = oobBody;
  }

  /** Assault course: sprint + ramps + wall gaps. */
  buildAssault() {
    this.buildSprint();

    // Three ramps at different z positions
    const rampDefs = [
      { z: -5,  rotX:  0.35 },
      { z: -12, rotX: -0.35 },
      { z: -19, rotX:  0.35 },
    ];

    for (const { z, rotX } of rampDefs) {
      const rampMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.15, 2.5),
        RAMP_MAT,
      );
      rampMesh.position.set(0, 0.55, z);
      rampMesh.rotation.x = rotX;
      rampMesh.castShadow    = true;
      rampMesh.receiveShadow = true;
      this._add(rampMesh);

      // Rapier doesn't support angled half-spaces easily, so approximate
      // with a thin cuboid at the same angle
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, 0, 0));
      const rampBodyDesc = this._RAPIER.RigidBodyDesc.fixed()
        .setTranslation(0, 0.55, z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      const rampBody = this._world.createRigidBody(rampBodyDesc);
      const rampCollider = this._RAPIER.ColliderDesc
        .cuboid(2, 0.075, 1.25)
        .setFriction(0.7)
        .setRestitution(0.1);
      this._world.createCollider(rampCollider, rampBody);
      this._addBody(rampBody);
    }

    // Two wall-gap obstacles (pair of half-walls with a gap)
    const wallZ = [-8, -16];
    for (const z of wallZ) {
      for (const side of [-1, 1]) {
        const wallMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 0.3),
          WALL_MAT,
        );
        wallMesh.position.set(side * 2.25, 0.75, z);
        wallMesh.castShadow = true;
        this._add(wallMesh);

        const wallBody = createBox(this._world, this._RAPIER, {
          pos:  { x: side * 2.25, y: 0.75, z },
          size: { x: 1.5, y: 1.5, z: 0.3 },
          mass: 0,
        });
        this._addBody(wallBody);
      }
    }
  }

  // ── Dispose ─────────────────────────────────────────────────────────────────

  dispose() {
    for (const mesh of this._meshes) {
      this._scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    }
    this._meshes.length = 0;

    for (const body of this._bodies) {
      try { this._world.removeRigidBody(body); } catch (_) { /* already gone */ }
    }
    this._bodies.length = 0;

    // Clear optional refs
    this.highJumpBar      = null;
    this.highJumpBarBody  = null;
    this.pushBlock        = null;
    this.pushBlockBody    = null;
    this.footballBall     = null;
    this.footballBallBody = null;
    this.goalSensorBody   = null;
    this.sumoOobBody      = null;
  }
}
