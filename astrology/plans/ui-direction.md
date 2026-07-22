# UI DIRECTION — the owner's brief (from the 10-ideas review)

The design philosophy is **Jobs / Ive**, not "Apple app": reductive, essential,
material, honest. Remove until only the necessary remains, then make that one
thing beautiful. The app is already visually strong; these add clever features
without cluttering it. Animated storytelling runs *throughout* the app, not just
in one place.

## Greenlit

1. **Live wires glow on the wheel.** The chart wheel dims; only the natal points
   currently lit (by direction, the lord of the year, the captain, the
   distributor) glow with a filament. A transit that strikes one draws a brief
   arc. Makes "transits come last" visible. *(Engine: `liveWires21`,
   `triggerReading`.)*

2. **Tap a placement → the chart expands into it.** Not a Health-ring gauge —
   a cinematic zoom: tap any planet/point on the wheel and the whole chart
   *beautifully expands* around it, opening a circle that holds everything the
   engine knows about that placement (its determination, state + Lilly score,
   what it rules, its speaks-first matter, its aspects, receipts). The chart is
   the navigation. *(Engine: `determination`, `determinationSheet`,
   `conditionVerdict`.)*

3. **The life timeline as an iPod-classic click-wheel.** Not a modern scrubber —
   a physical click-wheel to scrub the term-lord chapters and the years; simple,
   tactile, beautiful visuals inside the "screen" above the wheel. Scrub to any
   age → its distributor, its directions, its lord of the year.
   *(Engine: `boundsWalk`, `judgeDirections`, `lordOfYear`.)*

5. **Sect as ambient light (tastefully).** A day chart lifts the app warm and
   luminous; a night chart deepens it; the chart's helper and tooth get
   signature accents. Additive, not a redesign — the current look stays.
   *(Engine: `sectProfile`.)*

7. **A snappy 30-second intro.** Immersive and beautiful, but *useful* and fast —
   the natal synthesis delivered as animated storytelling (keystone →
   constitution → what runs strong → the tooth → the final word), then it settles
   into the reading. Storytelling animation continues throughout the app, not a
   one-off fitness-style reveal. *(Engine: `natalSynthesis`.)*

8. **Higgsfield "living sky."** Bespoke cinematic art baked in offline — a
   captain portrait per ruling planet, a time-lord atmosphere per distributor,
   scene art for the act beats. The biggest immersion payoff; batch the prompts
   while the free window is open. *(Delivered via `get-art.js`, CDN blocked in
   sandbox.)*

9. **The contest, shown as tension** (interesting — explore). When a house
   argues with itself, show the two forces meeting rather than smoothing it —
   a split, opposing accents, a slight tug. *(Engine: `contest`,
   `contradictions`.)*

10. **Haptics + tone as the planets' language** (yes). Each planet a signature
   haptic + micro-tone (Saturn low/slow, Mars a sharp tap, Venus a warm chord);
   a live-wire transit *rings*; the click-wheel ticks. The Taptic/audio layer as
   a first-class material.

## THE AESTHETIC NORTH STAR
**Immersive cinematic Studio Ghibli — meets minimalist synth — meets Jobs/Ive
design philosophy — meets retro-futurist.** The app is *already there* on visual
style; this work is polishing, embellishing, and adding immersion and cinema —
never a redesign. Warm hand-painted depth (Ghibli), spare and essential
(Ive), analog-synth restraint, a retro-future soul.

## Declined / reshaped
- 3 (Health rings) — no; Jobs/Ive, not Apple Fitness.
- 4 (flip cards) — no.
- 6 — the app is already stunning; keep it, add cleverly.

## Build order
The reductive wins fold into the phase-39 UI pass (sect ambient tint, live-wire
wheel glow). The larger pieces — placement zoom, iPod click-wheel timeline, the
30-second intro, and the Higgsfield art batch — are their own build track after
the 40 phases close, following this brief.
