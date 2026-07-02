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
- **No AI.** Every word is composed on-device by the mathematics and the
  written astrological tradition behind it — precise, specific, never a fortune
  cookie. (An optional AI layer was removed by design.)
- **From the tradition, on your chart** — the reading surfaces the *source's own
  public-domain words* for the placements you actually carry: a line from
  **Ptolemy's *Tetrabiblos*** or **William Lilly's *Christian Astrology* (1647)**
  on your chart's keystone planet, your busiest house, and any planet sitting in
  its **Hellenistic joy** — tied to your chart, never a generic epigraph. The
  Learn screen does the same: each planet and house shows its own classical
  signification (our summary) beside a short, attributed period quote. Modern
  astrologers' copyrighted work is summarised in our own words, never reproduced.
- **An expanded fixed-star catalogue** — 30 named stars with their planetary
  natures after **Vivian Robson's *The Fixed Stars and Constellations in
  Astrology* (1923)**, matched to your planets and angles within orb.
- **The year ahead — a full time-lord stack.** Annual *and* monthly profections
  (with their time-lords), **Zodiacal Releasing** from the Lot of Spirit (your
  current life-chapter + sub-chapter and its ruler), secondary progressions
  (progressed Sun & Moon), your next solar return, and the live sky.
- **Daily & time aspects** — live transits to your natal chart, split into
  what's running *today* (the slower planets) and *the passing hour* (the fast
  Moon), each with a plain-language paragraph.
- **On-device chart intelligence** (no AI) — your *lunar phase at birth*, your
  Marc-Edmund-Jones *chart shape* (bowl, bucket, locomotive, …), detected
  *aspect patterns* (stellium, grand trine, T-square, yod), *essential
  dignities*, *sect*, *declination parallels & contraparallels*, and rare
  conditions (combust / cazimi / under-beams / out-of-bounds / stationary) —
  surfaced only when actually present.
- **Astrodienst-grade options** (Settings) — **True Node** by default (Mean
  toggle), optional **minor aspects** (quincunx / sesquiquadrate / semisquare /
  semisextile), and **Chiron + the four major asteroids** folded into the aspect
  grid. Positions are arcminute-aligned with Astro.com.

### In the Tarot screen

- **Card-art flicker** — pick a card and it gathers every version of that card
  from the open Wikimedia Commons archive and flickers through them as a
  slideshow drawn on the canvas. Stop the flicker to study one.

## This release — thirty upgrades, five movements

- **The walkthrough is now a staged performance.** Every act has its own
  light (a per-planet ground wash), tempo and camera — Mars punches in,
  Saturn settles heavily, the Moon floats — with hand-off lines carrying
  the story between acts and an elemental motif on the built-in synth.
  The tightest aspect is performed as a duet (the two planets converge
  from the wings, the chord bows and snaps taut, the orb counts down);
  the rising sun actually crests the horizon; the finale reassembles the
  whole chart, planet by planet, under "This is you". AUTO mode plays it
  like a film; the scene dots scrub.
- **Lessons that teach.** Each guided-journey chapter is a mini-arc of
  beats — idea, mechanics, then *your chart doing it* — ending in a recall
  check answered by your own sky, earning persistent stars. Learn is a
  levelled curriculum; how-to guides can walk you through the real app
  step by step; every glossary term in every paragraph is tappable.
- **Watch is a curated channel guide.** Your sign's programme (a matched
  public-domain classic, your ruling planet on film, your myth), newsreels
  from your birth year, short science films, and the live open dial — each
  pick with a written "why this is yours". The guide is remembered and its
  thumbnails cached, so it renders offline.
- **The reading engine goes deeper.** Seeded sentence-variety banks on
  every beat, decans and the anaretic/0° degrees in placements, orb
  tightness woven into aspect sentences, derived house-ruler chains,
  absences (unaspected planets, empty elements) read as first-class beats,
  and an honest no-birth-time register with a rough-time-of-day picker.
- **Modern-app parity.** A Today hook card on opening; synastry graded
  per dimension with expandable receipts; an on-device transit journal
  against the calendar; a 9:16 story export; opt-in transit reminders;
  ranked offline city search with a timezone/accuracy statement; and the
  draw loop now sleeps when the app is hidden.

## Third wave — the professional's toolkit

- **Timing, three clocks deep**: Firdaria (Persian time-lords) join profections
  and Zodiacal Releasing; the progressed Moon's sign-changes and progressed
  New/Full Moons are dated years ahead; and real retrograde seasons (stations
  found from actual planetary motion) are mapped onto your natal houses.
- **Solar return & eclipses**: the year's own chart fully cast and read;
  astronomy-engine's true eclipse search placed into your houses, with an
  eclipse-season notice in Today.
- **Hidden geometry**: the Sun/Moon midpoint, antiscia & contra-antiscia
  (mirror degrees across the solstice axis), and the draconic chart with its
  exact hits on the natal.
- **Jyotisha layer** (sidereal mode): the Moon's nakshatra & pada, and the
  Vimshottari mahadasha/antardasha clock.
- **Electional helper**: "Pick a day for…" ranks the next 45 days for a named
  intention, showing its working. Plus a 7-day intensity strip in Today.
- **The Book of You**: the entire reading as one typeset, printable report.
- **Search everything**, spoken walkthrough (on-device Web Speech), haptics,
  app shortcuts & icon badge, transit journal with sky-pattern insights,
  one-file backup/restore.

## Version

**1.3.0** — see `CHANGELOG.md`. Licensed MIT (`LICENSE`).

## Deploy

It is a static site: drag the folder onto Netlify Drop, or serve it from
GitHub Pages or any static host. The service worker makes it installable
and fully offline after the first visit.

## Precision

Positions come from astronomy-engine (MIT): an analytic ephemeris computed
on-device, accurate to roughly an arcminute — ample for interpretation.
`test.html` runs a regression suite pinning every planet's longitude for a
reference chart to 4 decimal places, so engine changes can never drift
silently. A Swiss Ephemeris (AGPL) precision pack is a planned optional
add-on; it is deliberately not bundled, to keep the core MIT and small.

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
