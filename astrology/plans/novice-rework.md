# THE NOVICE REWORK — teaching a beginner to *use* the chart

## The problem, named

Over the last arc we made the app **correct and deep**: it judges the chart the
way a trained astrologer does — the captain, the house-lords followed home,
dignities, aspects by nature, the lord of the year, transits last — and it shows
its working on everything. That was the goal, and the engine is now excellent.

But a beginner opening it meets sentences like *"Venus, the captain, keeps her
court in your 8th house, peregrine in Pisces, +7 by Lilly's count."* Every word
is true and sourced. **None of it tells a novice what to DO with it, or teaches
them to read it themselves.** The app is a professional's instrument wearing a
beginner's welcome. It informs; it does not yet *teach* or *land*.

Three specific gaps:

1. **No translation layer.** The judgment is stated in the tradition's own terms.
   There is no "so, in plain life, this means…" beside it.
2. **No teach-as-you-go.** The vocabulary (captain, dignity, peregrine, almuten,
   profection, live wire) is never taught *at the moment you meet it*. Learn is a
   separate room you have to choose to visit.
3. **Too much, too flat, too soon.** Everything is offered at one depth. A novice
   needs one thing at a time, in order, with the next thing unlocked only when the
   last one landed.

The north star: **a first-time user should finish their first session knowing
three true things about their chart, understanding the words that carried them,
and wanting to come back to learn the fourth.**

---

## Design principles

- **Plain first, precise underneath.** Every judged line gets a one-sentence
  plain-life translation ON TOP; the technical line and its receipt sit UNDER it,
  one tap away. The novice reads the plain version; the receipt reassures them
  it's real; the apprentice taps through to the working.
- **Teach the word where it's used.** The first time a chart-specific term
  appears, it is tappable and opens a two-line "what this means" card *in place* —
  no trip to Learn. (We already have `glossScan`; extend it to the tradition's
  vocabulary and wire it into every judged surface.)
- **One thing at a time.** The reading is a paced sequence, not a wall. It already
  is (the Read flow). Push this further: the FIRST session shows only the
  headline judgments (captain, the two lights, the one loud thing), and offers
  "go deeper" rather than dumping all twelve houses.
- **Difficulty tiers.** A single setting — **Beginner / Learning / Astrologer** —
  that controls how much technical language and how many receipts show by default.
  Beginner: plain translations, terms tappable, receipts hidden. Astrologer:
  today's full technical output. Default new users to Beginner.
- **Every screen answers "so what?"** Not just "what is true" but "what it means
  for your life, and what to do with it." Traditional astrology HAS this — it's a
  practical craft — we just haven't surfaced the practical read.
- **Fit the frame; don't make them scroll to the point.** The most important
  surface (the chart) fits one screen. Depth is reached by *tapping in*, not
  scrolling down.

---

## Workstream A — the plain-language layer ("so, in your life…")

The engine already produces, per placement, everything needed to write a plain
read: the house (a life department), the dignity (strong/weak = reliable/needs
help), the nature (benefic/malefic = helps/tests), what it rules, the sect role.
Add a composer that turns that structured judgment into ONE plain sentence.

- **New function `plainRead(det)`** — takes a `determination` and returns a
  beginner sentence with NO jargon: e.g. Venus 8th peregrine → *"The part of you
  that loves and values things works through shared money and other people's
  resources — and it's a bit out of its depth there, so it does better with a
  partner than alone."* Built from the same determinants (≥2), so still specific.
- **Wire it above the technical line** in: the placement zoom card, every Read
  flow beat, the guide cards. The technical line + receipt become a "the working"
  toggle beneath.
- **A "what to do with it" line** where the tradition supports one (the lord of
  the year, a live-wire transit, a hard aspect): the practical counsel a reader
  gives across the table — "budget for friction around X," "this is the year to
  push on Y."

## Workstream B — teach-in-context (the learn-as-you-read loop)

- **Extend the glossary** (`GLOSSARY` + `glossScan`) to the whole traditional
  vocabulary: captain, Ascendant, domicile/exaltation/detriment/fall, peregrine,
  triplicity, term/bound, decan/face, almuten, dispositor, reception, sect,
  benefic/malefic, combustion/cazimi, profection, lord of the year, direction,
  live wire, promittor/significator. Two lines each, plain, with a "learn more →"
  into the matching Learn chapter.
- **Auto-underline these terms** in every judged paragraph (the mechanism exists;
  make sure it covers the zoom card, Today, the guide). Tapping opens the in-place
  card, never leaving the reading.
- **A first-appearance highlight.** The very first time a term shows in a session,
  it pulses once so the novice knows it's tappable.
- **"You've learned" tracking.** Terms the user has tapped/seen get a subtle mark;
  Learn shows progress ("you understand 9 of the 24 building blocks"). Turns
  reading into a curriculum without a separate quiz.

## Workstream C — the first-reading experience (novice onboarding)

Replace the (now-removed) auto-tour with something that teaches the METHOD by
revealing THEIR chart, gently, once:

- After birth entry, a **3–4 beat first reading**, plain-language, each beat
  teaching one idea by showing it in their chart:
  1. *"Every chart has a captain — the planet that runs the whole thing. Yours is
     Venus."* (teaches: Ascendant-lord) → tap to see where it sits.
  2. *"Two lights set the tone: your day-self (Sun) and your night-self (Moon)."*
  3. *"One conversation is loudest in you: Mars pushing on your Moon."*
  4. *"That's how a chart is read. Tap any planet to go deeper — the app shows its
     working every time."*
- Ends by dropping them on the chart, oriented. Skippable, never auto-replays,
  no animation stacked on the computing chart (the bug we just fixed).
- This is the *useful, immersive, 30-second intro* from the original brief —
  finally built on the real engine instead of generic planet theatre.

## Workstream D — the chart screen: fit one frame, tap to go deep

Today the Home/chart screen scrolls: title → element bar → wheel → day-word →
"tap a planet" → an inline planet reading. Rework so **the wheel and its
essentials fit one screen with no scroll**; depth comes from tapping in (the
placement zoom already exists and is the right pattern).

- **Remove the element bar** (element-first pop; see Workstream E) — reclaims
  space and a pop remnant in one move.
- **The frame is:** compact header (name + "Libra rising") · the wheel (the hero) ·
  the three anchors (Sun / Moon / Rising chips) · one line for today (the live
  word, tappable to Today). Nothing below the fold.
- **Delete the inline below-wheel planet reading** — it duplicates the placement
  zoom. Tapping a planet opens the zoom (already built); the chart screen itself
  stays clean and static.
- **`UI.contentH.chart = viewH()`** (or the fit height) so the screen never
  scrolls. Verify at 320 / 390 / 768 and with/without a birth time.
- Keep the breathing-constellation loader for the first paint; it already fits.

## Workstream E — remove every pop remnant

The judged reading is clean. These are the remaining pop-astrology surfaces, to
delete or convert:

- **Dead code to delete outright** (exported but no longer called anywhere):
  `sunMoonCharacter`, `lifeQuirks`, `interests`, `emergingPull`, `spookyReads`,
  `combinationRead`, `chartSignature`, and the `composeArc` "four movements" if it
  has no remaining caller. Remove their exports too.
- **The element bar** on the chart screen (Workstream D).
- **The "word for the day"** THEME map (Sun=Visibility, Venus=Sweetness…) — either
  cut, or replace with the live-wire read ("Venus, your lord of the year, is lit
  today").
- **`watchCards`** — the YouTube-by-Sun-sign shelf ("Your Sun in Gemini," Debra
  Silverman, etc.): pure pop, external, off-brand. Remove.
- **"Charts like you" / `famousMatches`** — matches strangers by Sun sign. Either
  remove, or re-base on a real chart feature (same captain, same sect, a shared
  tight aspect) so it teaches instead of flatters.
- **The Learn "elements" category / element-first LEVELS labels** — fold the four
  qualities into "the signs" chapter (fire = hot-and-dry, etc., as the tradition
  teaches them) rather than a standalone element-first topic.
- **Glossary/blurb "energy" occurrences** in reference copy — reword to what the
  planet does (the voice book already bans it in judged output; extend to Learn).
- **`elementMix`, `domElement`, `lowElement`** helpers once nothing calls them.

Method: grep each name; if the only reference is its own definition/export, delete
both. Run golden + audit after each batch (all pinned meaning is judged output, so
removing pop won't move the baselines).

## Workstream F — progressive disclosure (the difficulty tiers)

- One setting, three levels, defaulting to **Beginner** for new users.
- **Beginner:** plain translations lead; terms tappable; receipts and Lilly scores
  hidden behind "show the working"; the first-reading runs; Learn foregrounds the
  alphabet.
- **Learning:** plain + technical shown together; receipts visible; the full Read
  flow.
- **Astrologer:** exactly today's output — technical-first, every receipt, no
  translations.
- The setting only changes DEFAULT visibility, never the underlying judgment; a
  Beginner can always tap "the working," an Astrologer can always tap "in plain
  terms."

---

## Progress

- **DONE (v4.1.0):** Workstream D (chart fits one frame, no scroll; depth via the
  placement zoom) and the bulk of Workstream E (element bar, word-for-day, and all
  the uncalled pop functions + the redundant inline reading, deleted). Verified at
  320/390/768 + a short 320×568 viewport; golden/doctrine/audit/voice all pass.
- **Still open in E (a choice, not a cleanup):** `famousMatches` on the People
  screen (matches strangers by Sun sign) and the Learn "elements" category —
  remove outright, or re-base on a real chart feature. Deferred to a decision.
- **Internal only:** the dead corpus.js data tables (COMBO, SUNMOON, QUIRK,
  SPOOKY, ASPECT_TELL) are now unreferenced but interleaved with live tables;
  a careful strip would shrink the download. Not user-visible.

## Sequencing (remaining)

1. **Finish E:** decide `famousMatches` + Learn elements (remove vs re-base).
2. **The plain layer (Workstream A):** `plainRead` + wire it above the technical
   line in the zoom card, Read flow, guide. The biggest single lift in
   novice-friendliness.
3. **Teach-in-context (Workstream B):** extend the glossary to the tradition's
   vocabulary and light up tappable terms everywhere.
4. **First-reading (Workstream C):** the gentle 3–4 beat method intro.
5. **Difficulty tiers (Workstream F):** the Beginner/Learning/Astrologer setting,
   tying A/B/C together, default Beginner.

Each step ships behind the existing harness floor: golden (judged meaning),
doctrine (engine ↔ ateliers), the three-width UI audit, and the voice-book check.

## The test that matters

Hand a real beginner the build with no explanation. They should, unprompted:
finish a first reading; be able to say in their own words what their captain is
and roughly what it means; have tapped at least one term to learn it; and know
where to go to learn the next thing. When that happens, the rework is done.
