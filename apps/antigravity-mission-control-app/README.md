# ANTIGRAVITY Mission Control ChatGPT App

Safe local scaffold for a future ChatGPT App that keeps OpenAI in the ANTIGRAVITY mission loop without replacing real Codex Desktop.

## What It Does

- Shows canonical repo truth: `c:\antigravity` and `/mnt/c/antigravity`.
- Reads only approved docs/templates from the repo.
- Summarizes env drift from placeholder-only sources.
- Drafts safe prompts for Codex Desktop.
- Drafts Slack/Hermes handoffs without sending them.
- Provides a simple widget at `http://127.0.0.1:8788`.

## What It Will Not Do

- It will not read populated `.env` files.
- It will not print, test, or copy secrets.
- It will not delete files, merge branches, deploy services, change payment rails, or post messages live.
- It will not run wrapper-Codex through Ollama.
- It will not revive DAO/token/fundraising surfaces.

## Run Locally

```powershell
cd c:\antigravity
pnpm --filter @antigravity/mission-control-chatgpt-app dev
```

Open:

```text
http://127.0.0.1:8788
```

Health check:

```powershell
pnpm --filter @antigravity/mission-control-chatgpt-app check
```

Smoke test:

```powershell
pnpm --filter @antigravity/mission-control-chatgpt-app test
```

## Tool Endpoints

- `GET /api/mission/status`
- `GET /api/env/drift`
- `POST /api/tools/get_mission_status`
- `POST /api/tools/read_env_drift_map`
- `POST /api/tools/prepare_codex_execution_prompt`
- `POST /api/tools/draft_handoff`
- `GET /mcp/manifest`

## Design Boundary

This app is intentionally boring where danger lives. It gives ChatGPT/Hermes a stable mission memory and drafting layer, while real Codex Desktop keeps the branch, code, CI, security, and merge authority.
