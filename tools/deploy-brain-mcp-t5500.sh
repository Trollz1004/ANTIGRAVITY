#!/usr/bin/env bash
# Deploy brain-mcp as a 24/7 HTTP MCP server on T5500 (192.168.0.15)
# Run FROM T5500: bash tools/deploy-brain-mcp-t5500.sh
#
# Pre-reqs on T5500:
#   - Docker + Docker Compose v2
#   - git
#   - ANTIGRAVITY repo cloned at $ANTIGRAVITY_DIR (default: /home/josh/ANTIGRAVITY)

set -euo pipefail

ANTIGRAVITY_DIR="${ANTIGRAVITY_DIR:-/home/josh/ANTIGRAVITY}"
BRAIN_MCP_DIR="$ANTIGRAVITY_DIR/brain-mcp"
BRANCH="claude/consolidate-repos-single-structure-e6D8D"

echo ""
echo "======================================================"
echo "  BRAIN MCP DEPLOY — T5500 ($(hostname -I | awk '{print $1}'))"
echo "======================================================"

# 1. Pull latest code
echo ""
echo "[1/5] Pulling latest code..."
cd "$ANTIGRAVITY_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 2. Ensure 'antigravity' docker network exists
echo "[2/5] Ensuring Docker network exists..."
docker network create antigravity 2>/dev/null && \
  echo "  Created: antigravity network" || \
  echo "  OK: antigravity network already exists"

# 3. Copy platform-registry if not present
echo "[3/5] Checking platform-registry config..."
if [ ! -f "$BRAIN_MCP_DIR/config/platform-registry.json" ]; then
  cp "$BRAIN_MCP_DIR/config/platform-registry.example.json" \
     "$BRAIN_MCP_DIR/config/platform-registry.json"
  echo "  ⚠  Created config/platform-registry.json from example"
  echo "     Edit it to add real tokenHash values:"
  echo "       cd $BRAIN_MCP_DIR && node dist/hash-token.js <your-secret>"
else
  echo "  OK: platform-registry.json exists"
fi

# 4. Ensure .env exists with required vars
echo "[4/5] Checking .env file..."
ENV_FILE="$BRAIN_MCP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# brain-mcp T5500 environment
# Generate token hash: node dist/hash-token.js <your-secret>
BRAIN_TOKEN_HASH=sha256:REPLACE_WITH_REAL_HASH

# Get from: Cloudflare Zero Trust → Access → Tunnels → brain-mcp → Configure
CLOUDFLARE_TUNNEL_TOKEN=REPLACE_WITH_REAL_TOKEN
EOF
  echo "  ⚠  Created $ENV_FILE — fill in BRAIN_TOKEN_HASH and CLOUDFLARE_TUNNEL_TOKEN"
  echo "     Then re-run this script."
  exit 1
fi

# Check required vars are set
# shellcheck disable=SC1090
source "$ENV_FILE"
if [[ "${BRAIN_TOKEN_HASH:-}" == *"REPLACE"* ]] || [[ -z "${BRAIN_TOKEN_HASH:-}" ]]; then
  echo "  ✗ BRAIN_TOKEN_HASH not set in $ENV_FILE"
  exit 1
fi
if [[ "${CLOUDFLARE_TUNNEL_TOKEN:-}" == *"REPLACE"* ]] || [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  echo "  ⚠  CLOUDFLARE_TUNNEL_TOKEN not set — starting brain-mcp only (no public tunnel)"
  SKIP_TUNNEL=true
fi
echo "  OK: .env loaded"

# 5. Build and start
echo "[5/5] Building and starting containers..."
cd "$BRAIN_MCP_DIR"
if [ "${SKIP_TUNNEL:-false}" = "true" ]; then
  docker compose -f docker-compose.t5500.yml up -d --build brain-mcp
else
  docker compose -f docker-compose.t5500.yml pull cloudflared
  docker compose -f docker-compose.t5500.yml up -d --build
fi

echo ""
echo "======================================================"
echo "  BRAIN MCP IS LIVE"
echo "  Health : http://192.168.0.15:3099/health"
if [ "${SKIP_TUNNEL:-false}" != "true" ]; then
echo "  Remote : https://mcp.youandinotai.com/mcp"
fi
echo "======================================================"
echo ""
echo "CLOUDFLARE TUNNEL SETUP (one-time steps if not done):"
echo "  1. Go to https://one.dash.cloudflare.com"
echo "     → Zero Trust → Access → Tunnels → Create tunnel"
echo "  2. Name it: brain-mcp"
echo "  3. Public hostname: mcp.youandinotai.com"
echo "     → http://brain-mcp:3099"
echo "  4. Copy the tunnel token"
echo "  5. Paste token into $ENV_FILE as CLOUDFLARE_TUNNEL_TOKEN"
echo "  6. Re-run this script (or: docker compose ... up -d)"
echo ""
echo "CONNECT FROM ANY CLAUDE CODE SESSION:"
echo "  Add to your project .mcp.json (brain-mcp-remote entry already in repo root)"
echo "  Set env var: BRAIN_MCP_TOKEN=<your-plain-text-secret>"
echo ""
