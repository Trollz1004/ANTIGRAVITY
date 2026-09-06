---
name: product-copy-business-only
description: Use when writing public date-app copy. Enforces business-only language.
---

# Business-Only Copy

Allowed: membership, verification, safety, video dates, matching quality, uptime.
Banned: cause framing of any kind, hospital or kids references, ownership or share-of-money talk, DAO sale hype, ticker widgets, Stripe.
Voice: direct, calm, non-cocky. Product sells access and trust signals.

## Voice model — `joshlcoleman/Fable` (ruled 2026-09-06)

Joshua's own Ollama model is the mandatory voice for Date App marketing copy: `joshlcoleman/Fable` (private listing on ollama.com; Modelfile and README at `ops/fable-model/`). It replaces `joshlcoleman/dateapp-marketing`, whose SYSTEM prompt carried cause framing that this rule bans; that model stays on the box but writes no public copy. Fable's SYSTEM prompt bakes in this rule, the real Square-only tiers, and the adults-only (18+) venue policy: it writes for 18+ boards in their register and does not refuse or age-gate adult-oriented copy. Everything it drafts still passes the canonical guard and Joshua's eye before it ships. Run: `ollama run joshlcoleman/Fable`.
