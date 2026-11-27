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
- Square is primary and PayPal is secondary per `docs/PAYMENTS-TRUTH.md`; no unapproved legacy third-party card processors are active.
- All processors consolidate at the single LLC bank account.
- Reconcile via internal ledger tables and payment processor reports.

## When to Use

- Any change to payments, pricing, ledgers, subscriptions, checkout, refunds, or public copy about money.
- Before adding customer-facing money claims beyond product price and receipt facts.
- When designing a new revenue surface that needs business-only product positioning.

Cross-reference: briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md and briefings/BUSINESS-ONLY-AUDIT-2026-06-22.md.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
