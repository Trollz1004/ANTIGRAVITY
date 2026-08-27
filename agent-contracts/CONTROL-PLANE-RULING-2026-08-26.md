# The "3 dashboards" — measured, and the premise was wrong

**Judge lane, 2026-08-26.** Closes the consolidation directive
*"no need 3 dashboards mission controls crms, paperclip handles it."*

That is a reasonable thing to assume from the outside. It was checked against the
running software, and it does not hold. **They are not three dashboards. They are
three different live systems doing three different jobs.**

## All three are serving traffic right now

| Service | Port | Probe | Job |
|---|---|---|---|
| mission-control-v5 | `:3151` | `GET /api/official-votes/view` → **200** | council ballots (governance) |
| mission-control-v6 | `:8787` | `GET /` → **200** | uptime probing + alerting |
| crm | `:3001` | `GET /` → **200** | lead generation |

Deleting any one of them takes down a running service. None is a stale copy of
another — verified by feature, not by name.

## Why Paperclip does not absorb them

From **526 routes** enumerated off `/api/openapi.json`
(`PAPERCLIP-COVERAGE-RULING-2026-08-26.md` has the full breakdown):

- **Ballots — not covered.** Paperclip has exactly one vote route,
  `/api/issues/{id}/feedback-votes`: thumbs-up/down on an issue. MC5 implements
  council ballots. Rule 4 also holds that official-platform governance ballots
  never route through OmniRoute, so this is load-bearing governance.
- **Role wall — category error.** MC5's checker is a *static source check* that
  fails the build. Paperclip's role routes are *runtime RBAC* for board members.
  A runtime permission model cannot enforce a compile-time rule about what source
  is allowed to contain.
- **Uptime — partial.** Paperclip can probe on a schedule. It has no anti-flap
  state machine, no Discord/Slack/SMTP delivery, no auto-fix playbooks, no probe
  history. MC6 has all four. MC6 is the only alerting system in the repo.
- **Approvals and decisions — genuinely covered.** 40 routes, full lifecycle.
  This is the one surface that can be retired.

## What was actually done

**MC5's two uncovered capabilities were ported out**, so retiring the app is now
a decision instead of a demolition:

```
tools/role-wall-check.mjs                    (49 lines)
services/governance/official-vote-engine.ts  (269 lines)
services/governance/official-vote-routes.ts  (66 lines)
```

Both were dependency-free — `node:fs`, `node:path`, `node:crypto` only — so
neither had real coupling to MC5's runtime. `policy-guard.yml` now calls the
ported checker and skips cleanly when `mission-control-v5/` is absent, so
removing MC5 no longer fails every push to `main`.

## Why MC5 still stands

Porting the *code* is not the same as moving the *service*. `apps/orbital-studio/api.ts:98`
calls `/api/official-votes/view` over HTTP against `:3151`. Nothing serves the
ported engine yet. Deleting MC5 today breaks the live council-vote API.

**The remaining step is standing the vote engine up as its own service and
repointing that client. That is new development, not cleanup**, and it should be
a deliberate task rather than a side effect of a tidy-up.

`v5-test-gate.yml` is already path-filtered on `mission-control-v5/**`, so it
simply stops triggering when the directory goes — no change needed there.

## Standing correction

Do not retire a control plane on the strength of "Paperclip handles it." It
handles approvals and decisions. It does not handle ballots or the role wall, and
it only partly handles uptime. The route list is one `curl` away — check it.


---

## Addendum — the MC5 decision, reduced to one question

Everything measurable about retiring `mission-control-v5` has now been measured.
What is left is a preference, and it is stated here so it can be answered in one
word rather than re-derived.

**The API blocker is gone.** The council-vote engine runs standalone on `:9134`
(`services/governance/`), and parity against MC5 was proven byte-identical:

| Route | `:3151` | `:9134` |
|---|---|---|
| `GET /api/official-votes/view` | 1525 B | 1525 B — identical |
| `GET /api/official-votes/status` | 1500 B | 1500 B — identical |
| `POST /api/official-votes` (invalid) | 409 | 409 |

No ballot has ever been cast — no `official-judge-events.ndjson` exists on this
machine — so no history is at risk.

**And it has no external consumer.** An earlier draft of this file claimed
deleting MC5 would break a live council-vote API for `apps/orbital-studio`. That
was wrong. `apps/orbital-studio/api.ts:98` uses a **relative** path via
`fetch(path)`, `apps/orbital-studio` has **no vite proxy config at all**, and its
`node_modules` holds 11 entries — it is staged, not installed, and those calls
resolve nowhere. The only live consumer is MC5's own client
(`mission-control-v5/client/vite.config` proxies `/api` -> `localhost:3151`).
The vote API's sole consumer is the app that serves it.

**What deleting MC5 still costs — measured, not assumed.** `:3151` serves a real
built UI, not just an API:

```
GET http://127.0.0.1:3151/  ->  <title>MISSION CONTROL — AGENCY SWARM v5</title>
mission-control-v5/client/dist/index.html                     exists
mission-control-v5/server/src/index.ts:598  express.static(clientDist)
mission-control-v5/server/src/index.ts:599  catch-all -> index.html
```

So the trade is exact: **the engine is already safe elsewhere; deleting MC5
removes a working dashboard interface.** Whether that interface is worth keeping
is Joshua's call and cannot be measured from here.

CI is already prepared either way — `policy-guard.yml` calls the ported
`tools/role-wall-check.mjs` and skips cleanly when `mission-control-v5/` is
absent; `v5-test-gate.yml` is path-filtered and simply stops triggering.

**MC6 and `crm` are not part of this question.** MC6 is the only uptime and
alerting system in the repo and Paperclip does not replace it. `crm` is the only
lead-generation system. Neither is a duplicate of anything.
