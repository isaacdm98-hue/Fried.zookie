# BAMZOOKi — Overall Application Architecture, Agent Framework & UI Toolkit

> Reconstructed from decompiled Lua/SSX under `reference/decompiled/`. All citations use `path:line`
> relative to `reference/decompiled/`. SSX files are boot/config scripts run by the **Bonsai** engine;
> `.lua` files are agent classes loaded from `Agents/<Governor|World>/<Name>/<Name>.lua`.
>
> This document covers the whole application stack: how the engine boots into its **three apps**
> (Zook Kit builder, Simulator/ContestRunner, Motion Player), the **agent framework** (Create/message/
> notify, Governor vs World agents), the **UI/widget toolkit** (UIAgent + PropertyEdit + dialogs), the
> **ZookSelector / TeamSelector** load–create–import flow, the on-disk **team/creature/.zook** file
> structure, and the key **Config / product** values. The contest scoring engine itself is documented
> separately in `03-contests-and-scoring.md`; this doc focuses on architecture and UI.

---

## 1. The Bonsai Engine and the Agent Framework

### 1.1 Execution model

The product is a single native engine ("Bonsai") that runs Lua. There are three distinct entry-point
applications, each driven by a **boot SSX script** under `Boot/` (`Boot/Builder.ssx`,
`Boot/ContestRunner.ssx`, `Boot/ContestFilePlayer.ssx`, plus a variant `Boot/Builder_anamorphic.ssx`).
A boot script:

1. Sets `app_name` and runs a chain of `Execute("<ConfigScript>")` calls to populate the global
   `Config` table.
2. Creates the OS window agent `SimpleFrame` (`mainWindow`).
3. Optionally creates a `World`, then the app's root **Governor agent(s)**.
4. Calls `System.MainLoop()` — which blocks pumping the window/event loop until something calls
   `ExitMainLoop`.
5. Tears down its agents and world on return.

The global engine APIs the scripts use: `Config.Get/Set`, `Execute(scriptName, args…)`,
`ExecuteString(code, args…)`, `System.*` (file/path/zip/registry/window/build), `Agent.*`,
`World.*`, `GUI.*`, `Camera.*`, `Visual.*`, `Input.*`, `Sound.*`, `Bin.*` (encrypted-script
decrypt/read), `Socket.*` (HTTP), and math/string helpers `Number.*`, `String.*`, `Vector.*`,
`Quatn.*`, `Matrix.*`.

### 1.2 Agents: classes, instances, messages

An **agent class** is a Lua file whose first line is a header comment declaring its base class and the
engine subsystems it embeds, e.g.:

```
# Builder specializes SuperCam embeds UI, Input, Visual, Sound      Builder.lua:1
# UIAgent specializes Agent embeds Input, Camera, GUI               UIAgent.lua:1
# SuperCam specializes UIAgent embeds Camera, Input, GUI            SuperCam.lua:1
```

`specializes` is single inheritance; base-class methods are reachable with the `BaseName__Method`
mangled name, e.g. Builder calls `SuperCam__SystemCamera( frametime )` (`Builder.lua:308`) and
`SuperCam__SystemKeyDown( key )` (`Builder.lua:339`). `embeds X` grants the agent the `X.*` engine
namespace.

Lifecycle and messaging primitives:

- **Create:** `Agent.Create("ClassName", args…)` instantiates an agent and calls its global
  `Initialize(args…)` (or `Initialize(world, …)` for World agents). Returns an agent handle.
  e.g. `builder = Agent.Create("Builder", world, mainWindow)` (`Boot/Builder.ssx:46`).
- **Synchronous message + return:** `Agent.SendMessage("Name", target, args…)` dispatches to the
  target's `MessageName(args…)` handler and returns its result. e.g.
  `Agent.SendMessage("Attributes", myBuilderParts)` (`Builder.lua:91`).
- **Deferred/timed message:** `Agent.PostMessage("Name", target, delaySecs, args…)` (used by the
  Motion-Player boot to queue file opens, `Boot/ContestFilePlayer.ssx:66-69`).
- **Timers:** `Agent.SetTimer("Tick", self, "timerName", periodSecs)` fires `TimerTick()` repeatedly;
  `Agent.StopTimer(self, "timerName")`. e.g. the Builder stopwatch (`Builder.lua:770`,
  `Builder.lua:1311`) and ToolTips polling (`ToolTips.lua:15`).
- **Destroy:** `Agent.Destroy([handle])` (calls the agent's `Finalize()` then frees it);
  `Agent.Zap()` mass-destroys (`Boot/ContestFilePlayer.ssx:80`); `Agent.DestroyClass(name)` unloads a
  whole class (used to refresh downloaded online agents, `Builder.lua:1736`).
- **Validity / identity:** `Agent.IsValid(h)`, `Agent.Me()`, `Agent.From()` (sender of current
  message), `Equals(a, b)`, `Agent.Null()`, `Agent.TypeCheck(h, 1)`.
- **Reflection from code strings:** `Agent.CreateClassFromString(Bin.DecryptScript(received))`
  registers a class from a downloaded, encrypted `.sax/.sdx` script
  (`Builder.lua:1737`, `Builder.lua:2027`).

System callbacks (the engine calls these on agents that embed the relevant subsystem):

- `SystemCamera(frametime)` — per-frame camera update (`SuperCam.lua:79`).
- `SystemKeyDown(key)` / `SystemKeyUp(key)` — keyboard (`SuperCam.lua:159`/`193`).
- `SystemMouse(x, y, wheel)` — mouse motion/wheel (`SuperCam.lua:214`).
- `SystemUIMouseLDown/LUp/RDown/RUp(segment)` — GUI hit events (`SuperCam.lua:235`/`247`,
  `Builder.lua:514`/`546`).
- `SystemUIChange(segment)` — a widget (button/slider/combo/list) changed (`Builder.lua:756`).
- `SystemUIResize(segment)` — a resizer object changed size (`ContestRunner.lua:83`).
- `SystemOnExit()` — registered via `UI.SingleFrame.CallOnExit(self, "SystemOnExit")`
  (`Builder.lua:243`, `VisualFilePlayer.lua:52`).

### 1.3 Governor vs World agents

The framework splits agents into two pools, sized in the memory-config scripts:

```
Agent.SetGovernorAgentPoolSize( 10 ) + Agent.SetWorldAgentPoolSize( 50 )   MemoryConfiguration.ssx:23
```

- **Governor agents** live under `Agents/Governor/`. They are UI/controller/coordination agents:
  `Builder`, `ContestRunner`, `ContestRunnerContest`, `VisualFilePlayer`, `SuperCam`, `UIAgent`,
  `PropertyEdit`, all dialogs (`Alert`, `OKCancel`, …), the selectors (`ZookSelector`,
  `TeamSelector`, `ZookList`, `ZookPassport`, `ZookPreview`), `SplitScreen`, `GlobalKeys`, `Logon`,
  `Http`, `Photographer`, `SimplePhotographer`, `ToolTips`, `PopUpEdit`. They generally do **not**
  require a world (though many own one).
- **World agents** live under `Agents/World/` and only exist inside a `World` (physics/scene). Examples:
  `BuilderParts` (the creature genome + physical body), `BoxEnv` and all the `*Env`/trial agents,
  `Contest`, `Camera`/`BaseCamera`/`SplitCamera`, `ClickableTarget`, `BuilderGrids`,
  `ZookPlaceHolder`, `Countdown`, etc.

**World access discipline:** any code that touches a world (creating/destroying world agents, reading
sim time, sending messages into world agents) must be bracketed:

```
World.OpenAccess( myWorld )
    … create/modify world agents …
World.CloseAccess()
```

This pattern appears everywhere (e.g. `Builder.lua:89-121`, `Builder.lua:479-483`,
`SuperCam.lua:32-34`). A world is created with `World.Create()` (physics) or `World.Create(2)`
(visual-only, used by the Motion Player and previews, `Boot/ContestFilePlayer.ssx:40`,
`ZookPreview.lua` `World.Create(2)`).

### 1.4 The message / notify (callback) protocol

The pervasive pattern for "open a sub-agent, get a result back" is **caller-supplied message prefix**:

The creator passes `(notifyAgent, messagePrefix)` (or `notifyAgent, callbackMessage`) to the sub-agent.
The sub-agent calls back with `Agent.SendMessage( messagePrefix.."Suffix", notifyAgent, payload… )`,
and the creator implements `Message<Prefix><Suffix>(payload…)`. PropertyEdit formalizes this with a
family of suffixes:

```lua
function Notify( name, value)
    Agent.SendMessage( myMessagePrefix.."Notify", myNotifyAgent, name, value)        PropertyEdit.lua:560
function NotifySlide( name, value)
    Agent.SendMessage( myMessagePrefix.."NotifySlide", myNotifyAgent, name, value)   PropertyEdit.lua:576
function GetAttribute(value)
    local attr = Agent.SendMessage( myMessagePrefix.."Get", myNotifyAgent, value.name )  PropertyEdit.lua:552
```

So a host that owns a `PropertyEdit("…","Mode",…)` implements `MessageModeNotify(name,value)`,
`MessageModeGet(name)`, `MessageModeTabChange(tab)` (see Builder, `Builder.lua:847-868`,
`Builder.lua:1074-1096`). The same prefix mechanism drives the Photographer
(`Photographer` calls back `PropertyEdit*`), ZookPassport, etc.

Dialog widgets use one of two conventions:

- **Caller-supplied callback name** (`Alert`, `OKCancel`, `YesNoCancel`, `UserChoice`, `Options`,
  `TextEntry`, `FileSelector`, `Logon`). e.g. `Agent.Create("YesNoCancel", "Save changes?",
  Agent.Me(), "SaveChanges")` → host implements `MessageSaveChanges(yes)` (`Builder.lua:1392`).
- **Hard-coded message name**: `MultiPickList` → `"MultiPickListOK"`, `ImportSelector` → `"Import"`,
  `TextureSelector` → `"SetTexture"`, `PopUpEdit` → `"PopUpEditFinished"`,
  `SimplePhotographer` → `"SimplePhotographer"`.

A **dual run-mode** is built into the input dialogs (`TextEntry`, `MultiPickList`, `FileSelector`,
`Logon`): if `notifyAgent ~= nil` they message the caller and `Agent.Destroy()`; if `notifyAgent == nil`
they assume they were launched directly from a boot script and call `System.ExitMainLoop()` instead,
leaving the result to be polled with a synchronous `MessageText()`/`MessageFile()`/`MessageEntry()`
query.

---

## 2. Boot Sequences — the Three (Four) Apps

Every boot script follows the same skeleton: set `app_name`, run the config chain, create
`SimpleFrame`, create the root agent(s), `System.MainLoop()`, clean up.

### 2.1 Common config chain

| Step | Script | Purpose |
|------|--------|---------|
| `Execute("BuildConfiguration")` | `BuildConfiguration.ssx` | Package/version/builder identity (run early; sets `builder_name`). |
| `Execute("MemoryConfiguration")` / `PlaybackMemoryConfiguration` | `*.ssx` | Pre-size the engine memory pools and GC. |
| `Execute("ProductConfiguration")` | `ProductConfiguration.ssx` | Create the per-user product directory; copy default Teams/Contests/Videos. |
| `Execute("ServerConfiguration")` | `ServerConfiguration.ssx` | LAN server IP addresses (anamorphic builder, Motion Player). |
| `Execute("MakeWindowCaption", …)` | `MakeWindowCaption.ssx` | Sets `window_title`. |
| `Execute("PhysicsConstants")` | `PhysicsConstants.ssx` | Physics tuning + random seed. |
| `Execute("LoadConfigTable", dir.."/X.cfg")` | `LoadConfigTable.ssx` | Overlay a `.cfg` table of Config overrides. |
| `Execute("SoftConfiguration","Builder")` | `SoftConfiguration.ssx` | Run encrypted "soft boot" scripts from the registry (Builder only). |
| `Execute("GenomeConfiguration")` | `GenomeConfiguration.ssx` | `.zook` genome version min/max + encryption key. |
| `Execute("StudioSettings")` | `StudioSettings.ssx` | Studio/TV overrides (Motion Player only). |

### 2.2 Zook Kit Builder — `Boot/Builder.ssx`

```lua
Config.Set("app_name","Zook-kit")                                       Builder.ssx:2
Execute("BuildConfiguration")                                           Builder.ssx:3
Config.Set( "throw_bad_messages" , false )                              Builder.ssx:5
Execute("MemoryConfiguration"); Execute("ProductConfiguration")        Builder.ssx:6-7
Config.Set( "exclusive", 1 )                                           Builder.ssx:8
Execute("MakeWindowCaption", Config.Get( "full_package_string", "" ))  Builder.ssx:11
… panel/bluescreen/fog colours, target colour …                       Builder.ssx:13-29
Execute( "LoadConfigTable", dir .. "/Builder.cfg" )                    Builder.ssx:34
Config.Set("registry_key", "its mad out there")                       Builder.ssx:36
Execute("SoftConfiguration", "Builder")                               Builder.ssx:37
Execute("BuildConfiguration")  -- re-run after cfg so values aren't overwritten  Builder.ssx:38
Execute( "GenomeConfiguration" )                                      Builder.ssx:39
mainWindow = Agent.Create("SimpleFrame")                              Builder.ssx:41
world = World.Create()                                                 Builder.ssx:43
Agent.Create("GlobalKeys", world)                                     Builder.ssx:44
builder = Agent.Create("Builder", world, mainWindow)                  Builder.ssx:46
System.MainLoop()                                                      Builder.ssx:48
Agent.Destroy( builder ); World.Destroy(world); Agent.Destroy(mainWindow)  Builder.ssx:50-52
```

Agents loaded: `SimpleFrame`, one physics `World`, `GlobalKeys`, and the root `Builder`. The Builder
itself transitively creates a large tree (see §3): `BuilderParts`, `ClickableTarget`, `BoxEnv`,
`BuilderGrids`, `ToolTips`, `ZookPassport`, mode/edit `PropertyEdit` panels, `BuilderPreview`,
`ZookSelector`, `ZookList`, dialogs on demand, and online agents (`Http`, downloaded ZookHerder /
OnlineConfig / UserAuth).

`Boot/Builder_anamorphic.ssx` is the same, with `app_name = "Zook-kit - Anamorphic"`, an extra
`Execute("ServerConfiguration")` (`:4`), and `Config.Set("builder_anamorphic", 1)` (`:41`) before
creating Builder — which switches the Builder/SuperCam to a 16:9-on-4:3 projection
(`SetAnamorphic`, `SuperCam.lua:262`).

### 2.3 Simulator / Contest Runner — `Boot/ContestRunner.ssx`

```lua
Config.Set("app_name","Simulator")                                    ContestRunner.ssx:1
Execute("BuildConfiguration"); Execute("MemoryConfiguration"); Execute("ProductConfiguration")  :2-5
Execute( "LoadConfigTable", dir .. "ContestRunner.cfg" )              ContestRunner.ssx:32
Execute( "GenomeConfiguration" )                                      ContestRunner.ssx:34
Config.Set( "auto_GUI_resize", false )                               ContestRunner.ssx:35
mainWindow = Agent.Create("SimpleFrame")                             ContestRunner.ssx:37
editor = Agent.Create("ContestRunner")                              ContestRunner.ssx:40
System.MainLoop()                                                     ContestRunner.ssx:42
Agent.Destroy( editor ); Agent.Destroy(mainWindow)                  ContestRunner.ssx:44-45
```

Note: **no top-level world** here. `ContestRunner` (the UI) creates a `ContestRunnerContest` driver
that creates a fresh `World` per round. ContestRunner also creates a `ZookSelector` (hidden) and two
`ZookPreview` slots (green/red). See §6.

### 2.4 Motion Player — `Boot/ContestFilePlayer.ssx`

```lua
Config.Set("app_name","Motion Player")                                ContestFilePlayer.ssx:1
Execute("BuildConfiguration")                                         ContestFilePlayer.ssx:2
Execute("PlaybackMemoryConfiguration"); Execute("ServerConfiguration"); Execute("ProductConfiguration")  :4-6
Execute("StudioSettings")                                             ContestFilePlayer.ssx:11
Execute("PhysicsConstants")  -- just for random seed                  ContestFilePlayer.ssx:12
Config.Set("v_sync",false); Config.Set("max_tick_size", 0.0625)       ContestFilePlayer.ssx:18-21
Config.Set("texture_path", "NewTeam/Textures;Agents/World/Target")    ContestFilePlayer.ssx:22
Execute( "LoadConfigTable", dir .. "/ContestFilePlayer.cfg" )         ContestFilePlayer.ssx:36
local mainWindow = Agent.Create("SimpleFrame")                       ContestFilePlayer.ssx:38
world = World.Create(2)   -- visual-only, no physics                 ContestFilePlayer.ssx:40
Agent.Create("GlobalKeys", world)                                    ContestFilePlayer.ssx:42
local splitScreen = Agent.Create("SplitScreen", world, {} )          ContestFilePlayer.ssx:43
local visualPlayer = Agent.Create( "VisualFilePlayer", world, splitScreen )  ContestFilePlayer.ssx:44
```

Command-line handling: it parses `-f <file>` from `System.GetCommandLine()` (`:46-47`). If a file is
given it strips quotes, **unzips** the `.bvz` into `Videos/<rand>.bmv` (`System.Unzip`, `:65`), and
posts `SetTitleFromFilename` + `OpenFileNoUI` to the player (`:66-67`); otherwise it posts `SelectFile`
(`:69/72`). On exit it retrieves the temp name with `Agent.SendMessage("GetTempName", visualPlayer)`,
calls `Agent.Zap()`, and deletes the temp files (`:78-90`). See §7.

### 2.5 SimpleFrame — the OS window and the main loop gate

Every boot creates exactly one `SimpleFrame` as `mainWindow`. It is tiny but load-bearing:

```lua
# SimpleFrame specializes Agent embeds UI            SimpleFrame.lua:1
function Initialize()
    UI.SingleFrame.Create()
    UI.SingleFrame.SetTitle( Config.Get("window_title", System.BuildString()) )
function Finalize()       UI.SingleFrame.Destroy()
function MessageDestroy() Agent.Destroy()
function MessageExitMainLoop() UI.SingleFrame.ExitMainLoop()
```

`UI.SingleFrame.Create()` opens the actual OS window; `System.MainLoop()` pumps it and blocks until
`UI.SingleFrame.ExitMainLoop()` (via `MessageExitMainLoop`) or `System.ExitMainLoop()` is called.
The Builder triggers exit through `Agent.SendMessage("ExitMainLoop", myFrame)`
(`Builder.lua:1681`). `UI.SingleFrame.CallOnExit(self, "SystemOnExit")` registers a hook fired when
the user clicks the window close box (`Builder.lua:243`, `VisualFilePlayer.lua:52`), so the app can
prompt "Save changes?" before quitting.

---

## 3. Zook Kit Builder Internals

`Builder` (`Agents/Governor/Builder/Builder.lua`, ~2200 lines) is the heart of the Zook Kit and the
canonical example of how a top-level Governor agent is structured. It `specializes SuperCam`
(which itself `specializes UIAgent`), so it gets the orbit camera, key/mouse plumbing and the UI
panel helpers for free.

### 3.1 Modes

```
constEditMode = 1   constTestMode = 2   constAddMode = 4     Builder.lua:5-7
```

`SetMode(mode)` (`Builder.lua:871`) switches between the **Edit** tool (select/scale/move body parts,
edit attributes), **Add** tool (clone a part from the `BuilderPreview` palette and click to attach),
and **Test** tool (express the genome into a live physical creature, run it in an environment/trial,
run a stopwatch, take a passport photo). The mode buttons are a `PropertyEdit` "Mode" panel
(`Builder.lua:203-205`) and an "Edit" button panel (`Builder.lua:934-937`).

### 3.2 Genome / body, undo, IK

The creature body is a separate **World agent** `BuilderParts` created in `Initialize`
(`Builder.lua:90`). The Builder is essentially a controller over it via messages:
`Load`, `Save`, `Export`, `ClonePart`, `DeletePart`, `MirrorPart`, `SetAttribute`/`Attribute`,
`PartTable`, `Express`, `SetGravity`, `Modify`/`Undo`/`Redo`/`CanUndo`/`CanRedo`,
`SetIKPositions`/`IKPositions`, `GetPassportImage`/`SetPassportImage`, `Passport`, `BoundingBox`,
`AddDetail`, `AddMoniker` (e.g. `Builder.lua:1577-1593`, `1816-1825`, `1949-1960`).

Inverse-kinematics foot motion paths are edited directly on screen: IK points are GUI sprites whose
3D positions are projected each frame (`Builder.lua:323-327`, `UpdateIKUI` `Builder.lua:1856`), added/
moved/deleted by clicking near them (`IKToolMouseDown` `Builder.lua:613`, `IKToolMouseMove`
`Builder.lua:689`).

### 3.3 File menu and save/export/upload

Pressing ESC or the "File" mode action opens an `Options` menu
(`{ "New","Open","Save","Save As","Export","Send to CBBC","Passport","Website","Online Update",
"Exit","Cancel" }`, `Builder.lua:1382-1383`) routed by `MessageFileOption(option)`
(`Builder.lua:1399`). The Builder validates Zook names (≤25 chars, illegal-char list
`"/ \\ : < > | * ? \" '"`, `Builder.lua:1765`), requires a passport photo before export/upload, and
gates read-only example Zooks (`myAllowSave`). The online path (Export/Upload/Online Update/Website)
downloads and instantiates encrypted server agents over `Http` — see §8.

---

## 4. UI / Widget Toolkit

### 4.1 UIAgent — the panel/button/tab primitives

`UIAgent` (`Agents/Governor/UIAgent/UIAgent.lua`) is the shared GUI base. It draws everything from a
single 9-slice texture atlas `"./UI/"..Config.Get("ui_texture","UI.png")` (`UIAgent.lua:38`) tinted by
the global panel colour:

```lua
function PanelColour()                                              UIAgent.lua:9
    return Config.Get("panel_colour_red",1), …green,blue, Config.Get("panel_colour_alpha",0.6)
```

Key helpers (all created on whatever GUI parent layer is passed in):

- `AnySegment()` / `LastSegment()` — anonymous incrementing segment names so unnamed graphics can be
  colour-set (`UIAgent.lua:4`, `:17`).
- `AddPanelGlow(l,t,r,b)` — a soft border via `GUI.CreateBorder` (`UIAgent.lua:21`).
- `AddPanel( left, top, right, bottom, tlRound, trRound, blRound, brRound, glowLayer, panelLayer )` —
  the workhorse rounded panel: a glow border plus 9 textured rectangles (4 corners chosen rounded or
  square by the `*Round` flags, 4 edges, 1 centre), each tinted by `PanelColour()`
  (`UIAgent.lua:27-75`).
- `AddPanelButton( name, label, x, y, x2, y2, parent )` — a panel-backed text button:
  `AddPanel(...)` + `GUI.CreateButtonEx(name, …, "UI\\Buttons\\UI_Blank_Up/_Dn/_Ov.png")` + a centred
  label measured with `GUI.MeasureText` (`UIAgent.lua:77-89`).
- `AddButton( name, x, y, iconRoot, helpText )` — a 32×32 icon button from
  `UI\Buttons\UI_<iconRoot>_Up/_Ov/_Dn.png` with a tooltip (`UIAgent.lua:91-96`,
  also redefined in Builder `Builder.lua:1283`).
- `AddTabButtons( left, top, right, bottom, names, labels, layer )` — builds a tab strip: a clickable
  tab button + a `<name>_tab_layer` GUI object per tab, all hidden except the first; the panel body
  sits below the tabs (`UIAgent.lua:98-133`).

The raw GUI calls these wrap (`GUI.*`): `CreateObject` (a layer/rect), `CreatePicture`, `CreateText`,
`CreateTextEdit`, `CreateSlider`, `CreateCombo`, `CreateList`, `CreateButton`/`CreateButtonEx`,
`CreateBorder`; plus `SetParent`, `Show`, `Resize`, `ToFront`, `SetColour`, `SetText`,
`SetListText`, `GetText`, `GetValue`/`SetValue`, `GetListSelectedText`, `SetHelpText`,
`SetButtonPushed`, `Enable`, `MeasureText`, `Area`. GUI uses a **parent stack**: `GUI.SetParent(seg)`
nests subsequently-created widgets under `seg`; `GUI.SetParent()` (no arg) resets to root. Segments are
referenced by id via `Segment.<name>` or `Segment.GetId("name")`, destroyed with `Segment.Destroy`.

### 4.2 SuperCam — orbit camera + screen layout

`SuperCam` (`Agents/Governor/SuperCam/SuperCam.lua`) adds an orbit/free camera over UIAgent. It creates
the `Camera`, registers movement keys (WASD/QZ/arrows, +/- zoom, Home reset, shift = speed), and a
full-screen invisible `click_layer` GUI object that captures mouse picks (`SuperCam.lua:64`). Camera
modes are `"Edit"`, `"Follow"`, `"Cool"`, `"Free"` (`SystemCamera`, `SuperCam.lua:79-156`). It exposes
`SetAspect(vAngle)` (4:3) and `SetAnamorphic(vAngle)` (16:9-on-4:3) (`SuperCam.lua:262-275`),
`MessageShowBackground(show)` (toggles fog/sky vs. blue-screen, `SuperCam.lua:278`), `MessagePick()`,
and `SetScreenAndPanelSize(panelWidth, anamorphic, letterboxed)` which computes the letterbox region
and right-hand panel rectangle the Builder lays its panels into (`SuperCam.lua:302-332`).

### 4.3 PropertyEdit — the data-driven property panel

`PropertyEdit` (`Agents/Governor/PropertyEdit/PropertyEdit.lua`) is the most important widget: a
declarative, tabbed form generator. It is created with:

```lua
Agent.Create( "PropertyEdit", left, top, right, notifyAgent, messagePrefix, format, parameters )
                                                                   PropertyEdit.lua:6
```

`parameters` is an array of field descriptors; each descriptor's shape selects the control rendered in
`CreateUI` (`PropertyEdit.lua:113-280`):

| Field key | Control | Notes |
|-----------|---------|-------|
| `enum = {…}` | combo box | `GUI.CreateCombo` + `SetListText` (`:168-175`) |
| `check = …` | checkbox (icon button) | (`:176-178`) |
| `button_enum = {{value,icon,help},…}` | row of radio/toggle icon buttons | radio if `Get` returns a value, multi-toggle otherwise (`:179-188`, `UpdateButtonEnum` `:530`) |
| `list = …` (`listtype="edit"`) | list + "edit" button → `MultiPickList` | (`:189-208`, `:775-787`) |
| `button = …` | panel button | (`:209-225`) |
| `edit = …` | text edit | (`:226-229`) |
| `red/green/blue` | colour wheel picker | `colour_circle_no_bs.png`, picks pixel colour on click (`:230-237`, `:844-854`) |
| `text = …` | static text | (`:238-241`) |
| `vector = …` | x/y/z spinners + text edits | drag spinners notify per-axis (`:242-253`, `SystemMouse` `:878`) |
| `texturesize = …` | scrollable texture grid pane | `CreateTexturePane`/`PopulateTexturePane` (`:254-263`, `:284-373`) |
| *(default)* | slider | right-click → `PopUpEdit` numeric entry (`:265-270`, `:893-905`) |

Each field can carry `label`, `tab`, `icon`, `default`, `min`/`max`/`scale`, `top` (extra gap). Multiple
distinct `tab` values trigger a tab strip via `AddTabButtons`; `CalcHeight` sizes the panel to the
tallest tab (`PropertyEdit.lua:49-80`).

Data binding is entirely message-driven through the prefix:

- **Read:** `GetAttribute(value)` → `Agent.SendMessage(prefix.."Get", notifyAgent, value.name)`,
  falling back to `value.default` (`PropertyEdit.lua:550-558`). `MessageUpdateAll()` repaints every
  control from current values (`:377-450`).
- **Write:** changing a control fires `SystemUIChange(segment)` (`:696-829`) which calls `Notify`,
  `NotifySlide`, or `NotifyVectorX/Y/Z` → `Agent.SendMessage(prefix.."Notify[…]", notifyAgent, name,
  value)`. Sliders distinguish a *drag* (`NotifySlide`, on `SystemUIChange`) from a *release*
  (`Notify`, in `SystemUIMouseLUp`, `:869-876`) so hosts can do cheap live updates and one final commit.
- **Tabs:** clicking a tab fires `MessageShowTab` → `Agent.SendMessage(prefix.."TabChange",
  notifyAgent, tab)` (`:831-842`).
- **Defaults:** `format.initalize_all` makes it push every field's `default` back via `Notify` once
  (`InitializeAll`/`SetDefault`, `:580-629`).

External control messages: `MessageUpdateAll`, `MessageEnableButton(name,value,enable)`,
`MessageShowTab`, `MessageSetEnumList/Text`, `MessageSetList/ListText`, `MessageUpdateTextures`,
`MessageShow`, `MessageGetBottom`, `MessageHeight`, `MessageSetLeft`, `MessageGetFocus`/`ReleaseFocus`.

### 4.4 PopUpEdit and ToolTips

- `PopUpEdit(x, y, text, notify)` (`PopUpEdit.lua`) — a floating one-line numeric/text editor placed at
  the cursor, committed on RETURN or by clicking the full-screen catcher; sends
  `"PopUpEditFinished"(self, text)`. PropertyEdit uses it for precise slider values
  (`PropertyEdit.lua:902`, callback `MessagePopUpEditFinished` `:907`).
- `ToolTips()` (`ToolTips.lua`) — a singleton overlay (4 layered graphics: shadow, outline, pale-yellow
  back, text). A 0.10 s timer polls `GUI.GetTooltipString()` and, when it changes, positions the box
  near the mouse with on-screen clamping and shows/hides it (`ToolTips.lua:5-53`). The Builder, the
  Motion Player and the Photographer each create one.

---

## 5. Widget Dialog Agents (reference)

All dialogs derive from UIAgent, centre themselves with `GUI.Area()`, and tear down with
`Agent.Destroy()`. Creation signatures and callbacks:

| Agent | `Initialize(...)` | Result it sends back |
|-------|-------------------|----------------------|
| `Alert` | `( text, acknowledge, message, width )` — `text` string or line-table; `width<0` = full width; no OK button if `acknowledge==false` (modal, dismiss via `MessageDestroy`) | `Message<message>()` (no payload) on OK, only if the target is a valid agent |
| `OKCancel` | `( text, notifyAgent, callbackMessage )` | `<callbackMessage>(1)` on OK, `(false)` on Cancel |
| `YesNoCancel` | `( text, notifyAgent, callbackMessage )` | `<callbackMessage>(1)` Yes, `(false)` No; Cancel sends nothing |
| `UserChoice` | `( text, choices, notifyAgent, callbackMessage )` | `<callbackMessage>(self, choiceIndex)` |
| `Options` | `( options, buttonWidth, notifyAgent, callbackMessage )` — vertical button menu | `<callbackMessage>(index)` |
| `TextEntry` | `( notifyAgent, prompt, text, message, allowCancel )` | `<message>(enteredText)` on OK (RETURN = OK) |
| `Logon` | `( notifyAgent, message, text, username, password, username_label, password_label )` | `<message>(username, password)` |
| `MultiPickList` | `( notifyAgent, title, masterList, selectedList )` — dual move-between list | `"MultiPickListOK"(selectedList)` |
| `FileSelector` | `( notifyAgent, callback, title, buttonName, path, extension, allowTextEntry, splashWindow )` — can spawn its own `SimpleFrame` | `<callback>(file, fileWithExtension)` |
| `ImportSelector` | `( notify )` — lists `*.zook` on the Desktop (`EXPORT` path) | `"Import"(fullPath, name)` |
| `TextureSelector` | `( notifyAgent, directory, left, top, right, bottom )` — texture grid | `"SetTexture"(textureName)` |
| `PopUpEdit` | `( x, y, text, notify )` | `"PopUpEditFinished"(self, text)` |

`FileSelector` is the richest: it filters out a `CVS` directory, strips extensions for display, supports
type-in (`allowTextEntry`), labels Cancel as "Don't Save" in Save mode, and reconciles the chosen
extension. `Alert`/`UserChoice` normalize `text` to a line table so a callout can pass either a string
or `{"line1","line2",…}`.

---

## 6. ZookSelector / TeamSelector — load • create • import

### 6.1 On-disk file structure

Canonical layout (created/copied by `ProductConfiguration.ssx`):

```
<product_directory>/                         (per-user app-data dir, e.g. .../BAMZOOKi)
  Teams/
    myZooks/                                 (user team — clone of ROOT/NewTeam)
      Creatures/
        <CreatureName>/
          1.0.zook        2.0.zook  …        (versioned genome files; numeric filenames)
          PhotoAlbum/
            passport_image.bmi               (archive "Image Version 1.0")
            <timestamp>.bmi / 0_recent.bmi   (album photos)
      Textures/           (*.bmp/*.png/*.bmi shared by the team's creatures)
      Components/          (saved body-part library)
      zook_list.tab        (cached scan of the team's creatures + passport details)
  Contests/  Videos/  ContestPacks/
  Bonsai/Scripts/  Bonsai/Agents/Governor/  Bonsai/Agents/World/   (soft-boot drop-ins)
  TeamSelection.dat        (last-loaded {team, creature})
  Registry.sdx             (encrypted key/value registry — usernames, web_service, soft_boot)
```

A Zook on disk = `<teamsRoot>/<team>/Creatures/<creature>/<version>.zook`. `theTeams` is
`Config.Get("default_teams_directory")` for `myZooks` (writable) or
`System.GetLabeledPath("ROOT").."/Teams/"` for the read-only **Examples** team. Versions are floats
stored as the filename (`1.0`, `2.0`, …); default `"1.0"`; `myMaxVersion` is the floored max. Example
Zooks sort oldest-first, user Zooks newest-first. New teams/creatures are made by `System.CopyDirectory`
of the template `ROOT/NewTeam` / `ROOT/NewCreature` (`Builder.lua:1497`, `ZookSelector` team create).

### 6.2 ZookList — the team scanner/cache

`ZookList(team)` (`Agents/Governor/ZookList/ZookList.lua`, `# ZookList specializes UIAgent embeds XML`)
scans `Creatures/`, and for each creature asks a lazily-created `ZookPassport` for
`(details, version)`, building a `zook_list` tree of `{name, version, …details}` nodes. The result is
cached to `<team>/zook_list.tab` (`System.WriteTable`). `LoadZookList()` reuses the cache unless
`CompareZookList` finds it stale (count or membership changed), then regenerates. `MessageModifyEntry`/
`MessageRemoveEntry` keep the cache in sync when a Zook is saved/deleted. It also deletes legacy
`hardsaved.tab` files on scan.

### 6.3 ZookSelector — the modern "choose a Zook" modal

`ZookSelector` **`specializes ZookList`**, inheriting all the scan/cache functions, and owns a live
`ZookPassport` preview panel. Signature:

```lua
function Initialize( team, creature, notifyAgent, allowNew, allowCancel, allowImport,
                     allowInternet, destroyOnSelect, selectTeams )      ZookSelector.lua:9
```

It builds a 780×500 modal with three source tabs — **Website Zooks** / **My Zooks** / **Examples**
(`ZookSelector.lua:52-60`) — a sortable creature list, a "View internet passports" toggle, and action
buttons (New / Desktop[import] / Open / Delete / Cancel, conditioned on the `allow*` flags). It restores
the last selection from `TeamSelection.dat` (`:106-111`).

Flows and the host protocol (the agent that opens a ZookSelector must implement these):

- **Open:** `LoadCreature()` validates the pick, asks the host `MessageOKLoadCreature(team, creature,
  version)`, writes `TeamSelection.dat`, then `Agent.SendMessage("LoadCreature", host, team, creature,
  version, maxVersion)` (`ZookSelector.lua:525-558`). The Builder implements `MessageLoadCreature`
  (`Builder.lua:1543`) which loads the `.zook` into `BuilderParts`.
- **New:** sends `"NewCreature"(team, self)` to the host; the host pops a `TextEntry`, copies
  `ROOT/NewCreature`, and replies `NewCreatureCreated(name)` (`Builder.lua:1464-1511`).
- **Import:** opens `ImportSelector(host)`; the host receives `"Import"(fullPath, name)` and loads +
  prompts Save-As (`Builder.lua:2167`).
- **Delete:** confirm via `UserChoice` → `ConfirmDelete` → `System.DeleteFile` + cache `RemoveEntry`.
- **Website:** downloads/decrypts the **ZookHerder** + **OnlineConfig** server agents over `Http`,
  browses categories/lists by DB id, downloads a Zook to a temp file and routes it through the host's
  `"Import"` (`ZookSelector.lua:561-569`, web pipeline `:643-793`).

`ZookPassport` (`Agents/Governor/ZookPassport/ZookPassport.lua`) renders the selected Zook: a rotating
3D hologram (its own `World(2)` + `BuilderParts`) plus a tabbed `PropertyEdit` form
(General / Hologram / History / Achievement / per-detail tabs) built from the passport XML tree, and it
files the passport photo into `PhotoAlbum/passport_image.bmi`. `ZookList` reuses it headlessly via
`MessageGetDetails(team, creature)` → `LoadDontExpress` → `GetDetails`.

### 6.4 TeamSelector — the legacy selector

`TeamSelector` (`# TeamSelector specializes UIAgent embeds Input, Camera, Visual`) is the older
equivalent that ZookSelector+ZookList+ZookPassport replaced. It has its own inline rotating 3D preview
(a `BuilderParts` in a self-created world, `CreatePreview` + `SystemCamera` yaw spin) rather than
delegating to a passport, and a simpler myZooks/Examples + creature-list + version flow. It speaks the
**same host protocol** (`OKLoadCreature`, `LoadCreature(team, creature, version, maxVersion)`,
`NewCreature`, `Import`, `ConfirmDelete`) and writes the same `TeamSelection.dat`.

`ZookPreview` (`Agents/Governor/ZookPreview/ZookPreview.lua`) is the standalone lightweight rotating
preview window used by ContestRunner's two slots — a thin wrapper over a `BuilderParts` in a `World(2)`
with `MessageLoad(team, creature, version)` / `MessageResize` / `MessageMutate` / table get/set.

---

## 7. Simulator (ContestRunner) and Motion Player

### 7.1 ContestRunner — pick contestants, run a contest

`ContestRunner` (`# ContestRunner specializes UIAgent`) presents a contest list (read from
`ContestPacks/*.dat`, `ReadContestDefinitions` `ContestRunner.lua:141`), a contest-picture pane, and
two clickable contestant slots backed by `ZookPreview` agents (green `{0,0.7,0.4}` / red `{1,0.1,0.1}`,
`ContestRunner.lua:60-78`). It creates a hidden `ZookSelector` for picking creatures and a
`ContestRunnerContest` world-driver (`ContestRunner.lua:23-24`).

Clicking a slot shows the selector (`SetTemporaryName` + `Show`); the chosen creature comes back through
the standard `MessageLoadCreature`/`MessageImport` handlers (`ContestRunner.lua:198-214`). **Go**
(`RunContest`, `:219`) validates both slots, resolves each to a `{fullname=<…/version.zook>}`, hides the
UI and sends `BeginContest(contestName, contestDef, contestants)` to `ContestRunnerContest`.

`ContestRunnerContest` (`# … specializes UIAgent embeds Input, Visual`) drives the simulation per round:
`BeginRound` creates a fresh `World.Create()`, a `SplitScreen` camera, the `Contest` world agent and a
`VideoCountdown`, runs a 0.1 s sim timer, and **records the simulation** — at `simTime>1` it opens
`World.OpenVisualOutput(Videos/TempSaveVideo.bmv)` and starts a `World.WriteVisual()` timer; at
`simTime>=4` it sends `Go` to the Contest. **Stop** closes visual output and opens a `FileSelector`
to save a `.bvz`; on confirm it `System.Zip`s the temp `.bmv` into the chosen `.bvz` under
`My BAMZOOKi/Motion Files`. Score/time HUD text is updated from `MessageBehaviourReport` per the
contest's `score` field (`green`/`red`/`both`). On end it sends `ContestFinished` back to ContestRunner.
(Full scoring/behaviour engine: see `03-contests-and-scoring.md`.)

### 7.2 Motion Player — `VisualFilePlayer`

`VisualFilePlayer(world, splitScreen)` (`# VisualFilePlayer specializes UIAgent embeds UI, Visual`)
plays back the recorded motion files. File formats: **`.bmv`** = raw visual stream
(`World.OpenVisualOutput`/`WriteVisual` ↔ `OpenVisualInput`/`ReadVisual`/`SeekVisual`);
**`.bvz`** = a zip-compressed `.bmv` (`System.Zip`/`System.Unzip`).

The messages the boot script drives it with:

- `MessageSelectFile()` — native picker under `My BAMZOOKi\Motion Files` for `*.bvz`; empty → exit
  (`VisualFilePlayer.lua:72-83`).
- `MessageOpenFile(filename)` / `MessageOpenFileNoUI(filename)` — show "Loading…", then post
  `InternalOpenFile`; the No-UI variant skips the title (the boot script already set it for the
  command-line case) (`:86-103`).
- `MessageInternalOpenFile(filename)` — if `.bvz`, `System.Unzip` to `myRandomTempName` (a `.bmv` in
  `Videos/`); then `World.EraseRemoteVisuals()` + `World.OpenVisualInput`; rejects incompatible
  versions via an `Alert` (`:128-174`).
- `MessageSetTitleFromFilename(path)` — strip dir/ext to a title and forward
  `SendMessage("SetTitle", mySplitScreen, title)` — the title is rendered by the SplitScreen overlay
  (`:109-125`).
- `MessageGetTempName()` — returns the unzipped temp path so the boot script can delete it on exit
  (`:105-107`).

Transport UI (`CreateUI`, `:295-329`): Play/Pause, Eject(stop), a time slider (shuttle/seek), a Loop
checkbox. `TimerUpdate` ticks at 0.02 s calling `World.ReadVisual(speed)`; `time<0` means end →
`Stop` (or loop seek to 0/1). Stop/ESC raise an `Options` menu (Resume/Restart/Choose Video/Quit).

### 7.3 SplitScreen + SplitCamera

`SplitScreen(world, cameraSpec)` (`# SplitScreen specializes UIAgent embeds GUI, Input`) manages one
large main `SplitCamera` plus a row of 4 small `SplitCamera`s. Per-view defaults
(`cameraN_zook/target/offset/angle`) come from Config (documented in `ContestFilePlayer.ssx:26-30`).
Clicking a small view promotes it (`SetView`/`GetView`); right-drag orbits the selected view; the wheel
zooms (clamped to `min_view_angle`/`max_view_angle`). `MessageSetTitle` draws the corner title panel;
`J` saves a screenshot via `SaveScreen`.

---

## 8. Networking, Auth, and Encrypted Online Agents

`GlobalKeys(world)` (`# GlobalKeys specializes Agent embeds Input`) is a pure hotkey agent that toggles
render/debug Config flags: `Ctrl+W` wireframe, `Ctrl+V` v_sync, `Ctrl+I` show_invisible (gated by
`allow_show_invisible`), `Ctrl+S` show_shadows, `Ctrl+R` show_bumps, `Ctrl+K` physics_lines,
`Ctrl+Shift+M` monitor/agent_trace, `Ctrl[+Shift]+P` performance bars/socket, `Ctrl+B` background
toggle (sends `Show`/`ShowBackground` to `theLand`/`theCamera`) (`GlobalKeys.lua:29-94`).

`Http(server)` (`# Http specializes Agent embeds Socket`) is an async HTTP client over the
`Socket.Http*` API with multipart upload. Protocol: caller sends `MessageUploadData(path, data,
notifyAgent, notifyMessage)` or `MessageGet(path, notifyAgent, notifyMessage)`; Http runs a 0.02 s
`Recieve` timer pumping `Socket.HttpRecieve`/`HttpComplete`/`HttpError` and finally calls back
`notifyMessage(receivedBin, error)` (`Http.lua:33-92`). `MessageGetServer` lets callers detect a server
change and recreate the connection (`Builder.lua:2055-2069`).

`Logon(notifyAgent, message, text, username, password, …)` is the member-name/password modal used
before Export/Upload; on OK it calls back `<message>(username, password)` (boot-mode falls back to
`System.ExitMainLoop` + `MessageEntry`).

The online flow (Builder Export/Upload/Online Update, `Builder.lua:2007-2143`) is: `WebConfiguration`
chooses the service and server; `Http.Get` downloads the encrypted online-config agent
(`.sax`); `Bin.DecryptScript` + `Agent.CreateClassFromString` instantiate it; it reconfigures Config;
then the ZookHerder (upload) or UserAuthentification agent is downloaded the same way and run. Credentials
are persisted in the encrypted `Registry.sdx` via `AccessCodedTableKey`. `SoftConfiguration.ssx` uses the
same registry + `Bin.DecryptScript` to run encrypted "soft boot" drop-in scripts at startup.

### 8.1 Photographer / SimplePhotographer

`SimplePhotographer(world, transform, image, notifyAgent)` is the minimal passport-photo dialog: it
shows the current photo (if any) next to a fresh `Camera.GetImageAsString()` grab and Replace/Use/Cancel;
on accept it sends `"SimplePhotographer"(newImage)` back (`SimplePhotographer.lua`). The Builder Test
panel uses it (`Builder.lua:1322-1334`).

`Photographer(world, notifyAgent, message, cameraPos, targetPos, photoSize, cameraMode, path, pickImage,
title, numAlbumPics, anamorphic, letterboxed)` is the full photo studio: an animated camera transition,
a `BaseCamera` live preview, and a `PropertyEdit` panel with an album/gallery texture pane, set-pick,
delete, camera-mode (Follow/Cool/Free), and Close. It writes `.bmi` archive images into the album and on
Close calls back `<message>(path, pickImage, cameraPos, targetPos, angle, yaw, distance, cameraMode)`
(`Photographer.lua`).

---

## 9. Config & Product Settings Reference

### 9.1 Build / product identity (`BuildConfiguration.ssx`, `ProductConfiguration.ssx`)

```
package_name        "BAMZOOKi"                                    BuildConfiguration.ssx:23,36
package_version     "3.1"                                         BuildConfiguration.ssx:24,40
builder_name        "BAMZOOKi Zook Kit" (or "… Extra")           BuildConfiguration.ssx:26,46
bamzooki_extra      0 normally, 1 if "… Extra"                    BuildConfiguration.ssx:49-53
product / product_name  "BAMZOOKi"                                BuildConfiguration.ssx:56-57
install_build_num   "115"                                         BuildConfiguration.ssx:29,65
the_package_string  package_name.." "..app_name.." v"..version   BuildConfiguration.ssx:66
full_package_string the_package_string.." (build <inst>.<build>)" BuildConfiguration.ssx:67  (window title)
product_directory   System.CreateHomeDirectory(product)           ProductConfiguration.ssx:10-11
default_teams_directory  <product_dir>/Teams/                      ProductConfiguration.ssx:38
registration_email  "register@gamewaredevelopment.com"            ProductConfiguration.ssx:41
```

`studio_mode` (in-house) redirects `product` and all paths to `.` (`BuildConfiguration.ssx:70-72`,
`ProductConfiguration.ssx:1-5`). On first run ProductConfiguration copies `ROOT/NewTeam` → `myZooks`,
`ROOT/Contests` → `Contests`, and makes `Videos` + `Bonsai/Scripts|Agents` drop-in dirs
(`ProductConfiguration.ssx:19-39`); it locks writes to the product dir only
(`AddValidWriteSubdir` / `RemoveValidWritePath`, `:14-16`).

### 9.2 Genome / `.zook` versioning (`GenomeConfiguration.ssx`)

```
genome_min_version       1                          GenomeConfiguration.ssx:8
genome_current_version   2                           (Builder accepts versions 1..2)  :9
genome_rhesus_macaque    "macaca mulatta"            .zook archive encryption password :10
genome_archive_header    "…not compatible…upgrade…"  :12
genome_force_save_archive 1                          force encrypted archive format    :7
```

Version gating is enforced by `MessageOKVersion` (`Builder.lua:1532-1540`).

### 9.3 Rendering / scene Config (boot scripts)

```
panel_colour_red/green/blue 1,1,1   panel_colour_alpha .6        Builder.ssx:17-20  (UI tint)
bluescreen_colour_red/green/blue 0, .6667, .678                  Builder.ssx:21-23  (chroma-key bg)
fogging 1   fog_start 40   fog_end 80                            Builder.ssx:24-26
target_red/green/blue 1,0,0                                      Builder.ssx:27-29
exclusive 1                                                      (fullscreen)        Builder.ssx:8
ui_texture "UI.png" (default)                                    UIAgent.lua:38
auto_GUI_resize / auto_set_inertial_tensor / physically_connected_integrity  various boots
worldscale (StudioSettings 0.04; ContestFilePlayer default 1)   StudioSettings.ssx:15
v_sync false   max_tick_size .0625   shadow_catcher_height -6.25  ContestFilePlayer.ssx:18-21
```

### 9.4 Physics (`PhysicsConstants.ssx`)

```
Number.randomseed(System.AbsoluteTime())                        PhysicsConstants.ssx:1
Cardan_Stiffness 1000   Cardan_Damping 100000   AngularApproachSpeed 4   :5-10
contest_unit_scale 40   max_tick_size 0.02   pixel_offset 0.5            :4,11,12
unknown_physics_error_message  "…simulation error…exit."                 :2
```

### 9.5 Memory pools (`MemoryConfiguration.ssx` / `PlaybackMemoryConfiguration.ssx`)

GC `SetGC(30, 20, …)`; governor pool 10, world pool 50; message-stack 50; function/string pools scaled
per agent; Vector/Quatn/Spot/Matrix pools sized off active agents (`MemoryConfiguration.ssx:15-66`).

### 9.6 Web / server (`WebConfiguration.ssx`, `ServerConfiguration.ssx`)

`WebConfiguration(option)` chooses a **service** (`"CBBC"` for the BBC product, `"Gameware"` for the
extra/upgrade) and sets `web_server`, `web_agent_path`, `web_online_configuration_agent`,
`web_registration_site`, `web_site_url`. CBBC live → `www.bbc.co.uk` `/cbbc/bamzooki/bonsai/agents/`
with `OnlineConfigCBBC`; Gameware → `www.zooklabs.com` `/bonsai/agents/` with `OnlineConfigGW`
(`WebConfiguration.ssx:25-67`). `ServerConfiguration.ssx` sets LAN IPs (`server`, `rmt_server`,
`contest_monitor_server`) and `visual_broadcast 0.02`.

### 9.7 Encrypted registry helper (`AccessCodedTableKey.ssx`)

```lua
function main(path, file, encryption_key, mode, key, value)     AccessCodedTableKey.ssx:5
    -- read/write a single key in System.Read/WriteArchiveTable(<path>/<file>, encryption_key)
    -- HEADER = "Coded table Version 1."
```

Wrapped by `AccessRegistry(mode, key, value)` in several agents, always against
`<product_directory>/Registry.sdx` with `registry_key = "its mad out there"`
(`Builder.lua:2000-2004`, `Builder.ssx:36`).

---

## 10. Rebuild Checklist (how the pieces fit)

1. **Engine** providing the global namespaces (`Config/Agent/World/GUI/Camera/Visual/Input/Sound/System/
   Bin/Socket` + math) and the agent VM (single-inheritance classes, `Initialize`/`Finalize`/`Message*`/
   `System*`/`Timer*` dispatch, Governor+World agent pools, world-access locking).
2. **Boot SSX runner** that executes `Boot/<App>.ssx`, which runs the config chain, creates
   `SimpleFrame`, the world(s) and the root agent, then `System.MainLoop()`.
3. **UIAgent** panel/button/tab atlas toolkit → **SuperCam** orbit camera + screen layout → **PropertyEdit**
   data-driven form, all message-bound through a caller-supplied prefix.
4. **Dialog agents** (Alert/OKCancel/YesNoCancel/UserChoice/Options/TextEntry/Logon/MultiPickList/
   FileSelector/ImportSelector/TextureSelector/PopUpEdit) and the **ToolTips** overlay.
5. **App roots**: `Builder` (Zook Kit, modes Edit/Add/Test over `BuilderParts`), `ContestRunner` +
   `ContestRunnerContest` (Simulator, records `.bmv`→`.bvz`), `VisualFilePlayer` + `SplitScreen`
   (Motion Player).
6. **Selection subsystem**: `ZookSelector` (⊂`ZookList`) + `ZookPassport` (+ legacy `TeamSelector`,
   `ZookPreview`), over the `Teams/<team>/Creatures/<creature>/<version>.zook` layout with
   `zook_list.tab` cache, `TeamSelection.dat`, and `PhotoAlbum/*.bmi`.
7. **Online layer**: `Http` async client + downloaded/decrypted server agents (OnlineConfig, ZookHerder,
   UserAuth), `Logon`, and the encrypted `Registry.sdx` via `AccessCodedTableKey`.

---

*Primary sources:* `Boot/*.ssx`; `*.ssx` config scripts; and `Agents/Governor/{Builder, ContestRunner,
ContestRunnerContest, VisualFilePlayer, SplitScreen, SuperCam, UIAgent, PropertyEdit, PopUpEdit,
ToolTips, ZookSelector, TeamSelector, ZookList, ZookPreview, ZookPassport, Photographer,
SimplePhotographer, GlobalKeys, Logon, Http, Alert, OKCancel, YesNoCancel, UserChoice, Options,
TextEntry, MultiPickList, FileSelector, ImportSelector, TextureSelector, SimpleFrame}/*.lua`.
