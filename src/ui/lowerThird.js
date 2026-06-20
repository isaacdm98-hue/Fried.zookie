/**
 * lowerThird.js — CBBC-style animated lower-third banners for FriedZooki.
 * Slides in from the left, auto-hides after a configurable duration.
 */

export class LowerThird {
  constructor() {
    this._el = document.createElement('div');
    this._el.className = 'fz-lower-third';
    this._el.style.cssText = `
      position: absolute;
      bottom: 48px;
      left: 0;
      z-index: 20;
      pointer-events: none;
      transform: translateX(-110%);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      will-change: transform;
    `;

    // Inner pill / banner
    this._pill = document.createElement('div');
    this._pill.style.cssText = `
      display: inline-block;
      background: rgba(26, 21, 32, 0.90);
      border: 2px solid #f07800;
      border-left: none;
      border-radius: 0 40px 40px 0;
      padding: 10px 28px 10px 20px;
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.06em;
      color: #ffb347;
      text-shadow: 0 0 12px rgba(240, 120, 0, 0.6);
      box-shadow: 4px 0 24px rgba(240,120,0,0.25), 0 2px 8px rgba(0,0,0,0.6);
      white-space: nowrap;
    `;

    this._el.appendChild(this._pill);
    document.body.appendChild(this._el);

    this._hideTimer = null;
  }

  /**
   * Slide the banner in from the left, display text, then auto-hide.
   * @param {string} text      — Creature name / event text to display
   * @param {number} duration  — Time in ms before auto-hide (default 3000)
   */
  show(text, duration = 3000) {
    // Cancel any pending hide
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }

    this._pill.textContent = text;

    // Force reflow so transition fires even when re-showing quickly
    this._el.style.transform = 'translateX(-110%)';
    // eslint-disable-next-line no-unused-expressions
    this._el.offsetWidth; // reflow

    requestAnimationFrame(() => {
      this._el.style.transform = 'translateX(0)';
    });

    this._hideTimer = setTimeout(() => this._slideOut(), duration);
  }

  _slideOut() {
    this._el.style.transform = 'translateX(-110%)';
    this._hideTimer = null;
  }

  /** Immediately hide the banner without waiting for auto-hide. */
  hide() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
    this._slideOut();
  }

  /** Remove from DOM entirely. */
  destroy() {
    this.hide();
    this._el.remove();
  }
}
