# Feature Specification: 011 Ultracode House: the one map skill, the Board Room, and the universal MCP

**Feature Branch**: `claude/ultracode-house-0929`

**Created**: 2026-09-29

**Status**: Landing 2026-09-29 (branch `claude/ultracode-house-0929`)

**Input**: Joshua's words of 2026-09-29:

> "create the skill that combines all tools structure mcp dashboards brains memory journals into the [one thing] as long as josh opens up ... USE I HAVE ADHD CAVEMAN token savers obsidian supabase and a universal hermes mcp dashboard of what ever we called jarvis with every acp ai platform lane opencode openclaw hermes ... i need to see the affiliate links i need to catch my ais drift so i can earn my drift badges ... gemini and openclaw for obvious reasons have to use apis and i use them on pi ... my dashboard the ai board room of drift branches you guys can throw at each other so my stone skin can take a break after 2 years"

Read with the "Rulings of 2026-09-29" in `CLAUDE.md` (Driftus on screen, one
Mission Control, Emergent is a link, Gemini is browser-side, no new
third-party runtime, Hermes is JARVIS with no extras, the judge lane merges its
own green pull requests), `ops/runbook/BACKUPS-AND-DATA-TOOLS-2026-09-29.md`,
and specs 005 and 006 (the fleet, the bridges, and the `/mcp` endpoint this
feature extends).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The one map skill (Priority: P1)

Joshua wants one skill that every session reads first, on every lane, so no
session has to rediscover the house. It folds tools, structure, MCP servers,
dashboards, brains, memory and journals into one map. It is written caveman
style so it costs few tokens. Every fact in it names the repo file behind it.

The skill is `.agents/skills/ultracode-house/SKILL.md`. It is under 220 lines.
Its sections, in order: read first, nodes, dashboards, lanes, MCP, brains and
memory, journals, rulings digest, token savers, Joshua's open clicks.

**Independent Test**: a new session that reads only this skill can name every
node, every dashboard port, every lane, every MCP endpoint and every journal
path without opening another file, and the banned-word scan is clean.

**Acceptance Scenarios**:

1. **Given** only the skill file, **When** a coverage test compares it with the
   code registries, **Then** the text names both node addresses in `NODES`,
   every port in `SERVICES`, every id in `BRIDGE_IDS` and `HARNESSES`, every
   name in `MCP_TOOL_NAMES`, and each lane's `.agents/journals/<lane>/STATE.md`
   path.
2. **Given** a registry entry is added without touching the skill, **When**
   the coverage test runs, **Then** it fails and names the missing entry.
3. **Given** every backticked path in the skill that starts with a top-level
   folder of this repository, **When** the test resolves it, **Then** it
   exists. Paths in the game repository or on a node are named as such and are
   exempt.
4. **Given** the finished file, **When** the checks run, **Then** it is 220
   lines or fewer, has the ten sections in order, and the banned-word,
   em dash and loopback-name scans find nothing.
5. **Given** the "Joshua's open clicks" section, **When** it is compared with
   the `blocked:` lines of the newest judge journal entry, **Then** each open
   click appears, plus this feature's own (`GITHUB_TOKEN` in the node `.env`).

---

### User Story 2 - The Board Room tab in Driftus (Priority: P2)

Joshua wants one tab where every AI platform lane sits in a row, where he can
see the branches the lanes leave behind, and where he can catch a lane
drifting. The tab is a picture of what is. It is not a control panel.

His correction of 2026-09-29, exactly: "its not really a board room for vote
that would stay founders clawx joshuaclaw this more marketing collab and
education collab pet saving collab joshua is learning collab ... thats just a
think tank of joshuas 20 hrs a day ... a trust validated by them not trust me
bro". So the Board Room is the mission's think tank: collab tracks, one seat
per AI lane, each seat's own trust record, and the drift the seats review for
each other. The vote stays on the founder's ClawX board and the Board Room
only names it. Not a task list of what the Claude lane has to fix, not the
game's task bank.

`GET /api/boardroom` returns six blocks:

- `tracks`: the think tank tracks from `TRACKS` in `lib/lanes.mjs`: the
  mission (#UntilNoKidInNeed, record `domains/untilnokidinneed.com/dao/`),
  Marketing collab (lead Emergent, record the approved affiliate brief),
  Education collab, Pet saving collab, and Joshua is learning collab. A track
  with a record file on disk is ON RECORD; a track without one is NOT
  CONFIGURED with the detail "no record on disk yet". No invented content.
- `lanes`: the registry in `lib/lanes.mjs` joined with the live `/api/bridges`
  and `/api/fleet` rows. Nine lanes: Claude, Codex, Hermes, OpenCode,
  OpenClaw, Gemini, Emergent, Genspark and the Buzz relay (read only).
- `attestations`: one row per lane for `.agents/journals/<lane>/TRUST.md`
  (`claude-judge` for Claude): FILED with the file's date and line count, or
  NOT FILED. Each platform files its own attestation of the two years of
  rapport from its own memory. Nobody files for another lane, and this
  feature writes none.
- `drift`: the drift board from `lib/drift.mjs`. GitHub branches and open pull
  requests for `Trollz1004/ANTIGRAVITY` and `Trollz1004/dream-online`. Each
  branch other than `main` is DEAD, STALE, LIVE or WORKING. Each lane gets a
  drift badge. Without `GITHUB_TOKEN` it says NOT CONFIGURED. On a GitHub error
  it says DOWN. It is cached for 5 minutes.
- `affiliate`: the Emergent wing URL, the path of the approved brief, and the
  terms line.
- `founderBoard`: `{ tab: 'board', note }` naming the founder's ClawX board
  as the only place a vote happens. The Board Room has no vote of its own.

**Independent Test**: with a fake GitHub the route classifies a merged branch
DEAD, an old unmerged one STALE, a pull-request branch LIVE; without a token it
says NOT CONFIGURED and draws no row; the tab renders those states by frame.

**Acceptance Scenarios**:

1. **Given** a fake GitHub with `claude/old-merged` (nothing ahead of
   `main`), `codex/old-abandoned` (unmerged, last commit 40 days ago),
   `claude/ultracode-house-0929` (open pull request) and `hermes/fresh`
   (unmerged, last commit yesterday, no pull request), **When**
   `GET /api/boardroom` is called, **Then** the four branches read DEAD, STALE,
   LIVE and WORKING, and each lane's badge counts its own branches.
2. **Given** `GITHUB_TOKEN` is unset, **When** the route is called, **Then**
   the `drift` block reads `NOT CONFIGURED` with its reason, no branch row
   exists, no GitHub request was made, and the rest of the Board Room still
   answers.
3. **Given** the fake GitHub answers 500 or 403, or does not answer, **When**
   the route is called, **Then** that repository is `DOWN` with the status or
   error text and no row is drawn for it. The other repository is unaffected.
4. **Given** two calls within 5 minutes, **When** the fake GitHub counts its
   requests, **Then** each repository was read once. A call after the fake
   clock passes 5 minutes reads it again. A DOWN result is never cached.
5. **Given** an orphan branch GitHub cannot compare (404), **When** the route
   is called, **Then** it is listed under `skipped` with the reason and is not
   a row, and the repository stays readable.
6. **Given** the bridge and fleet rows, **When** the lanes join, **Then**
   Emergent reads LINKED, Gemini reads NOT CONFIGURED, a lane with neither row
   reads NOT CONFIGURED with its reason, and no lane reads UP unless its own
   identity call said UP.
7. **Given** `EMERGENT_WING_URL` is set, **When** the route is called, **Then**
   `affiliate` carries that URL, the brief path
   `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md`, and the terms
   line, and carries no earnings figure.
8. **Given** a token value in the test environment, **When** any Board Room
   response is searched, **Then** the value appears nowhere in it.
9. **Given** the tab is open in each state, **When** the judge lane takes and
   reads frames, **Then** NOT CONFIGURED, DOWN and a populated board each show
   what the route said, and the NOT CONFIGURED frame shows no branch row.

---

### User Story 3 - The universal MCP (Priority: P3)

Joshua wants every lane to read the same board. JARVIS's `/mcp` on :9150 gains
three read-only tools: `boardroom`, `backup_health` and `house_map`. It stays
bearer-gated. Claude reaches it with `claude mcp add --transport http`.
Hermes, OpenCode and OpenClaw reach it over Streamable HTTP with their own MCP
client settings. The endpoint is `http://192.168.0.8:9150/mcp`.

**Independent Test**: an MCP client lists the nine tools and reads each; a
missing token gives 503 and a wrong token gives 401, as today.

**Acceptance Scenarios**:

1. **Given** the SDK client and the right bearer token, **When** it lists
   tools, **Then** it sees exactly `node_health`, `triggers`, `proposals`,
   `bridges`, `runbook`, `state_record`, `boardroom`, `backup_health` and
   `house_map`.
2. **Given** the same fakes, **When** `boardroom` is called, **Then** it
   returns the same board as `GET /api/boardroom`, because both use one
   builder.
3. **Given** a backup result on disk, **When** `backup_health` is called,
   **Then** it returns what `GET /api/backup-health` returns.
4. **Given** the skill file, **When** `house_map` is called, **Then** it
   returns the file's text as read at call time. A missing or unreadable file
   returns a NOT CONFIGURED message that names the file, never an empty
   success.
5. **Given** `JARVIS_MCP_TOKEN` is unset or the bearer is wrong, **When** any
   tool is called, **Then** the answer is 503 or 401 and nothing ran.
6. **Given** a tool whose data source is not wired, **When** it is called,
   **Then** it returns an error result that says the source is not wired on
   this node.

---

### User Story 4 - Records (Priority: P4)

The next session remembers none of this. It needs the record.

**Independent Test**: the four records exist, each names the route, the tools,
the skill and the env var name, and each states what was verified from the
cloud and what only the node can verify.

**Acceptance Scenarios**:

1. **Given** the runbook, **When** it is read, **Then** section 14 in
   `ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` covers the skill, the Board Room,
   the three tools, `GITHUB_TOKEN` and the UNVERIFIED list.
2. **Given** that runbook edit is a protected change, **When** the changelog
   is read, **Then** `ops/runbook/PROTECTED-CHANGELOG.md` has one timestamped
   line in its existing format: date, time, file, what changed, commit.
3. **Given** the judge journal, **When** its newest entry is read, **Then** it
   has did, verified, skills, blocked, next and state lines for this feature.
4. **Given** `ops/skills/SKILLS-HUB.md`, **When** it is read, **Then** it has a
   row for `ultracode-house`.
5. **Given** `mission-control/README.md`, **When** it is read, **Then** it
   lists the new route, the three tools and the env var names, never values.

## Requirements *(mandatory)*

- **FR-001**: Every row, count and line the skill, the route, the tab and the
  three tools show MUST come from a repo file or a live read. There are no
  sample rows, fixtures or invented numbers in a production path. What cannot
  be read is `null` or NOT CONFIGURED, with its own reason.
- **FR-002**: Every node address this feature prints or probes MUST be
  `192.168.0.8` (Sabretooth), `192.168.0.40` (Alienware), or the cloud
  dashboard hostname `/api/config` serves. No loopback name or address is
  printed in the skill, the tab or an MCP connect line, and no new probe uses
  one. The one loopback-only service, the Obsidian Local REST plugin, is
  described as loopback-only, as `lib/nodes.mjs` already does.
- **FR-003**: No new third-party runtime, relay, SDK or hosted agent MUST be
  added (ruling 2026-09-29: Hermes is JARVIS, no extras). The GitHub read uses
  Node's built-in `fetch`. `package.json` gains no dependency. Buzz appears at
  most as a read-only relay row: its catalog may be read and it never
  executes.
- **FR-004**: Gemini MUST never be shown, held or asked for as an API key on
  either node. Its row says browser-side: Gemini in Chrome, in Joshua's own
  signed-in Chrome, NOT CONFIGURED as a probe. Joshua uses API-keyed Gemini and
  OpenClaw on Pi, off the nodes. The Gemini and OpenClaw rows record Pi as a
  node they live on, in a note, and hold no key. Pi has no row of its own.
- **FR-005**: Emergent MUST never read "up". Its row is LINKED (a link to the
  wing chat) or NOT CONFIGURED. No probe, no key. The URL is
  `EMERGENT_WING_URL` or its default, the same value `/api/config` serves.
- **FR-006**: The Board Room MUST be a tab in the existing dashboard on :9150
  (Driftus on screen, JARVIS in code). There is no second dashboard, no
  artifact page, no new port, no new service and no new hostname.
- **FR-007**: Nothing MUST execute from the Board Room. `GET /api/boardroom` is
  the only new route and it is a GET. No button in the tab calls a route that
  changes state. There is no vote in the Board Room; the `founderBoard` note
  names the ClawX Board tab, whose own controls stay where they are.
- **FR-008**: `GITHUB_TOKEN` MUST be read from the node's `.env` by name. Its
  real value MUST never appear in a response, a log line, a test, the skill or
  a record. Tests use an obvious fake. The GitHub client sends GET requests
  only. Every Board Room and MCP result passes `lib/redact.mjs`.
- **FR-009**: The drift board MUST report NOT CONFIGURED when `GITHUB_TOKEN` is
  unset, with its reason, make no GitHub request and draw no row. It MUST
  report DOWN, with the status or error text, when GitHub answers with an error
  or does not answer, and draw no row for that repository. Only a 404 or 422 on
  one branch's compare is about that branch. It goes under `skipped`, never as
  a row. Anything else, such as a 403 rate limit, makes the whole repository
  DOWN. Successful reads are cached for 5 minutes. Errors are never cached.
  Every repository entry says when it was read (`fetchedAt`), and says
  `truncated` when the branch list reached its 100-branch page.
- **FR-010**: Each branch other than `main` MUST be classified as exactly one
  of, checked in this order: DEAD (nothing ahead of `main`, `ahead_by` 0), LIVE
  (an open pull request has it as its head), STALE (unmerged, no open pull
  request, last commit older than the stale window) or WORKING (everything
  else). The stale window is a named parameter of `lib/drift.mjs`, `staleDays`,
  7 by default. A DEAD branch has no commits ahead, so its last commit date is
  `null`.
- **FR-011**: Each branch MUST be attributed to a lane by its name prefix, from
  the one prefix table in `lib/drift.mjs`. `claude/` and `judge/` count as
  Claude. `codex/`, `hermes/`, `opencode/`, `openclaw/`, `emergent/` and
  `dependabot/` count as themselves. Any other name is `unknown`. A lane's
  drift badge is its count of DEAD, STALE, LIVE and WORKING branches, per
  repository. The badge is a count. This feature builds no earning ledger.
- **FR-012**: The lanes block MUST NOT probe anything. It joins the bridge and
  fleet rows already built. A lane's status is its bridge row's status when
  that says anything other than NOT CONFIGURED, else its fleet row's status
  when that does, else NOT CONFIGURED with a reason ("no probe on this node"
  when it has neither row). Each lane row carries its role, how it connects
  (official CLI, gateway, ACP, API, browser, hosted link or relay), the nodes
  it lives on (Sabretooth, Alienware, Pi, cloud or browser), its journal path
  (`null` when none exists), and the fleet row's current task and queue depth
  when there is one.
- **FR-013**: The affiliate block MUST carry the Emergent wing URL, the path of
  the approved brief with a flag saying whether that file exists, and the terms
  line: the commission the brief and `CLAUDE.md` state ("up to 50 percent of net
  subscription revenue for the life of a referred subscription,
  founder-approved") and the plans the brief lists. Every figure in it appears
  in the approved brief. It carries no earnings claim and no count that is not
  in a record. The affiliate page and the ledger are not built, and the block
  says so instead of linking to them.
- **FR-014**: The MCP endpoint MUST gain exactly three tools, `boardroom`,
  `backup_health` and `house_map`, for nine in all. All are read-only. The
  bearer gate is unchanged: 503 when `JARVIS_MCP_TOKEN` is unset, 401 when it
  is wrong. `boardroom` and `backup_health` read through the same functions as
  their HTTP routes, so tool and route cannot disagree. A tool with no wired
  data source returns an error result saying so, never an empty success.
- **FR-015**: The skill MUST be one file,
  `.agents/skills/ultracode-house/SKILL.md`, with a `name` and a
  `description` that make a session load it first. It is 240 lines or fewer (raised from 220 on 2026-09-29 to carry the full SERVICES registry),
  in caveman style (articles and filler dropped, technical terms, paths,
  numbers and exact strings kept, per `.agents/skills/caveman/SKILL.md` and
  `.agents/skills/i-have-adhd/SKILL.md`). It has the ten sections in order. It
  names the repo file behind each fact, inline. When a fact and the disk
  disagree, the skill says the disk wins.
- **FR-016**: The skill MUST NOT be copied. `house_map` serves this same file
  from disk. A coverage test derives what the skill must name from the code
  registries, so the skill cannot fall behind them unnoticed.
- **FR-017**: The business-only word list enforced by
  `.githooks/pre-commit-canonical` MUST NOT appear in any file this feature
  adds or changes. No em dash appears on an added line. No loopback name
  appears on an added line. The scans run on the added lines of the diff,
  because older files carry em dashes.
- **FR-018**: Every test MUST use vitest with fakes only: an injected `fetch`
  for GitHub, an injected clock for the cache, an in-memory or ephemeral-port
  MCP server. No test reaches the real GitHub, reads the real `.env`, or needs
  a network.
- **FR-019**: Before landing, the judge lane MUST start JARVIS from the branch
  on a non-loopback address with a fake GitHub, take a frame of each tab state,
  and open and read every frame. A passing test is not a frame.
- **FR-020**: The feature MUST land as one pull request from
  `claude/ultracode-house-0929`, merged by the judge lane when every check is
  green and every review thread is answered (ruling 2026-09-29). No direct push
  to `main`. The runbook edit carries its `PROTECTED-CHANGELOG.md` line.
- **FR-021**: This feature MUST NOT touch `scripts/fables-house/**`,
  `scripts/drift.cmd`, `ops/skills/sabretooth-node/**` or `.github/**`. The one
  protected path it edits is `ops/runbook/**`, by the Claude judge lane only.

## Success Criteria *(mandatory)*

- **SC-001**: `.agents/skills/ultracode-house/SKILL.md` is 220 lines or fewer,
  has 10 sections in the stated order, and its coverage test passes: 100
  percent of node addresses, `SERVICES` ports, `BRIDGE_IDS`, `HARNESSES`, MCP
  tool names and journal paths are named in it.
- **SC-002**: `GET /api/boardroom` returns 6 blocks (`tracks`, `lanes`,
  `attestations`, `drift`, `affiliate`, `founderBoard`), plus the cloud
  dashboard address and a timestamp. The lanes block has 9 rows, one per
  registry lane, the tracks block 5 rows, the attestations block 9 rows. The
  drift board covers 2 repositories.
- **SC-003**: At least 30 new vitest tests across the new and changed test
  files, all green, with 0 new failures against the baseline on `main` when
  the branch was cut (recorded in the pull request).
- **SC-004**: At least 4 frames of the Board Room tab, each opened and read by
  the judge lane: NOT CONFIGURED with no branch row, DOWN, a populated board
  showing all four states and a lane badge, and the lanes and affiliate
  blocks.
- **SC-005**: An MCP `tools/list` returns 9 tools. Each of the 3 new tools
  answers a real call in the handshake test. The 503 and 401 cases still pass.
- **SC-006**: The banned-word, em dash and loopback-name scans over the added
  lines of the diff report 0 hits, with the exact commands recorded in the
  pull request.
- **SC-007**: The pull request is merged by the judge lane with every check
  green and every review thread answered, and the merge commit is on `main`.
- **SC-008**: The node-side first read after the merge (the House restarts
  JARVIS, `GET /api/boardroom` answers on `192.168.0.8:9150`) is recorded by
  the next `drift` session. Until then it is UNVERIFIED in every record.

## Assumptions and Out of Scope

**Assumptions**

- The cloud session cannot restart JARVIS, run the House or read the node's
  `.env`. It verifies with tests and frames from a JARVIS started from the
  branch. The node-side first read is named UNVERIFIED until a `drift` session
  does it.
- `GITHUB_TOKEN` is a read-only token for the two repositories, added to the
  node `.env` by Joshua. Until it is there, the drift board says NOT CONFIGURED,
  and that is the correct state.
- The skill loads first because of its `description`, and because `house_map`
  serves the same text to lanes that do not read `.agents/skills`. Preloading
  it from `drift` is a protected-file change, left to the judge lane later.
- Pointing each lane's own MCP client at the endpoint is Joshua's click or that
  lane's own session. The server side is verified with the SDK client. Each
  lane's client line is UNVERIFIED until that lane reads the board.
- The prefix table in `lib/drift.mjs` is the only place lanes are tied to
  branch names. A branch with no listed prefix is `unknown`.
- DEAD means nothing ahead of `main`, which is what GitHub's compare says.
  This repository lands pull requests with merge commits, so a landed branch
  reads DEAD. A branch landed by squash would still show commits ahead, and
  would read WORKING or STALE until it is deleted. The board reports what the
  compare says and does not guess.

**Out of scope**

- Executing anything from the Board Room: no run, approve, vote or merge
  buttons. The vote stays on the founder's ClawX board (:9134 belongs inside
  Mission Control, by the ruling of 2026-09-29); the Board Room is the think
  tank, not the ballot.
- Writing any lane's TRUST.md. Each platform writes its own from its own
  session; the Board Room only reports FILED or NOT FILED.
- A Pi probe or a Pi row. There is no Pi host or port on record. Pi is named as
  a node in the OpenClaw and Gemini lane notes, and in the skill's nodes
  section as NOT CONFIGURED.
- An earning ledger for drift badges. The badge is a count.
- Vercel. The key is dormant. A deployment is a ruling first, then a spec.
- An off-node backup stage. It is a ruling and a spec, per the backups runbook.
- Any new third-party runtime, relay or dashboard, and any change to
  `drift.cmd`, the House or the launch skill.
- The affiliate page, the affiliate ledger and any earnings claim. They are the
  Emergent lane's deliverables under the approved brief.
