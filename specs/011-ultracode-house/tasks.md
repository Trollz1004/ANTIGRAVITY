# Tasks: 011 Ultracode House: the one map skill, the Board Room, and the universal MCP

**Input**: `spec.md` in this directory. There is no `plan.md`: the feature is
one pull request from `claude/ultracode-house-0929`, and the design lives in the
spec's requirements. `[X]` means this session's workers are on it or have it
done. `[ ]` means the judge lane owns it, or only the node can do it.

## Story 1 - The one map skill (P1)

- [X] T001 `.agents/skills/ultracode-house/SKILL.md`: frontmatter with `name`
      and an always-load `description`; ten sections in order (read first,
      nodes, dashboards, lanes, MCP, brains and memory, journals, rulings
      digest, token savers, Joshua's open clicks); caveman style; 220 lines or
      fewer; the repo file behind each fact named inline; the disk-wins rule
      stated.
- [ ] T002 `mission-control/tests/ultracode-house-skill.test.js`: the coverage
      test. It imports `NODES` and `SERVICES` (`lib/nodes.mjs`), `BRIDGE_IDS`
      (`lib/bridges.mjs`), `HARNESSES` (`lib/fleet.mjs`) and `MCP_TOOL_NAMES`
      (`lib/mcp-server.mjs`) and fails when the skill omits a node address, a
      service port, a bridge id, a harness, a tool name or a lane journal path.
      It also checks the 220-line cap, the ten sections in order, that every
      backticked path starting with a top-level folder of this repository
      exists, and the banned-word, em dash and loopback-name scans. Not on disk
      when this list was written; the judge lane writes it if the skill worker
      did not.
- [ ] T003 Update the skill's Board Room and MCP rows from "being added" and
      "UNVERIFIED until route exists" to what the branch actually contains, and
      its test-count line to the run in T061. Disk beats the skill.
- [ ] T004 Read the finished skill once as a fresh session would: name every
      node, dashboard port, lane, MCP endpoint and journal path from it alone.
      Any miss is a skill fix, not a note.

## Story 2 - The Board Room tab in Driftus (P2)

- [X] T010 `mission-control/lib/lanes.mjs`: the registry of nine lanes (claude,
      codex, hermes, opencode, openclaw, gemini, emergent, genspark, buzz) with
      role, how each connects, nodes, bridge id, fleet id and journal path;
      `joinLaneStatus` joins the live bridge and fleet rows and probes nothing.
- [X] T011 `mission-control/tests/lanes.test.js`: registry shape, the join
      order (bridge row, then fleet row, then NOT CONFIGURED with a reason),
      Emergent never UP, Gemini NOT CONFIGURED, no mutation of the inputs.
- [X] T012 `mission-control/lib/drift.mjs`: GitHub read for
      `Trollz1004/ANTIGRAVITY` and `Trollz1004/dream-online`; DEAD, LIVE, STALE
      and WORKING in that order; lane by branch prefix; per-lane badge counts;
      `skipped` and `truncated`; NOT CONFIGURED without `GITHUB_TOKEN`; DOWN per
      repository on an error; 5-minute cache that never holds an error;
      injected `fetch` and clock.
- [X] T013 `mission-control/tests/drift.test.js`: a fake GitHub with every
      state, the request URLs and headers, call counts for the cache, the
      no-token case (zero requests), a 403 making one repository DOWN while the
      other stays up, the orphan branch under `skipped`.
- [X] T014 `mission-control/server.mjs`: `GET /api/boardroom` (tracks, lanes,
      attestations, drift, affiliate, founderBoard, cloud address, timestamp),
      one `buildBoardRoom` shared
      with the MCP tool, the bridge and fleet builders reused rather than
      probed again, `GITHUB_TOKEN` read from `.env` server-side, response
      redacted. No other new route.
- [X] T015 `mission-control/tests/boardroom-routes.test.js`: the route's four
      blocks, the affiliate block (wing URL, brief path and flag, terms line),
      the founder-board note, the five tracks with their ON RECORD or NOT
      CONFIGURED status, the nine attestation rows (FILED or NOT FILED against
      a fake fs), and a token value that appears nowhere in the response.
- [X] T016 `mission-control/js/jarvis/boardroom.js` and the Board Room tab in
      `mission-control/index.html`: Think tank tracks, Lanes (with a trust
      column), Drift, Affiliate and Links cards; NOT CONFIGURED, DOWN and
      populated states; per-lane badge counts; the founder-board note naming
      the ClawX Board tab; no vote and no button that calls a mutating route.
- [X] T017 `mission-control/tests/boardroom-client.test.js`: the tab renders
      each state, draws no branch row for NOT CONFIGURED or DOWN, and wires no
      mutating call.
- [ ] T018 Start JARVIS from the branch in the cloud container on a
      non-loopback address, with a fake GitHub standing in for the real one.
      Take frames of: NOT CONFIGURED with no branch row; DOWN; a populated board
      with DEAD, STALE, LIVE and WORKING and a lane badge; the lanes and
      affiliate cards. Keep the PNGs under `evidence/health-shots/2026-09-29/`
      (gitignored). Open and read every one. A passing test is not a frame.
- [ ] T019 Fix whatever the frames show (clipped text, a state that reads wrong,
      a badge that misleads) and take that frame again.
- [ ] T020 Diff check: `GET /api/boardroom` is the only new route in
      `server.mjs`, and `boardroom.js` calls no route that changes state.
- [ ] T021 Reconcile the affiliate terms line with the approved brief: every
      figure in it appears in
      `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`, and it makes no
      earnings claim.

## Story 3 - The universal MCP (P3)

- [X] T030 `mission-control/lib/mcp-server.mjs`: register `boardroom`,
      `backup_health` and `house_map`; `MCP_TOOL_NAMES` grows to nine; a tool
      with no wired source answers with an error result saying so.
- [X] T031 `mission-control/tests/mcp-server.test.js`: `tools/list` returns the
      nine names; each new tool answers a real call in the SDK handshake; the
      not-wired case; 503 and 401 unchanged.
- [X] T032 `mission-control/server.mjs` wiring (`getBoardRoom`,
      `getBackupHealth`, `getHouseMap`) and
      `mission-control/tests/mcp-routes.test.js`: the tools read through the
      same functions as `/api/boardroom` and `/api/backup-health`; the skill
      file is read from disk at call time and a missing file says NOT
      CONFIGURED.
- [ ] T033 Re-run `npx vitest run tests/mcp-server.test.js
      tests/mcp-routes.test.js` on the branch and read the count. Confirm the
      three descriptions name their outputs and that no tool can change state.
- [ ] T034 Record the per-lane attach lines (Claude by
      `claude mcp add --transport http`, Hermes, OpenCode and OpenClaw over
      Streamable HTTP with the same bearer header) as UNVERIFIED in the
      runbook. No lane has made a recorded live call.

## Story 4 - Records (P4)

- [X] T040 `specs/011-ultracode-house/spec.md` and `tasks.md` (this pair).
- [X] T041 `ops/skills/SKILLS-HUB.md`: the `ultracode-house` row.
- [ ] T042 `mission-control/README.md`: the `GET /api/boardroom` route, the
      Board Room tab, the three new MCP tools and the env var names
      (`GITHUB_TOKEN`, `EMERGENT_WING_URL`, `JARVIS_MCP_TOKEN`), never values.
- [ ] T043 `ops/runbook/SABRETOOTH-NODE-RUNBOOK.md`: a new section 14 on the
      skill, the Board Room, the three tools and `GITHUB_TOKEN`, with what was
      verified from the cloud and what only the node can verify. Protected file:
      edited by the Claude judge lane only.
- [ ] T044 `ops/runbook/PROTECTED-CHANGELOG.md`: one timestamped line for T043
      in the file's format (date, time EDT, file, what changed, commit).
- [ ] T045 `.agents/journals/claude-judge/STATE.md`: the judge journal entry,
      with did, verified, skills, blocked, next and state lines.

## Verification and landing (judge lane)

- [ ] T060 `git ls-files` and `git status` on the branch: reconcile every path
      named in `spec.md` and in this list with what the workers actually
      wrote. Fix the list, or the code, where they differ.
- [ ] T061 `npx vitest run` in `mission-control/`: 0 new failures against the
      baseline on `main` when the branch was cut; at least 30 new tests;
      record both counts in the pull request.
- [ ] T062 Scans on the added lines of `git diff origin/main...HEAD`: the
      business-only word list (the pattern in `.githooks/pre-commit-canonical`),
      em dashes, loopback names and addresses, and the secret patterns in
      `.githooks/secret-patterns.txt`. Expect 0 hits. Record the exact commands.
- [ ] T063 `wc -l .agents/skills/ultracode-house/SKILL.md` reports 220 or fewer.
- [ ] T064 `package.json` and the lockfile show no new dependency (FR-003).
- [ ] T065 Run the code-review skill on the diff. Fix findings.
- [ ] T066 Open the pull request from `claude/ultracode-house-0929` with the
      attribution lines. Wait for every check green (`mission-control-ci`,
      `policy-guard`, `ci-validate`). Answer every review thread.
- [ ] T067 Merge the pull request as the judge lane (ruling 2026-09-29), then
      delete the branch. Never a direct push to `main`.
- [ ] T068 Node-side first read (UNVERIFIED from the cloud): on Sabretooth,
      `git pull`, the House restarts JARVIS, `GET /api/boardroom` answers on
      `192.168.0.8:9150` and says NOT CONFIGURED until `GITHUB_TOKEN` is set,
      the Board Room tab is opened and its frame read. The next `drift` session
      records the result in the journal.
- [ ] T069 Joshua's clicks: add a read-only `GITHUB_TOKEN` for the two
      repositories to the node `.env`; set `JARVIS_MCP_TOKEN` there (already
      open); point each lane's own MCP client at `http://192.168.0.8:9150/mcp`.
