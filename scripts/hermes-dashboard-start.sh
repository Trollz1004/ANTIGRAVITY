#!/usr/bin/env bash
# Hermes Dashboard Launcher — WSL version
# Starts Hermes Agent dashboard on port 9119
set -euo pipefail

HERMES_BIN="/mnt/c/Users/joshl/AppData/Local/hermes/hermes-agent/venv/Scripts/hermes.exe"
HERMES_ENV="/mnt/c/Users/joshl/AppData/Local/hermes/.env"
HERMES_CONFIG="/mnt/c/ANTIGRAVITY/hermes/hermes-dashboard.yaml"

# Source env vars
if [[ -f "${HERMES_ENV}" ]]; then
  set -a
  source "${HERMES_ENV}"
  set +a
fi

echo "Starting Hermes Dashboard..."
echo "URL: http://localhost:9119"
echo "Config: ${HERMES_CONFIG}"
echo ""

exec "${HERMES_BIN}" dashboard --port 9119 --host 127.0.0.1 --no-open
