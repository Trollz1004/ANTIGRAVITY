#!/usr/bin/env bash
# TAB 1 - REAL OPUS COFOUNDER (Claude subscription account auth, NOT ollama)
# Banner should read "Claude Pro". If it says API usage billing or a model
# name, you are NOT in the real Opus tab - surface it.
set +e
unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY
clear
echo "============================================================"
echo "  OPUS-REAL  -  official Claude cofounder  -  Claude Pro"
echo "  Brains + Hands on keyboard. Resuming last session..."
echo "============================================================"
cd /mnt/c/antigravity || cd ~
exec claude --continue || exec bash
