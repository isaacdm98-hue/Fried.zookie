#!/usr/bin/env bash
# Put the Gemma 4 weights *inside* the PWA so it never has to pull from
# Hugging Face at runtime. Run this once from the aqau-pluto/ folder:
#
#   bash tools/fetch-gemma.sh           # text-only (lighter, ~1.5 GB)
#   bash tools/fetch-gemma.sh full      # multimodal: + vision/audio encoders
#
# Needs Python + the huggingface_hub CLI:  pip install -U "huggingface_hub[cli]"
# After it finishes, serve the folder over HTTPS/localhost and the app loads
# the model from ./models/ automatically (no download, fully offline).

set -euo pipefail
REPO="onnx-community/gemma-4-E2B-it-ONNX"
DEST="models/${REPO}"
MODE="${1:-text}"

mkdir -p "$DEST"

if command -v huggingface-cli >/dev/null 2>&1; then
  if [ "$MODE" = "full" ]; then
    echo "Downloading FULL multimodal Gemma 4 (text + vision + audio)…"
    huggingface-cli download "$REPO" --include "*.json" "onnx/*q4f16*" --local-dir "$DEST"
  else
    echo "Downloading TEXT-ONLY Gemma 4 (decoder + embeddings)…"
    huggingface-cli download "$REPO" \
      --include "*.json" "onnx/*decoder*q4f16*" "onnx/*embed*q4f16*" "onnx/model_q4f16*" \
      --local-dir "$DEST"
  fi
else
  echo "huggingface-cli not found. Install it with:  pip install -U \"huggingface_hub[cli]\""
  echo "Or download these files from https://huggingface.co/${REPO}/tree/main into ${DEST}/"
  exit 1
fi

echo
echo "Done. Weights are now in ${DEST}/"
echo "Serve aqau-pluto over HTTPS or localhost and the app will load them locally."
