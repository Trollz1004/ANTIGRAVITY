#!/usr/bin/env bash
set -euo pipefail

# Split Consistency Check — Ensures no contradictory revenue split claims
# in production paths. Canonical: 60/30/10 (60% Shriners, 30% V8 Infra, 10% Founder).
# Run: bash scripts/split-consistency-check.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ERRORS=0

echo "=== Split Consistency Check ==="
echo "Canonical: 60% Shriners / 30% V8 Infra / 10% Founder"
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

# Forbidden patterns in production (contradicts 60/30/10)
FORBIDDEN_PATTERNS=(
  "100% founder"
  "100% to founder"
  "SURVIVAL MODE"
  "survival mode"
  "80%.*charity"
  "80%.*shriners"
  "50%.*charity"
  "50%.*founder"
  "70%.*charity"
  "Phase 1.*100%"
)

echo "Scanning production paths for contradictory split claims..."
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  for path in "${PRODUCTION_PATHS[@]}"; do
    full_path="$REPO_ROOT/$path"
    if [[ ! -e "$full_path" ]]; then continue; fi

    matches=$(grep -rni --include="*.tsx" --include="*.ts" --include="*.html" --include="*.md" --include="*.json" \
      "$pattern" "$full_path" 2>/dev/null | grep -v "ARCHIVED" | grep -v "SUPERSEDED" | grep -v "NOT CURRENT" | grep -v "LEGACY" | grep -v "node_modules" || true)
    if [[ -n "$matches" ]]; then
      echo "  FAIL: Found '$pattern' in production path $path:"
      echo "$matches" | head -3
      ERRORS=$((ERRORS + 1))
    fi
  done
done

echo ""

# Verify canonical claims exist
echo "Verifying canonical 60/30/10 claims exist..."
CANON_FILES=("CLAUDE.md" "antigravity/components/Transparency.tsx" "mcp-server/src/tools/protocol.ts")
for f in "${CANON_FILES[@]}"; do
  full="$REPO_ROOT/$f"
  if [[ ! -f "$full" ]]; then
    echo "  WARN: $f not found"
    continue
  fi
  if grep -q "60.*30.*10\|60%.*Shriners\|shriners.*60" "$full" 2>/dev/null; then
    echo "  OK: $f contains canonical split reference"
  else
    echo "  WARN: $f missing canonical 60/30/10 reference"
  fi
done

echo ""
echo "=== RESULT ==="
if [[ $ERRORS -eq 0 ]]; then
  echo "PASS: No contradictory split claims in production paths."
  exit 0
else
  echo "FAIL: $ERRORS contradictory split claim(s) found. Fix before commit."
  exit 1
fi
