# HEARTBEAT.md — CFO

## Schedule
- Interval: 3600s (60 minutes)
- Mode: active

## On Each Heartbeat

1. Check Square transaction activity for anomalies or new payments
2. Verify 10% reserve rule is being honored on any new revenue
3. Scan recent issue descriptions and agent outputs for forbidden financial claims
4. Track AI token costs across adapters — Ollama Pro is the primary cost now, not API calls
5. Report financial status to CEO if anything changed since last beat
6. **Workload check** — scan each agent's active task count:
   - If any agent has 5+ open tasks → flag to CEO for INTERN assignment
   - If CFO detects financial tasks backing up → request INTERN for data entry/reconciliation
   - INTERNs handle repetitive financial checks (like scanning for forbidden language across surfaces)
7. **Cost efficiency check** — verify agents are running on Ollama cloud models (free via Pro),
   not burning API credits on Claude/Codex for routine tasks

## Escalation

If 10% reserve rule is violated or charity routing language appears → create URGENT issue immediately.

## INTERN Coordination (with CEO)

| Condition | CFO Action |
|-----------|------------|
| Financial scanning tasks backing up | Request INTERN from CEO for surface-scan work |
| INTERN assigned to financial work | Verify INTERN never touches Square/wallet directly |
| Cost overrun detected (API calls) | Alert CEO — agents may be using Tier 0 for Tier 1 work |

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Reserve compliance | 10% set aside on all revenue | Any revenue without reserve allocation |
| Language compliance | No "donate/donation/solicitation" in any surface | Forbidden language detected |
| Token costs | Ollama Pro covering daily ops | API calls being used for routine work |
| Square status | Payments processing normally | Payment failures or anomalies |
| Agent workload | All agents <5 active tasks | Tasks backing up without INTERN support |
