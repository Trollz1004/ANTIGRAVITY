# Implementation Plan: JARVIS Phase F — Bridges, Voice, and the Skills/MCP Panel

**Branch**: `006-jarvis-bridges-voice-mcp` | **Spec**: `spec.md`

## Summary

Five units, each landing as its own commit with an explicit pathspec:

1. **Bridge registry** — `lib/bridges.mjs` (pure adapter functions, one per
   bridge, deps injected) + routes in `server.mjs`
   (`GET /api/bridges`, `GET /api/bridges/:id`, `POST /api/bridges/:id/run`,
   `POST /api/ask`) + `js/jarvis/bridges.js` (status cards + run box) +
   `lib/inbox.mjs`'s `performAction` extended with a `bridgeAdapters` param
   so an approved `bridge.run` proposal executes exactly once.
2. **Voice** — `lib/tts.mjs` (edge-tts CLI wrapper, 24h cache, piper
   availability check, honest 204 fallback reason) + `POST /api/tts` +
   `GET /api/tts/voices` + `js/jarvis/tts-client.js` (server-first speak,
   mute/voice persisted in localStorage) + push-to-talk/mute/voice-picker/
   test-voice wired into the existing global dock (`js/jarvis/dock.js`).
3. **Skills/plugins/MCP panel** — `lib/skills-panel.mjs` (parses
   `~/.claude/settings.json`, `claude plugin list --json`, `claude mcp list`,
   SKILL.md frontmatter across every skill root, obsidian-second-brain's
   command files, and `drift`'s preload skill + its `related_skills`) +
   `GET /api/skills` + `js/jarvis/skills.js` (merges into, never duplicates,
   the existing Agents/AIRI skills tree view).
4. **JARVIS MCP endpoint** — `POST /mcp` via `@modelcontextprotocol/sdk`
   (Streamable HTTP), bearer-token gated on `JARVIS_MCP_TOKEN`, six read-only
   tools.
5. **One-port validation** — restart via the House, curl every new route on
   both origins, `npx vitest run`, README update, restricted-word grep.

## Technical Context

- Runtime already verified live on this node 2026-09-17: `hermes.exe`,
  `codex` (0.153.4), `claude` (2.1.275), `edge-tts` (7.2.8, all six
  dispatch-named `en-US-*Neural` voices confirmed via
  `edge-tts --list-voices`), Ollama (`:11434`, several models installed),
  OmniRoute (`:20128`, `/api/health` ok), Hermes dashboard (`:9119`) and
  gateway (`:8642`, `hermes-agent` marker), OpenClaw (`:18789`, "OpenClaw
  Control" marker). Obsidian Local REST and Chrome CDP were both DOWN/NOT
  CONFIGURED at check time — reported honestly, not faked UP.
- No `mission-control/.env` and no `JARVIS_FOUNDER_TOKEN` /
  `JARVIS_JUDGE_TOKEN_*` / `JARVIS_MCP_TOKEN` in the repo `.env` as of this
  session — every gated route honestly answers 503 until Joshua sets one;
  this session never sets one on his behalf.
- `@modelcontextprotocol/sdk` version confirmed reachable via
  `npm view @modelcontextprotocol/sdk version` (1.30.0) before installing.

## Constitution Check

- One repo, judge-only push: this session commits, never pushes/merges.
- Business-only / no-secrets: every new route runs through `lib/redact.mjs`;
  no key ever reaches the client; the local username never appears in
  `lib/` or `server.mjs`.
- Sonnet for tasks: this session is the Sonnet worker dispatched by the
  judge lane, per the dispatch's own executor line.

## Known pre-existing failures (not this phase's regressions)

- 3× `tests/crosslisting.test.js` "Crosslisting package cleanliness" —
  `crosslisting/` was folded out of this checkout; the test still expects
  `crosslisting/package.json` etc. at the repo root.
- 1× flaky claudian test (per dispatch).

## Task breakdown

See `tasks.md`.
