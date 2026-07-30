#!/usr/bin/env bash
# EASY BUTTON: Date-app FastAPI backend (port ${BACKEND_PORT:-8000})
set -euo pipefail
PORT="${BACKEND_PORT:-8000}"
cd "$(dirname "$0")/../../backend/fastapi-app"
echo "[fix] starting uvicorn from $(pwd)"
nohup .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" >/tmp/dateapp-backend.log 2>&1 &
echo "[fix] issued. health: http://localhost:${PORT}/api/v1/health"
