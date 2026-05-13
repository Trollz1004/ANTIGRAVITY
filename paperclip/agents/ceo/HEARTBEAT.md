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
6. Doctrine language scan: no forbidden customer-facing terms in recent issue titles/descriptions or any surface created since last beat — full canonical 7-term list: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`. The internal synonym `contractual revenue disbursement` is allowed in agent-internal copy (Paperclip issues, briefings, agent files) only — flag URGENT if it appears in any customer-facing surface.
7. Confirm the 1-wallet / 10% reserve framing is intact in any new public-facing surface. Internally, the 10-bucket compounding model (`briefings/DAO-TOKENOMICS-FINAL.md`) is the canonical financial architecture; verify no agent has proposed a tokenomics-parameter change without Opus + Josh dual approval (Financial Protection Rule).
8. Founding-Four protection check: confirm no agent has demoted, replaced, rerouted, or wrapped Google Gemini, Claude Code, Perplexity, or Grok integrations since the last beat (per CLAUDE.md "The Founding Four Are Untouchable"). If a wrapper, swap, or middleware has appeared without Josh's explicit order — flag URGENT, do not edit, escalate immediately.

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
