# T5500 Node — Gateway + All Orchestration

> ANTIGRAVITY HQ | Agent Hub :3130 | ALL services except DREAM
> Repo: C:\antigravity | Branch: main

## Services (autostart via scripts/bootstrap-t5500.ps1)

| Service | Port | Purpose |
|---|---|---|
| Agent Hub | :3130 | Single gateway — ALL AI sends work HERE |
| Hermes Router | :11435 | Agent routing + cloud relay |
| FCC Proxy | :8082 | FCC-Claude adapter |
| Ollama | :11434 | Light local models (NOT for DREAM) |
| PostgreSQL | :5432 | Agent Hub database |
| Cloudflared | tunnel | youandinotai.com DNS |

## What runs here

ALL orchestration. Every AI on every platform sends tasks to T5500 :3130.
Agent Hub dispatches to the right platform on the right node.
20 platforms supported — see services/agent-hub/README.md.

## What does NOT run here

- DREAM game server (Sabretooth only)
- 1min.ai desktop app (Sabretooth only)
- Browser sign-in apps (9020 only)

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-t5500.ps1
```
