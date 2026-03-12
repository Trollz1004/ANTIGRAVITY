# CodeX Fleet Watcher

## Purpose

`scripts/codex-fleet-watcher.py` is the consolidated ENIGMA-side daily watcher for Sabretooth.

It complements the existing local stack:
- `scripts/codex_task_sentry.py`
- `scripts/opus-guardian.py`
- `scripts/install-safe-node-automation-tasks.ps1`
- `scripts/Invoke-CodeX-BrainCheckpoint.ps1`

It does **not** replace those tools. It audits them and raises escalation when they drift.

## What It Checks

1. Local git state for `C:\ANTIGRAVITY`
2. Critical scheduled tasks:
   - `CodeX-Mission-Guardian`
   - `CodeX-Brain-Checkpoint`
   - `CodeX-Task-Sentry`
   - `CodeX-SABRETOOTH-Safe-Control`
3. SSH reachability for `t5500` and `9020`
4. Public headers/CSP/SRI on:
   - `youandinotai.com`
   - `onlinerecycle.org`
5. Optional Cloudflare zone status if a valid token exists
6. Existing integrity audits:
   - `scripts/opus-guardian.py`
   - `scripts/scan-public-copy-policy.py`
7. Hashes for key source-of-truth files

## Outputs

Ignored runtime outputs are written under `CodeX/`:
- `CodeX/logs/codex-fleet-watch.ndjson`
- `CodeX/state/runtime/codex-fleet-watch-latest.json`
- `CodeX/state/runtime/codex-fleet-watch-latest.md`
- `CodeX/state/runtime/codex-fleet-watch-escalation.md`

## Escalation

If critical failures remain unresolved, the watcher:
1. writes an escalation brief
2. optionally posts JSON to `CODEX_WATCHER_ALERT_WEBHOOK` or `CODEX_WATCHER_ESCALATION_WEBHOOK`
3. optionally sends Twilio SMS if these env vars exist:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
   - `TWILIO_TO_NUMBER`

Cloudflare checks use:
- `CF_API_TOKEN` or `CLOUDFLARE_API_TOKEN`

## Install

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\upgrade-codex-fleet-watcher-admin.ps1 -StartNow
```

Manual run:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\Invoke-CodeX-FleetWatcher.ps1 -NoSms
```

## Notes

- This is ENIGMA-safe only. It does not audit OMEGA repos or OMEGA public properties.
- Default public-surface checks stay limited to the canonical live customer domains. Add extra domains explicitly through `CODEX_WATCHER_DOMAINS` or the `--domains` flag when they are intentionally live and maintained.
- Missing or expired Cloudflare/Twilio env is treated as a warning, not a hard failure.
- It is meant to give one daily truth snapshot, not to execute recovery work automatically.
