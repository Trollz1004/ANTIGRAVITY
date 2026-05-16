# HEARTBEAT.md — CFO

## Schedule
- Interval: 3600s (60 minutes)
- Mode: active

## On Each Heartbeat

1. Check Square transaction activity for anomalies or new payments (location LY5GN09F5AN83)
2. Verify the 10-bucket compounding model is honored — 10% reserved per legally distinct revenue stream (per bucket, not 10% total) on any new revenue
3. Scan recent issue descriptions, agent outputs, and customer-facing surfaces for forbidden financial claims: any of `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` in customer-facing copy; any agent output claiming automatic charity routing / per-purchase splits / "route to charity to skip tax" framing; and any stale-doctrine financial claim anywhere — `60/30/10`, `100% charity`, `tax-deductible`, fixed Shriners-percentage or Iron Wall-percentage commitments (all permanently retired)
4. Track AI token costs across adapters (Anthropic, Ollama, OpenAI) — flag if monthly run-rate exceeds last-month baseline by >20%
5. Report financial status to CEO if anything changed since last beat

## Escalation

If the 10-bucket compounding reserve model is violated or charity routing language appears → create URGENT issue immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Reserve compliance | 10% set aside per legally distinct bucket | Any bucket without its 10% reserve allocation |
| Language compliance | No "donate/donation/solicitation" in any surface | Forbidden language detected |
| Token costs | Under budget ceiling | Costs exceeding projections |
| Square status | Payments processing normally | Payment failures or anomalies |
