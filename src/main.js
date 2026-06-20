import { initRenderer, updateCamera } from './engine/renderer.js';
import { initPhysics, createGround } from './engine/physics.js';
import { startLoop } from './engine/loop.js';
import { S, setState } from './state.js';
import { defaultGenome, randomGenome, loadRoster, saveRoster, PALETTE, AI_GENOMES } from './creature/genome.js';
import { sfx } from './audio/sfx.js';
import { narrator } from './audio/narrator.js';
import { haptic } from './ui/haptic.js';
import { HUD } from './ui/hud.js';
import { LowerThird } from './ui/lowerThird.js';
import { fireConfetti } from './ui/confetti.js';
import { _setCurrentScreen } from './router.js';
import { MenuScene } from './scenes/menu.js';
import { WorkshopScene } from './scenes/workshop.js';
import { RaceScene } from './scenes/race.js';
import { ResultsScene } from './scenes/results.js';
import { TrialsMode } from './modes/trials.js';
import { VersusMode } from './modes/versus.js';
import { ChampionshipMode } from './modes/championship.js';
import { FreeRoamMode } from './modes/freeroam.js';
import { OnlineMode } from './modes/online.js';
import { TRIALS } from './modes/trials.js';

let eng = null;
let activeScene = null;
let stopCurrentLoop = null;
const hud = new HUD();
const lowerThird = new LowerThird();
let menuScene, workshopScene, raceScene, resultsScene;
let trialsMode, versusMode, champMode, freeroamMode, onlineMode;

async function boot() {
  const step = document.getElementById('boot-step');
  const setStep = t => { if (step) step.textContent = t; };

  setStep('loading physics…');
  const { world, RAPIER } = await initPhysics();

  setStep('starting renderer…');
  const canvas = document.getElementById('scene');
  const { renderer, scene, camera, clock } = initRenderer(canvas);

  eng = { world, RAPIER, renderer, scene, camera, clock };

  setStep('building scenes…');
  menuScene     = new MenuScene(eng);
  workshopScene = new WorkshopScene(eng);
  raceScene     = new RaceScene(eng);
  resultsScene  = new ResultsScene();
  trialsMode    = new TrialsMode();
  versusMode    = new VersusMode();
  champMode     = new ChampionshipMode();
  freeroamMode  = new FreeRoamMode(eng);
  onlineMode    = new OnlineMode(eng);

  setStep('ready!');

  sfx.init();
  await narrator.init();
  initUI();

  // Listen for navigate events dispatched by router.js
  window.addEventListener('fz:navigate', e => {
    navigate(e.detail.screenId, e.detail.payload || {});
  });

  navigate('title');

  // First-ever launch: the narrator welcomes the player with the story.
  // Triggered on the first user gesture so the audio is allowed to play
  // (browsers block autoplay before any interaction).
  window.addEventListener('pointerdown', () => narrator.playOnce('intro'), { once: true });
}

/* ─── Navigation ─────────────────────────────────────── */
function navigate(screen, opts = {}) {
  // Exit current scene
  if (activeScene && activeScene.exit) activeScene.exit();
  if (stopCurrentLoop) { stopCurrentLoop(); stopCurrentLoop = null; }

  // Hide all overlay screens
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('show'));
  const playUI = document.getElementById('play-ui');
  if (playUI) playUI.classList.add('hidden');

  setState({ screen });
  _setCurrentScreen(screen);

  switch (screen) {
    case 'title': {
      document.getElementById('screen-title').classList.add('show');
      activeScene = menuScene;
      menuScene.enter();
      stopCurrentLoop = startLoop({
        world: eng.world, renderer: eng.renderer, scene: eng.scene,
        camera: eng.camera, clock: eng.clock,
        onStep: () => menuScene.onStep(),
        onFrame: (dt) => { menuScene.update(dt); updateCamera(dt); },
      });
      break;
    }
    case 'build': {
      document.getElementById('screen-build').classList.add('show');
      activeScene = workshopScene;
      workshopScene.enter(S.activeGenome);
      narrator.play('build');
      // workshop.js manages its own internal loop
      break;
    }
    case 'roster': {
      document.getElementById('screen-roster').classList.add('show');
      populateRoster();
      break;
    }
    case 'trials': {
      document.getElementById('screen-trials').classList.add('show');
      trialsMode.enter();
      break;
    }
    case 'versus': {
      document.getElementById('screen-versus').classList.add('show');
      versusMode.enter();
      break;
    }
    case 'championship': {
      champMode.enter(S.activeGenome);
      break;
    }
    case 'freeroam': {
      activeScene = freeroamMode;
      freeroamMode.enter(S.activeGenome);
      stopCurrentLoop = startLoop({
        world: eng.world, renderer: eng.renderer, scene: eng.scene,
        camera: eng.camera, clock: eng.clock,
        onStep: (dt) => freeroamMode.onStep(dt),
        onFrame: (dt) => freeroamMode.update(dt),
      });
      break;
    }
    case 'online': {
      document.getElementById('screen-online').classList.add('show');
      onlineMode.enter(S.roster, (trialId, genomeA, genomeB) => startRace(trialId, genomeA, [genomeB]));
      break;
    }
    case 'race': {
      if (!opts.trial || !opts.playerGenome) { navigate('trials'); return; }
      document.getElementById('play-ui').classList.remove('hidden');
      activeScene = raceScene;
      // Default finish handler: show results screen
      const defaultOnFinish = (result) => {
        navigate('title');
        setTimeout(() => {
          resultsScene.show({
            won: result.won,
            metric: result.metric,
            metricLabel: result.metricLabel,
            trialLabel: opts.trial.label,
            onRetry: () => navigate('race', opts),
            onMenu: () => navigate('title'),
          });
          if (result.won) { fireConfetti(eng.renderer.domElement); sfx.play('win'); }
          else sfx.play('lose');
          narrator.play(result.won ? 'win' : 'lose');
        }, 200);
      };
      raceScene.onRaceEnd = opts.onFinish || defaultOnFinish;
      raceScene.enter({
        trial: opts.trial,
        playerGenome: opts.playerGenome,
        opponents: opts.opponents || [],
        vsMode: opts.vsMode || false,
      });
      // race.js manages its own internal loop
      break;
    }
  }
}

/* ─── Race helpers ───────────────────────────────────── */
function startTrial(trialId, genome) {
  const trial = TRIALS.find(t => t.id === trialId);
  navigate('race', {
    trial,
    playerGenome: genome,
    opponents: getAIOpponents(trialId),
    onFinish: (result) => {
      navigate('title');
      setTimeout(() => {
        resultsScene.show({
          won: result.won,
          metric: result.metricStr,
          metricLabel: result.metricLabel,
          trialLabel: trial.label,
          onRetry: () => startTrial(trialId, genome),
          onMenu: () => navigate('trials'),
        });
        if (result.won) { fireConfetti(eng.renderer.domElement); sfx.play('win'); }
        else sfx.play('lose');
        narrator.play(result.won ? 'win' : 'lose');
      }, 200);
    },
  });
}

function startVersus(trialId, genomeA, genomeB) {
  const trial = TRIALS.find(t => t.id === trialId);
  navigate('race', {
    trial,
    playerGenome: genomeA,
    opponents: [genomeB],
    vsMode: true,
    onFinish: (result) => {
      navigate('title');
      setTimeout(() => {
        resultsScene.show({
          won: result.won,
          metric: result.metricStr,
          metricLabel: result.metricLabel,
          trialLabel: trial.label,
          onRetry: () => startVersus(trialId, genomeA, genomeB),
          onMenu: () => navigate('versus'),
        });
        if (result.won) { fireConfetti(eng.renderer.domElement); sfx.play('win'); }
      }, 200);
    },
  });
}

function startChampRace(trialId, genome, onDone) {
  const trial = TRIALS.find(t => t.id === trialId);
  navigate('race', {
    trial,
    playerGenome: genome,
    opponents: getAIOpponents(trialId),
    onFinish: (result) => {
      navigate('title');
      setTimeout(() => onDone(result.won), 100);
    },
  });
}

function onChampEnd(scores, genome) {
  const won = scores.filter(Boolean).length;
  const total = scores.length;
  fireConfetti(eng.renderer.domElement);
  sfx.play('win');
  narrator.play('champion');
  document.getElementById('trophy-title').textContent = won >= total * 0.6 ? '🏆 Champion!' : 'Well Run!';
  document.getElementById('trophy-score').textContent = `${won}/${total} races won`;
  document.getElementById('trophy-screen').classList.remove('hidden');
}

function getAIOpponents(trialId) {
  return AI_GENOMES.slice(0, 3).map(g => ({ ...g }));
}

function startRace(trialId, genomeA, opponentGenomes) {
  const trial = TRIALS.find(t => t.id === trialId);
  navigate('race', {
    trial,
    playerGenome: genomeA,
    opponents: opponentGenomes,
    onFinish: (result) => {
      navigate('title');
      setTimeout(() => resultsScene.show({ won: result.won, metric: result.metricStr, metricLabel: result.metricLabel, trialLabel: trial.label, onMenu: () => navigate('title') }), 200);
    },
  });
}

/* ─── Roster UI ──────────────────────────────────────── */
function populateRoster() {
  const list = document.getElementById('roster-list');
  list.innerHTML = '';
  if (S.roster.length === 0) {
    list.innerHTML = '<p class="muted center" style="padding:24px">No saved Zooks yet!<br>Build one first.</p>';
    return;
  }
  S.roster.forEach((genome, i) => {
    const card = document.createElement('div');
    card.className = 'zook-card';
    card.innerHTML = `
      <div class="zook-card-dot" style="background:${genome.color}"></div>
      <div class="zook-card-info">
        <div class="zook-card-name">${genome.name}</div>
        <div class="zook-card-stats">${genome.legCount} legs · power ${genome.gait.drive.toFixed(0)}</div>
      </div>
      <div class="zook-card-actions">
        <button class="icon-btn" style="font-size:16px" data-action="edit" data-idx="${i}">✏️</button>
        <button class="icon-btn" style="font-size:16px" data-action="del" data-idx="${i}">🗑</button>
      </div>
    `;
    list.appendChild(card);
  });
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    if (btn.dataset.action === 'edit') {
      setState({ activeGenome: S.roster[idx] });
      navigate('build');
    }
    if (btn.dataset.action === 'del') {
      const next = S.roster.filter((_, i) => i !== idx);
      setState({ roster: next });
      saveRoster(next);
      populateRoster();
    }
  });
}

/* ─── Global UI wiring ───────────────────────────────── */
function initUI() {
  // data-go navigation buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    const screen = btn.dataset.go;
    if (screen === 'title' && activeScene && activeScene.exit) {
      if (stopCurrentLoop) { stopCurrentLoop(); stopCurrentLoop = null; }
    }
    navigate(screen);
  });

  // Play-back button
  document.getElementById('play-back')?.addEventListener('click', () => navigate('title'));

  // Mute / Narrator
  const muteBtn = document.getElementById('mute-btn');
  const narrateBtn = document.getElementById('narrate-btn');
  muteBtn?.addEventListener('click', () => {
    setState({ mute: !S.mute });
    localStorage.setItem('fz-mute', S.mute ? '1' : '0');
    sfx.mute(S.mute);
    muteBtn.textContent = S.mute ? '🔇' : '🔊';
  });
  narrateBtn?.addEventListener('click', () => {
    narrator.enabled = !narrator.enabled;
    narrateBtn.style.opacity = narrator.enabled ? '1' : '0.4';
  });

  // PWA install
  let deferredPrompt = null;
  const installBtn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
  });
  installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') installBtn.style.display = 'none';
    deferredPrompt = null;
  });

  // iOS hint
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone;
  if (isIOS && !isStandalone) {
    const hint = document.getElementById('ios-hint');
    if (hint) hint.style.display = 'block';
  }

  // Trophy close
  document.getElementById('trophy-done')?.addEventListener('click', () => {
    document.getElementById('trophy-screen').classList.add('hidden');
    navigate('title');
  });

  // Joystick
  initJoystick();

  // Apply saved preferences
  sfx.mute(S.mute);
  if (muteBtn) muteBtn.textContent = S.mute ? '🔇' : '🔊';
  if (narrateBtn) narrateBtn.style.opacity = narrator.enabled ? '1' : '0.4';
}

function initJoystick() {
  const base = document.getElementById('joy-base');
  const knob = document.getElementById('joy-knob');
  const jumpBtn = document.getElementById('jump-btn');
  if (!base || !knob) return;

  const R = 28;
  let active = false;
  let origin = { x: 0, y: 0 };

  function onMove(cx, cy) {
    const dx = cx - origin.x;
    const dy = cy - origin.y;
    const dist = Math.min(Math.hypot(dx, dy), R);
    const angle = Math.atan2(dy, dx);
    knob.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;
    if (freeroamMode && freeroamMode.handleJoystick) freeroamMode.handleJoystick(dx / R, dy / R);
  }

  base.addEventListener('pointerdown', e => {
    active = true;
    const r = base.getBoundingClientRect();
    origin = { x: r.left + r.width/2, y: r.top + r.height/2 };
    base.setPointerCapture(e.pointerId);
    onMove(e.clientX, e.clientY);
  });
  base.addEventListener('pointermove', e => { if (active) onMove(e.clientX, e.clientY); });
  base.addEventListener('pointerup', () => {
    active = false;
    knob.style.transform = 'translate(-50%,-50%)';
    if (freeroamMode && freeroamMode.handleJoystick) freeroamMode.handleJoystick(0, 0);
  });

  jumpBtn?.addEventListener('click', () => {
    haptic.double();
    if (freeroamMode && freeroamMode.handleJump) freeroamMode.handleJump();
  });
}

boot();
