#!/usr/bin/env bash
# =============================================================================
# cdn-sync.sh — Build frontend and sync static assets to Cloudflare R2
#
# Usage:
#   ./scripts/cdn-sync.sh [--invalidate] [--dry-run]
#
# Environment variables (or set in .env.production):
#   CDN_REGION        — R2 region (default: auto)
#   CDN_BUCKET        — R2 bucket name (default: antigravity-assets)
#   CDN_ACCOUNT_ID    — Cloudflare account ID
#   CDN_ACCESS_KEY_ID     — R2 access key ID
#   CDN_SECRET_ACCESS_KEY — R2 secret access key
#   VITE_CDN_BASE_URL — CDN base URL (default: https://cdn.youandinotai.com)
#   CF_API_TOKEN       — Cloudflare API token (for cache invalidation)
#   CF_ZONE_ID         — Cloudflare zone ID (for cache invalidation)
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
CDN_REGION="${CDN_REGION:-auto}"
CDN_BUCKET="${CDN_BUCKET:-antigravity-assets}"
VITE_CDN_BASE_URL="${VITE_CDN_BASE_URL:-https://cdn.youandinotai.com}"
FRONTEND_DIR="frontend/react-app"
DIST_DIR="${FRONTEND_DIR}/dist"
ASSETS_DIR="${DIST_DIR}/assets"

# Parse flags
INVALIDATE=false
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --invalidate) INVALIDATE=true ;;
    --dry-run)    DRY_RUN=true ;;
    *)            echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v aws >/dev/null 2>&1 || {
  echo "ERROR: AWS CLI is required (used for S3-compatible R2 API)."
  echo "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
}

if [[ -z "${CDN_ACCOUNT_ID:-}" ]]; then
  echo "ERROR: CDN_ACCOUNT_ID is not set."
  exit 1
fi

R2_ENDPOINT="https://${CDN_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "============================================"
echo "  CDN Sync — ANTIGRAVITY"
echo "============================================"
echo "  Bucket:    ${CDN_BUCKET}"
echo "  Region:    ${CDN_REGION}"
echo "  Endpoint:  ${R2_ENDPOINT}"
echo "  CDN URL:   ${VITE_CDN_BASE_URL}"
echo "  Dry run:   ${DRY_RUN}"
echo "============================================"

# ── Step 1: Build the frontend ────────────────────────────────────────────────
echo ""
echo "[1/4] Building frontend..."
cd "${FRONTEND_DIR}"
VITE_CDN_BASE_URL="${VITE_CDN_BASE_URL}" npm run build
cd -

if [[ ! -d "${ASSETS_DIR}" ]]; then
  echo "ERROR: Build output not found at ${ASSETS_DIR}"
  exit 1
fi
echo "  ✓ Build complete. Assets in ${ASSETS_DIR}"

# ── Step 2: Sync fingerprinted assets (1 year immutable cache) ────────────────
echo ""
echo "[2/4] Syncing fingerprinted assets to R2..."

# Fingerprinted assets: contain hash like -abc12345 before the extension
# These get Cache-Control: public, max-age=31536000, immutable
FINGERPRINTED_FILES=$(find "${ASSETS_DIR}" -type f -regextype posix-extended \
  -regex '.*-[a-f0-9]{8,}\.(js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|avif)$' 2>/dev/null || true)

if [[ -n "${FINGERPRINTED_FILES}" ]]; then
  FILE_COUNT=$(echo "${FINGERPRINTED_FILES}" | wc -l)
  echo "  Found ${FILE_COUNT} fingerprinted asset(s)."

  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "  [DRY RUN] Would sync with --cache-control 'public, max-age=31536000, immutable'"
    echo "${FINGERPRINTED_FILES}" | while read -r f; do
      REL_PATH="${f#${DIST_DIR}/}"
      echo "  [DRY RUN] s3://${CDN_BUCKET}/${REL_PATH}"
    done
  else
    # Use sync with include/exclude to only upload fingerprinted files
    aws s3 sync "${ASSETS_DIR}/" "s3://${CDN_BUCKET}/assets/" \
      --endpoint-url="${R2_ENDPOINT}" \
      --region "${CDN_REGION}" \
      --cache-control "public, max-age=31536000, immutable" \
      --exclude "*" \
      --include "*-[a-f0-9]*.js" \
      --include "*-[a-f0-9]*.css" \
      --include "*-[a-f0-9]*.png" \
      --include "*-[a-f0-9]*.jpg" \
      --include "*-[a-f0-9]*.jpeg" \
      --include "*-[a-f0-9]*.gif" \
      --include "*-[a-f0-9]*.svg" \
      --include "*-[a-f0-9]*.webp" \
      --include "*-[a-f0-9]*.ico" \
      --include "*-[a-f0-9]*.avif" \
      --include "*-[a-f0-9]*.woff" \
      --include "*-[a-f0-9]*.woff2" \
      --include "*-[a-f0-9]*.ttf" \
      --include "*-[a-f0-9]*.eot" \
      --size-only \
      --no-progress

    echo "  ✓ Fingerprinted assets synced."
  fi
else
  echo "  WARNING: No fingerprinted assets found. Build may have failed."
fi

# ── Step 3: Sync non-fingerprinted assets (moderate cache) ────────────────────
echo ""
echo "[3/4] Syncing non-fingerprinted static assets..."

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "  [DRY RUN] Would sync with --cache-control 'public, max-age=86400'"
else
  # Sync everything else (non-fingerprinted) with moderate cache
  aws s3 sync "${ASSETS_DIR}/" "s3://${CDN_BUCKET}/assets/" \
    --endpoint-url="${R2_ENDPOINT}" \
    --region "${CDN_REGION}" \
    --cache-control "public, max-age=86400" \
    --exclude "*-[a-f0-9]*.js" \
    --exclude "*-[a-f0-9]*.css" \
    --exclude "*-[a-f0-9]*.png" \
    --exclude "*-[a-f0-9]*.jpg" \
    --exclude "*-[a-f0-9]*.jpeg" \
    --exclude "*-[a-f0-9]*.gif" \
    --exclude "*-[a-f0-9]*.svg" \
    --exclude "*-[a-f0-9]*.webp" \
    --exclude "*-[a-f0-9]*.ico" \
    --exclude "*-[a-f0-9]*.avif" \
    --exclude "*-[a-f0-9]*.woff" \
    --exclude "*-[a-f0-9]*.woff2" \
    --exclude "*-[a-f0-9]*.ttf" \
    --exclude "*-[a-f0-9]*.eot" \
    --size-only \
    --no-progress

  echo "  ✓ Non-fingerprinted assets synced."
fi

# ── Step 4: Invalidate Cloudflare cache for changed files ─────────────────────
if [[ "${INVALIDATE}" == "true" ]]; then
  echo ""
  echo "[4/4] Invalidating Cloudflare cache for changed files..."

  if [[ -z "${CF_API_TOKEN:-}" || -z "${CF_ZONE_ID:-}" ]]; then
    echo "  WARNING: CF_API_TOKEN or CF_ZONE_ID not set. Skipping invalidation."
  elif [[ "${DRY_RUN}" == "true" ]]; then
    echo "  [DRY RUN] Would purge cache for changed files."
  else
    # Build list of changed file URLs
    CHANGED_URLS="[]"

    # Get list of files in the bucket that were recently modified
    # We use the local file list as the source of truth
    while IFS= read -r -d '' file; do
      REL_PATH="${file#${DIST_DIR}/}"
      FILE_URL="https://${VITE_CDN_BASE_URL}/${REL_PATH}"
      CHANGED_URLS=$(echo "${CHANGED_URLS}" | python3 -c "
import json, sys
urls = json.load(sys.stdin)
urls.append('${FILE_URL}')
print(json.dumps(urls))
")
    done < <(find "${DIST_DIR}" -type f -print0)

    # Cloudflare API limit: max 30 URLs per request for file-based purge
    URL_COUNT=$(echo "${CHANGED_URLS}" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
    echo "  Purging ${URL_COUNT} URL(s) from Cloudflare cache..."

    echo "${CHANGED_URLS}" | python3 -c "
import json, sys, subprocess, math

urls = json.load(sys.stdin)
batch_size = 30
batches = math.ceil(len(urls) / batch_size)

for i in range(batches):
    batch = urls[i*batch_size:(i+1)*batch_size]
    payload = json.dumps({'files': batch})
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache',
        '-H', 'Authorization: Bearer ${CF_API_TOKEN}',
        '-H', 'Content-Type: application/json',
        '-d', payload
    ], capture_output=True, text=True)
    resp = json.loads(result.stdout)
    if resp.get('success'):
        print(f'  ✓ Batch {i+1}/{batches} purged ({len(batch)} URLs)')
    else:
        print(f'  ✗ Batch {i+1}/{batches} failed: {resp.get(\"errors\", \"unknown error\")}')
"
    echo "  ✓ Cache invalidation complete."
  fi
else
  echo ""
  echo "[4/4] Skipping cache invalidation (use --invalidate to enable)."
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  CDN Sync Complete"
echo "============================================"
echo "  Assets uploaded to: s3://${CDN_BUCKET}/"
echo "  CDN URL:            ${VITE_CDN_BASE_URL}"
echo "============================================"
