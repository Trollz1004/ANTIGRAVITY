# Ship-Saving Cleanup - 2026-06-08

Canonical root: `c:\antigravity`

## Quiet Mode

Quiet mode was applied to stop local task drift and cursor-stealing launch loops.

- Startup launchers disabled by renaming to `.disabled`:
  - `Antigravity Mission Stack.vbs`
  - `OpenClaw Gateway.vbs`
  - `paperweight-dashboard.vbs`
- Scheduled tasks disabled:
  - `ANTIGRAVITY-Cloudflared-Paperclip`
  - `ANTIGRAVITY-Sabretooth-Watchdog`
  - `Hermes_Gateway`
  - `MissionControlAPI`
  - `MissionControlWatchdog`
- Runaway `paperweight.py` `pythonw.exe` processes were stopped.
- Rollback exports and startup backups are under `c:\antigravity\_ops-backups\quiet-mode-20260608-081903`.

## Vault Authority

Personal Vault secrets were preserved. No secret values were copied into this repo.

- Master env authority: `C:\Users\joshl\OneDrive\Personal Vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`
- Dated authority folder: `C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127`
- The authority folder contains:
  - `originals-preserved\`
  - `derived-platform-envs\`
  - `env-inventory-redacted.json`

## Launch Hold

DAO/token-sale/funding language is paused until attorney review.

Customer-facing copy should not claim:

- active DAO token sale
- live token sale supply/allocation/hard-cap terms
- public fundraising or investment products
- unverified payment/wallet/transparency proof
- unimplemented Plaid/V8/zero-bot guarantees
- restricted impact or public-offer language

## AI Spend Policy

Use Codex as coordinator. Use Ollama/local/free models for broad scans. Use paid Claude, Gemini, Perplexity, Grok, and API tiers only for high-judgment review or specialist checks.
