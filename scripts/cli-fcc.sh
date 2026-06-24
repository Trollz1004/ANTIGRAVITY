#!/usr/bin/env bash
# TAB 2 - FCC (free-claude-code wrapper, OPUSnot)
# Routes claude through the fcc proxy on :8082. Banner shows API usage billing
# + an Opus *variant* (NOT "Claude Pro"). This is an OPUSnot, not the cofounder.
set +e
export ANTHROPIC_BASE_URL="http://localhost:8082"
# FCC owns provider secrets in its already-running server process. This tab only
# points Claude Code at the local proxy; it does not read local env files.
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-fcc-local-proxy}"
clear
echo "============================================================"
echo "  FCC  -  OPUSnot  -  free-claude-code via proxy :8082"
echo "  Work here is PREP for the Opus cofounder to review."
echo "============================================================"
cd /mnt/c/antigravity || cd ~
exec claude || exec bash
