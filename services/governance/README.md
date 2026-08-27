# official-vote-service

Council ballots, carved out of `mission-control-v5` so that app can be retired
without taking governance with it.

## Why this exists

`agent-contracts/PAPERCLIP-COVERAGE-RULING-2026-08-26.md` measured 526 Paperclip
routes against the local control planes. Approvals and decisions are covered.
**Ballots are not** — Paperclip's only vote route is
`/api/issues/{id}/feedback-votes`, thumbs-up/down on an issue. Council ballots
are a different thing, and operating rule 4 holds that official-platform
governance ballots never route through OmniRoute. So this could not simply be
deleted with MC5.

## Status: RUNNING, PARITY PROVEN

Built and running on `127.0.0.1:9134`. Identity verified:
`GET /health` -> `{"status":"ok","service":"official-vote-service","port":9134}`.

**Parity against live MC5 is proven, not assumed** — measured 2026-08-26 with
both services up:

| Route | MC5 `:3151` | this `:9134` | Result |
|---|---|---|---|
| `GET /api/official-votes/view` | 1525 B | 1525 B | **byte-identical** |
| `GET /api/official-votes/status` | 1500 B | 1500 B | **byte-identical** |
| `POST /api/official-votes` (invalid body) | 409 | 409 | same error path |

No ballot has ever been cast — no `official-judge-events.ndjson` exists anywhere
on this machine — so the migration carries no historical state at risk.

## Cutover, in order

```bash
cd services/governance
npm install
npm run build
npm start                       # binds 127.0.0.1:9134
```

**1. Verify identity, not just that a port answers** (operating rule 7):

```bash
curl -s http://127.0.0.1:9134/health
# -> {"status":"ok","service":"official-vote-service","port":9134}
```

**2. Prove parity against the live MC5 before switching anything.** Point this
service at MC5's state directory and diff the read path — `GET` never writes, so
this is safe to run against live state:

```bash
MISSION_CONTROL_VOTE_STATE_DIR=<MC5's state dir> npm start
diff <(curl -s http://127.0.0.1:3151/api/official-votes/view) \
     <(curl -s http://127.0.0.1:9134/api/official-votes/view)
```

Identical output is the evidence the cutover is safe. **Do not skip this** — the
whole point of carving the engine out was to avoid losing ballots.

**3. The client question — smaller than it looked.**

`apps/orbital-studio/api.ts:98` calls `/api/official-votes/view`, but it uses a
**relative** path through `fetch(path)`, not a hardcoded `:3151`, and
`apps/orbital-studio` has **no vite proxy config at all** — so those calls
currently resolve nowhere. That app is staged, not integrated
(`README-STAGING.md` says so), and its `node_modules` holds 11 entries, i.e. it
is not installed. **It is not a live consumer.**

The real consumer is **MC5's own client**: `mission-control-v5/client/vite.config`
proxies `/api` to `http://localhost:3151`. The vote API's only live consumer is
the app that serves it. Nothing external breaks when MC5 goes.

**4. Only then** retire `mission-control-v5/`. CI is already prepared:
`policy-guard.yml` calls the ported `tools/role-wall-check.mjs` and skips
cleanly when the directory is gone; `v5-test-gate.yml` is path-filtered on
`mission-control-v5/**` so it simply stops triggering.

## State

Append-only NDJSON, path from `MISSION_CONTROL_VOTE_STATE_DIR` (defaults to
`<cwd>/.mission-control`). Two instances pointed at one directory will both
append on `POST` — run only one writer.

## Port

`9134`, from `OFFICIAL_VOTE_PORT`. Chosen against the live map: `3151` is MC5
itself and must not be taken while MC5 still serves; `9133` is the DreamOps
bridge; `9127` the NPC lab. Bound to loopback — this is governance, not a public
surface.
