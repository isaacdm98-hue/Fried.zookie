# Aqau Pluto

A single-file, offline-first astrology + tarot PWA. Computed natal charts
(planets, houses, aspects, elemental balance), deterministic element-first
readings, an educational **Learn** screen, and a tarot reference — all
on-device, no server, no API keys.

### In the Read screen

- **Your chart in four movements** — the reading leads with a synthesised arc:
  the *spine* (Sun/Moon/Ascendant + dominant element & mode), *what runs the
  chart* (where the prominence engine, the almuten and the dispositor chains
  converge on one keystone planet), *your growing edge* (the tightest hard
  aspect + the out-of-sect malefic + any rare condition), and *where it's
  heading* (North Node + the current profection time-lord).
- **The prominence engine** — instead of a flat list, placements are *ranked*
  by a transparent scorer (essential dignity, angularity, sect, chart-rulership,
  almuten, aspect activity, stelliums) so the reading leads with what actually
  carries weight in *this* chart, and shows *why*.
- **Woven reading — your choice of voice** (Settings → Reading, also at onboarding):
  the whole reading can flow as a single voice, streamed live. Three engines:
  - **Claude (cloud)** — paste your own Anthropic API key; the best wording,
    streamed token-by-token. Only the *computed facts* are sent (to phrase them);
    the maths stays local. Needs internet.
  - **On-device** — a language model runs entirely on your device via WebGPU,
    **device-aware**: a large model (Gemma-2 9B / Llama-3.1 8B) on desktops with
    more RAM, a lighter one (Qwen2.5-1.5B → Llama-3.2-1B → 0.5B) on iPhones.
    Downloads once, then offline and private.
  - **Algorithms** — no AI at all; the reading is composed purely by the
    on-device maths engine (precise, specific, no repeated lines).
  Whichever AI engine is chosen, it is briefed with the complete computed
  dossier and hard-constrained never to invent or drop a placement; any failure
  falls back to the deterministic reading, and the reason is shown, not hidden.
- **Daily & time aspects** — live transits to your natal chart, split into
  what's running *today* (the slower planets) and *the passing hour* (the fast
  Moon), each with a plain-language paragraph.
- **On-device chart intelligence** (no AI) — your *lunar phase at birth*, your
  Marc-Edmund-Jones *chart shape* (bowl, bucket, locomotive, …), detected
  *aspect patterns* (stellium, grand trine, T-square, yod), *essential
  dignities*, *sect*, and rare conditions (combust / cazimi / under-beams /
  out-of-bounds / stationary) — surfaced only when actually present.

### In the Tarot screen

- **Card-art flicker** — pick a card and it gathers every version of that card
  from the open Wikimedia Commons archive and flickers through them as a
  slideshow drawn on the canvas. Stop the flicker to study one.

## Engine

Planet / Sun / Moon positions come from **astronomy-engine** (Don Cross,
**MIT licence**), validated against NOVAS / JPL Horizons to roughly
**1 arcsecond**. ASC / MC and Placidus / Whole / Equal house cusps are
analytic trigonometry. Tropical, ecliptic-of-date.

This release replaced the previous Schlyter-series engine. The corrections
are invisible at sign level but real at the degree level — most notably
**Pluto (was off ~28 arcmin)** and **Saturn (~11 arcmin)** are now
professional-grade. No ephemeris data files are required.

> Note on licensing: astronomy-engine is MIT, so it carries no copyleft
> obligations for a closed/commercial app. (Swiss Ephemeris, by contrast, is
> AGPL-or-paid — deliberately avoided here.)

## Deploy (Netlify Drop)

1. Go to https://app.netlify.com/drop
2. Drag the **folder** containing `index.html` and `sw.js` onto the page.
3. You get a live HTTPS URL immediately.

A service worker needs HTTPS (or localhost). Netlify provides HTTPS, so the
PWA installs and runs offline once loaded.

## Offline / install

`sw.js` caches the app on first load, so it launches offline and can be added
to the home screen. On iOS Safari: **Share → Add to Home Screen**.

## Files

- `index.html` — the entire app (astronomy-engine, chart logic, data, and the
  p5 canvas UI, all inlined)
- `sw.js` — service worker for offline launch

## Not yet verified

The canvas rendering and touch interaction can't be tested headlessly. Please
confirm on device: chart accuracy, the Learn screen, the bold block-colour
wipe between sections, tap-to-magnify on the chart wheel, and offline install.
