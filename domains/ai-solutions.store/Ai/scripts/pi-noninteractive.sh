#!/usr/bin/env bash
set -euo pipefail
PI="${1:-pi}"
PROVIDER="${2:-ollama}"
MODEL="${3:-ornith:9b}"
PROMPT="${4:-Reply with exactly: pi-noninteractive-ok}"
export PATH="/c/Users/joshl/AppData/Roaming/npm:$PATH"
"$PI" --offline --no-tools --no-extensions --no-context-files --no-prompt-templates --no-skills --no-builtin-tools --session-dir /tmp/pi-session --provider "$PROVIDER" --model "$MODEL" --print "$PROMPT"
