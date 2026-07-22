# THE INTERPRETATION LAYER — say what an astrologer would actually tell you

## The problem, named

The reading is correct, judged and sourced — and it still reads like a technical
read-out. It names the **mechanism** (Venus, the captain, 8th house, peregrine,
+7 by Lilly) and the **department** ("shared money, loss and the deep"), and then
it stops. It never crosses the last inch into **delineation** — what an
astrologer sitting across the table would actually *say* that placement means for
this person's life: how you love, where your money comes from, what you're drawn
to, what tends to go wrong, what you're quietly good at.

Two things are missing, and they're the two the user named:

1. **What those things mean *to an astrologer*.** Why does a reader care that
   Venus is peregrine in the 8th? What does it *tell them* about you? Right now
   the app reports the fact; it doesn't convey the significance.
2. **What an astrologer would *tell you*.** The delivery across the table — the
   concrete life-read and the practical counsel. The app describes the
   instrument; it never plays the music.

The north star: **hide the receipts, and a working astrologer reading the output
should say "yes — that's what I'd tell this person."**

---

## The discovery that makes this cheap

**The delineation is already written, and almost none of it reaches the reader.**

- `DATA.SIG[planet]` carries, per planet:
  - `qualities` — a **well-placed vs poorly-placed character read**. For the Moon:
    *"Well placed she is composed, soft-spoken, tender toward what she keeps, a
    lover of peace and of home. Poorly placed the same fluidity becomes drift —
    unstable, idle, a vagabond of moods, carried by whoever stands nearest."*
    That is *exactly* "what an astrologer would tell you" — and it is keyed to the
    planet's state, which the engine already computes.
  - `vocations` — what work the planet suits (the profession read).
  - `persons`, `body`, `matters`, `karakas` — the full significations.
- `DATA.HOUSE_SIG[house]` carries each house's real matters / persons / body
  (Lilly's house chapters, in our voice). **Used nowhere in the app.**
- `ANALOGY_MATRIX` already says which matter each planet voices first in each
  house, and by what right (joy / Chaldean / karaka / analogy).

Today the composed reading surfaces only `speaksFirst.matter` (one derived
phrase) and the Lilly score. The rich delineation — the character, the vocation,
the concrete house matters — sits in the corpus unused. **We have the
astrologer's words and we have the selector (the computed state); we just never
wired them together.** That is why it feels thin.

---

## What an astrologer actually delivers (the target)

A reading is not a list of placements. It answers the questions a person brings:

- **Who am I?** temperament, character, how my mind works, how I come across
- **What am I good at / what should I do?** vocation and calling
- **Money** — where it comes from, where it leaks
- **Love & marriage** — how I bond, what I'm drawn to, the cast of the partner
- **Family** — the parents and home I came from, the home I make, children
- **Health & the body** — the constitution and its weak points
- **The shape of the life** — fortunate where, tried where, what to lean on

Each answered **concretely, from the actual chart, inflected by the actual
state** — "here's what this means for *you*," never "here is the configuration."

---

## Workstreams

### A — the placement delineation ("so, for you, this means…")
For every significator, compose a delineation that **delivers** the significations,
selected by state — placed ABOVE the technical line (receipt + score move beneath
as "the working"):
- the **character** from `SIG.qualities`: the *well-placed* clause when the planet
  is dignified/strong, the *poorly-placed* clause when debilitated/peregrine — the
  Lilly score already decides which.
- **what it means here**: `HOUSE_SIG[house].matters` narrowed by the planet's
  `karakas` — the concrete life-matters, not one phrase ("gain through the
  partner, legacies, the goods of the dead; a pull toward the hidden and intense"),
  with `ANALOGY_MATRIX` choosing what leads.
- the **practical read**: strong → "this pays — lean on it"; weak → "this arrives
  late, through others, at cost — the work is X."

### B — the topical reads (answer the client's questions)
A "your life, by department" set of synthesized paragraphs, each reading a house
for its real topic from `HOUSE_SIG` + the lord's condition + any occupants +
receptions:
- **Money** — 2nd + its lord + occupants + Part of Fortune: where wealth gathers, where it leaks.
- **Work & calling** — 10th + its lord + the almuten of the MC + `SIG.vocations` of Mars/Mercury/Venus: what you're built to do.
- **Love & marriage** — 7th + its lord + Venus/Mars + receptions into the 7th: how you bond, what draws you, the partner's cast.
- **Family** — 4th (father) / 10th (mother) / 5th (children) / the roots.
- **Body & health** — 1st + its lord + the 6th + `SIG.body` of the afflicted planets: the constitution and its weak points.
- **Mind & character** — Mercury + the Moon + the Ascendant-lord: how you think and come across.

Each ends with the astrologer's practical counsel for that department. This is
the section a client actually wants, and the app currently has no equivalent.

### C — state as the *interpreter*, not just a score
Make the computed condition **drive the interpretation**, not merely report a
number. This is the small engine piece everything else calls:
- **dignity** → which `SIG.qualities` clause fires (well vs poorly placed), and
  whether a house's benefit arrives clean or comes hard.
- **sect** → benefic delivers cleanly or over-promises; malefic bites or merely tests.
- **reception / dispositor** → "it delivers *through* [dispositor] / through other people."
- **combustion / retrograde / angularity** → the concrete inflection (hidden, delayed, doubled, loud).
The same placement must read generously when strong and cautiously when weak —
exactly as an astrologer judges it.

### D — the synthesis / the reader's verdict
The thing a reader says at the end: the **throughline** (what the chart keeps
insisting on), the **two or three real strengths** (dignified significators in
good houses), the **two or three real trials** (afflicted significators, malefics
in bad houses, the out-of-sect malefic), and the **practical counsel** — what to
lean on, what to budget for. One honest, chart-specific paragraph, no hedging.

### E — voice & framing (concrete, but not fortune-telling)
The tradition is concrete ("gain by marriage; illness of the heart; skilled with
iron") — deliver that specificity, but as **inclination and tendency, not
decree**: "the classical reading is…", "you likely find…", "this inclines
toward…". Keep the map-not-verdict frame; no pop, no fatalism. The
`qualities`/`vocations`/`HOUSE_SIG` text is already in this register — extend it,
don't fight it.

---

## Sequencing (suggested)

1. **C — state-as-interpreter selector.** The small shared function that turns a
   `determination` into the right delineation clauses. Everything else uses it.
2. **A — placement delineation.** The biggest single lift: wire
   `SIG.qualities` + `HOUSE_SIG` + `ANALOGY_MATRIX` into the zoom card and the
   Read flow, above the technical line.
3. **B — topical reads.** The "your money / love / work / family / health / mind"
   section — the thing a person came for.
4. **D — the synthesis verdict.**
5. **E — voice** folded through all of them.

Each step ships behind the harness floor: **golden** (pins judged meaning —
new prose must not move the underlying judgment), **doctrine**, the 3-width
**UI audit**, and the **voice-book** check. Because the delineation is selected by
the *same* state golden already pins, golden stays green while the words get far
more specific.

## The test that matters

Show a working astrologer a chart's output with the technical receipts hidden.
They should say: *"yes — that's what I'd tell this person."* And a beginner should
finish the reading knowing three concrete things **about their life** the chart
pointed to — not three technical facts about their chart.
