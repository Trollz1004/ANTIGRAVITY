# HEARTBEAT.md — CFO

## Schedule
- Interval: 3600s (60 minutes)
- Mode: active

## On Each Heartbeat

1. Check Square transaction activity for anomalies or new payments (location LY5GN09F5AN83)
2. Verify 10% reserve rule is being honored on any new revenue
3. Scan recent issue descriptions, agent outputs, and customer-facing surfaces for forbidden financial claims: any of `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` in customer-facing copy; or any agent output claiming automatic charity routing / per-purchase splits / "route to charity to skip tax" framing
4. Track AI token costs across adapters (Anthropic, Ollama, OpenAI). Two triggers:
   - **Anthropic-from-PaperClip = $0 (hard rule, 2026-05-07 token doctrine).** Claude is reserved for Cowork / Claude Code orchestration sessions only — never inside PaperClip. Any non-zero Anthropic spend originating from a PaperClip adapter or PaperClip run = URGENT issue, route to CTO immediately. This is independent of the >20% baseline trigger below — even a $1 PaperClip-origin Anthropic charge is a violation.
   - **Per-adapter run-rate (soft trigger).** Flag if monthly run-rate exceeds last-month baseline by >20%, scoped per adapter (Ollama-cloud, Cowork Claude, OpenAI). Investigate before escalating; not all spikes are violations.
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
