#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/mnt/c/ANTIGRAVITY"
LOG_FILE="/mnt/c/ANTIGRAVITY/logs/paperclip-ceo-wsl.log"
ENV_CANDIDATES=(
  "/mnt/c/ANTIGRAVITY/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
)

mkdir -p "$(dirname "$LOG_FILE")"
{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] === WSL CEO orchestration bootstrap triggered ==="
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
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Hermes from Windows venv inside WSL"
} >> "$LOG_FILE" 2>&1

exec /mnt/c/Users/joshl/.local/hermes-venv/Scripts/hermes.exe chat
