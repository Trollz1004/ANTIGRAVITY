#!/bin/bash
# ANTIGRAVITY Autonomous Operations 15-Minute Cycle
# ==================================================
# This script runs every 15 minutes and does the following:
# 1. Health-check all services (backend, frontend, Redis, tunnel)
# 2. Auto-restart any down service
# 3. Run daily digest and social media posts
# 4. Log everything to ops/heartbeat/
# ==================================================

LOG_DIR="C:/ANTIGRAVITY/ops/heartbeat"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/autonomous_$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ---- STEP 1: HEALTH CHECK ----
log "=== AUTONOMOUS CYCLE START ==="

# Check backend API
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/v1/health" 2>/dev/null)
if [ "$BACKEND_HEALTH" = "200" ]; then
    log "Backend API: OK (HTTP $BACKEND_HEALTH)"
else
    log "Backend API: DOWN (HTTP $BACKEND_HEALTH) - RESTARTING..."
    taskkill -F -PID $(netstat -ano | grep ":8000" | grep LISTEN | awk '{print $5}') 2>/dev/null
    sleep 2
    cd "C:/ANTIGRAVITY/backend/fastapi-app"
    powershell -Command "Start-Process 'C:\ANTIGRAVITY\backend\fastapi-app\.venv\Scripts\python.exe' -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory 'C:\ANTIGRAVITY\backend\fastapi-app' -WindowStyle Hidden"
    sleep 5
    RESTARTED=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/v1/health" 2>/dev/null)
    log "Backend API: RESTARTED (HTTP $RESTARTED)"
fi

# Check frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3200/" 2>/dev/null)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    log "Frontend: OK (HTTP $FRONTEND_HEALTH)"
else
    log "Frontend: DOWN (HTTP $FRONTEND_HEALTH)"
fi

# Check Redis
REDIS_PING=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    log "Redis: OK"
else
    log "Redis: DOWN - RESTARTING..."
    cd "C:/Users/joshi/redis-win"
    powershell -Command "Start-Process 'C:\Users\joshi\redis-win\redis-server.exe' -ArgumentList '--dir','C:\Users\joshi\redis-win\data' -WindowStyle Hidden"
    sleep 2
    log "Redis: RESTARTED"
fi

# Check public site
PUBLIC_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://youandinotai.com" 2>/dev/null)
log "Public site: HTTP $PUBLIC_HTTP"

# Check Square connectivity
SQUARE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://connect.squareup.com/v2/locations" -H "Authorization: Bearer $(grep SQUARE_ACCESS_TOKEN C:/ANTIGRAVITY/backend/fastapi-app/.env | cut -d= -f2)" 2>/dev/null)
log "Square API: HTTP $SQUARE_HEALTH"

# ---- STEP 2: DAILY DIGEST ----
HOUR=$(date +%H)
MINUTE=$(date +%M)
if [ "$HOUR" = "08" ] && [ "$MINUTE" -lt "15" ]; then
    log "Generating daily growth digest..."
    cd "C:/ANTIGRAVITY/ops/growth-engine"
    python daily_digest.py 2>&1 >> "$LOG_DIR/daily_digest.log"
    log "Daily digest: generated"
fi

# ---- STEP 3: SOCIAL MEDIA POSTING ----
# Post every 2 hours (8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm)
if [ $(($MINUTE % 120)) -lt "15" ]; then
    log "Checking for scheduled social media posts..."
    cd "C:/ANTIGRAVITY/ops/growth-engine"
    python social_publisher.py 2>&1 >> "$LOG_DIR/social_publisher.log"
    log "Social media: checked for scheduled posts"
fi

# ---- STEP 4: LOG CLEANUP ----
# Keep only 7 days of logs
find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null

log "=== AUTONOMOUS CYCLE COMPLETE ==="
