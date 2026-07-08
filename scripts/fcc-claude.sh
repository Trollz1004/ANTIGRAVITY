#!/usr/bin/env bash
# FCC-Claude launcher — routes Claude Code through fcc-proxy :8082
# Reads current Admin UI config each time it starts.
set +e

FCC_HOME="${HOME}/.fcc"

# Source env if available
if [[ -f "${FCC_HOME}/.env" ]]; then
  set -a
  source "${FCC_HOME}/.env"
  set +a
fi

export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-http://localhost:8082}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-fcc-no-auth}"
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=190000

clear
echo "============================================================"
echo "  FCC-CLAUDE  —  free-claude-code via proxy :8082"
echo "  Admin UI: http://127.0.0.1:8082/admin"
echo "  Provider: $(grep '^MODEL=' "${FCC_HOME}/.env" 2>/dev/null | cut -d= -f2- || echo 'default')"
echo "============================================================"
echo ""

cd /mnt/c/antigravity 2>/dev/null || cd ~

exec claude "$@"
