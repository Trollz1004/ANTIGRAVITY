#!/usr/bin/env bash
# OpenCode WSL launcher — sources FCC env for all provider keys
set -euo pipefail

REPO_ROOT="/mnt/c/ANTIGRAVITY"
FCC_ENV="${HOME}/.fcc/.env"
OPCODE_BIN="${HOME}/.opencode/bin/opencode"

# Source FCC env for API keys (Gemini, Grok, OpenRouter, etc.)
if [[ -f "${FCC_ENV}" ]]; then
  set -a
  source "${FCC_ENV}"
  set +a
fi

# Export key vars with defaults from FCC env
export GEMINI_API_KEY="${GEMINI_API_KEY:-}"
export XAI_API_KEY="${XAI_API_KEY:-}"
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-fcc-no-auth}"

export TERM=xterm-256color
export NO_COLOR=0
export FORCE_COLOR=1
export PYTHONIOENCODING=utf-8
export PYTHONUNBUFFERED=1

cd "${REPO_ROOT}"

exec "${OPCODE_BIN}" "$@"
