---
name: dateapp-payments-agent
description: "Use when dispatching the dateapp-payments-agent lane of the YouAndINotAI dateapp swarm. Payments lane: Square primary, PayPal, Cash App, Plaid verify. No Stripe."
---

# dateapp-payments-agent

## Skills (load before work)

- `dateapp-payments-agent/cashapp-plaid/SKILL.md`
- `dateapp-payments-agent/no-stripe-iron-wall/SKILL.md`
- `dateapp-payments-agent/paypal-rail/SKILL.md`
- `dateapp-payments-agent/square-primary/SKILL.md`

## Workspace

`C:\\Users\\joshl\\ANTIGRAVITY-WORK\\ANTIGRAVITY` only.

## Orchestrator

See `dateapp-swarm/SKILL.md`.

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. All 15 past Square attempts (2025-04 to 2026-08, $10 refund included) are Joshua's own test charges, and the pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a new non-Joshua payment in Square (report it as the first real customer). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.
