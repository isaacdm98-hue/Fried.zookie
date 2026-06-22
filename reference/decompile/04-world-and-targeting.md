# BAMZOOKi — World, Arena, Environments, Targeting & Camera

Read-only reverse-engineering of the decompiled Lua. All paths are relative to
`/home/user/Fried.zookie/reference/decompiled/`. Line citations are `file:line`.

This document covers everything needed to rebuild from scratch:

1. The world coordinate/scale model and key constants.
2. How a ground / arena is built (the procedural checkerboard floor, the
   PGM heightfield table, the invisible walls/floor).
3. Every `*Env` variant and the obstacle/terrain it adds.
4. The `Target` physics-object system (Studio editor objects).
5. The walk-target system: `ClickableTarget` → `Targeter` → `Neural.SetHighLevelBrainTargetPosition`.
6. The camera system: free/fly camera, follow `SplitCamera`, split-screen governor, framing.
7. The `FloorManager` "drop the floor away" effect.

---

## 0. Agent / engine model (context)

The engine is "Bonsai": a Lua VM ("munki" dialect — note `for k,v in t` without
`pairs`, `getn`, `%upvalue` closures, `#` comment headers). Each agent is a Lua
script. The first line `# X specializes Y embeds Z` declares inheritance and
which native modules (`Visual`, `Karma`, `Input`, `Neural`, `GUI`, `Camera`,
`Genome`, `Sound`) the agent links against.

Native subsystems used heavily by the world:

- `Karma.*` — the physics engine (MathEngine Karma). Bodies, geometries,
  heightfields, constraints, gravity, contacts.
- `Visual.*` — the renderer. Meshes, primitives (0=sphere,1=cube), lights,
  textures, shadows, emitters (particles).
- `Config.Get/Set(key, default)` — a global key/value blackboard used to pass
  singletons around (`theLand`, `theCamera`, `BuilderTarget`, `worldscale`, …).
- `Agent.Create / SendMessage / PostMessage / SetTimer` — agent lifecycle and
  messaging. `MessageFoo` handles message `"Foo"`; `SystemFoo` handles engine
  callbacks; `TimerFoo` handles named timers.
- `World.GetFlags()` returns `3` when the world has physics; otherwise the
  world is visual-only (e.g. preview/Studio thumbnails). Several agents branch
  on `if World.GetFlags() == 3 then` (e.g. `Target.lua:24`, `TableRect.lua:23`).

---

## 1. World scale, offsets and key constants

### worldscale = 0.04 (StudioSettings.ssx)
`StudioSettings.ssx:15` sets `local worldScale = 0.04` and
`Config.Set("worldscale", worldScale)` (`:16`). The comment at `:13-14`
explains: the real-world TV-broadcast camera and the simulation can run at
different scales; `worldscale` converts authored ("real world", metric-ish)
dimensions into simulation units.

Every spec-driven world object multiplies authored `position` and `scale` by
`worldscale` on construction. The pattern is identical in:

- `Target.lua:13-15`:
  ```lua
  local worldScale = Config.Get("worldscale",1)
  spec.position = spec.position * worldScale
  spec.scale = spec.scale * worldScale
  ```
- `TableRect.lua:13-15`, `Evo.lua:19-21`, `PushyThing`, `RevolvingDoor`,
  `SwingDoor`, `Turntable`, `FixedSplitCube`, `ZookPlaceHolder`, `TableSumo`.

Note `worldscale` defaults to `1` everywhere via `Config.Get("worldscale",1)`,
so if `StudioSettings` is not loaded (e.g. the in-Builder editor) objects are
authored 1:1. `ContestFilePlayer.ssx:10` also sets a default
`Config.Set("worldscale", 1)` "to be overwritten in studio settings".

The example default `TableRect` spec sizes are authored in the inverse:
`scale = Vector.New(4.5/0.04, 1/0.04, 1.8/0.04)` (`TableRect.lua:174`) i.e. a
4.5 m × 1 m × 1.8 m table expressed in 1/0.04 = ×25 "studio units" so that, after
multiplying by worldscale 0.04, it becomes 4.5×1×1.8 sim metres.

### worldOffset (StudioSettings.ssx:18-26)
A `table_offset = Vector.New(x_off,y_off,z_off)` (default 0,0,0) stored as
`Config.Set("worldOffset", table_offset)`. Used to shift the whole arena.

### Physics constants (PhysicsConstants.ssx)
- `Cardan_Stiffness = 1000`, `Cardan_Damping = 100000` (`:5-6`) — joint stiffness
  for the cardan (universal) joints used in Zook limbs.
- `AngularApproachSpeed = 4` (`:10`).
- `contest_unit_scale = 40` (`:11`) — the conversion from sim units to display
  centimetres. Used by trial scoring, e.g. `SprintEnv.lua:90` reports
  `(50*4)/result` cm/sec (50 m course × 4 ... see §3.10).
- `max_tick_size = 0.02` (`:12`) — maximum physics timestep (50 Hz minimum).
- Gravity is **not** set here. Many `Restitution`/`Friction`/`Damping` lines are
  commented out, so the engine defaults apply except where overridden per-body.

### Gravity (Builder + BuilderParts)
Gravity is a world property set through Karma, not a per-frame force:

- `BuilderParts.lua:958-960`:
  ```lua
  function MessageSetGravity(gravity)
      Karma.SetGravity( Vector.New( 0, -gravity, 0 ) )
  end
  ```
- `BuilderParts.lua:962-965` `MessageGravity` returns `-Vector.GetY(Karma.GetGravity())`.
- In the Builder, gravity is a slider: `myGravityMin = 0`, `myGravityMax = 400`
  (`Builder.lua:79-80`); the slider maps `0..1` to `0..400`
  (`Builder.lua:824-827`). So the editor gravity range is 0–400 (sim units),
  default whatever Karma initializes to.

### MemoryConfiguration.ssx (pool sizing — context only)
Pre-allocates VM pools: GC tuned via `System.SetGC(30, 20, 6000)` (`:15-18`);
`SetGovernorAgentPoolSize(10)` + `SetWorldAgentPoolSize(50)` (`:23`); message
stack 50 (`:29`); function/string pools scaled by agent count; per-active-agent
Vector/Quatn/Spot/Matrix pools of 25 each, Attributes 5 (`:61-65`). Relevant for
a rebuild only in that the world is expected to hold ≲50 simultaneous world
agents.

### ProductConfiguration.ssx (filesystem — context only)
Sets product directories under the user's home/AppData; copies `NewTeam`,
`Contests`, `Videos` on first run. `studio_mode` selects in-house dev layout
(`product_directory = "."`). Not relevant to physics/render but defines where
`*.zook` genomes, contests and textures live.

---

## 2. Building the ground / arena

There are two distinct ground implementations:

### 2.1 `Env.lua` — procedural checkerboard floor (the Builder/training floor)

`Env` is the base class for all `*Env` arenas
(`# Env specializes Agent embeds Visual, Karma, Input`).

`Initialize(pos, fx, fz, rot)` (`Env.lua:3`):

1. Registers itself as the world ground: `Config.Set("theLand", Agent.Me())`
   (`Env.lua:5`). `theLand` is later queried by `Evo` to find the ground height
   under a spawn point (see §5).
2. Stores `position`, `rotation`, `floorSizeX = fx`, `floorSizeZ = fz`
   (`:11-14`). The Builder passes `floorSizeX = floorSizeZ = 130`
   (`Builder.lua:27-28`, `:110`).
3. **Builds a two-colour checkerboard mesh procedurally** (`:17-73`):
   - Iterates a grid `i = -sizeX/2 .. sizeX/2`, `j = -sizeZ/2 .. sizeZ/2`.
   - Each vertex: `Vector.New(i,0,j)`, normal `(0,1,0)`, tangent `(1,0,0)`,
     texture coords `i/32, j/32`.
   - Two triangle index lists (`indices1`, `indices2`) are filled by parity:
     `if Number.mod(i+j+sizeX+sizeZ, 2) > 0.5` → list1 else list2. This produces
     the alternating checkerboard squares (each square = 2 triangles).
   - `Visual.Create("land1", mesh, position, rotation, (1,1,1), 1)` then
     `Visual.SetColour(Segment.land1, floortile1_r/g/b default 0.9)` (`:67-68`).
   - `Visual.Create("land2", …)` with `indices2`, colour `floortile2_*` default
     0.99 (`:70-72`). Two visuals, one mesh, two index sets = the checker.
4. **Creates the physics ground** as a single Karma body:
   `Karma.CreateBody("moreland", 2, false, position, Quatn.New((1,0,0), -90), (1,1,1))`
   (`Env.lua:80`). Shape id `2` is a plane (rotated −90° about X so the plane's
   normal points up). `false` = immovable/static. This is the infinite/large
   collision floor that the checkerboard mesh visually sits on.
5. `myMagicFootSpeed = 2.0` (`:82`) — a foot-IK speed hint (see Zook docs).
6. `myFixedBlocks / myFreeBlocks / myFreeSpheres = 0` (`:84-86`) — counters for
   obstacles added later by subclasses.

**Heightfield override** — `Env` can replace the flat floor with a PGM
heightfield via `MessageUseHeightfield(pgm_name, pgm_x_size, pgm_z_size,
texture_name, max_height, x_scale, z_scale)` (`:99-117`):
- Destroys `moreland`, `land1`, `land2` (`:100-111`).
- `Karma.LoadPGMHeightField("hf", pgm_name..".pgm", origin, max_height,
  x_scale, z_scale, texture, 1/(x_size*x_scale), 1/(z_size*z_scale))`
  (`:115`). Origin is `(0,-10,0)` shifted by half the field so it is centred.
  The two trailing args are texture U/V scaling.

**Ground height query** — `MessageHeight(vec)` (`Env.lua:89-96`): if a heightfield
`Segment.hf` exists, returns `Karma.HeightGetHeight(Segment.hf, vec)`; else
returns the input X/Z at the env's Y. This is what `Evo` calls to place a Zook
on the ground.

**Lights** — `MessageStandardLights()` (`:120-149`) creates: 1 soft-spot
(`LIGHT_SOFTSPOT`, radius 50, cone 35°, looking down from y=20, intensity
`light_spt1` def 0.4), 1 ambient (`light_amb1` def 0.4), 2 directionals
(`light_dir1/2` def 0.3) aimed from `(10,0,20)` and `(-20,0,-15)`. Every `*Env`
calls this first thing in `Initialize`.

**Obstacle helpers** (used by the terrain envs):
- `MessageFixedBlock(pos, size, orient, r,g,b)` (`:152-158`): static obstacle.
  Builds a `CreateCompositeCube(name, false, …)` body (splitting large cubes
  into ≤4-unit sub-cubes — see below) plus a matching visual cube.
- `MessageFreeBlock(pos, size, orient, r,g,b)` (`:159-165`): dynamic
  (movable=1) Karma cube body + visual.
- `MessageFreeSphere(pos, size, r,g,b)` (`:202-207`): dynamic sphere body + visual.
- `CreateCompositeCube(name, movable, pos, rot, scale)` (`:168-199`): splits any
  cube whose dimension exceeds `maxSize = 4` into an `nX×nY×nZ` grid of sub-cube
  geometries, then assembles them into one aggregate body. This works around the
  physics engine preferring small box geometries.

**Show / hide** — `MessageShow(visible)` (`:210-241`) toggles `land1/land2`, all
fixed/free blocks and spheres, and (for chroma-key TV use) recolours a textured
heightfield to a bluescreen colour when not textured.

### 2.2 `TableRect.lua` — the contest TABLE (PGM heightfield)

`TableRect` (`# TableRect specializes Agent embeds Visual, Karma, Input`) is the
real BAMZOOKi *table* used in contests, as opposed to the flat Builder floor. It
is spec-driven and editable in the Studio.

`Initialize(s)` (`TableRect.lua:3`):
- Scales `spec.position`/`spec.scale` by worldscale (`:13-15`).
- `magicFloorOffset = Vector.New(0,30,0)` (`:18`) — the table is modelled raised
  30 units; the visible floor sits below.
- `Config.Set("theLand", Agent.Me())` (`:20`) — becomes the ground for height
  queries, same role as `Env`.
- If physics (`World.GetFlags()==3`, `:23`):
  - Loads the table heightfield image `"kw-table.pgm"` (`:31`).
    `hf_x = 18`, `hf_z = 13` (`:32-33`) — the PGM pixel dimensions. The comment
    notes the *usable* tabletop is `hf_x-3` × `hf_z-3` (the −3 accounts for the
    raised table sides/lip baked into the greyscale image).
  - Computes per-pixel scale: `table_x_scale = scalex/(hf_x-3)`,
    `table_z_scale = scalez/(hf_z-3)` (`:36-37`) so the authored table footprint
    maps onto the usable region.
  - `Karma.LoadPGMHeightField("hf", "kw-table.pgm",
    (pos - magicFloorOffset) + centring offset, 60, table_x_scale,
    table_z_scale, "Agents/World/Target/Plaster", U-scale, V-scale)` (`:41`).
    `max_height = 60`.
  - **Invisible back wall**: `Karma.CreateBody("invisible_wall", 2, false,
    pos + (0,0,-0.7*scalez), Quatn(...), (1,1,1))` (`:45`) — a static plane
    behind the table so Zooks driven toward `z = -52/-60/-80` are stopped /
    contained. (`floorHeight = -1` metre noted at `:43`, the commented-out
    "floor" body.)
- Else (visual-only / preview, `:46-79` `CreateVisualOnly`): draws a cube for the
  table top (`hf` visual), and a translucent `invisible_wall` visual
  (alpha `invisible_alpha` def 0.25, `:76`).

`MessageHeight(vec)` (`:81-86`): `Karma.HeightGetHeight(Segment.hf, vec)` — the
authoritative ground-height sampler for the table.

`MessageStandardLights()` (`:90-119`): five lights (soft-spot, ambient,
2 directional, 1 weak under-light), hard-coded intensities (the `Env` version
reads them from Config).

`MessageShow(visible)` (`:123-138`): for chroma-key, when hidden recolours the
heightfield to the bluescreen colour with alpha 0.01; when shown, white.

Editor support: `MessageSpec`, `MessageBoundingSphere`,
`MessageSetProperty/GetProperty`, and `MessageParamaters` (`:144-190`) which
exposes x/y/z size sliders (default `4.5/0.04, 1/0.04, 1.8/0.04`, min 1 max 200)
and position to the Contest Studio.

### Summary: floor recipe to rebuild
- **Builder/training floor**: procedural 130×130 two-colour checkerboard mesh +
  a single static plane body (shape 2) rotated so its normal is up. No
  heightfield. `theLand` = the `BoxEnv`/`Env`.
- **Contest table**: a static heightfield body loaded from `kw-table.pgm`
  (18×13 px, max height 60, usable 15×10 px), plus an invisible back-wall plane.
  `theLand` = the `TableRect`.

---

## 3. Environment variants (`*Env` and friends)

All `*Env` agents are `specializes Env`, so they inherit the checkerboard floor +
plane from §2.1. Each `Initialize(offset_of_world, floorSizeX, floorSizeZ,
rotation)` calls `MessageStandardLights()` first, builds its obstacles, then
(usually) repositions the walk-target with
`Agent.SendMessage("MoveTo", Config.Get("BuilderTarget",…), <vector>)` so the
Zook walks into the obstacle course. Most `MessageShow` delegates to
`MessageEnv__Show(visible)` (the inherited `Env.MessageShow`).

The common "send the Zook to z = −60" line appears in nearly every env
(`BoxEnv:22`, `RamEnv:63`, `StrongEnv:84`, `ZigZagEnv:16`, `SlopeEnv:20`,
`SloppyEnv:20`, `StepEnv:58`, `ShiftEnv:40`, `HurdleEnv:40`, `SprintEnv:46`).

| Env | File | What it adds |
|---|---|---|
| **BoxEnv** | `BoxEnv/BoxEnv.lua` | The *default* empty arena. Wall code is commented out (`:8-19`); effectively just the floor + lights. Moves target to `(0,0,-60)`. This is the Builder's starting environment (`Builder.lua:110`). |
| **RamEnv** | `RamEnv/RamEnv.lua` | Two static red cylinders (posts) at `(-13,2,-20)` and `(14,2,-20)`, eulers `(90,0,0)`, scale `(2,2,2)`; plus one **movable** cube `(2,2,20)` ("ram bar", mass 0.3) at `(-3,1.1,-17)` rotated 90° about Y. A push/ram challenge. (`:13-60`) |
| **StrongEnv** | `StrongEnv/StrongEnv.lua` | Three stacked **movable** cylinders (mass 0.4 each) at increasing heights (8.1, 4.1, 12.1) around z=−30, scales `(4,0,8/4/12)` — heavy logs to push; plus a thin non-solid "finish line" cube `(60,0.05,1)` at z=−40. Strength trial. (`:17-84`) |
| **ZigZagEnv** | `ZigZagEnv/ZigZagEnv.lua` | A slalom: `MakePoles(x,z)` called 4× at alternating x ±0.5 and z = −10,−25,−40,−55 (`:10-13`). Each call makes a tall solid pole cylinder (`pad_width 0.8`, length 20) and a thin non-solid horizontal bar cylinder. Zig-zag steering test. (`:29-70`) |
| **SlopeEnv** | `SlopeEnv/SlopeEnv.lua` | A ramp built from 10 `MessageFixedBlock`s, each `(slopewidth=10, 1, 15)`, tilted by `Quatn((5*|index|,0,0),1)` so the angle increases with distance from centre, stepping across x from −50. A graded incline. (`:7-16`) |
| **SloppyEnv** | `SloppyEnv/SloppyEnv.lua` | 9 pairs of **free** (dynamic) blocks forming wobbly stepped platforms: a thin top plate `(5.5,0.1,7)` over a riser `(5.5,height,0.5)`, marching along x with `height += 0.1`. Loose/unstable terrain. (`:10-16`) |
| **StepEnv** | `StepEnv/StepEnv.lua` | A 4-sided spiral staircase: four loops of 7 `MessageFixedBlock`s each, width/length 5, `height += 0.1` per step, turning the heading by stepping posx/posz; some indices become thin "landing" plates `(width,0.1,length)`. Colours ramp. (`:7-54`) |
| **ShiftEnv** | `ShiftEnv/ShiftEnv.lua` | A walled box (4 fixed walls `length=50, height=2`) filled with **free** physics props: a sphere, a free block, a stack of 5 free blocks (rising), and 4 corner spheres. A push-things-around sandbox. (`:7-37`) |
| **HurdleEnv** | `HurdleEnv/HurdleEnv.lua` | Two rows of 6 hurdles (`MessageFixedBlock` `(width,height,length=16)` rotated 90° about Y), growing in height/width, in front (z from −10) and behind (z from +10). Hurdle/jump course. (`:7-36`) |
| **PlayEnv** | `PlayEnv/PlayEnv.lua` | A playground combining: 11 angled fixed posts laid on a `sin` curve (`:17-26`); a row of 7 SloppyEnv-style free stepped platforms (`:32-38`); and a stack of 11 free spheres (`:41-43`). Does **not** move the target. (`:7-46`) |
| **SprintEnv** | `SprintEnv/SprintEnv.lua` | A speed trial: a thin non-solid start/finish strip `(60,0.05,1)` at z=−50, and an invisible non-solid trigger volume `(60,10,11)` at z=−55 used as the finish target. Drives target to z=−60. On `Go`, posts a 20.05 s `TimeOut`; when the Zook contacts the finish (or times out) it reports distance and computes speed `(dist*4)/time` cm/sec via `AddDetail` (`:78-105`). |
| **Lap** | `Lap/Lap.lua` | A square race track (`specializes Env`). 5 white floor plates + 4 textured kerb capsules forming a loop, plus invisible trigger cubes/spheres at the corners. Defines a sequence `myTargetPositions = {(30,0,-30),(-30,0,-30),(-30,0,30),(30,0,30),(30,0,-30)}` (`:85`) and advances `myCurrentTarget`, re-issuing `MoveTo` to the BuilderTarget as the Zook reaches each corner (`:81-89`, `:142`). Temporarily sets `target_nonsolid` (`:83`). 60 s timeout. |
| **HighJump / Hurdles** | `HighJump/HighJump.lua`, `Hurdles/Hurdles.lua` | Trial arenas (move target to z=−80 / −100 respectively). Same `Env` pattern. |
| **TableSumo / PoloTable** | `TableSumo/`, `PoloTable/` | Alternate arena agents that set `theLand` themselves; PoloTable carves a `holeDepth = 1/0.04` hole with 4-thick walls (`PoloTable.lua:56-57`). |

**Dynamic props / actuated obstacles** (not `*Env`, but world objects placed in
contests): `PushyThing`, `BlockPush`, `RevolvingDoor`, `SwingDoor`, `Turntable`,
`HighJump`, `FixedSplitCube`, `RevolvingDoor`. These each scale by worldscale and
add a moving Karma body. They are referenced by `MoveTo` targets too
(`BlockPush.lua:35-36` moves target to z=−10000 to park it off-stage).

---

## 4. The `Target` system (physics objects / Studio editor objects)

`Target` (`# Target specializes BaseTarget embeds Visual, Karma, Input`) is the
generic, spec-driven physics object used by the Contest Studio and by the `*Env`
arenas to place cubes, cylinders, spheres, capsules and wedges. **It is distinct
from the walk-target** (that is `ClickableTarget`, §5), though both descend from
`BaseTarget` and both can be "set as the thing a Zook walks toward".

### 4.1 Construction (`Target.lua:3-122`)

`Initialize(s)`:
- `nil` spec → returns early (query/template instantiation for the Studio, `:5-8`).
- Scales `position`/`scale` by worldscale (`:13-15`).
- `Execute("BreakObjects", spec)` (`:17`) — runs `BreakObjects.ssx` to possibly
  split a composite spec.
- `CalcPosition(spec)` (`:19`) → `GetObjectCentre` (`:225-238`): shifts the spec
  so the object sits on its **base** rather than centred — cylinders/capsules
  rise by half their X scale, balls by their length, cubes/wedges by half Y.
- If physics (`World.GetFlags()==3`):
  - Optional aggregate geometries (`spec.geometries`, `:31-37` via
    `CreateGeometry`), else a single `Karma.CreateBody("target", shape, movable,
    position, rotation, scale, density)` (`:50`). `CalcShape` maps the shape
    string to a Karma id: sphere/ball=0, cube=1, cylinder=3, capsule=4, wedge=a
    mesh (`WedgeMesh`, `:398-409`) (`:263-288`).
  - Applies `mass`, `friction` (`SetFriction(...,0.5,0,0,0,0)`), linear/angular
    `damping`, `frozen` (`Karma.FreezeBody`), solidity (`MessageSetSolidity` →
    `Karma.SetSolidity`) (`:61-81`).
  - Constraints (`MakeConstraints`, `:162-205`): per-axis linear constraints
    become ball-and-socket (all 3), keep-on-line (2), or keep-on-plane (1);
    rotational become no-rotate (3) or rotate-one-axis (2). Plus `ConstrainAxis`,
    prismatic joints, and **fixed-path animation** (`movepath`):
    `Karma.CreateFixedPath("movepath", target, 0, movetime, moveaccel, movephase,
    moveposition)` (`:95`), giving oscillating/elevator obstacles.
  - `MessageMove` ping-pong: if `spec.move = {to, force, tolerance}` is set, the
    object uses `Karma.MoveTo` to shuttle between two positions, flipping on
    `SystemArrived` (`:115-121`, `:369-385`).
- Else visual-only (`:105-108`).

### 4.2 Visuals (`CreateVisual`, `:291-346`)
Textures resolve under `Agents/World/Target/` unless they contain a `/`. Supports
`shadow`, transparency, chroma-key (`bluescreen_colour_*`), per-object or
spec-default RGB, and an `invisible_alpha` (def 0.25) for invisible-but-present
objects.

### 4.3 Editor metadata (`MessageParamaters`, `:520-817`)
Defines six object templates — **ball, capsule, cube, cylinder, sphere, wedge** —
each with default spec and a `paras` UI schema (Position, Orientation eulers,
Width/Height/Length or Radius, Movable, Solid, Density 0.01–10, Colour, Visible,
Transparent, Shadow, 6 axis Constrain checkboxes, Move-Path/Delay/Position/Time/
Phase/Accel, Group, Texture picker from `./Agents/World/Target/*.png`). This is
the palette of placeable contest objects. `MessageShoot` (`:456-461`) lets the
editor fire impulses (`Karma.AddImpulse`) at objects.

### 4.4 `BaseTarget` — contact callbacks & "be a target" (`BaseTarget.lua`)
`BaseTarget` (`specializes Selectable abstract`) provides the contact-event /
callback machinery shared by `Target`, `ClickableTarget` and `Evo`:
- `AffirmCreation(physical)` stores `targetSegment` (`:13-17`).
- Reference-counted contact attribute: `TurnOnContact/TurnOffContact`
  add/remove `Karma.AddContactAttributeToAll("BaseTarget",0)` so contacts are
  only tracked while callbacks exist (`:20-34`).
- `MessageAddCallback{agent,receiver,message,behaviour}` registers interest;
  on `SystemCollision/SystemIntrusion` → `MessageContact(agent)` dispatches to
  every matching callback (agent-specific or `"all"`) (`:52-116`). This is how
  trial finish-lines, contest scoring, and `Follow`/`Goto` behaviours hear about
  Zook↔object touches.
- `MessageSetMeAsTarget(agent)` (`:47-49`):
  ```lua
  Agent.SendMessage("SetTarget", agent, { target = Agent.Me(), segment = MessageTargetSegmentID() })
  ```
  i.e. tells `agent` (a Zook) to steer toward this object's root segment. The key
  bridge between the object system and the steering system.
- `MessageSetVisualFlags` sets render flags and, importantly, bit 12
  (`BitwiseLShift(1,12)` = the "target segment" flag) on the target segment
  (`:189-191`) so the renderer can mark targets specially.

### 4.5 `Selectable` (`Selectable.lua`)
Abstract base under `BaseTarget`. Exposes a segment's world transform to the
picking/UI system: `MessageSegmentPosition`, `MessageSegmentSpot` (Spot =
pos+scale+rotation), `MessageSegmentMatrix` (`:7-46`). Maintains editor button
lists (`AddButton`, `AddSegmentButton`, `MessageMethods`, `:49-86`) — these are
the right-click context-menu actions in the Studio (e.g. Evo's "Destroy",
"Mutate", "Hit", "Sever"). `MessageSegmentPosition` is the call the **Targeter**
polls every 0.1 s to follow a moving target.

---

## 5. The walk-target / steering system (the core ask)

The chain that makes a Zook walk to a point is:

```
ClickableTarget (a clickable sphere body the user places)
        │  MessageSetMeAsTarget / SetTarget
        ▼
Evo.MessageSetTarget ──► Targeter.MessageSetTarget {target, segment}
        │                         │ every 0.1s polls SegmentPosition
        │                         ▼  stores myPosition
        ▼                  Targeter.MessagePosition() → world point
Evo.TimerUpdate (every 0.10s):
   Neural.SetHighLevelBrainAction("gait_1")
   targPos = Agent.SendMessage("Position", myTargeter)
   Neural.SetHighLevelBrainTargetPosition(targPos, Quatn.New())
```

### 5.1 `ClickableTarget` — the thing the Zook walks toward (`ClickableTarget.lua`)
`# ClickableTarget specializes BaseTarget embeds Visual, Karma, Input`.

`Initialize(position, radius)` (`:3-16`):
- A sphere visual (`Visual.Create("sphere",0,…)`) scaled `radius` cubed, coloured
  `target_red/green/blue` (def 1,1,1), initially invisible (`MessageSetVisible(false)`).
- `Create(position)` (`:20-29`): makes a static sphere Karma body
  (`Karma.CreateBody("sphere",0,false,…)`), solidity = `not target_nonsolid`
  (def solid), optionally attaches a relative visual, then `AffirmCreation` so
  contact callbacks work.
- `myOffset = Vector.New()`.

`MessageMoveTo(position)` (`:95-102`): the primary API. Recreates the sphere body
at the new position (note: it *recreates* rather than `Karma.MoveTo`, which is
commented out at `:101`). This is what every `*Env` calls via
`Agent.SendMessage("MoveTo", BuilderTarget, vector)`.

`MessageSetMoveKey(name)` + `SystemKeyDown` (`:49-81`): bind a key so that
pressing it picks the 3D point under the mouse via the camera
(`Agent.SendMessage("Pick", Config.Get("theCamera"))`) and moves the target there
(`MessageMoveTo(position)`). This is the "click on the floor and the Zook walks
there" interaction in the Builder.

`MessageSetVisual(file, scale, offset)` (`:32-40`): swap the sphere for a custom
mesh (e.g. an arrow) attached relative to the body.

The Builder creates exactly one of these:
`myTarget = Agent.Create("ClickableTarget", Vector.New(0,0,-52), 0.5)` then
`Config.Set("BuilderTarget", myTarget)` (`Builder.lua:107-108`), and makes it
visible (`:115`). `0.5` = radius. The Builder also re-issues `MoveTo` on clicks
and mode changes (`Builder.lua:421, 601-603, 796-799, 916`).

### 5.2 `Targeter` — tracks a (possibly moving) target and feeds a position (`Targeter.lua`)
`# Targeter specializes Agent embeds Visual, Input`. One Targeter is created per
Zook by `Evo` (`Evo.lua:135` `myTargeter = Agent.Create("Targeter")`).

`Initialize()` (`:3-22`):
- `MaxSpeed = 1.0` (`:5`) — declared but not consumed inside Targeter; it is the
  cap the steering layer/brain is expected to honour. (The actual gait amplitude
  ramp lives in `Evo.MessageStartMoving/StopMoving`, §5.4.)
- `myPosition = Vector.New(0,-10,0)` initial (below the floor, i.e. "no target"),
  offset by the owner's position if available (`:9-13`).
- `Agent.SetTimer("Update", Agent.Me(), "update", 0.1)` (`:16`) — **polls at
  10 Hz**.
- A hidden `indicator` cube visual that is moved to the tracked point for debug.

`TimerUpdate()` → `SetTargetDestinaton()` (`:25-48`): if it has a `myTarget`
agent + `mySegment`, it asks `Agent.SendMessage("SegmentPosition", myTarget,
mySegment)` (handled by `Selectable.MessageSegmentPosition`) and stores the
result in `myPosition`, moving the indicator there. If the target is no longer
selectable (returns non-vector), it clears the target. This means the target can
**move** (a moving `Target`/object) and the Zook will keep re-aiming each 0.1 s.

`MessageSetTarget(data)` (`:56-64`): sets `myTarget`/`mySegment` (ignoring
self-targeting) and refreshes immediately.

`MessagePosition()` (`:51-53`): returns the current tracked world point. This is
the value `Evo` feeds to the brain.

### 5.3 `Evo` — wiring the target into the high-level brain (`Evo.lua`)
`Evo` is the Zook agent (`# Evo specializes BaseTarget embeds Genome, Visual,
Karma, Neural, Input, Sound`). Relevant to targeting:

- Ground placement on spawn (`Evo.lua:34-66`): queries `theLand`
  (`Agent.SendMessage("Height", land, pos)`) for ground height, then casts a
  visual ray straight down from 100 units up (`Visual.Ray`) to find the exact
  surface Y, and offsets the creature so its lowest point/bounding box rests on
  the ground (`pos = pos - Vector.New(0, miny, minz) * rot`).
- Creates its `Targeter` (`:135`).
- **Drives the brain every 0.10 s** in `TimerUpdate` (`Evo.lua:172-187`):
  ```lua
  Neural.SetHighLevelBrainAction("gait_1")
  local targPos = Agent.SendMessage("Position", myTargeter)
  Neural.SetHighLevelBrainTargetPosition(targPos, Quatn.New())
  ```
  So the update rate of the steering input is 10 Hz; the action is always
  `"gait_1"`; the target rotation is identity (only the position matters).
- `MessageSetTarget(data)` (`:346-350`): forwards `SetTarget` to the Targeter —
  this is the message `ClickableTarget`/`BaseTarget.SetMeAsTarget`, the `Goto`/
  `Follow` behaviours, and `BuilderParts.MessageSetCreatureTarget` send.

`MessageSetTarget` reaches `Evo` from several places:
- `BuilderParts.lua:928-932` `MessageSetCreatureTarget(target)` →
  `SetTarget {target, segment=TargetSegmentID(target)}` to the expressed Zook
  (used when the Builder assigns the ClickableTarget to the creature).
- `Behaviours/Goto.ssx:52` and `Behaviours/Follow.ssx:117` send `SetTarget` to
  the behaviour owner (a Zook) with `{target, segment}` — contest AI behaviours.

### 5.4 How target position becomes motion (brain side, summarised)
The neural brain consumes `HighLevelBrainTargetPosition`. `Evo.AddRootBits`
(`Evo.lua:543-594`) builds a `"Target"` neuron with an
`accumulatorfunction_target` (`type = "X_Angle"`, `angle_deviance = 3.14`,
`sensitivity = 0.3184`) — i.e. it converts the vector to the target into a signed
turn angle. That feeds `LeftForward/RightForward/LeftReverse/RightReverse` and
`SpineSteering` target-maps which modulate the leg/spine gait, scaled by a
`MasterAmplitude` ramp. Stopping/starting and speed are controlled by
`MessageStartMoving/StopMoving{speed}` (`Evo.lua:383-456`) which ramp
`MasterAmplitude`'s `time_interval` (step sizes 0.0001…0.5 by speed 0–5). The
`MaxSpeed = 1.0` in the Targeter is the normalised cap for this amplitude.
(Full neural detail belongs in the Zook/genome doc; included here only to show
where the target position goes.)

### Rebuild checklist for steering
1. Place a static, optionally non-solid sphere "ClickableTarget" with a `MoveTo`
   that repositions it; let a key + camera-pick set its position.
2. Give each creature a "Targeter" that, at 10 Hz, polls the target object's
   segment world-position and stores it.
3. Each creature, at 10 Hz, reads the Targeter position and calls the brain's
   `SetTargetPosition(pos, identity)` plus `SetAction("gait_1")`.
4. The brain converts the relative target vector to a turn angle and modulates a
   gait, capped at MaxSpeed = 1.0, ramped by a Start/Stop amplitude controller.

---

## 6. Camera system

### 6.1 `BaseCamera` — shared camera agent (`BaseCamera.lua`)
`# BaseCamera specializes Agent embeds Camera, Input`.

`Initialize(pos, rot, x1,y1,x2,y2)` (`:3-41`):
- Stores position/rotation; sets up input toggle state (`space = 1` means camera
  control active, `:26`).
- `Camera.Create(x1,y1,x2,y2)` for a viewport rect, or full screen via
  `Camera.Area()` if no rect (`:29-34`).
- `Camera.Set(myPosition, myRotation)`; default background magenta
  `(163/255, 31/255, 154/255)` (`:37`).
- `Config.Set("theCamera", Agent.Me())` (`:39`) — registers the singleton camera
  used by `ClickableTarget` picking and `GlobalKeys`.

Input/keys (`RegisterKeys`, `:44-62`): arrows + WASD + Q/Z (strafe up/down) +
Shift (boost) + Space (toggle control) + Tab + Ctrl+H (hide camera). `ToggleKey`
(`:94-126`) maps keys to movement flags.

Helpers / messages:
- `CalcHeading(rot)` (`:129-140`) → pan/tilt in radians from a quaternion.
- `MessageSetPosition/SetTarget/SetOrientation/SetViewOffset/SetClipPlanes`
  (`:153-172`) — `SetTarget(target, up)` makes a look-at camera.
- `MessagePick()` (`:174-176`): `Camera.Pick(Input.MousePosition())` → world
  point under cursor (used by ClickableTarget).
- `MessageRay()` (`:179-184`): near/far ray for the cursor.
- Fog/background: `MessageFog`, `MessageBackground`, `MessageShowBackground`
  (`:187-235`) — for chroma-key TV, `ShowBackground(false)` switches to the
  bluescreen colour and disables fog (def `fog_start 40`, `fog_end 80`).
- View angles: `MessageVerticalViewAngle` / `MessageHorizontalViewAngle` /
  `MessageAnamorphic(45°@16:9)` compute the matching horizontal/vertical FOV from
  the viewport aspect (`:199-224`).
- `MessageGetImageAsString`, `MessageSetBluescreen` — TV/screenshot support.

### 6.2 `Camera` — the free / fly camera (`Camera.lua`)
`# Camera specializes BaseCamera embeds GUI`. This is the user-controlled
WASD+mouse-look "free" camera.

`StaticInject()` (`:6-8`): spawns the default camera at
`Vector.New(171.25, 44.58, 86.13)` looking roughly forward, viewport
`0,0,800,600`.

`Initialize` (`:10-38`): registers keys + mouse, derives initial pan/tilt from
the rotation, sets restriction limits (`restrictTilt 90`, `restrictPan 180`,
`restrictRoll 90`, `:29-31`), `myMouseSensitivity = 0.002` (`:33`), unit scales,
and `SetUserControlledAxes(1,1,false)` (pan+tilt yes, roll no).

`SystemCamera(frameTime)` (`:41-60`): per-frame integrator. Applies accumulated
pan/tilt/roll deltas (clamped/wrapped by `RestrictAngle`), composes the rotation
`tilt * pan * roll`, then moves by `CalcInputMovement` and `Camera.Set`.

`SystemMouse(x,y,wheel)` (`:63-87`): mouse-look only while `space==1` and no mouse
button held; LMB-free → pan/tilt; RMB (`mouse1`) → roll. Scaled by
`myMouseSensitivity * panScale/tiltScale/rollScale`.

`CalcInputMovement(frameTime, rotation)` (`:90-137`): WASD/arrows → forward/right
movement at `rate = frameTime*10` (×10 with Shift); Q/Z → vertical. Direction
vectors derive from the camera rotation. Only active while `space==1`.

`RestrictAngle` (`:146-171`): clamps if restricting, otherwise wraps 0–360.
`MessageSetScale` / `MessageSetUserControlledAxes` (`:181-195`) let callers lock
axes or change sensitivity per axis. There is no explicit "cool/follow" mode in
this `Camera`; follow framing lives in `SplitCamera` (§6.3) and `SuperCam`.

### 6.3 `SplitCamera` — follow camera with auto-framing (`SplitCamera.lua`)
`# SplitCamera specializes Agent embeds Camera, Visual`. Used by the split-screen
governor; this is the "cool"/follow camera that frames Zooks.

`Initialize(x1,y1,x2,y2)` (`:3-18`): viewport rect; `myOffset = (2.5,5,10)`
default; `myVerticalViewAngle = 45`; clip planes `1..400` (`:11`); background grey;
anamorphic flag from Config.

`SystemCamera(frametime)` (`:24-36`): each frame optionally saves a JPEG/PNG
(movie recording), then `UpdateView()`, then optionally records the transform +
FOV per video frame (`video_resolution` def 25 fps).

`UpdateView()` (`:38-62`) — the framing logic:
- `myZook == -1`: free/static (does nothing — leaves the camera where set).
- `myZook ~= 0`: lock to a single Zook's root: `myTarget = Visual.GetRootPosition(myZook)`.
- `myZook == 0`: **frame two contestants** (root visuals 1 and 5): target is
  their midpoint `0.5*(pos1+pos2)`; it then **auto-zooms** by computing the angle
  subtended by both Zooks from the camera position and setting the FOV to
  `acos(min dot)*2.1` (`:43-53`) so both stay in frame.
- Smooths target height: `myTargetHeight = myTargetHeight*0.99 + y*0.01` (`:57`) —
  a low-pass so the camera doesn't bob.
- Camera sits at `target + myOffset`, looking at the target, up = `(0,1,0)`
  (`:59-61`).

`MessageSetView/GetView` (`:64-75`): serialise `{zook, offset, target,
verticalViewAngle, targetHeight}` — used to copy a small camera's view into the
main camera and to orbit (see §6.4). `SetViewAngles` (`:95-102`) converts vertical
FOV to horizontal using viewport aspect (with a 16:9/4:3 anamorphic stretch when
`anamorphic`). `MessageResize/SetSize` re-rect and recompute FOV.

Movie support: `SaveScreen`, `RecordPositions`, `SavePositions`, `GetPositions`,
`GetPosition` (`:104-123`).

### 6.4 `SplitScreen` governor — 2(–4) player split (`SplitScreen.lua`)
`# SplitScreen specializes UIAgent embeds GUI, Input`. Lays out one large main
camera over a row of small "selector" cameras and lets the user pick/orbit them.

`Initialize(world, camera)` (`:4-70`):
- Builds `myViews` (`:15-36`) — four camera presets from Config with sensible
  defaults:
  | view | `zook` | offset (def) | FOV (def) |
  |---|---|---|---|
  | 1 | `camera1_zook = -1` (free) | `(-200,120,200)` | 18° |
  | 2 | `camera2_zook = 0` (frame both) | `(16,16,60)` | 45° |
  | 3 | `camera3_zook = 1` (Zook 1) | `(2.5,8,25)` | 45° |
  | 4 | `camera4_zook = 5` (Zook 2) | `(2.5,8,25)` | 45° |

  (`zook` values 1 and 5 are the root-visual ids of the two contestants; `0` =
  frame both, `-1` = free.) `myViews[0]` (the main view) starts as a copy of
  view 1 (`:42`).
- `min_view_angle 10`, `max_view_angle 90`, `mouse_sensitivity 0.6` (`:38-40`).
- Within `World.OpenAccess(world)` (`:43-66`): creates `myMainCamera =
  Agent.Create("SplitCamera", …)` filling the top
  `mySmallCameraCount/(mySmallCameraCount+1)` fraction of the screen, then one
  small `SplitCamera` per view across the bottom strip, each with a GUI hit-rect
  `cam1..camN` for selection. (`mySmallCameraCount = 4` here.) A 32-px title bar
  is reserved unless `no_margin`.

Interaction:
- `SystemUIMouseLDown(segment)` (`:123-129`): left-click a small camera →
  copy its view into the main camera (`SetView(myMainCamera, GetView(small))`).
- `SystemUIMouseRDown/Up` + `SystemMouse` (`:131-177`): right-drag a small camera
  (or scroll the main) to **orbit** (yaw/pitch around the target via spherical
  offset math, pitch clamped 1–89°) and **zoom** (wheel scales FOV within
  10–90°).
- `Input.KEY_J` → `SaveScreen` (screenshot the main camera) (`:72-76`).
- `MessageResize` re-lays-out everything on window resize (`:97-118`).
- `MessageRecordCamera/SaveCameraPositions/GetCameraPosition(s)` proxy to the main
  camera for video export (`:186-200`).

So the camera "modes" available to the player are encoded as `zook` view presets:
**free** (`-1`), **frame-both / cool** (`0`, auto-zoom), and **follow Zook N**
(root-visual id). The split-screen UI is the picker; the actual framing math is
in `SplitCamera.UpdateView`.

### 6.5 `theCamera` singleton
Both `BaseCamera.lua:39` and `SuperCam.lua:8` do
`Config.Set("theCamera", Agent.Me())`. `ClickableTarget.SystemKeyDown` and
`GlobalKeys` read `Config.Get("theCamera")` to do mouse picking. So whichever
camera registered last is the one used for ground-picking the walk target.

---

## 7. `FloorManager` — the "floor drops away" effect (`FloorManager.lua`)
`# FloorManager specializes Agent embeds Visual, Input, GUI, Camera`.

`Initialize(w)` (`:3-7`): stores the world, registers the `F` key,
`myFloorMoving = false`. `constDepth = 25` (`:9`) — how far (units) the floor
moves.

`SystemKeyDown(key)` (`:11-27`): pressing **F** starts a floor animation inside
`World.OpenAccess(myWorld)`. Ctrl+F → `myFloorMoving = 1` (move **up**),
plain F → `myFloorMoving = 2` (move **down**). Records `myStartTime`.

`SystemCamera(frametime)` (`:33-52`): drives a half-cosine ease over
`(SimTime - startTime) * 0.5` clamped to 1 (so ~2 seconds). `t = 0.5 - cos(time*180)/2`.
Then offsets an entire visual group:
```lua
World.SetVisualGroupOffset( 512, Vector.New(0, height, 0) )
```
where `height = -constDepth*(1-t)` (rising) or `-constDepth*t` (dropping).
**Group 512** is the floor's render group (note `BaseTarget.MessageSetVisualFlags`
uses bit 12 = 4096 for *target* segments; the floor uses a different group flag).
When `time==1`, `myFloorMoving = false`. This is the dramatic contest reveal where
the table floor sinks away under a Zook.

---

## 8. Cross-references and gaps

- `theLand` is set by `Env.lua:5`, `TableRect.lua:20`, `TableSumo.lua:26`,
  `PoloTable.lua:27` — only one ground active at a time; it answers `"Height"`.
- `BuilderTarget` is the single `ClickableTarget` (`Builder.lua:108`); every env
  repositions it; the Builder assigns it to the creature via
  `BuilderParts.MessageSetCreatureTarget` → `Evo.MessageSetTarget` → Targeter.
- `theCamera` is the active camera for picking.
- Update rates: Targeter poll **10 Hz** (`Targeter.lua:16`); Evo brain feed
  **10 Hz** (`Evo.lua:130`/`172`); physics tick ≤ `max_tick_size 0.02` (50 Hz)
  (`PhysicsConstants.ssx:12`).
- Key constants: `worldscale 0.04`, `contest_unit_scale 40`, gravity slider
  0–400, MaxSpeed 1.0, Cardan stiffness 1000 / damping 100000, fog 40–80, FOV
  presets 18°/45°, view-angle clamp 10–90°, SplitCamera clip 1–400.
- Karma shape ids observed: 0 = sphere, 1 = cube, 2 = plane (ground/wall),
  3 = cylinder, 4 = capsule, mesh = wedge/custom.

Not covered here (separate docs): the neural/genome IK build (the bulk of
`Evo.lua`), contest flow/scoring (`Contest`, `ContestRunner.ssx`), and the Studio
UI agents (`Builder`, `BuilderParts`, `Photographer`).
