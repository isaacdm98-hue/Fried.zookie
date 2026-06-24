# Gemma 4 — on device (PWA)

A tiny, reliable PWA that runs Google's **Gemma 4** entirely in the browser on
**WebGPU**, using **MediaPipe LLM Inference for Web** (Google AI Edge / LiteRT) —
the same runtime family as the native Google AI Edge app, so it loads the
**LiteRT `.task` / `.litertlm`** Gemma 4 models that actually run on phones
(including the ~1 GB QAT-mobile build).

No server, nothing leaves the device. Deliberately minimal (no heavy animations)
so it won't crash iOS Safari.

## Use it
1. Open over **HTTPS** (or localhost). On iPhone: iOS 26+ Safari.
2. **Get a model file** — a browser-ready Gemma 4, e.g.
   [litert-community/gemma-4-E2B-it-litert-lm](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm)
   (accept Google's licence on the page). Pick a file ending in `-web.task` or
   `-Web.litertlm`.
3. In the app, tap **Choose model file…** and select it (or paste a CORS-enabled
   direct URL). It's saved to **IndexedDB**, so next launch it loads locally with
   no re-download — tap **Use saved model**.
4. Chat. It runs on your GPU.

## Why this works where the ONNX/transformers.js path struggled
- Gemma 4's mobile models are **LiteRT** (`.task`/`.litertlm`), not ONNX —
  MediaPipe's web runtime loads them directly.
- The **QAT-mobile** quant shrinks Gemma 4 E2B to ~1 GB, under Safari's storage
  ceiling.
- Picking the file locally (or saving to IndexedDB) avoids flaky multi-GB
  downloads and CORS/licence-gating at runtime.

## Quick test without any host
```
cd gemma4-pwa
npx serve -l 3000
npx cloudflared tunnel --url http://localhost:3000   # instant HTTPS, no account
```
Open the printed `https://…trycloudflare.com` on your iPhone → Share → Add to Home Screen.
