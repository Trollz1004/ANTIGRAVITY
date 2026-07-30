#!/usr/bin/env bash
# ANTIGRAVITY Mission Control v6 — linux launcher
# Dashboard: http://127.0.0.1:${MC_PORT:-8787}
set -uo pipefail
cd "$(dirname "$0")"

PY="../backend/fastapi-app/.venv/bin/python"
[ -x "$PY" ] || PY="python3"

PORT="${MC_PORT:-8787}"
if curl -s --max-time 2 "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1; then
  echo "[mission-control] already running on http://127.0.0.1:${PORT}"
  exit 0
fi

echo "[mission-control] starting on http://127.0.0.1:${PORT}"
exec "$PY" -m mission_control serve
