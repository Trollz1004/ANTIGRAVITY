# PAPERCLIP HQ ANTIGRAVITY CUTOVER

Date: April 15, 2026
Authority: Joshua Coleman
Owner: Codex

## Active Runtime

- Repo root: `C:\ANTIGRAVITY`
- Source checkout: `C:\ANTIGRAVITY\paperclip-upstream`
- Runtime home: `C:\ANTIGRAVITY\paperclip-runtime`
- Local URL: `http://127.0.0.1:3100`
- Local health: `http://127.0.0.1:3100/api/health`
- Public URL: `https://paperclip-hq.youandinotai.com`
- Public health: `https://paperclip-hq.youandinotai.com/api/health`

## Cloudflare

- Tunnel name: `paperclip-antigravity`
- Tunnel ID: `c7bc9665-3923-4977-acd7-2033838cd56e`
- Repo config: `C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml`
- Local process: `C:\cloudflared\cloudflared.exe tunnel --config C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml run`

## Startup Path

- Scheduler entrypoint: `C:\ANTIGRAVITY\scripts\autostart.ps1`
- Paperclip launch command now uses:
  - `pnpm paperclipai run -d C:\ANTIGRAVITY\paperclip-runtime -i default --no-repair`
- The startup script kills any non-ANTIGRAVITY process already holding port `3100`
- The startup script starts the repo-owned Cloudflare tunnel and skips duplicate tunnel starts

## Drift Cleanup

- Removed:
  - `C:\ANTIGRAVITY\paperclip-runtime-test325`
  - `C:\ANTIGRAVITY\paperclip-postgres-data`
  - `C:\Users\joshl\Documents\ANTIGRAVITY-CLEANUP-ARCHIVE-2026-04-02`
  - `E:\trollz-sandbox\dao-patches`
  - `E:\trollz-antigravity`
  - `E:\tmp\openclaw`
  - `E:\opt\paperclip`
  - `E:\.env`
  - `E:\.env.txt`
  - `E:\.mcp.json`
  - `E:\deploy-antigravity.ps1`
  - `C:\Users\joshl\.cloudflared\paperclip-direct.yml`
  - `C:\Users\joshl\.cloudflared\8051d1ed-75c7-4dda-82eb-933930570526.json`
- Docker cleanup:
  - removed legacy containers `paperclip-antigravity-postgres` and `paperclip-sabretooth-postgres`
  - removed legacy volumes `docker_paperclip-data`, `paperclip-antigravity_postgres-data`, and `paperclip-antigravity_ollama-data`
- Remaining locked legacy remainder:
  - `E:\trollz-sandbox\paperclip-antigravity\logs`
- One-time cleanup queued at next logon:
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce\PaperclipDriftCleanup`
  - runs `C:\ANTIGRAVITY\scripts\cleanup-paperclip-drift.ps1`
- Downloads scan:
  - no matching `paperclip` / `antigravity` / `openclaw` / `ollama` drift was found under `C:\Users\joshl\Downloads`
- Ollama holdout:
  - `E:\OllamaModels\models` remains the active Ollama model store via `OLLAMA_MODELS`, so `E:` cannot be wiped wholesale until the model store is migrated

## Notes

- The old `paperclip.youandinotai.com` / `mcp.youandinotai.com` history remains documented, but the new clean browser entrypoint is `paperclip-hq.youandinotai.com`.
- The active Paperclip runtime is now fully local to `C:\ANTIGRAVITY`; the old `E:` runtime is no longer the source of truth.
- `.gitignore` now excludes node-local `paperclip-runtime/`, `paperclip-worktrees/`, `paperclip-upstream/`, and `.paperclip/` so the live repo can stay cleaner on Sabretooth.
