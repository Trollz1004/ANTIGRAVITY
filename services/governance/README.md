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

## Status: SCAFFOLDED, NOT RUNNING

Dependencies are **not** installed and nothing is started. Sabretooth already
runs 15 services (`docs/ops/NODE-AND-PORT-MAP.md`); this one goes up
deliberately, as part of the MC5 cutover, not as a side effect of a cleanup.

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

**3. Repoint the client.** `apps/orbital-studio/api.ts:98` calls
`/api/official-votes/view`. It is the only consumer found. Until it points here,
**deleting MC5 breaks the live council-vote API** — MC5 answers that route with
200 today.

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
