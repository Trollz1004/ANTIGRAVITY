#!/usr/bin/env bash
# Sync values from MASTER-UNIVERSAL-ENV-TROLLZ1004.env into ~/.hermes/.env
# Pulls the FIRST non-empty value for each key (master has dup empty entries that
# would otherwise win in some parsers). Upserts into hermes env in place.

set -u

MASTER="/mnt/c/Users/joshl/OneDrive/Personal Vault-Sabretooth/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
HERMES_ENV="$HOME/.hermes/.env"

if [ ! -f "$MASTER" ]; then
  echo "ERROR: master env not found at $MASTER" >&2
  exit 1
fi
if [ ! -f "$HERMES_ENV" ]; then
  echo "ERROR: hermes env not found at $HERMES_ENV" >&2
  exit 1
fi

stamp=$(date +%Y%m%d-%H%M%S)
cp "$HERMES_ENV" "$HERMES_ENV.bak-$stamp"
echo "Backup: $HERMES_ENV.bak-$stamp"
echo ""

extract() {
  local key="$1"
  awk -F= -v k="$key" '$1==k && $2!="" {print $2; exit}' "$MASTER"
}

upsert() {
  local key="$1"
  local val="$2"
  if [ -z "$val" ]; then
    echo "  $key: SKIP (no populated value in master)"
    return
  fi
  if grep -qE "^${key}=" "$HERMES_ENV"; then
    # in-place replace; use # as sed delimiter to avoid / in tokens
    sed -i "s#^${key}=.*#${key}=${val}#" "$HERMES_ENV"
    echo "  $key: UPDATED"
  else
    echo "${key}=${val}" >> "$HERMES_ENV"
    echo "  $key: APPENDED"
  fi
}

GITHUB_PAT=$(extract GITHUB_PAT)
GEMINI_API_KEY=$(extract GEMINI_API_KEY)
ANTHROPIC_API_KEY=$(extract ANTHROPIC_API_KEY)
XAI_API_KEY=$(extract XAI_API_KEY)
OPENROUTER_API_KEY=$(extract OPENROUTER_API_KEY)

upsert GITHUB_TOKEN     "$GITHUB_PAT"
upsert GITHUB_PAT       "$GITHUB_PAT"
upsert GEMINI_API_KEY   "$GEMINI_API_KEY"
upsert ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY"
upsert XAI_API_KEY      "$XAI_API_KEY"
upsert OPENROUTER_API_KEY "$OPENROUTER_API_KEY"

echo ""
echo "=== keys present in hermes .env now (values masked) ==="
grep -E "^(OPENROUTER_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|GITHUB_PAT|GEMINI_API_KEY|XAI_API_KEY)=" "$HERMES_ENV" \
  | sed -E 's/=(.{4}).*$/=***SET (tail \1)***/'
