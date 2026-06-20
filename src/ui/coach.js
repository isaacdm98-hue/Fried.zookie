/**
 * coach.js — Step-by-step workshop coach overlay for FriedZooki.
 * Explains the synth-panel controls to new players.
 */

/** Default workshop tutorial steps */
export const WORKSHOP_STEPS = [
  {
    text: 'These knobs control your creature\'s body size and mass. Turn them to reshape the body!',
    highlight: '[data-coach="body-knobs"]',
  },
  {
    text: 'This knob sets how many legs your creature has. More legs = more grip!',
    highlight: '[data-coach="leg-knob"]',
  },
  {
    text: 'The gait sliders control how your creature walks — step height, stride length, and speed.',
    highlight: '[data-coach="gait-knobs"]',
  },
  {
    text: 'Pick a color for your creature here. Stand out on the track!',
    highlight: '[data-coach="color-picker"]',
  },
  {
    text: 'Happy with your creature? Hit SAVE to lock it in and head to the race!',
    highlight: '[data-coach="save-button"]',
  },
];

export class Coach {
  constructor() {
    this._el = document.querySelector('#coach');
    this._steps = [];
    this._index = 0;
    this._doneCb = null;
    this._highlightTarget = null;
    this._overlay = null;

    if (!this._el) {
      this._el = document.createElement('div');
      this._el.id = 'coach';
      document.body.appendChild(this._el);
    }

    this._buildDOM();
    this._el.style.display = 'none';
  }

  _buildDOM() {
    // Inject keyframes if needed
    if (!document.querySelector('#fz-coach-style')) {
      const style = document.createElement('style');
      style.id = 'fz-coach-style';
      style.textContent = `
        @keyframes fz-coach-pulse {
          0%, 100% { box-shadow: 0 0 0 3px #f07800, 0 0 0 7px rgba(240,120,0,0.30); }
          50%       { box-shadow: 0 0 0 4px #ffb347, 0 0 0 12px rgba(255,179,71,0.15); }
        }
        .fz-coach-highlight {
          animation: fz-coach-pulse 1.1s ease-in-out infinite !important;
          position: relative;
          z-index: 61 !important;
        }
        #fz-coach-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 8, 14, 0.72);
          z-index: 59;
          pointer-events: none;
        }
        #fz-coach-bubble {
          position: fixed;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(26,21,32,0.97);
          border: 2px solid #f07800;
          border-radius: 14px;
          padding: 18px 24px;
          max-width: 420px;
          min-width: 280px;
          z-index: 62;
          font-family: 'Courier New', monospace;
          color: #ffb347;
          box-shadow: 0 0 30px rgba(240,120,0,0.3);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        #fz-coach-text {
          font-size: 15px;
          line-height: 1.5;
          color: #ffe0a0;
        }
        #fz-coach-steps {
          font-size: 11px;
          color: #a07040;
          letter-spacing: 0.1em;
        }
        #fz-coach-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .fz-coach-btn {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 0.08em;
          padding: 7px 18px;
          border-radius: 7px;
          cursor: pointer;
          border: 1.5px solid #f07800;
          background: transparent;
          color: #ffb347;
          transition: background 0.15s, color 0.15s;
        }
        .fz-coach-btn:hover {
          background: #f07800;
          color: #1a1520;
        }
        .fz-coach-btn-primary {
          background: #f07800;
          color: #1a1520;
        }
        .fz-coach-btn-primary:hover {
          background: #ffb347;
        }
      `;
      document.head.appendChild(style);
    }

    // Backdrop
    this._backdrop = document.createElement('div');
    this._backdrop.id = 'fz-coach-backdrop';

    // Bubble
    this._bubble = document.createElement('div');
    this._bubble.id = 'fz-coach-bubble';

    this._textEl = document.createElement('div');
    this._textEl.id = 'fz-coach-text';

    this._stepsEl = document.createElement('div');
    this._stepsEl.id = 'fz-coach-steps';

    this._actionsEl = document.createElement('div');
    this._actionsEl.id = 'fz-coach-actions';

    this._skipBtn = document.createElement('button');
    this._skipBtn.className = 'fz-coach-btn';
    this._skipBtn.textContent = 'SKIP';
    this._skipBtn.addEventListener('click', () => this.skip());

    this._nextBtn = document.createElement('button');
    this._nextBtn.className = 'fz-coach-btn fz-coach-btn-primary';
    this._nextBtn.textContent = 'NEXT';
    this._nextBtn.addEventListener('click', () => this.next());

    this._actionsEl.appendChild(this._skipBtn);
    this._actionsEl.appendChild(this._nextBtn);

    this._bubble.appendChild(this._textEl);
    this._bubble.appendChild(this._stepsEl);
    this._bubble.appendChild(this._actionsEl);

    this._el.appendChild(this._backdrop);
    this._el.appendChild(this._bubble);
  }

  /**
   * Start the coach with an array of steps.
   * @param {Array<{text: string, highlight: string}>} steps
   */
  start(steps) {
    this._steps = steps && steps.length ? steps : WORKSHOP_STEPS;
    this._index = 0;
    this._el.style.display = 'block';
    this._showStep(0);
  }

  _showStep(i) {
    const step = this._steps[i];
    if (!step) {
      this._finish();
      return;
    }

    // Update text
    this._textEl.textContent = step.text;
    this._stepsEl.textContent = `STEP ${i + 1} OF ${this._steps.length}`;

    // Update next button label
    this._nextBtn.textContent = i === this._steps.length - 1 ? 'DONE' : 'NEXT';

    // Remove previous highlight
    this._clearHighlight();

    // Apply new highlight
    if (step.highlight) {
      const target = document.querySelector(step.highlight);
      if (target) {
        target.classList.add('fz-coach-highlight');
        this._highlightTarget = target;
      }
    }
  }

  _clearHighlight() {
    if (this._highlightTarget) {
      this._highlightTarget.classList.remove('fz-coach-highlight');
      this._highlightTarget = null;
    }
  }

  _finish() {
    this._clearHighlight();
    this._el.style.display = 'none';
    if (this._doneCb) this._doneCb();
  }

  /** Advance to the next step */
  next() {
    this._index++;
    if (this._index >= this._steps.length) {
      this._finish();
    } else {
      this._showStep(this._index);
    }
  }

  /** Skip the coach entirely */
  skip() {
    this._finish();
  }

  /**
   * Register a callback for when all steps are complete or skipped.
   * @param {Function} fn
   */
  onDone(fn) {
    this._doneCb = fn;
  }
}
