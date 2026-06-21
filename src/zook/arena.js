/**
 * arena.js — the BAMZOOKi test table.
 *
 * A plain raised table where you set a Zook loose to see how it moves. Tap the
 * table to drop a target marker — the Zook walks toward it, exactly as in the
 * Zook Kit ("Zooks will only ever try and move towards a target on the floor").
 * A simple obstacle (a ramp) can be placed on the table.
 */

import * as THREE from 'three';
import { Zook } from './model.js';
import { setCamera } from '../engine/renderer.js';

const TABLE_W = 6;
const TABLE_L = 18;

export class Arena {
  /** @param {{ scene, world, RAPIER, camera, canvas }} o */
  constructor({ scene, world, RAPIER, camera, canvas }) {
    this.scene = scene; this.world = world; this.RAPIER = RAPIER;
    this.camera = camera; this.canvas = canvas;
    this.zook = null; this._meshes = []; this._bodies = [];
    this.target = null; this._marker = null;
    this._ray = new THREE.Raycaster(); this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._onPointer = this._onPointer.bind(this);
  }

  enter(blueprint, { obstacles = true } = {}) {
    this._buildTable();
    if (obstacles) this._buildObstacle();

    this.zook = new Zook(blueprint, {
      scene: this.scene, world: this.world, RAPIER: this.RAPIER,
      pos: { x: 0, z: TABLE_L / 2 - 2.5 },
    });

    // Target marker (the red floor dot) — starts at the far end.
    this._marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0x551015, roughness: 0.4 }),
    );
    this._marker.position.set(0, 0.03, -TABLE_L / 2 + 3);
    this.scene.add(this._marker);
    this.target = { x: 0, z: -TABLE_L / 2 + 3 };

    setCamera({ x: 5.5, y: 4.5, z: TABLE_L / 2 + 1 }, { x: 0, y: 0, z: 0 }, true);
    this.canvas.addEventListener('pointerdown', this._onPointer);
  }

  exit() {
    this.canvas.removeEventListener('pointerdown', this._onPointer);
    if (this.zook) { this.zook.dispose(); this.zook = null; }
    if (this._marker) { this.scene.remove(this._marker); this._marker = null; }
    for (const m of this._meshes) { this.scene.remove(m); m.geometry?.dispose?.(); }
    for (const b of this._bodies) { try { this.world.removeRigidBody(b); } catch (_) {} }
    this._meshes = []; this._bodies = [];
  }

  _onPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    this._ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (this._ray.ray.intersectPlane(this._plane, hit)) {
      hit.x = Math.max(-TABLE_W / 2, Math.min(TABLE_W / 2, hit.x));
      hit.z = Math.max(-TABLE_L / 2, Math.min(TABLE_L / 2, hit.z));
      this.target = { x: hit.x, z: hit.z };
      if (this._marker) this._marker.position.set(hit.x, 0.03, hit.z);
    }
  }

  onStep(dt) {
    if (!this.zook) return;
    const p = this.zook.position;
    const reached = this.target && Math.hypot(p.x - this.target.x, p.z - this.target.z) < 0.8;
    this.zook.step(dt, { walk: !reached, target: reached ? null : this.target });
  }

  update() {
    if (!this.zook) return;
    this.zook.syncMeshes();
    if (this._marker) this._marker.rotation.y += 0.04;
    const p = this.zook.position;
    setCamera({ x: 5.0, y: 3.6, z: p.z + 4.5 }, { x: 0, y: 0.4, z: p.z - 1.5 });
  }

  // ── build ──────────────────────────────────────────────────────────────────
  _addBox({ pos, size, color, friction = 0.9, rot }) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 }),
    );
    mesh.position.set(pos.x, pos.y, pos.z);
    if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    mesh.receiveShadow = mesh.castShadow = true;
    this.scene.add(mesh); this._meshes.push(mesh);

    const R = this.RAPIER;
    const desc = R.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);
    if (rot) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x || 0, rot.y || 0, rot.z || 0));
      desc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
    const b = this.world.createRigidBody(desc);
    this.world.createCollider(R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(friction), b);
    this._bodies.push(b);
  }

  _buildTable() {
    this._addBox({ pos: { x: 0, y: -0.2, z: 0 }, size: { x: TABLE_W, y: 0.4, z: TABLE_L }, color: 0xeee7d6 });
    this._addBox({ pos: { x: 0, y: -0.36, z: 0 }, size: { x: TABLE_W + 0.4, y: 0.2, z: TABLE_L + 0.4 }, color: 0xb9a98a });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      this._addBox({ pos: { x: sx * (TABLE_W / 2 - 0.5), y: -1.7, z: sz * (TABLE_L / 2 - 0.8) }, size: { x: 0.4, y: 3, z: 0.4 }, color: 0x8a7a5c });
    }
  }

  _buildObstacle() {
    this._addBox({ pos: { x: 0, y: 0.18, z: -1 }, size: { x: 3.2, y: 0.4, z: 2.6 }, color: 0xff8a1e, rot: { x: -0.3 } });
  }
}
