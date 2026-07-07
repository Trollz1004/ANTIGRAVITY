# T5500 Desktop Commander Handoff — YouAndINotAI / Hermes / Support Rails

Date: 2026-07-06
Repo: https://github.com/Trollz1004/ANTIGRAVITY
Primary machine: T5500
Main repo path: `C:\antigravity`
DREAM drive path: `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG`

## Coordination Rule

Do not start parallel Hermes/Paperclip/support runtimes against the same repos or data roots without first identifying the canonical instance. Multiple Hermes instances have previously created confusing repo/data drift that made OpenClaw/Codex/Desktop Commander interpret state incorrectly.

## Canonical Hermes Goal

Josh wants T5500 Desktop Commander to consolidate Hermes access:

- Use the preferred Hermes workspace GUI associated with Hermes `9119`.
- Port/expose the better Hermes GUI on local port `3000`.
- Put that GUI behind one stable DNS/proxy URL.
- Avoid multiple competing Hermes instances touching the same repos/data.

Recommended shape:

- `hermes.youandinotai.com` -> T5500 Hermes GUI on `127.0.0.1:3000`
- `youandinotai.com` remains the date-app / YouAndINotAI frontend route.

Before changing routing, document:

1. Canonical Hermes URL
2. Canonical Hermes workspace path
3. Canonical Hermes data root
4. Which duplicate Hermes instances were stopped/quarantined
5. Which repos/data roots the canonical Hermes is allowed to write

## Existing YouAndINotAI Runtime on T5500

Do not break this while adding Hermes DNS/proxy routing:

- Public domain: `https://youandinotai.com`
- T5500 local frontend origin: `http://127.0.0.1:3200`
- Durable scheduled task: `DateAppStaticServer`
- Scheduled task script: `C:\ANTIGRAVITY\scripts\start-dateapp-frontend-3200.ps1`
- App path on T5500: `C:\ANTIGRAVITY\frontend\react-app`

Current frontend routing includes API/webhook proxy behavior in `frontend/react-app/server.ts` for:

- `/api/v1/*`
- `/webhooks/*`

Backend upstream:

- `https://dateapp-backend-io5tscl75a-ue.a.run.app`

Known backend blocker:

- Backend currently returns `503`.
- GitHub Actions backend redeploy failed because GCP billing is disabled.
- Do not test Square card checkout until backend health and Square sandbox mode are proven end-to-end.

## Sabretooth Support Rail Work

Sabretooth set up AnythingLLM as a lightweight support rail for YouAndINotAI / DREAM Online.

Verified local services:

- AnythingLLM: `http://127.0.0.1:3001`
- PaperclipAI: `http://127.0.0.1:3110`
- Agent Hub: `http://127.0.0.1:3130`
- Ollama: `http://127.0.0.1:11434`
- Support model alias: `youandinotai-support-cpu:latest`

Tracked repo files changed for this support/Paperclip work:

- `.gitignore`
- `backend/fastapi-app/.env.example`
- `backend/fastapi-app/app/support_service.py`
- `backend/fastapi-app/tests/test_support_service.py`
- `scripts/start-paperclip.ps1`

Support flow now follows:

1. Built-in safe public support presets
2. AnythingLLM support workspace
3. OpenClaw support URL if configured
4. Ollama fallback with CPU-safe options
5. Human ticket fallback

AnythingLLM freeform output is guarded:

- Safe unstructured text opens a generic human-review ticket.
- Forbidden drift terms are rejected, including PayPal, Stripe, taxes, DAO/token, donations, investments, nonprofit/charity framing, private accounting, and similar unsafe support drift.

## Paperclip Fix

`scripts/start-paperclip.ps1` now clears inherited unrelated `DATABASE_URL` unless:

- `PAPERCLIP_ALLOW_EXTERNAL_DATABASE_URL=1`

This keeps Paperclip local trusted mode using its embedded Postgres instead of accidentally using AnythingLLM's SQLite or another app database.

## DREAM Adapter Mirror Notes

DREAM-side files created/updated outside this repo include:

- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\support\anythingllm\Modelfile.support-cpu`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\support\anythingllm\README.md`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\support\anythingllm\start-anythingllm-support.ps1`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\support\anythingllm\youandinotai-support-kb.md`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\adapters\sync-from-antigravity.ps1`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\adapters\README-DREAM.md`
- `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\paperclip-tro\MIRROR-SCOPE.md`

Important caveat:

- AnythingLLM can upload/embed the KB, but querying attached workspace documents crashes this Desktop build's native embedding retrieval path.
- The KB is intentionally detached.
- Support still works through presets + AnythingLLM ticket signal + fallback rails.

## Tests Already Reported Passing

Sabretooth reported:

- `pytest tests\test_support_service.py tests\test_support_routes.py -q --no-cov` -> `9 passed`
- `ruff check` -> passed
- `black --check` -> passed
- Route-level support E2E passed with `anythingllm_support` creating a clean support ticket.

## Safety Notes

- Do not inspect or print `cloudflared.exe` process command lines; token-mode tunnels can expose tunnel tokens in argv.
- Keep DNS/proxy/API tokens redacted.
- Do not enter Square sandbox card numbers unless sandbox/test mode is proven active end-to-end.
- Do not commit/push unrelated worktree changes without checking ownership first.
