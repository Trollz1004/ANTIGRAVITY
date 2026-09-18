#!/bin/bash
# CRM self-host starter — MongoDB (native) + FastAPI backend + React frontend.
# Build from scratch per Joshua 2026-08-26 (Emergent host no longer available).
# Run: bash crm/ops/start-crm.sh   (idempotent — safe to run on every startup)

set -e
CRM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONGO_BIN="$CRM_ROOT/.runtime/mongo/mongodb-win32-x86_64-windows-8.0.29/bin/mongod.exe"
MONGO_DATA="$CRM_ROOT/.runtime/mongo-data"
BACKEND_PORT=8001
FRONTEND_PORT=3001

echo "=== CRM stack check ==="

# 1. MongoDB (native binary — no Docker dependency)
if curl -s -m 3 http://127.0.0.1:27017 > /dev/null 2>&1; then
  echo "  [ok] MongoDB already up (27017)"
else
  echo "  [start] MongoDB..."
  mkdir -p "$MONGO_DATA"
  nohup "$MONGO_BIN" --dbpath "C:\\ANTIGRAVITY\\crm\\.runtime\\mongo-data" \
    --port 27017 --bind_ip 127.0.0.1 \
    --logpath "C:\\ANTIGRAVITY\\crm\\.runtime\\mongod.log" --logappend > /dev/null 2>&1 &
  sleep 5
  curl -s -m 3 http://127.0.0.1:27017 > /dev/null 2>&1 && echo "  [ok] MongoDB up" || echo "  [WARN] MongoDB not answering — check .runtime/mongod.log"
fi

# 2. FastAPI backend (venv at crm/backend/.venv)
if curl -s -m 3 http://127.0.0.1:$BACKEND_PORT/api/ > /dev/null 2>&1; then
  echo "  [ok] Backend up ($BACKEND_PORT)"
else
  echo "  [start] Backend (uvicorn :$BACKEND_PORT)..."
  cd "$CRM_ROOT/backend"
  PYTHONIOENCODING=utf-8 nohup .venv/Scripts/python.exe -m uvicorn server:app \
    --host 127.0.0.1 --port $BACKEND_PORT > "$CRM_ROOT/backend/server.log" 2>&1 &
  sleep 6
  curl -s -m 3 http://127.0.0.1:$BACKEND_PORT/api/ > /dev/null 2>&1 && echo "  [ok] Backend up" || echo "  [WARN] Backend not answering — check backend/server.log"
fi

# 3. Frontend (built at crm/frontend/build, served statically)
if curl -s -m 3 http://127.0.0.1:$FRONTEND_PORT/ > /dev/null 2>&1; then
  echo "  [ok] Frontend up ($FRONTEND_PORT)"
else
  echo "  [start] Frontend (serve :$FRONTEND_PORT)..."
  cd "$CRM_ROOT/frontend"
  nohup npx serve -s build -l $FRONTEND_PORT > "$CRM_ROOT/frontend/serve.log" 2>&1 &
  sleep 4
  curl -s -m 3 http://127.0.0.1:$FRONTEND_PORT/ > /dev/null 2>&1 && echo "  [ok] Frontend up" || echo "  [WARN] Frontend not answering — check frontend/serve.log"
fi

echo "=== CRM ready ==="
echo "  API:      http://127.0.0.1:$BACKEND_PORT/api/   (docs: /docs)"
echo "  App:      http://127.0.0.1:$FRONTEND_PORT/"
echo "  MongoDB:  mongodb://127.0.0.1:27017  db=crm"
