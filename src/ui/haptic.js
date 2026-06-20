/**
 * haptic.js — Vibration feedback for FriedZooki
 * All calls go through navigator.vibrate() with try/catch; no-op if unsupported.
 */

function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (_) {
    // unsupported — silently ignore
  }
}

export const haptic = {
  /** 8ms pulse — slider nudge */
  tick() {
    vibrate(8);
  },

  /** [12,40,12] — add/remove leg, major change */
  double() {
    vibrate([12, 40, 12]);
  },

  /** 30ms pulse — countdown beat */
  beep() {
    vibrate(30);
  },

  /** [60,30,60] — race GO */
  burst() {
    vibrate([60, 30, 60]);
  },

  /** [200,80,100,80,200] — finish line win */
  win() {
    vibrate([200, 80, 100, 80, 200]);
  },

  /** 50ms — sumo/block collision impact */
  impact() {
    vibrate(50);
  },
};
