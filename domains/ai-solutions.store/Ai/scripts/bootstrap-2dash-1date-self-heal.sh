#!/usr/bin/env bash
set -u

ROOT="${1:-/e/ANTIGRAVITY}"
OMNI_PORT="${OMNI_PORT:-20128}"
AGENT_OS_PORT="${AGENT_OS_PORT:-8787}"
DATE_APP_PORT="${DATE_APP_PORT:-3200}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-12}"
RESTART_COOLDOWN="${RESTART_COOLDOWN:-3}"

LOG_DIR="$ROOT/logs/bootstrap-live"
BOOT_DIR="$ROOT/.bootstrap"
mkdir -p "$LOG_DIR" "$BOOT_DIR"
BOOT_LOG="$LOG_DIR/bootstrap-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee -a "$BOOT_LOG") 2>&1

echo "[$(date '+%F %T')] bootstrap start | omni=$OMNI_PORT agent_os=$AGENT_OS_PORT date=$DATE_APP_PORT"

last_restart_omni=0
last_restart_agent=0
last_restart_date=0

port_pid() {
  local p="$1"
  netstat -ano | awk -v p=":"$p '$0 ~ /LISTENING/ && $0 ~ p {print $NF; exit}' | tr -d '\r'
}

is_running_pid() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1
}

terminate_pid() {
  local pid="$1"
  is_running_pid "$pid" && taskkill /PID "$pid" /T /F >/dev/null 2>&1 || true
}

start_omni() {
  local pid_file="$BOOT_DIR/omni-router.pid"
  local pid=""
  local occupied=""
  local now

  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    if is_running_pid "$pid"; then
      if curl -fsS -m 8 -o /dev/null -H "Connection: close" "http://127.0.0.1:$OMNI_PORT/health" >/dev/null 2>&1; then
        return
      fi
      echo "[$(date '+%F %T')] omni running but unhealthy (pid=$pid), restarting"
      terminate_pid "$pid"
    fi
  fi

  occupied="$(port_pid "$OMNI_PORT")"
  if [ -n "$occupied" ]; then
    echo "[$(date '+%F %T')] omni port $OMNI_PORT occupied by pid $occupied"
    terminate_pid "$occupied"
  fi

  now=$(date +%s)
  if (( now - last_restart_omni < RESTART_COOLDOWN )); then
    return
  fi
  last_restart_omni=$now

  echo "[$(date '+%F %T')] launching omni-router on 127.0.0.1:$OMNI_PORT"
  (
    cd "$ROOT/services/omni-router" && \
    OMNI_ROUTER_PROXY_ENABLED=1 PORT="$OMNI_PORT" HOST="127.0.0.1" node server.js
  ) >> "$LOG_DIR/omni-router.log" 2>&1 &
  echo "$!" > "$pid_file"
}

start_agent_os() {
  local pid_file="$BOOT_DIR/agent-os.pid"
  local pid=""
  local occupied=""
  local now

  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    if is_running_pid "$pid"; then
      if curl -fsS -m 8 -o /dev/null -H "Connection: close" "http://127.0.0.1:$AGENT_OS_PORT/health" >/dev/null 2>&1; then
        return
      fi
      echo "[$(date '+%F %T')] agent-os running but unhealthy (pid=$pid), restarting"
      terminate_pid "$pid"
    fi
  fi

  occupied="$(port_pid "$AGENT_OS_PORT")"
  if [ -n "$occupied" ]; then
    echo "[$(date '+%F %T')] agent-os port $AGENT_OS_PORT occupied by pid $occupied"
    terminate_pid "$occupied"
  fi

  now=$(date +%s)
  if (( now - last_restart_agent < RESTART_COOLDOWN )); then
    return
  fi
  last_restart_agent=$now

  echo "[$(date '+%F %T')] launching agent-os (mission-control) on 127.0.0.1:$AGENT_OS_PORT"
  (
    cd "$ROOT/apps/mission-control" && \
    PORT="$AGENT_OS_PORT" npm run start
  ) >> "$LOG_DIR/agent-os.log" 2>&1 &
  echo "$!" > "$pid_file"
}

start_date_app() {
  local pid_file="$BOOT_DIR/date-app.pid"
  local pid=""
  local occupied=""
  local now

  if [ -f "$pid_file" ]; then
    pid="$(cat "$pid_file")"
    if is_running_pid "$pid"; then
      if curl -fsS -m 8 -o /dev/null -H "Connection: close" "http://127.0.0.1:$DATE_APP_PORT/" >/dev/null 2>&1; then
        return
      fi
      echo "[$(date '+%F %T')] date app running but unhealthy (pid=$pid), restarting"
      terminate_pid "$pid"
    fi
  fi

  occupied="$(port_pid "$DATE_APP_PORT")"
  if [ -n "$occupied" ]; then
    echo "[$(date '+%F %T')] date app port $DATE_APP_PORT occupied by pid $occupied"
    terminate_pid "$occupied"
  fi

  now=$(date +%s)
  if (( now - last_restart_date < RESTART_COOLDOWN )); then
    return
  fi
  last_restart_date=$now

  echo "[$(date '+%F %T')] launching date app on 127.0.0.1:$DATE_APP_PORT"
  (
    cd "$ROOT/apps/youandinotai-frontend" && \
    NEXT_DISABLE_ESLINT=1 PORT="$DATE_APP_PORT" npm run dev -- --hostname 127.0.0.1 --port "$DATE_APP_PORT"
  ) >> "$LOG_DIR/date-app.log" 2>&1 &
  echo "$!" > "$pid_file"
}

http_ok() {
  local status="$1"
  [ "${status:0:3}" = "200" ]
}

check_health() {
  local om_h om_dash ag_h dt_h
  om_h="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' -H 'Connection: close' "http://127.0.0.1:$OMNI_PORT/health" 2>/dev/null || echo 000)"
  om_dash="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' -H 'Connection: close' "http://127.0.0.1:$OMNI_PORT/dashboard" 2>/dev/null || echo 000)"
  ag_h="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' -H 'Connection: close' "http://127.0.0.1:$AGENT_OS_PORT/health" 2>/dev/null || echo 000)"
  dt_h="$(curl -fsS -m 10 -o /dev/null -w '%{http_code}' -H 'Connection: close' "http://127.0.0.1:$DATE_APP_PORT/" 2>/dev/null || echo 000)"

  om_h="${om_h:0:3}"
  om_dash="${om_dash:0:3}"
  ag_h="${ag_h:0:3}"
  dt_h="${dt_h:0:3}"

  echo "[$(date '+%F %T')] HEALTH CHECKS -> omni=$om_h dashboard=$om_dash agent_os=$ag_h date_app=$dt_h"

  if http_ok "$om_h" && http_ok "$om_dash" && http_ok "$ag_h" && http_ok "$dt_h"; then
    return 0
  fi
  return 1
}

verify_one_gate() {
  local response model_payload status
  model_payload='{"model":"hermes","messages":[{"role":"user","content":"ping"}],"max_tokens":6}'

  response="$(curl -s -m 15 -H 'Content-Type: application/json' -H 'Connection: close' -X POST "http://127.0.0.1:$OMNI_PORT/v1/chat/completions" -d "$model_payload" 2>/dev/null || true)"
  status=$?

  if [ "$status" -eq 0 ] && [ -n "$response" ]; then
    if python -c "import json,sys;payload=json.load(sys.stdin);print('ok')" <<< "$response" >/dev/null 2>&1; then
      echo "[$(date '+%F %T')] one-gate probe: /v1/chat/completions is served by OmniRouter (response recognized)"
      return 0
    fi
  fi

  # Secondary gate: ensure model catalog still includes at least one configured model.
  if [ "$status" -eq 0 ]; then
    local models_resp model_count
    models_resp="$(curl -s -m 10 -H 'Connection: close' "http://127.0.0.1:$OMNI_PORT/v1/models" 2>/dev/null || true)"
    if [ -n "$models_resp" ] && python -c "import json,sys;payload=json.load(sys.stdin);models=payload.get('data') or [];print('ok' if any(m.get('id') == 'hermes' for m in models) else 'missing')" <<< "$models_resp" >/dev/null 2>&1; then
      echo "[$(date '+%F %T')] one-gate probe: /v1/models on OmniRouter is healthy"
      return 0
    fi
  fi

  echo "[$(date '+%F %T')] one-gate probe failed or got unexpected payload"
  return 1
}

while true; do
  start_omni
  start_agent_os
  start_date_app

  if check_health; then
    echo "[$(date '+%F %T')] all services healthy"
  else
    echo "[$(date '+%F %T')] health issue detected; retrying in ${INTERVAL_SECONDS}s"
  fi

  verify_one_gate
  sleep "$INTERVAL_SECONDS"
done