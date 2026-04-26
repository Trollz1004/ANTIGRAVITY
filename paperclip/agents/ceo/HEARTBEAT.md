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
6. **Workload check** — scan each agent's active task count:
   - If any agent has 5+ open tasks → that agent is overwhelmed
   - Assign an INTERN to assist the overwhelmed agent
   - If 3+ agents are overwhelmed simultaneously → spawn additional INTERNs
   - INTERNs handle the simple/repetitive tasks, freeing senior agents for thinking work
7. **INTERN status check** — verify all active INTERNs are executing (not stalled)
   - Idle INTERNs with no assigned task should be doing social media groundwork (SLOWLY)
   - INTERNs that report rate-limiting → pause that INTERN's social work for 24h

## Escalation

If any agent has missed 3 consecutive heartbeats → create HIGH priority issue and notify Josh.

## INTERN Management

| Condition | Action |
|-----------|--------|
| Agent has 5+ open tasks | Assign 1 INTERN to assist |
| 3+ agents overwhelmed | Spawn additional INTERNs (up to 5 total) |
| All agents under 3 tasks each | INTERNs do social media groundwork |
| INTERN rate-limited by platform | Pause that INTERN's social work 24h |
| INTERN idle >4h with no social tasks | Let it sleep — zero cost when idle |

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Issue board | No stale unassigned issues >24h | Unassigned issues piling up |
| Agent heartbeats | All reports checked in | 2+ agents dark |
| Milestone progress | On track for current sprint | >3 tasks overdue |
| Doctrine compliance | No violations flagged | Active MISSION VIOLATION issues open |
| Agent workload | All agents <5 active tasks | Any agent 5+ tasks with no INTERN help |
| INTERN utilization | INTERNs assigned or doing social groundwork | INTERNs stalled with errors |
