#!/usr/bin/env bash
# Read the last N node-ledger entries — what every agent on every node did, and where.
#   ops/buzz/ledger-tail.sh          # last 30
#   ops/buzz/ledger-tail.sh 100
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/buzz-env.sh"
N="${1:-30}"
CHANNEL_NAME="${BUZZ_LEDGER_CHANNEL:-node-ledger}"
CH="$("$BUZZ_BIN" channels list | python -c "
import json,sys
for c in json.load(sys.stdin):
    if c.get('name')==sys.argv[1]: print(c['channel_id']); break" "$CHANNEL_NAME")"
[ -n "$CH" ] || { echo "no channel '$CHANNEL_NAME'" >&2; exit 2; }
"$BUZZ_BIN" messages get --channel "$CH" --limit "$N" | python -c "
import json,sys,datetime
rows=json.load(sys.stdin)
rows=rows if isinstance(rows,list) else rows.get('messages',rows)
for m in sorted(rows, key=lambda m: m.get('created_at',0)):
    print(m.get('content',''))"
