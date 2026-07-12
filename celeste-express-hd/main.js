/* ============================================================================
   CELESTE EXPRESS — HD pipeline renderer (Messenger-style).
   Modern ES module. Cel + rim shading, procedural parallax passing-scenery
   that auto-upgrades to Higgsfield biome plates when reachable, refined
   animated characters, richer carriage materials. Reuses the tested engine
   logic in window.CE (engine.js) for the Beat Clock, streaming, world, etc.
   Three.js r128 (vendored ES module). British English throughout.
   ============================================================================ */
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/GLTFLoader.js';

const CE = window.CE;
const doc = document;

/* -- locked marigold-over-plum palette ------------------------------------- */
const P = {
  plum: 0x2B1B33, velvet: 0x46284F, marigold: 0xFFB13D, tangerine: 0xFF7847,
  peach: 0xFFE8CE, gold: 0xD9A441, teal: 0x35C4B5, raspberry: 0xE8508D,
  green: 0x6FA05E, hush: 0x8D8A93
};
const hexStr = (n) => '#' + n.toString(16).padStart(6, '0');

/* -- Higgsfield biome scenery (art bible). Loaded at runtime with graceful
      fallback: local assets/ first, then the Higgsfield CDN, then procedural.
      Generated via soul_location, 21:9, marigold-over-plum style token. ----- */
const HF_BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/';
const SCENERY = {
  'Dusk Desert':      { slug: 'dusk_desert',      hf: HF_BASE + 'hf_20260712_103128_ccfafb04-018f-46ef-9466-f88dd625ce51.png', top: P.raspberry, bot: P.marigold, hill: P.velvet },
  'Aurora Tundra':    { slug: 'aurora_tundra',    hf: HF_BASE + 'hf_20260712_103137_825507c0-10b6-4afc-a2fb-fa788bbe8656.png', top: P.teal,      bot: P.velvet,   hill: P.plum },
  'Sea Viaduct':      { slug: 'sea_viaduct',      hf: HF_BASE + 'hf_20260712_103144_a7ef1615-86bf-454d-9aa2-af6d0ee30bd3.png', top: P.teal,      bot: P.peach,    hill: P.velvet },
  'Marmalade Canyon': { slug: 'marmalade_canyon', hf: HF_BASE + 'hf_20260712_103152_4fa139ab-96b4-40f7-bed2-a31b0553cbed.png', top: P.tangerine, bot: P.gold,     hill: P.velvet },
  'Glass Prairie':    { slug: 'glass_prairie',    hf: HF_BASE + 'hf_20260712_103344_c29e4414-986d-417d-a1cf-813cbaf83184.png', top: P.peach,     bot: P.green,    hill: P.velvet },
  "The Still's Edge": { slug: 'stills_edge',      hf: HF_BASE + 'hf_20260712_103352_0b64c894-28d8-424d-884a-f7fd693f237a.png', top: P.hush,      bot: P.velvet,   hill: P.plum }
};

/* ==========================================================================
   Cel + rim material — the polish lever. MeshToonMaterial banding via a
   gradient ramp, plus a fresnel peach rim injected through onBeforeCompile.
   ========================================================================== */
let RAMP = null;
function makeRamp() {
  const cv = doc.createElement('canvas'); cv.width = 4; cv.height = 1;
  const g = cv.getContext('2d');
  const stops = [P.plum, P.velvet, P.gold, P.marigold];
  stops.forEach((c, i) => { g.fillStyle = hexStr(c); g.fillRect(i, 0, 1, 1); });
  const t = new THREE.Texture(cv); t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}
function cel(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color) });
  m.gradientMap = RAMP;
  const rim = new THREE.Color(opts.rim ?? P.peach);
  const rimPow = opts.rimPow ?? 2.4;
  const rimStr = opts.rimStr ?? 0.55;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uRim = { value: rim };
    sh.uniforms.uRimPow = { value: rimPow };
    sh.uniforms.uRimStr = { value: rimStr };
    sh.fragmentShader = 'uniform vec3 uRim; uniform float uRimPow; uniform float uRimStr;\n' + sh.fragmentShader;
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <dithering_fragment>',
      'float rimF = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), uRimPow);\n' +
      '  gl_FragColor.rgb += uRim * rimF * uRimStr;\n  #include <dithering_fragment>'
    );
  };
  return m;
}
function glow(color, op = 1) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: op < 1, opacity: op }); }

/* additive sprite halo — fakes bloom for the disco lights (no post chain) */
let HALO_TEX = null;
function haloTexture() {
  const cv = doc.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const rad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rad.addColorStop(0, 'rgba(255,255,255,0.9)'); rad.addColorStop(0.3, 'rgba(255,255,255,0.35)'); rad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.Texture(cv); t.needsUpdate = true; return t;
}
function halo(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO_TEX, color: new THREE.Color(color), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  s.scale.setScalar(size ?? 1.4); return s;
}

/* limb with a top pivot so rotation swings from the shoulder/hip */
function limb(rad, len, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.82, len, 8), cel(color));
  m.geometry.translate(0, -len / 2, 0); return m;
}
function addOutline(mesh, s = 0.05) {
  const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(P.velvet), side: THREE.BackSide }));
  o.scale.setScalar(1 + s); mesh.add(o);
}

/* ==========================================================================
   Characters — refined, cel-shaded, articulated
   ========================================================================== */
function buildZil() {
  const g = new THREE.Group(); g.userData = { kind: 'zil', parts: {} };
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 22), cel(P.teal, { rimStr: 0.7 }));
  body.scale.set(1, 0.92, 1); body.position.y = 0.62; g.add(body); g.userData.parts.body = body; addOutline(body, 0.045);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), cel(0x5AD8CB)); belly.position.set(0, 0.55, 0.2); belly.scale.set(1, 0.8, 0.5); g.add(belly);
  const cape = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), cel(P.velvet, { rim: P.raspberry })); cape.position.y = 0.72; cape.rotation.x = Math.PI; g.add(cape); g.userData.parts.cape = cape;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), glow(0x14331c === 0 ? P.plum : P.plum)); eyeL.position.set(-0.17, 0.66, 0.45); g.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.17; g.add(eyeR);
  const shineL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glow(P.peach)); shineL.position.set(-0.14, 0.7, 0.5); g.add(shineL);
  const shineR = shineL.clone(); shineR.position.x = 0.2; g.add(shineR);
  const antGeo = new THREE.CylinderGeometry(0.012, 0.028, 0.42, 6); antGeo.translate(0, 0.21, 0);
  const antL = new THREE.Mesh(antGeo, cel(P.peach)); antL.position.set(-0.13, 1.02, 0); antL.rotation.z = 0.4; g.add(antL); g.userData.parts.antL = antL;
  const antR = antL.clone(); antR.position.x = 0.13; antR.rotation.z = -0.4; g.add(antR); g.userData.parts.antR = antR;
  const puffL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), glow(P.marigold)); puffL.position.set(-0.29, 1.42, 0); antL.add(puffL);
  const finL = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 10), cel(P.teal)); finL.position.set(-0.47, 0.7, 0); finL.rotation.z = 1.2; g.add(finL); g.userData.parts.finL = finL;
  const finR = finL.clone(); finR.position.x = 0.47; finR.rotation.z = -1.2; g.add(finR); g.userData.parts.finR = finR;
  const legL = limb(0.08, 0.32, P.teal); legL.position.set(-0.2, 0.34, 0); g.add(legL); g.userData.parts.legL = legL;
  const legR = limb(0.08, 0.32, P.teal); legR.position.set(0.2, 0.34, 0); g.add(legR); g.userData.parts.legR = legR;
  const armL = limb(0.07, 0.3, P.teal); armL.position.set(-0.46, 0.7, 0); g.add(armL); g.userData.parts.armL = armL;
  const armR = limb(0.07, 0.3, P.teal); armR.position.set(0.46, 0.7, 0); g.add(armR); g.userData.parts.armR = armR;
  return g;
}
function buildMarmalade() {
  const g = new THREE.Group(); g.userData = { kind: 'marm', parts: {} };
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.08, 20), cel(P.marigold, { rim: P.peach, rimStr: 0.6 }));
  body.position.y = 0.74; g.add(body); g.userData.parts.body = body; addOutline(body, 0.04);
  const lame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.55, 6), cel(P.gold)); lame.position.y = 0.98; lame.rotation.y = Math.PI / 6; g.add(lame);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 20), cel(0xC98A3A)); head.position.y = 1.44; g.add(head); g.userData.parts.head = head; g.userData.parts.headY = 1.44;
  const afro = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44, 1), cel(P.peach)); afro.position.y = 1.6; afro.scale.set(1.05, 0.88, 1.05); g.add(afro); g.userData.parts.afro = afro;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), glow(P.plum)); eyeL.position.set(-0.11, 1.46, 0.27); g.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.11; g.add(eyeR);
  const armL = limb(0.09, 0.44, P.marigold); armL.position.set(-0.42, 1.14, 0); armL.rotation.x = -0.5; g.add(armL); g.userData.parts.armL = armL;
  const armR = limb(0.09, 0.44, P.marigold); armR.position.set(0.42, 1.14, 0); armR.rotation.x = -0.5; g.add(armR); g.userData.parts.armR = armR;
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.24), cel(P.velvet)); crate.position.set(0, 0.8, 0.44); g.add(crate);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 20), glow(P.tangerine)); disc.position.set(0, 0.98, 0.46); disc.rotation.x = Math.PI / 2; g.add(disc);
  disc.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.021, 12), glow(P.peach)));
  const legL = limb(0.1, 0.46, P.plum); legL.position.set(-0.16, 0.42, 0); g.add(legL); g.userData.parts.legL = legL;
  const legR = limb(0.1, 0.46, P.plum); legR.position.set(0.16, 0.42, 0); g.add(legR); g.userData.parts.legR = legR;
  const skate = () => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.52), cel(P.tangerine)); return s; };
  const skL = skate(); skL.position.set(-0.16, -0.02, 0.06); g.add(skL);
  const skR = skate(); skR.position.set(0.16, -0.02, 0.06); g.add(skR);
  const wheels = [];
  [[-0.16, 0.22], [-0.16, -0.12], [0.16, 0.22], [0.16, -0.12]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), glow(P.gold)); w.rotation.z = Math.PI / 2; w.position.set(x, -0.09, z); g.add(w); wheels.push(w);
  });
  g.userData.parts.wheels = wheels;
  return g;
}
function buildNPC(type, rng, colourSafe) {
  const g = new THREE.Group(); g.userData = { type, parts: {}, off: rng.next() };
  const base = type === 'hushed' ? P.hush : (type === 'warden' ? P.gold : [P.raspberry, P.marigold, P.tangerine, P.green, P.teal][rng.int(0, 4)]);
  const h = type === 'warden' ? 1.2 : 0.98;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, h, 14), cel(base, { rimStr: type === 'hushed' ? 0.2 : 0.5 }));
  body.position.y = h / 2; g.add(body); g.userData.parts.body = body;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 16), cel(type === 'hushed' ? P.hush : 0xE9C79E)); head.position.y = h + 0.16; g.add(head); g.userData.parts.head = head;
  const armL = limb(0.06, 0.36, base); armL.position.set(-0.26, h - 0.04, 0); g.add(armL); g.userData.parts.armL = armL;
  const armR = limb(0.06, 0.36, base); armR.position.set(0.26, h - 0.04, 0); g.add(armR); g.userData.parts.armR = armR;
  if (type === 'warden') { const sash = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 8, 22), glow(P.raspberry)); sash.rotation.x = 1.1; sash.position.y = h * 0.55; g.add(sash); }
  if (type === 'hushed' && colourSafe) { const mk = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), glow(P.peach, 0.85)); mk.position.y = h + 0.52; g.add(mk); }
  return g;
}

/* ==========================================================================
   Scenery — gradient sky backdrop (image-upgradeable) + parallax silhouettes
   ========================================================================== */
function gradientTex(top, bot) {
  const cv = doc.createElement('canvas'); cv.width = 16; cv.height = 256;
  const g = cv.getContext('2d'); const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, hexStr(top)); grad.addColorStop(1, hexStr(bot));
  g.fillStyle = grad; g.fillRect(0, 0, 16, 256);
  const t = new THREE.Texture(cv); t.needsUpdate = true; return t;
}
function silhouetteTex(color, seed, kind) {
  const cv = doc.createElement('canvas'); cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d'); g.clearRect(0, 0, 512, 128);
  const rng = new CE.Rand(seed);
  g.fillStyle = hexStr(color);
  if (kind === 'aurora') {
    for (let i = 0; i < 5; i++) { g.globalAlpha = 0.18 + rng.next() * 0.2; g.beginPath(); const y = 20 + rng.next() * 50; g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 18); g.lineTo(512, 0); g.lineTo(0, 0); g.fill(); }
    g.globalAlpha = 1;
  } else if (kind === 'arches') {
    g.beginPath(); g.moveTo(0, 128);
    for (let x = 0; x < 512; x += 64) { g.lineTo(x, 90); g.arc(x + 32, 90, 32, Math.PI, 0, true); }
    g.lineTo(512, 128); g.fill();
  } else if (kind === 'crystal') {
    for (let x = 0; x < 512; x += 24) { const hh = 40 + rng.next() * 70; g.globalAlpha = 0.5 + rng.next() * 0.4; g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 6, 128 - hh); g.lineTo(x + 12, 128); g.fill(); }
    g.globalAlpha = 1;
  } else { /* hills / dunes / canyon */
    g.beginPath(); g.moveTo(0, 128); let y = 80;
    for (let x = 0; x <= 512; x += 24) { y += (rng.next() - 0.5) * 26; y = Math.max(40, Math.min(110, y)); g.lineTo(x, y); }
    g.lineTo(512, 128); g.fill();
  }
  const t = new THREE.Texture(cv); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t;
}

class Scenery {
  constructor(scene) {
    this.scene = scene; this.group = new THREE.Group(); scene.add(this.group);
    this.layers = []; this.biome = null;
    this.sky = [];
    for (const side of [-1, 1]) {
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), new THREE.MeshBasicMaterial({ fog: false }));
      sky.position.set(side * 46, 12, 0); sky.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; this.group.add(sky); this.sky.push(sky);
    }
  }
  set(biome) {
    if (biome === this.biome) return; this.biome = biome;
    const s = SCENERY[biome] || SCENERY['Dusk Desert'];
    const grad = gradientTex(s.top, s.bot);
    this.sky.forEach(m => { m.material.map = grad; m.material.color.set(0xffffff); m.material.needsUpdate = true; });
    this._tryUpgrade(s);
    /* rebuild parallax silhouettes */
    this.layers.forEach(l => this.group.remove(l.mesh));
    this.layers = [];
    const kinds = biome === 'Aurora Tundra' ? ['aurora', 'hills', 'hills'] : biome === 'Sea Viaduct' ? ['arches', 'hills', 'hills'] : biome === 'Glass Prairie' ? ['crystal', 'hills', 'hills'] : ['hills', 'hills', 'hills'];
    const dists = [16, 26, 38], speeds = [0.9, 0.55, 0.28], heights = [7, 11, 16], ys = [1.5, 3, 5];
    for (const side of [-1, 1]) {
      kinds.forEach((kind, i) => {
        const tex = silhouetteTex(s.hill, 1000 + i * 7 + (side + 2) * 31, kind); tex.repeat.set(6, 1);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: true, opacity: i === 0 ? 0.96 : 0.8 - i * 0.12 });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(220, heights[i]), mat);
        mesh.position.set(side * dists[i], ys[i], 0); mesh.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.group.add(mesh); this.layers.push({ mesh, speed: speeds[i], tex });
      });
    }
  }
  _tryUpgrade(s) {
    const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    const apply = (tex) => { tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(3, 1); this.sky.forEach(m => { m.material.map = tex; m.material.needsUpdate = true; }); };
    loader.load('assets/scenery/' + s.slug + '.png', apply, undefined, () => {
      if (s.hf) loader.load(s.hf, apply, undefined, () => {/* keep procedural gradient */});
    });
  }
  update(dt) { for (const l of this.layers) { l.tex.offset.x = (l.tex.offset.x + dt * l.speed * 0.04) % 1; } }
  follow(z) { this.group.position.z = z; }
}

/* ==========================================================================
   Carriage — cel materials, windows, dancefloor, mirrorball, crowd
   ========================================================================== */
function buildCarriage(car, assist) {
  const layout = CE.genCarriage(car);
  const rng = new CE.Rand((car * 92821) >>> 0 || car || 1);
  const g = new THREE.Group(); g.userData = { layout, speakers: [], npcs: [], lamps: [], halos: [] };
  const LEN = 22;
  const floorMat = cel(P.velvet, { rimStr: 0.2 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, LEN), floorMat); floor.position.y = -0.6; g.add(floor);
  const runner = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, LEN), cel(P.plum)); runner.position.y = -0.49; g.add(runner);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.2, LEN), cel(P.plum)); ceil.position.y = 3.5; g.add(ceil);
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4, LEN), cel(P.plum)); pillar.position.set(side * 3.62, 1.45, 0); g.add(pillar);
    /* window band (transparent so scenery shows through) */
    const band = new THREE.Mesh(new THREE.PlaneGeometry(LEN - 2, 1.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, color: 0xffffff, side: THREE.DoubleSide, depthWrite: false }));
    band.position.set(side * 3.5, 1.75, 0); band.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(band);
    for (const y of [2.55, 0.98]) { const sill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, LEN - 2), glow(P.gold)); sill.position.set(side * 3.54, y, 0); g.add(sill); }
    /* mullions */
    for (let z = -LEN / 2 + 2; z < LEN / 2 - 1; z += 3.2) { const mu = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.1), glow(P.gold)); mu.position.set(side * 3.52, 1.75, z); g.add(mu); }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, LEN - 2, 10), cel(P.gold, { rim: P.marigold, rimStr: 0.9 })); rail.rotation.x = Math.PI / 2; rail.position.set(side * 3.15, 0.6, 0); g.add(rail);
  }
  /* dancefloor — instanced, steps colour on the beat */
  const cols = 4, rows = 9, N = cols * rows;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.86, 0.06, 0.86), new THREE.MeshBasicMaterial(), N);
  const dummy = new THREE.Object3D(); const parity = []; let ti = 0;
  for (let x = 0; x < cols; x++) for (let z = 0; z < rows; z++) {
    dummy.position.set(-1.6 + x * 1.05, -0.46, -4.2 + z * 1.0); dummy.updateMatrix(); tiles.setMatrixAt(ti, dummy.matrix);
    parity.push((x + z) % 2); tiles.setColorAt(ti, new THREE.Color((x + z) % 2 ? P.raspberry : P.velvet)); ti++;
  }
  tiles.instanceColor.needsUpdate = true; tiles.userData.parity = parity; g.add(tiles); g.userData.tiles = tiles;
  /* mirrorball + facets + halo */
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshPhongMaterial({ color: P.peach, emissive: P.velvet, shininess: 100, flatShading: true }));
  ball.position.set(0, 2.85, 0); g.add(ball); g.userData.ball = ball;
  const bh = halo(P.peach, 1.8); bh.position.copy(ball.position); g.add(bh);
  /* lamps */
  for (let i = 0; i < 4; i++) {
    const x = [-2.5, 2.5][i % 2], z = -LEN / 2 + 3 + i * 4.6;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), glow(P.marigold)); lamp.position.set(x, 3.05, z); g.add(lamp); g.userData.lamps.push(lamp);
    const h = halo(P.marigold, 0.9); h.position.copy(lamp.position); g.add(h); g.userData.halos.push(h);
    const flex = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 5), cel(P.gold)); flex.position.set(x, 3.32, z); g.add(flex);
  }
  /* speakers */
  for (let i = 0; i < layout.speakers; i++) {
    const x = i % 2 === 0 ? -3.1 : 3.1, z = -8 + i * 5;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 0.48), cel(P.raspberry, { rim: P.tangerine, rimStr: 0.8 })); sp.position.set(x, 0.05, z); g.add(sp); g.userData.speakers.push(sp);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.1, 16), cel(P.plum)); cone.rotation.x = Math.PI / 2; cone.position.set(x + (i % 2 === 0 ? 0.26 : -0.26), 0.2, z); g.add(cone);
    const h = halo(P.raspberry, 0.7); h.position.set(x, 0.4, z); g.add(h); g.userData.halos.push(h);
  }
  /* benches */
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 0.55), cel(P.velvet)); b.position.set([-2.95, 2.95][i % 2], -0.32, -LEN / 2 + 5.5 + i * 6); g.add(b); }
  /* crowd */
  const colourSafe = assist ? assist.colourSafe : false;
  const crowd = rng.int(3, 5);
  for (let c = 0; c < crowd; c++) {
    const roll = rng.next(); const type = roll < 0.45 ? 'dancer' : (roll < 0.8 ? 'hushed' : 'warden');
    const npc = buildNPC(type, rng, colourSafe);
    npc.position.set(rng.range(-2.3, 2.3), -0.5, rng.range(-LEN / 2 + 2, LEN / 2 - 2)); npc.rotation.y = rng.range(0, Math.PI * 2);
    g.add(npc); g.userData.npcs.push(npc);
  }
  g.userData.dispose = () => g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
  return g;
}

/* ==========================================================================
   Boot
   ========================================================================== */
const game = CE.createGame();
window.CE_GAME = game;
game.boot({ headless: false, env: window });   /* engine.js has no _buildRenderer, so renderer stays null; we drive it here */

RAMP = makeRamp(); HALO_TEX = haloTexture();

const app = doc.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(P.plum, 1);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(P.plum, 16, 52);
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 400);
camera.position.set(0, 2.2, 7);

scene.add(new THREE.HemisphereLight(P.peach, P.plum, 0.5));
const key = new THREE.DirectionalLight(P.marigold, 1.15); key.position.set(4, 8, 5); scene.add(key);
const rim = new THREE.DirectionalLight(P.peach, 0.4); rim.position.set(-5, 4, -6); scene.add(rim);
const fill = new THREE.PointLight(P.raspberry, 0.5, 20); fill.position.set(0, 1.5, 0); scene.add(fill);

const scenery = new Scenery(scene);

/* mirrorball speckle sweep (instanced dots crawling every surface, 1 rev/bar) */
const speckN = 120;
const speckles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshBasicMaterial({ color: P.peach, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }), speckN);
const speckSeed = [];
for (let i = 0; i < speckN; i++) { speckSeed.push({ a: (i / speckN) * Math.PI * 6, r: 2.6 + (i % 3) * 0.6, y: 0.3 + ((i * 0.61803) % 1) * 3.3 }); }
scene.add(speckles);

/* live carriage groups */
const groups = {};
function ensureGroups() {
  const want = new Set(game.stream.wanted(game.world.carriage));
  for (const c of want) {
    if (!groups[c]) { groups[c] = buildCarriage(c, game.assist); scene.add(groups[c]); }
    groups[c].position.z = (c - game.world.carriage) * -22;
  }
  for (const k of Object.keys(groups)) { if (!want.has(+k)) { scene.remove(groups[k]); groups[k].userData.dispose(); delete groups[k]; } }
}

/* Authored GLB characters (bundled, offline). Loaded via GLTFLoader; materials
   are swapped to the cel+rim shader on load and named nodes drive animation.
   Falls back to the in-code procedural build if the GLB can't be fetched. */
const gltfLoader = new GLTFLoader();
const MODEL = { zil: 'assets/models/zil.glb', marm: 'assets/models/marmalade.glb' };
function applyCel(root) {
  const parts = {};
  root.traverse(o => {
    if (o.isMesh) {
      const col = (o.material && o.material.color) ? o.material.color.clone() : new THREE.Color(P.peach);
      o.material = cel(col.getHex(), { rimStr: 0.55 });
      /* keep cool colours (Zil's teal) reading cool against the warm ramp */
      if (col.b > col.r * 1.1) o.material.emissive = col.multiplyScalar(0.3);
      o.castShadow = false;
    }
    if (o.name) parts[o.name] = o;
  });
  if (parts.body) addOutline(parts.body, 0.045);
  if (parts.wheels && parts.wheels.isGroup) parts.wheels = parts.wheels.children;
  return parts;
}
let hero = null;
function spawnHero() {
  if (hero) { scene.remove(hero); hero = null; }
  const which = game.world.character;
  gltfLoader.load(MODEL[which], (gltf) => {
    const root = gltf.scene;
    root.userData = { kind: which, parts: applyCel(root) };
    hero = root; scene.add(hero);
  }, undefined, () => {
    toast('Using built-in model (GLB unavailable).');
    hero = which === 'zil' ? buildZil() : buildMarmalade(); scene.add(hero);
  });
}

/* ==========================================================================
   Animation
   ========================================================================== */
function animateRig(rig, t, pop, swing, dance) {
  const p = rig.userData.parts; if (!p) return;
  if (p.legL) p.legL.rotation.x = swing * (dance ? 0.5 : 0.3);
  if (p.legR) p.legR.rotation.x = -swing * (dance ? 0.5 : 0.3);
  if (p.armL) p.armL.rotation.x = -swing * (dance ? 1.2 : 0.5) - (dance ? pop * 0.7 : 0);
  if (p.armR) p.armR.rotation.x = swing * (dance ? 1.2 : 0.5) - (dance ? pop * 0.7 : 0);
  if (p.antL) p.antL.rotation.z = 0.4 + Math.sin(t * 0.008) * 0.2;
  if (p.antR) p.antR.rotation.z = -0.4 - Math.sin(t * 0.008) * 0.2;
  if (p.afro) p.afro.position.y = 1.6 + pop * 0.05;
}

let lastBeat = -1;
const tmpCol = new THREE.Color();
function frame(t) {
  requestAnimationFrame(frame);
  const now = performance.now();
  game.clock.advance(now);
  const phase = game.clock.phase();
  const barPhase = game.clock.barPhase();
  const pop = Math.pow(1 - phase, 2);
  const swing = Math.sin(t * 0.006);
  const beatN = game.clock.beatCount;
  const beatChanged = beatN !== lastBeat;
  const dt = 0.016;

  scenery.update(dt); scenery.follow(camera.position.z);

  const heroZ = hero ? hero.position.z : 0, heroX = hero ? hero.position.x : 0;

  /* speckle sweep */
  const rot = barPhase * Math.PI * 2; const d = new THREE.Object3D();
  for (let i = 0; i < speckN; i++) { const s = speckSeed[i], a = s.a + rot; d.position.set(Math.cos(a) * s.r, s.y, Math.sin(a) * s.r + heroZ); d.lookAt(heroX, s.y, heroZ); d.updateMatrix(); speckles.setMatrixAt(i, d.matrix); }
  speckles.instanceMatrix.needsUpdate = true;

  fill.intensity = 0.35 + pop * 0.7;

  for (const k of Object.keys(groups)) {
    const gg = groups[k], u = gg.userData;
    for (const sp of u.speakers) { sp.material.color.lerp(tmpCol.set(P.raspberry), 0.12); sp.scale.y = 1 + pop * 0.28; }
    if (u.ball) u.ball.rotation.y += 0.035;
    for (const h of u.halos) { h.material.opacity = 0.3 + pop * 0.55; }
    for (const l of u.lamps) { l.material.opacity = 0.6 + pop * 0.4; }
    if (u.tiles && beatChanged) { const par = u.tiles.userData.parity; for (let i = 0; i < par.length; i++) u.tiles.setColorAt(i, tmpCol.set((beatN + par[i]) % 2 === 0 ? P.raspberry : P.velvet)); u.tiles.instanceColor.needsUpdate = true; }
    for (const npc of u.npcs) {
      const off = npc.userData.off, ph = (phase + off) % 1, np = Math.pow(1 - ph, 2);
      if (npc.userData.type === 'dancer') { npc.position.y = -0.5 + np * 0.24; npc.rotation.y += 0.012; animateRig(npc, t + off * 1000, np, Math.sin(t * 0.006 + off * 6), true); }
      else if (npc.userData.type === 'warden') { npc.position.y = -0.5 + np * 0.13; animateRig(npc, t + off * 1000, np, Math.sin(t * 0.005 + off * 6), true); }
      else { npc.rotation.z = Math.sin(t * 0.0011 + off * 6) * 0.08; npc.position.y = -0.5 + Math.abs(Math.sin(t * 0.0009 + off)) * 0.03; }
    }
  }

  /* hero */
  if (hero) {
    const moving = (t - (game._lastMoveT || -9999)) < 260;
    animateRig(hero, t, pop, swing, true);
    hero.position.y = pop * 0.13 + (moving ? Math.abs(swing) * 0.04 : 0);
    if (hero.userData.parts.wheels) for (const w of hero.userData.parts.wheels) w.rotation.x += moving ? 0.4 : 0.05;
    hero.rotation.y += (game.world.heading - hero.rotation.y) * 0.15;
    /* lazy 3/4 chase */
    camera.position.x += (hero.position.x * 0.5 - camera.position.x) * 0.06;
    camera.position.y += (2.1 - camera.position.y) * 0.05;
    camera.position.z += ((hero.position.z + 5.4) - camera.position.z) * 0.06;
    camera.lookAt(hero.position.x, hero.position.y + 0.7, hero.position.z - 2);
  } else {
    /* gentle idle drift behind the title */
    camera.position.z += (7 - camera.position.z) * 0.02;
    camera.lookAt(0, 1.2, -4);
  }

  if (beatChanged) { lastBeat = beatN; const ring = doc.getElementById('beatRing'); if (ring) { ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse'); } }
  renderer.render(scene, camera);
}

/* ==========================================================================
   UI wiring
   ========================================================================== */
function toast(msg, ms = 2200) { const el = doc.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms); }
function say(who, line, cls) { const d = doc.getElementById('dialogue'); doc.getElementById('dWho').textContent = who; doc.getElementById('dWho').className = 'who ' + (cls || 'cond'); doc.getElementById('dLine').textContent = line; d.classList.add('show'); }
doc.getElementById('dialogue').addEventListener('click', () => doc.getElementById('dialogue').classList.remove('show'));

function updateHUD() {
  const w = game.world;
  doc.getElementById('hCar').textContent = w.carriage;
  doc.getElementById('hLane').textContent = w.lane === 'interior' ? 'INT' : (w.lane === 'roof' ? 'ROOF' : 'UNDER');
  doc.getElementById('hBand').textContent = CE.bandOf(w.carriage).id;
  doc.getElementById('hBiome').textContent = CE.biomeOf(w.carriage);
}
function refreshBiome() { scenery.set(CE.biomeOf(game.world.carriage)); }

/* title -> select */
function toSelect() { doc.getElementById('title').classList.add('hidden'); doc.getElementById('select').classList.add('show'); const AC = window.AudioContext || window.webkitAudioContext; game.audio.initHardware(AC); }
const titleEl = doc.getElementById('title');
titleEl.addEventListener('click', toSelect);
let ty = null;
titleEl.addEventListener('touchstart', e => { if (e.touches[0].clientY < 100) ty = e.touches[0].clientY; }, { passive: true });
titleEl.addEventListener('touchmove', e => { if (ty !== null && e.touches[0].clientY - ty > 60) { ty = null; toSelect(); } }, { passive: true });

doc.querySelectorAll('#select .card').forEach(card => card.addEventListener('click', () => {
  const which = card.getAttribute('data-char');
  game.selectCharacter(which);
  spawnHero(); ensureGroups(); refreshBiome(); updateHUD();
  doc.getElementById('select').classList.remove('show');
  doc.getElementById('hud').classList.remove('hidden');
  doc.getElementById('sysbtns').classList.remove('hidden');
  const name = which === 'zil' ? 'Zil' : 'DJ Marmalade';
  say(name, which === 'zil'
    ? 'The train never quiets. If I can reach the First Record and lift the needle for one bar… I can phone home.'
    : "The groove's faltering, carriage by carriage. Time to skate back and win every last soul at the decks.",
    which);
  setTimeout(() => say(CE.TANNOY[0].who, CE.TANNOY[0].line, 'cond'), 5200);
}));

/* carriage nav + assist */
function go(dir) { game._lastMoveT = performance.now(); game.transitionTo(game.world.carriage + dir); ensureGroups(); refreshBiome(); updateHUD(); }
doc.getElementById('btnNext').addEventListener('click', () => go(-1));   /* toward the front */
doc.getElementById('btnPrev').addEventListener('click', () => go(1));
doc.getElementById('btnAssist').addEventListener('click', () => { game.assist.speed = game.assist.speed >= 1 ? 0.5 : game.assist.speed + 0.25; toast('Assist speed ' + Math.round(game.assist.speed * 100) + '%'); });

/* playfield gestures */
app.addEventListener('touchstart', () => game.onGesture(), { passive: true });
let ts = null, tt = 0;
app.addEventListener('touchstart', e => { const t = e.touches[0]; ts = { x: t.clientX, y: t.clientY }; tt = Date.now(); }, { passive: true });
app.addEventListener('touchend', e => {
  if (!ts) return; const t = e.changedTouches[0]; const dx = t.clientX - ts.x, dy = t.clientY - ts.y; const dt = Math.max(1, Date.now() - tt); const dist = Math.hypot(dx, dy); const speed = dist / (dt / 1000);
  if (ts.x > innerWidth * 0.5) {
    const intent = CE.Gesture.classifyRight({ dt, dist, speed, heldMs: dt });
    if (intent === 'dash') { const d = game.tryDash(performance.now(), Math.atan2(dy, dx)); if (d.ok) { toast(d.onBeat ? 'ON-BEAT DASH — +25%!' : 'Dash.'); game.world.heading = -Math.atan2(dy, dx); game._lastMoveT = performance.now(); } else toast('Dash spent — refreshes on the downbeat.'); }
    else if (intent === 'jump') toast('Jump.');
    else if (intent === 'draw_throw') toast('Record thrown along your drawn path.');
  } else { game.world.heading += dx * 0.002; game._lastMoveT = performance.now(); }
  ts = null;
}, { passive: true });

doc.addEventListener('keydown', e => {
  if (game.state !== 'playing') return;
  game._lastMoveT = performance.now();
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === ' ') { const d = game.tryDash(performance.now(), 0); toast(d.ok ? (d.onBeat ? 'ON-BEAT DASH!' : 'Dash.') : 'Dash spent.'); }
});

doc.addEventListener('visibilitychange', () => { if (doc.hidden) { game.onHidden(); game.autosave(); } else game.onGesture(); });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
setInterval(() => { if (game.state === 'playing') updateHUD(); }, 500);

/* reveal title once fonts/scene are ready */
scenery.set('Dusk Desert');
requestAnimationFrame(frame);
setTimeout(() => { doc.getElementById('loader').style.display = 'none'; doc.getElementById('title').classList.remove('hidden'); }, 350);
