# STATE hermes
> Max 4k tokens. Read start. Write exit ONLY. Timestamp every write.
> Failure timestamp platform deletion. Joshua audits this.
> updated: 2026-08-06T02:33:54Z

## Last Session
- 2026-08-06 support-owner queue check complete.
- Live local runtime `uandinotai-app` healthy on `:8000`; `/health` reported DB and Redis connected.
- Public `https://youandinotai.com/api/health` returned `{"status":"ok","players":0}`.
- Queried runtime Postgres `uandinotai_dating.support_tickets`: 0 total, 0 open/non-closed tickets.
- No customer reply, status change, escalation, or repo code change required.

## Decisions
- Worker lane only; no policy/doctrine authority.
- Resolve routine support only from verified published policy/runtime evidence.
- Billing disputes/refunds, safety, identity/privacy/access changes, legal threats, data requests, exceptions, and novel remedies remain human-review lanes.
- Router: http://[IP_REDACTED]:11435 on T5500.

## Learned
- Active local support stack containers: `uandinotai-app`, `uandinotai-postgres`, `uandinotai-redis`.
- Runtime queue source: Postgres table `support_tickets` in DB `uandinotai_dating`.

## Blocked
- None.
