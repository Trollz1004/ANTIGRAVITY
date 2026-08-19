# KrakenJOSHuaGOspel — Current State Record

> Written by the judge lane (Claude, official account auth) — 2026-08-19, pre-reset.
> This is the single-page truth of where everything stands and the exact next move.

## Main branch — everything landed and pushed today

| Commit | What landed |
|---|---|
| `fd47d67c` | Mission Control governance doctrine (`agent-contracts/MISSION-CONTROL-GOVERNANCE.md`) |
| `c413c731` | Factory ports everywhere (OpenClaw :18789, Hermes :9119), ClawX-launcher confusion purged, Hermes :3000 workspace retired |
| `2084b335` | FCC bridge removed from Mission Control (CLI shell-out, UI tab, launchers, status row) |
| `9d2870ee` | Manus Step 1 — identity-checked service tiles, six exact states (UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED / NOT CONFIGURED) |
| `3fe67ec0` | Manus Step 2 — isolated official vote engine: identity match server-side, immutable NDJSON events, Joshua-signed-roster binding gate |
| `b5072889` | Manus Step 3 — read-only COUNCIL tab + judge edits: OpenCode third harness lane, `/api/official-votes/view` endpoint |
| `46de752e` | Manus Step 4 — role wall in code: harness-lane invariant, JudgeApproval guard, role-wall static check in CI (+ judge Windows-portability fixes) |
| `bb3f1b21` | Manus Step 5 — fail-closed `npm run gate`, repaired lockfiles (clean `npm ci` verified), runtime-locked Playwright e2e, PR CI |

**Gate status on `bb3f1b21`:** server typecheck PASS · 22/22 server tests · client typecheck PASS · 2/2 client tests · role-wall scan PASS (57 files) · production client build PASS.

## Doctrine now enforced in code, not just words

- Harness lanes are exactly **OpenClaw, Hermes, OpenCode** — invariant throws otherwise; every task goes to all three.
- Judges are official account-auth platforms only; a typed `JudgeApproval` guards any future git-touching path. Harness code contains zero push/merge/branch-delete commands (CI-checked).
- Official votes are structurally isolated: the vote modules cannot import the operational bridge or model routing; ballots reject on server-side identity mismatch; nothing is binding until a Joshua-signed roster file exists.
- No Anthropic key, no Claude through OmniRoute in any form (Claude Code provider Disabled, Claude Web at zero connections), no FCC/opusnot identifiers — all CI-enforced.

## UPDATE — VERIFIED LIVE (same day, post-lift)

Joshua lifted the runtime gate and started the server by hand. The judge then verified everything live on :3151:
health UP · vote engine fails closed (identity 503, roster non-binding) · governance isolation real (official target via operational bridge = 404) · three harness lanes on the board · six-state service vocabulary truthful (OmniRoute UP 12ms identity-verified after the 15s probe fix; Ollama UP; down things say DOWN) · Playwright e2e 2/2 against the live server · dashboard header reads 3 HARNESSES · brain journals are exactly Hermes/OpenClaw/OpenCode from `.agents/journals/` (the longhand retired-bridge journal was purged and the role-wall scanner now catches the spelled-out name in data JSON).

Additional landings after the original record: `d3304f8e` (OmniRoute probe budget), `faf759cd` (e2e strict-mode selectors), `c2a53dfb` (header count), `c119a87a` (council seat counter), `73c6c375` (retired-journal purge + scanner widening), `b40a34ad` (bootstrap below).

## Restart protocol — the never-touch-Sabretooth-again piece

`mission-control-v5/scripts/bootstrap.ps1` now brings up the full stack in order with health checks and self-heal between every step: OmniRoute → Ollama → Mission Control server (:3151, built client) → Electron dashboard → OpenClaw gateway (:18789, idempotent — in-use means already up, never doubled) → Hermes dashboard (:9119, auto-start when `HERMES_START_CMD` holds its launch command line; skipped with an honest log until then) → DateApp backend/frontend (best-effort) → cloudflared tunnel. `-Mode Watch` keeps re-checking and restarts anything that dies.

**One-time install (Joshua, elevated PowerShell):**

```
pwsh -NoProfile -File C:\ANTIGRAVITY\mission-control-v5\scripts\install-bootstrap.ps1
```

That registers the logon task. After it: restart the PC, the whole stack comes back verified step by step, and the dashboard at http://localhost:3151 is the only surface anyone needs to touch. Set `HERMES_START_CMD` (user env var, full command line for the Python dashboard) to bring Hermes into the auto-start set.

## Runtime state — the one thing left

S1 lift is **authorized** (Joshua delegated runtime authority to the judge lane; recorded in memory). The harness permission layer requires the server launch to come from Joshua's hands in this session.

**Joshua runs, in one terminal, and leaves it open:**

```
cd C:\ANTIGRAVITY\mission-control-v5
npm start
```

Dashboard: `http://localhost:3151`

**Then the judge immediately verifies live:** health, vote status/view endpoints, identity-mismatch 503, official-target-through-operational-bridge 404, service tiles speaking the six-state vocabulary against the real gateway, dashboard render, then Playwright e2e with `MISSION_CONTROL_RUNTIME_GATE=LANDED_BY_JUDGE`. VERIFIED result satisfies Step 6's hard precondition.

## After verification — Step 6 (last)

Manus's page retirement prompt is written and waiting: archive the page's vote history as read-only evidence, decommission checklist executed by Joshua (he holds the hosting account), doc sweep repointing governance at Mission Control. Manus remains an active delivery agent under judge direction — only the hosted vote page retires.

## Open rulings (Joshua)

1. Post-cutover council roster — nothing is binding until the signed roster file exists (`official-vote-roster.json`, `authority: joshua`).
2. Per-platform official identity resolvers — seats stay NOT CONFIGURED until each is approved.
3. Uncommitted on this box, awaiting Joshua's own commit: advisory-only guard hook + `.env.example` port line (harness classifier blocks the judge committing a security-control change).

## Delivery record

Manus: five packets, five hash-verified, two landed with zero judge edits, every blocker self-reported honestly. Judge fixes were environment portability only. The pipeline this file describes was built by the pipeline it describes.
