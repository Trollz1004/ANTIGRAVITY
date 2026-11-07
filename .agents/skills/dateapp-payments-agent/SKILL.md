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

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
