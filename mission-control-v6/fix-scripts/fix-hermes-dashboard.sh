#!/usr/bin/env bash
# EASY BUTTON: Hermes Dashboard (port ${HERMES_DASH_PORT:-9119})
set -euo pipefail
PORT="${HERMES_DASH_PORT:-9119}"
if (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; then echo "[fix] already up"; exit 0; fi
echo "[fix] starting: hermes dashboard --port ${PORT}"
nohup hermes dashboard --port "${PORT}" --host 127.0.0.1 >/tmp/hermes-dashboard.log 2>&1 &
echo "[fix] issued (log: /tmp/hermes-dashboard.log)"
