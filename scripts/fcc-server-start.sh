#!/usr/bin/env bash
# FCC-Server launcher for WSL
# Starts free-claude-code proxy on port 8082 with Admin UI at /admin
set -euo pipefail

FCC_HOME="${HOME}/.fcc"
LOG_FILE="${FCC_HOME}/logs/server.out"
PID_FILE="${FCC_HOME}/logs/server.pid"

mkdir -p "${FCC_HOME}/logs"

# Check if already running
if [[ -f "${PID_FILE}" ]]; then
  OLD_PID=$(cat "${PID_FILE}")
  if kill -0 "${OLD_PID}" 2>/dev/null; then
    echo "fcc-server already running (PID ${OLD_PID})"
    echo "Admin UI: http://127.0.0.1:8082/admin"
    exit 0
  fi
  rm -f "${PID_FILE}"
fi

export PATH="${HOME}/.local/bin:${PATH}"

echo "Starting fcc-server..."
echo "Logs: ${LOG_FILE}"
echo "Admin UI: http://127.0.0.1:8082/admin"

nohup fcc-server > "${LOG_FILE}" 2>&1 &
FCC_PID=$!
echo ${FCC_PID} > "${PID_FILE}"

# Wait for health
for i in $(seq 1 10); do
  if curl -sf http://127.0.0.1:8082/health >/dev/null 2>&1; then
    echo "fcc-server healthy (PID ${FCC_PID})"
    exit 0
  fi
  sleep 1
done

echo "WARNING: fcc-server started but health check timed out"
echo "Check logs: tail -20 ${LOG_FILE}"
exit 1
