#!/usr/bin/env bash
# bootstrap_hermes_audit.sh
# Usage: ./bootstrap_hermes_audit.sh [REPO_ABS_PATH]
# Creates create_audit_commit_stdin.sh and hermes_short_scan.txt and attempts to copy prompt to clipboard.

set -euo pipefail
REPO_PATH="${1:-$(pwd)}"
BRANCH="feature/mcp-hermes-multi-orchestration"
# create the stdin-based commit script
cat > create_audit_commit_stdin.sh <<'EOF'
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
EOF
chmod +x create_audit_commit_stdin.sh
echo "Created: create_audit_commit_stdin.sh"
# create the hermes prompt file (clipboard-friendly)
cat > hermes_short_scan.txt <<EOF
Context: read-only audit. No network egress. Follow Hard Isolation Rules: no remote Claude APIs, redact secrets, do not delete or push.
Repo path: ${REPO_PATH}
Branch: ${BRANCH}
Base: main
Tasks (read-only):
1) Git snapshot:
cd ${REPO_PATH}
git fetch --quiet
git checkout ${BRANCH} || git checkout -t origin/${BRANCH}
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git log --oneline -n 10
git diff --name-only origin/main...HEAD
2) Forbidden & secrets scan (case-insensitive). Search for:
claude|anthropic|claude.ai|CLOUDFLARE_API_TOKEN|WRANGLER_|AWS_SECRET|AWS_ACCESS|BEGIN_CERT|client_secret|oauth_token|PAT[-_]?
For each match report:
- path, line number
- snippet_redacted (replace >8 contiguous alnum with <REDACTED>)
- severity (HIGH if looks like key/private key or remote API usage; MEDIUM otherwise)
- recommended_action
3) Preview (first 200 lines, redacted) of:
- .env.example
- .github/workflows/*.yml
- .gitignore
- placeholders/*
- adapters/*/manifest.yaml (if exists)
- tests/basic-health-check.sh
4) Script check:
- Syntax-check tests/basic-health-check.sh with: bash -n tests/basic-health-check.sh
- Do NOT run networked commands. If script would attempt network egress, return: NETWORK_EGRESS_BLOCKED — did not run.
Output format:

- Primary: JSON with keys: meta {node,timestamp}, git {branch,head,diff_files}, findings[], files_preview{}, confidence, asks[]
- Secondary: 4-bullet human summary
End.
EOF
echo "Created: hermes_short_scan.txt"
# Try to copy to clipboard using available method
copy_prompt_to_clipboard() {
PROMPT_FILE="hermes_short_scan.txt"
if grep -qi microsoft /proc/version 2>/dev/null; then
# WSL: copy to Windows clipboard with clip.exe
if command -v clip.exe >/dev/null 2>&1; then
cat "$PROMPT_FILE" | clip.exe
return 0
fi
fi
case "$(uname -s)" in
Darwin)
if command -v pbcopy >/dev/null 2>&1; then
cat "$PROMPT_FILE" | pbcopy
return 0
fi
;;
Linux)
if command -v xclip >/dev/null 2>&1; then
cat "$PROMPT_FILE" | xclip -selection clipboard
return 0
elif command -v wl-copy >/dev/null 2>&1; then
cat "$PROMPT_FILE" | wl-copy
return 0
fi
;;
esac
return 1
}
if copy_prompt_to_clipboard; then

echo "Prompt copied to clipboard (hermes_short_scan.txt)."
else
echo "Could not copy to clipboard automatically. Open hermes_short_scan.txt and paste manually into Hermes."
fi
echo
echo "Next steps:"
echo "1) Paste hermes_short_scan.txt into Hermes on the chosen node and run it."
echo "2) Save Hermes output to a file (e.g. /tmp/hermes-out.json)."
echo "3) From the repo root: cat /tmp/hermes-out.json | ./create_audit_commit_stdin.sh \"optional message\""
echo
echo "Notes:"
echo "- Ensure working tree is clean before running the commit script."
echo "- gh CLI is optional but will auto-create a PR if present and authenticated."