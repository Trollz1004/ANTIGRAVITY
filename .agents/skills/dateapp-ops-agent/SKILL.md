---
name: dateapp-ops-agent
description: "Use when dispatching the dateapp-ops-agent lane of the YouAndINotAI dateapp swarm. Ops lane: Mission Control, C-drive workspace, swarm dispatch, hard health verify."
---

# dateapp-ops-agent

## Skills (load before work)

- `dateapp-ops-agent/c-drive-workspace/SKILL.md`
- `dateapp-ops-agent/health-verify/SKILL.md`
- `dateapp-ops-agent/mission-control-live/SKILL.md`
- `dateapp-ops-agent/swarm-dispatch/SKILL.md`

## Workspace

`C:\ANTIGRAVITY` only (profile `joshi` — `joshl` is retired/wrong).

## Orchestrator

See `dateapp-swarm/SKILL.md`.

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. All 15 past Square attempts (2025-04 to 2026-08, $10 refund included) are Joshua's own test charges, and the pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a new non-Joshua payment in Square (report it as the first real customer). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.
