# Prepackaged Gemma 4 weights (optional)

If the runtime download from Hugging Face is flaky (e.g. it stalls partway),
you can **bundle the weights into the PWA** and serve them from this folder.
When these files are present, Aqau Pluto loads the model from here instead of
downloading from Hugging Face (it falls back to HF automatically if they're not).

## Where files go

Mirror the Hugging Face repo path under this folder. For the default model
(`onnx-community/gemma-4-E2B-it-ONNX`):

```
aqau-pluto/models/onnx-community/gemma-4-E2B-it-ONNX/
  config.json
  generation_config.json
  tokenizer.json
  tokenizer_config.json
  special_tokens_map.json
  preprocessor_config.json          (only needed for multimodal)
  onnx/
    model_q4f16.onnx                 (text decoder — the big one)
    model_q4f16.onnx_data            (external weights, if present)
    embed_tokens_q4f16.onnx          (+ .onnx_data if present)
    # multimodal only:
    vision_encoder_q4f16.onnx, audio_encoder_q4f16.onnx (+ .onnx_data)
```

Text-only mode needs just the tokenizer files + the decoder/embed `*_q4f16.onnx`
(and their `.onnx_data`). Multimodal mode also needs the vision/audio encoders
and `preprocessor_config.json`.

## How to get the files

From a computer with the Hugging Face CLI:

```
pip install -U huggingface_hub
huggingface-cli download onnx-community/gemma-4-E2B-it-ONNX \
  --include "*.json" "onnx/*q4f16*" \
  --local-dir aqau-pluto/models/onnx-community/gemma-4-E2B-it-ONNX
```

(or download the same files from the model's "Files" tab on huggingface.co).

## Serving notes

- Must be served over HTTPS or localhost (same as the app).
- These are large binaries — make sure your host doesn't strip/transform them
  and serves the `.onnx` / `.onnx_data` with `Content-Type: application/octet-stream`.
- The app's `localModelPath` points at this `models/` folder automatically.
