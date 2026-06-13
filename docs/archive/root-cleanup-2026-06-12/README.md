# Root cleanup archive — 2026-06-12

Loose root-level artifacts were moved here to keep the ANTIGRAVITY monorepo root focused on source, workspace, and operational entry-point files.

Nothing in this archive is deleted. Items were moved only after checking that there were no repo text references to the original root paths.

## Contents

- `html/` — saved standalone HTML exports.
- `mission-control-static/` — legacy standalone mission-control static files formerly at the repo root.
- `reports/` — old reports, PDFs, and test/result notes formerly at the repo root.
- `data/` — loose calendar/CSV artifacts formerly at the repo root.
- `media/` — loose image artifacts formerly at the repo root.
- `release-metadata/` — package signature/provenance metadata formerly at the repo root.
- `notes/` — stray note files formerly at the repo root.
- `archives/` — archived zip artifacts formerly at the repo root.

## Non-archive moves

- `bootstrap_hermes_audit.sh` → `scripts/audit/bootstrap_hermes_audit.sh`
- `create_audit_commit_stdin.sh` → `scripts/audit/create_audit_commit_stdin.sh`
- `cron_git_pull_update.log` → `logs/cron_git_pull_update.log`
- accidental ignored root directories (`C:…antigravity`, `my-app`) → `.hermes/misplaced-root/`
