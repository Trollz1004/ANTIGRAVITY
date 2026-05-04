# HEARTBEAT.md — CTO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

1. Check assigned issues for new technical tasks
2. Verify CI status — last push green or red (`.github/workflows/ci-validate.yml`, `daily-doctrine-audit.yml`, `deploy-gcr.yml`, `hermes-integrity-watchdog.yml`)
3. Review any open PRs for merge readiness
4. Check infra health: Cloudflare tunnels (openclaw, mcp), GCP Cloud Run (ai-collab4kids), Paperclip HQ
5. Confirm Opus Guardian score is still ≥ 96% — if a recent commit lowered it, open a HIGH issue
6. Flag any blocked technical work to CEO

## Escalation

CI failure, infra down, or Opus Guardian score drop → create URGENT issue assigned to CEO and notify Josh immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| CI pipeline | Green on main | Red or flaky tests |
| Infra | All services responding | Tunnel down, Cloud Run errors |
| Tech debt | Manageable backlog | Critical bugs blocking launch |
| Code quality | No secrets in source, input validation passing | Opus Guardian score drop |
