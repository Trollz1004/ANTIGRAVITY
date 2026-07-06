# Codex / Opus Verified Status — 2026-07-06

**Audience:** Codex, Opus, Claude, Gemini, Hermes, and future repo agents.

**Primary instruction:** do not rebuild YouAndINotAI. The app exists. Focus on revenue, Square sandbox/webhook alignment, and safe repo coordination.

---

## Verified repo state

Main repo:

```text
C:/ANTIGRAVITY
remote: https://github.com/Trollz1004/ANTIGRAVITY.git
branch: main
local HEAD: 5093b6e4 fix: label public command center as PAPERWEIGHT
origin/main: e8474a0e feat(dream): NPC provider router + AnythingLLM support fallback (#193)
divergence after fetch: local ahead 762, behind 911
```

Do **not** pull/reset/merge the local main checkout blindly. It is heavily divergent and dirty.

Safe updated origin worktree:

```text
C:/Users/joshl/_worktrees/antigravity-origin-main-updated
HEAD: e8474a0e origin/main
```

Use this worktree for reading updated merged PR state.

---

## Merged PR now visible

Josh said a PR was not merged and he merged it. Safe fetch confirmed:

```text
e8474a0e feat(dream): NPC provider router + AnythingLLM support fallback (#193)
```

Impact summary:

- Adds `services/dream-npc-router/`.
- Adds Dream Online MMORPG NPC provider routing service.
- Adds provider policy for Ollama local, 1Min.ai, AIHubMix, and reserved Sup@ path.
- Adds child-mode guardrail: under-13 mode uses local Ollama only by default.
- Adds support-service changes in `backend/fastapi-app/app/support_service.py` for AnythingLLM support fallback.
- Updates backend env docs/config and support tests.

Changed relevant paths from `a4933532..e8474a0e`:

```text
backend/fastapi-app/.env.example
backend/fastapi-app/app/config.py
backend/fastapi-app/app/support_service.py
backend/fastapi-app/docker-compose.yml
backend/fastapi-app/tests/test_support_routes.py
backend/fastapi-app/tests/test_support_service.py
pnpm-lock.yaml
services/dream-npc-router/**
```

---

## Verification performed after PR #193 fetch

Backend targeted tests from updated origin worktree using existing T5500 venv:

```text
cd C:/Users/joshl/_worktrees/antigravity-origin-main-updated/backend/fastapi-app
env -u VIRTUAL_ENV -u PYTHONPATH C:/ANTIGRAVITY/backend/fastapi-app/.venv/Scripts/python.exe -m pytest tests/test_billing.py tests/test_support_service.py tests/test_support_routes.py -q --no-cov
```

Result:

```text
12 passed, 6 warnings in 4.90s
```

Dream NPC router verification:

```text
cd C:/Users/joshl/_worktrees/antigravity-origin-main-updated/services/dream-npc-router
npm install --ignore-scripts
npm test
```

Result:

```text
3 test files passed
10 tests passed
```

Note: `pnpm install --frozen-lockfile` at repo/workspace level failed on this Windows/Node 26 environment because `better-sqlite3` has no prebuilt binary for Node 26 and node-gyp could not find a usable Visual Studio C++ workload.

This is an environment/toolchain blocker, not a Dream router test failure. Direct service-local `npm install --ignore-scripts && npm test` passed.

---

## 7 GitHub issues resolved

Open issues found:

```text
#161 #162 #163 #164 #165 #172 #174
```

All were `INTEGRITY [REVIEW]: Paperclip CEO/Hermes agent files modified by Trollz1004` watchdog tickets.

Josh explicitly told Hermes to resolve the 7 issues. Hermes verified current protected file hashes at `origin/main` and closed all seven with review notes.

Current protected baseline at `origin/main e8474a0e`:

```text
e6919eeeb2e446a0f7d1f4c50decc1fb6493f6c717cada019ba5db63fa08d11d  paperclip/agents/ceo/AGENTS.md
a36717cb8a9976e9ec3b588e04bb42dd5ce533b90a53cf5e7550422bd89d1158  paperclip/agents/ceo/TOOLS.md
97112d4423ef49abf466ed379a30083cf22bc30f7f5288acd2f97634964e0296  paperclip/agents/ceo/HEARTBEAT.md
f1b693f8090cf711277ebc8a2e03034f413f4dc5f449d73675afa8badbc988e5  paperclip/agents/hermes/AGENTS.md
c018c863ace878c5c337ccafa9b852883e15e6037ca2dde1e82eb03b737be8b4  paperclip/agents/hermes/TOOLS.md
36c6d2d6fe85afdc4e7f740b3083f976da40a1a0a73f72f23903a8402e937f64  paperclip/agents/hermes/HEARTBEAT.md
```

No protected files were modified by the issue closeout.

`gh issue list --state open` returned no remaining open issues after closeout.

---

## YouAndINotAI verified state

Do not rebuild the date app.

Active paths:

```text
frontend/react-app
apps/youandinotai-static
backend/fastapi-app
briefings/YOUANDINOTAI-DEPLOY-RUNBOOK.md
```

Public endpoints previously verified:

```text
https://youandinotai.com
https://api.youandinotai.com/api/v1/health
```

API health previously returned:

```json
{
  "status": "ok",
  "db_connected": true,
  "redis_connected": true,
  "square_connected": true,
  "square_signature_configured": true,
  "wallet_rails_proven": false,
  "wallet_rails_status": "unproven",
  "payment_proof_labels": [],
  "user_count": 3
}
```

3-day launch trial exists in the backend/frontend. Registration assigns `launch_trial` with a 3-day expiry.

---

## Square / payment blocker remains priority

Do not ask Josh for another real payment until sandbox/webhook alignment is proven.

Known Square links:

```text
Bot-Shield $1:       https://square.link/u/Qc5mxUy7
Founding Member:     https://square.link/u/cxwjcn0s
3-Month Founder:     https://square.link/u/oY7qEfRM
12-Month Founder:    https://square.link/u/6GHpbvvl
Royalty Card:        https://square.link/u/CafhorUS
```

Critical mismatch found earlier:

```env
SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL=https://youandinotai.com/api/v1/webhooks/square
SQUARE_WEBHOOK_NOTIFICATION_URL=https://youandinotai.com/api/v1/webhooks/square
```

But the frontend host returned `503` for webhook posts.

Canonical webhook target should be:

```text
https://api.youandinotai.com/api/v1/webhooks/square-payment
```

Backend env + Square Dashboard should align to:

```env
SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL=https://api.youandinotai.com/api/v1/webhooks/square-payment
SQUARE_WEBHOOK_NOTIFICATION_URL=https://api.youandinotai.com/api/v1/webhooks/square-payment
```

Sandbox test card is only for sandbox config:

```text
4111 1111 1111 1111
CVV 111
future expiration
```

Sandbox requires:

```env
SQUARE_API_BASE_URL=https://connect.squareupsandbox.com
SQUARE_ACCESS_TOKEN=<sandbox token>
SQUARE_LOCATION_ID=<sandbox location id>
```

Current production config uses:

```env
SQUARE_API_BASE_URL=https://connect.squareup.com
```

Do not use the sandbox test card against production Square config.

---

## Node role corrections

Josh corrected Sabretooth’s role.

Current map:

| Node | Role |
|---|---|
| T5500 / DESKTOP-H4B53GL | ANTIGRAVITY public revenue/front-door: domains, Cloudflare tunnels, payment/webhooks, date-app backend/routing |
| Sabretooth | Dream Online MMORPG work/dev node |
| 9020 | ANTIGRAVITY standby/runtime/support/income node |
| New Win11 i5 24–32GB | Main ANTIGRAVITY revenue worker: builds, tests, lead-gen, fulfillment, outreach prep |
| New Win11 i5 16GB | Sales/customer ops worker: dashboards, support queue, monitoring, secondary jobs |
| Mini Asus 16GB laptop-RAM PC | Lightweight watchdog/backup/status appliance; not full desktop-class PC |

Do not assign Sabretooth as ANTIGRAVITY watchdog/control by default.

---

## Revenue-first doctrine

Josh cannot afford more paid platforms until projects generate funds.

Default to free/self-hosted:

```text
Cloudflare Free DNS/Tunnel
Caddy/HAProxy
Docker Compose
self-hosted Postgres or Supabase Free with local backups
self-hosted Redis/Valkey
Uptime Kuma
Restic/Kopia/Syncthing
Git scripts / Windows Task Scheduler
```

Fastest revenue focus:

1. Fix Square sandbox/webhook alignment.
2. Add direct Square fallback buttons.
3. Make `$1 Bot-Shield` and `$14.99 Founding Member` primary CTAs.
4. Keep 3-day trial as secondary.
5. Use new worker nodes for revenue ops, builds, lead-gen, and fulfillment only.

---

## Immediate next actions for Codex/Opus

1. Use the updated worktree for current origin reading:

```text
C:/Users/joshl/_worktrees/antigravity-origin-main-updated
```

2. Do not mutate divergent `C:/ANTIGRAVITY/main` blindly.

3. Treat #193 as merged and verified at a targeted level:

```text
backend targeted tests: 12 passed
Dream NPC router tests: 10 passed
```

4. Fix Square webhook/sandbox alignment before any more real charges.

5. If making code changes, create a new branch/worktree from `origin/main`, verify, then PR.
