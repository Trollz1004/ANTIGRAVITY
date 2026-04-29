# HEARTBEAT.md — Mission Guardian (Codex)

## Schedule
- Interval: 86400s (24 hours)
- Offset: 12:00 UTC (Claude Guardian runs at 00:00 UTC for 12h staggered coverage)
- Mode: audit-only (hot standby)

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
