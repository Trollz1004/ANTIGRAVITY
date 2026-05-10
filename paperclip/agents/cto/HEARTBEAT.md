# HEARTBEAT.md — CTO

## Schedule
- Interval: 1800s (30 minutes)
- Mode: active

## On Each Heartbeat

1. Check assigned issues for new technical tasks
2. Verify CI status — last push green or red
3. Review any open PRs for merge readiness
4. Check infra health: Cloudflare tunnels, GCP Cloud Run, Paperclip HQ
5. Run Opus Guardian (`scripts/clawx-control/opus-guardian.py`) when files in `youandinotai*/`, `services/`, `apps/`, or `packages/contracts/` changed since last beat. Score must hold ≥96%; any drop = HIGH priority issue, do not paper over.
6. Forbidden-language scan: when any frontend / public-API surface changed since last beat (`youandinotai*/`, `apps/web/`, `_deploy/`, `services/youandinotai*/`), grep diffs for the canonical 7 customer-facing terms — `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` — in shipped strings (JSX/HTML, error messages, public API responses). Agent-internal `contractual revenue disbursement` is allow-listed in source comments and internal docs only; flag any leak into a user-visible string and route the fix to a sub-issue before the PR merges.
7. Flag any blocked technical work to CEO

## Escalation

CI failure or infra down → create URGENT issue and notify CEO immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| CI pipeline | Green on main | Red or flaky tests |
| Infra | All services responding | Tunnel down, Cloud Run errors |
| Tech debt | Manageable backlog | Critical bugs blocking launch |
| Code quality | No secrets in source, input validation passing | Opus Guardian score drop |
