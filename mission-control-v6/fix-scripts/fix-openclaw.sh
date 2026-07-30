#!/usr/bin/env bash
# EASY BUTTON: OpenClaw gateway + web UI (port ${OPENCLAW_PORT:-18789})
set -euo pipefail
PORT="${OPENCLAW_PORT:-18789}"
if (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; then echo "[fix] already up"; exit 0; fi
echo "[fix] starting: openclaw gateway"
nohup openclaw gateway >/tmp/openclaw.log 2>&1 &
echo "[fix] issued (log: /tmp/openclaw.log)"
