#!/usr/bin/env bash
set -euo pipefail

if [ $# -gt 0 ]; then
  cd "$1"
fi

AUDIT_DIR="paperclip/agents/audit"
mkdir -p "$AUDIT_DIR"

NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
TODAY_UTC="$(date -u +"%Y-%m-%d")"
AUDIT_FILE="$AUDIT_DIR/AUDIT-${TODAY_UTC}.md"

OPERATOR="${GITHUB_ACTOR:-local-runner}"
EVENT_NAME="${GITHUB_EVENT_NAME:-manual}"
REPO_NAME="${GITHUB_REPOSITORY:-local}"
REF_NAME="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)}"
HEAD_SHA="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo unknown)}"
BEFORE_SHA="${GITHUB_EVENT_BEFORE:-}"
IDENTITY_MARKER_PATTERN='Josh|Joshua Coleman|CEO Agent ID'
# Detects direct claims that an agent can self-modify protected instruction files.
PRIVILEGE_ESCALATION_PATTERN='self[- ]?(edit|modify|update|upgrade)|can (edit|modify|update).*(AGENTS|HEARTBEAT|TOOLS)\.md|writable by (agent|ai)|auto[- ]?upgrade (its|their).*(AGENTS|HEARTBEAT|TOOLS)\.md'

if [ ! -d "paperclip/agents" ]; then
  echo "paperclip/agents directory not found; cannot run audit."
  exit 1
fi

mapfile -t AGENT_DIRS < <(find paperclip/agents -mindepth 1 -maxdepth 1 -type d ! -name audit | sort)
mapfile -t MONITORED_FILES < <(find paperclip/agents -mindepth 2 -maxdepth 2 -type f \( -name 'AGENTS.md' -o -name 'HEARTBEAT.md' -o -name 'TOOLS.md' -o -name 'STATE.md' \) | sort)

FAIL=0
UNAUTHORIZED_CHANGE=0
CHANGED_FILES=""
PRIVILEGE_HITS=""
MISSING_COUNT=0
IDENTITY_MISSING=0

add_row() {
  local check="$1"
  local status="$2"
  local details="$3"
  printf '| %s | %s | %s |\n' "$check" "$status" "$details" >> "$REPORT_TABLE"
}

REPORT_TABLE="$(mktemp)"
echo '| Check | Status | Details |' > "$REPORT_TABLE"
echo '|---|---|---|' >> "$REPORT_TABLE"

if [ "${#MONITORED_FILES[@]}" -eq 0 ]; then
  FAIL=1
  add_row 'Agent file discovery' 'FAIL' 'No AGENTS.md/HEARTBEAT.md/TOOLS.md files were found under paperclip/agents/*/.'
else
  add_row 'Agent file discovery' 'PASS' "Found ${#MONITORED_FILES[@]} monitored file(s)."
fi

for dir in "${AGENT_DIRS[@]}"; do
  for req in AGENTS.md TOOLS.md STATE.md; do
    if [ ! -f "$dir/$req" ]; then
      MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
  done
done

if [ "$MISSING_COUNT" -gt 0 ]; then
  FAIL=1
  add_row 'Required AGENTS.md + TOOLS.md per agent folder' 'FAIL' "Missing $MISSING_COUNT required file(s)."
else
  add_row 'Required AGENTS.md + TOOLS.md per agent folder' 'PASS' 'All agent folders include AGENTS.md and TOOLS.md.'
fi

for file in "${MONITORED_FILES[@]}"; do
  if [[ "$file" == */AGENTS.md ]]; then
    if ! grep -qiE "$IDENTITY_MARKER_PATTERN" "$file"; then
      IDENTITY_MISSING=$((IDENTITY_MISSING + 1))
    fi
  fi
done

if [ "$IDENTITY_MISSING" -gt 0 ]; then
  FAIL=1
  add_row 'Agent doctrine identity markers in AGENTS.md' 'FAIL' "$IDENTITY_MISSING AGENTS.md file(s) missing Josh/Joshua Coleman/CEO Agent ID markers."
else
  add_row 'Agent doctrine identity markers in AGENTS.md' 'PASS' 'All AGENTS.md files include expected doctrine identity markers.'
fi

if [ "${#MONITORED_FILES[@]}" -gt 0 ]; then
  PRIVILEGE_HITS=$(printf '%s\0' "${MONITORED_FILES[@]}" | xargs -0 grep -nEi "$PRIVILEGE_ESCALATION_PATTERN" || true)
fi

if [ -n "$PRIVILEGE_HITS" ]; then
  FAIL=1
  add_row 'Privilege escalation / self-modification assertions' 'FAIL' 'Found self-edit or file-upgrade claims in monitored files.'
else
  add_row 'Privilege escalation / self-modification assertions' 'PASS' 'No self-edit or self-upgrade assertions detected.'
fi

if [ "$EVENT_NAME" = "push" ]; then
  if [ -n "$BEFORE_SHA" ] && [ "$BEFORE_SHA" != "0000000000000000000000000000000000000000" ]; then
    CHANGED_FILES=$(git diff --name-status "$BEFORE_SHA" "$HEAD_SHA" -- \
      'paperclip/agents/*/AGENTS.md' \
      'paperclip/agents/*/HEARTBEAT.md' \
      'paperclip/agents/*/TOOLS.md' \
      'paperclip/agents/*/STATE.md' \
      'paperclip/agents/audit/AUDIT-*.md' || true)
  else
    PREV_SHA="$(git rev-parse "$HEAD_SHA^" 2>/dev/null || true)"
    if [ -n "$PREV_SHA" ]; then
      CHANGED_FILES=$(git diff --name-status "$PREV_SHA" "$HEAD_SHA" -- \
        'paperclip/agents/*/AGENTS.md' \
        'paperclip/agents/*/HEARTBEAT.md' \
        'paperclip/agents/*/TOOLS.md' \
        'paperclip/agents/*/STATE.md' \
        'paperclip/agents/audit/AUDIT-*.md' || true)
    fi
  fi

  # Authorized operators: the audit bot AND Josh (sole founder authority per CLAUDE.md).
  # PR merges to main are attributed to whoever clicked merge — Josh's merges are by definition
  # authorized and must not be auto-reverted.
  AUTHORIZED_OPERATORS_REGEX='^(github-actions\[bot\]|Trollz1004)$'
  if [ -n "$CHANGED_FILES" ] && ! [[ "$OPERATOR" =~ $AUTHORIZED_OPERATORS_REGEX ]]; then
    UNAUTHORIZED_CHANGE=1
    FAIL=1
    add_row 'Protected file mutation source' 'FAIL' "Protected files were changed by unauthorized actor: $OPERATOR"
  elif [ -n "$CHANGED_FILES" ]; then
    add_row 'Protected file mutation source' 'PASS' "Protected file updates were authored by authorized operator: $OPERATOR"
  else
    add_row 'Protected file mutation source' 'PASS' 'No protected file changes detected in this push event.'
  fi
else
  add_row 'Protected file mutation source' 'PASS' 'Not a push-triggered mutation check.'
fi

if [ ! -f "$AUDIT_FILE" ]; then
  {
    echo "# Paperclip Agent Audit Log — ${TODAY_UTC}"
    echo
    echo "This file is generated by GitHub Actions only."
    echo "Any non-GitHub alteration is treated as unauthorized and is auto-reverted by workflow policy."
    echo
  } > "$AUDIT_FILE"
fi

{
  echo "## Audit Run — ${NOW_UTC}"
  echo
  echo "- Repository: \`${REPO_NAME}\`"
  echo "- Branch: \`${REF_NAME}\`"
  echo "- Trigger: \`${EVENT_NAME}\`"
  echo "- Commit: \`${HEAD_SHA}\`"
  echo "- Operator signature: \`${OPERATOR}\`"
  echo
  cat "$REPORT_TABLE"
  echo
  if [ -n "$CHANGED_FILES" ]; then
    echo "### Protected File Diff (name-status)"
    echo
    echo '```text'
    printf '%s\n' "$CHANGED_FILES"
    echo '```'
    echo
  fi

  if [ -n "$PRIVILEGE_HITS" ]; then
    echo "### Privilege Escalation Findings"
    echo
    echo '```text'
    printf '%s\n' "$PRIVILEGE_HITS"
    echo '```'
    echo
  fi

  if [ "$UNAUTHORIZED_CHANGE" -eq 1 ]; then
    echo "### Escalation"
    echo
    echo "Unauthorized protected-file change detected. Escalate to CEO, CTO, and mission guardians immediately."
    echo
  fi

  if [ "$FAIL" -eq 0 ]; then
    echo "**Result:** PASS ✅"
  else
    echo "**Result:** FAIL ❌"
  fi
  echo
} >> "$AUDIT_FILE"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  SAFE_AUDIT_FILE="$(printf '%s' "$AUDIT_FILE" | tr -d '\r\n')"
  echo "audit_file=$SAFE_AUDIT_FILE" >> "$GITHUB_OUTPUT"
  echo "audit_fail=$FAIL" >> "$GITHUB_OUTPUT"
  echo "unauthorized_change=$UNAUTHORIZED_CHANGE" >> "$GITHUB_OUTPUT"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "Audit completed: PASS"
else
  echo "Audit completed: FAIL"
fi
