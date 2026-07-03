# STATE — ant-support — 2026-07-02T01:05:00-04:00

## In flight
- OpenClaw Paperclip API key is active and stored only in private local env material under `C:\Users\joshl\.paperclip\`.
- OpenClaw cron `OpenClaw Paperclip agent watchdog` runs every 30 minutes in an isolated session.
- Watchdog script writes sanitized status to `agent-watchdog-status.json`.

## Learned
- Josh explicitly trusts OpenClaw to do more than support: support is the first lane, not the ceiling.
- Broader lane: board ops/agent watchdog, provider/config repair proposals, date-app support setup, AI-solutions/business-exchange support, and marketing assistance.
- Browser use is allowed any time when useful.
- Current sanitized board health at setup: 5 open tasks, 0 in-progress, 5 blocked, 4 error agents, 1 paused agent.
- Paperclip API reachable at `http://127.0.0.1:3110`; OpenClaw gateway reachable at `ws://127.0.0.1:18789`.
- Customer-facing support must avoid mission/fundraising/beneficiary language; sell membership, verification, safety, support, reliability, uptime.
- Do not touch payments/refund policy/public doctrine/platform governance/checkout directly; propose to CEO unless explicitly authorized.
- Never print or commit Paperclip keys, adapter configs, headers, env values, tokens, PEMs, private keys, or raw agent objects.

## Blocked
- Direct Paperclip agent role patch needs endpoint/schema confirmation; local docs now reflect expanded role.

## Improve
- Added `openclaw-paperclip-agent-watchdog.ps1`.
- Added cron watchdog.
- Hardened local ant-support docs and heartbeat against support-only idling.
