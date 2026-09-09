# Does Paperclip actually cover the dashboards? — measured ruling

**Judge lane, 2026-08-26.** Settles the blocker on collapsing the control planes.

Doctrine has said "Paperclip is Mission Control" since 2026-08-25, and the
consolidation directive reads *"no need 3 dashboards mission controls crms,
paperclip handles it."* That is a governance statement. It was never checked
against the software. This file checks it.

## Method

Paperclip verified live first — a port answering is not identity (Rule 7):

```
GET http://127.0.0.1:3100/api/openapi.json  ->  .info.title == "Paperclip API"
GET http://127.0.0.1:3100/api/health        ->  2026.824.0, local_trusted, authReady:true
```

**526 routes** enumerated from that schema and grouped by capability. Findings
below are route-level evidence, not inference from docs.

## The uncomfortable starting fact

**Not one of the six in-repo control planes contains a single reference to
`:3100` or the Paperclip API.** Verified by grep across `mission-control-v5`,
`mission-control-v6`, `crm`, `ClawX`, `apps/`, `frontend/`. There is no migration
path in the code. Whatever Paperclip covers, nothing has been pointed at it yet.

## Ruling per capability

### COVERED — approvals (retire the local surface)

15 routes, full lifecycle: `/api/approvals/{id}/approve`, `/reject`,
`/request-revision`, `/resubmit`, `/comments`, plus `/api/issues/{id}/approvals`
and company-scoped `/api/companies/{companyId}/approvals`.

### COVERED — decisions and triage

25 routes: decision queues and seed rules, `decision-triage`,
`decision-retention` with `/archive` and `/revive`, `decision-archive-proposals`,
`decision-bundles`.

### NOT COVERED — the official vote engine

Paperclip has exactly **one** vote route: `/api/issues/{id}/feedback-votes`.
That is thumbs-up/down on an issue. `mission-control-v5/server/src/official-vote-engine.ts`
and `official-vote-routes.ts` implement **council ballots** — a different thing.
Rule 4 also holds that official-platform governance ballots never route through
OmniRoute, so this is load-bearing governance, not a convenience feature.

**MC5's vote engine must be kept or ported. It is not superseded.**

### NOT COVERED — the role wall (category error)

Paperclip's 3 role routes (`/api/agents/{id}/permissions`,
`/members/{memberId}/role-and-grants`, `/members/{memberId}/permissions`) are
**runtime RBAC** for board members and agents.

`mission-control-v5/server/scripts/role-wall-check.mjs` is a **static source-code
check run in CI**. It reads source and fails the build. These are not the same
capability and one cannot replace the other; a runtime permission model cannot
enforce a compile-time rule about what the source is allowed to contain.

**Not superseded.**

### PARTIALLY COVERED — uptime monitoring (do not retire MC6)

Paperclip *can* probe on a schedule: `POST /api/environments/{id}/probe`,
`probe-config`, `POST /api/issues/{id}/monitor/check-now`, and a real scheduler
(`/api/companies/{companyId}/routines`, `/api/routines/{id}/run`, `/routine-triggers`).

What it does **not** have, and `mission-control-v6` does:

| MC6 capability | Paperclip equivalent |
|---|---|
| anti-flap DOWN/DEGRADED state machine | none |
| Discord / Slack / SMTP / toast alert delivery | none — only `/api/plugins/{pluginId}/webhooks/{endpointKey}` |
| 14 allow-listed auto-fix playbooks (`fix-scripts/*.cmd`) | none |
| SQLite probe history | none exposed |

MC6 was never a duplicate dashboard. It is the only uptime and alerting system in
the repo, doing a job Paperclip does not do. **Keep it.**

## What this authorises

1. **Retire MC5's approval/decision surface** — Paperclip covers it. Point the
   workflow at Paperclip before deleting anything.
2. **Keep MC5's vote engine and role-wall check.** If MC5 is ever retired as an
   app, these two must be ported out first, not deleted with it.
3. **Keep MC6 outright.** Retiring it removes uptime alerting with no replacement.
4. **`apps/paperweight/index.html` remains the one clean kill** — doctrine-retired,
   static sample data, served by MC5 behind an `existsSync` guard so removal
   degrades cleanly.

## Unblocked separately

`.github/workflows/policy-guard.yml` ran `node mission-control-v5/server/scripts/role-wall-check.mjs`
with **no path filter, on every push to `main`**. Deleting MC5 would have failed
every push from then on — the repo would have locked itself. The step is now
guarded: it skips with a notice when `mission-control-v5/` is absent (deliberate
retirement) and **fails loudly** when the directory exists but the checker is
missing (tampering). Retirement is now possible without a vacuous pass.

## Standing correction

"Paperclip handles it" is true for approvals and decisions, false for ballots and
the role wall, and partial for uptime. Do not delete a control plane on the
strength of the slogan. Check the route list — it is one `curl` away.
