#!/usr/bin/env bash
set -euo pipefail

# Wallet Consistency Check — Verifies all wallet addresses match the canonical source.
# Canonical source: antigravity/components/Transparency.tsx
# Run: bash scripts/wallet-consistency-check.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL_FILE="$REPO_ROOT/antigravity/components/Transparency.tsx"

# Canonical wallet addresses (from Transparency.tsx)
DAO_TREASURY="0xa87874d5320555c8639670645F1A2B4f82363a7c"
DATING_REVENUE="0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121"
CHARITY_REVENUE="0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B"
OPS_WALLET="0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4"

ERRORS=0

echo "=== Wallet Consistency Check ==="
echo "Canonical source: $CANONICAL_FILE"
echo ""

# Files that MUST contain correct wallet addresses
WALLET_FILES=(
  "antigravity/components/Transparency.tsx"
  "mcp-server/src/tools/protocol.ts"
  "memory/credentials-map.md"
  "memory/MISSION_CONTINUITY.md"
  "briefings/CLAUDE-SKILL.md"
  "CLAUDE.md"
)

check_wallet() {
  local file="$1"
  local name="$2"
  local expected="$3"
  local full_path="$REPO_ROOT/$file"

  if [[ ! -f "$full_path" ]]; then
    echo "  SKIP: $file (not found)"
    return
  fi

  if grep -q "$expected" "$full_path" 2>/dev/null; then
    echo "  OK: $name in $file"
  else
    # Check if file has any 0x address at all for this wallet type
    if grep -qi "$name" "$full_path" 2>/dev/null; then
      echo "  FAIL: $name in $file — address mismatch or missing!"
      ERRORS=$((ERRORS + 1))
    fi
  fi
}

echo "Checking DAO Treasury ($DAO_TREASURY)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "DAO Treasury" "$DAO_TREASURY"
done

echo ""
echo "Checking Dating Revenue ($DATING_REVENUE)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Dating Revenue" "$DATING_REVENUE"
done

echo ""
echo "Checking Charity Revenue ($CHARITY_REVENUE)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Charity Revenue" "$CHARITY_REVENUE"
done

echo ""
echo "Checking Ops Wallet ($OPS_WALLET)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Ops Wallet" "$OPS_WALLET"
done

echo ""

# Check for rogue 0x addresses that don't match canonical set
echo "Scanning for non-canonical 0x addresses in production paths..."
PRODUCTION_PATHS=(
  "antigravity/"
  "youandinotai/src/"
  "mcp-server/src/"
  "_deploy/"
)

for dir in "${PRODUCTION_PATHS[@]}"; do
  full_dir="$REPO_ROOT/$dir"
  if [[ ! -d "$full_dir" ]]; then continue; fi

  # Find all 0x addresses that are NOT in the canonical set and NOT USDC
  USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  rogue=$(grep -rhoP '0x[a-fA-F0-9]{40}' "$full_dir" 2>/dev/null | sort -u | \
    grep -v "$DAO_TREASURY" | \
    grep -v "$DATING_REVENUE" | \
    grep -v "$CHARITY_REVENUE" | \
    grep -v "$OPS_WALLET" | \
    grep -v "$USDC" || true)

  if [[ -n "$rogue" ]]; then
    echo "  WARN: Non-canonical address(es) in $dir:"
    echo "$rogue" | while read -r addr; do
      echo "    $addr"
    done
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "=== RESULT ==="
if [[ $ERRORS -eq 0 ]]; then
  echo "PASS: All wallet addresses consistent."
  exit 0
else
  echo "FAIL: $ERRORS issue(s) found. Fix before commit."
  exit 1
fi
