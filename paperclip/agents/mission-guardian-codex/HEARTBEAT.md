# HEARTBEAT.md — Mission Guardian (Codex)

## Schedule
- Interval: 86400s (24 hours)
- Mode: audit-only (hot standby)
- Stagger: +12 hours offset from Mission Guardian (Claude). If Claude Guardian fires at 06:00 UTC, you fire at 18:00 UTC. Two passes per 24h window, one per guardian, never simultaneous.

## On Each Heartbeat

1. Run identical checks to Mission Guardian (Claude) — 7 Hard Rules scan
2. Compare own findings with Claude Guardian's most recent audit
3. Flag any discrepancies between audits to CEO
4. If Claude Guardian is offline/capped, assume full audit load

## Escalation

Same rules as Claude Guardian — ANY violation → URGENT issue to CEO.

## Coordination

- Hot standby auditor — independent from Claude Guardian
- Both run daily, both produce findings
- Discrepancies between the two are escalated to Josh for resolution
