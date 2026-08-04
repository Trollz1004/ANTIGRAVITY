#!/bin/bash
# Paperclip startup script for ANTIGRAVITY
# Runs on WSL Ubuntu, manages all harnesses + Mission Control
# COPY TO: ~/.paperclip/paperclip-startup.sh

set -e

REPO_ROOT="/mnt/f/ANTIGRAVITY"
PAPERCLIP_PORT=3120
OMNIROUTE_BASE="http://192.168.0.15:20128/api/v1/vscode/REDACTED_TOKEN/"
SKILLS_DIR="$REPO_ROOT/.agents/skills"

echo "[Paperclip] ANTIGRAVITY Orchestrator Starting..."
echo "[Paperclip] Repo root: $REPO_ROOT"
echo "[Paperclip] Port: $PAPERCLIP_PORT"

# Verify repo is accessible
if [ ! -d "$REPO_ROOT/.git" ]; then
    echo "[ERROR] F:\ANTIGRAVITY repo not found at $REPO_ROOT"
    exit 1
fi
echo "[Paperclip] ✓ Repo accessible: $REPO_ROOT"

# Check Pieces MCP health
if curl -s http://localhost:39300/model_context_protocol/2025-03-26/mcp > /dev/null 2>&1; then
    echo "[Paperclip] ✓ Pieces MCP healthy"
else
    echo "[Paperclip] ⚠ Pieces MCP unreachable (non-blocking)"
fi

# Check OmniRoute health (via LAN IP)
if curl -s http://192.168.0.15:20128/api/v1/vscode/health > /dev/null 2>&1; then
    echo "[Paperclip] ✓ OmniRoute healthy"
else
    echo "[Paperclip] ✗ OmniRoute unreachable - harnesses cannot start"
    exit 1
fi

# Load available skills
if [ -d "$SKILLS_DIR" ]; then
    SKILL_COUNT=$(ls -1 "$SKILLS_DIR" 2>/dev/null | wc -l)
    echo "[Paperclip] ✓ Found $SKILL_COUNT skills"
else
    echo "[Paperclip] ⚠ Skills directory not found"
fi

echo "[Paperclip] Harness launchers registered:"
echo "  - OpenCode (JSON): .opencode/opencode.json"
echo "  - Hermes (Python): python .hermes/hermes_agent.py"
echo "  - FCC-Claude (CLI): fcc-claude wrapper"

echo "[Paperclip] Ready on http://localhost:$PAPERCLIP_PORT"

# Start Paperclip server
cd "$REPO_ROOT"
python ~/.paperclip/paperclip_server.py --port $PAPERCLIP_PORT
