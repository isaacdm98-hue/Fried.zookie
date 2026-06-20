import * as THREE from 'three';

// ── Toon gradient texture ────────────────────────────────────────────────────

function makeToonGradient(steps = 4) {
  const size   = 256;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < steps; i++) {
    const t   = i / steps;
    const lum = Math.round(55 + t * 190);
    ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
    ctx.fillRect(Math.round(t * size), 0, Math.round(size / steps), 1);
  }
  const tex  = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

const GRAD_TEX = /* lazy */ { _v: null, get() { return this._v || (this._v = makeToonGradient()); } };

function toonMat(color, darker = false) {
  const c = new THREE.Color(color);
  if (darker) c.multiplyScalar(0.72);
  return new THREE.MeshToonMaterial({
    color:        c,
    gradientMap:  GRAD_TEX.get(),
  });
}

// ── Leg layout helper ────────────────────────────────────────────────────────

/**
 * Returns an array of `{ x, z, phase }` for each leg pivot.
 * Legs are evenly spaced along the body z axis, alternating left/right.
 *
 * @param {{ legCount: number, body: { l: number }, leg: { len: number } }} genome
 * @returns {Array<{x: number, z: number, phase: number}>}
 */
export function legLayout(genome) {
  const { legCount, body, leg } = genome;
  const pairsCount = legCount / 2;           // how many rows of leg pairs
  const bodyHalf   = body.l * 0.45;          // half-length for leg spread along z
  const legOut     = body.w / 2 + leg.radius * 0.5; // lateral offset from centre

  const result = [];
  for (let i = 0; i < legCount; i++) {
    const pairIndex = Math.floor(i / 2);
    const side      = i % 2 === 0 ? -1 : 1;  // -1 = left, +1 = right

    const zFrac = pairsCount > 1
      ? pairIndex / (pairsCount - 1)
      : 0.5;
    const zPos  = bodyHalf - zFrac * bodyHalf * 2;  // front → back

    // Contralateral gait: opposite sides are half a cycle apart
    // Within each pair, rear legs lag by a quarter cycle
    const sidePhase = side === -1 ? 0 : Math.PI;
    const pairPhase = (pairIndex / pairsCount) * Math.PI;
    const phase     = sidePhase + pairPhase;

    result.push({ x: side * legOut, z: zPos, phase });
  }
  return result;
}

// ── Zook class ───────────────────────────────────────────────────────────────

export class Zook {
  /**
   * @param {object} genome
   * @param {import('@dimforge/rapier3d-compat').World|null} world
   * @param {typeof import('@dimforge/rapier3d-compat')|null} RAPIER
   * @param {THREE.Scene} scene
   * @param {{ x?: number, z?: number, heading?: number, tint?: string|null, isPreview?: boolean }} opts
   */
  constructor(genome, world, RAPIER, scene, {
    x         = 0,
    z         = 0,
    heading   = 0,
    tint      = null,
    isPreview = false,
  } = {}) {
    this.genome    = genome;
    this.world     = world;
    this.RAPIER    = RAPIER;
    this.scene     = scene;
    this.isPreview = isPreview;

    this._t          = 0;             // animation clock
    this._onGround   = true;
    this._steer      = 0;
    this._legPivots  = [];            // THREE.Group per leg (pivot at hip)
    this._physBody   = null;

    // Effective color (tint overrides genome color)
    const color = tint || genome.color || '#e8854a';

    // ── Group ───────────────────────────────────────────────────────────────
    this.group = new THREE.Group();
    this.group.position.set(x, genome.leg.len + genome.body.h / 2, z);
    this.group.rotation.y = heading;
    scene.add(this.group);

    // ── Body mesh (capsule, scaled on x for width) ──────────────────────────
    const capsuleR  = genome.body.h / 2;
    const capsuleL  = Math.max(genome.body.l * 0.8 - capsuleR * 2, 0.05);
    const bodyGeo   = new THREE.CapsuleGeometry(capsuleR, capsuleL, 8, 16);
    const bodyMesh  = new THREE.Mesh(bodyGeo, toonMat(color));
    bodyMesh.scale.x     = genome.body.w / genome.body.h; // squash/stretch laterally
    bodyMesh.castShadow  = true;
    bodyMesh.receiveShadow = true;
    // Capsule is oriented along Y; rotate so length runs along Z
    bodyMesh.rotation.x = Math.PI / 2;
    this.group.add(bodyMesh);
    this._bodyMesh = bodyMesh;

    // ── Eyes ────────────────────────────────────────────────────────────────
    const eyeR      = 0.07;
    const eyeMat    = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: GRAD_TEX.get() });
    const pupilMat  = new THREE.MeshToonMaterial({ color: 0x111111, gradientMap: GRAD_TEX.get() });
    const eyeGeo    = new THREE.SphereGeometry(eyeR, 8, 6);
    const pupilGeo  = new THREE.SphereGeometry(eyeR * 0.55, 6, 5);

    const eyeOffsetY = genome.body.h * 0.25;
    const eyeOffsetZ = genome.body.l * 0.42;
    const eyeSpread  = genome.body.w * 0.22;

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(sx * eyeSpread, eyeOffsetY, -eyeOffsetZ);
      this.group.add(eye);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(sx * eyeSpread, eyeOffsetY, -eyeOffsetZ - eyeR * 0.8);
      this.group.add(pupil);
    }

    // ── Legs ────────────────────────────────────────────────────────────────
    const layout     = legLayout(genome);
    const legLen     = genome.leg.len;
    const legR       = genome.leg.radius;
    const legCapR    = legR;
    const legCapL    = Math.max(legLen - legR * 2, 0.05);
    const legGeo     = new THREE.CapsuleGeometry(legCapR, legCapL, 4, 8);
    const legMat     = toonMat(color, true);

    for (const { x: lx, z: lz, phase } of layout) {
      // Pivot at hip joint (at top of leg)
      const pivot = new THREE.Group();
      pivot.position.set(lx, -genome.body.h / 2, lz);
      pivot.userData.phase    = phase;
      pivot.userData.restRotX = 0;
      this.group.add(pivot);

      // Leg mesh: capsule hangs downward from pivot
      const legMesh = new THREE.Mesh(legGeo, legMat);
      legMesh.castShadow = true;
      // Position so the top of the leg starts at origin of pivot
      legMesh.position.y = -legLen / 2;
      pivot.add(legMesh);

      this._legPivots.push(pivot);
    }

    // ── Physics body ────────────────────────────────────────────────────────
    if (!isPreview && world && RAPIER) {
      const totalH = genome.body.h + genome.leg.len;
      const spawnY = totalH / 2 + 0.05;

      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, spawnY + (genome.leg.len), z)
        .setLinearDamping(0.4)
        .setAngularDamping(4.0);

      this._physBody = world.createRigidBody(bodyDesc);

      const colliderDesc = RAPIER.ColliderDesc
        .cuboid(genome.body.w / 2, totalH / 2, genome.body.l / 2)
        .setFriction(0.7)
        .setRestitution(0.1)
        .setMass(genome.body.mass);

      world.createCollider(colliderDesc, this._physBody);
    }
  }

  // ── Step ──────────────────────────────────────────────────────────────────

  /**
   * Drive the creature one physics step.
   * @param {number} dt
   * @param {{ jump?: boolean, steerLeft?: boolean, steerRight?: boolean }} inputs
   */
  step(dt, inputs = {}) {
    this._t += dt;

    const { gait, leg, body } = this.genome;
    const t = this._t;

    // ── Leg animation ────────────────────────────────────────────────────────
    for (const pivot of this._legPivots) {
      const phase = pivot.userData.phase;
      const angle = gait.amplitude * Math.sin(2 * Math.PI * gait.freq * t + phase);
      pivot.rotation.x = angle;

      // Slight lateral sway
      const swayAmp = gait.amplitude * 0.25;
      pivot.rotation.z = swayAmp * Math.sin(2 * Math.PI * gait.freq * t + phase + Math.PI / 4);
    }

    // ── Physics driving ──────────────────────────────────────────────────────
    if (this._physBody) {
      // Steer from inputs
      if (inputs.steerLeft)  this._steer =  1;
      if (inputs.steerRight) this._steer = -1;
      if (!inputs.steerLeft && !inputs.steerRight) this._steer *= 0.85; // decay

      // Genome's inherent steer bias added on top
      const totalSteer = this._steer + (gait.steer || 0);

      // Current facing direction from body rotation
      const rot    = this._physBody.rotation();
      const yaw    = Math.atan2(
        2 * (rot.w * rot.y + rot.x * rot.z),
        1 - 2 * (rot.y * rot.y + rot.z * rot.z),
      );
      const fwdX   = -Math.sin(yaw);
      const fwdZ   = -Math.cos(yaw);

      // Ground-contact check: if body centre is close to floor
      const pos    = this._physBody.translation();
      const floorY = leg.len + body.h / 2;
      this._onGround = pos.y < floorY * 1.35;

      // Forward thrust (only when on ground)
      if (this._onGround) {
        const force = gait.drive * body.mass;
        this._physBody.applyImpulse(
          { x: fwdX * force * dt, y: 0, z: fwdZ * force * dt },
          true,
        );
      }

      // Yaw torque for steering
      if (Math.abs(totalSteer) > 0.005) {
        const torque = totalSteer * gait.steer !== undefined
          ? totalSteer * 2.0
          : totalSteer * 1.5;
        this._physBody.applyTorqueImpulse({ x: 0, y: torque * dt, z: 0 }, true);
      }

      // Jump
      if (inputs.jump && this._onGround) {
        const jumpImpulse = (gait.jump || 0) * body.mass;
        if (jumpImpulse > 0) {
          this._physBody.applyImpulse({ x: 0, y: jumpImpulse, z: 0 }, true);
        }
      }

      // Upright torque — prevent the creature from tipping over
      const rx  = rot.x;
      const rz  = rot.z;
      this._physBody.applyTorqueImpulse(
        { x: -rx * 8 * dt, y: 0, z: -rz * 8 * dt },
        true,
      );
    }
  }

  // ── Sync meshes ──────────────────────────────────────────────────────────

  /** Copy Rapier body transform to the Three.js group. */
  syncMeshes() {
    if (!this._physBody) return;

    const t = this._physBody.translation();
    const r = this._physBody.rotation();

    this.group.position.set(t.x, t.y, t.z);
    this.group.quaternion.set(r.x, r.y, r.z, r.w);
  }

  // ── Accessors ────────────────────────────────────────────────────────────

  /** @returns {{ x: number, y: number, z: number }} */
  get position() {
    if (this._physBody) {
      const t = this._physBody.translation();
      return { x: t.x, y: t.y, z: t.z };
    }
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
    };
  }

  // ── Dispose ──────────────────────────────────────────────────────────────

  dispose() {
    this.scene.remove(this.group);

    // Dispose geometries + materials recursively
    this.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    if (this._physBody && this.world) {
      try { this.world.removeRigidBody(this._physBody); } catch (_) { /* already gone */ }
      this._physBody = null;
    }
  }
}
