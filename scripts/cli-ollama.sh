#!/usr/bin/env bash
# TAB 3 - OLLAMA WRAPPER (OPUSnot)
# claude routed through fcc proxy :8082 but pinned to an Ollama-backed model.
# Banner shows the actual model name (e.g. minimax3), NOT opus, NOT Claude Pro.
#
# Change OLLAMA_MODEL below to switch brains:
#   ollama/minimax-m2.5:cloud   (cloud, the "minimax3" lane)
#   ollama/gemma4:latest        (local, free, instant, always available)
set +e
OLLAMA_MODEL="${OLLAMA_MODEL:-ollama/minimax-m2.5:cloud}"
export ANTHROPIC_BASE_URL="http://localhost:8082"
# FCC owns provider secrets in its already-running server process. This tab only
# points Claude Code at the local proxy; it does not read local env files.
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-fcc-local-proxy}"
clear
echo "============================================================"
echo "  OLLAMA  -  OPUSnot  -  model: ${OLLAMA_MODEL}"
echo "  Work here is PREP for the Opus cofounder to review."
echo "============================================================"
cd /mnt/c/antigravity || cd ~
exec claude --model "${OLLAMA_MODEL}" || exec bash
