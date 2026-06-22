# BAMZOOKi "Zook Kit" — reverse-engineering notes

Findings from the original `Bonsai.exe` (Bonsai Engine, build 158, 4 May 2006),
its `Scripts/` and `Agents/` trees, the plaintext `.contest` files, and the
manual. This is the authoritative reference for making FriedZooki faithful.

## Engine stack

| Layer | What it is | Evidence (embedded source paths / symbols) |
|---|---|---|
| **Atmosphere** | World container | `Atmosphere\Bonsai\BonsaiWorld.cpp` |
| **Core/KarmaSimulator** | Physics — **MathEngine Karma** | `KarmaSimulator.cpp`, `Body.cpp`, `Geometry.cpp`, `Polysoup.cpp`, `Mdt*`/`Mcd*` symbols (`McdBox`, `McdCylinder`, `McdConvexMesh`, `MdtBody`, `GetGravity`, `FrictionCoefficient`, `LinearVelocityDamping`) |
| **Core/RWVisual** | Rendering — **RenderWare** (DirectX) | `DxRenderer.cpp`, `DXShadowMap.cpp`, `RWVisual.cpp`, `.dff` models |
| **Core/VM** | Scripting — **Lua 4.0** | `VM\LuaMemoryPatch.cpp`, `PublicVM.h`, "Lua 4.0", `DecryptScript`, Lua-table errors ("non-string key") |
| **Crust** | App governor + TV broadcast layer | `Governor.cpp`, `VisualBroadcast.cpp` |
| **Mantle** | Game logic: genome, components, agents | `Genome\*`, `Components\*`, `ContainerAgent\*` |

## The Zook is a **genome** → **Karma creature** (morphogenesis)

- A Zook is a **Lua table genome** (`GenomeComponent.cpp`, `GenomeLoader`,
  "Error in genome table (non-string key)"). `.zook` files are RSA-**signed**
  (Crypto++ `InvertibleRSAFunction`, `SignatureVerificationFilter`) — that's the
  only thing Crypto++ is used for; there is **no symmetric cipher** in the binary.
- `CreatureMorphogenesis.cpp` builds the body from the genome; there is also
  `NeuralMorphogenesis.cpp`, `GenomeModifier.cpp`, `MutationClassifier.cpp` and an
  **`Evo`** world agent — i.e. the engine can **mutate / evolve** Zooks.
- Parts are connected by Karma joints: **rod connectors**, **sockets**,
  **hinge** (with *limits* + *motor*), **prismatic** (with *limits*), and
  **fixed-path** parts. Geometry primitives: Box, Cylinder, ConvexMesh, Polysoup,
  HeightField.
- Builder part transforms (`Agents/World/BuilderParts/*.dff`): **Scale**,
  **Twist**, **ScaleTwist** — how a part is deformed (squished/twisted).

## Locomotion — the real model: **Transfer-Function-Powered Cardan joints**

This is the key discovery. Limbs are driven by composable **transfer functions**
feeding **powered universal (Cardan) joints**. Symbols found:

- Joints: `TransferFunctionPoweredCardanX/Y/Z`, `TransferFunctionPoweredHinge`,
  `Cardan`, with `Cardan_Stiffness` / `Cardan_Damping` (the muscle PD gains), plus
  `muscle_stiffness` / `muscle_damping`. Source: `TransferFunctionPoweredCardan.cpp`.
- Transfer-function primitives (compose the muscle control signal):
  **Sine, Spike, Velocity, MaxVel, Scale, Offset, Map, Invert, Latch, Bound**.

So a leg's movement is an oscillator graph, e.g.
`Sine(phase = MovementCycle, freq = CycleSpeed) → Map(IK path shape) → Scale/Offset → PoweredCardan(stiffness, damping)`.
That maps directly onto the Zook Kit UI:

| Zook Kit control | Transfer-function meaning |
|---|---|
| Cycle Speed | Sine frequency |
| Movement Cycle (0–1) | Sine phase offset |
| Foot **IK path** (the points) | a `Map` transfer function shaping the waveform |
| Single vs Two-part movement | drives one joint vs an IK'd 2-bone (hinge) chain |
| Movement Type (Auto/Always/L/R) | scales the drive on the inside legs when turning |
| Part Targeting (Normal/Inverted/Off) + Angle | extra offset toward/away from the target |
| Turn Sharpness / Smoothness | how hard / how fast the inside-leg scale is applied |

FriedZooki approximates the *output* (genuine foot–ground contact) rather than
simulating every powered Cardan, but the controls are mapped 1:1 so a build tunes
the same knobs.

## From the manual (v3.1) and the BAMZOOKi research paper

The original **Zook-kit manual v3.1** (BBC) and the academic paper *"CBBC BAMZOOKi
as a Tool for Engineering Design Research"* (Rea, Hawley, Corney, Ritchie, Sung,
Salamon — Heriot-Watt / Drexel / Strathclyde) are the authority for the *builder*
and the *contest targets*. Concrete facts used by FriedZooki:

- **Root-part shape panel = seven sliders** (manual Ch3): Width, Height, Length,
  **Pointiness**, **Flatten End**, **Flatten Side**, Squareness. All seven are now
  exposed in the workshop SHAPE deck (`flatEnd`/`flatSide` feed `shapeBody`).
- **Movement menu** (manual Ch10–13): Movement Mode = *No movement / Single part /
  Two part*; Movement Type (turn behaviour); **Movement Cycle** (a leg pair wants
  one leg at 0 and its mirror at 0.5); Part Targeting (toward/away) + Angle.
- **Build is modelling-clay** (manual Ch6, paper Fig.2): every part is a squished
  "blob"; legs are a blob stretched long with a second blob added at the end.
- **Builder attribute schema** (decompiled `BuilderParts.lua`, `myAttributeGroups`)
  — the exact panes/sliders the Zook Kit shows, now mirrored in the workshop:
  - *Shape*: Width/Height/Length (`scale x/y/z`, 0.1–3), **Pointiness** (`bias`),
    **Flatten End** (`flatness`), **Flatten Side** (`asymmetry`), **Squareness**
    (`cubosity`) — all 0–1.
  - *Part `mesh` enum* `{ Blob, Cube, Sphere }` + *Position* pane **Twist** (`roll`):
    clay parts can now be a **Blob, Box or Ball** and be **twisted**.
  - *Movable clay parts* (`leg_type` = Single part): any sculpted part can be given
    **Movement** (Cycle, Muscle, Turn side, foot Path) — it hangs from a pivot at its
    anchor, sweeps along the path and grips the floor through the **same foot-contact
    model as legs**, so a limb you sculpt long & low actually walks. (Static parts —
    the default — are unchanged, so existing Zooks are unaffected.)
  - *Joint*: Movement Type `{No / Single / Two part}` (`leg_type`), turn side `{Auto,
    Left, Right, Always}` (`ik_side`), **Movement Cycle** 0–1 (`leg_phase`), Part
    Targeting `{Normal, Inverted, Off}` (`spine`).
  - *Master IK*: **Cycle Speed** (`zook_speed`), **Turn Sharpness**, **Turning
    Smoothness**, **Part Targeting Angle** (`max_spine_angle`, 0–90°).
  - per-part `muscle_stiffness` / `muscle_damping` (the Karma PD muscle gains).
- **Trial performance targets** (paper Table 3, "Gold Performance Parameters"):
  | Level | Sprint | Block Push | Hurdles |
  |---|---|---|---|
  | Apprentice | 75 cm/s | 30 cm | — |
  | Master | 75 cm/s | 30 cm | 30 cm |
  | Wizard | 100 cm/s | 50 cm | 35 cm |
  Wizard size/weight limits: Height 15 cm, Width 40 cm, Length 35 cm, Weight 2 kg,
  **25 components**. (Our units are ~10× life size, so these map to *feel* — the
  trial medals are tuned to FriedZooki's scale, not 1:1 cm.)
- **Fix-it table** (paper Table 2, "Possible Zook Problems and Solutions") — drives
  the workshop coach (`Builder._diagnose`): *walks not runs → ↑gait cycle speed;
  small steps → ↑stride / ↑leg length / ↑leg pushing power; limps/unstable → adjust
  leg phase within the gait cycle; falls over → ↑width; can't clear hurdles →
  change gait for more step height / ground clearance.*

## Contest system (Lua "behaviours" + "agents")

`.contest` files are **Lua tables**: a list of `behaviours` (event-driven rules)
attached to `agents` (objects in the scene). The full behaviour library
(`Scripts/Behaviours/*.ssx`):

`Finish, Follow, Goto, MonitorDistance, PositionBehind, ListenContact, NoContact,
TotalNoContact, Timer, PenaltyTimer, RandomMove, RandomMoveNoScore, Freeze,
Unfreeze, Suspend, Resume, StartMoving, StopMoving, HeightCounter,
TotalHeightCounter, Winner, Loser`.

- **Follow** → an agent chases a target (the Zook's AI seek).
- **Goto** → move to a fixed point. **MonitorDistance** → trigger at a distance.
- **PositionBehind** → line a Zook up behind a start mark.
- **ListenContact / NoContact / TotalNoContact** → contact scoring (smash vs
  keep-clean, e.g. China Shop). **HeightCounter / TotalHeightCounter** → High Jump.
- **Timer / PenaltyTimer** → contest clocks. **Finish / Winner / Loser** → results.
- **Freeze/Unfreeze, Suspend/Resume, Start/StopMoving** → countdown gating.

World **agents** (the real environments + props):
- Race/league: **SprintEnv, HurdleEnv/Hurdles, BlockPush/RamEnv, HighJump, Lap**,
  **StepEnv, SlopeEnv, ZigZagEnv, SloppyEnv, ShiftEnv, StrongEnv** (assault course).
- Table contests: **PoloTable, TableSumo, TableRect** (Sumo / Merry-Go).
- Props: **FixedSplitCube** (smash blocks), **PushyThing** (tug tether),
  **RevolvingDoor / SwingDoor** (Dodgy), **Turntable** (Merry-Go), **Target /
  ClickableTarget / Targeter** (the floor target the Zook seeks).

### Per-contest summary (from the Contest Pack `.contest` files)
- **Super Hurdles** – race over hurdles; PoloTable + FixedSplitCubes; Follow → Finish on contact with line.
- **Dodgy Zook** – race dodging sliding doors (12× ListenContact/Goto pairs).
- **Marbles / Smash** – race; Follow + ListenContact → Finish (barge through props).
- **Sumo** – `TableSumo` disc, ring **radius 21.25**, `MonitorDistance 21`,
  `PositionBehind ~7.2–7.9`; Suspend/Resume for the countdown; off-edge = lose.
- **Weakest Zook** – tug-of-war: central pit, `ZookPlaceHolder` at ±19, `PushyThing`
  tether, two `Follow`s pulling opposite ways → Finish when one is dragged in.
- **China Shop** – `Timer 25s` (+5s lead-in), 286 `Target` cups, `TotalNoContact`
  scoring; green keeps clean / red smashes (mirror contests).
- **Tag** – `Timer 45s`, `RandomMove` runner, Follow chaser → Finish on contact.
- **Merry-Go-Zook** – spinning `Turntable`; `NoContact` + Follow; last one on wins.
- **Zookball** – football; Freeze/Unfreeze + Winner/Loser + Follow on the ball.

## `.ssx` decryption — **SOLVED** (all 41 scripts decrypted)

The `.ssx` are **RSA-512, RSAES-OAEP (SHA-1 / MGF1) per 64-byte block → the
concatenated payloads form a zlib stream → inflate to Lua source**. The catch:
**the RSA *private* key ships in the clear** as `he.skx` (342-byte PKCS#8 DER,
e=17). The runtime decryptor is the VM verb `Bin.DecryptScript`. All 41 scripts
decrypt cleanly; copies live in `reference/decompiled/` (with `_decryptor.py`).

Bonus: `.zook` genome files use a separate **password** scheme — the password is
literally `"macaca mulatta"` (`genome_rhesus_macaque`, `genome_current_version=2`).

### `.zook` creature archive format (identified; not statically decryptable)
Layout: a 64-byte plaintext header `"Bonsai Engine - Archived information file. Version: 000000001. \n"`,
a name line, a 5-byte marker `00 01 00 00 00`, then the payload (length always
a multiple of 8): `salt(8) | keyCheck/first-block(8) | ciphertext`. The cipher
stack, confirmed from the disassembly, is Crypto++'s **"Default" scheme with the
block cipher swapped to Blowfish**: **Blowfish-CBC** (8-byte block, 16-byte key),
key/IV derived by the Crypto++ **`Mash`** KDF over **SHA-1** from
`passphrase("macaca mulatta") ‖ salt`, output **zlib-inflated** to a Lua-table
genome (same syntax as `.contest`). Key VAs: Blowfish π-tables `0x93a840`/`0x93a888`,
`Blowfish::UncheckedSetKey` `0x631020`, round fn `0x631200`, SHA-1 transform
`0x63e860`, `GenerateKeyAndIV` `0x6219a0`, decrypt pipeline `0x5f9510`.
Working pure-Python Blowfish/DES/SHA-1 + a `Mash` KDF were built, but an exact-KDF
detail (inlined MSVC6 + Crypto++ templates) couldn't be pinned by static analysis;
finishing needs a debugger breakpoint on `0x631020` of the running exe to capture
the live key/IV. Our example roster is therefore **recreated from the manual's
canonical descriptions** (Spider = two-part legs, Wormthing = Part-Targeting
spine, etc.) rather than byte-exact genomes.

## Real physics constants (from decrypted `PhysicsConstants.ssx` + disassembly)

The engine reads constants via `Config.Get(name, default)`. Script values that are
**active** in `PhysicsConstants.ssx`, plus the hard-coded engine defaults pulled
from the disassembly (IEEE-754 decoded):

| Constant | Value | Source |
|---|---|---|
| `gravity` | **(0, −150, 0)** | engine default (disasm @0x401e5f) |
| `contest_unit_scale` | **40** | script (40 engine units = 1 contest unit) |
| `max_tick_size` | **0.02** (50 Hz; playback 0.0625/16 Hz) | script |
| `Cardan_Stiffness` | **1000** | script |
| `Cardan_Damping` | **100000** | script (joints are *heavily* damped: 100:1) |
| `AngularApproachSpeed` | **4** | script |
| `Friction` | 200 · `FrictionCoefficient` 0.5 | engine default |
| `Restitution` | **0.3** | engine default |
| `PrimarySlip`/`SecondarySlip`/`Softness`/`MaxAdhesiveForce` | 0 | engine default |
| `Skeletal_SoftLimit{Swing,Twist,Radial}{Stiffness,Damping}` | 1.0 | engine default |
| joint angle limits | **±57.3° (≈ ±1 rad)** | engine default |
| `muscle_stiffness` / `muscle_damping` | per-Zook (genome) | unlimited unless set |
| `auto_set_inertial_tensor` | 1 | boot |

Key takeaways for fidelity: gravity is *strong* relative to creature size, joints
are **heavily damped** (smooth, not springy — damping 100× stiffness), bodies have
a mild **0.3 restitution**, the sim runs at **50 Hz**, and limb joints are limited
to about **±1 radian**. FriedZooki approximates the *output* (foot–ground contact)
rather than every powered Cardan, so these map to feel rather than 1:1 numbers.
