# 02 — Locomotion Engine (genome → physics → walking)

Source: `Agents/World/Evo/Evo.lua` (E), `BuilderParts.lua` (BP),
`PhysicsConstants.ssx`, `Targeter.lua`, `Target.lua`, `Env.lua`.

## 0. Scope boundary
The Lua is a **builder/expresser**, not the solver. The actual muscle force law
(PoweredCardanX/Y/Z), the per-tick neural-net evaluation, and the contact solver
live in the **native Karma/Neural C++** behind `Genome.Express`, `Neural.*`,
`Karma.*` — no Lua source. So that layer must be **re-implemented** (clean-room),
while everything below (topology, IK bake, steering maps, constants) is exact.

## 1. Body expression
- `MakeNeuralSystem` (E:519): `Genome.GetAsTable` → find root bodysolid →
  `UpdatePositions` (compute every node worldTrans) → `AddRootBits` (steering/master
  neurons) → `UpdateIK` (per-joint cardan + IK neurons) → `Genome.SetFromTable` →
  `Genome.Express(pos,rot,scale,boxy,texture)` (E:101) turns each bodysolid into ONE
  Karma rigid body (a "segment").
- Per-node transform (E:1231-1265), **row-vector convention `v * M`**:
  - root: `RotZ(roll)·RotX(pitch)·RotY(yaw)` at root position.
  - child: `localTrans = RotX(theta)·RotY(phi)`, translation `(posx,posy,posz)`;
    `worldTrans = RotZ(roll)·RotX(pitch)·RotY(yaw) · localTrans · parent.worldTrans`.
- Anchors (local +Z = length): `GetNodeConnect = (0,0,-scalez/2)·worldTrans` (joint),
  `GetNodeEnd = (0,0,+scalez/2)·worldTrans` (foot), centre = position (E:1141-1147).
- Mass = box volume × density(1); no per-part mass override in Lua.

## 2. Joints
- **rod_connector**: rigid weld, used ONLY to pin the creature to the world when
  `fixed` (E:106-108) or when a clicked segment is frozen — NOT between body parts.
- **cardanconnector**: the real inter-part joint. `UpdateIK` (E:1071-1088) forces a
  cardan on every non-root part (`if 1 then`), with **X and Y angle limits ±90°,
  no Z DOF** — a 2-DOF universal/Hooke joint. Frame = child connect end; X,Y axes =
  child local X,Y; Z = bone length axis. **This is the connection to port for the
  "limbs stay attached" fix.**

## 3. Muscle drive (engine-side — reconstruct as a clamped PD motor)
- Per-part genome `muscle_stiffness` / `muscle_damping` (default **1000**, 1–10000;
  BP:107-108) feed `Genome.Express` when it builds the powered cardan.
- Global gains (`PhysicsConstants.ssx`): `Cardan_Stiffness=1000`, `Cardan_Damping=100000`,
  `AngularApproachSpeed=4` (slew rate toward target angle).
- Reimplement each DOF (X then Y) as `torque ≈ K·(θ_target−θ) − C·θ̇`, clamped to ±90°,
  target slew-limited by AngularApproachSpeed. Exact PoweredCardan curve is native — tune.
- **Target angle each tick comes from the neural graph**: neurons write `x_rotation` /
  `y_rotation` as **angle/90** (normalised). `θ_target = 90°·(neural value)`.

## 4. Neuron primitives (build equivalents in JS)
- `accumulatorfunction_timer{timeinterval}` — phase clock, wraps 0..1; `IKspeed` for
  gait, `0.005` for MasterAmplitude.
- `accumulatorfunction_sum/_multiply` — sum/product of dendrites.
- `accumulatorfunction_target{angle_deviance=3.14, sensitivity=0.3184, type="X_Angle"}`
  — turns the brain target direction into a signed steering scalar (E:557-560).
- `transferfunction_map{wrap}` + `pair{x,y}` — wrapping piecewise-linear lookup; the
  core "play the foot-path animation" function.
- `transferfunction_scale{scale}`, `transferfunction_sine{phase,amplitude,frequency}`
  (spine wave, E:984-988). `dendrite{weight}`, `source_explicit`, `ancestor{source_body="Head"}`.

## 5. IK gait
### 5.1 Foot path
Stored per leg: leg_type 1 → `ik1_positions` (gait="gait_1"); leg_type 2 →
`ik2_positions`; list of `point{x,y,z}` (loop). Defaults: IK1 (BP:1696-1699)
`(0,0,2.37)(-0.53,0,2.31)(0,0.6,2.30)(0.56,0,2.30)`; IK2 (BP:1720-1723)
`(0,0,0)(0,0,0.5)(0,0.5,0)(0,0,-0.5)`.

### 5.2 IK1 — single link (E:905-961)
Points are leg-local, origin = `GetNodeConnect`. Mirror by side: `if phi<0 then x=-x`.
Aim the bone at each point: `r=√(x²+z²)`, **`xAngle=-atan2(x,z)`, `yAngle=atan2(y,r)`**.
Bake into phase→angle curves at `t=(i-1)/n`: `(t, xAngle/90)` etc. + reversed `(1-t,…)`.
`phase = leg_phase`.

### 5.3 IK2 — two link (E:751-853)
`upperLength=|connect(upper)-connect(lower)|`, `lowerLength=lower.scalez`,
`footOrigin=GetNodeEnd(lower)`, fixed `kneeDirection` (cross products). Per point:
analytic 2-link elbow solve `ElbowPosition2` (E:878-903), then upper joint angles =
direction to elbow, transform foot into lower frame, lower joint angles same formula.
Bake upper X/Y + lower X/Y (+reversed). `phase = lower.leg_phase`.

### 5.4 Cadence
`IKspeed = 0.03 · zook_speed` (E:548), default zook_speed 0.5 → 0.015/tick.
`MasterAmplitude` ramps gait 0→1 (timer 0.005, map 0→0,0.5→1) for smooth start/stop.
`leg_phase` (0–1) offsets each leg's clock.

## 6. Steering / turning (E:543-594, AddTargetMap, MakeIKControlNeurons, UpdateSpine)
- **Target neuron** turns the brain target direction into a signed scalar
  (`angle_deviance=3.14, sensitivity=0.3184`). Brain target fed each 0.1s via
  `Neural.SetHighLevelBrainTargetPosition(targPos)` (E:175-181), targPos from Targeter.
- `minAmplitude = 1 − turn_sharpness·2` (def 0.5); `minAngle = turn_smoothness` (def 0.5).
- Four maps `Left/RightForward`, `Left/RightReverse`: inside legs slow (gentle) or
  reverse (sharp, minAmplitude<0) to pivot toward target. Each axis output =
  `forwardCurve·sideForward + reverseCurve·sideReverse`, gated by MasterAmplitude.
- `ik_side` `GetNodeSide` (E:644-666): explicit Left/Right; **Auto**: end-point in
  root space, `x<-0.01→Left, x>0.001→Right, else Always`; **Always** = ignore steering,
  always forward.
- `spine` (E:963-1048): Normal adds SpineSteering to x_rotation weight +1; Inverted −1;
  Off none. `spine_amplitude>0` adds a travelling sine body wave (fish/snake).
  `SpineSteering` deadband ramp from `max_spine_angle/90` and `min_spine_target_angle`.

## 7. Tick loop & world
- Fixed physics tick ≤ `max_tick_size = 0.02` (50 Hz). Order: neural eval (advance
  timers, propagate, write x/y_rotation) → powered-cardan PD torque → Karma step →
  contacts/friction. Agent timers (0.1s) feed brain target + bookkeeping.
- `Karma.SetAgentCollidabilityOff()` (E:127): a creature's own parts don't self-collide;
  parts still hit the ground. Ground = static Karma body (Env). Creature friction =
  Karma defaults (Friction/Restitution/Slip Config keys commented out in PhysicsConstants).
  Gravity via `Karma.SetGravity`; builder slider 0–400. World scale: Studio 0.04, real-cm = sim×4.
- Start/stop = ramp MasterAmplitude time params; `Neural.SetActive(false)` after stop.
- No explicit balance controller — stability emerges from gait + ±90° limits + slew 4.

## 8. Constants
Cardan_Stiffness 1000 · Cardan_Damping 100000 · AngularApproachSpeed 4 ·
contest_unit_scale 40 · max_tick_size 0.02 · muscle_stiffness/damping def 1000 ·
zook_speed 0.5 · turn_sharpness 0.25 · turn_smoothness 0.5 · max_spine_angle 45/30 ·
min_spine_target_angle 180 · IKspeed 0.03·zook_speed · density 1 · cardan limits ±90° ·
Targeter MaxSpeed 1.0, update 0.1s · genome password "macaca mulatta".
