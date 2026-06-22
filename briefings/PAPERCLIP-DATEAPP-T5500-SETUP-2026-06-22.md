# T5500 Paperclip Date-App Setup - 2026-06-22

This briefing records the current Paperclip setup performed for the date app and
customer support lane. It is active context for `C:\antigravity`.

## Scope

The T5500 Paperclip setup is for:

- YouAndINotAI date-app GUI work.
- Customer support and support drafting.
- Cloudflare/T5500 handoff checks.
- Compact timestamped heartbeats and graph-style memory pointers.
- Business-only support/public-copy boundary checks.

It is not a Hermes setup.

## Installed Package

- Local package root: `C:\antigravity-paperclip-dateapp-ops`
- T5500 package root: `C:\antigravity-paperclip-dateapp-ops`
- T5500 Paperclip URL: `http://127.0.0.1:3100`
- T5500 scheduled task: `PaperclipDateAppLoopback`
- T5500 watchdog task: `PaperclipDateAppWatchdog`
- Scheduled task runner: `C:\antigravity-paperclip-dateapp-ops\scripts\run-paperclip-loopback.ps1`
- Watchdog runner: `C:\antigravity-paperclip-dateapp-ops\scripts\watchdog-paperclip-loopback.ps1`
- Heartbeat script: `C:\antigravity-paperclip-dateapp-ops\scripts\new-heartbeat.ps1`
- MCP memory bridge manifest/server: `C:\antigravity-paperclip-dateapp-ops\mcp\dateapp-paperclip-memory-server.cjs`

The package scan at setup completion reported:

- Hermes references: `0`
- `Documents`/`Downloads`/`.env` artifacts inside the setup root: `0`

No populated env files were copied into this package.

## Paperclip Company

- Company name: Antigravity
- Company ID: `02b444c8-cdb7-40e5-b623-230d22c50f1c`

Paperclip is running loopback-only on T5500. The runtime was started through the
normal `paperclipai run` path and made durable with the scheduled task above.

## Resilience

T5500 has two Paperclip scheduled tasks:

- `PaperclipDateAppLoopback`: starts the loopback Paperclip server.
- `PaperclipDateAppWatchdog`: checks `http://127.0.0.1:3100/api/adapters` and
  restarts `PaperclipDateAppLoopback` if the health check fails.

The tasks include startup/logon triggers. The watchdog also repeats every five
minutes. This is intended to recover after process crashes and after ordinary
power-loss reboot paths where the `joshl` user session is available.

Do not move this to a SYSTEM/admin service without testing. Paperclip's embedded
PostgreSQL previously refused admin-style startup, so the current safe path is a
user-context scheduled task, not a forced SYSTEM service.

## Agents

Codex is the Paperclip CEO and only decision lane.

Current agents:

- `Codex CEO`: role `ceo`, adapter `codex_local`, `canCreateAgents=true`
- `Date App UX`: role `designer`, adapter `codex_local`, worker-only
- `Cloudflare Operator`: role `devops`, adapter `codex_local`, worker-only
- `Official OpenClaw Support`: role `general`, adapter `openclaw_gateway`, support-only
- `FCC Worker`: role `engineer`, adapter `opencode_local`, worker-only
- `Support Compliance`: role `qa`, adapter `codex_local`, worker-only
- `Context Sentry`: role `pm`, adapter `codex_local`, worker-only

All worker agents report to `Codex CEO`.

Official OpenClaw must remain support-only. It must not become a policy,
payment, treasury, public-copy authority, or product-control layer.

FCC/OpenCode must remain worker-only. FCC may draft, inspect, summarize, or
propose implementation work, but it must not make final repo, launch, payment,
public-copy, or node-role decisions.

## Starter Issues

The starter Paperclip issues were created, then released back to `todo` and
unassigned so Paperclip does not auto-run unconfigured adapters.

Visible starter queue:

- `ANT-1`: Redesign YouAndINotAI date-app GUI
- `ANT-3`: Wire Official OpenClaw as support-only agent
- `ANT-5`: Prepare Cloudflare and T5500 handoff checks
- `ANT-7`: Maintain compact timestamped context heartbeats
- `ANT-9`: Audit support and landing copy for business-only boundary
- `ANT-11`: Use FCC/OpenCode only as worker implementation lane

Do not assign these issues to agents until the matching runtime adapters are
confirmed working.

Auto-generated recovery issues from the first adapter attempts were hidden
because they were setup noise, not product work.

## Heartbeats And Memory

The package writes compact timestamped heartbeats to:

- `C:\antigravity-paperclip-dateapp-ops\heartbeats\`
- `C:\antigravity-paperclip-dateapp-ops\memory\timeline.jsonl`
- `C:\antigravity-paperclip-dateapp-ops\graphy\nodes.jsonl`
- `C:\antigravity-paperclip-dateapp-ops\graphy\edges.jsonl`

Each heartbeat should include timestamp, agent, status, task, last action, next
action, blocker, risk, file locations, memory references, and compact summary
length. The purpose is to reduce repeated long context dumps.

## 9020 Hermes Boundary

9020 Hermes Paperclip setup is separate from this T5500 package.

Joshua has not decided whether 9020 Hermes should become:

- a marketing node, or
- an AI-solutions/business-exchange lane.

Until Joshua decides, no agent should treat 9020 Hermes as current authority for
marketing, product control, payments, public copy, or business exchange. Keep
9020 as dev/support checkout unless Joshua gives a newer directive.

## Current Blocker

The Paperclip agent records exist and are idle, but the worker runtime adapters
must be configured before issues are assigned:

- Codex local adapter for Codex-based workers.
- OpenClaw gateway for support-only OpenClaw.
- OpenCode/FCC adapter for FCC worker tasks.

Do not assign starter issues until those adapters are confirmed.
