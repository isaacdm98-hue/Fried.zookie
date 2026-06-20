/**
 * behaviour.js — a small event-driven behaviour engine.
 *
 * Modelled on the BAMZOOKi Zook Kit's contest scripting: every contest is a
 * collection of agents (zooks + static/dynamic targets) wired together by
 * behaviours that listen for events, act on their owner each tick, and emit
 * new events. Contests are assembled from the same vocabulary the original
 * used: Goto, Follow, PositionBehind, MonitorDistance, ListenContact,
 * NoContact, Timer, Freeze/Unfreeze, Suspend/Resume, Winner/Loser/Finish.
 *
 * In FriedZooki — as on the show — competitors run autonomously: the player's
 * skill lives in how the zook was built and tuned, and the contest assigns
 * each zook a goal to pursue. The engine reads each zook's position/heading
 * and writes a control intent ({ steerLeft, steerRight, jump }) that RaceScene
 * feeds into Zook.step().
 */

// ── Steering helpers ───────────────────────────────────────────────────────

/** Smallest signed angle from a to b, wrapped to [-π, π]. */
function angleDelta(a, b) {
  let d = b - a;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Control intent that turns `zook` to face a world point and drive at it.
 * Forward is (-sin yaw, -cos yaw), and a +y steer torque increases yaw, so a
 * positive heading error steers left.
 * @returns {{ steerLeft: boolean, steerRight: boolean, jump: boolean }}
 */
export function steerToward(zook, tx, tz, { deadzone = 0.10 } = {}) {
  const p = zook.position;
  const desired = Math.atan2(-(tx - p.x), -(tz - p.z));
  const err = angleDelta(zook.yaw, desired);
  return { steerLeft: err > deadzone, steerRight: err < -deadzone, jump: false };
}

const NEUTRAL = { steerLeft: false, steerRight: false, jump: false };

// ── Contest ────────────────────────────────────────────────────────────────

export class Contest {
  constructor() {
    /** @type {Array<{zook:object,name:string,isPlayer:boolean,entry:object}>} */
    this.zooks    = [];
    this.targets  = new Map();   // id -> { position:{x,y,z} }
    this.behaviours = [];
    this.t        = 0;
    this.finished = false;
    this.result   = null;        // { winnerName, won, metric, metricLabel } | null
    this.onTimeout = null;       // (contest) => void — judge a contest at time limit
  }

  /** Called by RaceScene when the trial's maxTime elapses. */
  resolveTimeout() {
    if (this.finished) return this.result;
    if (typeof this.onTimeout === 'function') this.onTimeout(this);
    if (!this.finished) this.finish({ won: false, winnerName: '—', metric: 'Draw', metricLabel: 'Result' });
    return this.result;
  }

  /** Register a race entry (the object RaceScene already tracks per zook). */
  addZook(entry) {
    const a = {
      zook: entry.zook, name: entry.name, isPlayer: entry.isPlayer,
      entry, alive: true, control: { ...NEUTRAL }, frozen: false, suspended: false,
    };
    this.zooks.push(a);
    return a;
  }

  /** Register a target by id with a position (or a () => position provider). */
  addTarget(id, position) { this.targets.set(id, { position }); return id; }

  posOf(idOrAgent) {
    if (idOrAgent && idOrAgent.zook) return idOrAgent.zook.position;
    const t = this.targets.get(idOrAgent);
    if (!t) return { x: 0, y: 0, z: 0 };
    return typeof t.position === 'function' ? t.position() : t.position;
  }

  add(behaviour) { this.behaviours.push(behaviour); return behaviour; }

  /** Mark a competitor out and check whether a winner remains. */
  eliminate(agent, reason = 'out') {
    if (!agent.alive) return;
    agent.alive = false;
    agent.entry.finished = true;
    const left = this.zooks.filter(z => z.alive);
    if (left.length <= 1) {
      const w = left[0];
      this.finish({
        won: w ? w.isPlayer : false,
        winnerName: w ? w.name : '—',
        metric: `${this.t.toFixed(1)}s`,
        metricLabel: 'Time',
      });
    }
    return reason;
  }

  finish(result) {
    if (this.finished) return;
    this.finished = true;
    this.result = result;
  }

  /** Advance the contest; returns the result object once finished, else null. */
  tick(dt) {
    if (this.finished) return this.result;
    this.t += dt;
    for (const a of this.zooks) a.control = { ...NEUTRAL };
    for (const b of this.behaviours) {
      if (this.finished) break;
      if (typeof b.tick === 'function') b.tick(this, dt);
    }
    return this.finished ? this.result : null;
  }

  /** Control intent for a given race entry this frame. */
  controlFor(entry) {
    const a = this.zooks.find(z => z.entry === entry);
    if (!a || a.frozen || a.suspended || !a.alive) return NEUTRAL;
    return a.control;
  }
}

// ── Behaviour primitives ─────────────────────────────────────────────────────
// Each returns an object with a tick(contest, dt) method. They mutate the
// owner agent's `control` (steering) and may call contest.finish / eliminate.

/** Steer `owner` straight at a target every tick (the workhorse). */
export function Goto(owner, targetRef) {
  return { tick(c) {
    if (!owner.alive || owner.frozen || owner.suspended) return;
    const t = c.posOf(targetRef);
    owner.control = steerToward(owner.zook, t.x, t.z);
  } };
}

/** Chase whichever still-alive opponent is nearest (sumo, tag). */
export function ChaseNearest(owner) {
  return { tick(c) {
    if (!owner.alive || owner.frozen || owner.suspended) return;
    const p = owner.zook.position;
    let best = null, bestD = Infinity;
    for (const a of c.zooks) {
      if (a === owner || !a.alive) continue;
      const q = a.zook.position;
      const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best) owner.control = steerToward(owner.zook, best.zook.position.x, best.zook.position.z);
  } };
}

/**
 * Dribble a ball toward a goal: approach from the side opposite the goal so
 * contact pushes the ball goalward, then bulldoze straight through it.
 */
export function PushToward(owner, ballRef, goalPoint) {
  return { tick(c) {
    if (!owner.alive || owner.frozen || owner.suspended) return;
    const ball = c.posOf(ballRef);
    const gx = goalPoint.x, gz = goalPoint.z;
    let dx = ball.x - gx, dz = ball.z - gz;
    const L = Math.hypot(dx, dz) || 1;
    dx /= L; dz /= L;                     // unit vector from goal → ball
    const p = owner.zook.position;
    const behind = (p.x - ball.x) * dx + (p.z - ball.z) * dz; // >0 if on far side
    if (behind > 0.2) {
      // Not yet behind the ball: move to the staging point behind it.
      owner.control = steerToward(owner.zook, ball.x + dx * 1.6, ball.z + dz * 1.6);
    } else {
      // Lined up: drive through the ball toward the goal.
      owner.control = steerToward(owner.zook, gx, gz);
    }
  } };
}

/** Eliminate any zook that leaves a circular ring (radius) or falls (yFloor). */
export function RingOut(radius, yFloor = -0.5) {
  return { tick(c) {
    for (const a of c.zooks) {
      if (!a.alive) continue;
      const p = a.zook.position;
      const r = Math.hypot(p.x, p.z);
      if (r > radius || p.y < yFloor) c.eliminate(a, 'ringout');
    }
  } };
}

/**
 * Finish when a ball enters one of the goal zones. Each goal: { z, x, half,
 * winnerName, won }. Player scores in the opponent goal and vice-versa.
 */
export function GoalScored(ballRef, goals) {
  return { tick(c) {
    if (c.finished) return;
    const b = c.posOf(ballRef);
    for (const g of goals) {
      const inZ = g.z < 0 ? b.z <= g.z : b.z >= g.z;
      if (inZ && Math.abs(b.x - (g.x || 0)) <= g.half) {
        c.finish({ won: g.won, winnerName: g.winnerName, metric: '1 – 0', metricLabel: 'Score' });
        return;
      }
    }
  } };
}

/** Emit a finish after `seconds` (resolver decides the winner). */
export function Timer(seconds, resolve) {
  let fired = false;
  return { tick(c) {
    if (fired || c.finished) return;
    if (c.t >= seconds) { fired = true; resolve(c); }
  } };
}

// ── Contest assemblies ───────────────────────────────────────────────────────

/**
 * Zook Sumo — every zook charges the nearest rival; first to leave the ring
 * (or fall) is out; last one standing wins.
 * @param {Array} entries  race entries (entry.zook, entry.name, entry.isPlayer)
 * @param {number} radius  ring radius
 */
export function makeSumoContest(entries, radius = 3.0) {
  const c = new Contest();
  for (const e of entries) {
    const a = c.addZook(e);
    c.add(ChaseNearest(a));
  }
  c.add(RingOut(radius));
  // At time limit the zook nearest the centre (most stable) wins.
  c.onTimeout = (ct) => {
    const alive = ct.zooks.filter(z => z.alive);
    let best = null, bestD = Infinity;
    for (const a of alive) {
      const p = a.zook.position;
      const d = p.x * p.x + p.z * p.z;
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best) ct.finish({ won: best.isPlayer, winnerName: best.name, metric: `${ct.t.toFixed(1)}s`, metricLabel: 'Most stable' });
  };
  return c;
}

/**
 * Zook Football — a one-on-one (plus pack) scramble. The player drives the
 * ball toward the far goal; rivals drive it toward the near goal.
 * @param {Array} entries
 * @param {() => {x,y,z}} ballPos  live ball position provider
 * @param {{ farZ:number, nearZ:number, half:number }} field
 */
export function makeFootballContest(entries, ballPos, field) {
  const { farZ = -20, nearZ = 20, half = 2 } = field || {};
  const c = new Contest();
  c.addTarget('ball', ballPos);
  for (const e of entries) {
    const a = c.addZook(e);
    const goal = a.isPlayer ? { x: 0, z: farZ } : { x: 0, z: nearZ };
    c.add(PushToward(a, 'ball', goal));
  }
  c.add(GoalScored('ball', [
    { z: farZ,  x: 0, half, won: true,  winnerName: 'You' },
    { z: nearZ, x: 0, half, won: false, winnerName: 'Rivals' },
  ]));
  // At time limit, whoever has the ball nearest the opponent's goal wins.
  c.onTimeout = (ct) => {
    const b = ct.posOf('ball');
    const mid = (farZ + nearZ) / 2;
    const won = b.z < mid; // ball on the far (player's attacking) half
    ct.finish({ won, winnerName: won ? 'You' : 'Rivals', metric: `${b.z.toFixed(1)}m`, metricLabel: 'Ball position' });
  };
  return c;
}
