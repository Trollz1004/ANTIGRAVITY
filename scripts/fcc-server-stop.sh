#!/usr/bin/env bash
# Stop fcc-server
set -euo pipefail

FCC_HOME="${HOME}/.fcc"
PID_FILE="${FCC_HOME}/logs/server.pid"

if [[ -f "${PID_FILE}" ]]; then
  OLD_PID=$(cat "${PID_FILE}")
  if kill -0 "${OLD_PID}" 2>/dev/null; then
    kill "${OLD_PID}" 2>/dev/null
    echo "Stopped fcc-server (PID ${OLD_PID})"
  else
    echo "No running fcc-server found"
  fi
  rm -f "${PID_FILE}"
else
  pkill -f fcc-server 2>/dev/null && echo "Stopped fcc-server" || echo "No fcc-server process found"
fi
