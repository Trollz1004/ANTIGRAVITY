---
name: revenue-model
description: Business-only revenue guidance for Trash Or Treasure Online Recycler LLC. Use for checkout, pricing, ledger, payment processor, and customer-surface copy decisions. Public product work must stay focused on membership, verification, safety, support, uptime, and platform access.
---

# Revenue Model - Business-Only Forward (2026-06-22)

## Canonical Truth

- Single LLC: Trash Or Treasure Online Recycler LLC (FL #L25000158401)
- Business money goes through normal merchant, bank, ledger, and bookkeeping workflows.
- Public/customer work sells product value only.
- Owner accounting decisions are private business operations and are not AI launch gates.
- Future legal/control structures are outside live checkout unless Joshua provides a new timestamped directive.

## Customer-Facing Rules (Strict)

- Lead with membership, verification, safety, support, uptime, and platform access.
- Do not expose private accounting, owner decisions, legal structures, or control plans in UI, emails, ads, public API, social posts, marketplace listings, or checkout copy.
- Do not block checkout while waiting for future legal/control work.
- If money language is needed, use plain product terms: price, subscription, membership, receipt, refund, support, checkout, and account access.

## Implementation Notes

- Square is primary for YouAndINotAI.
- Stripe is legacy unless a non-dating surface explicitly uses it.
- All processors consolidate at the single LLC bank account.
- Reconcile via internal ledger tables and payment processor reports.

## When to Use

- Any change to payments, pricing, ledgers, subscriptions, checkout, refunds, or public copy about money.
- Before adding customer-facing money claims beyond product price and receipt facts.
- When designing a new revenue surface that needs business-only product positioning.

Cross-reference: briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md and briefings/BUSINESS-ONLY-AUDIT-2026-06-22.md.

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. Of the 16 Square attempts through 2026-08-16, 15 are Joshua's own test charges (the $10 refund included) and one is a $1.00 charge on 2026-02-17 (receipt T14t, second location) from a buyer Joshua does not know. On 2026-09-18 two $1.00 Bot-Shield charges (receipts b3FM and v1nS) were paid by Heather, a friend Joshua asked to be the first customer he arranged: a real third-party card. So never say there are no outside payments, and never present Heather's as organic demand. The buyer of T14t is unidentified: never call that one a friend, a test or demand. The pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a payment from a buyer not already listed in the record (report it, do not re-verify). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.

Account emails (Joshua, 2026-10-23): `ebaytrashortreasure@gmail.com` is the older, established email the Date App needs; it signs in to exactly two merchant accounts, Square and PayPal. Every other account and service uses `joshlcoleman@gmail.com`. Rule: `CLAUDE.md`, section "Account mapping".
