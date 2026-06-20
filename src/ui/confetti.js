/**
 * confetti.js — Particle confetti burst for FriedZooki win screen.
 * Uses genome PALETTE colors, runs for 3 seconds via requestAnimationFrame.
 */

import { PALETTE } from '../creature/genome.js';

const PARTICLE_COUNT = 80;
const DURATION_MS    = 3000;

/**
 * Fire confetti onto the given canvas element.
 * @param {HTMLCanvasElement} canvas
 */
export function fireConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // Build particles
  const particles = Array.from({ length: PARTICLE_COUNT }, () => _makeParticle(W));

  let startTime = null;

  function frame(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / DURATION_MS, 1);

    // Fade out the whole canvas overlay via globalAlpha near the end
    const fadeAlpha = progress > 0.75 ? 1 - (progress - 0.75) / 0.25 : 1;

    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // Physics step
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.28;           // gravity
      p.vx *= 0.995;          // mild air resistance
      p.rot += p.rotSpeed;

      // Wrap horizontally
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;

      if (p.y > H + 20) continue; // off screen, skip draw

      // Draw rectangle chip
      ctx.save();
      ctx.globalAlpha = fadeAlpha * p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  requestAnimationFrame(frame);
}

function _makeParticle(W) {
  return {
    x:        Math.random() * W,
    y:        Math.random() * -60 - 10,       // start above canvas
    vx:       (Math.random() - 0.5) * 4,
    vy:       Math.random() * 2 + 1,
    rot:      Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.18,
    w:        6 + Math.random() * 8,
    h:        3 + Math.random() * 5,
    color:    PALETTE[Math.floor(Math.random() * PALETTE.length)],
    alpha:    0.75 + Math.random() * 0.25,
  };
}
