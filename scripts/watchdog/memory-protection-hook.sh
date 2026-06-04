#!/usr/bin/env bash
# memory-protection-hook.sh
# Wired into .claude/settings.json PreToolUse on Edit|Write. Hard-blocks
# (exit 2) any write to protected Claude memory files unless the writer sets
# CLAUDE_AUTHORITY=first-party in its environment first.
#
# Protected paths:
#   briefings/CLAUDE-DOCTRINE.md
#   briefings/CLAUDE-NODE-MEMORY-*
#   briefings/CLAUDE-MEMORY-*
#   briefings/ANTIGRAVITY-DEPLOY-CANONICAL.md
#   briefings/NODE-LOG.md
#   briefings/FOUNDER-DOCTRINE-*
#   briefings/CLAUDE-SKILL.md
#   ~/.claude/projects/*/memory/*
#
# Why: third-party Claude wrappers (Manus, Emergent, etc.) clobber memory
# files when they don't honor first-party doctrine. This hook + the
# companion lock-memory.ps1 (filesystem ACL) form the two-layer defense.
#
# To bypass (first-party Claude making intentional edits):
#   CLAUDE_AUTHORITY=first-party  ← env var the orchestrator sets in-session

FILE="${CLAUDE_FILE_PATH:-}"
if [ -z "$FILE" ]; then exit 0; fi

PATTERN='(briefings/(CLAUDE-DOCTRINE|CLAUDE-NODE-MEMORY|CLAUDE-MEMORY|ANTIGRAVITY-DEPLOY-CANONICAL|NODE-LOG|FOUNDER-DOCTRINE|CLAUDE-SKILL)|\.claude/projects/.*/memory/)'

if echo "$FILE" | grep -qE "$PATTERN"; then
  if [ "${CLAUDE_AUTHORITY:-}" != "first-party" ]; then
    echo "BLOCKED: Protected Claude memory file: $FILE" >&2
    echo "Only first-party Claude.ai may edit. To override: set CLAUDE_AUTHORITY=first-party," >&2
    echo "or run: pwsh scripts/watchdog/lock-memory.ps1 -Unlock" >&2
    exit 2
  fi
fi
exit 0
