# ANTIGRAVITY one-root mission-control execution plan

Generated from Hermes Desktop using the active best available API model path: `gpt-5.5` via OpenAI Codex OAuth. Anthropic API is not part of this plan.

## Scope lock

- One repo/root: `C:\antigravity`.
- One branch: `main` unless Josh explicitly asks for a feature branch.
- One visible source of truth: Paperweight/Paperclip on Sabretooth, controlled by Hermes Desktop.
- Node roles:
  - Sabretooth: Hermes Desktop, Paperweight/Paperclip CEOs, public-safe mission-control operator view.
  - T5500 (`192.168.0.15`): self-hosted YouAndINotAI date app on port `3200`.
  - 9020 (`192.168.0.5`): Business Exchange / AI-Solutions work on port `3050`.

## Company CEOs on the board

Paperweight company IDs and CEO contracts:

| Company             | CEO contract                             | Runtime owner                                                   |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `youandinotai`      | `hermes/agents/ceo-youandinotai.md`      | Hermes → date app/customer support                              |
| `ai-solutions`      | `hermes/agents/ceo-ai-solutions.md`      | Hermes → AI products/store                                      |
| `business-exchange` | `hermes/agents/ceo-business-exchange.md` | Hermes → 9020 marketplace/operator flow                         |
| `hermes-sideworld`  | `hermes/agents/ceo-hermes-sideworld.md`  | Hermes → orchestration/public mission-control                   |
| `marketing`         | `hermes/agents/ceo-marketing.md`         | Hermes → cross-platform marketing for the three public surfaces |
| `youtube`           | `hermes/agents/ceo-youtube.md`           | Hermes/Gemini lane → 24/7 stream/content engine                 |

## Public mission-control stream rules

The YouTube stream can show public work and public mission programming intentionally. The stream-safe dashboard must never show:

- credentials, membership records, RDP passwords, auth file paths, raw env values, or API keys;
- customer PII or payment-provider raw responses;
- private family/business reserve/internal doctrine notes;
- terminal panes that might print secrets;
- fake green health states.

Green requires a real check with the expected body shape. A 200 with an empty body, redirect-only body, or wrong shape is yellow/red.

## Execution phases and gates

### Phase 1 — Paperweight/Paperclip source of truth

Actions:

1. Run Paperweight/Paperclip on Sabretooth `127.0.0.1:3100`.
2. Seed company workspaces for `youandinotai`, `ai-solutions`, `business-exchange`, `hermes-sideworld`, `marketing`, and `youtube`.
3. Create one parent coordination card under `hermes-sideworld` and child cards for each app/node lane.

Acceptance:

- `/api/state` returns all company IDs.
- Every lane has a visible card with owner, current state, and acceptance criteria.

### Phase 2 — T5500 date app

Actions:

1. Probe `http://192.168.0.15:3200/` from Sabretooth.
2. Validate expected HTML/app text, not just open port.
3. Add a non-destructive payment-path probe that reports `green | yellow | red` only.

Acceptance:

- T5500 reachable from Sabretooth or explicitly marked degraded.
- Date app status is based on body shape and timestamp.
- Payment status is redacted and non-destructive.

### Phase 3 — 9020 Business Exchange / AI-Solutions

Actions:

1. Probe `http://192.168.0.5:3050/` from Sabretooth.
2. Treat auth redirects as `yellow` until an authenticated or public health endpoint proves app shape.
3. Add separate Business Exchange and AI-Solutions checks if they diverge by route/host.
4. Add non-destructive payment-path checks with redacted output.

Acceptance:

- 9020 is reachable.
- Business Exchange / AI-Solutions status is not based on TCP alone.
- Any auth-only surface is marked yellow until a real health endpoint exists.

### Phase 4 — Public stream-safe mission control

Actions:

1. Build/serve `apps/mission-control/public/stream-safe.html` as the OBS/YouTube-safe view.
2. Show only sanitized cards: node, service, state, last check, and public-safe next action.
3. Keep Hermes Desktop/private panes off-stream.

Acceptance:

- The stream page contains no secrets or credentials.
- It can be visually inspected before streaming.
- Operational statuses are sourced from Paperweight/health probes when available.

### Phase 5 — Watchdogs and repair

Actions:

1. One hot watcher for fast feedback.
2. One durable Hermes cron backup if the script is silent on healthy runs.
3. Incidents update Paperweight instead of waking Josh unless human input is required.

Acceptance:

- Healthy watcher output is quiet except logs.
- Incidents include time, component, status, and repair result.
- No duplicate loops for the same check cadence.

## Current verified state at creation

- Hermes active model path: `gpt-5.5` via OpenAI Codex OAuth.
- Sabretooth local Paperweight was started on `127.0.0.1:3100` for this coordination pass.
- 9020 responded to ping and port `3050` returned `/auth/login?redirect=%2F`, so reachability is real but app health is still `yellow` until a health endpoint/body-shape check exists.
- T5500 ping timed out, but port `3200` returned HTML, so the date app surface is reachable but should be marked `yellow` until full body-shape/payment checks pass.
