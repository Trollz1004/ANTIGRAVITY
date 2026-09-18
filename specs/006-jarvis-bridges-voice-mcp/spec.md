# Feature Specification: JARVIS Phase F — Bridges, Voice, and the Skills/MCP Panel

**Feature Branch**: `006-jarvis-bridges-voice-mcp`

**Created**: 2026-09-17

**Status**: In progress

**Input**: `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md`, Phase F
("Bridges, voice, and the skills and MCP panel"), all five units: Bridge
registry, Voice, Skills/plugins/MCP panel, JARVIS MCP endpoint, one-port
validation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bridge registry (Priority: P1)

Joshua wants JARVIS to show, honestly, which outside agents on this node are
reachable (Hermes, OpenClaw, Claude Code, Codex, Ollama, OmniRoute, Obsidian,
a CDP-attached browser, the Buzz ledger, Unreal) and to be able to hand any
runnable one a prompt without that prompt executing until he approves it.

**Independent Test**: `GET /api/bridges` returns all ten bridges with a
status judged by an identity call; `POST /api/bridges/:id/run` on a runnable
bridge creates a `bridge.run` Proposal and does not execute anything; the
founder's existing `/api/inbox/:id/approve` control is the only path that
calls the bridge's executor.

**Acceptance Scenarios**:

1. **Given** Hermes's dashboard or gateway answers with its known marker,
   **When** `GET /api/bridges/hermes` is called, **Then** `status: 'UP'`.
2. **Given** a bridge with `canRun:false` (e.g. Unreal, OpenClaw), **When**
   `POST /api/bridges/:id/run` is called, **Then** the request is refused
   (400/409), never silently accepted.
3. **Given** an approved `bridge.run` proposal, **When** the founder approves
   it via the inbox, **Then** the named bridge's executor runs once and its
   output/error becomes the proposal's evidence (`EXECUTED`/`FAILED`).

### User Story 2 - Voice in and out (Priority: P1)

Joshua wants to talk to JARVIS and hear a natural reply, not the browser's
robotic default voice, with a working mute and no auto-sent transcript.

**Independent Test**: the dock's push-to-talk button fills the input from
`SpeechRecognition` and never calls Send itself; `POST /api/tts` renders a
cached or fresh edge-tts neural voice; a 204 or any failure makes the client
fall back to `speechSynthesis`, labelled as a fallback.

**Acceptance Scenarios**:

1. **Given** Chrome/HTTPS-tunnel `SpeechRecognition` is unavailable, **When**
   the dock mounts, **Then** the mic button is disabled with the exact
   dispatch-worded reason.
2. **Given** a fresh `(text, voice)` pair, **When** `POST /api/tts` is called
   twice, **Then** the second call is served from the 24h cache (no second
   `edge-tts` process).
3. **Given** `edge-tts` fails and no piper model exists, **When**
   `POST /api/tts` is called, **Then** the route answers 204 and the client
   speaks via the browser voice, labelled a fallback.

### User Story 3 - Skills, plugins, and MCP panel (Priority: P2)

Joshua wants one honest read-only view of what Claude Code actually has
loaded on this node: enabled plugins + versions, MCP servers by name and
connection state, user + project skills, obsidian-second-brain's commands,
and what `drift`'s default path preloads.

**Independent Test**: `GET /api/skills` returns every section read live from
`~/.claude` and this repo, with no secret-shaped value (install paths, MCP
URLs, tokens) present in the response.

**Acceptance Scenarios**:

1. **Given** an enabled plugin in `~/.claude/settings.json`, **When**
   `GET /api/skills` is called, **Then** it appears with its version from
   `claude plugin list --json`, never its install path.
2. **Given** the AIRI skills tree already exists as the Agents tab, **When**
   the Skills panel renders, **Then** the project skills tree is not
   rendered a second time — it links to the Agents tab with a live count.

### User Story 4 - JARVIS MCP endpoint (Priority: P2)

Joshua wants the Alienware node's Claude to read this node's real state over
the LAN through one authenticated, read-only MCP endpoint.

**Independent Test**: `POST /mcp` on :9150 speaks Streamable HTTP via
`@modelcontextprotocol/sdk`, requires a bearer token from
`JARVIS_MCP_TOKEN` (503 when unset, 401 when wrong), and exposes exactly six
read-only tools: `node_health`, `triggers`, `proposals`, `bridges`,
`runbook`, `state_record`.

### User Story 5 - One-port validation (Priority: P1)

Every new route answers on both the LAN origin and loopback, `npx vitest run`
has no new failures beyond the three pre-existing crosslisting-cleanliness
tests and the one flaky claudian test, and `mission-control/README.md`
documents every panel/route/env var name.

## Requirements *(mandatory)*

- **FR-001**: Every bridge status MUST come from an identity call, never a
  bare port/TCP check alone.
- **FR-002**: A runnable bridge MUST only ever execute through a `bridge.run`
  Proposal approved by the founder (`x-founder-token`); no route in this
  phase executes a bridge directly.
- **FR-003**: No provider/vendor key MUST ever reach the browser; OmniRoute
  and edge-tts calls are server-side only.
- **FR-004**: Every value in the Skills/MCP panel MUST be redacted
  server-side before it leaves the server (belt-and-suspenders with the
  panel's own field selection).
- **FR-005**: The local username MUST NOT appear in `lib/` or `server.mjs`
  (`os.homedir()`/`process.env.USERPROFILE` only); this repo's own launch
  script's filename MUST NOT appear as a literal string in `server.mjs`
  either (existing `tests/claude-bridge-hardening.test.js` check).
- **FR-006**: The MCP endpoint MUST be read-only in this phase and MUST
  refuse an unset/incorrect bearer token (503/401).
- **FR-007**: TTS audio MUST be cached 24h by `sha256(voice + text)` under a
  gitignored `mission-control/data/tts/` directory.

## Success Criteria *(mandatory)*

- **SC-001**: `GET /api/bridges` returns 10 rows, each with `status`,
  `identity`, `lastChecked`, `canRun`.
- **SC-002**: `npx vitest run` reports 0 new failures (only the 3 pre-existing
  crosslisting-cleanliness failures + 1 flaky claudian test remain).
- **SC-003**: The House one-pass reports JARVIS UP after this phase lands.
- **SC-004**: `mission-control/README.md` lists every panel/route from
  Phases A–F and the env variable names (never values) JARVIS reads.
