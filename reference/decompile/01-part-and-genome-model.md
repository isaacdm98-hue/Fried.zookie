# 01 — Part / Genome Model & the Zook Kit Builder

Source: `reference/decompiled/Agents/World/BuilderParts/BuilderParts.lua` (BP),
`reference/decompiled/Agents/Governor/Builder/Builder.lua` (B),
`PropertyEdit.lua` (PE), `BuilderGrids.lua` (BG), `BuilderPreview.lua` (PV),
`SuperCam.lua` (SC), `UIAgent.lua` (UI), `Boot/Builder.ssx`.

## 1. The genome = a tree of `bodysolid` parts
- A Zook is a recursive tree of `bodysolid` nodes. Root found via
  `FindFirstDescendantOfType(table,"bodysolid")` (BP:157,367). Only children with
  `element_type=="bodysolid"` are sub-parts.
- A non-root part connects to its parent through a `cardanconnector` child added on
  creation (BP:1206-1207).
- **There is no separate "leg" object. A leg is just a `bodysolid` whose `leg_type`
  property is 1 or 2.** This is the unified model the rebuild must use: you make a
  blob and give it movement; legs are blobs.
- Genome also carries `passport` (ownership/details) and `photo_album`. Version:
  `genome_current_version=2`.

## 2. Connection geometry — `UpdatePositions` (BP:1612-1661)
For each child, given `theta` (elevation, X) and `phi` (azimuth, Y):
1. Direction ray from parent centre = `RotateX(theta)·RotateY(phi)` (BP:1619-1620).
2. `Visual.Ray` finds where that ray hits the **parent surface** (BP:1630).
3. Child placed there, offset out by `(0,0,scalez/2)` so its near face sits ON the
   surface (BP:1622).
4. Child orientation adds `roll`(Z)·`pitch`(X)·`yaw`(Y) (BP:1624-1626).
- Anchor helpers (local +Z = length axis): proximal/joint end `(0,0,-scalez/2)`,
  distal/foot end `(0,0,+scalez/2)`, centre = node position.
- **Implication for the rebuild:** a part's joint sits at its proximal end on the
  parent surface. Reproduce this or limbs float.

## 3. Required attributes & defaults — `myRequiredAttributes` (BP:88-117)
| name | label | default | min | max |
|---|---|---|---|---|
| mesh | Mesh | "Blob" | enum {Cube,Sphere,Blob} | |
| scalex/scaley/scalez | Width/Height/Length | 1 | 0.1 | 3 |
| theta | Elevation | 0 | −90 | 90 |
| phi | Position | 0 | −180 | 180 |
| roll/pitch/yaw | Twist / Up-Down / Left-Right | 0 | −180 | 180 |
| bias | Pointiness | 0.5 | 0 | 1 |
| flatness | Flatten End | 0 | 0 | 1 |
| asymmetry | Flatten Side | 0 | 0 | 1 |
| cubosity | Squareness | 0 | 0 | 1 |
| muscle_stiffness | (hidden) | 1000 | 1 | 10000 |
| muscle_damping | (hidden) | 1000 | 1 | 10000 |
| leg_phase | Movement Cycle | 0 | 0 | 1 |
| max_spine_angle | Part Targeting Angle | 30/45 | 0 | 90 |
| min_spine_target_angle | (hidden) | 180 | 0 | 180 |
| colour_red/green/blue | RGB | 1 | 0 | 1 |
| brightness | Brightness | 1 | 0 | 1 |
| texture | Texture | "bare" | | |
- density implicit = 1 (BP:969); passport weight uses ×4 unit scale per axis (BP:971).
- `leg_type`, `ik_side`, `spine`, `zook_speed`, `turn_sharpness`, `turn_smoothness`
  live in the attribute-group definitions (below), not required attrs.

## 4. The builder UI — modes & tabs
- **Three modes** (B:4-6,871): Edit (1), Add (4), Test (2). Mode buttons:
  `EditObj / AddObj / Test`; action buttons: `Undo / Redo / FileObj / Exit`.
- **Edit buttons** (B:933-940): `copy / mirror / delete_ik / delete`.
- **Per-part property tabs** derived from attribute `pane` 1/2/3 →
  `shape / motion / colour` (B:1125,1133). Controls rendered by PropertyEdit;
  labels are hover help (`no_labels=1`). Right-click a slider to type a value.

### Tab "shape" (pane 1)
- Group **Shape**: Width(scalex), Height(scaley), Length(scalez) [displayed ×4],
  Pointiness(bias), Flatten End(flatness), Flatten Side(asymmetry), Squareness(cubosity).
- Group **Position**: Elevation(theta), Position(phi), Twist(roll), Up/Down(pitch),
  Left/Right(yaw).

### Tab "motion" (pane 2)
- Group **Joint**: `leg_type` radios **{0 No movement, 1 Single part, 2 Two part}**;
  `ik_side` combo **{Auto, Left side, Right side, Always}**; `leg_phase` slider
  (Movement Cycle); `spine` combo **{Normal, Inverted, Off}** (Part Targeting).
- Group **Master IK** (root-children only): `zook_speed` Cycle Speed (def 0.5),
  `turn_sharpness` (0.25), `turn_smoothness` (0.5), `max_spine_angle` (45).

### Tab "colour" (pane 3)
- `brightness` slider; a **colour wheel** sampling RGB→colour_red/green/blue; a
  **texture** thumbnail grid (default "bare"). Final colour = brightness·(r,g,b).

## 5. Direct 3D manipulation (Edit mode, B:559-737)
- Two drag handles on the selected part: **connect point** (proximal) drags →
  sets theta/phi; **end point** (distal) drags → sets pitch/yaw, constrained to a
  sphere. **Scaling**: drag the red selector box along the nearest of ±x/±y/±z axes
  (clamp 0.1–3). Select by tapping a part; tap empty space to deselect.

## 6. Mirror groups / symmetry
- Every part has an integer `mirror_group`; un-grouped parts get a fresh unique id
  (BP:1457-1481). **Mirror** clones every part in the group under the same parent and
  `ReverseAngles` (negate phi/roll/yaw). Editing one part fans the change to the whole
  mirror group with side-aware sign flips, leaving leg_phase/ik_side un-mirrored
  (BP:1036-1083). Root can't be mirrored/copied/deleted.

## 7. IK foot-path editing (motion tab)
- A leg's gait is a loop of `point` nodes the player drags. IK1: points on a sphere
  of radius = part scalez; IK2: points on a ground plane at the part end. Stored as
  `ik_positions`/`ik1_positions`/`ik2_positions`, `gait="gait_1"`. Up to 128 points.
  Grid/sphere overlay drawn by BuilderGrids.

## 8. Camera (SuperCam), save/load, limits
- Orbit = right-drag (pitch ±89°); zoom = wheel / `+`/`-`; Home resets. Test camera
  modes {Follow, Cool, Free}.
- Save path `teams/<team>/Creatures/<name>/<version>.zook`. Names ≤25 chars, illegal
  `/ \ : < > | * ? " '`. **No max-part limit in source.** Add palette = a per-team
  Components library (BuilderPreview); clicking a part attaches the chosen component.
