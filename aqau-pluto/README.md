# Aqau Pluto

A vibe-coding studio that runs entirely on-device in the browser, with a working
astrologer built in. Install to the home screen and it works offline.

Served (once Pages is deployed) at `…/aqau-pluto/`.

## What's in this build

### Gemma 4 is the main brain
Gemma 4 (`onnx-community/gemma-4-E2B-it-ONNX`, with a larger `E4B` option) runs
through **transformers.js v4** on **WebGPU** — the same setup as the
[`webml-community/gemma-4-webgpu-kernels`](https://huggingface.co/spaces/webml-community/gemma-4-webgpu-kernels)
space. It's the default, recommended model. The older Qwen / Gemma 2 models stay
available on `web-llm` as lighter fallbacks.

Both runtimes sit behind one interface (`engine.chat.completions.create`), so the
rest of the app doesn't care which is loaded.

### Startup prebuild (many requests up front)
On first load, once the model is ready, Aqau Pluto fires a burst of requests to
already "know" itself and the sky before you ask:
- a short self-introduction (what Aqau Pluto is) — shown on the home screen and
  when you open a fresh cartridge,
- the essence of all twelve signs,
- today's transit reading — pre-seeded into the whiteboard.

Results are cached in `localStorage`, so the burst only runs once per model/day.

### Internet features (optional, online-only)
Works fully offline. When you're connected and **Web research** is on (Settings),
Gemma can reach the web to ground its answers:
- paste a URL and it reads the page (via `r.jina.ai`),
- otherwise it pulls encyclopaedia context (Wikipedia REST, CORS-friendly).

Arm the ⌕ button in the chat bar to make the next message search. An online/offline
dot sits next to the title.

### Notebook (odysseus-inspired)
A quiet markdown notebook (`✑` on the home bar) where Gemma can **improve**,
**continue**, or **summarise** what you write — using the web for grounding when
available.

### Atelier — draw & design (`✎` on the home bar)
A vector drawing studio built on **paper.js**:
- brush, line, rectangle, ellipse and eraser tools, a colour palette and size,
- undo / clear, export to **PNG** or **SVG**, a saved-drawing gallery,
- **Gemma draws it** (`✦`): describe something and Gemma returns an SVG that's
  imported straight onto the canvas — grounded with the web when online.

**Draw assets into your builds.** In a cartridge, tap `✎` (or accept the
"want to draw it yourself first?" prompt that appears when you mention a game,
character, sprite, logo, etc.). You're dropped into the Atelier; draw it, tap
**→ use**, and the drawing is handed back as an SVG asset. Gemma then reuses that
exact artwork in the build — so the character you drew becomes the character in
the game. Assets ride along in the cartridge for every later edit.

This is the part that adapts the drawing repos. paper.js is the engine; the
brush/shape/colour tooling takes after **Krita**'s painting workflow; the AI-SVG
and gallery flow takes after **Penzil**'s local-first sketching. (Krita is a
native C++ app and Penzil is a Vue + three.js *3D* tool — neither ports verbatim
to a single-file PWA, so a true 3D grease-pencil mode is a clear next step rather
than a half-working stub.)

### Design briefs + slash commands
- **Design briefs** (Settings) — pick a house style (editorial, brutalist, soft,
  terminal, playful) and Gemma honours it on every build. This is open-design's
  "design system shapes the artifact" idea, fitted to Aqau Pluto's cartridges.
- **Slash commands** in chat (claude-code style): `/improve`, `/smaller`,
  `/prettier`, `/accessible`, `/faster`, `/deck <topic>`, `/draw <thing>`,
  `/help`.

## Why some odysseus features aren't here
[odysseus](https://github.com/pewdiepie-archdaemon/odysseus) is a server-side
(Python/Docker) workspace. Its server-only pieces — IMAP/SMTP email, CalDAV
calendar sync, Docker deployment, the image gallery — don't map onto a fully
on-device PWA, so they're intentionally left out. Its model-management,
document-editing, and web-research ideas are the ones adapted above.
