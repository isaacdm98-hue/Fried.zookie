/**
 * online.js — OnlineMode
 *
 * Wraps the PeerNet WebRTC layer from ../net/webrtc.js.
 * Provides host/join flow: the host generates an SDP offer code,
 * the joiner pastes it and generates an answer, then both start racing.
 *
 * Expected HTML (auto-created if absent):
 *   <section id="screen-online">…</section>
 */

import { PeerNet }     from '../net/webrtc.js';
import { navigate }    from '../router.js';
import { S, setState } from '../state.js';
import { TRIALS }      from './trials.js';
import { cloneGenome } from '../creature/genome.js';
import { haptic }      from '../ui/haptic.js';

// Trial to use for online matches (can be overridden)
const DEFAULT_ONLINE_TRIAL = 'sprint';

export class OnlineMode {
  constructor() {
    this._section    = null;
    this._peer       = null;   // PeerNet instance
    this._role       = null;   // 'host' | 'join'
    this._roster     = null;
    this._startCb    = null;   // main.js: (trialId, genomeA, [genomeB]) => void

    // Bound cleanup
    this._onConnected    = this._onConnected.bind(this);
    this._onData         = this._onData.bind(this);
    this._onDisconnected = this._onDisconnected.bind(this);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * @param {object[]}  [roster]   — saved genomes (passed by main.js)
   * @param {Function}  [startCb]  — main.js: (trialId, genomeA, opponents) => void
   */
  enter(roster, startCb) {
    this._roster  = roster  || S.roster || [];
    this._startCb = startCb || null;
    this._ensureSection();
    this._injectCSS();
    this._renderLobby();
    this._wireButtons();
  }

  exit() {
    if (this._peer) {
      this._peer.close();
      this._peer = null;
    }
  }

  // ── Section scaffold ─────────────────────────────────────────────────────

  _ensureSection() {
    this._section = document.getElementById('screen-online');
    if (!this._section) {
      this._section = document.createElement('section');
      this._section.id = 'screen-online';
      document.body.appendChild(this._section);
    }
  }

  _renderLobby() {
    if (!this._section) return;

    const trialOptions = TRIALS.map(t =>
      `<option value="${t.id}">${t.emoji} ${t.label}</option>`
    ).join('');

    this._section.innerHTML = `
      <div class="on-container">
        <div class="on-header">
          <button id="online-back" class="on-back-btn">&#x2190; Back</button>
          <h2 class="on-title">Online</h2>
        </div>

        <div class="on-trial-row">
          <label class="on-label" for="online-trial">Trial</label>
          <select id="online-trial" class="on-select">${trialOptions}</select>
        </div>

        <div class="on-split">
          <div class="on-panel">
            <div class="on-panel-title">HOST</div>
            <p class="on-hint">Create a game and share your code.</p>
            <button id="online-host" class="on-btn on-btn-primary">Create Game</button>
            <div id="online-offer-wrap" class="on-code-wrap" style="display:none">
              <div class="on-code-label">Your Code</div>
              <textarea id="online-offer-code" class="on-code-area" readonly rows="4"></textarea>
              <button id="online-offer-copy" class="on-btn on-btn-ghost">Copy</button>
              <div class="on-code-label" style="margin-top:10px">Paste their Answer</div>
              <textarea id="online-answer-paste" class="on-code-area" rows="4"
                        placeholder="Paste opponent's answer code here…"></textarea>
              <button id="online-accept-answer" class="on-btn on-btn-primary">Connect</button>
            </div>
          </div>

          <div class="on-divider">OR</div>

          <div class="on-panel">
            <div class="on-panel-title">JOIN</div>
            <p class="on-hint">Paste your opponent's code to join.</p>
            <textarea id="online-join-code" class="on-code-area" rows="4"
                      placeholder="Paste host's offer code here…"></textarea>
            <button id="online-join" class="on-btn on-btn-accent">Join Game</button>
            <div id="online-answer-wrap" class="on-code-wrap" style="display:none">
              <div class="on-code-label">Your Answer Code</div>
              <textarea id="online-my-answer" class="on-code-area" readonly rows="4"></textarea>
              <button id="online-answer-copy" class="on-btn on-btn-ghost">Copy</button>
              <div class="on-status" id="online-join-status">Waiting for host to connect…</div>
            </div>
          </div>
        </div>

        <div id="online-status" class="on-status"></div>
      </div>
    `;
  }

  // ── Button wiring ─────────────────────────────────────────────────────────

  _wireButtons() {
    const s = this._section;
    if (!s) return;

    s.querySelector('#online-back')?.addEventListener('click', () => {
      this.exit();
      navigate('title');
    });

    s.querySelector('#online-host')?.addEventListener('click', () => this.host());

    s.querySelector('#online-offer-copy')?.addEventListener('click', () => {
      const ta = s.querySelector('#online-offer-code');
      if (ta) { navigator.clipboard?.writeText(ta.value).catch(() => {}); this._flash('#online-offer-copy', 'Copied!'); }
    });

    s.querySelector('#online-accept-answer')?.addEventListener('click', () => {
      const ta = s.querySelector('#online-answer-paste');
      if (ta?.value.trim()) this._acceptAnswer(ta.value.trim());
    });

    s.querySelector('#online-join')?.addEventListener('click', () => {
      const ta = s.querySelector('#online-join-code');
      if (ta?.value.trim()) this.join(ta.value.trim());
    });

    s.querySelector('#online-answer-copy')?.addEventListener('click', () => {
      const ta = s.querySelector('#online-my-answer');
      if (ta) { navigator.clipboard?.writeText(ta.value).catch(() => {}); this._flash('#online-answer-copy', 'Copied!'); }
    });
  }

  // ── Host flow ─────────────────────────────────────────────────────────────

  async host() {
    this._role = 'host';
    this._setStatus('Creating offer…');

    const peer = new PeerNet();
    this._peer = peer;

    // PeerNet uses 'open', 'close', 'data' as event names
    peer.on('open',  this._onConnected);
    peer.on('data',  this._onData);
    peer.on('close', this._onDisconnected);

    try {
      // PeerNet.host() returns base64 offer code
      const offerCode = await peer.host();
      setState({ netRole: 'host', netPeer: peer });

      const offerWrap = this._section.querySelector('#online-offer-wrap');
      const offerTA   = this._section.querySelector('#online-offer-code');
      if (offerWrap) offerWrap.style.display = '';
      if (offerTA)   offerTA.value = offerCode;

      this._setStatus('Share your code, then paste the opponent\'s answer.');
    } catch (err) {
      this._setStatus(`Error: ${err.message}`);
      console.error('[OnlineMode] host error:', err);
    }
  }

  async _acceptAnswer(answerCode) {
    if (!this._peer) return;
    this._setStatus('Connecting…');
    try {
      // PeerNet.connect() finalises the host connection with the joiner's answer
      await this._peer.connect(answerCode);
      // _onConnected fires when channel opens
    } catch (err) {
      this._setStatus(`Connection error: ${err.message}`);
    }
  }

  // ── Join flow ─────────────────────────────────────────────────────────────

  async join(offerCode) {
    this._role = 'join';
    this._setStatus('Processing offer…');

    const peer = new PeerNet();
    this._peer = peer;

    peer.on('open',  this._onConnected);
    peer.on('data',  this._onData);
    peer.on('close', this._onDisconnected);

    try {
      // PeerNet.join() accepts the host's offer and returns the answer code
      const answerCode = await peer.join(offerCode);
      setState({ netRole: 'join', netPeer: peer });

      const answerWrap = this._section.querySelector('#online-answer-wrap');
      const answerTA   = this._section.querySelector('#online-my-answer');
      if (answerWrap) answerWrap.style.display = '';
      if (answerTA)   answerTA.value = answerCode;

      const statusEl = this._section.querySelector('#online-join-status');
      if (statusEl) statusEl.textContent = 'Waiting for host to connect…';

      this._setStatus('Share your answer code with the host. Waiting for them to connect…');
    } catch (err) {
      this._setStatus(`Error: ${err.message}`);
      console.error('[OnlineMode] join error:', err);
    }
  }

  // ── PeerNet events ────────────────────────────────────────────────────────

  _onConnected() {
    this._setStatus('Connected! Starting race…');
    haptic.burst();

    // Exchange genomes
    const myGenome = S.activeGenome;
    this._peer.send({ type: 'genome', genome: cloneGenome(myGenome) });
  }

  _onData(msg) {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

      if (data.type === 'genome') {
        setState({ netGenome: data.genome });
        this._startOnlineRace(data.genome);
      }
    } catch (e) {
      console.warn('[OnlineMode] unexpected data:', msg);
    }
  }

  _onDisconnected() {
    this._setStatus('Opponent disconnected.');
  }

  // ── Start race ────────────────────────────────────────────────────────────

  _startOnlineRace(opponentGenome) {
    const trialEl = this._section?.querySelector('#online-trial');
    const trialId = trialEl?.value || DEFAULT_ONLINE_TRIAL;
    const trial   = TRIALS.find(t => t.id === trialId) || TRIALS[0];

    const playerGenome   = S.activeGenome;
    const opponentClone  = cloneGenome(opponentGenome);

    const config = {
      trial,
      playerGenome,
      opponents: [opponentClone],
      vsMode: true,
    };

    // Delegate to main.js callback when available
    if (typeof this._startCb === 'function') {
      this._startCb(trialId, playerGenome, [opponentClone]);
      return;
    }

    // Standalone fallback
    setState({ raceMode: 'online', raceConfig: config });
    navigate('race', config);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _setStatus(msg) {
    const el = this._section?.querySelector('#online-status');
    if (el) el.textContent = msg;
  }

  _flash(selector, text) {
    const btn = this._section?.querySelector(selector);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { if (btn) btn.textContent = orig; }, 1400);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  _injectCSS() {
    if (document.getElementById('online-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'online-mode-style';
    style.textContent = `
      #screen-online {
        display: none;
        align-items: flex-start;
        justify-content: center;
        min-height: 100vh;
        background: rgba(15,10,22,0.97);
        font-family: 'Courier New', monospace;
        color: #ffb347;
        padding: 24px 16px;
        box-sizing: border-box;
        overflow-y: auto;
      }
      #screen-online.show { display: flex; }

      .on-container {
        display: flex; flex-direction: column;
        align-items: center; gap: 18px;
        width: 100%; max-width: 640px;
      }

      .on-header {
        width: 100%; display: flex;
        align-items: center; gap: 16px;
      }
      .on-back-btn {
        background: none; border: 1.5px solid #f07800;
        color: #f07800; font-family: inherit; font-size: 13px;
        font-weight: 900; padding: 6px 14px; border-radius: 8px;
        cursor: pointer; transition: filter 0.15s;
      }
      .on-back-btn:hover { filter: brightness(1.2); }

      .on-title {
        font-size: 20px; font-weight: 900;
        letter-spacing: 0.12em; margin: 0;
      }

      .on-trial-row {
        display: flex; flex-direction: column;
        gap: 6px; width: 100%;
      }
      .on-label {
        font-size: 10px; letter-spacing: 0.15em; color: #a07040;
      }
      .on-select {
        background: rgba(26,20,35,0.95);
        border: 1.5px solid #f07800; border-radius: 8px;
        color: #ffb347; font-family: 'Courier New', monospace;
        font-size: 13px; padding: 8px 10px;
        width: 100%; cursor: pointer; outline: none;
      }

      .on-split {
        display: flex; gap: 16px;
        width: 100%; align-items: flex-start;
      }
      @media (max-width: 520px) {
        .on-split { flex-direction: column; }
      }

      .on-panel {
        flex: 1; display: flex; flex-direction: column;
        gap: 8px;
        background: rgba(26,20,35,0.7);
        border: 1.5px solid rgba(240,120,0,0.3);
        border-radius: 12px; padding: 14px;
      }

      .on-panel-title {
        font-size: 11px; letter-spacing: 0.18em;
        font-weight: 900; color: #f07800;
      }

      .on-hint {
        font-size: 11px; color: #a07040; margin: 0;
        line-height: 1.5;
      }

      .on-divider {
        padding: 8px 4px;
        font-size: 14px; font-weight: 900;
        color: #f07800; align-self: center;
      }

      .on-btn {
        padding: 9px 10px; border-radius: 8px; border: none;
        font-family: inherit; font-size: 12px;
        font-weight: 900; letter-spacing: 0.08em;
        cursor: pointer; transition: filter 0.15s;
      }
      .on-btn:active { filter: brightness(0.8); }
      .on-btn-primary { background: #f07800; color: #1a1020; }
      .on-btn-accent  { background: #4ade80; color: #1a1020; }
      .on-btn-ghost {
        background: rgba(255,255,255,0.06);
        color: #a07040; border: 1.5px solid #a07040;
      }

      .on-code-wrap {
        display: flex; flex-direction: column; gap: 6px;
        margin-top: 4px;
      }
      .on-code-label {
        font-size: 9px; letter-spacing: 0.14em; color: #a07040;
      }
      .on-code-area {
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(240,120,0,0.4);
        border-radius: 6px; color: #ffb347;
        font-family: 'Courier New', monospace; font-size: 10px;
        padding: 6px 8px; resize: vertical;
        line-height: 1.4; word-break: break-all;
        outline: none;
      }

      .on-status {
        font-size: 11px; color: #a07040;
        letter-spacing: 0.08em; text-align: center;
        min-height: 16px;
      }
    `;
    document.head.appendChild(style);
  }
}
