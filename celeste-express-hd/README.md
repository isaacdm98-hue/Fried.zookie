# CELESTE EXPRESS — HD pipeline build

### Messenger-style cel-shaded rebuild with passing scenery

This is the **higher-fidelity** version of Celeste Express, built after Isaac
asked for visuals closer to [**Messenger** by Abeto](https://messenger.abeto.co/) —
polished cel-shaded low-poly with real assets, not a single procedural file.

To get there we **relaxed the Section 9 single-file/ES5 law** (with Isaac's
sign-off) and moved to a small, web-deployable **asset pipeline**:

- **Modern ES modules** + Three.js r128 vendored locally (`vendor/three.module.js`), loaded via an **import map** — no bundler, no build step, still drag-and-drop deployable.
- **Cel + rim shading** — `MeshToonMaterial` banding through a gradient ramp, plus a fresnel **peach rim light** injected via `onBeforeCompile`; inverted-hull outlines on the leads.
- **Fake bloom** — additive glow sprites on lamps, speakers and the mirrorball (no post-processing chain, keeps it light for phones).
- **Passing scenery** — per-biome **parallax** (gradient sky + three scrolling silhouette layers) that **auto-upgrades** to **Higgsfield** biome plates when reachable (see `assets/scenery/SOURCES.md`).
- **Authored GLB characters** — Zil and DJ Marmalade are real `.glb` models (`assets/models/`), loaded via **GLTFLoader**, then re-materialised with the cel+rim shader; named nodes drive the beat-synced dance/skate rigs. A built-in procedural fallback runs if the GLB can't be fetched. Animated crowd too (dancers, the Hushed, sashed Wardens).
- **Richer carriages** — brass mullioned windows, instanced dancefloor that steps colour on the beat, faceted mirrorball, hanging lamps, benches.
- **Installable, fully-bundled PWA** — web app manifest, record-disc icons, and a **service worker** that precaches the entire app shell (Three.js, engine, GLB models, icons) so it installs to the home screen and **runs completely offline**. Cross-origin fonts/scenery pass through and are cached opportunistically, never breaking offline.

### Authored GLB pipeline
The models are built as detailed, named meshes and exported to real `.glb` with
**GLTFExporter** — see `tools/export-characters.html` (a dev tool: serve the
folder and open it in a browser; it writes the base64 GLBs to `window.__glb`,
which the build step saves to `assets/models/`). Drop a Higgsfield / Blender
`assets/models/zil.glb` or `marmalade.glb` at the same path to swap in
higher-detail sculpts with no code change — the loader and the node-name
animation contract stay the same.

It **reuses the verified engine** (`engine.js`, the exact logic core from the
ES5 slice — Beat Clock, streaming, world, save, assist, etc.), so the game
rules stay identical and stay covered by the slice's `smoke.js` (24/24).

## Run it

ES modules and the service worker need **http(s)**, not `file://`, so serve the
folder:

```bash
# any static server from this folder, e.g.
python3 -m http.server 8080
# then open http://localhost:8080
```

Or deploy the whole `celeste-express-hd/` folder to Netlify / any static host —
it needs **no build**. First gesture ("drop the needle") unlocks audio. On a
phone, "Add to Home Screen" installs it; after the first load it runs offline.

**Controls:** click the wordmark (or drag down from the top) to start · pick a
lead · **← / →** move a carriage (biome changes every ~10) · **Space** dash ·
swipe/flick on the right half to jump/dash/throw · the ⚙ button cycles Assist
speed. Landscape recommended.

## Scenery / Higgsfield

The six biome backdrops were generated with the Higgsfield `soul_location`
model (21:9, marigold-over-plum style token) — **~6 credits of the 30 approved**.
This environment's egress policy blocks the Higgsfield CDN, so the PNGs are not
committed here; the game loads them from the CDN at runtime, or from
`assets/scenery/<slug>.png` if you download and drop them in. Full ledger and
URLs: `assets/scenery/SOURCES.md`. Until then the **procedural parallax**
fallback runs everywhere (including offline).

## Relationship to the ES5 slice

`../celeste-express/` remains the **zero-build, single-file, ES5** slice (the
original brief's engineering law), fully self-contained and Netlify-Drop
deployable, with the 24-assertion smoke harness. This `celeste-express-hd/`
folder is the **visual-target** build. Both share `engine.js`.

## What's next

- Bundle the Higgsfield scenery plates locally (download → `assets/scenery/`) so the painterly backdrops ship offline too.
- Swap the exported GLB leads for **Higgsfield `generate_3d` / Blender sculpts** at the same `assets/models/*.glb` paths — the loader and node-name animation contract are already in place.
- Generated PBR-ish material maps for floor/brass/velvet.
- Roof + undercarriage lanes; the remaining bands and bosses.
