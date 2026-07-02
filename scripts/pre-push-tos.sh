#!/usr/bin/env bash
# pre-push hook wrapper for TOS/public-copy compliance
# Install: cp scripts/pre-push-tos.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push
# Or call directly: pwsh scripts/check-public-copy-compliance.ps1

set -e
pwsh -NoProfile -File "$(dirname "$0")/../../scripts/check-public-copy-compliance.ps1" || exit 1
exit 0
