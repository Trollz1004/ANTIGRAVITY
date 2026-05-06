#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/mnt/c/ANTIGRAVITY"
LOG_FILE="/mnt/c/ANTIGRAVITY/logs/opencode-unified-wsl.log"
ENV_CANDIDATES=(
  "/mnt/c/ANTIGRAVITY/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
)

mkdir -p "$(dirname "$LOG_FILE")"
{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Unified OpenCode launcher WSL bootstrap triggered ==="
  cd "$REPO_ROOT"

  for env_file in "${ENV_CANDIDATES[@]}"; do
    if [[ -f "$env_file" ]]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Loading env file: $env_file"
      set -a
      # shellcheck disable=SC1090
      source "$env_file" || true
      set +a
      break
    fi
  done

  export TERM=xterm-256color
  export NO_COLOR=1
  export FORCE_COLOR=0
  export PYTHONIOENCODING=utf-8
  export PYTHONUNBUFFERED=1

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Repo root: $REPO_ROOT"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting unified OpenCode launcher with fallback models"
} >> "$LOG_FILE" 2>&1

# Define model priority order
PRIMARY_MODEL="opencode/glm-5.1"
FALLBACK1_MODEL="google/gemini-2.5-flash"
FALLBACK2_MODEL="ollama/qwen3-coder:480b-cloud"
FALLBACK3_MODEL="claude-sonnet-4-6"
LOCAL_MODEL="qwen3-coder:480b-cloud"

# Try primary model first
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attempting to use primary model: $PRIMARY_MODEL" >> "$LOG_FILE"
if cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" --model "$PRIMARY_MODEL" chat; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Primary model succeeded" >> "$LOG_FILE"
  exit 0
fi

# If primary fails, try fallbacks
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Primary model failed, trying fallback 1: $FALLBACK1_MODEL" >> "$LOG_FILE"
if cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" --model "$FALLBACK1_MODEL" chat; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fallback 1 succeeded" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fallback 1 failed, trying fallback 2: $FALLBACK2_MODEL" >> "$LOG_FILE"
if cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" --model "$FALLBACK2_MODEL" chat; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fallback 2 succeeded" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fallback 2 failed, trying fallback 3: $FALLBACK3_MODEL" >> "$LOG_FILE"
if cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" --model "$FALLBACK3_MODEL" chat; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fallback 3 succeeded" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All cloud models failed, trying local Ollama model: $LOCAL_MODEL" >> "$LOG_FILE"
if cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" --model "ollama/$LOCAL_MODEL" chat; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Local Ollama model succeeded" >> "$LOG_FILE"
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All models failed, falling back to default OpenCode" >> "$LOG_FILE"
exec cmd.exe /c "/mnt/c/Users/joshl/AppData/Roaming/npm/opencode.cmd" chat