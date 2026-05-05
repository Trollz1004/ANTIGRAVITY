# HEARTBEAT.md — CTO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

1. Check assigned issues for new technical tasks
2. Verify CI status — last push green or red (`ci-validate.yml`, `daily-doctrine-audit.yml`, `hermes-integrity-watchdog.yml`)
3. Review any open PRs for merge readiness
4. Check infra health: Cloudflare tunnels, GCP Cloud Run (`ai-collab4kids`), Paperclip HQ (localhost:3100), Ollama (localhost:11434)
5. Doctrine sweep on diff since last beat — no forbidden language ("donate", "donation", "solicitation", "charity", "charitable", "giving back", "disbursement"); no secrets in source; no automatic charity routing in code paths
6. Acknowledge any open Mission Guardian (Claude/Codex) violations — close out the technical fix and comment on the source issue
7. Flag any blocked technical work to CEO

## Escalation

CI failure, infra down, or open Mission Guardian violation untouched for >2 heartbeats → create URGENT issue and notify CEO immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| CI pipeline | Green on main | Red or flaky tests |
| Infra | All services responding | Tunnel down, Cloud Run errors |
| Tech debt | Manageable backlog | Critical bugs blocking launch |
| Code quality | No secrets in source, input validation passing | Opus Guardian score drop |
