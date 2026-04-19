#!/usr/bin/env bash
# Setup Copilot CLI to use local Ollama on Sabretooth
# Run: source paperclip/copilot-ollama-config/setup-copilot-ollama.sh

set -euo pipefail

export COPILOT_PROVIDER_BASE_URL="http://localhost:11434"
export COPILOT_MODEL="qwen2.5:7b"
export COPILOT_OFFLINE="true"

echo "✓ Copilot CLI configured for local Ollama"
echo "  Provider: $COPILOT_PROVIDER_BASE_URL"
echo "  Model:    $COPILOT_MODEL"
echo "  Offline:  $COPILOT_OFFLINE"
echo ""
echo "Run 'copilot' to start."
