/**
 * app.js — FriedZooki application controller.
 *
 * Owns the shared renderer/physics stage and switches between screens:
 * Title → Menu → Build / Contests / Versus / My Zooks. DOM-only screens float
 * over a slowly turning hero Zook; gameplay screens (workshop, test, contest)
 * take over the 3D stage. The animalese guide threads curation throughout.
 */

import * as THREE from 'three';
import { setCamera } from './engine/renderer.js';
import { Zook, defaultBlueprint } from './zook/model.js';
import { Builder } from './zook/builder.js';
import { Arena } from './zook/arena.js';
import { ContestScene, CONTESTS } from './zook/contest.js';
import { EXAMPLES, loadRoster, randomExample } from './zook/library.js';
import { Knob, Switch } from './zook/controls.js';
import { ZookRun, requestTilt } from './zook/run.js';
import { guide, TIPS } from './sys/guide.js';
import { fb, unlockAudio, setMuted } from './sys/feedback.js';
import { Link } from './net/link.js';
import { makeQR, startScan } from './net/qr.js';

// Online is restricted to static-arena contests so streamed state stays in sync.
const ONLINE_IDS = ['sprint', 'hurdles', 'sumo', 'weakest', 'tag'];
// Cross-screen "tabletop" arenas (bird's-eye; action crosses the seam).
const TABLETOP_IDS = ['sumo', 'weakest', 'tag'];

export class App {
  constructor({ scene, world, RAPIER, camera, canvas, ui }) {
    Object.assign(this, { scene, world, RAPIER, camera, canvas, ui });
    this.active = { name: 'My Zook', bp: defaultBlueprint() };
    this.mode = null;            // gameplay mode with onStep/update/exit
    this._hero = null; this._heroSpin = true; this._heroSpinT = 0;
    this._overlay = null;
    this._builder = new Builder({ scene, mount: ui,
      onTest: (bp, name) => { this.active = { bp, name }; this.go('test'); },
      onBack: () => this.go('menu'),
    });
    this._countdownEl = null;
    if (typeof window !== 'undefined') { window.__app = this; window.__Link = Link; }   // debug handle
  }

  // ── loop hooks ────────────────────────────────────────────────────────────
  onStep(dt) { if (this.mode && this.mode.onStep) this.mode.onStep(dt); }
  update(dt) {
    if (this._hero) {
      if (this._heroSpin !== false) { this._heroSpinT += dt * 0.5; this._hero.rotation.y = this._heroSpinT; }
      this._heroZook.step(dt, { walk: true }); this._heroZook.syncMeshes();
    }
    // Motion Player: drive the remote contest from recorded frames.
    if (this._replay && this.mode && this.mode.applyState) {
      const R = this._replay;
      if (R.playing) { R.t += dt * R.rate; if (R.t >= R.dur) { if (R.loop) R.t = 0; else { R.t = R.dur; R.playing = false; } } }
      const idx = Math.max(0, Math.min(R.frames.length - 1, Math.floor(R.t / 0.05)));
      this.mode.applyState(R.frames[idx]);
      if (this._scrub && document.activeElement !== this._scrub) this._scrub.value = (R.t / R.dur) * 1000;
    }
    if (this._lab && this._lab.role === 'host') this._labTick(dt);
    if (this.mode && this.mode.update) this.mode.update(dt);
    // Host streams the live contest state to the joiner (~20 Hz).
    if (this._netRole === 'host' && this._link && this.mode && this.mode.serializeState) {
      this._netT = (this._netT || 0) + dt;
      if (this._netT >= 0.05) { this._netT = 0; this._link.send({ type: 'state', ...this.mode.serializeState() }); }
    }
    if (this._countdownEl) {
      const l = (this.mode && this.mode.countLabel != null) ? this.mode.countLabel : null;
      this._countdownEl.textContent = l || '';
      this._countdownEl.style.opacity = l ? '1' : '0';
    }
  }

  // ── screen switching ────────────────────────────────────────────────────────
  _clear() {
    if (this.mode && this.mode.exit) this.mode.exit();
    this.mode = null;
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    this._countdownEl = null;
    this._replay = null; this._scrub = null; this._lab = null; this._labUI = null; this._runScene = null;
    this._clearTabletop();
  }

  // Bird's-eye ORTHO camera covering this phone's HALF of a cross-screen arena.
  // host = left half (seam on its right edge), join = right half (seam on left).
  _setupTabletop(role) {
    const cv = this.canvas, FIELD_W = 5;
    const o = this._ortho = new THREE.OrthographicCamera(-FIELD_W / 2, FIELD_W / 2, 1, -1, 0.1, 100);
    const cx = role === 'host' ? -FIELD_W / 2 : FIELD_W / 2;
    const resize = () => {
      const w = cv.clientWidth, h = cv.clientHeight, Hw = (h / w) * FIELD_W;
      o.top = Hw / 2; o.bottom = -Hw / 2; o.left = -FIELD_W / 2; o.right = FIELD_W / 2;
      o.position.set(cx, 30, 0); o.up.set(0, 0, -1); o.lookAt(cx, 0, 0); o.updateProjectionMatrix();
    };
    resize(); this._orthoResize = resize; window.addEventListener('resize', resize);
    this.scene.userData.cam = o;
  }
  _clearTabletop() {
    if (this.scene.userData.cam) delete this.scene.userData.cam;
    if (this._orthoResize) { window.removeEventListener('resize', this._orthoResize); this._orthoResize = null; }
    this._ortho = null;
  }
  _overlayEl(html) {
    const d = document.createElement('div'); d.className = 'overlay'; d.innerHTML = html;
    this.ui.appendChild(d); this._overlay = d; return d;
  }
  _showHero(bp) {
    this._hideHero();
    this._hero = new THREE.Group(); this.scene.add(this._hero);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: 0xd7d3c9, roughness: 0.7 }));
    plinth.position.y = -0.15; plinth.receiveShadow = true; this._hero.add(plinth);
    this._heroZook = new Zook(bp || this.active.bp, { preview: true, showArrow: true });
    this._hero.add(this._heroZook.group);
    this._heroSpin = true; this._heroSpinT = 0; this._hero.rotation.y = 0;
    setCamera({ x: 0, y: 2.0, z: 4.8 }, { x: 0, y: 0.4, z: 0 }, true);
  }
  _hideHero() {
    if (this._hero) { this._heroZook.dispose(); this.scene.remove(this._hero); this._hero = null; }
  }

  go(screen, opts = {}) {
    this._clear();
    // Hero Zook spins behind the DOM menus; title uses a hand-drawn doodle instead.
    if (['menu', 'contests', 'versus', 'myzooks'].includes(screen)) this._showHero(this.active.bp);
    else this._hideHero();
    ({
      title: () => this._title(),
      menu: () => this._menu(),
      workshop: () => this._workshop(opts),
      test: () => this._test(),
      contests: () => this._contests(),
      contestRun: () => this._contestRun(opts),
      versus: () => this._versus(),
      online: () => this._online(),
      run: () => this._run(),
      myzooks: () => this._myzooks(),
    }[screen] || (() => this._menu()))();
  }

  // ── Title ────────────────────────────────────────────────────────────────
  _title() {
    // Hero Zook standing over the hand-drawn yellow panel (a textured plane).
    this._showHero(this.active.bp);
    const tex = new THREE.TextureLoader().load('./assets/blob-idea-yellow.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    panel.position.set(0, 1.15, -1.4);
    this._hero.add(panel);
    // Face the Zook toward the user (front is -Z; rotate just the creature so
    // it greets the camera while the yellow panel stays behind it).
    this._heroSpin = false; this._hero.rotation.y = 0; this._heroZook.group.rotation.y = Math.PI;
    setCamera({ x: 0, y: 1.5, z: 5.2 }, { x: 0, y: 1.05, z: 0 }, true);

    const d = this._overlayEl(`
      <div class="title-wrap">
        <div class="title-top">
          <img class="title-word" src="./assets/title-friedzooki.png" alt="FriedZooki" />
          <div class="t-sub">build · tune · compete</div>
        </div>
        <div class="title-bot">
          <button class="start-btn">TAP TO START</button>
          <div class="t-foot">after CBBC's BAMZOOKi · made from the Zook-Kit manual</div>
        </div>
      </div>`);
    const start = () => { unlockAudio(); fb.confirm(); guide.now(TIPS.menu); this.go('menu'); };
    d.querySelector('.start-btn').addEventListener('click', start);
    guide.now(TIPS.title);
  }

  // ── Menu ─────────────────────────────────────────────────────────────────
  _menu() {
    const d = this._overlayEl(`
      <div class="menu-wrap">
        <div class="m-logo"><span class="t-fried">Fried</span>Zooki</div>
        <div class="menu-grid">
          <button class="m-btn" data-go="workshop"><b>BUILD</b><span>make a Zook</span></button>
          <button class="m-btn" data-go="contests"><b>CONTESTS</b><span>vs a rival</span></button>
          <button class="m-btn" data-go="versus"><b>VERSUS</b><span>same phone</span></button>
          <button class="m-btn" data-go="online"><b>ONLINE</b><span>QR link-up</span></button>
          <button class="m-btn" data-go="run"><b>ZOOK RUN</b><span>tilt racer</span></button>
          <button class="m-btn" data-go="myzooks"><b>MY ZOOKS</b><span>your roster</span></button>
        </div>
      </div>`);
    d.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { fb.press(); this.go(b.dataset.go); }));
  }

  // ── Workshop ─────────────────────────────────────────────────────────────
  _workshop(opts) { this.mode = this._builder; this._builder.enter(opts.bp || this.active.bp, opts.name || this.active.name); }

  // ── Test table ───────────────────────────────────────────────────────────
  _test() {
    const arena = new Arena({
      scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      canvas: this.canvas, mount: this.ui, onBack: () => this.go('workshop'),
    });
    arena.enter(this.active.bp);
    this.mode = arena;
  }

  // ── Contests (select) ────────────────────────────────────────────────────
  _contests() {
    const cards = CONTESTS.map(c => `
      <button class="con-card" data-id="${c.id}"><b>${c.name}</b><span>${c.desc}</span></button>`).join('');
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Contests</h2><span style="width:40px"></span></div>
      <div class="con-grid">${cards}</div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelectorAll('.con-card').forEach(b => b.addEventListener('click', () => {
      fb.confirm();
      const contest = CONTESTS.find(c => c.id === b.dataset.id);
      this.go('contestRun', { contest, green: this.active, red: randomExample() });
    }));
    guide.now(TIPS.contest);
  }

  // ── Contest run ──────────────────────────────────────────────────────────
  _contestRun({ contest, green, red }) {
    const cs = new ContestScene({
      scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => {
        guide.now(line);
        this._lastRec = { contestId: contest.id, greenBp: green.bp, redBp: red.bp, frames: cs.getRecording().slice() };
        const r = this._overlayEl(`
          <div class="result-modal">
            <h1 class="${playerWon ? 'win' : 'lose'}">${playerWon ? 'YOU WIN!' : 'YOU LOSE'}</h1>
            <p>${line}</p>
            <div class="row">
              <button class="m-btn" data-act="again"><b>REMATCH</b></button>
              <button class="m-btn" data-act="replay"><b>REPLAY</b></button>
              <button class="m-btn" data-act="menu"><b>CONTESTS</b></button>
            </div>
          </div>`);
        r.querySelector('[data-act=again]').addEventListener('click', () => { fb.press(); this.go('contestRun', { contest, green, red }); });
        r.querySelector('[data-act=replay]').addEventListener('click', () => { fb.press(); this._motionPlayer(this._lastRec, { contest, green, red }); });
        r.querySelector('[data-act=menu]').addEventListener('click', () => { fb.press(); this.go('contests'); });
      },
    });
    cs.enter(contest, green.bp, red.bp);
    this.mode = cs;
    const d = this._overlayEl(`
      <div class="con-hud"><span class="tag green">${green.name || 'You'}</span>
        <span class="vs">${contest.name}</span>
        <span class="tag red">${red.name}</span></div>
      <div class="countdown"></div>`);
    this._countdownEl = d.querySelector('.countdown');
    guide.now(`${green.name || 'Your Zook'} versus ${red.name}! ${contest.desc}`);
  }

  // ── Versus (DS-style local link) ─────────────────────────────────────────
  _versus() {
    const pool = [...loadRoster(), ...EXAMPLES];
    const opts = (sel) => pool.map((z, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${z.name}</option>`).join('');
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Versus</h2><span style="width:40px"></span></div>
      <div class="link-panel">
        <div class="link-anim"><span class="link-dot"></span><span class="link-dot"></span><span class="link-dot"></span></div>
        <p class="link-status">local link — pass &amp; play</p>
        <label class="vs-pick green">P1 ▸ <select data-p1>${opts(0)}</select></label>
        <label class="vs-pick red">P2 ▸ <select data-p2>${opts(Math.min(1, pool.length - 1))}</select></label>
        <label class="vs-pick">CONTEST ▸ <select data-con>${CONTESTS.map((c, i) => `<option value="${i}">${c.name}</option>`).join('')}</select></label>
        <button class="start-btn" data-go>LINK UP ▶</button>
      </div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelector('[data-go]').addEventListener('click', () => {
      fb.confirm();
      const p1 = pool[+d.querySelector('[data-p1]').value];
      const p2 = pool[+d.querySelector('[data-p2]').value];
      const contest = CONTESTS[+d.querySelector('[data-con]').value];
      this.go('contestRun', { contest, green: p1, red: p2 });
    });
    guide.now(TIPS.versus);
  }

  // ── My Zooks ─────────────────────────────────────────────────────────────
  _myzooks() {
    const roster = loadRoster();
    const list = (title, arr, saved) => `
      <h3 class="mz-h">${title}</h3>
      <div class="mz-list">${arr.length ? arr.map((z, i) =>
        `<button class="mz-item" data-saved="${saved}" data-i="${i}"><span>${z.name}</span><em>open ›</em></button>`).join('')
        : '<p class="muted small">none yet — go build one!</p>'}</div>`;
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>My Zooks</h2>
        <button class="mini-btn wide" data-new>NEW</button></div>
      ${list('Saved', roster, 1)}
      ${list('Examples', EXAMPLES, 0)}</div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this.go('menu'); });
    d.querySelector('[data-new]').addEventListener('click', () => { fb.confirm(); this.active = { name: 'My Zook', bp: defaultBlueprint() }; this.go('workshop'); });
    d.querySelectorAll('.mz-item').forEach(b => b.addEventListener('click', () => {
      fb.press();
      const z = (+b.dataset.saved ? roster : EXAMPLES)[+b.dataset.i];
      const bp = { ...defaultBlueprint(), ...z.bp };
      if (!z.bp.legs) delete bp.legs;   // let it rebuild legs from the example's own fields
      this.active = { name: z.name, bp };
      this.go('workshop');
    }));
  }

  // ── Motion Player (Ch17) — replay a recorded contest ──────────────────────
  _motionPlayer(rec, back) {
    if (!rec || !rec.frames.length) return;
    this._clear();
    const contest = CONTESTS.find(c => c.id === rec.contestId);
    const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera, onResult: () => {} });
    cs.enter(contest, rec.greenBp, rec.redBp, { remote: true });
    this.mode = cs;
    this._replay = { frames: rec.frames, t: 0, playing: true, rate: 1, loop: true, dur: rec.frames.length * 0.05 };
    const d = this._overlayEl(`
      <div class="con-hud"><span class="vs">⏵ MOTION PLAYER · ${contest.name}</span></div>
      <div class="mp-bar">
        <button class="mini-btn" data-mp="play">❚❚</button>
        <input class="mp-scrub" type="range" min="0" max="1000" value="0" />
        <button class="mini-btn ${'on'}" data-mp="loop">⟲</button>
        <button class="mini-btn" data-mp="eject">⏏</button>
      </div>`);
    this._scrub = d.querySelector('.mp-scrub');
    const playBtn = d.querySelector('[data-mp=play]'), loopBtn = d.querySelector('[data-mp=loop]');
    playBtn.onclick = () => { fb.tick(); this._replay.playing = !this._replay.playing; playBtn.textContent = this._replay.playing ? '❚❚' : '⏵'; };
    loopBtn.onclick = () => { fb.tick(); this._replay.loop = !this._replay.loop; loopBtn.classList.toggle('on', this._replay.loop); };
    d.querySelector('[data-mp=eject]').onclick = () => { fb.press(); this._replay = null; this._scrub = null; back ? this._contestRunResultBack(back) : this.go('menu'); };
    this._scrub.oninput = () => { this._replay.t = (this._scrub.value / 1000) * this._replay.dur; this._replay.playing = false; playBtn.textContent = '⏵'; };
    guide.now('Motion Player — watch the contest back. Scrub the timeline, loop, or eject.');
  }
  _contestRunResultBack(back) { this.go('contestRun', back); }

  // ── ZOOK RUN (tilt-timing racer) ──────────────────────────────────────────
  async _run() {
    await requestTilt();
    this._clear();
    const r = new ZookRun({ scene: this.scene, camera: this.camera, canvas: this.canvas, mount: this.ui,
      bp: this.active.bp, seed: (Date.now() & 0xffff) || 1, onExit: () => this.go('menu') });
    r.enter(); this.mode = r;
  }
  // Online race: same seed, each renders its own Zook; compare finish times.
  async _runRaceHost() {
    const seed = (Date.now() & 0xffff) || 1;
    this._link.onMessage = (m) => { if (m.type === 'run-done') { this._runOpp = m.time; if (this._runScene) this._runResolve(this._runScene); } };
    this._link.send({ type: 'run-start', seed });
    this._runStart(seed, 'host');
  }
  async _runStart(seed, role) {
    await requestTilt();
    this._clear();
    this._runMine = null; this._runOpp = null; this._runRole = role;
    const r = new ZookRun({ scene: this.scene, camera: this.camera, canvas: this.canvas, mount: this.ui,
      bp: this.active.bp, seed, vsName: this._peer ? this._peer.name : 'Rival',
      onExit: () => { this._netClose(); this.go('menu'); },
      onFinish: (time) => { this._runMine = time; this._link.send({ type: 'run-done', time }); this._runResolve(r); } });
    r.enter(); this.mode = r; this._runScene = r;
  }
  _runResolve(r) {
    if (this._runMine == null) return;
    if (this._runOpp == null) { r.result(`You finished ${this._runMine.toFixed(1)}s — waiting for rival…`); return; }
    const won = this._runMine <= this._runOpp;
    r.result(`${won ? 'YOU WIN!' : 'Rival wins'} — you ${this._runMine.toFixed(1)}s vs ${this._runOpp.toFixed(1)}s`);
  }

  // ── ZOOK LAB — Spaceteam-style co-op (shout the commands) ─────────────────
  _labLabels() {
    const POOL = ['FLUX', 'GIZMO', 'CRANK', 'VALVE', 'WARP', 'PRISM', 'TURBO', 'SPROCKET', 'VENT', 'CORE', 'BLASTER', 'NACELLE'];
    for (let i = POOL.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [POOL[i], POOL[j]] = [POOL[j], POOL[i]]; }
    return POOL;   // shuffled; host takes 0..4, joiner 5..9 (disjoint labels)
  }
  _labGenPanel(prefix, labels) {
    return labels.map((label, i) => i < 3
      ? { id: prefix + i, label, type: 'knob', value: Math.floor(Math.random() * 10), min: 0, max: 9 }
      : { id: prefix + i, label, type: 'switch', value: Math.random() < 0.5 });
  }
  _labCmd(panel, vals) {
    const c = panel[Math.floor(Math.random() * panel.length)];
    let want, text;
    if (c.type === 'knob') { do { want = Math.floor(Math.random() * 10); } while (want === vals[c.id]); text = `Set ${c.label} to ${want}`; }
    else { want = !vals[c.id]; text = `${want ? 'ENGAGE' : 'CUT'} the ${c.label}`; }
    return { targetId: c.id, want, text, t: c.type === 'knob' ? 9 : 7 };
  }
  _labRenderPanel(mount, panel, onChange) {
    const wrap = document.createElement('div'); wrap.className = 'lab-panel';
    panel.forEach(c => {
      if (c.type === 'knob') wrap.appendChild(Knob({ label: c.label, min: c.min, max: c.max, step: 1, value: c.value, format: v => String(Math.round(v)), onChange: v => onChange(c.id, Math.round(v)) }).root);
      else wrap.appendChild(Switch({ label: c.label, value: c.value, onChange: v => onChange(c.id, v) }).root);
    });
    mount.appendChild(wrap);
  }
  _labOverlay() {
    const d = this._overlayEl(`<div class="lab-screen">
      <div class="lab-top"><span class="lab-score">0</span><div class="lab-health"><i></i></div></div>
      <div class="lab-cmd">get ready…</div>
      <div class="lab-mount"></div>
      <button class="mini-btn lab-quit" data-x>QUIT</button></div>`);
    d.querySelector('[data-x]').onclick = () => { fb.press(); this._netClose(); this.go('menu'); };
    this._labUI = d; return d;
  }
  _labSetUI(cmd, health, score) {
    const d = this._labUI; if (!d) return;
    d.querySelector('.lab-cmd').textContent = cmd;
    d.querySelector('.lab-score').textContent = `★ ${score}`;
    const bar = d.querySelector('.lab-health i'); bar.style.width = Math.max(0, health) + '%';
    bar.style.background = health < 35 ? '#e8466e' : '#37c46a';
  }

  _labHost() {
    this._clear();
    const labels = this._labLabels();
    const panelA = this._labGenPanel('A', labels.slice(0, 5)), panelB = this._labGenPanel('B', labels.slice(5, 10));
    const vals = {}; [...panelA, ...panelB].forEach(c => vals[c.id] = c.value);
    const L = this._lab = { role: 'host', panelA, panelB, vals, health: 100, score: 0, over: false, netT: 0 };
    L.cmdA = this._labCmd(panelB, vals); L.cmdB = this._labCmd(panelA, vals);
    this._link.send({ type: 'lab-setup', panel: panelB });
    this._link.send({ type: 'lab', cmd: L.cmdB.text, health: 100, score: 0 });
    this._link.onMessage = (m) => this._labMsgHost(m);
    const d = this._labOverlay();
    this._labRenderPanel(d.querySelector('.lab-mount'), panelA, (id, v) => this._labHostLocal(id, v));
    this._labSetUI(L.cmdA.text, 100, 0); guide.now(L.cmdA.text + '!');
  }
  _labHostLocal(id, val) {
    const L = this._lab; if (!L || L.over) return; L.vals[id] = val;
    if (L.cmdB.targetId === id && val === L.cmdB.want) { L.score++; fb.confirm(); L.cmdB = this._labCmd(L.panelA, L.vals); this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); this._labWin(); }
  }
  _labMsgHost(m) {
    const L = this._lab; if (!L || L.over) return;
    if (m.type === 'ctl') { L.vals[m.id] = m.val;
      if (L.cmdA.targetId === m.id && m.val === L.cmdA.want) { L.score++; fb.confirm(); L.cmdA = this._labCmd(L.panelB, L.vals); guide.now(L.cmdA.text + '!'); this._labSetUI(L.cmdA.text, L.health, L.score); this._labWin(); } }
  }
  _labTick(dt) {
    const L = this._lab; if (!L || L.role !== 'host' || L.over) return;
    L.cmdA.t -= dt; L.cmdB.t -= dt;
    if (L.cmdA.t <= 0) { L.health -= 12; fb.thud(); L.cmdA = this._labCmd(L.panelB, L.vals); guide.now(L.cmdA.text + '!'); }
    if (L.cmdB.t <= 0) { L.health -= 12; fb.thud(); L.cmdB = this._labCmd(L.panelA, L.vals); this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); }
    L.netT += dt; if (L.netT >= 0.4) { L.netT = 0; this._link.send({ type: 'lab', cmd: L.cmdB.text, health: L.health, score: L.score }); }
    this._labSetUI(L.cmdA.text, L.health, L.score); this._labWin();
  }
  _labWin() {
    const L = this._lab; if (L.over) return;
    if (L.health <= 0) { L.over = true; this._link.send({ type: 'lab-end', win: false }); this._resultOverlay(false, 'The core blew! Work on your shouting.', () => this._online()); }
    else if (L.score >= 15) { L.over = true; this._link.send({ type: 'lab-end', win: true }); fb.win(); this._resultOverlay(true, 'Core stable — you saved the lab together!', () => this._online()); }
  }

  // ── Online (QR-linked WebRTC) ─────────────────────────────────────────────
  _netClose() { try { this._link?.close(); } catch (_) {} this._link = null; this._netRole = null; this._peer = null; }

  _online() {
    this._netClose();
    const d = this._overlayEl(`<div class="sheet">
      <div class="bar"><button class="mini-btn" data-back>‹</button><h2>Online Link</h2><span style="width:40px"></span></div>
      <div class="link-panel" id="onl"></div></div>`);
    d.querySelector('[data-back]').addEventListener('click', () => { fb.press(); this._netClose(); this.go('menu'); });
    const box = d.querySelector('#onl');
    box.innerHTML = `<div class="link-anim"><span class="link-dot"></span><span class="link-dot"></span><span class="link-dot"></span></div>
      <p class="link-status">Two phones, no server — pair with a QR.</p>
      <div class="row"><button class="m-btn" data-r="host"><b>HOST</b><span>show a code</span></button>
      <button class="m-btn" data-r="join"><b>JOIN</b><span>scan a code</span></button></div>`;
    box.querySelector('[data-r=host]').onclick = () => { fb.press(); this._hostFlow(box); };
    box.querySelector('[data-r=join]').onclick = () => { fb.press(); this._joinFlow(box); };
    guide.now('Online! One phone hosts and shows a QR, the other scans it. No server — just your two phones.');
  }

  async _hostFlow(box) {
    box.innerHTML = `<p class="link-status">Starting…</p>`;
    const l = this._link = new Link(); this._netRole = 'host';
    l.onOpen = () => { box.innerHTML = `<p class="link-status">Connected! Waiting for Player 2’s Zook…</p>`; };
    l.onMessage = (m) => { if (m.type === 'hello') { this._peer = { name: m.name, bp: m.bp }; this._hostPick(box); } };
    let code; try { code = await l.host(); } catch (e) { box.innerHTML = `<p class="link-status">Couldn’t start (${e.message}).</p>`; return; }
    const qr = await makeQR(code);
    box.innerHTML = `<p class="link-status">1 · Show this to Player 2</p>`;
    box.appendChild(qr);
    const row = document.createElement('div');
    row.innerHTML = `<button class="mini-btn wide" data-scan>2 · SCAN THEIR REPLY</button>
      <details class="net-fallback"><summary>or paste reply code</summary><textarea class="net-code" placeholder="paste reply"></textarea><button class="mini-btn" data-paste>USE CODE</button></details>`;
    box.appendChild(row);
    row.querySelector('[data-scan]').onclick = () => this._scan(async (t) => { try { await l.accept(t); } catch (_) {} });
    row.querySelector('[data-paste]').onclick = async () => { try { await l.accept(row.querySelector('.net-code').value); } catch (_) {} };
  }

  _hostPick(box) {
    const render = () => {
      const tt = this._tabletop;
      const ids = tt ? TABLETOP_IDS : ONLINE_IDS;
      const cs = CONTESTS.filter(c => ids.includes(c.id));
      box.innerHTML = `<p class="link-status">Connected to ${this._peer.name}!</p>
        <div class="mode-pick">
          <button class="seg-btn ${tt ? '' : 'on'}" data-m="same">SAME SCREEN</button>
          <button class="seg-btn ${tt ? 'on' : ''}" data-m="tab">TABLETOP · 2 PHONES</button>
        </div>
        <p class="link-status">${tt ? 'Lay both phones edge-to-edge — one arena across two screens.' : 'Pick a contest:'}</p>
        <div class="con-grid"></div>`;
      box.querySelector('[data-m=same]').onclick = () => { fb.tick(); this._tabletop = false; render(); };
      box.querySelector('[data-m=tab]').onclick = () => { fb.tick(); this._tabletop = true; render(); };
      const grid = box.querySelector('.con-grid');
      cs.forEach(c => { const b = document.createElement('button'); b.className = 'con-card'; b.innerHTML = `<b>${c.name}</b><span>${c.desc}</span>`;
        b.onclick = () => { fb.confirm(); this._runHostContest(c, this._tabletop); }; grid.appendChild(b); });
      const coop = document.createElement('button'); coop.className = 'con-card coop';
      coop.innerHTML = `<b>⚙ ZOOK LAB · CO-OP</b><span>shout the commands — keep the core alive!</span>`;
      coop.onclick = () => { fb.confirm(); this._labHost(); };
      grid.appendChild(coop);
      const race = document.createElement('button'); race.className = 'con-card coop';
      race.innerHTML = `<b>🏁 ZOOK RUN · RACE</b><span>tilt-timing race, same track — first home wins</span>`;
      race.onclick = () => { fb.confirm(); this._runRaceHost(); };
      grid.appendChild(race);
    };
    render();
  }

  _runHostContest(contest, tabletop) {
    const green = this.active, red = this._peer;
    this._link.send({ type: 'start', contest: contest.id, greenBp: green.bp, redBp: red.bp, tabletop });
    this._clear();
    if (tabletop) this._setupTabletop('host');
    const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera,
      onResult: ({ playerWon, line }) => {
        this._link.send({ type: 'result', winner: playerWon ? 'green' : 'red', line });
        this._resultOverlay(playerWon, line, () => this._online());
      } });
    cs.enter(contest, green.bp, red.bp, { tabletop });
    this.mode = cs;
    this._contestOverlay(green.name || 'You', red.name, contest.name, tabletop, 'host');
  }

  async _joinFlow(box) {
    this._netRole = 'join';
    box.innerHTML = `<p class="link-status">Scan the host’s QR code…</p>
      <details class="net-fallback" open><summary>or paste host code</summary><textarea class="net-code" placeholder="paste host code"></textarea><button class="mini-btn" data-paste>USE CODE</button></details>
      <button class="mini-btn wide" data-scan>OPEN SCANNER</button>`;
    const go = async (hostCode) => {
      const l = this._link = new Link();
      l.onOpen = () => { l.send({ type: 'hello', name: this.active.name, bp: this.active.bp }); };
      l.onMessage = (m) => this._joinMsg(m);
      let reply; try { reply = await l.join(hostCode); } catch (e) { box.innerHTML = `<p class="link-status">Bad code (${e.message}).</p>`; return; }
      const qr = await makeQR(reply);
      box.innerHTML = `<p class="link-status">Show this reply to the host</p>`; box.appendChild(qr);
      const f = document.createElement('details'); f.className = 'net-fallback'; f.innerHTML = `<summary>or copy reply code</summary><textarea class="net-code" readonly>${reply}</textarea>`;
      box.appendChild(f);
    };
    box.querySelector('[data-scan]').onclick = () => this._scan(go);
    box.querySelector('[data-paste]').onclick = () => go(box.querySelector('.net-code').value);
  }

  _joinMsg(m) {
    if (m.type === 'start') {
      const contest = CONTESTS.find(c => c.id === m.contest);
      this._clear();
      if (m.tabletop) this._setupTabletop('join');
      const cs = new ContestScene({ scene: this.scene, world: this.world, RAPIER: this.RAPIER, camera: this.camera, onResult: () => {} });
      cs.enter(contest, m.greenBp, m.redBp, { remote: true, tabletop: m.tabletop });
      this.mode = cs;
      this._contestOverlay('Host', this.active.name, contest.name, m.tabletop, 'join');
    } else if (m.type === 'state' && this.mode && this.mode.applyState) {
      this.mode.applyState(m);
    } else if (m.type === 'result') {
      this._resultOverlay(m.winner === 'red', m.line, () => this._online());
    } else if (m.type === 'lab-setup') {
      this._clear(); this._lab = { role: 'join' };
      const d = this._labOverlay();
      this._labRenderPanel(d.querySelector('.lab-mount'), m.panel, (id, v) => this._link.send({ type: 'ctl', id, val: v }));
      this._labSetUI('get ready…', 100, 0);
    } else if (m.type === 'lab') {
      this._labSetUI(m.cmd, m.health, m.score);
      if (m.cmd !== this._labLastCmd) { this._labLastCmd = m.cmd; guide.now(m.cmd + '!'); }
    } else if (m.type === 'lab-end') {
      this._resultOverlay(m.win, m.win ? 'Core stable — you saved the lab together!' : 'The core blew! Try again.', () => this._online());
    } else if (m.type === 'run-start') {
      this._runStart(m.seed, 'join');
    } else if (m.type === 'run-done') {
      this._runOpp = m.time; if (this._runScene) this._runResolve(this._runScene);
    }
  }

  async _scan(onCode) {
    const ov = this._overlayEl(`<div class="scan-wrap"><video class="scan-video" playsinline></video>
      <p class="link-status">point at the QR</p><button class="mini-btn" data-x>CANCEL</button></div>`);
    const video = ov.querySelector('video');
    let stop = () => {};
    ov.querySelector('[data-x]').onclick = () => { stop(); ov.remove(); };
    try {
      stop = await startScan(video, (code) => { stop(); ov.remove(); onCode(code); });
    } catch (e) {
      ov.querySelector('.link-status').textContent = 'Camera unavailable — paste the code instead.';
    }
  }

  _contestOverlay(greenName, redName, contestName, tabletop, role) {
    const seam = role === 'host' ? 'right' : 'left';
    const seamHtml = tabletop
      ? `<div class="seam seam-${seam}"><span>▸</span><span>▸</span><span>▸</span></div>
         <div class="tabletop-hint">lay phones edge-to-edge · line up the ▸ marks</div>` : '';
    const d = this._overlayEl(`
      <div class="con-hud"><span class="tag green">${greenName}</span><span class="vs">${contestName}</span><span class="tag red">${redName}</span></div>
      <div class="countdown"></div>${seamHtml}`);
    this._countdownEl = d.querySelector('.countdown');
  }

  _resultOverlay(playerWon, line, again) {
    const r = this._overlayEl(`<div class="result-modal">
      <h1 class="${playerWon ? 'win' : 'lose'}">${playerWon ? 'YOU WIN!' : 'YOU LOSE'}</h1>
      <p>${line || ''}</p>
      <div class="row"><button class="m-btn" data-act="again"><b>AGAIN</b></button><button class="m-btn" data-act="menu"><b>MENU</b></button></div></div>`);
    r.querySelector('[data-act=again]').onclick = () => { fb.press(); again(); };
    r.querySelector('[data-act=menu]').onclick = () => { fb.press(); this._netClose(); this.go('menu'); };
  }
}
