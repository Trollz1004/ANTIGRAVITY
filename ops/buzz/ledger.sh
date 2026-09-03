#!/usr/bin/env bash
# Post one line to the shared node ledger on Buzz.
#
#   ops/buzz/ledger.sh "landed Sentry Obsidian target · apps/fables-sentry/targets.json · 1a2b3c4"
#   echo "multi-line body" | ops/buzz/ledger.sh -
#
# Every entry is prefixed with WHO and WHERE so any agent on any node can read
# the feed and know what was done and on which machine:
#   [2026-09-03 19:41Z · SABRETOOTH · claude-judge · ANTIGRAVITY@5fc2af10] <your line>
#
# Env overrides: BUZZ_AGENT_NAME (default: claude-judge), BUZZ_LEDGER_CHANNEL
# (default: node-ledger), ANTIGRAVITY_ENV (path to .env).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/buzz-env.sh"

CHANNEL_NAME="${BUZZ_LEDGER_CHANNEL:-node-ledger}"
AGENT="${BUZZ_AGENT_NAME:-claude-judge}"
NODE="$(hostname)"
REPO_DIR="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -n "$REPO_DIR" ]; then
  REPO="$(basename "$REPO_DIR")@$(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo nogit)"
else
  REPO="no-repo"
fi
STAMP="$(date -u +%Y-%m-%dT%H:%MZ)"

if [ "${1:-}" = "-" ]; then BODY="$(cat)"; else BODY="$*"; fi
[ -n "$BODY" ] || { echo "ledger: empty message" >&2; exit 1; }

# Refuse to post anything that looks like a credential. The ledger is shared.
if printf '%s' "$BODY" | grep -qE 'sk_live_|sk_test_|ghp_[A-Za-z0-9]{20}|nsec1[a-z0-9]{50}|AKIA[0-9A-Z]{16}|-----BEGIN .*PRIVATE KEY|eyJhbGciOi[A-Za-z0-9_-]{20}'; then
  echo "ledger: refusing — message contains a credential-shaped string" >&2; exit 4
fi

# Resolve channel UUID by name (cached per day so the relay is not hit every call).
CACHE="${TMP:-/tmp}/buzz-ledger-channel-$(date +%Y%m%d).id"
if [ -s "$CACHE" ]; then
  CH="$(cat "$CACHE")"
else
  CH="$("$BUZZ_BIN" channels list 2>/dev/null | python -c "
import json,sys
want=sys.argv[1]
for c in json.load(sys.stdin):
    if c.get('name')==want: print(c['channel_id']); break" "$CHANNEL_NAME")"
  if [ -z "$CH" ]; then
    echo "ledger: channel '$CHANNEL_NAME' not found on $BUZZ_RELAY_URL — create it: $BUZZ_BIN channels create --name $CHANNEL_NAME --type stream --visibility open" >&2
    exit 2
  fi
  printf '%s' "$CH" > "$CACHE"
fi

LINE="[$STAMP · $NODE · $AGENT · $REPO] $BODY"
printf '%s' "$LINE" | "$BUZZ_BIN" messages send --channel "$CH" --content - >/dev/null
echo "ledger: posted to #$CHANNEL_NAME as $AGENT@$NODE"
