# Implementation Plan: JARVIS Agentic Ask

**Branch**: `009-jarvis-agentic-ask` | **Spec**: `spec.md`

## Summary

Add a tool-calling agent loop behind the existing (previously unused by any
client) `POST /api/ask` omniroute branch, a bounded read-only/propose-only
tool set reusing every live data source this server already exposes, a
model picker that drops any OmniRoute model that cannot call a tool, and a
dock UI update that shows the trace and files-proposals honestly. The Claude
Code ("Claudian") panel is untouched.

## Technical Context

- Runtime: Node 22+, zero-dependency `node:http` server (`mission-control/server.mjs`).
- Existing pieces reused, not duplicated: `lib/redact.mjs` (redaction),
  `lib/proposals.mjs` (Proposal store), `lib/bridges.mjs`
  (`createBridgeRunProposal`, `BRIDGE_IDS`), `lib/heartbeat.mjs`
  (`readHeartbeat`), `lib/sentry.mjs` (`getSentrySnapshot`), `lib/inbox.mjs`
  (`buildInbox`, `appendAudit`), `lib/speckit.mjs` (`listFeatures`),
  `lib/runbooks.mjs` (`listRunbooks`/`resolveRunbook`), `lib/claude-bridge.mjs`
  (`sse` event-stream framing, the same vocabulary the Claude bridge already
  uses).
- OmniRoute is OpenAI-compatible (`/v1/chat/completions`, `/v1/models`);
  `OMNI_ROUTE_API_KEY` stays server-side (never sent to the browser).

## Architecture

```
POST /api/ask {bridge:"omniroute", question, model?}
  -> server.mjs opens an SSE response (same headers/vocabulary as
     /api/claude/chat: init/delta/tool/result/error)
  -> lib/ask-agent.mjs: runAskAgent({question, model, tools: ASK_TOOLS, ...})
       loop (<=8 rounds, <=60s):
         POST OmniRoute /chat/completions {model, messages, tools, tool_choice:"auto"}
         no tool_calls  -> stream final 'delta', done
         tool_calls     -> for each: callTool(handlers, name, args)
                             -> record {tool, argsSummary, ms, ok} in the trace
                             -> append the redacted call to data/audit/
                             -> push a role:"tool" message, next round
  -> 'result' event: {answer, model, trace, proposals}

GET /api/ask/models[?force=1]
  -> lib/ask-agent.mjs: refreshAskModels(...)
       cache hit (<1h old, data/ask-models-cache.json) -> return cached
       else: GET OmniRoute /models -> pick <=12 candidates (auto/* first)
             -> probeModelAgentic(model) per candidate (tool_choice:"required")
             -> {kept, dropped} -> cache -> return, server adds `builtin`
```

`lib/agent-tools.mjs` owns the tool schemas and handlers; it never resolves
a live source itself — every source is injected from `server.mjs` as an
already-bound function (`getNodeHealth`, `getGodsEye`, `getInbox`,
`getSpecs`, `listRunbooksFn`, `readRunbookFn`, `proposalStore`,
`getBridgeRow`, `createBridgeRunProposalFn`), matching the rest of this
codebase's dependency-injection convention (see `lib/bridges.mjs`,
`lib/sentry.mjs`).

## Client

`js/jarvis/dock.js` gains a `#dock-model` select (default `"claude-code"`,
refreshed from `GET /api/ask/models`) and a truthful capability sentence.
Selecting `"claude-code"` keeps the exact existing `/api/claude/chat` path;
any other value posts to `/api/ask` instead, and renders the `tool` trace as
a collapsible `<details>` plus a "Proposals filed" chip when the loop filed
one. `js/jarvis/social.js`, `lib/social-adapters.mjs`, `lib/inbox.mjs`, and
`lib/compliance.mjs` are not touched (owned by a parallel lane).

## Testing

- `tests/agent-tools.test.js` — sandboxing (`..`, outside-repo, secret-shaped
  paths, size cap), `search_repo` ripgrep + JS-walk fallback, every tool's
  dispatch and error handling.
- `tests/ask-agent.test.js` — the loop with a mocked OmniRoute (no-tool
  answer, one tool round then answer, proposal-filed trace, maxRounds cutoff,
  network failure), plus the model picker (`pickCandidateModels`,
  `probeModelAgentic`, `refreshAskModels` cache hit/miss/AUTH MISSING).
- `tests/jarvis-dock.test.js` — model picker population and the omniroute
  send path (trace + proposals chip rendering), alongside the existing
  Claude-bridge-path tests (unchanged, still green).
- `tests/bridges-routes.test.js` — updated string-match assertions for the
  new wiring (`runAskAgent(`, the new `/api/ask/models` route).

## Validation

Stop the `:9150` process, run `FABLES-HOUSE.ps1 -Once`, then live
`POST /api/ask` twice (a repo-read question, a God's Eye question) and
`GET /api/ask/models`, plus `npx vitest run` — recorded in the session report.
