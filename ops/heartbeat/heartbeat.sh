#!/bin/bash
# Heartbeat health check for ANTIGRAVITY date app
# Runs every 15 minutes via Task Scheduler

API="http://127.0.0.1:8000/api/v1"
LOG="C:/ANTIGRAVITY/ops/heartbeat/heartbeat.log"
MAX_LOG_SIZE=1048576  # 1MB

# Rotate log if too large
if [ -f "$LOG" ] && [ $(stat -c%s "$LOG" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG" "$LOG.old"
fi

echo "=== $(date) ===" >> "$LOG"

# Check backend
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" "$API/health" 2>/dev/null)
if [ "$BACKEND" = "200" ]; then
    echo "BACKEND: OK ($BACKEND)" >> "$LOG"
else
    echo "BACKEND: FAIL ($BACKEND) - restarting..." >> "$LOG"
    # Restart backend
    taskkill -F -IM python.exe 2>/dev/null
    sleep 2
    cd "C:/ANTIGRAVITY/backend/fastapi-app" && powershell -Command "Start-Process 'C:\ANTIGRAVITY\backend\fastapi-app\.venv\Scripts\python.exe' -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory 'C:\ANTIGRAVITY\backend\fastapi-app' -WindowStyle Hidden"
    sleep 5
    echo "BACKEND: restarted" >> "$LOG"
fi

# Check frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3200/" 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
    echo "FRONTEND: OK ($FRONTEND)" >> "$LOG"
else
    echo "FRONTEND: FAIL ($FRONTEND)" >> "$LOG"
fi

# Check Redis
REDIS=$(redis-cli ping 2>/dev/null)
if [ "$REDIS" = "PONG" ]; then
    echo "REDIS: OK" >> "$LOG"
else
    echo "REDIS: FAIL - restarting..." >> "$LOG"
    cd "C:/Users/joshi/redis-win" && powershell -Command "Start-Process 'C:\Users\joshi\redis-win\redis-server.exe' -ArgumentList '--dir','C:\Users\joshi\redis-win\data' -WindowStyle Hidden"
    sleep 2
    echo "REDIS: restarted" >> "$LOG"
fi

# Check public site
PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" "https://youandinotai.com" 2>/dev/null)
if [ "$PUBLIC" = "200" ]; then
    echo "PUBLIC: OK ($PUBLIC)" >> "$LOG"
else
    echo "PUBLIC: FAIL ($PUBLIC)" >> "$LOG"
fi

echo "---" >> "$LOG"
