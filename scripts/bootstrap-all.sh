#!/usr/bin/env bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════════
# ANTIGRAVITY BOOTSTRAP — ALL SERVICES (WSL/Linux side)
# Sabretooth node | Paperclip + OpenCode + GPU Ollama + Hermes
# Auto-starts everything in dependency order, idempotent, safe to rerun.
# ════════════════════════════════════════════════════════════════════

REPO_ROOT="/mnt/c/Antigravity"
LOG_DIR="$REPO_ROOT/logs"
LOG_FILE="$LOG_DIR/bootstrap-$(date +%Y-%m-%d).log"

mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
port_listening() { ss -tlnp 2>/dev/null | grep -q ":${1} "; }
wait_for_port() {
    local port=$1 label=$2 timeout=${3:-30}
    local waited=0
    while ! port_listening "$port" && (( waited < timeout )); do
        sleep 2
        (( waited += 2 ))
    done
    if port_listening "$port"; then
        log "[OK] $label up on port $port"
        return 0
    else
        log "[WARN] $label did NOT come up on port $port within ${timeout}s"
        return 1
    fi
}

log "══════════════════════════════════════════"
log " ANTIGRAVITY BOOTSTRAP — $(date)"
log "══════════════════════════════════════════"

# ── 1. PAPERCLIP AI OS (port 3100) ───────────────────────────
log "[1/6] Paperclip AI OS — primary board/runtime"
if systemctl --user is-active --quiet paperclip.service 2>/dev/null; then
    log "  Already running (systemd)"
elif port_listening 3100; then
    log "  Already running (port 3100 up)"
else
    log "  Starting via systemd..."
    systemctl --user start paperclip.service 2>&1 | tee -a "$LOG_FILE" || true
    wait_for_port 3100 "Paperclip" 60
fi

# ── 2. OLLAMA (port 11434) ───────────────────────────────────
log "[2/6] Ollama — GPU model server"
if port_listening 11434; then
    log "  Already running"
else
    log "  Starting ollama..."
    nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
    wait_for_port 11434 "Ollama" 15
fi

# ── 3. HERMES ROUTER (port 11435) ────────────────────────────
log "[3/6] Hermes Router — model router"
if systemctl --user is-active --quiet hermes-router.service 2>/dev/null; then
    log "  Already running (systemd)"
else
    log "  Starting via systemd..."
    systemctl --user start hermes-router.service 2>&1 | tee -a "$LOG_FILE" || true
    wait_for_port 11435 "Hermes Router" 20
fi

# ── 4. HERMES GATEWAY ────────────────────────────────────────
log "[4/6] Hermes Gateway — messaging integration"
if systemctl --user is-active --quiet hermes-gateway.service 2>/dev/null; then
    log "  Already running (systemd)"
else
    log "  Starting via systemd..."
    systemctl --user start hermes-gateway.service 2>&1 | tee -a "$LOG_FILE" || true
    sleep 3
fi

# ── 5. HERMES DASHBOARD (port 9119) ──────────────────────────
log "[5/5] Hermes Dashboard — web UI"
if systemctl --user is-active --quiet hermes-dashboard.service 2>/dev/null; then
    log "  Already running (systemd)"
elif port_listening 9119; then
    log "  Already running (port 9119 up)"
else
    log "  Starting via systemd..."
    systemctl --user start hermes-dashboard.service 2>&1 | tee -a "$LOG_FILE" || true
    wait_for_port 9119 "Hermes Dashboard" 20
fi

# ── 6b. OPENCODE SERVER (port 4096) ──────────────────────────
log "[6b/6] OpenCode — headless server"
if systemctl --user is-active --quiet opencode-server.service 2>/dev/null; then
    log "  Already running (systemd)"
elif port_listening 4096; then
    log "  Already running (port 4096 up)"
else
    log "  Starting via systemd..."
    systemctl --user start opencode-server.service 2>&1 | tee -a "$LOG_FILE" || true
    wait_for_port 4096 "OpenCode Server" 20
fi

# ── SUMMARY ──────────────────────────────────────────────────
log "══════════════════════════════════════════"
log " BOOTSTRAP COMPLETE"
log "══════════════════════════════════════════"
log ""
log " Port   Service           URL"
log " ─────  ───────────────  ─────────────────────────────"
if port_listening 3100;  then log " 3100   Paperclip         http://localhost:3100"; fi
if port_listening 4096;  then log " 4096   OpenCode Server   http://localhost:4096"; fi
if port_listening 11434; then log " 11434  Ollama            http://localhost:11434"; fi
if port_listening 11435; then log " 11435  Hermes Router     http://localhost:11435/healthz"; fi
if port_listening 9119;  then log " 9119   Hermes Dashboard  http://localhost:9119"; fi
log ""
log " Run START-ALL.bat from Windows to open all GUIs."
log "══════════════════════════════════════════"
