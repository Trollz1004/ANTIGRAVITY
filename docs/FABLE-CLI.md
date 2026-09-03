# fable — one npm script for the House

```
npm run fable -- <subcommand> [args]
```

Zero-dependency Node 24 ESM CLI at `scripts/fable/fable.mjs`. Root
`package.json` gained exactly one new script:

```json
"fable": "node scripts/fable/fable.mjs"
```

No other root scripts were touched or removed — see the redundancy notes below.

## Subcommands

| Subcommand | What it does |
|---|---|
| `fable house` | Runs `scripts/fables-house/FABLES-HOUSE.ps1 -Once`, streaming output. `--watch` is refused on purpose — a silent watchdog already runs the script's `-Watchdog` loop from the Windows Startup folder; a second one would double-heal every stage. |
| `fable audit` | Reads `apps/fables-sentry/targets.json` and probes every target exactly the way Fable's Sentry does (port / http+identity / redis PING — a port answering is never reported UP by itself). Also fetches Sentry's own live `http://127.0.0.1:9140/api/status` and diffs against it. Verdicts: `UP · DOWN · WRONG SERVICE · AUTH MISSING · AUTH REJECTED · NOT CONFIGURED`. |
| `fable omni <action>` | Thin client for OmniRoute at `${OPENAI_COMPAT_BASE_URL:-http://192.168.0.8:20128/v1}`, `Authorization: Bearer $OMNI_ROUTE_API_KEY` (falls back to parsing `.env` at runtime — the value is never logged). `NO_PROXY=127.0.0.1,localhost` is set in-process. Actions: `models`, `chat` (VERIFIED routes/schema), `image`, `transcribe`, `video`, `embed`, `moderations`, `batches` (UNVERIFIED route/schema — see caveats below). |
| `fable workflow <name>` | Runs a JSON pipeline from `scripts/fable/workflows/*.json`: a list of `{ "omni": "<action>", "args": {...}, "saveAs": "<var>" }` steps, with `${var}` / `${var.field.path}` interpolation from earlier steps. Ships four: `chat.json`, `image-edit.json`, `transcript.json`, `video.json`. |
| `fable mcp` | Lists MCP servers from `.mcp.json` and `%USERPROFILE%\.claude.json` (name, transport, whether a stdio script path exists), then checks the Paperclip broker's own OpenAPI spec (`http://127.0.0.1:3100/api/openapi.json`, requires `info.title == "Paperclip API"`) for MCP-related routes and calls the first parameter-free GET one it finds. Never guesses a token — reports AUTH MISSING instead. |
| `fable ledger [text]` | Wraps `ops/buzz/ledger.sh` (Git Bash), falling back to `ops/buzz/ledger.ps1` if `bash` isn't found. `fable ledger --tail [N]` wraps `ops/buzz/ledger-tail.sh` (default 30). |
| `fable dns` | `nslookup -type=NS <domain> 8.8.8.8` for the 14 project domains, classified as `CLOUDFLARE` / `IONOS` (`ui-dns`) / `EMPTY` (no NS = delegated nowhere) / `OTHER`. `docs/ops/DNS-NAMESERVER-PLAN.md` holds the per-domain plan; the 14-domain list is also hardcoded so `fable dns` works without it. |

Every subcommand answers `--help`. Exit codes: `0` ok · `1` bad input · `2` target down · `3` auth.

### OmniRoute route verification status

Per `docs/omniroute-workflow-api/openapi.yaml` and `README.md`:
- **VERIFIED**: `/models` (GET), `/chat/completions` (POST, SSE via `--stream`).
- **UNVERIFIED** (route dirs exist in the compiled bundle, body schema not confirmed): `/images/edits`, `/audio/transcriptions`, `/videos`, `/embeddings`, `/moderations`, `/batches`. `fable omni --help` marks each of these explicitly.
- Known-good combo models: `auto/best-coding`, `auto/best-reasoning`, `auto/best-fast`. `auto/fastest` does not exist (400).

### A Windows Node gotcha this CLI works around

Calling `process.exit()` immediately after a `net.Socket.destroy()` (as used by
the port/identity probes) can crash Node with
`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` on Windows. `fable.mjs`
never calls `process.exit()` — every code path sets `process.exitCode` and lets
the event loop drain, with an internal `ExitSignal` used for early-return
control flow instead.

## npm-script audit

16 tracked `package.json` files (`git ls-files '*package.json' | grep -v
node_modules`), **74 scripts total** by direct count (one file,
`ops/paperclip-ceo/adapter-freebuff/package.json`, has an empty `scripts`
object). LIVE means traced to an actual caller — `scripts/fables-house/FABLES-HOUSE.ps1`
(including the `.cmd`/`.ps1` tab scripts it launches), a `.github/workflows/*.yml`
CI job, or another package's script — not just "looks important." No
`drift.cmd` file exists anywhere in the repo.

| File | Script | Command | Verdict | Reason |
|---|---|---|---|---|
| package.json | dev:web | `pnpm --filter ai-studio-applet dev` | DEAD | No package named `ai-studio-applet` exists anywhere in the repo. |
| package.json | dev:dashboard | `pnpm --filter antigravity-mission-control dev` | DEAD | That package name only exists under `archive/absorbed-repos-2026-08-26/`, outside the pnpm workspace glob (`apps/*`, `services/*`, `tools/*`) and explicitly historical per CLAUDE.md. |
| package.json | dev:mission-control | `pnpm --filter mission-control dev` | DEAD | No package is named exactly `mission-control` (closest: `mission-control-agency-swarm-v5`, `mission-control-server/client`), and `mission-control-v5/` isn't under the workspace glob anyway. |
| package.json | dev:cockpit | `pnpm --filter @antigravity/cockpit dev` | DEAD | No such package exists anywhere in the tree. |
| package.json | dev:openclaw | `pnpm --filter opuspawclaw dev` | DEAD | `ClawX/package.json` is actually named `aicollab-forthekids-admin`. |
| package.json | build | `pnpm -r build` | LIVE | Runs, but `pnpm-workspace.yaml` only globs `apps/*`, `services/*`, `tools/*` — in practice this only reaches `apps/orbital-studio`, `services/governance`, `services/mission-mcp`; the other 12 tracked package.json files sit outside the workspace entirely. |
| package.json | typecheck | `pnpm -r typecheck` | LIVE | Same workspace-scope caveat as `build`. |
| package.json | test | `pnpm -r test` | LIVE | Same workspace-scope caveat as `build`. |
| package.json | format | `prettier --write .` | LEAF | Repo-wide formatter, self-contained. |
| package.json | fable | `node scripts/fable/fable.mjs` | LIVE | New — this deliverable. |
| ClawX/package.json | dev | `vite` | LEAF | Standalone dev server. |
| ClawX/package.json | build | `tsc --project tsconfig.client.json && vite build` | LEAF | Standalone package build. |
| ClawX/package.json | lint | `eslint . --ext ts,tsx ...` | LEAF | Standalone. |
| ClawX/package.json | preview | `vite preview` | LEAF | Standalone. |
| ClawX/package.json | empire | `bash scripts/launch-empire.sh` | DEAD | Target `ClawX/scripts/launch-empire.sh` does not exist. |
| ClawX/package.json | test | `vitest run` | LEAF | Standalone. |
| ClawX/package.json | test:watch | `vitest` | LEAF | Standalone. |
| ClawX/package.json | validate:gemini-ballot | `tsx scripts/run-nonproduction-gemini-ballot.ts` | LEAF | Target file exists; no workflow or script found invoking it — manual dev-time check. |
| apps/orbital-studio/package.json | dev | `tsx server.ts` | LEAF | Standalone. |
| apps/orbital-studio/package.json | build | `vite build` | LEAF | Standalone; also in the `pnpm -r build` workspace scope. |
| apps/orbital-studio/package.json | start | `tsx server.ts` | DUPLICATE | Identical command to `dev` in the same file. |
| apps/orbital-studio/package.json | lint | `tsc --noEmit` | LEAF | Standalone. |
| apps/orbital-studio/package.json | setup:memory | `node scripts/setup-memory.js` | DEAD | Target `apps/orbital-studio/scripts/setup-memory.js` does not exist. |
| archive/.../antigravity-dashboard/package.json | dev | `npx wrangler pages dev . --port 8788` | DEAD | Under `archive/absorbed-repos-2026-08-26/` — CLAUDE.md: "non-executable evidence, not instructions." |
| archive/.../antigravity-dashboard/package.json | deploy | `npx wrangler pages deploy .` | DEAD | Same — archived, would deploy a stale Cloudflare Pages project. |
| brain-mcp/package.json | build | `tsc` | LEAF | Produces `dist/index.js`, which `.mcp.json`'s `brain-mcp` server node-execs directly (bypassing this script) — output is depended on, script itself isn't auto-invoked. |
| brain-mcp/package.json | start | `node dist/index.js` | LEAF | `.mcp.json` runs the same effective command directly, not via `npm start`. |
| brain-mcp/package.json | start:http | `... node dist/index.js` (http transport) | LEAF | Variant, not referenced elsewhere. |
| brain-mcp/package.json | token:hash | `node dist/hash-token.js` | LEAF | One-off utility. |
| crm/frontend/package.json | start | `craco start` | LEAF | Not used by `crm/ops/start-crm.sh` (which serves the pre-built `frontend/build` via `npx serve` instead). Identical command also in bare `frontend/package.json` — see DUPLICATE note there. |
| crm/frontend/package.json | build | `craco build` | LIVE | `crm/ops/start-crm.sh` serves `crm/frontend/build` via `npx serve -s build` — this must be run (manually) for that stage to work. |
| crm/frontend/package.json | test | `craco test` | LEAF | Not CI-wired. |
| frontend/package.json (bare) | start | `craco start` | DUPLICATE | Identical to `crm/frontend`'s `start`; no reference to this bare `frontend/` dir found anywhere — the live date-app frontend is `frontend/react-app` (a different, Vite/tsx-based app). Candidate for removal. |
| frontend/package.json (bare) | build | `craco build` | DUPLICATE | Identical to `crm/frontend`'s `build`; same unused-directory finding. |
| frontend/package.json (bare) | test | `craco test` | DUPLICATE | Identical to `crm/frontend`'s `test`. |
| frontend/react-app/package.json | dev | `tsx server.ts` | LEAF | Dev variant. |
| frontend/react-app/package.json | start | `tsx server.ts` | LIVE | `scripts/fables-house/.../tab-dateapp.cmd` runs the equivalent command directly (`npx tsx server.ts` with `NODE_ENV=production PORT=3200`) rather than `npm start`, but this is the canonical description of the live date-app process. |
| frontend/react-app/package.json | build | `vite build` | LIVE | `tab-dateapp.cmd` runs `npm run build` when `dist/index.html` is missing; `.github/workflows/ci-validate.yml` also runs `npm run build` here. |
| frontend/react-app/package.json | preview | `vite preview` | LEAF | Standalone. |
| frontend/react-app/package.json | clean | `rm -rf dist` | LEAF | Standalone. |
| frontend/react-app/package.json | lint | `tsc --noEmit` | LEAF | Standalone. |
| mission-control-v5/package.json | install:all | `npm --prefix server/client install` | LEAF | Convenience script, not auto-invoked. |
| mission-control-v5/package.json | dev | `concurrently ... server+client dev` | LEAF | Not invoked by the house (it starts server/client via separate `.cmd` tabs, not this script). |
| mission-control-v5/package.json | dev:server | `npm --prefix server run dev` | LEAF | Not directly invoked elsewhere. |
| mission-control-v5/package.json | dev:client | `npm --prefix client run dev` | LEAF | Not directly invoked elsewhere. |
| mission-control-v5/package.json | build | `npm --prefix client run build` | LEAF | Not directly invoked by anything found. |
| mission-control-v5/package.json | start | `npm --prefix server run start` | LIVE | `scripts/fables-house/.../tab-mission-control.cmd` runs `npm start` from this directory, which is `FABLES-HOUSE.ps1`'s Mission Control v5 stage. |
| mission-control-v5/package.json | typecheck | `... server+client typecheck` | LEAF | Not directly invoked (CI's `gate` duplicates the calls inline rather than calling this script). |
| mission-control-v5/package.json | gate | `typecheck && test (server+client) && role-wall` | LIVE | `.github/workflows/v5-test-gate.yml` runs `npm --prefix mission-control-v5 run gate` directly. |
| mission-control-v5/package.json | test:e2e | `require-runtime-gate.mjs && client test:e2e` | LEAF | No external caller found. |
| mission-control-v5/package.json | electron | `electron .` | LEAF | Standalone desktop launcher. |
| mission-control-v5/package.json | electron:dev | `concurrently ... + electron .` | LEAF | Standalone. |
| mission-control-v5/client/package.json | dev | `vite` | LEAF | Standalone. |
| mission-control-v5/client/package.json | build | `tsc --noEmit && vite build` | LIVE | Called by `mission-control-v5`'s own `build` script (itself LEAF/uncalled), and exercised via `gate`'s typecheck step. |
| mission-control-v5/client/package.json | typecheck | `tsc --noEmit` | LIVE | Called by `gate`, which CI runs directly. |
| mission-control-v5/client/package.json | test | `vitest run` | LIVE | Called by `gate`. |
| mission-control-v5/client/package.json | test:e2e | `playwright test ...` | LEAF | Only called by the root's own uncalled `test:e2e`. |
| mission-control-v5/client/package.json | preview | `vite preview` | LEAF | Standalone. |
| mission-control-v5/server/package.json | dev | `tsx watch src/index.ts` | LEAF | Standalone dev loop. |
| mission-control-v5/server/package.json | start | `tsx src/index.ts` | LIVE | End of the FABLES-HOUSE → `tab-mission-control.cmd` → root `start` → this script chain. |
| mission-control-v5/server/package.json | typecheck | `tsc --noEmit` | LIVE | Called by `gate` (CI). |
| mission-control-v5/server/package.json | test | `vitest run` | LIVE | Called by `gate` (CI). |
| mission-control-v5/server/package.json | role-wall | `node scripts/role-wall-check.mjs ..` | LIVE | Called by `gate` (CI), last step. |
| ops/dateapp-marketing-engine/package.json | test | `node --test engine.test.js` | LEAF | Not wired into any CI workflow found — standalone/orphaned. |
| ops/paperclip-ceo/adapter-freebuff/package.json | *(none)* | — | — | Empty `scripts` object; nothing to classify. |
| ops/paperclip-growth-engine/package.json | test | `node --test engine.test.js` | LEAF | Same pattern as the marketing-engine test — not CI-wired. |
| services/governance/package.json | build | `tsc` | LEAF | Referenced only inside a `FABLES-HOUSE.ps1` warning *string* ("run: ... npm run build"), never actually executed by the script — a documented manual fallback, not automation. |
| services/governance/package.json | start | `node dist/server.js` | LEAF | The house's actual Heal action runs `node dist/server.js` directly, bypassing `npm start`. |
| services/governance/package.json | dev | `tsc --watch` | LEAF | Standalone. |
| services/mission-mcp/package.json | build | `tsup` | LEAF | Produces `dist/server.js`, which `.mcp.json`'s `mission-mcp` server node-execs directly — output depended on, script not auto-invoked. |
| services/mission-mcp/package.json | dev | `tsup --watch` | LEAF | Standalone. |
| services/mission-mcp/package.json | task-pool:cron | `node dist/task-pool-cron.js` | LEAF | Standalone cron entrypoint; no scheduler/workflow wiring found. |
| services/mission-mcp/package.json | start | `node dist/server.js` | LEAF | `.mcp.json` runs the same command directly, not via `npm start`. |
| services/mission-mcp/package.json | start:http | `... node dist/server.js` (http) | LEAF | Variant, not referenced. |
| services/mission-mcp/package.json | test | `echo "Test suite disabled"` | LEAF | Placeholder only — runs no real tests. Flag for either a real suite or removing the placeholder. |
| services/mission-mcp/package.json | typecheck | `tsc --noEmit` | LEAF | Standalone. |

### Verdict counts

**LIVE: 16 · DEAD: 9 · DUPLICATE: 4 · LEAF: 44** (74 scripts total; one file
has zero scripts). FCC search: `grep -rn "FCC" **/package.json` returned
**zero matches** — no banned-name script exists to remove. No `T5500`,
`node 9020`, or `Ornith` references found in any script command either.

### Root scripts `fable` makes redundant

None of the original 9 root scripts overlap with what `fable` does — `dev:*`
are (dead) pnpm workspace filters, `build`/`typecheck`/`test` are monorepo-wide
pnpm recursion, `format` is a repo-wide formatter. None of them touch house
bring-up, service health, OmniRoute, MCP inventory, the ledger, or DNS — the
ground `fable` covers didn't exist as a script anywhere in the 74. So `fable`
replaces zero existing root scripts today; it's additive, and it's the place
any *future* capability like these should go instead of becoming script #75.
The real cleanup opportunity surfaced by this audit is separate from `fable`
entirely: 5 root `dev:*` scripts are DEAD (point at pnpm package names that
don't exist), and the bare `frontend/package.json` (3 scripts) is a DUPLICATE
of `crm/frontend/package.json` with no references anywhere — both are
candidates for deletion regardless of `fable`.

## Smoke tests (2026-09-03, from `C:\ANTIGRAVITY`)

All commands below were run for real against the live house stack. No `.env`
value was ever printed, logged, or placed on a command line — `OMNI_ROUTE_API_KEY`
was read internally and used only inside an HTTP header.

**VERIFIED** — `npm run fable -- --help` and `node scripts/fable/fable.mjs --help`:
both print the identical subcommand list and exit-code legend; `npm run fable --`
wiring confirmed working end to end.

**VERIFIED** — `fable dns`: live `nslookup -type=NS ... 8.8.8.8` for all 14
domains. Result: `aidoesitall.website` and `ai-solutions.store` → CLOUDFLARE;
`dream-online.{info,net,org,store}`, `onlinerecycle.net`, `untilnokidinneed.com`
→ IONOS (`ui-dns`); `aidoesitall.{info,online,store}` and
`untilnokidinneed.{online,org,store}` → EMPTY (no NS answer at all). Exit 2
(target down — EMPTY domains count as down), as designed.

**VERIFIED** — `fable audit --no-sentry`: live-probed all 22 targets in
`apps/fables-sentry/targets.json` using the exact port/http-identity/redis-PING
logic from `apps/fables-sentry/server.mjs`. Result: 20/22 UP with real
`identity`-checked HTTP 200s and a real Redis `PONG`; `crmui` (port 3001) and
`crmapi` (port 8001) correctly DOWN — consistent with `targets.json`'s own
note that the local CRM's MongoDB is hardware-blocked on this CPU. Exit 2.

**VERIFIED** — `fable mcp`: listed 5 servers from `.mcp.json` and 6 from
`~/.claude.json` with name/transport/script-present-on-disk for each; then
reached the Paperclip broker, confirmed `info.title == "Paperclip API"`,
found 3 MCP-related routes in its live OpenAPI spec, and correctly reported
"no parameter-free GET list route found" rather than guessing one. Exit 0.

**VERIFIED, with a genuine finding** — `fable omni models`: timed out after
15s against a live gateway (port 20128 is open per `fable audit`). Confirmed
independently with a bare `curl` to the same URL (no auth header at all),
which also hung past 20s — this is a real target-side condition, not a CLI
bug: the OmniRoute gateway's TCP port is UP but its HTTP/API layer did not
answer. Exit 2, `OMNI_ROUTE_API_KEY` was read from `.env` and used but never
printed anywhere in the output.

**Bug found and fixed during this smoke-testing** — a genuine Node-on-Windows
crash: calling `process.exit()` any time after a `fetch()` call in the same
process could abort with `Assertion failed: !(handle->flags &
UV_HANDLE_CLOSING), file src\win\async.c` (reproduced in isolation with a
6-line script; confirmed the fix by removing the crash). Every exit path in
`fable.mjs` now sets `process.exitCode` and unwinds via an internal
`ExitSignal` exception instead of calling `process.exit()` directly —
`fable mcp` (two sequential `fetch()` calls) now exits 0 cleanly where it
previously crashed with exit 127.
