# Agent Heartbeat & Tools

This file is read by all Paperclip agents at session start. It describes the available tools, 
the heartbeat lifecycle, and how to use the self-improvement system.

## Tools Available

- **read** � Read file contents (text up to 2000 lines/50KB, images sent as attachments)
- **bash** � Execute bash commands (ls, grep, find, curl, python, etc.)
- **edit** � Make precise file edits with exact text replacement
- **write** � Create or overwrite files
- **web_search** � Search the web for real-time information
- **web_fetch** � Fetch and extract text content from a web page URL

## Heartbeat Lifecycle

1. **Wake** � Paperclip triggers a heartbeat with env vars: PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_URL, PAPERCLIP_RUN_ID
2. **Identity** � Check assignments via inbox-lite or /api/agents/me
3. **Checkout** � POST /api/issues/:issueId/checkout before doing any work
4. **Work** � Do the assigned task, use child issues for parallel work
5. **Update** � PATCH /api/issues/:issueId with status + comment
6. **Exit** � Heartbeat ends

## Self-Improvement System

- **Session start:** Read c:/antigravity/.agent-core/session-memory.md for context
- **Session end:** Append key learnings to c:/antigravity/.agent-core/session-memory.md
- **Skills:** Read c:/antigravity/.agent-core/skills.md first (curated on-demand index + paths). Browse full c:/antigravity/.agents/skills/ or self-improving-system index only when task requires specific skill.

## Wake Payload Handling (Command-Line Safety)

This section was added to address the adapter_failed "The command line is too long." error observed in prior runs (e.g. 00a8f309-0e3f-476f-9362-e19351715495, pi_local).

- The complete wake context is delivered **exclusively** through the `PAPERCLIP_WAKE_PAYLOAD_JSON` environment variable (set by the harness before agent start). It includes `reason`, `issue` (with title/description/continuationSummary), `checkedOutByHarness`, `fallbackFetchNeeded`, `latestCommentId`, etc.
- **Never** pass, interpolate, or embed `PAPERCLIP_WAKE_PAYLOAD_JSON` (or full issue bodies/continuation summaries) as a literal command-line argument when launching agent processes. On Windows this commonly exceeds cmd.exe (~8191 char) or CreateProcess limits, producing exactly "The command line is too long."
- Adapters/launchers must rely on environment variables (or temp files / stdin / pipes) for all large wake/continuation data.
- When the system generates `continuationSummary`, avoid duplicating the full original `issue.title` + `issue.description` inside the summary body; keep summaries concise to reduce payload bloat.
- Agents should parse the env JSON at start. Use inline wake data first. Only perform additional API fetches (`/api/issues/...`) when `fallbackFetchNeeded: true` or when broader history than the provided batch is required.
- Current run always provides: `PAPERCLIP_RUN_ID`, `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY`, `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_TASK_ID` (issue id), `PAPERCLIP_WAKE_REASON`, and workspace info.

## Heartbeat API Contract

- Harness claims checkout; do not POST /api/issues/:id/checkout again in the same run unless switching tasks.
- For updates: PATCH /api/issues/:issueId (or the TASK_ID) with body including `status` and `comment`. Include header `X-Paperclip-Run-Id: ${PAPERCLIP_RUN_ID}` on all mutating requests. Auth: Bearer ${PAPERCLIP_API_KEY}.
- Valid terminal dispositions before heartbeat exit (per execution contract):
  - `done`: objective complete (file produced/verified, durable artifact left).
  - `in_review`: only when a real reviewer/approval/interaction/monitor path is attached.
  - `blocked`: with named first-class blocker + unblock owner/action.
  - Delegate long work via child issues (create with POST /api/issues).
  - Keep `in_progress` only if a live continuation (e.g. scheduled wake) exists.
- Comments, docs, screenshots, "Remaining" bullets are supporting evidence, **not** a substitute for setting a clear status.

## Tools Mapping Note

The tool list above is the canonical description consumed by agents at session start. Concrete implementations (Grok, Pi, etc.) map to their available primitives (e.g. read_file / run_terminal_command / search_replace for this environment). Agents must not assume argv for wake data.
