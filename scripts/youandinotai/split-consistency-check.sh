#!/usr/bin/env bash
set -euo pipefail

# Revenue Policy Consistency Check — Ensures no contradictory charitable-routing claims
# in production paths. Canonical: founder-directed 10% charitable cap for current LLC operations.
# Run: bash scripts/split-consistency-check.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ERRORS=0

echo "=== Revenue Policy Consistency Check ==="
echo "Canonical: founder-directed 10% charitable cap"
echo ""

# Production paths — these MUST NOT contain contradictory split claims
PRODUCTION_PATHS=(
  "antigravity/components/"
  "antigravity/app/"
  "youandinotai/src/"
  "mcp-server/src/"
  "CLAUDE.md"
  "README.md"
)

# Forbidden patterns in production
FORBIDDEN_PATTERNS=(
  "60/30/10"
  "60%.*Shriners"
  "60%.*charity"
  "100%.*charity"
  "100%.*DAO"
  "100% to kids"
)

echo "Scanning production paths for contradictory split claims..."
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  for path in "${PRODUCTION_PATHS[@]}"; do
    full_path="$REPO_ROOT/$path"
    if [[ ! -e "$full_path" ]]; then continue; fi

    matches=$(grep -rni --include="*.tsx" --include="*.ts" --include="*.html" --include="*.md" --include="*.json" \
      "$pattern" "$full_path" 2>/dev/null | grep -Evi "ARCHIVED|SUPERSEDED|NOT CURRENT|LEGACY|historical|do not present|do not claim|not current doctrine|project history" | grep -v "node_modules" || true)
    if [[ -n "$matches" ]]; then
      echo "  FAIL: Found '$pattern' in production path $path:"
      echo "$matches" | head -3
      ERRORS=$((ERRORS + 1))
    fi
  done
done

echo ""

# Verify canonical claims exist
echo "Verifying canonical 10% policy claims exist..."
CANON_FILES=("AGENTS.md" "CLAUDE.md" "briefings/PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md")
for f in "${CANON_FILES[@]}"; do
  full="$REPO_ROOT/$f"
  if [[ ! -f "$full" ]]; then
    echo "  WARN: $f not found"
    continue
  fi
  if grep -q "10%.*cap\|conservative 10%\|charitable support.*10%" "$full" 2>/dev/null; then
    echo "  OK: $f contains canonical policy reference"
  else
    echo "  WARN: $f missing canonical 10% policy reference"
  fi
done

echo ""
echo "=== RESULT ==="
if [[ $ERRORS -eq 0 ]]; then
  echo "PASS: No contradictory revenue-policy claims in production paths."
  exit 0
else
  echo "FAIL: $ERRORS contradictory revenue-policy claim(s) found. Fix before commit."
  exit 1
fi
