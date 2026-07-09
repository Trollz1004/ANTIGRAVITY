#!/usr/bin/env bash
set -euo pipefail
repo_root="${ANTIGRAVITY_ROOT:-/mnt/c/antigravity}"
index="$repo_root/.agents/skills/self-improving-system/skills.md"
query="${1:-}"

if [[ ! -f "$index" ]]; then
  echo "Skill index not found: $index" >&2
  exit 1
fi

if [[ -z "$query" ]]; then
  echo "Skill index: $index"
  echo "Usage: scripts/skills.sh <keyword>"
  echo "Rule: read only the selected SKILL.md after choosing from this index."
  exit 0
fi

grep -i -- "$query" "$index" | head -40
