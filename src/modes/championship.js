/**
 * championship.js — ChampionshipMode
 *
 * Runs the player through 8 races in a fixed order,
 * accumulating a score. After all 8 events the trophy
 * ceremony fires.
 */

import * as THREE from 'three';
import { navigate }      from '../router.js';
import { S, setState }   from '../state.js';
import { TRIALS }        from './trials.js';
import { AI_GENOMES, cloneGenome } from '../creature/genome.js';
import { haptic }        from '../ui/haptic.js';

// Championship event order (matches spec)
export const CHAMP_ORDER = [
  'sprint', 'hurdles', 'highJump', 'football',
  'sumo', 'blockPush', 'assault', 'lap',
];

// Points awarded per position
const POINTS = { won: 10, lost: 4 };

export class ChampionshipMode {
  constructor() {
    this._section       = null;
    this._scoreboard    = null;
    this._trophyTimeout = null;
    this._confettiAF    = null;
    this._startRaceCb   = null;  // main.js: (trialId, genome, onDone) => void
    this._onEndCb       = null;  // main.js: (scores, genome) => void
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Initialise a new championship run.
   * @param {object}   genome        — the player's active Zook
   * @param {Function} [startRaceCb] — main.js callback: (trialId, genome, onDone) => void
   * @param {Function} [onEndCb]     — main.js callback: (scores, genome) => void
   */
  enter(genome, startRaceCb, onEndCb) {
    this._startRaceCb = startRaceCb || null;
    this._onEndCb     = onEndCb     || null;

    const champState = {
      genome:     cloneGenome(genome || S.activeGenome),
      scores:     [],
      raceIndex:  0,
    };
    setState({ champState });

    this._ensureSection();
    this._injectCSS();
    this._renderOverview();
    this._wireButtons();
  }

  exit() {
    if (this._trophyTimeout) { clearTimeout(this._trophyTimeout); this._trophyTimeout = null; }
    this._stopConfetti();
  }

  // ── Public race flow ──────────────────────────────────────────────────────

  /** Start the next race in the championship order. */
  nextRace() {
    const cs = S.champState;
    if (!cs) return;

    if (cs.raceIndex >= CHAMP_ORDER.length) {
      this.showTrophy();
      return;
    }

    const trialId = CHAMP_ORDER[cs.raceIndex];
    const trial   = TRIALS.find(t => t.id === trialId);
    if (!trial) return;

    // Delegate to main.js callback when available (it wires the loop)
    if (typeof this._startRaceCb === 'function') {
      this._startRaceCb(trialId, cs.genome, (won) => {
        this.recordResult(won);
      });
      return;
    }

    // Standalone fallback
    const config = {
      trial,
      playerGenome: cs.genome,
      opponents:    AI_GENOMES.slice(0, 2),
      vsMode:       false,
    };
    setState({ raceMode: 'champ', raceConfig: config });
    navigate('race', config);
  }

  /**
   * Record the result of the current race and advance the index.
   * @param {boolean} won
   * @param {string}  [metric]  — e.g. "12.4s"
   */
  recordResult(won, metric = '') {
    const cs = S.champState;
    if (!cs) return;

    const trialId = CHAMP_ORDER[cs.raceIndex];
    const points  = won ? POINTS.won : POINTS.lost;

    const scores = [
      ...cs.scores,
      { trialId, won, metric, points },
    ];
    const raceIndex = cs.raceIndex + 1;

    setState({ champState: { ...cs, scores, raceIndex } });

    if (raceIndex >= CHAMP_ORDER.length) {
      // All 8 done — go to trophy
      this.showTrophy();
    }
  }

  // ── Trophy ceremony ───────────────────────────────────────────────────────

  showTrophy() {
    const cs = S.champState;
    if (!cs) return;

    const total = cs.scores.reduce((sum, s) => sum + s.points, 0);
    const won   = cs.scores.filter(s => s.won).length;
    const grade = _grade(total);

    this._ensureSection();
    this._renderTrophy({ total, won, grade, scores: cs.scores });

    haptic.win();
    this._startConfetti();

    // Let main.js handle its own trophy display if callback provided
    if (typeof this._onEndCb === 'function') {
      this._onEndCb(
        cs.scores.map(s => s.won),
        cs.genome,
      );
    }

    navigate('trophy');
  }

  // ── Scoreboard update helper ──────────────────────────────────────────────

  _renderOverview() {
    if (!this._section) return;
    const cs = S.champState;
    if (!cs) return;

    this._section.innerHTML = `
      <div class="ch-container">
        <div class="ch-header">
          <button id="champ-back" class="ch-back-btn">&#x2190; Back</button>
          <h2 class="ch-title">Championship</h2>
        </div>
        <div class="ch-zook-name">${_esc(cs.genome.name)}</div>
        <div class="ch-event-list" id="champ-event-list">
          ${CHAMP_ORDER.map((id, idx) => {
            const trial  = TRIALS.find(t => t.id === id);
            const result = cs.scores[idx];
            const state  = result ? (result.won ? 'won' : 'lost') : (idx === cs.raceIndex ? 'next' : 'pending');
            return `
              <div class="ch-event ch-event-${state}">
                <span class="ch-event-emoji">${trial?.emoji || ''}</span>
                <span class="ch-event-label">${trial?.label || id}</span>
                <span class="ch-event-result">
                  ${result ? (result.won ? `+${result.points}` : `+${result.points}`) : (state === 'next' ? 'UP NEXT' : '')}
                </span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="ch-total">Total Score: <b id="champ-total">${cs.scores.reduce((s,r) => s + r.points, 0)}</b></div>
        <button id="champ-next-race" class="ch-start-btn">
          ${cs.raceIndex < CHAMP_ORDER.length ? 'Next Race' : 'See Trophy'}
        </button>
      </div>
    `;

    this._wireButtons();
  }

  _renderTrophy({ total, won, grade, scores }) {
    const trophySection = document.getElementById('screen-trophy') || this._ensureTrophySection();

    trophySection.innerHTML = `
      <div class="ch-trophy-container">
        <div class="ch-trophy-icon" id="ch-trophy-mesh">&#x1F3C6;</div>
        <div class="ch-trophy-grade">${grade}</div>
        <div class="ch-trophy-score">${total} pts</div>
        <div class="ch-trophy-sub">${won} / ${CHAMP_ORDER.length} events won</div>
        <div class="ch-trophy-list">
          ${scores.map(s => {
            const trial = TRIALS.find(t => t.id === s.trialId);
            return `<div class="ch-trophy-row ${s.won ? 'row-won' : 'row-lost'}">
              <span>${trial?.emoji || ''} ${trial?.label || s.trialId}</span>
              <span>${s.won ? 'WIN' : 'LOSS'} +${s.points}</span>
            </div>`;
          }).join('')}
        </div>
        <button id="trophy-done" class="ch-start-btn" style="margin-top:16px;">Return to Menu</button>
      </div>
    `;

    // Animate trophy
    const icon = trophySection.querySelector('#ch-trophy-mesh');
    if (icon) {
      let t = 0;
      const anim = () => {
        t += 0.04;
        icon.style.transform = `scale(${1 + 0.06 * Math.sin(t)}) rotate(${5 * Math.sin(t * 0.7)}deg)`;
        if (this._confettiAF) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }

    const doneBtn = trophySection.querySelector('#trophy-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        this._stopConfetti();
        setState({ champState: null });
        navigate('title');
      });
    }
  }

  _ensureTrophySection() {
    let s = document.getElementById('screen-trophy');
    if (!s) {
      s = document.createElement('section');
      s.id = 'screen-trophy';
      document.body.appendChild(s);
      this._injectCSS();
    }
    return s;
  }

  // ── Section ───────────────────────────────────────────────────────────────

  _ensureSection() {
    this._section = document.getElementById('screen-champ') || document.getElementById('champ');
    if (!this._section) {
      this._section = document.createElement('section');
      this._section.id = 'screen-champ';
      document.body.appendChild(this._section);
    }
  }

  _wireButtons() {
    const backBtn  = this._section?.querySelector('#champ-back');
    const nextBtn  = this._section?.querySelector('#champ-next-race');

    if (backBtn)  backBtn.addEventListener('click',  () => navigate('title'));
    if (nextBtn)  nextBtn.addEventListener('click',  () => this.nextRace());
  }

  // ── Confetti ──────────────────────────────────────────────────────────────

  _startConfetti() {
    const canvas = document.getElementById('ch-confetti-canvas') || this._mkConfettiCanvas();
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#f07800','#ffb347','#4ade80','#38bdf8','#a78bfa','#f472b6'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2 + Math.random() * 3.5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      w: 8 + Math.random() * 7,
      h: 5 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rotV;
        p.vy  += 0.06;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.vy = 2 + Math.random() * 3.5;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      this._confettiAF = requestAnimationFrame(draw);
    };
    this._confettiAF = requestAnimationFrame(draw);
  }

  _mkConfettiCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ch-confetti-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;';
    document.body.appendChild(canvas);
    return canvas;
  }

  _stopConfetti() {
    if (this._confettiAF) { cancelAnimationFrame(this._confettiAF); this._confettiAF = null; }
    const canvas = document.getElementById('ch-confetti-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById('champ-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'champ-mode-style';
    style.textContent = `
      #screen-champ, #screen-trophy {
        display: none;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: rgba(15,10,22,0.97);
        font-family: 'Courier New', monospace;
        color: #ffb347;
        padding: 24px;
        box-sizing: border-box;
      }
      #screen-champ.show, #screen-trophy.show { display: flex; }

      .ch-container, .ch-trophy-container {
        display: flex; flex-direction: column;
        align-items: center; gap: 14px;
        width: 100%; max-width: 420px;
      }

      .ch-header {
        width: 100%; display: flex;
        align-items: center; gap: 16px;
      }
      .ch-back-btn {
        background: none; border: 1.5px solid #f07800;
        color: #f07800; font-family: inherit; font-size: 13px;
        font-weight: 900; padding: 6px 14px; border-radius: 8px;
        cursor: pointer; transition: filter 0.15s;
      }
      .ch-back-btn:hover { filter: brightness(1.2); }

      .ch-title {
        font-size: 20px; font-weight: 900;
        letter-spacing: 0.12em; margin: 0;
      }

      .ch-zook-name {
        font-size: 14px; color: #a07040;
        letter-spacing: 0.1em;
      }

      .ch-event-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }

      .ch-event {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px; border-radius: 8px;
        border: 1.5px solid rgba(240,120,0,0.2);
        font-size: 13px;
      }
      .ch-event-next    { border-color: #f07800; background: rgba(240,120,0,0.1); }
      .ch-event-won     { border-color: #4ade80; color: #4ade80; }
      .ch-event-lost    { border-color: #fb7185; color: #a07040; }
      .ch-event-pending { color: #4a3a4a; }

      .ch-event-emoji { font-size: 18px; }
      .ch-event-label { flex: 1; font-weight: 700; }
      .ch-event-result { font-size: 11px; letter-spacing: 0.1em; }

      .ch-total {
        font-size: 14px; letter-spacing: 0.08em;
        color: #a07040; width: 100%; text-align: right;
      }
      .ch-total b { color: #ffb347; }

      .ch-start-btn {
        width: 100%; padding: 13px;
        background: #f07800; border: none; border-radius: 12px;
        color: #1a1020; font-family: 'Courier New', monospace;
        font-size: 15px; font-weight: 900; letter-spacing: 0.1em;
        cursor: pointer; transition: filter 0.15s;
        box-shadow: 0 0 20px rgba(240,120,0,0.3);
      }
      .ch-start-btn:hover  { filter: brightness(1.1); }
      .ch-start-btn:active { filter: brightness(0.8); }

      /* Trophy screen */
      .ch-trophy-icon {
        font-size: 72px; line-height: 1;
        text-shadow: 0 0 30px #f07800;
        display: inline-block;
      }
      .ch-trophy-grade {
        font-size: 36px; font-weight: 900;
        color: #ffb347; letter-spacing: 0.06em;
        text-shadow: 0 0 20px rgba(255,180,70,0.6);
      }
      .ch-trophy-score {
        font-size: 28px; font-weight: 900; color: #f07800;
      }
      .ch-trophy-sub {
        font-size: 12px; color: #a07040; letter-spacing: 0.1em;
      }
      .ch-trophy-list {
        width: 100%; display: flex; flex-direction: column; gap: 6px;
        max-height: 260px; overflow-y: auto;
      }
      .ch-trophy-row {
        display: flex; justify-content: space-between;
        font-size: 12px; padding: 5px 10px;
        border-radius: 6px;
      }
      .row-won  { background: rgba(74,222,128,0.08); color: #4ade80; }
      .row-lost { background: rgba(251,113,133,0.08); color: #a07040; }
    `;
    document.head.appendChild(style);
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function _grade(total) {
  if (total >= 75) return 'S RANK';
  if (total >= 60) return 'A RANK';
  if (total >= 45) return 'B RANK';
  if (total >= 30) return 'C RANK';
  return 'D RANK';
}

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
