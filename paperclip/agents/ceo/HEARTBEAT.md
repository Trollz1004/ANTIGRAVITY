# HEARTBEAT.md — CEO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

1. Check Paperclip issue board for new/stale issues — triage and assign
2. Verify all direct reports have checked in within their own heartbeat window
3. Flag any blockers that need escalation to Josh
4. Update milestone progress if tasks completed since last beat
5. Run quick doctrine check: no forbidden language in recent issue titles/descriptions

## Escalation

If any agent has missed 3 consecutive heartbeats → create HIGH priority issue and notify Josh.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Issue board | No stale unassigned issues >24h | Unassigned issues piling up |
| Agent heartbeats | All reports checked in | 2+ agents dark |
| Milestone progress | On track for current sprint | >3 tasks overdue |
| Doctrine compliance | No violations flagged | Active MISSION VIOLATION issues open |
