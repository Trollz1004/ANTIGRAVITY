#!/bin/bash
# OmniRoute gateway examples — curl.
# Reads the key from the OMNI_ROUTE_API_KEY env var at runtime. Never hardcode it.
#
# On this box, curl needs --noproxy '*' or it hangs (see workflow_api/README.md).
#
# Usage:
#   set -a; . <(grep '^OMNI_ROUTE_API_KEY=' /path/to/.env); set +a
#   ./curl.sh

set -euo pipefail

BASE_URL="${OPENAI_COMPAT_BASE_URL:-http://192.168.0.8:20128/v1}"

if [ -z "${OMNI_ROUTE_API_KEY:-}" ]; then
  echo "OMNI_ROUTE_API_KEY is not set in the environment. Aborting." >&2
  exit 1
fi

echo "== List models =="
curl -s --noproxy '*' "$BASE_URL/models" \
  -H "Authorization: Bearer $OMNI_ROUTE_API_KEY" | head -c 400
echo

echo "== Non-streaming chat completion =="
curl -s --noproxy '*' -X POST "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $OMNI_ROUTE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "model": "auto/best-coding",
        "messages": [{"role": "user", "content": "Say OK."}],
        "max_tokens": 5,
        "stream": false
      }'
echo

echo "== Streaming chat completion (SSE) =="
curl -s --noproxy '*' -N -X POST "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $OMNI_ROUTE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
        "model": "auto/best-coding",
        "messages": [{"role": "user", "content": "Count to 3."}],
        "stream": true
      }'
echo
