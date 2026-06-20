/**
 * hud.js — Race HUD overlay for FriedZooki
 * Synth-panel aesthetic: dark (#1a1520) with orange/amber accents.
 */

const MODE_FIELDS = {
  sprint:    ['time', 'speed'],
  hurdles:   ['time', 'speed', 'distance'],
  highJump:  ['height'],
  sumo:      ['playerPos', 'totalPlayers'],
  lap:       ['time', 'speed', 'distance'],
  football:  ['playerPos', 'totalPlayers'],
  blockPush: ['distance', 'speed'],
  assault:   ['time', 'distance'],
};

const MODE_LABELS = {
  sprint:    'SPRINT',
  hurdles:   'HURDLES',
  highJump:  'HIGH JUMP',
  sumo:      'SUMO',
  lap:       'LAP RACE',
  football:  'FOOTBALL',
  blockPush: 'BLOCK PUSH',
  assault:   'ASSAULT',
};

export class HUD {
  constructor() {
    this._el = document.querySelector('#hud');
    this._mode = null;
    this._liveBug = null;
    this._countdownEl = null;
    this._countdownTimer = null;

    if (!this._el) {
      // Create HUD if not present in DOM
      this._el = document.createElement('div');
      this._el.id = 'hud';
      document.body.appendChild(this._el);
    }

    this._el.style.cssText = `
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      flex-direction: row;
      gap: 16px;
      align-items: center;
      background: rgba(26,21,32,0.88);
      border: 1.5px solid #f07800;
      border-radius: 10px;
      padding: 8px 20px;
      font-family: 'Courier New', monospace;
      color: #ffb347;
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.08em;
      z-index: 30;
      pointer-events: none;
      box-shadow: 0 0 18px rgba(240,120,0,0.35);
    `;

    this._inner = document.createElement('div');
    this._inner.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    this._el.appendChild(this._inner);
  }

  /** Show HUD for given mode string */
  show(mode) {
    this._mode = mode;
    this._el.style.display = 'flex';
    this._render({});
  }

  /** Update displayed values */
  update({ time, distance, height, speed, playerPos, totalPlayers } = {}) {
    const vals = { time, distance, height, speed, playerPos, totalPlayers };
    this._render(vals);
  }

  _render(vals) {
    const mode = this._mode || 'sprint';
    const fields = MODE_FIELDS[mode] || [];
    const label = MODE_LABELS[mode] || mode.toUpperCase();

    let html = `<div style="color:#f07800;font-size:11px;letter-spacing:0.15em;margin-bottom:2px;">${label}</div>`;
    html += '<div style="display:flex;gap:18px;align-items:center;">';

    for (const field of fields) {
      let raw = vals[field];
      let display = '--';
      let unit = '';

      switch (field) {
        case 'time':
          display = raw != null ? _formatTime(raw) : '--:--';
          break;
        case 'distance':
          display = raw != null ? raw.toFixed(1) : '0.0';
          unit = 'm';
          break;
        case 'height':
          display = raw != null ? raw.toFixed(2) : '0.00';
          unit = 'm';
          break;
        case 'speed':
          display = raw != null ? raw.toFixed(1) : '0.0';
          unit = 'm/s';
          break;
        case 'playerPos':
          display = raw != null ? _ordinal(raw) : '-';
          break;
        case 'totalPlayers':
          display = vals.playerPos != null && raw != null
            ? `${_ordinal(vals.playerPos)} / ${raw}`
            : (raw != null ? `/ ${raw}` : '-');
          break;
        default:
          display = raw != null ? String(raw) : '--';
      }

      if (field === 'totalPlayers') continue; // rendered with playerPos

      const fieldLabel = _fieldLabel(field, mode);
      html += `
        <div style="display:flex;flex-direction:column;align-items:center;min-width:50px;">
          <span style="font-size:10px;color:#a07040;letter-spacing:0.1em;">${fieldLabel}</span>
          <span style="font-size:17px;color:#ffb347;">
            ${display}<span style="font-size:10px;color:#f07800;margin-left:2px;">${unit}</span>
          </span>
        </div>
      `;
    }

    html += '</div>';
    this._inner.innerHTML = html;
  }

  /** Display animated countdown: 3 → 2 → 1 → GO! */
  showCountdown(n) {
    if (!this._countdownEl) {
      this._countdownEl = document.createElement('div');
      this._countdownEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1);
        font-family: 'Courier New', monospace;
        font-size: 96px;
        font-weight: 900;
        color: #ffb347;
        text-shadow: 0 0 40px #f07800, 0 0 80px rgba(240,120,0,0.5);
        z-index: 50;
        pointer-events: none;
        transition: transform 0.1s ease-out, opacity 0.2s ease;
        will-change: transform, opacity;
      `;
      document.body.appendChild(this._countdownEl);
    }

    const text = n === 0 ? 'GO!' : String(n);
    this._countdownEl.textContent = text;
    this._countdownEl.style.opacity = '1';
    this._countdownEl.style.transform = 'translate(-50%, -50%) scale(1)';

    // Pop-in animation
    requestAnimationFrame(() => {
      this._countdownEl.style.transform = 'translate(-50%, -50%) scale(1.25)';
      setTimeout(() => {
        if (this._countdownEl) {
          this._countdownEl.style.transform = 'translate(-50%, -50%) scale(1)';
        }
      }, 120);
    });

    if (this._countdownTimer) clearTimeout(this._countdownTimer);
    this._countdownTimer = setTimeout(() => {
      if (this._countdownEl) {
        this._countdownEl.style.opacity = '0';
      }
    }, n === 0 ? 800 : 700);
  }

  /** Hide the HUD panel */
  hide() {
    this._el.style.display = 'none';
    if (this._countdownEl) {
      this._countdownEl.style.opacity = '0';
    }
  }

  /** Show red LIVE badge top-left */
  showLiveBug() {
    if (this._liveBug) return;
    this._liveBug = document.createElement('div');
    this._liveBug.innerHTML = '&#x1F534; LIVE';
    this._liveBug.style.cssText = `
      position: absolute;
      top: 10px;
      left: 12px;
      background: rgba(180,0,0,0.82);
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.12em;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1.5px solid #ff4444;
      z-index: 40;
      pointer-events: none;
      animation: fz-live-pulse 1.2s infinite alternate;
    `;

    // Inject keyframe if not already present
    if (!document.querySelector('#fz-live-style')) {
      const style = document.createElement('style');
      style.id = 'fz-live-style';
      style.textContent = `
        @keyframes fz-live-pulse {
          from { box-shadow: 0 0 6px rgba(255,0,0,0.5); }
          to   { box-shadow: 0 0 16px rgba(255,0,0,0.9); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(this._liveBug);
  }

  /** Remove LIVE badge */
  hideLiveBug() {
    if (this._liveBug) {
      this._liveBug.remove();
      this._liveBug = null;
    }
  }
}

// --- helpers ---

function _formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const secs = s % 60;
  const frac = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(frac).padStart(2,'0')}`;
}

function _ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function _fieldLabel(field, mode) {
  const map = {
    time:       'TIME',
    distance:   mode === 'highJump' ? 'HEIGHT' : 'DIST',
    height:     'HEIGHT',
    speed:      'SPEED',
    playerPos:  'POS',
    totalPlayers: 'FIELD',
  };
  return map[field] || field.toUpperCase();
}
