#!/usr/bin/env bash
# WSL Environment Setup — Add to ~/.bashrc or source directly
# Sources FCC env for API keys, adds PATH entries, creates aliases

FCC_ENV_FILE="${HOME}/.fcc/.env"

# Source FCC env for API keys
if [[ -f "${FCC_ENV_FILE}" ]]; then
  export GEMINI_API_KEY="$(grep '^GEMINI_API_KEY=' "${FCC_ENV_FILE}" 2>/dev/null | cut -d= -f2-)"
  export OPENROUTER_API_KEY="$(grep '^OPENROUTER_API_KEY=' "${FCC_ENV_FILE}" 2>/dev/null | cut -d= -f2-)"
  # xAI Grok — CLI auth key (xai auth login / XAI_API_KEY env)
  export XAI_API_KEY="$(grep '^XAI_API_KEY=' "${FCC_ENV_FILE}" 2>/dev/null | cut -d= -f2-)"

  # Codex — Anthropic API key (codex auth CLI via ANTHROPIC_API_KEY)
  export ANTHROPIC_API_KEY="$(grep '^ANTHROPIC_API_KEY=' "${FCC_ENV_FILE}" 2>/dev/null || echo 'fcc-no-auth')"
  export ANTHROPIC_AUTH_TOKEN="$(grep '^ANTHROPIC_AUTH_TOKEN=' "${FCC_ENV_FILE}" 2>/dev/null | cut -d= -f2-)"
  export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-http://localhost:8082}"
fi

# PATH additions
export PATH="${HOME}/.local/bin:${HOME}/.opencode/bin:${PATH}"

# Aliases
alias opencode-wsl='cd /mnt/c/ANTIGRAVITY && ~/.opencode/bin/opencode'
alias fcc-start='bash /mnt/c/ANTIGRAVITY/scripts/fcc-server-start.sh'
alias fcc-stop='bash /mnt/c/ANTIGRAVITY/scripts/fcc-server-stop.sh'
alias fcc-claude='bash /mnt/c/ANTIGRAVITY/scripts/fcc-claude.sh'
