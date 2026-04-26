# HEARTBEAT.md — CFO

## Schedule
- Interval: 3600s (60 minutes)
- Mode: active

## On Each Heartbeat

1. Check Square transaction activity for anomalies or new payments
2. Verify 10% reserve rule is being honored on any new revenue
3. Scan recent issue descriptions and agent outputs for forbidden financial claims
4. Track AI token costs across adapters (Anthropic, Ollama, OpenAI)
5. Report financial status to CEO if anything changed since last beat

## Escalation

If 10% reserve rule is violated or charity routing language appears → create URGENT issue immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Reserve compliance | 10% set aside on all revenue | Any revenue without reserve allocation |
| Language compliance | No "donate/donation/solicitation" in any surface | Forbidden language detected |
| Token costs | Under budget ceiling | Costs exceeding projections |
| Square status | Payments processing normally | Payment failures or anomalies |
