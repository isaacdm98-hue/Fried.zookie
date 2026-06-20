/**
 * results.js — ResultsScene
 *
 * Populates and shows/hides the #result modal overlay.
 * Creates the modal DOM if it isn't already in the document.
 *
 * Expected modal structure (auto-created if absent):
 *   <div id="result">
 *     <div id="result-inner">…</div>
 *   </div>
 */

import { haptic }   from '../ui/haptic.js';
import { navigate } from '../router.js';

// Label mapping for nextAction → button text
const ACTION_LABELS = {
  retry:      'Retry',
  trials:     'Back to Trials',
  champ_next: 'Next Race',
  champ_end:  'See Trophy',
};

export class ResultsScene {
  constructor() {
    this._modal     = null;
    this._confetti  = null;
    this._confettiAF = null;
    this._currentNextAction = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Show the results modal.
   *
   * @param {{
   *   won:          boolean,
   *   metric:       string,
   *   metricLabel:  string,
   *   trialLabel:   string,
   *   nextAction?:  'retry'|'trials'|'champ_next'|'champ_end',
   *   onNext?:      () => void,
   *   onRetry?:     () => void,   — overrides default retry action (from main.js)
   *   onMenu?:      () => void,   — called when "continue/menu" button pressed
   * }} opts
   */
  show({ won, metric, metricLabel, trialLabel, nextAction, onNext, onRetry, onMenu }) {
    this._currentNextAction = nextAction;
    this._ensureModal();

    const inner = this._modal.querySelector('#result-inner');
    if (!inner) return;

    // Build HTML — show menu button label based on available callbacks
    const menuLabel = onMenu ? 'Menu' : (ACTION_LABELS[nextAction] || 'Continue');
    inner.innerHTML = this._buildHTML({ won, metric, metricLabel, trialLabel, nextAction, menuLabel });

    // Button actions
    const nextBtn  = inner.querySelector('#result-next');
    const retryBtn = inner.querySelector('#result-retry');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.hide();
        if (typeof onMenu === 'function')  onMenu();
        else if (typeof onNext === 'function') onNext();
        else this._defaultNextAction(nextAction);
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hide();
        if (typeof onRetry === 'function') onRetry();
        else navigate('race', null);
      });
    }

    // Show modal
    this._modal.style.display = 'flex';
    requestAnimationFrame(() => {
      this._modal.classList.add('result-visible');
    });

    // Confetti on win
    if (won) {
      haptic.win();
      this._startConfetti();
    } else {
      haptic.impact();
    }
  }

  /** Hide and clean up the modal. */
  hide() {
    if (!this._modal) return;
    this._modal.classList.remove('result-visible');
    this._stopConfetti();
    setTimeout(() => {
      if (this._modal) this._modal.style.display = 'none';
    }, 350);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _ensureModal() {
    // Reuse existing modal if it's in the DOM
    this._modal = document.getElementById('result');
    if (this._modal) {
      if (!this._modal.querySelector('#result-inner')) {
        const inner = document.createElement('div');
        inner.id = 'result-inner';
        this._modal.appendChild(inner);
      }
      this._injectCSS();
      return;
    }

    // Build modal from scratch
    this._modal = document.createElement('div');
    this._modal.id = 'result';

    const inner = document.createElement('div');
    inner.id = 'result-inner';
    this._modal.appendChild(inner);

    // Confetti canvas
    this._confetti = document.createElement('canvas');
    this._confetti.id = 'result-confetti';
    this._modal.appendChild(this._confetti);

    document.body.appendChild(this._modal);
    this._injectCSS();
  }

  _buildHTML({ won, metric, metricLabel, trialLabel, nextAction, menuLabel }) {
    const headlineText  = won ? 'Victory!'     : 'Nice Try!';
    const headlineColor = won ? '#4ade80'       : '#ffb347';
    const subText       = won
      ? `You won the ${trialLabel}!`
      : `Keep training and you'll nail it.`;
    const nextLabel = menuLabel || ACTION_LABELS[nextAction] || 'Continue';

    return `
      <div class="res-trial-label">${_esc(trialLabel)}</div>
      <div class="res-headline" style="color:${headlineColor}">${headlineText}</div>
      <div class="res-sub">${_esc(subText)}</div>
      <div class="res-metric">
        <span class="res-metric-val">${_esc(metric)}</span>
        <span class="res-metric-lbl">${_esc(metricLabel)}</span>
      </div>
      <div class="res-actions">
        ${!won ? `<button id="result-retry" class="res-btn res-btn-ghost">Retry</button>` : ''}
        <button id="result-next" class="res-btn res-btn-primary">${_esc(nextLabel)}</button>
      </div>
    `;
  }

  _defaultNextAction(nextAction) {
    switch (nextAction) {
      case 'retry':      navigate('race');     break;
      case 'trials':     navigate('trials');   break;
      case 'champ_next': navigate('champ');    break;
      case 'champ_end':  navigate('trophy');   break;
      default:           navigate('title');    break;
    }
  }

  _injectCSS() {
    if (document.getElementById('result-style')) return;
    const style = document.createElement('style');
    style.id = 'result-style';
    style.textContent = `
      #result {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 100;
        align-items: center;
        justify-content: center;
        background: rgba(15, 10, 22, 0.82);
        backdrop-filter: blur(6px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #result.result-visible { opacity: 1; }

      #result-confetti {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }

      #result-inner {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        background: rgba(26, 20, 35, 0.96);
        border: 2px solid #f07800;
        border-radius: 20px;
        padding: 32px 40px;
        max-width: 420px;
        width: 90vw;
        font-family: 'Courier New', monospace;
        text-align: center;
        box-shadow: 0 0 40px rgba(240,120,0,0.3), 0 8px 32px rgba(0,0,0,0.7);
        animation: res-pop 0.35s cubic-bezier(0.22,1,0.36,1) both;
      }

      @keyframes res-pop {
        from { transform: scale(0.8) translateY(30px); opacity: 0; }
        to   { transform: scale(1)   translateY(0);    opacity: 1; }
      }

      .res-trial-label {
        font-size: 11px;
        letter-spacing: 0.18em;
        color: #f07800;
        text-transform: uppercase;
      }

      .res-headline {
        font-size: 48px;
        font-weight: 900;
        letter-spacing: 0.04em;
        text-shadow: 0 0 24px currentColor;
        line-height: 1;
      }

      .res-sub {
        font-size: 14px;
        color: #a07040;
        max-width: 280px;
      }

      .res-metric {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        background: rgba(240,120,0,0.08);
        border: 1px solid rgba(240,120,0,0.3);
        border-radius: 12px;
        padding: 12px 28px;
      }

      .res-metric-val {
        font-size: 36px;
        font-weight: 900;
        color: #ffb347;
      }

      .res-metric-lbl {
        font-size: 10px;
        letter-spacing: 0.15em;
        color: #f07800;
      }

      .res-actions {
        display: flex;
        gap: 10px;
        width: 100%;
        margin-top: 6px;
      }

      .res-btn {
        flex: 1;
        padding: 11px 8px;
        border-radius: 10px;
        border: none;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .res-btn:active { filter: brightness(0.75); }
      .res-btn-primary { background: #f07800; color: #1a1020; }
      .res-btn-ghost   { background: rgba(255,255,255,0.06); color: #a07040; border: 1.5px solid #a07040; }
    `;
    document.head.appendChild(style);
  }

  // ── Confetti ──────────────────────────────────────────────────────────────

  _startConfetti() {
    const canvas = this._modal?.querySelector('#result-confetti');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#f07800','#ffb347','#4ade80','#38bdf8','#a78bfa','#f472b6','#fb7185'];
    const particles = Array.from({ length: 120 }, () => ({
      x:    Math.random() * canvas.width,
      y:    -20 - Math.random() * 80,
      vx:   (Math.random() - 0.5) * 3,
      vy:   2 + Math.random() * 4,
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.25,
      w:    8 + Math.random() * 8,
      h:    5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDead = true;
      for (const p of particles) {
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rotV;
        p.vy  += 0.07;   // gravity
        p.life = Math.max(0, 1 - p.y / (canvas.height * 1.2));
        if (p.y < canvas.height + 20) allDead = false;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (!allDead) this._confettiAF = requestAnimationFrame(draw);
    };

    this._confettiAF = requestAnimationFrame(draw);
  }

  _stopConfetti() {
    if (this._confettiAF) {
      cancelAnimationFrame(this._confettiAF);
      this._confettiAF = null;
    }
    const canvas = this._modal?.querySelector('#result-confetti');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
