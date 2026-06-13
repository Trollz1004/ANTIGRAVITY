#!/usr/bin/env bash
set -euo pipefail
# create_audit_commit_stdin.sh
# Reads Hermes output from stdin, writes audits/hermes-audit-<UTC-T>.json,
# commits on branch feature/mcp-hermes-multi-orchestration, pushes, opens PR with gh (if available).
#
# Usage:
#   cat hermes-output.json | ./create_audit_commit_stdin.sh "optional short message"
MSG="${1:-hermes audit}"
BRANCH="feature/mcp-hermes-multi-orchestration"
BASE="main"
REPO_ROOT="$(pwd)"
# Read stdin
if [ -t 0 ]; then
echo "Error: no stdin detected. Usage: cat hermes-output.json | $0 \"optional message\""
exit 2
fi
HERME_CONTENT="$(cat)"
# Basic JSON check (non-fatal)
echo "$HERME_CONTENT" | jq . >/dev/null 2>&1 || {
echo "Warning: Hermes output is not valid JSON or jq not available; storing raw content."
}
# Timestamp & file path
TS="$(date -u +%Y%m%dT%H%M%SZ)"

AUDIT_DIR="audits"
AUDIT_FILE="${AUDIT_DIR}/hermes-audit-${TS}.json"
# Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
echo "Working tree is dirty. Commit or stash changes before running this script."
exit 3
fi
# Ensure branch exists locally or create from base
git fetch origin --quiet
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
git switch "${BRANCH}"
else
if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
git switch -t "origin/${BRANCH}"
else
echo "Branch ${BRANCH} not found on origin; creating from ${BASE}"
git switch "${BASE}"
git pull origin "${BASE}"
git switch -c "${BRANCH}"
fi
fi
# Persist audit file
mkdir -p "${AUDIT_DIR}"
printf '%s\n' "$HERME_CONTENT" > "${AUDIT_FILE}"
chmod 0640 "${AUDIT_FILE}"
# Commit & push
git add "${AUDIT_FILE}"
git commit -m "chore(audit): hermes scan ${TS} — ${MSG}"
git push origin "${BRANCH}"
# Create PR via gh if available
PR_TITLE="audit(hermes): ${TS}"

PR_BODY="Hermes read-only audit performed on ${TS} (branch ${BRANCH}).\n\nSummary: ${MSG}\n\nThis PR adds an auditable record: ${AUDIT_FILE}\n\nCI will enforce policy checks."
if command -v gh >/dev/null 2>&1; then
gh pr create --base "${BASE}" --head "${BRANCH}" --title "${PR_TITLE}" --body "${PR_BODY}" || {
echo "gh pr create failed; create PR manually from ${BRANCH} -> ${BASE}"
}
else
echo "gh CLI not found; create a PR manually from ${BRANCH} into ${BASE}."
fi
echo "Audit file saved at: ${AUDIT_FILE} and pushed on branch ${BRANCH}."
