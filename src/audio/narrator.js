/**
 * narrator.js — Web Speech API narrator for FriedZooki.
 * Picks the best available voice and speaks race commentary.
 */

const LS_KEY = 'fz-voice';

export const narrator = {
  _synth: null,
  _voice: null,
  _utterance: null,

  /** Variant commentary lines keyed by event */
  lines: {
    build: [
      "Let me see what you've got!",
      "What a magnificent creature!",
      "I've never seen anything quite like it!",
      "That's one unusual-looking runner!",
      "Biomechanical genius — or madness!",
    ],
    race_start: [
      "And they're off!",
      "Here we go!",
      "The race is underway!",
      "They're racing!",
      "It's started — watch them go!",
    ],
    win: [
      "What a run!",
      "Incredible!",
      "That was outstanding!",
      "First across the line — magnificent!",
      "A stunning performance!",
      "They did it! What a finish!",
    ],
    lose: [
      "So close!",
      "Better luck next time!",
      "Oh, so nearly!",
      "That's racing — keep trying!",
      "Unlucky — they'll bounce back!",
    ],
    lead_change: [
      "They take the lead!",
      "A change at the front!",
      "Look at that — they're in front!",
      "What a move — into the lead!",
      "The lead has changed hands!",
    ],
    collision: [
      "Ooh, big hit!",
      "They've clashed!",
      "Crunch! That's gotta hurt!",
      "Contact — can they recover?",
    ],
    new_record: [
      "That's a new personal best!",
      "Record time — unbelievable!",
      "They've beaten their best!",
    ],
  },

  /**
   * Initialise the narrator — store synth reference and pick best voice.
   * Safe to call multiple times.
   */
  init() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this._synth = window.speechSynthesis;

    const _pickVoice = () => {
      const voices = this._synth.getVoices();
      if (!voices.length) return;

      // Prefer a British English voice for CBBC flavour
      const preferred = [
        v => v.lang === 'en-GB' && v.localService,
        v => v.lang === 'en-GB',
        v => v.lang.startsWith('en') && v.localService,
        v => v.lang.startsWith('en'),
      ];

      for (const test of preferred) {
        const match = voices.find(test);
        if (match) { this._voice = match; return; }
      }

      this._voice = voices[0] || null;
    };

    _pickVoice();
    // Voices may load asynchronously
    this._synth.addEventListener('voiceschanged', _pickVoice);
  },

  /**
   * Speak text, cancelling any current utterance first.
   * @param {string} text
   */
  say(text) {
    if (!this._synth || !this.enabled) return;

    // Cancel current speech
    this._synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    if (this._voice) utt.voice = this._voice;
    utt.rate  = 1.05;
    utt.pitch = 1.1;
    utt.volume = 1.0;

    this._utterance = utt;
    this._synth.speak(utt);
  },

  /**
   * Pick a random line from the named event pool.
   * @param {string} event — key in `narrator.lines`
   * @returns {string}
   */
  pick(event) {
    const pool = this.lines[event];
    if (!pool || !pool.length) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  },

  /** Whether narration is enabled (persisted to localStorage). */
  get enabled() {
    try {
      const val = localStorage.getItem(LS_KEY);
      return val === null ? true : val === 'true';
    } catch (_) {
      return true;
    }
  },

  set enabled(val) {
    try {
      localStorage.setItem(LS_KEY, String(Boolean(val)));
    } catch (_) {
      // storage unavailable
    }
    if (!val && this._synth) this._synth.cancel();
  },
};
