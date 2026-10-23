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

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. The 15 Square attempts through 2026-08-16 ($10 refund included) are Joshua's own test charges. On 2026-09-18 two $1.00 Bot-Shield charges (receipts b3FM and v1nS) were paid by Heather, a friend Joshua asked to be the first customer: a real third-party card, so never say there are no outside payments, and never present it as organic demand. The pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a payment from a buyer not already listed in the record (report it, do not re-verify). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.

Account emails (Joshua, 2026-10-23): `ebaytrashortreasure@gmail.com` is the older, established email the Date App needs; it signs in to exactly two merchant accounts, Square and PayPal. Every other account and service uses `joshlcoleman@gmail.com`. Rule: `CLAUDE.md`, section "Account mapping".
