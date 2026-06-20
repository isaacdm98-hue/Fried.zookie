/**
 * narrator.js — pre-baked neural-voice narrator for FriedZooki.
 *
 * Plays warm, Stephen-Fry-flavoured commentary that was synthesised
 * ahead of time (Piper, British neural voice) and bundled as OGG clips
 * in assets/voice/.  Each spoken line is mirrored on-screen as an
 * animated caption bubble (LittleBigPlanet style).
 *
 * Falls back to the Web Speech API only if a clip can't be loaded.
 */

const LS_KEY    = 'fz-voice';
const LS_INTRO  = 'fz-heard-intro';
const VOICE_DIR = './assets/voice/';

export const narrator = {
  _manifest: null,
  _cache: new Map(),      // file -> HTMLAudioElement
  _current: null,
  _capEl: null,
  _capTimer: null,
  _synth: (typeof window !== 'undefined' && window.speechSynthesis) || null,
  _voice: null,

  // ── Init ───────────────────────────────────────────────────────────────────
  async init() {
    // Caption element
    this._capEl = document.getElementById('narration');

    // Load the clip manifest
    try {
      const res = await fetch(VOICE_DIR + 'manifest.json', { cache: 'force-cache' });
      this._manifest = await res.json();
      // Warm the cache for the snappiest events
      for (const ev of ['race_start', 'win', 'lose', 'lead_change']) {
        for (const clip of (this._manifest[ev] || [])) this._load(clip.file);
      }
    } catch (_) {
      this._manifest = null;   // we'll lean on Web Speech
    }

    // Web Speech fallback voice (best British we can find)
    if (this._synth) {
      const pickVoice = () => {
        const vs = this._synth.getVoices();
        if (!vs.length) return;
        this._voice =
          vs.find(v => v.lang === 'en-GB' && /daniel|arthur|oliver|george|male/i.test(v.name)) ||
          vs.find(v => v.lang === 'en-GB') ||
          vs.find(v => v.lang.startsWith('en')) || vs[0];
      };
      pickVoice();
      this._synth.addEventListener('voiceschanged', pickVoice);
    }
  },

  _load(file) {
    if (this._cache.has(file)) return this._cache.get(file);
    const a = new Audio(VOICE_DIR + file);
    a.preload = 'auto';
    this._cache.set(file, a);
    return a;
  },

  // ── Play a random clip for an event ─────────────────────────────────────────
  /**
   * @param {string} event — key in the manifest
   * @param {{interrupt?: boolean}} [opts]
   */
  play(event, opts = {}) {
    if (!this.enabled) return;
    const pool = this._manifest && this._manifest[event];

    if (pool && pool.length) {
      const clip = pool[Math.floor(Math.random() * pool.length)];
      const audio = this._load(clip.file);

      // Stop whatever's playing (commentary shouldn't pile up)
      if (this._current && this._current !== audio) {
        try { this._current.pause(); this._current.currentTime = 0; } catch (_) {}
      }
      this._current = audio;
      this._caption(clip.text, audio);
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && p.catch) p.catch(() => this._speak(clip.text));
      } catch (_) { this._speak(clip.text); }
      return;
    }

    // No clip available → Web Speech fallback with a sensible line
    this._speak(this._fallbackText(event));
  },

  /** Play an event only the first time ever (e.g. the intro story). */
  playOnce(event, flag = LS_INTRO) {
    try { if (localStorage.getItem(flag)) return; localStorage.setItem(flag, '1'); }
    catch (_) {}
    this.play(event);
  },

  // ── Caption bubble ──────────────────────────────────────────────────────────
  _caption(text, audio) {
    const el = this._capEl || (this._capEl = document.getElementById('narration'));
    if (!el) return;
    if (this._capTimer) { clearTimeout(this._capTimer); this._capTimer = null; }

    el.innerHTML = `<span class="narr-bubble"><span class="narr-icon"></span>${_esc(text)}</span>`;
    el.classList.add('show');

    const hide = () => { el.classList.remove('show'); };
    if (audio) {
      audio.onended = hide;
      // Safety timeout in case 'ended' never fires
      this._capTimer = setTimeout(hide, 9000);
    } else {
      this._capTimer = setTimeout(hide, Math.min(7000, 1800 + text.length * 55));
    }
  },

  // ── Web Speech fallback ─────────────────────────────────────────────────────
  _speak(text) {
    if (!text) return;
    this._caption(text, null);
    if (!this._synth) return;
    try {
      this._synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (this._voice) u.voice = this._voice;
      u.rate = 0.96; u.pitch = 1.0;
      this._synth.speak(u);
    } catch (_) {}
  },

  _fallbackText(event) {
    const f = {
      race_start: "And they're off!",
      win: "Magnificent!",
      lose: "So very nearly.",
      lead_change: "A change at the front!",
      collision: "Oof, a coming-together!",
      new_record: "A new personal best!",
      build: "Let us build a creature.",
      save: "Saved for posterity.",
      champion: "Champion of all Bamzooki!",
      intro: "Welcome to the world of Bamzooki.",
      title: "The arena awaits.",
    };
    return f[event] || '';
  },

  // Back-compat: return the text of a random line for an event
  pick(event) {
    const pool = this._manifest && this._manifest[event];
    if (pool && pool.length) return pool[Math.floor(Math.random() * pool.length)].text;
    return this._fallbackText(event);
  },
  say(text) { this._speak(text); },

  // ── Enabled flag (persisted) ────────────────────────────────────────────────
  get enabled() {
    try { const v = localStorage.getItem(LS_KEY); return v === null ? true : v === 'true'; }
    catch (_) { return true; }
  },
  set enabled(val) {
    try { localStorage.setItem(LS_KEY, String(Boolean(val))); } catch (_) {}
    if (!val) {
      if (this._current) { try { this._current.pause(); } catch (_) {} }
      if (this._synth) { try { this._synth.cancel(); } catch (_) {} }
      if (this._capEl) this._capEl.classList.remove('show');
    }
  },
};

function _esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
