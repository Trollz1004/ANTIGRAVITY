# MASTER PROMPT — ANTIGRAVITY Production Fix
**Hand this to Claude CLI or Codex CLI. Working directory must be C:\ANTIGRAVITY.**

---

You are working in the ANTIGRAVITY production repo at `C:\ANTIGRAVITY` on branch `main`.
Your job is to execute a precise fix-validate-push sequence. No placeholders. No fake validation. No push until all checks green.

## Your Working Directory
```
C:\ANTIGRAVITY
```

## Package Location
The fix scripts are in the folder you received this prompt from. Run them in order using:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\00-run-all.ps1"
```

Or step by step:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\01-inspect-state.ps1"
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\02-fix-hermes-config.ps1"
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\03-fix-watchdog.ps1"
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\04-resolve-audit.ps1"
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\05-validate-all.ps1"
pwsh -NoProfile -ExecutionPolicy Bypass -File ".\scripts\06-commit-and-push.ps1"
```

## System Context
- Repo: `C:\ANTIGRAVITY`, branch: `main`
- Hermes CEO dashboard: `http://127.0.0.1:5555`
- Paperclip local: `http://127.0.0.1:3100` (health: `/api/health`)
- Public HQ: `https://paperclip-hq.youandinotai.com`
- Cloudflare tunnel: `c7bc9665-3923-4977-acd7-2033838cd56e`
- Tunnel config: `C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml`
- Tunnel credentials: `C:\Users\joshl\.cloudflared\c7bc9665-3923-4977-acd7-2033838cd56e.json`
- Hermes config candidates:
  - `C:\Users\joshl\.hermes\config.yaml`
  - `C:\Users\joshl\AppData\Local\hermes\config.yaml`
- CEO agent files: `C:\ANTIGRAVITY\paperclip\agents\ceo\`
- Bootstrap script: `C:\ANTIGRAVITY\scripts\bootstrap-paperclip-ceo.ps1`
- Autostart: `C:\ANTIGRAVITY\scripts\autostart.ps1`

## Issues Being Fixed

### I-01 + I-02: Hermes config path + model mismatch
Two different config paths exist in docs. Three sources disagree on the primary model.
Script 02 detects the live config, validates the model responds, updates TOOLS.md to match.

### I-03: Watchdog monitors wrong path
`.github/workflows/hermes-integrity-watchdog.yml` watches `paperclip-9020/agents/hermes-ceo/`
which does not exist. Real CEO files are at `paperclip/agents/ceo/`.
Script 03 (or the drop-in `workflows/hermes-integrity-watchdog-FIXED.yml`) fixes this.

### I-04: Audit FAIL + HEARTBEAT.md state
Last push triggered audit FAIL. Workflow may have auto-reverted HEARTBEAT.md additions.
Script 04 reconciles local vs remote and closes the auto-opened security issue.

## If Services Are Down

Start Paperclip:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\autostart.ps1
Start-Sleep -Seconds 45
```

Start Cloudflare tunnel manually:
```powershell
Start-Process -FilePath "C:\cloudflared\cloudflared.exe" `
  -ArgumentList "tunnel --config C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml run" `
  -WindowStyle Hidden
Start-Sleep -Seconds 8
```

## Security Rules (enforced — do not override)
- NO .env files in diff
- NO MASTER-UNIVERSAL-ENV-*.env in diff
- NO *.key, *.pem, *.pfx in diff
- NO push unless all validations PASS
- NO push unless on branch main

## Final Output Format
Print this at completion:
```
Production URL:        https://paperclip-hq.youandinotai.com
Commit on main:        [40-char SHA]
Validation timestamp:  [ISO 8601 UTC]
Tests run:
  [OK/FAIL] Hermes dashboard       http://127.0.0.1:5555
  [OK/FAIL] Paperclip local        http://127.0.0.1:3100/api/health
  [OK/FAIL] Public HQ              https://paperclip-hq.youandinotai.com/api/health
  [OK/FAIL] Hermes model response  "OK"
  [OK/FAIL] CEO fallback chain     no FAIL lines
  [OK/FAIL] Agent audit            PASS/FAIL
  [OK/FAIL] No secrets in diff
Files changed:         [list]
Repo state:            clean / dirty
Remaining blockers:    none OR [exact description]
```

## Authority
Joshua Coleman is the sole authority. Do not push to main without all validations passing.
Do not modify other agents' files outside this fix scope.
Do not commit secrets.
This is production. #ForTheKids
