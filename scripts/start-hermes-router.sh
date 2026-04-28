#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/mnt/c/Antigravity"
SERVICE_DIR="$REPO_ROOT/services/hermes-router"
VENV_DIR="$SERVICE_DIR/.venv"
LOG_FILE="$REPO_ROOT/logs/hermes-router.log"
ENV_CANDIDATES=(
  "/mnt/c/Antigravity/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
)

mkdir -p "$(dirname "$LOG_FILE")"

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Hermes Router launcher triggered ==="

  # Load env if available
  for env_file in "${ENV_CANDIDATES[@]}"; do
    if [[ -f "$env_file" ]]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Loading env: $env_file"
      set -a
      # shellcheck disable=SC1090
      source "$env_file" || true
      set +a
      break
    fi
  done

  export PYTHONIOENCODING=utf-8
  export PYTHONUNBUFFERED=1

  # Create venv if missing
  if [[ ! -d "$VENV_DIR" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating venv at $VENV_DIR"
    python3 -m venv "$VENV_DIR"
  fi

  # Install / upgrade deps
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Installing dependencies..."
  "$VENV_DIR/bin/pip" install --quiet -r "$SERVICE_DIR/requirements.txt"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Hermes Router on port ${HERMES_ROUTER_PORT:-11435}"
} >> "$LOG_FILE" 2>&1

cd "$SERVICE_DIR"
exec "$VENV_DIR/bin/python" hermes_router.py 2>&1 | tee -a "$LOG_FILE"
