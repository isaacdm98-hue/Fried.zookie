# Aqau Pluto

A single-file, offline-first astrology + tarot PWA. Computed natal charts
(planets, houses, aspects, elemental balance), deterministic element-first
readings, an educational **Learn** screen, and a tarot reference — all
on-device, no server, no API keys.

### The delineation ENGINE (new)

A dedicated, on-device reading engine sits between the computed chart and the
prose, so every placement reads *specifically* — never a generic template:

- **Every aspect read separately by its geometry.** All 45 planet-pairs are
  modelled as a *dynamic* (fusion / gift / friction / essence), then read through
  each Ptolemaic angle on its own terms: a **square** (internal pressure that
  forces growth through action) is no longer the same sentence as an
  **opposition** (the same tension projected onto other people), and a **trine**
  (an effortless gift) is distinct from a **sextile** (an open door that only pays
  out if you take it). Conjunctions, quincunxes and the minor angles each get
  their own frame too. Marquee contacts (Sun–Saturn, Moon–Saturn, Mars–Saturn,
  Venus–Mars, Sun–Pluto, Sun–Moon and more) carry bespoke per-angle text.
- **Every planet through every house** — a full 10 × 12 corpus of behavioural
  delineations (the *drive* of the planet expressed in the *field* of the house,
  gift and trap named), so a placement like *Saturn in the 7th* or *Moon in the
  12th* reads from real insight rather than a generic house label.
- **A relevance graph** ranks every aspect in *your* chart by tightness × the
  weight of the two bodies × how loud the angle is, so the reading leads with the
  contacts that actually define you — not just the first ones found.
- **Written to contradiction.** The sharpest insight is rarely one placement —
  it's where two parts of the chart want opposite things. When a luminary's
  sign-nature clashes with the natural element of the house it falls in, the
  reading names the lived paradox (*"built to roam, yet you keep building the nest
  to roam from"*) instead of reporting two facts side by side.
- **No repeated scaffolding.** Each angle carries several phrasings chosen
  deterministically by the planet-pair, so a chart with three trines never prints
  the same closing clause three times — the geometry stays specific, the prose
  stays fresh. When Sun and Moon land in the *same* contradiction, the engine
  catches that and writes it as one doubled, load-bearing pattern rather than two
  near-identical sentences.
- **A house style sheet** at the top of the engine (second person, one concrete
  image per line, no hedge filler, gift *and* trap named together, a banned-word
  list against fortune-cookie phrasing) keeps the corpus reading as one voice
  across hundreds of lines and future additions.
- **Generational placements with an image, not a label.** Uranus/Neptune/Pluto
  by sign are necessarily generational (they move slowly), but each line now
  carries a concrete, period-specific image — "the nuclear blueprint cracked, and
  you grew up redrawing what *family* is allowed to mean" — instead of a flat
  "a generation that…" template repeated twelve times.
- **Verified sign coverage.** Every sign-indexed corpus (Sun/Moon/Rising and all
  eight planet-in-sign tables) was audited by direct evaluation for all 12 signs:
  no gaps, no duplicate text, and each entry checked against its sign's real
  element, modality and ruler — including the classical dignities already quietly
  built in (Jupiter "lifted here" only in its true exaltation, Cancer; Saturn only
  in Libra; and so on).
- **Real classical text, per sign.** A new `SIGN_TRAD` gives each sign its own
  classical nature — and where a genuine period line could be verified against
  William Lilly's *Christian Astrology* (1647), it's quoted directly (Aries,
  Leo, Scorpio, Capricorn, Pisces carry the source's own archaic words; the
  others get an accurate, honestly-attributed summary rather than an invented
  quote — the same integrity the app already applies to Uranus/Neptune/Pluto).
  The pairing is chart-specific, not a static epigraph: it's tied to your actual
  Sun sign, and — genuinely clever — to **Ptolemy's own triplicity-ruler scheme,
  computed live from your chart's real sect** (day or night birth). A night-chart
  Scorpio Sun, for instance, is told that Mars governs the water triplicity for
  them specifically, with Ptolemy's own words on Mars alongside it — a different
  planet and quote for a day chart, or for a different element entirely.

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

- **Card-art flicker, front and centre** — pick a card and the flickering
  Wikimedia slideshow is now the hero image at the top of the card-meaning view
  (the drawn card face holds that same spot only while the real scans are still
  loading), instead of being tucked below all the keyword text. Stop the flicker
  to study one version.

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
