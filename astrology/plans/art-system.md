# THE ART SYSTEM — every asset teaches an engine concept

The rule for this whole batch: **no decoration.** Each generated image must
*communicate one thing the engine now knows*, so the art carries the doctrine
the way the words do. Embellishment in service of the point, never instead of
it. One hand across all of them.

**North star:** cinematic Studio Ghibli (hand-painted depth, warm light, weather
and season that mean something) × minimalist synth (restraint, a few true
colours, analog grain) × Jobs/Ive (essential, nothing spare) × retro-futurist
(a soul that remembers the future the 1970s imagined). Muted, filmic, never
glossy or "AI-shiny." Consistent palette and grain across all 20 so they read
as one system.

**Pipeline:** generate at 2:3 or 3:2, export webp, add the URL to `get-art.js`,
the key to `sw.js` ART, and load via `artImg('<key>')` (absent-safe). The app
never fetches art at runtime — assets are bundled.

---

## 1 · The seven Captains — the concept: *one planet runs this chart*
`art/captain-{sun,moon,mercury,venus,mars,jupiter,saturn}.webp`
**Where:** the Read-screen hero, when the chart's Ascendant-lord is that planet.
**Teaches:** the *captain* — the single planet the whole life reports to. The
composition says it without words: one presiding celestial body, and a faint
chart-wheel of the other planets orbiting *it*, deferring to it.

Each shares a frame grammar — a lone luminous body, low horizon, the ghost of a
zodiac ring around it — and differs only in that planet's nature:

- **Sun** — a gold sovereign disc cresting a still horizon at dawn, the ring of
  the chart bowing toward it; regal, warm, singular.
- **Moon** — a pale pearl over a tidal flat at dusk, soft mist, reflected light;
  receptive, changeful, tender.
- **Mercury** — a quick bright point threading between two shores, a bridge of
  light; the messenger, the go-between.
- **Venus** — a warm evening star over a terraced green garden, blossom and
  still water; beauty presiding, the peace-maker.
- **Mars** — a red iron star over a ridge of dark rock, heat-shimmer, a single
  forge-glow; the commander, edge and drive.
- **Jupiter** — a great banded amber giant over a wide fertile valley, grain and
  rivers; increase, the benefactor.
- **Saturn** — a distant ringed grey world over a plain of standing stones at
  cold dusk; time, limit, the elder.

## 2 · The seven Time-lord atmospheres — the concept: *the life divides into ruled chapters*
`art/timelord-{sun..saturn}.webp` (same seven planets)
**Where:** behind the iPod-classic timeline "screen"; the current term-lord span
sets the backdrop as you scrub.
**Teaches:** the *distributor* — each stretch of years carries the mood of its
term-lord (Abu Ma'shar). Pure Ghibli landscapes, no celestial body this time —
just weather, season and light that ARE the planet:
Sun a high bright noon meadow; Moon a silver night shore; Mercury a windblown
crossroads of paths; Venus a warm blossoming orchard; Mars a heat-cracked red
canyon; Jupiter a golden harvest valley; Saturn a frost-blue plain of ruins and
long shadows. Same camera height and grain, so scrubbing between them feels like
one film changing season.

## 3 · Sect — the concept: *day chart vs night chart*
`art/sect-day.webp`, `art/sect-night.webp`
**Where:** the two ambient keyframes behind the app (pairs with the sect tint
already shipped).
**Teaches:** the chart's *light of sect*. Day: a luminous warm horizon, sun-side.
Night: a deep indigo starfield, moon-side. Barely-there backdrops, not scenes.

## 4 · The Threshold — the concept: *a reading starts at the Ascendant*
`art/threshold.webp`
**Where:** the Read intro ("Where a reading starts").
**Teaches:** the *Ascendant* as the doorway every part of the life walks through.
A single lit archway/gate on a horizon at first light, a figure about to step
through; spare, Ghibli, retro-future. The body you arrived in and the gate, made
one image.

## 5 · The Meeting — the concept: *prediction is a significator meeting a promittor*
`art/meeting-{soft,hard,conj}.webp` (three registers)
**Where:** the Seasons "your directions" beats and the storytelling animation.
**Teaches:** a direction is *A's domain arriving at B* (Morin XXII). Two celestial
bodies converging across a wide landscape — **soft**: they meet on an open plain
under kind light (a settlement); **hard**: they meet across a chasm or bent
ridge, charged air (work, the bent pipe); **conj**: they eclipse into one body,
a fused glow. So the picture says "settlement, not a wound" before the words do.

---

## Batch order (highest engine-value first)
1. The seven Captains (the keystone concept, the hero surface).
2. The seven Time-lord atmospheres (the timeline, the most novel surface).
3. The three Meetings (prediction made visible).
4. Threshold + the two Sect keyframes (ambient, lowest lift).

20 assets, one palette, one grain, one hand. Each one earns its place by
teaching a piece of the engine.
