/**
 * versus.js — VersusMode
 *
 * Head-to-head match between two player-selected Zooks.
 * Populates player A / B genome selects from the roster,
 * then lets the player pick a trial and start the race.
 */

import { navigate }    from '../router.js';
import { S, setState } from '../state.js';
import { TRIALS }      from './trials.js';

export class VersusMode {
  constructor() {
    this._section  = null;
    this._selectA  = null;
    this._selectB  = null;
    this._trialSel = null;
    this._roster   = null;
    this._startCb  = null;  // callback: (trialId, genomeA, genomeB) => void
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * @param {object[]}  [roster]   — list of saved genomes (from main.js)
   * @param {Function}  [startCb]  — called as startCb(trialId, genomeA, genomeB)
   */
  enter(roster, startCb) {
    this._roster  = roster || S.roster || [];
    this._startCb = startCb || null;
    this._ensureSection();
    this._injectCSS();
    this._populateSelects();
    this._wireButtons();
  }

  exit() {
    // No persistent state to clean up
  }

  // ── Section scaffold ─────────────────────────────────────────────────────

  _ensureSection() {
    this._section = document.getElementById('screen-vs') || document.getElementById('screen-versus');

    if (!this._section) {
      this._section = document.createElement('section');
      this._section.id = 'screen-vs';
      this._section.innerHTML = this._scaffoldHTML();
      document.body.appendChild(this._section);
    } else if (!this._section.querySelector('#vs-select-a')) {
      // Section exists but has no controls; inject them
      this._section.innerHTML = this._scaffoldHTML();
    }

    this._selectA  = this._section.querySelector('#vs-select-a');
    this._selectB  = this._section.querySelector('#vs-select-b');
    this._trialSel = this._section.querySelector('#vs-trial');
  }

  _scaffoldHTML() {
    const trialOptions = TRIALS.map(t =>
      `<option value="${t.id}">${t.emoji} ${t.label}</option>`
    ).join('');

    return `
      <div class="vs-container">
        <div class="vs-header">
          <button id="vs-back" class="vs-back-btn">&#x2190; Back</button>
          <h2 class="vs-title">Versus</h2>
        </div>

        <div class="vs-players">
          <div class="vs-player-col">
            <div class="vs-player-label vs-label-a">PLAYER A</div>
            <select id="vs-select-a" class="vs-select" aria-label="Player A Zook"></select>
          </div>

          <div class="vs-divider">VS</div>

          <div class="vs-player-col">
            <div class="vs-player-label vs-label-b">PLAYER B</div>
            <select id="vs-select-b" class="vs-select" aria-label="Player B Zook"></select>
          </div>
        </div>

        <div class="vs-trial-row">
          <label class="vs-label" for="vs-trial">Trial</label>
          <select id="vs-trial" class="vs-select">${trialOptions}</select>
        </div>

        <button id="vs-start" class="vs-start-btn">START MATCH</button>
      </div>
    `;
  }

  // ── Populate selects ─────────────────────────────────────────────────────

  _populateSelects() {
    const roster = this._roster || S.roster || [];

    [this._selectA, this._selectB].forEach((sel, idx) => {
      if (!sel) return;
      sel.innerHTML = '';

      if (roster.length === 0) {
        const opt = document.createElement('option');
        opt.value = '__default__';
        opt.textContent = idx === 0 ? 'My Zook (default)' : 'Rival (default)';
        sel.appendChild(opt);
        return;
      }

      roster.forEach((genome, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = genome.name || `Zook ${i + 1}`;
        sel.appendChild(opt);
      });

      // Default: A picks first, B picks second (if available)
      if (idx === 1 && roster.length > 1) sel.selectedIndex = 1;
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────

  _wireButtons() {
    const backBtn  = this._section.querySelector('#vs-back');
    const startBtn = this._section.querySelector('#vs-start');

    if (backBtn)  backBtn.addEventListener('click',  () => navigate('title'));
    if (startBtn) startBtn.addEventListener('click', () => this._handleStart());
  }

  _handleStart() {
    const roster  = this._roster || S.roster || [];
    const trialId = this._trialSel?.value || 'sprint';

    const genomeA = this._resolveGenome(this._selectA, roster, 0);
    const genomeB = this._resolveGenome(this._selectB, roster, 1);

    if (!genomeA || !genomeB) {
      alert('Please save at least one Zook to your roster before playing Versus!');
      return;
    }

    this.startMatch(trialId, genomeA, genomeB);
  }

  _resolveGenome(selectEl, roster, fallbackIdx) {
    if (!selectEl) return null;
    const val = selectEl.value;

    if (val === '__default__') {
      return fallbackIdx === 0 ? S.activeGenome : (roster[0] || S.activeGenome);
    }

    const idx = parseInt(val, 10);
    return roster[idx] || S.activeGenome;
  }

  // ── Public: start match ───────────────────────────────────────────────────

  /**
   * Launch the race with two Zooks.
   *
   * @param {string} trialId
   * @param {object} genomeA  — player A's genome
   * @param {object} genomeB  — player B's genome (opponent)
   */
  startMatch(trialId, genomeA, genomeB) {
    setState({ vsA: genomeA, vsB: genomeB });

    // Delegate to main.js callback when available
    if (typeof this._startCb === 'function') {
      this._startCb(trialId, genomeA, genomeB);
      return;
    }

    // Standalone fallback
    const trial = TRIALS.find(t => t.id === trialId) || TRIALS[0];
    const config = { trial, playerGenome: genomeA, opponents: [genomeB], vsMode: true };
    setState({ raceMode: 'vs', raceConfig: config });
    navigate('race', config);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById('versus-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'versus-mode-style';
    style.textContent = `
      #screen-vs {
        display: none;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: rgba(15,10,22,0.95);
        font-family: 'Courier New', monospace;
        color: #ffb347;
        padding: 24px;
        box-sizing: border-box;
      }
      #screen-vs.show { display: flex; }

      .vs-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: 100%;
        max-width: 480px;
      }

      .vs-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .vs-back-btn {
        background: none;
        border: 1.5px solid #f07800;
        color: #f07800;
        font-family: inherit;
        font-size: 13px;
        font-weight: 900;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .vs-back-btn:hover { filter: brightness(1.2); }

      .vs-title {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: 0.12em;
        margin: 0;
        color: #ffb347;
      }

      .vs-players {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
      }

      .vs-player-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .vs-player-label {
        font-size: 10px;
        letter-spacing: 0.18em;
        font-weight: 900;
      }
      .vs-label-a { color: #4ade80; }
      .vs-label-b { color: #f472b6; }

      .vs-divider {
        font-size: 22px;
        font-weight: 900;
        color: #f07800;
        padding: 0 4px;
      }

      .vs-select {
        background: rgba(26,20,35,0.95);
        border: 1.5px solid #f07800;
        border-radius: 8px;
        color: #ffb347;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        padding: 8px 10px;
        width: 100%;
        cursor: pointer;
        outline: none;
        appearance: none;
      }
      .vs-select:focus { border-color: #ffb347; }

      .vs-trial-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
      }

      .vs-label {
        font-size: 10px;
        letter-spacing: 0.15em;
        color: #a07040;
      }

      .vs-start-btn {
        width: 100%;
        padding: 14px;
        background: #f07800;
        border: none;
        border-radius: 12px;
        color: #1a1020;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 0.12em;
        cursor: pointer;
        transition: filter 0.15s;
        box-shadow: 0 0 20px rgba(240,120,0,0.35);
      }
      .vs-start-btn:hover  { filter: brightness(1.1); }
      .vs-start-btn:active { filter: brightness(0.85); }
    `;
    document.head.appendChild(style);
  }
}
