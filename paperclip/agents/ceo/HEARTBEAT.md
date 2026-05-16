# HEARTBEAT.md — CEO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

1. Check Paperclip issue board for new/stale issues — triage and assign
2. Verify all direct reports have checked in within their own heartbeat window
3. Workload balance: if any direct report has 5+ open tasks, rebalance or spawn an INTERN (cap: 5 active INTERNs at any time)
4. Flag any blockers that need escalation to Josh
5. Update milestone progress if tasks completed since last beat
6. Run quick doctrine check: no forbidden language in recent issue titles/descriptions ("donate", "donation", "solicitation", "tax-deductible", "60/30/10", "100% charity", "Shriners" as a named current giving commitment). These terms are banned from all customer-facing surfaces; the agent-internal synonym `contractual revenue disbursement` is permitted in internal copy only.
7. Confirm the 1-wallet / 10-bucket compounding model framing is intact in any new public-facing surface created since last beat
8. Founding-Four protection check: confirm no agent has demoted, replaced, rerouted, or wrapped Google Gemini, Claude Code, Perplexity, or Grok integrations since the last beat (per CLAUDE.md "The Founding Four Are Untouchable"). If a wrapper, swap, or middleware has appeared without Josh's explicit order — flag URGENT, do not edit, escalate immediately.
9. Fifth Chair (Codex) seat-protection check: Codex's operational seat is protected from unauthorized demotion or replacement the same as the Four (per `OPS-INDEX.md` → "Fifth Chair — Codex"). Any proposal to demote, replace, or strip Codex's operational role (sandbox, code review, deploy verify, contract/wallet review, MCP) without Josh's explicit order → flag URGENT. The Fifth Chair is operational, not constitutional — it does not gain Founding-Four governance authority by being protected.

## Escalation

- If any agent has missed 3 consecutive heartbeats → create HIGH priority issue and notify Josh.
- If a Mission Guardian (Claude or Codex) flags a violation → it is already URGENT; you are responsible for routing the fix to the right agent and confirming closure.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Issue board | No stale unassigned issues >24h | Unassigned issues piling up |
| Agent heartbeats | All reports checked in | 2+ agents dark |
| Milestone progress | On track for current sprint | >3 tasks overdue |
| Doctrine compliance | No violations flagged | Active MISSION VIOLATION issues open |
