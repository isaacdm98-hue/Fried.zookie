# CELESTE EXPRESS

### A 3D open-world disco train odyssey — single-file, zero-build, ES5-only PWA

> *"Silence is just music holding its breath."*

A sleepy alien and a stubborn DJ cross a 120-carriage disco train from opposite
ends — one to stop the music, one to save it — and both are wrong, and both are
right. The train runs at **120 BPM**, and so does the whole game. Warm
cel-shaded storybook disco in the **marigold-over-plum** palette: Wind Waker's
heart, Resident Evil's *structure* with none of its darkness, Celeste's
precision and its kindness. Nobody dies. "Defeat" means someone bows, laughs,
or finally hears the song.

This repository holds the **playable vertical slice** (Phases A–G of the build
plan): both characters playable, the full system stack present, and a
Node-run smoke harness that proves it.

---

## Run it

It is a single file. There is no build step.

- **Locally:** open `index.html` in any modern mobile or desktop browser.
  Best on a phone in **landscape**. On desktop, click the wordmark to drop the
  needle, then use the keyboard fallbacks below.
- **Deploy:** drag `index.html` onto **[Netlify Drop](https://app.netlify.com/drop)**.
  Zero configuration. (The whole `celeste-express/` folder works too, but only
  `index.html` is needed to play.)

The only runtime dependencies are the pinned **Three.js r128** CDN and **Google
Fonts**. Both fall back gracefully offline — fonts degrade to system
serif/sans/mono, and if Three.js can't load the UI still runs and tells you so.

---

## Controls card (touch, landscape, two-thumb, beat-aware)

| Gesture | Zone | Action |
|---|---|---|
| Touch + drag | Left 40% | Floating drift-stick (spawns under thumb) |
| Tap | Right field | Jump — 120 ms input buffer, 100 ms coyote time |
| Flick ≥ 600 pt/s | Right field | **Dash**, 8-way snapped; On-Beat window ±90 ms of a beat = +25% distance + sparkle |
| Hold ≥ 180 ms → drag | Right field | **Draw a throw** — a ribbon renders the vinyl's path; release to throw; drag home to cancel |
| Two-finger spin | Anywhere | **Scratch** — Marmalade time-scrubs ±2 s; Zil rewinds a bar (costs hush) |
| Hold on wall + drag | Climbable | Climb (Zil) — stamina ring |
| Hold jump on rail | Brass rail | Grind (Marmalade) — balance meter, on-beat wobbles auto-correct |
| Pinch | Anywhere | Crouch / slide under tables (stealth) |
| Swipe across a door | Door | Speed reads: ≤ 300 pt/s slides silent; ≥ 900 pt/s slams (alerts + staggers everyone through) |
| Drag down from top edge | Top | **Tonearm** — Zil lifts the needle, Marmalade drops it |
| Swipe up from bottom edge | Bottom | Record crate (radial inventory) |
| Double-tap | Left zone | 180° quick-turn |
| Hold **both thumbs still** | Finale | **The Grand Pause** — four beats of stillness |
| Tilt (optional, off) | Gyro | Lean-peek around corners |

**Desktop fallbacks:** click wordmark to start · **← / →** move a carriage
forward/back · **Space** dash · **m** map · the ⚙ / ☰ / ♫ buttons open Settings,
Map and Jukebox.

**Haptics:** 10 ms per beat, 25 ms on the downbeat (Android `navigator.vibrate`).
iOS has no vibrate API, so it degrades to a subtle cream pulse-ring on the HUD —
never faked, never broken.

---

## Assist Mode (a first-class citizen)

Open it from the character-select screen or the ⚙ button. Nothing is locked
behind *not* using it, and the game never comments on it.

- Game speed **50–100%**
- Infinite stamina · infinite dash · invincible groove
- One-touch autorun
- **"They just get it"** — skip any conversion battle
- Left-hand mirror · large text
- **Colour-safe mode** — the Hushed carry a stipple pattern, not just grey
- Toggle Diorama fixed cameras (motion/comfort) and haptics

---

## What's in the slice

Both campaigns (**Zil**, rear→front; **DJ Marmalade**, front→rear), the
Caboose Districts band, and every core system present at least in seed form:

- **Beat Clock** — one 120 BPM look-ahead scheduler; everything subscribes
  (speaker pulse, mirrorball sweep, dash refresh, haptics). Drift < 5 ms/min.
- **Carriage streaming** — exactly 3 live carriages, pooled, warm plum fog on the seam.
- **Seeded archetypes** — deterministic per carriage number (12 archetypes).
- **Drawn-curve vinyl throws** — Catmull-Rom sampler, loop-home return, 5 record types incl. the **Dubplate** (record a world sound, replay it elsewhere).
- **Conversions** — Zil's *Lend an Ear* and Marmalade's *Hear Me Out* pulse-match.
- **Hush Bubble** — ducks the audio mix inside its radius.
- **Gesture doors, quick-turn, climb stamina, grind balance.**
- **RE structure** — key items, locked doors, Quiet-Car guestbook saves, radial crate, Press Station.
- **Ticket Moth concertina map** — one ticket → the next five carriages.
- **Procedural disco engine** — six WebAudio layers, spatial mix, hush ducking, the Grand Pause.
- **Saves** — IndexedDB per-slot/per-character with a localStorage fallback.
- **Boss** — the Baggage Golem (teaches curve-throws around pillars).
- **Rare 45 jukebox** — unique procedural loop per find.

### Seeded-but-thin (honest)
- Carriage interiors render from a small archetype vocabulary; only the shell,
  speakers and a grind rail are dressed so far — the authored lighting-bible
  props for all 12 archetypes are next.
- Combat, climb and grind are wired and testable as systems but have a single
  encounter each in the slice, not the full band's worth.
- Audio layers are structured and mixed but the per-band key drift (D minor →
  F major) is scaffolded, not fully voiced.
- Narrative beats are present as tannoy/dialogue lines; the Carriage 60 crossing
  and the Origin Deck Grand Pause exist as state machines, not yet as staged scenes.

---

## Verify it

```bash
cd celeste-express
node smoke.js
```

The harness stubs the browser (no real DOM/WebGL), extracts the inline game
script, and runs 24 assertions plus `node --check` and an ES6-token scan.
**Current status: 24 / 24 green.** See the PASS/FAIL table in the build report.

---

## Content roadmap

**Carriages 110 → 1** — extend the authored-seed band by band:

| Band | Carriages | Work remaining |
|---|---|---|
| I | 120–91 | dress all 12 archetypes; the Long Swap trade-chain begins |
| II | 90–61 | Sleeper Belt key-puzzles; first Hushed crowds; **Sommelier of Silence** |
| — | 60 | The Meridian Ballroom crossing — stage the scripted dance-chase |
| III | 59–31 | Galley Gardens greenhouses, roof glide biomes; **Pollen Choir** |
| IV | 30–2 | First Class mirror puzzles, Groove Wardens; **Twin Metronomes** |
| V | 1 | The Origin Deck: Conductor reveal + the Grand Pause + the biggest drop |

**Remaining bosses:** Sommelier of Silence, Carriage 60 Crossing, Pollen Choir,
Twin Metronomes (Tick & Tock), the Origin Deck.

**Systems to deepen:** full spatial audio key-drift, the Press Station wax/label
economy, Diorama fixed-camera lounges, the Requests Board sidequests, all 120
Rare 45s and the Long Swap chain.

**Stretch — two-device ghost (future work only):** an optional second phone can
join as the *other* protagonist's radio, whispering hints across the train.
Designed-for, not built in the slice.

---

## Higgsfield asset ledger

The playable game ships with **100% procedural** runtime art and audio — no
Higgsfield output is a runtime dependency. Higgsfield is used for the art bible,
character sheets, UI reference, wordmark, trailer and 3D reference maquettes.

| Phase | Deliverable | Status | Credits |
|---|---|---|---|
| 1 | Key art & art bible (6 images) | **awaiting approval** | est. TBD (pending `balance`) |
| 2 | Character sheets (turnarounds) | not started | — |
| 3 | Carriage archetype plates (10–12) | not started | — |
| 4 | UI & iconography | not started | — |
| 5 | Motion & voice (wordmark, teaser, tannoy) | not started | — |
| 6 | 3D reference maquettes (GLB) | not started | — |

Per Isaac's etiquette rule, no credits are spent until balance is checked, the
per-phase generation list is itemised, and **Isaac approves that phase**.

---

## Engineering law (why the code looks like this)

1. **ES5 only, everywhere** — `var` + `function`; no `let`/`const`/arrow/`class`/template-literals/spread. The smoke harness enforces this.
2. **Single-file PWA** — one `index.html`; inline CSS/JS, manifest as a data-URI, landscape lock, Netlify-Drop deployable.
3. **Saves** — IndexedDB autosave with localStorage fallback (guestbook stamp, carriage transition, `visibilitychange`).
4. **Verification before delivery** — `node --check`, ES6-token scan, and the stubbed smoke harness, all green.
5. **Contrast law** — every declared UI text/background pair ≥ 4.5:1, asserted programmatically.
6. **No external runtime assets** beyond pinned Three.js r128 and Google Fonts (both fall back offline).

Built in British English. *Now the needle is down.*
