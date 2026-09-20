# Feature Specification: JARVIS Agentic Ask

**Feature Branch**: `009-jarvis-agentic-ask`

**Created**: 2026-09-19

**Status**: In progress

**Input**: Joshua's ruling 2026-09-19 — a model in the JARVIS dashboard's
picker is useless unless it is agentic. The Ask-JARVIS chat on OmniRoute must
be able to act, within the founder-approval doctrine, and any model that
cannot call tools is removed from the picker. The Claude Code panel
("Claudian", headless `claude -p` with real file access, limited by Joshua's
own Claude cap) stays as is.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A tool-calling loop behind `POST /api/ask` (Priority: P1)

Joshua asks Ask-JARVIS a question that needs real repo or house state (not
something an LLM can answer from its own training), and gets back a real,
current answer with an honest record of what was checked.

**Independent Test**: `POST /api/ask {bridge:"omniroute", question}` runs a
tool-calling loop against OmniRoute chat completions and streams the
assistant's text plus a compact tool trace (`{tool, argsSummary, ms, ok}`)
as SSE; a question naming a live file or node-health fact triggers the
matching tool call in the trace.

**Acceptance Scenarios**:

1. **Given** OmniRoute has no key configured, **When** `POST /api/ask` is
   called with `bridge:"omniroute"`, **Then** the stream opens and an
   `error` event reports AUTH MISSING — never a fabricated answer.
2. **Given** a question the model answers by calling `read_file`, **When**
   the loop runs, **Then** the trace contains a `read_file` entry and the
   final answer reflects the file's real contents.
3. **Given** the model keeps requesting tools past 8 rounds or 60 seconds,
   **When** the loop runs, **Then** it stops and returns whatever answer it
   has, never a hang.

### User Story 2 - Read freely, propose, never execute (Priority: P1)

Every tool the loop can call either reads an existing live JARVIS data
source or files a Proposal — none of them changes anything in the world by
itself.

**Independent Test**: `create_proposal` and `request_bridge_run` only ever
call the existing proposal store / `createBridgeRunProposal` (never a direct
file write, network POST, or process spawn); every other tool is read-only
against the repo or an existing in-process data source.

**Acceptance Scenarios**:

1. **Given** the model calls `create_proposal`, **When** the tool runs,
   **Then** a `PROPOSED` item appears in the Inbox and the loop's reply says
   "I filed proposal `<id>`."
2. **Given** the model calls `read_file` with a path outside the repo, a
   `..` segment, or a `.env`/secret-shaped name, **When** the tool runs,
   **Then** it refuses with an honest error and returns no file content.
3. **Given** an approved `bridge.run` Proposal, **When** Joshua approves it
   in the Inbox, **Then** the bridge actually runs — never before that click,
   and never as a side effect of the Ask-JARVIS loop itself.

### User Story 3 - A model picker that only offers models that can act (Priority: P1)

Joshua opens the Ask-JARVIS dock and sees only entries — OmniRoute models
plus the Claude Code panel — that are known, by a real capability test, to
be able to call a tool.

**Independent Test**: `GET /api/ask/models` probes up to 12 candidate
OmniRoute models with a one-shot `tool_choice:"required"` call, reports
`{kept, dropped, builtin}`, and caches the result for an hour; the dock's
model select only lists `kept` entries plus the builtin Claude Code entry.

**Acceptance Scenarios**:

1. **Given** a model answers the probe without calling the tool, **When**
   `GET /api/ask/models` runs, **Then** that model is in `dropped` with a
   reason, never in `kept`.
2. **Given** a second call within the hour, **When** `GET /api/ask/models`
   runs, **Then** the cached result is served without re-probing.
3. **Given** `?force=1`, **When** `GET /api/ask/models` runs, **Then** it
   re-probes regardless of cache age.

## Requirements *(mandatory)*

- **FR-001**: `lib/agent-tools.mjs` exposes an OpenAI-compatible tool set
  (`read_file`, `list_dir`, `search_repo`, `node_health`, `gods_eye`,
  `inbox_list`, `specs_list`, `runbook`, `create_proposal`,
  `request_bridge_run`), every result redacted through `lib/redact.mjs`.
- **FR-002**: `read_file`/`list_dir`/`search_repo` stay inside
  `C:\ANTIGRAVITY`, refuse `..`, and refuse `.env*`/secret/credential/
  `*.pem`/`*.key`-shaped paths; `read_file` is capped at 200 KB,
  `search_repo` at 200 hits.
- **FR-003**: `lib/ask-agent.mjs` runs the loop for `POST /api/ask` when
  `bridge:"omniroute"`: `tools` + `tool_choice:"auto"`, model from the
  request or `auto/best-fast`, capped at 8 tool rounds and 60s total,
  streamed as SSE (`init`/`delta`/`tool`/`result`/`error`).
- **FR-004**: Every tool call is appended to the JSONL audit log
  (`data/audit/`) with its redacted argument summary.
- **FR-005**: `GET /api/ask/models` probes the OmniRoute catalog at most
  once an hour (cached under `data/`, gitignored), tests up to 12
  candidates (`auto/*` combos first), and reports `{kept, dropped, builtin}`.
- **FR-006**: The Ask-JARVIS dock shows the tool trace under an answer
  (collapsible), a "Proposals filed" chip linking to the Inbox, and a
  truthful capability sentence; the model picker only lists `agentic:true`
  entries plus the Claude Code panel.
- **FR-007**: The Claude Code ("Claudian") panel and its `/api/claude/chat`
  path are unchanged.

## Out of scope

- Any change to `lib/social-adapters.mjs`, `lib/inbox.mjs`,
  `lib/compliance.mjs`, or the Social panel client (owned by a different
  lane in this same window).
- Executing a bridge or a proposal from inside the agentic loop — that stays
  Joshua's own founder-approve click, unchanged from Phase F.
