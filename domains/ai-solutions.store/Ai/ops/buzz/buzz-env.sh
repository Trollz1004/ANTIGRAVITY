#!/usr/bin/env bash
# Source this. Loads the Buzz identity for this node from .env at RUNTIME and
# exports what buzz.exe needs. Never prints a value.
#
#   . ops/buzz/buzz-env.sh
#
# .env keys used (names only): BUZZ_IDENTITY_KEY (nsec, the CLI identity),
# BUZZ_COMMUNITY (relay host), BUZZ_Account / BUZZ_This_device / BUZZ_PUBLIC_KEY
# (public npubs, informational).
ENV_FILE="${ANTIGRAVITY_ENV:-C:/ANTIGRAVITY/.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "buzz-env: $ENV_FILE not found — NOT CONFIGURED" >&2
  return 2 2>/dev/null || exit 2
fi
set -a
eval "$(grep -E '^BUZZ_[A-Za-z_]+=' "$ENV_FILE" | sed 's/\r$//')"
set +a
export BUZZ_PRIVATE_KEY="${BUZZ_PRIVATE_KEY:-$BUZZ_IDENTITY_KEY}"
export BUZZ_RELAY_URL="${BUZZ_RELAY_URL:-https://${BUZZ_COMMUNITY:-trollz1004-antigravity-repo.communities.buzz.xyz}}"
BUZZ_BIN="${BUZZ_BIN:-$LOCALAPPDATA/buzz/buzz.exe}"
[ -x "$BUZZ_BIN" ] || BUZZ_BIN="$(command -v buzz.exe || command -v buzz)"
export BUZZ_BIN
if [ -z "$BUZZ_PRIVATE_KEY" ]; then
  echo "buzz-env: BUZZ_IDENTITY_KEY missing from $ENV_FILE — AUTH MISSING" >&2
  return 3 2>/dev/null || exit 3
fi
