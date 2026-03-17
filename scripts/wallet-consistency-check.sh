#!/usr/bin/env bash
set -euo pipefail

# Wallet Consistency Check — Verifies all wallet addresses match the canonical source.
# Canonical source: antigravity/components/Transparency.tsx
# Run: bash scripts/wallet-consistency-check.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL_FILE="$REPO_ROOT/antigravity/components/Transparency.tsx"

# Canonical wallet addresses — GospelDonation.sol on Base Mainnet (DEPLOYED)
GOSPEL_CONTRACT="0x9855B75061D4c841791382998f0CE8B2BCC965A4"
CHARITY_FUND="0x8d3dEADbE2b4B857A43331D459270B5eedC7084e"
INFRASTRUCTURE="0xe0a42f83900af719019eBeD3D9473BE8E8f2920b"
FOUNDER_OPS="0x7c3E283119718395Ef5EfBAC4F52738C2018daA7"

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
  "contracts/scripts/deploy.js"
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
    # Check if file mentions this wallet type (or common aliases)
    local aliases="$name"
    case "$name" in
      Infrastructure) aliases="Infrastructure|infra|DAO.Treasury|DAO_TREASURY" ;;
      Charity)        aliases="Charity|CHARITY_SAFE|charityWallet" ;;
      Founder)        aliases="Founder|FOUNDER_WALLET|founderWallet" ;;
      Gospel)         aliases="Gospel|GospelDonation|DatingRevenueRouter" ;;
    esac
    if grep -qiE "$aliases" "$full_path" 2>/dev/null; then
      echo "  FAIL: $name in $file — address mismatch or missing!"
      ERRORS=$((ERRORS + 1))
    fi
  fi
}

echo "Checking Gospel Contract ($GOSPEL_CONTRACT)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Gospel" "$GOSPEL_CONTRACT"
done

echo ""
echo "Checking Charity Fund 60% ($CHARITY_FUND)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Charity" "$CHARITY_FUND"
done

echo ""
echo "Checking Infrastructure 30% ($INFRASTRUCTURE)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Infrastructure" "$INFRASTRUCTURE"
done

echo ""
echo "Checking Founder/Ops 10% ($FOUNDER_OPS)..."
for f in "${WALLET_FILES[@]}"; do
  check_wallet "$f" "Founder" "$FOUNDER_OPS"
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
    grep -v "$GOSPEL_CONTRACT" | \
    grep -v "$CHARITY_FUND" | \
    grep -v "$INFRASTRUCTURE" | \
    grep -v "$FOUNDER_OPS" | \
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
