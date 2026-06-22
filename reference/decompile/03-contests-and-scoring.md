# BAMZOOKi Simulator — Contests & Scoring Design Document

> Reconstructed from decompiled Lua under `reference/decompiled/`. All citations use `path:line`.
> This document covers the 2-Zook *Simulator* (a.k.a. ContestRunner) application: how contests are set
> up, run, scored and won, the behaviour state-machine engine that drives all scoring, the split-screen
> 2-player view, and every numeric constant / Config key involved.

---

## 1. Applications and Boot

There are two boot scripts of interest.

### 1.1 ContestRunner.ssx — the interactive 2-Zook Simulator
`Boot/ContestRunner.ssx` sets `app_name = "Simulator"` and configures the engine, then creates the UI:

```
Config.Set("app_name","Simulator")                       -- ContestRunner.ssx:1
Config.Set( "exclusive", 1 )                              -- :7
Config.Set( "physically_connected_integrity", false )    -- :11
Config.Set( "auto_set_inertial_tensor", 1 )              -- :12
Execute("PhysicsConstants")                               -- :13
...
Execute( "LoadConfigTable", dir .. "ContestRunner.cfg" )  -- :32
Execute( "GenomeConfiguration" )                          -- :34
Config.Set( "auto_GUI_resize", false )                    -- :35
mainWindow = Agent.Create("SimpleFrame")                  -- :37
editor = Agent.Create("ContestRunner")                    -- :40
System.MainLoop()                                         -- :42
```

Colour / fog Config keys set here (used by world agents and split-screen blue-screen modes):
`panel_colour_*` (rgb=1, alpha .6), `bluescreen_colour_green = 0.667`, `bluescreen_colour_blue = 0.678`,
`fogging = 1`, `fog_start = 40`, `fog_end = 80`, `target_red/green/blue = 1/0/0`
(`ContestRunner.ssx:15-27`).

### 1.2 ContestFilePlayer.ssx — the motion-file playback app
`Boot/ContestFilePlayer.ssx` (`app_name = "Motion Player"`) plays back the `.bvz` motion files the
Simulator records. It creates `World.Create(2)` (visual-only, no physics — see §3.4), a `GlobalKeys`,
a `SplitScreen` and a `VisualFilePlayer`, then unzips a `.bvz` passed via the `-f` command-line flag
into a temp `.bmv` and opens it (`ContestFilePlayer.ssx:40-73`). Notable Config:
`max_tick_size = 0.0625`, `shadow_catcher_height = -6.25`, `worldscale = 1` (overridable by
`StudioSettings`), `v_sync = false` (`ContestFilePlayer.ssx:18-21`). The camera-config keys
(`cameraN_zook`, `cameraN_target`, `cameraN_offset`, `cameraN_angle`, `anamorphic`) are documented in
the comment block at `ContestFilePlayer.ssx:25-30` and consumed by `SplitScreen` (§6).

---

## 2. The Top-Level UI Agent: ContestRunner

`Agents/Governor/ContestRunner/ContestRunner.lua` is the front-end. It specializes `UIAgent`.

### 2.1 Startup
`Initialize()` (`ContestRunner.lua:6-27`):
1. Creates `My BAMZOOKi/Motion Files` folders under MYDOCUMENTS (`:7-9`).
2. `ReadContestDefinitions()` (`:13`) — scans `ContestPacks/*.dat`, reads each as a table, and merges all
   entries into `myContests[name] = contest` (`:141-151`). Each contest definition is a high-level
   *contest pack* entry (camera, rounds, score mode, picture), distinct from the per-round `.contest`
   world file loaded later.
3. Sets `texture_path = "./NewTeam/Textures"` (`:15`).
4. `CreateUI()` (`:21`), `SetContestPicture()` (`:22`).
5. Creates the per-app `ContestRunnerContest` controller agent (`myContest`, `:23`).
6. Creates a `ZookSelector` (`myZookSelector`, `:24`) and an empty `myTeam = {}` (`:25`).

### 2.2 Choosing UI (2 contestants)
`CreateUI()` (`:29-81`) builds:
- A contest list (`contests`) populated from `myContests` names, sorted (`:42-49`).
- A contest preview picture pane (`contest_picture`) retextured from `contest.picture`
  in `./Contests/Contest Pack/` (`SetContestPicture`, `:180-187`).
- **Exactly two** zook preview slots, hard-coded `for i = 1, 2` (`:61-78`). Slot 1 is green
  (colour `{0,0.7,0.4}`), slot 2 is red (`{1,0.1,0.1}`) (`:60`). Each slot has a `ZookPreview` agent,
  a clickable button, and a "Zook i" label. This is the origin of the fixed **green = player 1,
  red = player 2** mapping used throughout scoring.
- "Go" and "Exit" panel buttons (`:53-54`).

### 2.3 Selecting zooks
Clicking a preview button sets `myZookChoosing` and shows the `ZookSelector` with a temporary file name
`tempZook<i>.zook` (`SystemUIChange`, `:162-178`). When a creature is chosen, `MessageLoadCreature`
(`:198-207`) stores `myTeam[i] = {team, creature, version}` and loads it into the preview. `myZooks`
team resolves to `default_teams_directory`, otherwise to `ROOT/Teams/<team>` (`:199-203`).
`MessageImport` (`:210-214`) supports a direct full-path import (`myTeam[i] = {creature = fullpath}`).

### 2.4 Launching a contest
`RunContest()` (`:219-239`):
- Validates both slots are filled, else raises an `Alert` "Please select green/red contestant"
  (`:221-228`).
- Builds the `contestants` array. For a team-based pick the full path is
  `<team>/Creatures/<creature>/<version>.zook`; for an imported pick it is the raw `creature` path
  (`:229-236`).
- Hides the choosing UI and sends `BeginContest` to `ContestRunnerContest` with the contest name,
  contest definition and contestants array (`:237-238`).

When a contest finishes, `MessageContestFinished` (`:189-191`) re-shows the choosing UI.

---

## 3. Contest Lifecycle Controller: ContestRunnerContest

`Agents/Governor/ContestRunnerContest/ContestRunnerContest.lua` owns the running world, the countdown,
the camera, recording, the score HUD, and round progression. It specializes `UIAgent` and embeds
`Input, Visual`.

### 3.1 HUD
`CreateUI()` (`:27-45`) builds the top panel: a **Stop** button, a `time_text` ("Simulation time: …"),
a green score label (colour `0,0.7,0.4`) and a red score label (colour `1,0.1,0.1`), plus a red
"Recording simulation!" warning (`:33-42`).

### 3.2 BeginContest / rounds
`MessageBeginContest(name, contest, contestants)` (`:141-150`) stores the definition, sets
`myRound = 1`, clears `Scores = {}`, and calls `BeginRound()`.

`BeginRound()` (`:166-212`) is the heart of setup:
1. `CleanUp()` destroys any previous world/agents (`:167`).
2. `myWorld = World.Create()` (`:169`) — **a full physics world** (no argument → physics flags).
3. Builds the `SplitScreen` camera from `myContestDef.camera`, forcing `camera.no_margin = 1` (`:171-176`).
4. `World.OpenAccess(myWorld)` then:
   - Reads the per-round contest world file:
     `round = myContestDef.rounds[myRound]`, `contestFile = round.contest`,
     `contestData = System.ReadTable("Contests/Contest Pack/"..contestFile..".contest")` (`:180-183`).
   - Maps the round's `contestants` indices onto the actual loaded zooks:
     `selectedContestants[i] = myContestants[ round.contestants[i] ]` (`:184-187`).
   - Creates the world-side `Contest` agent:
     `Agent.Create("Contest", nil, contestData, selectedContestants, Agent.Me())` (`:188`).
   - `CreateLights()` (`:189`, see §3.3).
5. Creates a `VideoCountdown` (`myCountdown`, `:192`).
6. Starts the per-100ms update timer: `Agent.SetTimer("Update", Agent.Me(), "timer", 0.1)` (`:195`).
7. Resets flags `myRecording/myGoing/myStopped = false`, zeroes the time text, and initializes the
   green/red score labels according to `myContestDef.score` ∈ {"green","red","both"} (`:196-209`).

### 3.3 Lights
`CreateLights()` (`:214-224`): a shadow source at `(2,10,2)` radius .2, an ambient light `0.3` grey,
and a directional light `0.7` grey aimed from `(1,1,0.8)` toward origin.

### 3.4 The master clock: TimerUpdate (countdown → record → go)
`TimerUpdate()` runs every 0.1s under `World.OpenAccess` (`:226-244`). It uses `World.SimTime()`:

| Sim time | Action |
|---|---|
| `> 1`s (once) | Opens visual output `Videos/TempSaveVideo.bmv`, sets `myRecording = 1`, schedules the per-frame record timer at `update_rate` (`:229-234`). |
| every tick | `Agent.SendMessage("Update", myCountdown, time)` drives the 3-2-1 overlay (`:235`). |
| `>= 4`s (once) | `Agent.SendMessage("Go", myContest)`, `myGoing = 1` — **the contest actually starts** (`:236-239`). |
| while going | Updates `time_text` to `time - 4` (so the displayed clock starts at 0 when the zooks are released) (`:240-242`). |

So the contest has a **fixed ~4-second pre-roll**: 1s settle, then the countdown overlay, then "Go" at
t=4. Recording begins at t≈1s, before "Go", to capture the start.

### 3.5 Recording motion files
`MessageStartRecordTimer` schedules `TimerRecord` at `update_rate` (`:246-250`), and `TimerRecord`
calls `World.WriteVisual()` each frame (`:252-257`). Pressing **Stop** while recording
(`SystemUIChange`, `:59-72`) stops the write timer, closes visual output, and opens a `FileSelector` to
save a `.bvz` (`Save motion file`) in the MYDOCUMENTS Motion Files path (`:1-6`). The default name is
`"<ContestName> <N>"` where N is the next free version (`Filename`/`Version`, `:74-95`).
`MessageRecordThenGo` / `MessageOKRecordThenGo` zip `TempSaveVideo.bmv → <name>.bvz` at compression 6,
overwriting only after an `OKCancel` confirm (`:104-134`).

### 3.6 Score HUD updates
`MessageBehaviourReport(message)` (`:269-286`) is the **live scoreboard sink**. When a behaviour reports
a `scoreboard`, the HUD shows:
- `score == "green"` → `Green: <score[1]>`
- `score == "red"` → `Red: <score[1]>`
- `score == "both"` → `Green: <score[1]>`, `Red: <score[2]>`

`MessageBehaviourReportOld` (`:288-318`) is the legacy multi-round aggregator: it sums per-team scores
into `Scores[myRound]`, and on a `"finish"` message determines the high-scoring team and posts
`EndRound`. The current path uses `MessageBehaviourReport`; the contest end is driven by the `Finish`
behaviour (§5.1) reaching `EndContest`.

### 3.7 Round / contest end
`MessageInstantiateContest` forwards `InstantiateAll` to the `Contest` agent (`:259-261`) — this is how
the world-side `Contest` defers instantiation until the controller is ready.
`MessageEndRound` (`:320-328`) advances `myRound`; if another round exists it calls `BeginRound()`,
otherwise `EndContest` is sent to the notify agent (the `ContestRunner`). `EndContest()` (`:98-102`)
cleans up and sends `ContestFinished` back to `ContestRunner` to restore the choosing UI.

### 3.8 CleanUp
`CleanUp()` (`:152-164`) destroys camera, countdown, contest, stops the timer, destroys the ambient and
directional light segments and `World.Destroy(myWorld)`.

---

## 4. The World-Side Contest Agent

`Agents/World/Contest/Contest.lua` (specializes `Agent`, embeds `Input, Visual`) instantiates all world
objects from the `.contest` data table, places the zooks, wires up the `BehaviourManager`, and relays
scores upward. The `.contest` table has two top-level lists:
- `data.agents` — array of `{ agent = <ClassName>, params = {…} }` world objects (tables, hurdles, doors,
  and `ZookPlaceHolder` slots).
- `data.behaviours` — array of behaviour definitions (see §5).

### 4.1 Initialize and contestant counting
`Initialize(selector, d, loadContestants, notifyAgent)` (`:4-64`):
- Back-compat: converts any `params.rotation` quaternion into `params.eulers` (`:13-17`).
- Counts `totalContestants` by scanning `data.agents` for `ZookPlaceHolder` entries that have no valid
  `contestant.fullname` yet (`:20-32`).
- Registers number keys `0-9` plus `KEY_ADD`/`KEY_SUBTRACT` (`:39-50`) — these let a human manually
  start/stop individual zooks during a run (§4.4).
- Branches on `loadContestants`:
  - `false` → instantiate immediately without zooks (editor preview) (`:53-54`).
  - `1` → ask the `Selector` to pick contestants (`:55-56`).
  - a table → must match `totalContestants` exactly, else `Throw("Incorrect number of contestants…")`
    (`:57-63`). The Simulator always passes the 2-element `selectedContestants` array here.

### 4.2 Instantiating agents and zooks
`MessageContestantsSelected` → posts `InstantiateContest` back to the notify agent (the controller),
which then sends `InstantiateAll` (§3.7) → `MessageInstantiateAll` (`:78-98`):
- For each empty `ZookPlaceHolder`, assigns the next `SelectedContestants[c]` into
  `params.contestant` (`:79-89`).
- `InstanciateAgents()` (`:101-120`) creates every `data.agents[i]`:
  - `ZookPlaceHolder` entries become real zooks via `CreateZook` (`:109-111`).
  - other entries are `Agent.Create(value.agent, value.params)` (the world objects of §7) (`:113`).
  - each gets `SetVisualFlags(params.flags)` and `SetGroup(params.group)` (`:115-116`).
- Creates the `BehaviourManager` with `{ agents = agents, behaviours = data.behaviours }` (`:92`).

`CreateZook(value)` (`:122-154`) is how a contestant becomes a physical Zook:
- Creates an `Evo` agent at `params.position` with rotation from `params.eulers`, loading
  `params.contestant.fullname`; `fixed = true` if `params.movable == false` (`:123-129`).
- For a **fixed** (non-movable) zook it builds a grey "hatpin" cylinder (visual id 3) by ray-casting
  the ground height at the hatpin XY, then `Agent.SendMessage("Fix", zook, hatpin)` (`:130-147`).
  `Evo.MessageFix` ray-casts down and welds the zook to the ground with `Karma.CreateRod`
  (`Evo.lua:149-158`).
- Records `Contestants[myNextContestant] = zook` (1-based, in placeholder order → 1 = green, 2 = red).
- Sends `SmoothStop` so the zook starts frozen (`:151`) — "trying to emulate exactly the conditions of
  the Zook-kit".

### 4.3 Go and score relay
`MessageGo()` (`:182-185`) is sent by the controller at t=4. It:
1. `SystemKeyDown(Input.KEY_ADD)` → `SmoothStart` on **all** contestants (`:161-164`, `:183`).
2. `Agent.SendMessage("Start", BehaviourManager)` → begins the behaviour engine (`:184`).

`MessageBehaviourReport(message)` (`:191-204`) enriches each scoreboard before relaying it up: it maps
the behaviour-reported `player` (agent ids) to `contestant` ids via `ContestantIds`, and attaches each
zook's `description`. It then `PostMessage("BehaviourReport", NotifyAgent, …)` to the controller (§3.6).

### 4.4 Manual control keys
`SystemKeyDown` (`:156-180`): `KEY_ADD` starts all, `KEY_SUBTRACT` stops all; number keys `1..0` start
(or, with Shift, stop) contestant N via `SmoothStart`/`SmoothStop`.

### 4.5 Zook movement primitives (Evo)
The behaviours and the contest control zooks through these `Evo` messages:
- `SmoothStart` = `StartMoving({speed=5})`, `SmoothStop` = `StopMoving({speed=5})`
  (`Evo.lua:450-456`).
- `StartMoving`/`StopMoving` ramp the neural `MasterAmplitude` `time_interval` up/down by a step keyed to
  `speed` (1→0.5 … 5→0.005), then freeze/unfreeze the neural net (`Evo.lua:383-448`).
- `SetTarget` forwards to the zook's `Targeter` (`Evo.lua:346-350`); the high-level brain steers toward
  the targeter position each `TimerUpdate` (`Evo.lua:172-184`).
- `LowestPoint` returns the minimum Y over all visual segment corners — used by HighJump (`Evo.lua:1449-1470`).
- `GetGroup`/`SetGroup`, `Position`/`GetPosition`, `TargetSegmentID`, `AddCallback`/`RemoveCallback`,
  `TestIntersect` are inherited from `BaseTarget` (`BaseTarget.lua:37-213`, `Target.lua:348,388`).
  Contact callbacks fire from `SystemIntrusion`/`SystemCollision → MessageContact` which dispatches to
  every registered callback receiver (`BaseTarget.lua:52-73`).

---

## 5. The Behaviour Engine (Scoring State Machines)

All scoring, winning and losing is implemented as **behaviours**: small state machines in
`Behaviours/*.ssx`, orchestrated by `Agents/World/BehaviourManager/BehaviourManager.lua`. A contest's
`.contest` file declares a `behaviours` list; each behaviour entry has fields documented at the top of
the manager (`BehaviourManager.lua:5-14`):

```
behaviour.name              -- ssx file in Behaviours/
behaviour.owner             -- agent id the behaviour acts on
behaviour.id                -- unique id
behaviour.params            -- editor params
behaviour.triggerOnEvents   -- events that activate it
behaviour.triggerOffEvents  -- events that deactivate it
behaviour.destroyOnEvents   -- events that remove it
```

### 5.1 Manager mechanics

States: `INACTIVE=0, ACTIVE=1, SUSPENDED=2`. Special event ids:
`ALL=-1, SYSTEM=-2, IMMEDIATE=-3, TRIGGER_ON=-4, TRIGGER_OFF=-5, DESTROYED=-6`
(`BehaviourManager.lua:16-27`).

- **Initialize** (`:34-61`): clones the behaviour and agent lists, and for each behaviour
  `value.instance = Execute("Behaviours/"..value.name)` (loads the `.ssx` and captures its `Behaviour`
  table), resolves `value.owner = Agents(value.owner)`, state = INACTIVE.
- **Start** (`:65-74`): on first start broadcasts the immediate event
  `ProcessEvent({ behaviour = SYSTEM, id = IMMEDIATE })` (firing all behaviours whose
  `triggerOnEvents` include `{behaviour=ALL,id=IMMEDIATE}`), starts a repeating `Update` timer, and
  records `StartTime = World.SimTime()`.
- **TimerUpdate** (`:82-102`): each tick calls `Behaviour.update(data)` on every ACTIVE behaviour with
  `data.simTime` and `data.realTime`.
- **ProcessEvent(e)** (`:124-212`) is the core event router. For event `e`:
  1. Removes any pending messages whose `triggerOffEvents` match `e` (`:132-139`).
  2. For each behaviour: if ACTIVE and `e` is a triggerOff/destroy event → set INACTIVE, call
     `finalize`, drop its messages, broadcast `TRIGGER_OFF` (and `DESTROYED`, removing it) (`:151-184`).
  3. If ACTIVE and `e` matches a registered callback event → call `callback` (`:187-192`).
  4. If INACTIVE and `e` matches `triggerOnEvents` → set ACTIVE, call `initialize`, broadcast
     `TRIGGER_ON` (`:198-205`).
- `EventExists` matches on `(behaviour, id)` with `ALL` wildcards (`:215-222`).
- **BroadcastEvent(event_id,data)** wraps the active behaviour's `(owner, id)` and re-enters
  `ProcessEvent` — this is how behaviours chain (a `Finish` event triggers the `Finish` behaviour, etc.)
  (`:266-272`).

### 5.2 Behaviour API exposed to each `.ssx`
Functions a behaviour can call (all in `BehaviourManager.lua`):
- `Params()` → clone of its params (`:254`).
- `Owner()` / `Me()` → its owner agent / its behaviour id (`:236-242`).
- `Agents(id)` → resolves an agent-id param to a real agent (`:258-263`).
- `AllAgents` → the full agent list (used to iterate over all zooks).
- `BroadcastEvent(name,data)` → fire a named event (`:266-272`).
- `SendMessage(name,to,params,triggerOffEvents)` → send an agent message, optionally logged so it can be
  rescinded on a triggerOff (`:275-301`).
- `AddCallback`/`RemoveCallback`/`AddCallbacks`/`RemoveCallbacks` — register contact callbacks (`:304-335`).
- `Deactivate()` (`:338-340`), `Suspend(owner)` / `Resume(owner)` — push/pop an owner's active
  behaviours + pending messages onto a stack (`:343-422`); used by the `Suspend`/`Resume` behaviours.
- `ImmediateEvent()` = `{behaviour=ALL,id=IMMEDIATE}` (`:425-427`); `Event(e)` = `{behaviour=Me(),id=e}`
  (`:430-432`).
- `StartTime()` → engine start time (`:232-234`).
- `CallManager(message)` → `Agent.SendMessage("BehaviourReport", Manager, message)` — **this is how a
  behaviour pushes a live scoreboard to the HUD** (`:435-439`).

Every behaviour file follows the same shape: `main()` returns the `Behaviour` table, which defines
`paramaters`, `events`, `validate`, `initialize`, `finalize`, `callback`, `update`.

### 5.3 Scoreboard format
A scoreboard is `{ player = {agentIds…}, score = {numbers…} }`. The `Contest` agent rewrites `player`
into `contestant` ids and adds `description` (§4.3); the controller then maps contestant → green/red
(§3.6). A `score` value's meaning depends on the contest: a win flag (0/1), a count, a distance, a time,
or a timed/penalty value.

### 5.4 Catalogue of behaviours

**Outcome behaviours (set the final scoreboard):**

| Behaviour | File | Effect |
|---|---|---|
| `Winner` | `Behaviours/Winner.ssx:35-50` | scoreboard `{player=[winner], score=[1]}`, broadcasts `Winner`. |
| `Loser` | `Behaviours/Loser.ssx:35-50` | scoreboard `{player=[loser], score=[0]}`, broadcasts `Loser`. |
| `Finish` | `Behaviours/Finish.ssx:32-77` | Ends the contest. If `data.event.data.scoreboard` already exists, forwards it as `{name="finish", scoreboard=…}`. Else if a `target` is given, builds a 0/1 win table: every `Evo` in the target's group scores `winner` (=1), others score `other` (=0); the `invert` param swaps winner/other (`:43-71`). Else `{name="finish", scoreboard=nil}`. The `name="finish"` message is what ultimately ends the round/contest. |

**Counting / height behaviours:**

| Behaviour | File | Scoring rule |
|---|---|---|
| `HeightCounter` | `Behaviours/HeightCounter.ssx:38-71` | Counts agents in `heightgroup` whose `Vector.GetY(pos) < height`; reports `{player=[winner], score=[count]}` and broadcasts `Counted`. |
| `TotalHeightCounter` | `Behaviours/TotalHeightCounter.ssx:40-68` | Same count; when `count == total` broadcasts `Total` with `target = winner` (a "everyone is down" trigger). |
| `PenaltyTimer` | `Behaviours/PenaltyTimer.ssx:39-74` | On init, score = `(simTime - StartTime) + count * penalty`, where `count` = agents in `heightgroup` below `height`. Broadcasts `PenaltyTimer`. This is the timed-with-penalty score (lower is better). |

**Contact behaviours (push-out / touch detection):**

| Behaviour | File | Behaviour |
|---|---|---|
| `ListenContact` | `Behaviours/ListenContact.ssx:34-80` | Registers a contact callback between `owner` and `target`; on first contact broadcasts `Contact` with the target and removes itself. (Evos register the callback on the *target* "as it will have less parts".) |
| `NoContact` | `Behaviours/NoContact.ssx:35-98` | Tracks `lastContact` time of `owner↔target`. When `simTime - lastContact > timeout` and still active, broadcasts `NoContact` (used to detect "fell off / stopped touching the ring"). |
| `TotalNoContact` | `Behaviours/TotalNoContact.ssx:36-105` | Listens to **all** contacts on `owner`. For each contacting agent that has not touched for `> timeout` **and** no longer intersects (`TestIntersect`), increments `total` and live-reports `{name="score", player=[winner], score=[total]}` — i.e. counts how many things have been pushed off and stayed off. |
| `Follow` | `Behaviours/Follow.ssx:39-127` | Steers `owner` toward an ordered list of `targets`; on contact with the current target advances; `loop` repeats; broadcasts `Contact`, `Loop`, `Finished`. `startRandom` randomizes the first target. |
| `Goto` | `Behaviours/Goto.ssx:37-54` | One-shot: sends `SetTarget(owner, target)` so the zook walks to a single target. |

**Movement / positioning behaviours:**

| Behaviour | File | Behaviour |
|---|---|---|
| `StartMoving` | `Behaviours/StartMoving.ssx:36-51` | On init `StartMove` on owner; on finalize `StopMove`. |
| `StopMoving` | `Behaviours/StopMoving.ssx:36-42` | On init `HaltMove` on owner. |
| `Freeze` | `Behaviours/Freeze.ssx:36-42` | `StopMoving({speed})` immediately (`speed` 1–5). |
| `Unfreeze` | `Behaviours/Unfreeze.ssx:36-42` | `StartMoving({speed})` immediately. |
| `PositionBehind` | `Behaviours/PositionBehind.ssx:40-76` | Each update, places `owner` a fixed `distance` behind `target` along the target→owner vector (used to keep a chasing object positioned). |
| `RandomMove` | `Behaviours/RandomMove.ssx:45-175` | Teleports a "base target" object to a random offset within `±distanceX/Y/Z`, on contact (and optionally on a `time` interval). **Scores**: each contact with one of `targets` increments that target's score (debounced 0.1s) and live-reports `{name="score",…}`; on finalize broadcasts `EndScore` with the full table. This is the Zookball/Dodgy-Zook style "hit the moving object" scorer. |
| `RandomMoveNoScore` | `Behaviours/RandomMoveNoScore.ssx` | Identical motion but does **not** `CallManager`/report — pure decoration. |

**Distance / timer / flow behaviours:**

| Behaviour | File | Behaviour |
|---|---|---|
| `MonitorDistance` | `Behaviours/MonitorDistance.ssx:38-97` | Watches `|owner - target|`. If `distance < 0`, alerts (broadcasts `Distance`) when length `< -distance`; if `distance > 0`, alerts when length `> distance`. Broadcasts `Reset` when it leaves the zone (edge-triggered with a one-shot `alert` latch). |
| `Timer` | `Behaviours/Timer.ssx:37-81` | After `time` seconds broadcasts `Timer`, repeating `repeat_times` times. The first update only records the start time (so timing begins from the behaviour's own activation). |
| `Suspend` | `Behaviours/Suspend.ssx:32-38` | `Suspend(Owner())` then `Deactivate()` — freezes the owner's other behaviours. |
| `Resume` | `Behaviours/Resume.ssx:32-38` | `Resume(Owner())` then `Deactivate()` — restores them. |

### 5.5 Typical scoring chains
- **Push-out / Sumo**: `ListenContact` or `NoContact`/`TotalNoContact` detect a zook leaving the ring →
  broadcast `NoContact`/`Contact` → triggers a `Finish` (with `target` = the surviving group) →
  `Finish` builds a 0/1 win table and sends `name="finish"` → controller ends the contest.
- **Last-standing / height**: `HeightCounter` continuously reports counts to the HUD; `TotalHeightCounter`
  fires `Total` when all of a group are below the floor → triggers `Finish`/`Winner`.
- **Hit-the-object (Zookball, Dodgy Zook, Merry-Go)**: `RandomMove` on the moving object accumulates
  per-zook contact counts and live-reports them; a `Timer` fires `Finish` at the end of the round.

---

## 6. Split-Screen 2-Player Setup

`Agents/Governor/SplitScreen/SplitScreen.lua` (specializes `UIAgent`, embeds `GUI, Input`) provides the
multi-camera 2-player view used during contests.

### 6.1 Camera layout
`Initialize(world, camera)` (`:4-70`) builds **four** camera views (`myViews`) plus a large main camera:
- Main camera occupies the top `mySmallCameraCount/(mySmallCameraCount+1)` of the screen height
  (`:48-52`).
- The bottom strip is divided into `mySmallCameraCount` (=4) small cameras side by side (`:57-65`).

Each view is built from Config keys (defaults shown):

| View | `zook` | `offset` default | `angle` default |
|---|---|---|---|
| `camera1` | `-1` (free) | `(-200,120,200)` | `18` |
| `camera2` | `0` (zook1 & zook5 / both) | `(16,16,60)` | `45` |
| `camera3` | `1` (zook1 = green) | `(2.5,8,25)` | `45` |
| `camera4` | `5` (zook5 = red) | `(2.5,8,25)` | `45` |

(`SplitScreen.lua:16-36`; the `cameraN_zook` numbering meaning — `-1`=none, `0`=both, `1`=green,
`5`=red — is the convention documented in `ContestFilePlayer.ssx:27`.) Other Config:
`min_view_angle = 10`, `max_view_angle = 90`, `mouse_sensitivity = 0.6` (`:38-40`).

Each small camera is a `SplitCamera` agent fed its view (`:60-64`). Clicking a small camera
(`SystemUIMouseLDown`, `:123-129`) copies that view into the main camera. Right-drag orbits the selected
camera (yaw/pitch from mouse, clamped pitch 1–89°), and the mouse wheel zooms the vertical view angle
(clamped to `[min_view_angle, max_view_angle]`) (`SystemMouse`, `:147-177`). `KEY_J` saves a screenshot
(`:72-76`).

### 6.2 Notes
- `camera.no_margin` is forced on by `ContestRunnerContest.BeginRound` (`ContestRunnerContest.lua:175`),
  so the split-screen uses the full window height (`SplitScreen.lua:11-13, 99-101`).
- `MessageRecordCamera`/`SaveCameraPositions`/`GetCameraPositions` (`:186-200`) let the camera path be
  recorded alongside the motion file.

### 6.3 Countdown overlays
Two countdown agents exist:
- `VideoCountdown` (`Agents/Governor/VideoCountdown/VideoCountdown.lua`) — the one used by the Simulator.
  It is purely driven by `MessageUpdate(time)` from the controller's master clock (§3.4). It maps
  `time-1` ∈ `[0,4]` onto frames of the `Count` texture (`floor*0.25 … (floor+1)*0.25`) and fades alpha
  with `1 + floor - time`; outside that range it shows nothing (`:14-23`). 200×200 px, screen-centred.
- `Countdown` (`Agents/Governor/Countdown/Countdown.lua`) — a self-timed variant (used elsewhere) that
  runs its own real-or-sim clock, fires `Start`/`CountFinished` at t=3, and self-destroys at t=4
  (`:27-71`).

---

## 7. Contest World Agents (the arenas) and how each contest is scored

The arena geometry comes in two families:

1. **Editor "world object" agents** placed by the `.contest` file's `data.agents` list and scored by
   the behaviour engine (§5). These are the 2-Zook *contest* arenas.
2. **`Env`-derived trial agents** (BlockPush, Hurdles, HighJump, Lap, SprintEnv) that score a *single*
   zook directly via `AddDetail`, used by the single-zook "Trials". They are included here because they
   share the simulator infrastructure, but they are **not** behaviour-scored 2-player contests.

All world-object agents share a common shape: `Initialize(spec)` scales `position`/`scale` by
`worldscale`, checks `World.GetFlags() == 3` for physics, builds Karma bodies + Visual meshes, and expose
editor hooks (`MessageSpec`, `MessageGetOABB`, `MessageBoundingSphere`, `MessageSetProperty`,
`MessageGetProperty`, `MessageParamaters`). `worldscale` is the metres↔engine conversion; defaults like
`0.85/0.04` show the `0.04` m/unit scale used by the kit.

### 7.1 RevolvingDoor — "Dodgy Zook"
`Agents/World/RevolvingDoor/RevolvingDoor.lua`. Two perpendicular wall panels (`wall1`, `wall2` at 90°)
welded into one body on a vertical hinge (`doorhinge`), free-spinning (`:42-83`). Default scale
`(1,10,15)`, mass `1`. The door knocks zooks; **scoring is by the behaviours attached in the `.contest`**
(typically a `RandomMove`/contact counter or a `Finish` push-out), not by this agent itself.

### 7.2 Turntable — "Merry-Go-Round"
`Agents/World/Turntable/Turntable.lua`. A curved circular disc (radius default 20, depth 2, curvature
1000) on eight coincident hinges (`spindle…spindle8`) (`:42-92`). On physics worlds it auto-spins:
`StartTurntable` after 4s, then `TimerSpeedUp` ramps `mySpeed += 0.02` each 0.1s and applies
`Karma.SetHingeMotor(spindle, mySpeed, 10000)` (`:28-40`). `KEY_EQUALS`/`KEY_MINUS` nudge the speed by
±0.2 (`:124-136`). Zooks must stay on the spinning disc; **scoring is behaviour-driven** (a `NoContact`
push-off or a `Finish`).

### 7.3 TableSumo — "Sumo"
`Agents/World/TableSumo/TableSumo.lua`. A curved circular "sumo ring" mesh of radius `spec.radius` and
curvature `spec.curvature`, dropping to a depth `spec.height`, with an **invisible floor** beneath at
`-depth` (`:31-99`). Default ring radius `0.85/0.04 ≈ 21.25` units, height `1/0.04 = 25`,
curvature `10000` (`:191-205`). Registers `theLand`. The contest: push the opponent off the dome. A
zook that slides off and stops touching the ring is detected by a `NoContact`/`TotalNoContact` behaviour
→ `Finish` declares the surviving group the winner (0/1). `MessageHeight` returns the ring-top Y for
placement; `MessageShow(false)` blue-screens the ring for chroma compositing.

### 7.4 PushyThing + TableRect + FixedSplitCube — "Weakest Zook"
A push-of-strength contest assembled from three agents:
- **`TableRect`** (`Agents/World/TableRect/TableRect.lua`) — the rectangular table. On physics it loads a
  PGM heightfield `kw-table.pgm` (18×13, table top = `hf_x-3` × `hf_z-3`) with an invisible back wall
  (`:23-50`). Default scale `(4.5/0.04, 1/0.04, 1.8/0.04)`. Registers `theLand`. `magicFloorOffset =
  (0,30,0)` (`:18`).
- **`PushyThing`** (`Agents/World/PushyThing/PushyThing.lua`) — a sliding carriage on a **prismatic**
  joint along X (`Karma.CreatePrismatic("prismatic", wall, 0, (1,0,0))`, mass 5, linear-velocity damping
  10) with a blue end-wall (player-1 colour) and a red end-wall (player-2 colour) (`:89-117`). Each zook
  pushes from its coloured end; whichever pushes the carriage past the other loses ground.
- **`FixedSplitCube`** (`Agents/World/FixedSplitCube/FixedSplitCube.lua`) — the shells/blocks: a hollow
  shell of ≤4-unit sub-cubes (only outer-layer cubes are solid) used as fixed obstacles (`:31-86`).

Winner is decided by a `MonitorDistance`/`Finish` pair watching the carriage offset, or by which zook is
pushed off — again wired in the `.contest` behaviours.

### 7.5 PoloTable — "Zookball"
`Agents/World/PoloTable/PoloTable.lua`. A flat table `x × y × z` (default `6.3/0.04 × 1/0.04 × 2.52/0.04`)
split into halves with a central **hole/goal** of `hole_x × hole_z` (default 7×10), surrounded by skirts
and an inner-hole bottom (`:32-136`). `holeDepth = 1/0.04 = 25`. Registers `theLand`; provides an
invisible floor at `-1/0.04` and a back invisible wall. Scoring: knock the ball into the opponent's hole
— the ball is a moving `Target`/`RandomMove`-style object whose contacts are counted by behaviours
(`RandomMove` increments per-zook scores, live-reported to the HUD).

### 7.6 SwingDoor (obstacle)
`Agents/World/SwingDoor/SwingDoor.lua`. A hinged door panel + post; the hinge oscillates between
`minangle`/`maxangle` (default ±80°) driven by `velocity` (default 2) up to `maxforce` (default 1000,
capped by `max_door_strength = 10000`). `TimerUpdateDoor` reverses the motor near each limit
(`:93-106`). Panel mass 0.1. Used as a moving obstacle inside other arenas.

### 7.7 BlockPush (Trial)
`Agents/World/BlockPush/BlockPush.lua` (specializes `Env`). Creates 10 cube `Target`s on prismatic Z
joints (mass 1.3) in a line (`:15-33`). `MessageGo` posts `Finish` after **13.05s** (`:40-42`). At
finish, result = `-Vector.GetZ(endPos) - 15` of block 1, reported as `AddDetail("Trial: Block Push",
…, "cm")` (`:71-76`). Single-zook, distance-scored.

### 7.8 Hurdles (Trial)
`Agents/World/Hurdles/Hurdles.lua` (`Env`). A start line, an invisible finish target at z=-55, and four
`FixedSplitCube` hurdles of increasing height/angle (`:14-93`). `MessageGo` posts `TimeOut` after
**20.05s** (`:103-105`). Reaching the finish target (`TargetCallback`) or timing out scores
`(distance*4)/result` cm/sec; on finish the constant `70*4` cm is used (`:129-149`). Single-zook.

### 7.9 HighJump (Trial)
`Agents/World/HighJump/HighJump.lua` (`Env`). Every 0.1s `TimerMeasureHeight` tracks the zook's
`LowestPoint` and keeps `myMaxHeight` (`:26-31`). `MessageGo` posts `Finish` after **10.05s** (`:21-23`).
Result = max height (clamped ≥0), `AddDetail("Trial: High Jump", …, "cm")` (`:59-64`). Single-zook.

### 7.10 Lap (Trial)
`Agents/World/Lap/Lap.lua` (`Env`). A square track of 5 floor `Target`s, 4 capsule walls, a finish
trigger and a moving waypoint sphere `agents[11]` (`:14-91`). The zook chases a sequence of corner
`myTargetPositions`; each waypoint hit (debounced 0.5s) advances `MessageNext` (`:127-150`). After 4
corners the finish trigger `agents[10]` is armed. `MessageGo` posts `TimeOut` after **60.05s** (`:93-95`).
Result is a time in `sec` (`:152-170`). Single-zook. Sets `target_nonsolid = 1` while running.

### 7.11 SprintEnv (Trial)
`Agents/World/SprintEnv/SprintEnv.lua` (`Env`). A start line and an invisible finish wall at z=-55
(`:15-50`). `MessageGo` posts `TimeOut` after **20.05s** (`:52-54`). On reaching the finish
(`TargetCallback`) the result is `(50*4)/result` cm/sec (and `SetSprintSpeed` for v1 kits); on timeout
`(dist*4)/result` (`:78-105`). Single-zook.

### 7.12 ZookPlaceHolder
`Agents/World/ZookPlaceHolder/ZookPlaceHolder.lua` (specializes `BaseTarget`). The **editor stand-in** for
a contestant slot. It holds a `contestant` (zook file), a `movable` flag and an optional `hatpin`
position. In the editor it draws a translucent arrow and (for fixed zooks) a hatpin; it loads the zook via
`BuilderParts` for preview (`LoadZook`, `:113-126`). At contest run-time the `Contest` agent reads these
slots and replaces each with a real `Evo` (§4.2). `group` on the placeholder is what the scoring
behaviours use to tell green from red.

---

## 8. The full contest → arena → behaviour mapping

| Contest | Arena world agent(s) | Primary scoring behaviour(s) | Win condition |
|---|---|---|---|
| Dodgy Zook | `RevolvingDoor` | `RandomMove`/`ListenContact` + `Finish`/`Timer` | survive the spinning door / contact count |
| Merry-Go-Round | `Turntable` | `NoContact`/`TotalNoContact` + `Finish` | stay on the spinning disc; last on wins |
| Sumo | `TableSumo` | `NoContact`/`TotalNoContact` + `Finish` (target = surviving group) | push opponent off the dome (0/1) |
| Weakest Zook | `PushyThing` + `TableRect` + `FixedSplitCube` | `MonitorDistance` + `Finish` (push-out) | push the prismatic carriage / push opponent off |
| Zookball | `PoloTable` | `RandomMove` (ball contact counter) + `Timer`/`Finish` | most goals scored when timer fires |
| (obstacle) | `SwingDoor` | — (decorative/obstacle) | n/a |

Single-zook trials (scored directly, not behaviour-based, via `Env.AddDetail`):

| Trial | Agent | Time limit | Metric |
|---|---|---|---|
| Block Push | `BlockPush` | 13.05s | distance pushed (cm) |
| Hurdles | `Hurdles` | 20.05s | speed `(dist*4)/time` cm/sec |
| High Jump | `HighJump` | 10.05s | max height (cm) |
| Lap | `Lap` | 60.05s | lap time (sec) |
| Sprint | `SprintEnv` | 20.05s | speed `(dist*4)/time` cm/sec |

---

## 9. Numeric constants & Config keys (consolidated)

**Timing / lifecycle**
- Pre-roll: recording starts at `simTime > 1`, "Go" at `simTime >= 4`, displayed clock = `simTime - 4`
  (`ContestRunnerContest.lua:229,236,241`).
- Master update timer: 0.1s (`ContestRunnerContest.lua:195`); behaviour `Update` timer is per-tick
  (`BehaviourManager.lua:72`).
- Motion file zip compression level `6` (`ContestRunnerContest.lua:127`).
- `max_tick_size = 0.0625`, `worldscale = 1` (overridable) (`ContestFilePlayer.ssx:21,10`).

**Trial time limits**: BlockPush 13.05s; HighJump 10.05s; Hurdles 20.05s; Sprint 20.05s; Lap 60.05s
(see §7). Trial distance/speed constants: BlockPush `-15` offset; Hurdles `70*4`; Sprint `50*4`; Lap
debounce `0.5s`.

**Camera (SplitScreen)**: `camera1_zook=-1/angle=18/offset=(-200,120,200)`, `camera2_zook=0/angle=45`,
`camera3_zook=1`, `camera4_zook=5`; `min_view_angle=10`, `max_view_angle=90`, `mouse_sensitivity=0.6`
(`SplitScreen.lua:16-40`). Pitch clamp 1–89°, wheel-zoom factor `±0.001` (`:156-171`).

**Colours**: green score/preview `(0,0.7,0.4)`, red `(1,0.1,0.1)`
(`ContestRunner.lua:60`, `ContestRunnerContest.lua:38-40`); team colours
`blueteam=(0,0,0)`, `redteam=(247,38,27)/255`, `contestobject=(158,157,157)/255`
(`PushyThing.lua:29-37`); `bluescreen_colour=(0,0.667,0.678)`; `invisible_alpha=0.25`;
`panel_colour=(1,1,1,0.6)`; fog `40→80`.

**Arena geometry defaults**
- RevolvingDoor: scale `(1,10,15)`, mass 1, hinge free (`RevolvingDoor.lua:148-160`).
- Turntable: radius 20, depth 2, curvature 1000; spin ramp `+0.02`/tick, motor force `10000`, key nudge
  `±0.2` (`Turntable.lua:38-39,127,177-205`).
- TableSumo: radius `0.85/0.04`, height `1/0.04`, curvature 10000 (`TableSumo.lua:194-205`).
- TableRect: scale `(4.5/0.04, 1/0.04, 1.8/0.04)`, heightfield `kw-table.pgm` 18×13,
  `magicFloorOffset=(0,30,0)` (`TableRect.lua:18,32-41,174`).
- PushyThing: carriage mass 5, linear damping 10, X prismatic (`PushyThing.lua:114-116`).
- FixedSplitCube: sub-cube max size 4 (`FixedSplitCube.lua:45`).
- PoloTable: table `(6.3/0.04, 1/0.04, 2.52/0.04)`, hole 7×10, holeDepth `1/0.04`, floor `-1/0.04`
  (`PoloTable.lua:56,94,448-463`).
- SwingDoor: angles ±80°, velocity 2, maxforce 1000 (cap `max_door_strength=10000`), panel mass 0.1
  (`SwingDoor.lua:66,154-185`).

**Behaviour engine constants**: states `0/1/2`; event ids `ALL=-1, SYSTEM=-2, IMMEDIATE=-3,
TRIGGER_ON=-4, TRIGGER_OFF=-5, DESTROYED=-6` (`BehaviourManager.lua:16-27`). RandomMove contact debounce
`0.1s` (`RandomMove.ssx:100`). `trace_behaviours` Config toggles verbose tracing.

**Zook movement speed→step**: speed 5→0.005, 4→0.015, 3→0.05, 2→0.15, 1→0.5; SmoothStart/Stop use
speed 5 (`Evo.lua:383-456`).

---

## 10. End-to-end flow summary

1. `ContestRunner.ssx` boots the Simulator → `SimpleFrame` + `ContestRunner` UI.
2. User picks a contest and two zooks (green/red slots) → `RunContest` → `BeginContest` to
   `ContestRunnerContest`.
3. `BeginRound` creates a physics `World`, a `SplitScreen` 4-camera view, reads the round's `.contest`
   file, and creates the world-side `Contest` agent + `VideoCountdown`, and a 0.1s master timer.
4. `Contest` instantiates arena objects and turns each `ZookPlaceHolder` into a real `Evo` (frozen via
   `SmoothStop`), then creates the `BehaviourManager` from the contest's `behaviours` list.
5. Master clock: record from t≈1s, 3-2-1 overlay, then at t=4s `Go` → all zooks `SmoothStart` and
   `BehaviourManager.Start` fires the immediate-event behaviours.
6. Behaviours monitor contact/height/distance/timers and `CallManager` live scoreboards → `Contest`
   maps players→contestants→green/red → HUD updates.
7. A terminal behaviour (`Finish`, or `Winner`/`Loser`/`TotalHeightCounter`→`Finish`) produces the final
   0/1 (or counted/timed) scoreboard with `name="finish"`, ending the round.
8. `MessageEndRound` advances rounds or sends `EndContest`; the user may `Stop` and save the run as a
   `.bvz` motion file, replayable in `ContestFilePlayer`.
