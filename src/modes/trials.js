/**
 * trials.js — TrialsMode
 *
 * Shows the trial selection screen (#screen-trials).
 * Populates #trials-list with one card per trial and lets the
 * player pick which event to enter.
 */

import { navigate }      from '../router.js';
import { S, setState }   from '../state.js';
import { AI_GENOMES }    from '../creature/genome.js';

// ── Trial definitions ─────────────────────────────────────────────────────────
export const TRIALS = [
  { id: 'sprint',    emoji: '🏃', label: 'Sprint',     buildEnv: 'buildSprint',    goal: 'distance',  dist: 25, maxTime: 30 },
  { id: 'hurdles',   emoji: '🚧', label: 'Hurdles',    buildEnv: 'buildHurdles',   goal: 'distance',  dist: 25, maxTime: 40 },
  { id: 'highJump',  emoji: '⬆️', label: 'High Jump',  buildEnv: 'buildHighJump',  goal: 'height',              maxTime: 15 },
  { id: 'lap',       emoji: '🔁', label: 'Lap',        buildEnv: 'buildLap',       goal: 'lap',                 maxTime: 60 },
  { id: 'blockPush', emoji: '📦', label: 'Block Push', buildEnv: 'buildBlockPush', goal: 'blockDist', dist: 15, maxTime: 45 },
  { id: 'football',  emoji: '⚽', label: 'Football',   buildEnv: 'buildFootball',  goal: 'goal',                maxTime: 60 },
  { id: 'sumo',      emoji: '🤼', label: 'Sumo',       buildEnv: 'buildSumo',      goal: 'sumo',                maxTime: 45 },
  { id: 'assault',   emoji: '🧗', label: 'Assault',    buildEnv: 'buildAssault',   goal: 'distance',  dist: 30, maxTime: 60 },
];

export class TrialsMode {
  constructor() {
    this._listEl    = null;
    this._backBtn   = null;
    this._section   = null;
    this._genome    = null;
    this._startCb   = null;  // callback from main.js: (trialId, genome) => void
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * @param {object}   [genome]     — active genome (from main.js)
   * @param {Function} [startCb]   — called as startCb(trialId, genome) by main.js
   */
  enter(genome, startCb) {
    this._genome  = genome || S.activeGenome;
    this._startCb = startCb || null;
    this._section = document.getElementById('screen-trials') || document.getElementById('trials');
    this._listEl  = document.getElementById('trials-list');

    if (!this._listEl) {
      // Auto-create the list container inside the section
      if (this._section) {
        this._listEl = document.createElement('div');
        this._listEl.id = 'trials-list';
        this._section.appendChild(this._listEl);
      } else {
        // Create a full section if completely absent
        this._section = document.createElement('section');
        this._section.id = 'screen-trials';
        this._section.innerHTML = `
          <div class="tm-header">
            <button id="trials-back" class="tm-back-btn">&#x2190; Back</button>
            <h2 class="tm-title">Choose Your Trial</h2>
          </div>
          <div id="trials-list" class="tm-grid"></div>
        `;
        document.body.appendChild(this._section);
        this._listEl = this._section.querySelector('#trials-list');
      }
    }

    this._injectCSS();
    this._renderList();
    this._wireBackButton();
  }

  exit() {
    if (this._listEl) this._listEl.innerHTML = '';
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _renderList() {
    if (!this._listEl) return;

    this._listEl.innerHTML = TRIALS.map(trial => `
      <button class="tm-card" data-trial-id="${trial.id}" aria-label="${trial.label} trial">
        <span class="tm-card-emoji">${trial.emoji}</span>
        <span class="tm-card-label">${trial.label}</span>
        <span class="tm-card-desc">${_trialDesc(trial)}</span>
      </button>
    `).join('');

    this._listEl.querySelectorAll('.tm-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const trialId = btn.dataset.trialId;
        this.startTrial(trialId, this._genome || S.activeGenome);
      });
    });
  }

  _wireBackButton() {
    const backBtn = document.getElementById('trials-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => navigate('title'));
    }
  }

  /**
   * Start a trial with the given genome.
   * Two AI opponents are picked from AI_GENOMES.
   *
   * @param {string} trialId
   * @param {object} genome
   */
  startTrial(trialId, genome) {
    const g = genome || this._genome || S.activeGenome;

    // If main.js provided a callback, let it handle race setup and loop wiring
    if (typeof this._startCb === 'function') {
      this._startCb(trialId, g);
      return;
    }

    // Standalone fallback (used when TrialsMode drives navigation itself)
    const trial = TRIALS.find(t => t.id === trialId);
    if (!trial) { console.warn('Unknown trial id:', trialId); return; }

    const opponents = AI_GENOMES.slice(0, 2);
    const config = { trial, playerGenome: g, opponents, vsMode: false };
    setState({ raceMode: 'trial', raceConfig: config });
    navigate('race', config);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById('trials-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'trials-mode-style';
    style.textContent = `
      #screen-trials {
        display: none;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px;
        font-family: 'Courier New', monospace;
        min-height: 100vh;
        background: rgba(15,10,22,0.95);
        color: #ffb347;
        box-sizing: border-box;
      }
      #screen-trials.show { display: flex; }

      .tm-header {
        width: 100%;
        max-width: 640px;
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }

      .tm-back-btn {
        background: none;
        border: 1.5px solid #f07800;
        color: #f07800;
        font-family: inherit;
        font-size: 13px;
        font-weight: 900;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        letter-spacing: 0.08em;
        transition: filter 0.15s;
      }
      .tm-back-btn:hover { filter: brightness(1.2); }

      .tm-title {
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0.1em;
        margin: 0;
        color: #ffb347;
      }

      #trials-list, .tm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        width: 100%;
        max-width: 640px;
      }

      .tm-card {
        background: rgba(26,20,35,0.90);
        border: 2px solid #f07800;
        border-radius: 14px;
        padding: 18px 10px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: transform 0.12s, box-shadow 0.12s;
        font-family: 'Courier New', monospace;
        color: #ffb347;
        text-align: center;
      }
      .tm-card:hover  { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(240,120,0,0.3); }
      .tm-card:active { transform: scale(0.96); }

      .tm-card-emoji  { font-size: 32px; line-height: 1; }
      .tm-card-label  { font-size: 13px; font-weight: 900; letter-spacing: 0.06em; }
      .tm-card-desc   { font-size: 9px;  color: #a07040; letter-spacing: 0.06em; }
    `;
    document.head.appendChild(style);
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function _trialDesc(trial) {
  const descs = {
    sprint:    `${trial.dist}m sprint`,
    hurdles:   `${trial.dist}m hurdles`,
    highJump:  `Max height in ${trial.maxTime}s`,
    lap:       `Full circuit`,
    blockPush: `Push block ${trial.dist}m`,
    football:  `Score a goal`,
    sumo:      `Push opponent out`,
    assault:   `${trial.dist}m obstacle run`,
  };
  return descs[trial.id] || '';
}
