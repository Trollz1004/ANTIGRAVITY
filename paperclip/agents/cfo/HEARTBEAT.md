# CFO Agent Heartbeat

**Agent:** `paperclip-agents-cfo`  
**Authority:** Joshua Coleman (`Trollz1004`)  
**Pulse interval:** Every cycle involving revenue, payments, receipts, or financial reconciliation.

---

## Current State

- **Live payment rail:** Square production on `youandinotai.com`.
- **Payment source of truth:** `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`.
- **LLC:** Trash Or Treasure Online Recycler LLC, FL #L25000158401.
- **Public copy rule:** Business-only; no charity/split/disbursement language.
- **Internal allocation floor:** 10% per bucket, encoded, not surfaced.

---

## Pulse Checks

1. Read `paperclip/agents/cfo/AGENTS.md` and `paperclip/agents/cfo/TOOLS.md`.
2. Read `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`.
3. Check revenue allocations and ledger for gaps.
4. Re-curl live payment/checkout pages for doctrine drift.
5. Confirm no protected file was rewritten by an agent.

---

## Open Questions / Escalation Triggers

- Any live page shows charity/donation language → escalate to CEO/CMO.
- Any bucket falls below 10% allocation → escalate to CEO/Joshua.
- Any claim of a second payment rail → escalate to CEO/Joshua.
- Any request to move money → refuse and escalate to Joshua.
