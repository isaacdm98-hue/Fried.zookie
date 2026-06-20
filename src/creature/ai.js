import { Zook } from './builder.js';
import { AI_GENOMES } from './genome.js';

/**
 * Spawn a pack of AI-controlled Zooks beside the player's starting position.
 *
 * Genomes are taken from AI_GENOMES (shuffled each call) so you get a
 * different set of rivals every race.  If there are more requested rivals than
 * genomes, the list wraps around.
 *
 * @param {import('@dimforge/rapier3d-compat').World} world
 * @param {typeof import('@dimforge/rapier3d-compat')} RAPIER
 * @param {import('three').Scene} scene
 * @param {{
 *   startZ?:    number,   // z position of start line (default 5)
 *   lane?:      number,   // lateral spacing between creatures (default 1.6)
 *   count?:     number,   // number of AI rivals to spawn (default AI_GENOMES.length)
 *   heading?:   number,   // facing direction in radians (default 0 = -z)
 * }} trialConfig
 * @returns {Zook[]}
 */
export function spawnAI(world, RAPIER, scene, trialConfig = {}) {
  const {
    startZ  = 5,
    lane    = 1.6,
    count   = AI_GENOMES.length,
    heading = 0,
  } = trialConfig;

  // Shuffle a copy of AI_GENOMES so rivals vary each race
  const shuffled = shuffleArray([...AI_GENOMES]);

  const zooks = [];
  for (let i = 0; i < count; i++) {
    const genome  = shuffled[i % shuffled.length];

    // Spread rivals horizontally: -N/2 … +N/2 lanes, skip lane 0 (player)
    const laneIndex = i + 1;               // offset so player occupies lane 0
    const x = (laneIndex % 2 === 0 ? 1 : -1) * Math.ceil(laneIndex / 2) * lane;

    const zook = new Zook(genome, world, RAPIER, scene, {
      x,
      z:        startZ,
      heading,
      isPreview: false,
    });

    zooks.push(zook);
  }

  return zooks;
}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates in-place shuffle.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
