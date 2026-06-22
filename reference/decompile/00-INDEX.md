# BAMZOOKi — Full Application Decompile & Rebuild Plan

This folder is the complete reverse-engineering of the original BAMZOOKi application
(`Bonsai.exe` + ~20,000 lines of Lua across 76 agents + ~40 config/behaviour scripts),
written so the app can be **rebuilt from scratch** as a web/JS reimplementation.

## What can and cannot be ported
- The native engine (`Bonsai.exe`) is compiled C++ on **DirectX** + the **Karma**
  physics middleware. It cannot be transpiled or statically recompiled to JS (those
  techniques only work for self-contained console ROMs). The correct, standard method
  for a game like this is **clean-room reimplementation** from the decompiled logic —
  which is what every doc here enables.
- Fully recovered (exact): genome format & decryption, the part/connection geometry,
  the IK gait bake, steering maps, contest rules & scoring, environments, camera, UI
  flow, and every numeric constant.
- Must be re-implemented (native, not in Lua): the Karma rigid-body/contact solver and
  the PoweredCardan muscle force law + neural-net evaluation — reproduced as a clamped
  PD-driven 2-DOF cardan motor + an equivalent neuron graph (see 02).

## Documents
- **01-part-and-genome-model.md** — the `bodysolid` tree, connection geometry
  (`UpdatePositions`), all part attributes/defaults, and the Zook Kit builder UI
  (Edit/Add/Test, shape/motion/colour tabs, mirror groups, IK foot-path editing).
- **02-locomotion-engine.md** — genome→Karma bodies, the 2-DOF cardan joints (±90°),
  muscle PD model, IK1/IK2 gait solve, steering/turning, the tick loop, constants.
- **03-contests-and-scoring.md** — Simulator lifecycle, the contest→arena→behaviour
  map, the `Behaviours/*.ssx` scoring state machines, split-screen, trials vs contests.
- **04-world-and-targeting.md** — ground/heightfield, all environments, the
  ClickableTarget→Targeter→brain steering chain, camera system, FloorManager.
- **05-app-architecture-and-ui.md** — the three boot modes (Zook Kit / Simulator /
  Motion Player), the agent framework, the UI widget toolkit, selector/file flow.

## Core architecture (one-paragraph map)
The program boots (via `Boot/*.ssx`) into one of three modes. Everything is an **agent**
(Governor = UI/orchestration, World = simulated objects) communicating by messages. A
**Zook** is a genome tree of `bodysolid` parts; `Genome.Express` turns it into Karma
rigid bodies joined by **2-DOF cardan** joints, driven by a **neural graph** that bakes
each leg's **IK foot-path** into joint-angle curves and biases them by a **target
steering** signal — locomotion is emergent. The **Simulator** loads two Zooks into an
**environment**, runs a 0.1s master clock with a 3-2-1 pre-roll, and scores via
**behaviour state machines** until a `Winner`/`Loser`/`Finish` event ends it.

## Rebuild plan (the order we'll build, once all 5 docs land)
1. **Part/genome model (unified):** one part type. A "leg" is a blob with `leg_type`
   1/2 — **no separate leg objects, no "attach a leg"**. Build the `bodysolid` tree
   with the exact `UpdatePositions` connection (proximal end seated on the parent
   surface along the theta/phi ray). This is what guarantees limbs stay attached.
2. **Articulated engine:** each part = one rigid body; parent join = a **2-DOF cardan**
   (X/Y, ±90°) at the part's proximal end; muscle = clamped PD (stiffness/damping from
   the genome + the global Cardan constants). Verify a part chain holds together with
   zero gaps before adding motion.
3. **IK gait + steering:** port the IK1/IK2 bake and the side-based steering maps so
   the Zook walks toward the ClickableTarget — emergent, not scripted.
4. **Builder (Zook Kit):** Edit/Add/Test + shape/motion/colour tabs, the superquadric
   Blob, the colour wheel, mirror groups, drag-handle connection — **legs created as
   blobs you give movement to**, touch-first.
5. **Simulator/Contests + trials**, then the tilt-controlled Run.

Everything above is reimplemented from the cited Lua — no guesses where the source is
explicit; clearly-flagged reconstruction only for the native solver layer.
