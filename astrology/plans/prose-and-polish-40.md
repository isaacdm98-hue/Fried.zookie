# THE 40 — make every word in the app read as though a person wrote it

## What this plan is answering

The astrology is sound and proven (golden pins the judged meaning of five nativities;
doctrine pins the dignity ledgers; a 50-chart stress harness proves nothing crashes).
The **language was not** — and nothing in the harness was measuring it. The reading
shipped with em-dashes at 1.33 per sentence, sentences whose subject was swallowed by
their own aside, verbless fragments, pronouns drifting he/his/it/its inside one
paragraph, and — worst — second-person self-help ("you came here to connect ideas",
"your job is to enjoy what you have") in the *main* placement reading, which is exactly
the register the school rejects.

That is now fixed **for the reading engine's main composers only**, and a
`tests/prose-lint.cjs` gate exists. The same faults almost certainly remain across every
surface the lint does not yet cover, and large parts of `corpus.js` are still written in
the modern personality-profile voice.

**Governing law, unchanged** (`doctrine-notes.md`): domains of a life, never a
personality; state (sign) ≠ circumstances (house); four testimonies to one judgment;
≥2 chart determinants per sentence; every line carries a receipt; the expert
counsel register is NEVER faked.

**New law, added by this plan:** a sentence that does not read as written English is a
defect, tested like any other. Ceilings: **≤0.5 em-dashes/sentence** (target ~0.15), no
verbless fragment, no unclosed aside, no repeated formula inside a passage, no
second-person counsel, one pronoun per subject.

Each of the 40 is a full turn, shipped only when the whole floor is green:
`prose-lint` · `golden` · `doctrine` · `topical-stress` · `screen-audit` · `voiceCheck`.

---

## PHASE A — find out how bad it really is, everywhere (1–8)

**1. Extend the prose lint to every surface.** It currently covers 116 passages from the
reading engine. Add: Today (`composeDailyEssay`, `glanceJudged`, `weekJudged`,
`oddPredictions`), the aspect readings (`judgeAspect`, `pairAspectText`, `DATA.TELLS`),
the forecast detail (profection/firdaria/ZR/returns/eclipses/retro-seasons), synastry
(`composeBond`, `synastry`), the walkthrough beats, `composeCore`, `composeThemes`,
`composeSignatures`, the Book of You, Learn glossary + how-to copy, the sign/planet/house
screens, and the tarot card text. Report per-surface metrics. **This turn produces the
real inventory — expect it to fail loudly, and let it.**

**2. Triage the inventory into a fix ledger.** Classify every hit: (a) machine-text
punctuation, (b) broken grammar, (c) second-person counsel/profiling, (d) repetition,
(e) unexplained jargon. Record counts per surface in this file so progress is measurable
rather than asserted. Decide the order by *how often a user actually sees the surface*.

**3–5. The three big offender surfaces, one turn each.** In descending order of
user exposure (likely Today, then the aspect readings, then the forecast detail):
rewrite the composer's clause grammar the way `placementProse` was rewritten — clean noun
phrases as subjects, dignity/quality images framed with a subject and verb, one pronoun,
`tidyProse` on the way out, dashes cut at the source rather than post-processed.

**6. `corpus.js` register audit — the honest scope.** Grep every second-person
construction (`you are`, `you need`, `your job`, `you hate`, `people feel your`) across
the ~356KB corpus. Much of it is legacy modern-astrology descriptive text
("your drive is mental and scattered; you fight with words, start ten things"). Produce
the full list and a per-table verdict: rewrite, reframe as a domain, or delete.

**7. DECISION POINT — put it to the user.** The corpus rewrite is large and changes the
app's voice. Present three options with samples: (i) reframe as domains (most faithful,
most work), (ii) delete the offending tables and lean on the traditional engine (fastest,
loses breadth), (iii) keep them behind an explicit "modern notes" label so the registers
never blend. **Do not guess this one — it is the app's voice.**

**8. Execute the chosen corpus direction, table by table.** Whatever is chosen, apply it
mechanically with assertion-guarded replacements and a per-table diff, so nothing is
silently mangled in a 356KB file.

## PHASE B — make good prose structural, not a clean-up pass (9–16)

**9. A real clause builder to replace string concatenation.** `tidyProse` repairs output;
this *generates* it. `clause({subject, verb, object, aside, payoff})` with one aside per
sentence, agreement handled once, and punctuation chosen by what the aside contains.
Migrate `placementProse` to it as the reference implementation.

**10–12. Migrate the judged composers to the clause builder** (`judgeHouse`,
`judgeTopic`, `judgeAspect`, `judgeHealth`, `yearAhead`, `natalSynthesis`), one turn per
cluster, verifying the *judgement* never moves (golden) while the prose changes.

**13. Sentence-shape variety.** Right now every passage has the same rhythm: statement,
colon, list. Author 3–4 shapes per beat (periodic, front-loaded, short verdict) selected
by a per-chart seed, so two charts do not read from the same mould. Add a lint check for
shape monotony within a passage.

**14. Kill the boilerplate.** "That is commanding: it can deliver what it signifies, and
add interest" appears in every strong placement. Write 4–6 variants per band and select
by seed; lint for any formula appearing more than twice in one reading.

**15. Explain the jargon in place.** "+7 essential and +8 accidental", "out-dignifies",
"malefic of sect" arrive unglossed. Use the existing tap-to-gloss mechanism on first use
per reading, and keep the number in the receipt rather than the sentence where it reads
as noise.

**16. Prose lint hardening.** Everything learned in 9–15 becomes a check: shape monotony,
boilerplate frequency, unglossed-jargon density, clause length distribution. This is the
turn that makes the standard permanent.

## PHASE C — finish the reading engine's real gaps (17–22)

**17. T3 — the house in its own matters.** `HOUSE_SIG`'s specific significations are
authored but under-used; the house readings still lean on the generic area label.

**18. T8 — reception and dispositor chains as narrative.** The engine computes them; the
reading barely says them. "Venus depends on Saturn, who is himself well placed" is a real
traditional sentence the app currently withholds.

**19. T9 — the almuten as the deciding voice.** When testimonies conflict the almuten
adjudicates; make the sentence say so explicitly, with its score as the receipt.

**20. T10 — degree-level specificity.** Decan/face, Egyptian bounds, the anaretic and 0°
degrees, fixed stars in orb — the fine shading that makes two same-sign charts read
differently.

**21. T16 — the character question, decided honestly.** The 1st house *is* a domain (the
body, the bearing, the first impression) and the tradition reads it. The line to hold is
domain-and-body versus personality-profile. Draft it under the four-testimony structure
with receipts, then have it adversarially reviewed against the doctrine before it ships —
this is the one most likely to reintroduce what Phase A removed.

**22. Cross-domain de-duplication.** A recurring significator (Venus in the 8th) is
re-delineated in several domains. Say it once in full, then cross-reference.

## PHASE D — layout, pacing and feel (23–30)

**23. Screenshot the real thing at three widths, every screen, and look at it.** The
harness proves no runtime errors; it has never judged a layout. Capture and read.

**24–26. The Read screen's pacing, one turn per chapter cluster.** The domain chapter is
long and rich; decide per section what is hero, what is a tap away, what is a receipt.
Collapse, do not delete.

**27. The Today screen as the daily front door.** It is what a returning user sees first;
it should carry one judged thing well rather than several thinly.

**28. Chart screen and the zoom.** The magic zoom is in; verify the wheel's label fit at
375px, the anchor row, and that the reel does not hijack a first visit (it currently
auto-plays over the chart).

**29. Learn and tarot consistency.** Same visual grammar, same voice, same gloss
behaviour as the reading.

**30. Motion, haptics and reduced-motion.** Confirm every new animation degrades to a
calm static state, and that nothing loops distractingly.

## PHASE E — hygiene, proof and delivery (31–40)

**31. Remove the inert video-modal cluster** (`openVideo`, `archiveSearch`,
`drawVideoModal`, `hideVideoFrame`, `UI.video/varc/vframe`). It is unreachable, and it
ships archive.org fetch code into an offline-first app. Careful, staged, verified.

**32. Remove the 13 confirmed dead helpers** (`natalMoonNext`, `rwsFile`, `tarotCard`,
`bodyLine`, `declAspectLine`, `hudStrip`, `todayCardStrip`, `speakAct`, `stageFigure`,
`lwStaging`, `flame9`, `drawFilmLeader`, `drawGear`, `eElastic`) — one commit, whole
harness after.

**33. A single source-of-truth version stamp.** sw.js cache, README, CHANGELOG and an
in-app About currently drift by hand. Derive or assert them in a test.

**34. Performance pass.** Determinations are recomputed inside render paths in places;
audit the per-frame cost at 60fps on a mid phone, and cache what is recomputed.

**35. Offline integrity test.** Automate what the README claims: cold load with the
network cut boots, computes a chart, and shows bundled card art; zero external requests
on first paint.

**36. Accessibility pass.** Contrast at the smallest type, the OpenDyslexic path, tap
target sizes, and the spoken-walkthrough text now that the prose has changed.

**37. Adversarial review of the whole reading, doctrine-first.** Multi-agent, verified,
as before — but with the prose standard added to the ground truth so reviewers judge the
language as well as the astrology.

**38. Fix everything that review confirms.** Budget a full turn; there will be findings.

**39. Final full-floor run + the honest limits.** Every harness green, then write down
plainly what is *not* proven (touch feel, aesthetic judgement, real-world accuracy of
predictions) so the README does not overclaim.

**40. Ship.** Version bump, CHANGELOG written for a reader rather than a changelog,
README trimmed of anything now false, PWA built, delivered, pushed.

---

## The test that matters

Hide the receipts. A literate adult reads any screen and cannot tell it was assembled by
a machine. Sonia reads the same screen and says "yes — that is the chart, and that is how
I read it." Neither test is satisfied by a green harness alone, which is the whole lesson
of this plan.

## Known open questions for the user
1. **Turn 7** — the corpus register decision (reframe / delete / label). Changes the app's voice.
2. **Turn 21** — how far the 1st-house reading may go toward character before it becomes a profile.
3. **Pacing** — how much depth belongs on the first screen versus a tap away; only judgeable on a phone.
