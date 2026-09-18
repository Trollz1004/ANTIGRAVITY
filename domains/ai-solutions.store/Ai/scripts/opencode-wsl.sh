#!/usr/bin/env bash
# OpenCode WSL launcher.
#
# Model access goes through the authenticated OmniRoute OpenAI-compatible
# gateway, which is the normal route for harness work. Configure it in the
# environment before launching (see agent-contracts/CAPABILITY-BASELINE.md);
# never hardcode a credential here.
#
# There is deliberately no ANTHROPIC_API_KEY. Claude is reached through the
# official CLI under account auth, and doctrine is explicit that an Anthropic
# API key is never needed and may never exist.
set -euo pipefail

REPO_ROOT="/mnt/c/ANTIGRAVITY"
OPCODE_BIN="${HOME}/.opencode/bin/opencode"

# Optional local env for the gateway endpoint and any provider keys OpenCode
# needs. Keep it outside the repository.
OPENCODE_ENV="${OPENCODE_ENV:-${HOME}/.opencode/.env}"
if [[ -f "${OPENCODE_ENV}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${OPENCODE_ENV}"
  set +a
fi

export OPENAI_COMPAT_BASE_URL="${OPENAI_COMPAT_BASE_URL:-}"

export TERM=xterm-256color
export NO_COLOR=0
export FORCE_COLOR=1
export PYTHONIOENCODING=utf-8
export PYTHONUNBUFFERED=1

cd "${REPO_ROOT}"

exec "${OPCODE_BIN}" "$@"
