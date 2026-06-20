import * as THREE from 'three';

// ── Camera goal state ────────────────────────────────────────────────────────
const _camGoalPos    = new THREE.Vector3(0, 4, 10);
const _camGoalTarget = new THREE.Vector3(0, 0, 0);
const _camCurPos     = new THREE.Vector3(0, 4, 10);
const _camCurTarget  = new THREE.Vector3(0, 0, 0);

let _camera = null;
let _instant = false;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the Three.js renderer, scene, camera and lights.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, clock: THREE.Clock }}
 */
export function initRenderer(canvas) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace   = THREE.SRGBColorSpace;

  // Scene + fog
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfbf7ec);
  scene.fog = new THREE.Fog(0xfbf7ec, 18, 45);

  // Camera
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
  camera.position.set(0, 4, 10);
  camera.lookAt(0, 0, 0);
  _camera = camera;

  // Hemisphere light (warm sky / dark ground)
  const hemi = new THREE.HemisphereLight(0xffeedd, 0x443322, 1.2);
  scene.add(hemi);

  // Directional sun light
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.6);
  sun.position.set(6, 10, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.width  = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 60;
  sun.shadow.camera.left   = -20;
  sun.shadow.camera.right  =  20;
  sun.shadow.camera.top    =  20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Rim light (cool blue fill from behind)
  const rim = new THREE.DirectionalLight(0xaaddff, 0.4);
  rim.position.set(-4, 6, -4);
  scene.add(rim);

  // Resize handler
  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  const clock = new THREE.Clock();
  return { renderer, scene, camera, clock };
}

/**
 * Set a new camera goal position and look-at target.
 * @param {THREE.Vector3|{x,y,z}} pos
 * @param {THREE.Vector3|{x,y,z}} target
 * @param {boolean} instant  — snap immediately without lerp
 */
export function setCamera(pos, target, instant = false) {
  _camGoalPos.set(pos.x, pos.y, pos.z);
  _camGoalTarget.set(target.x, target.y, target.z);
  _instant = instant;

  if (instant) {
    _camCurPos.copy(_camGoalPos);
    _camCurTarget.copy(_camGoalTarget);
    if (_camera) {
      _camera.position.copy(_camCurPos);
      _camera.lookAt(_camCurTarget);
    }
  }
}

/**
 * Lerp the camera toward its goal. Call once per animation frame.
 * @param {number} dt  delta-time in seconds
 */
export function updateCamera(dt) {
  if (!_camera) return;

  const alpha = Math.min(1, dt * 5); // ~5 units/s blending speed

  _camCurPos.lerp(_camGoalPos, alpha);
  _camCurTarget.lerp(_camGoalTarget, alpha);

  _camera.position.copy(_camCurPos);
  _camera.lookAt(_camCurTarget);
}
