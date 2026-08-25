# Paperclip connector wiring — judge-lane evidence packet

**Lane:** Claude judge (official Claude Code CLI, account auth).
**Date:** 2026-08-25.
**Node:** Sabretooth. **Host:** `http://127.0.0.1:3100` (Paperclip `paperclipai@2026.824.0`, PID 13972, started 03:31 local).
**Company:** `ANTIGRAVITY Marketing Co` (`ANT`), id `92223de0-b36b-4d63-93ca-50ebe5007e68`.

Every line below was observed against the running instance. Nothing here is inferred from a status colour.

## What "disconnected" actually meant

The Connectors panel listed all six servers from `~/.agents/mcp.json` as **disconnected**. The cause was not one thing, and none of it was the config file — that file parses and names the right six servers.

Paperclip's Connectors panel is Paperclip's **own governed tool broker**. It is not the same path a CLI lane uses. A CLI judge lane (Claude, Codex, Grok, Gemini) reads its own MCP config and speaks MCP itself; the broker is for Paperclip-native tool calls made by routines and board actions. The two can disagree, and here they did.

Direct evidence that the broker had spawned nothing: Paperclip's process had exactly one child — its embedded postgres. The four stdio MCP servers running on the box at the time were children of `claude.exe`, the CLI judge lane's own session.

## Root causes, one per connector

| Connector | Transport | Root cause | State |
|---|---|---|---|
| `brain-mcp` | local stdio | Admin template registered with `tools: []` → empty catalog | **FIXED — 8 tools** |
| `mission-mcp` | local stdio | Same, plus `HOME` never reached the child process | **FIXED — 11 tools** |
| `antigravity-files` | local stdio | Same | **FIXED — 14 tools** |
| `playwright` | local stdio | Same | **FIXED — 24 tools** |
| `omniroute` | remote HTTP | Protocol mismatch, both directions (below) | **BLOCKED** |
| `supabase` | remote HTTP | `OAuth credentials have expired and need to be reconnected.` | **BLOCKED — needs Joshua** |

### The stdio four — fixed

Paperclip will not run an arbitrary local command. A stdio connection must name an **approved template**, and a template carries its own declared tool list; the catalog is built from that list, not from asking the server. All four templates existed and were `active` with the correct `command` and `args`, but each declared `tools: []`. Paperclip therefore had a healthy connection exposing nothing, which the panel renders as disconnected.

A second defect rode along: `localStdioEnvironment` passes only `PATH`, `SystemRoot`, `WINDIR`, `COMSPEC`, `PATHEXT` plus the template's declared `envKeys`. `brain-mcp` and `mission-mcp` are configured in `mcp.json` with `HOME=C:\Users\joshi`, and `envKeys` was empty, so `HOME` was being dropped on every spawn.

Fix applied: each server was spawned directly, given a real `initialize` + `tools/list`, and its true descriptors captured. Those descriptors were registered as new templates (`brain-mcp-v2`, `mission-mcp-v2`, `antigravity-files-v2`, `playwright-mcp-v2`) with `envKeys` covering `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`; the connections were repointed and their catalogs refreshed.

New template ids were required because `templateKey` is unique per company and Paperclip exposes only create and disable — there is no update path, and create conflicts even against a disabled row.

Verified after the fix: 8 + 11 + 14 + 24 = **57 tools** in the catalog, where there had been zero.

**Runtime slots reading `stopped` is not a fault.** Paperclip spawns a stdio server per tool call and exits it; `healthStatus: ok`, `healthMessage: "Approved stdio template is ready."` is the ready state. Do not report a stopped slot as a red.

### OmniRoute — blocked, and not on credentials

Three independent paths were tested. All three are closed today.

1. **Streamable HTTP (current config).** Paperclip's catalog refresh POSTs a bare `tools/list` with no `initialize` and no session. OmniRoute answers `400 {"code":-32000,"message":"Bad Request: Mcp-Session-Id header is required"}`. OmniRoute's transport is stateful; Paperclip's remote client is stateless.
2. **stdio.** `omniroute --mcp` is the real entry point, and it crashes before serving: `SyntaxError: Unexpected reserved word` at `omniroute/dist/open-sse/mcp-server/server.js:61751` — an `await init_auth()` inside a non-async esbuild `__esm` module initializer. That is an upstream packaging bug in `omniroute@3.8.49`. `omniroute mcp` with no dashes is a command group that prints help; it is not a server.
3. **SSE.** `/api/mcp/sse` returns the same session-id error.

Credentials were ruled out explicitly. A direct `initialize` against `http://127.0.0.1:20128/api/mcp/stream` with the bearer token returns `200` and `serverInfo {"name":"omniroute","version":"1.8.1"}`. The same call without the header returns `401 AUTH_001`. The existing `omniroute_api_key` company secret was bound to the connection as an `Authorization` header credential both with and without a `Bearer ` prefix; the failure did not change, because the request never gets as far as auth.

Paperclip's private-network guard is **not** the blocker either: `allowPrivateRemoteEndpoints()` returns true for any deployment that is not both authenticated and public, so a loopback endpoint is permitted on this local install.

The fix belongs upstream — Paperclip performing an MCP handshake before `tools/list`, or OmniRoute accepting a stateless request. Nothing in this repo should paper over it, and no token belongs in a Paperclip config row.

**This does not affect the CLI judge lanes.** They handshake correctly and reach OmniRoute normally.

### Supabase — blocked on a human action

`OAuth credentials have expired and need to be reconnected.` Reconnecting is an OAuth consent flow and is Joshua's to click; an agent must not grant it.

## Judge lane state (Paperclip agents)

| Lane | Adapter | Model | State | Evidence |
|---|---|---|---|---|
| Claude Judge | `claude_local` | `claude-opus-4-8` | **running** | 7 succeeded heartbeat runs, one in flight |
| Codex Judge | `codex_local` | `gpt-5.6-sol` | idle | 10 succeeded |
| Grok Judge / Grok Judge 2 | `grok_local` | `grok-4.6` | idle | no failures recorded |
| Gemini Judge | `gemini_local` | `auto` | **error** | 12 consecutive failures, `adapter_failed` |
| OpenCode | `opencode_local` | — | error | policy, not a fault (below) |
| ox-alpha | hermes gateway | — | error | no inference provider configured |

**Gemini Judge — `The command line is too long.`** The `gemini_local` adapter runs non-interactively with `--prompt` rather than stdin, so the whole prompt goes on the command line and hits the Windows ~8191-character limit. This is the cause behind `ANT-144` and `ANT-149`. It is an adapter-side limit, not a credential or model problem.

**OpenCode — `Access denied outside allowed hours (08:00–18:00 America/New_York)`.** Working as configured. Runs attempted outside the window fail by design; this is a false red on the board and should not be chased.

**ox-alpha — `No inference provider configured`** from the Hermes gateway. Needs a provider selected in `~/.hermes/.env`.

## Skills — loaded, despite what the Paperclip store shows

The Claude judge lane declares 15 `desiredSkills`. Paperclip's own skill store for this company (`~/.paperclip/instances/default/skills/<company>/local`) is **empty**, and the agent directory holds only `instructions/AGENTS.md`. That looks like a failure and is not one.

The lane runs the official Claude Code CLI with `cwd = C:/ANTIGRAVITY`, so it loads the repository's skills directly. Every one of the 15 desired skills is present in `.agents/skills/` (87 skills), alongside `.claude/skills/` (22). Confirmed by direct check: `mission-control`, `tdd`, `test-driven-development`, `verification-before-completion`, `requesting-code-review`, `self-improving-agent`, `brainstorming`, `browser-use`, `agent-reach`, `agent-browser`, `i-have-adhd` all resolve.

Paperclip's skill-sync bookkeeping and the CLI's actual skill loading are separate mechanisms. The function is satisfied; the bookkeeping is cosmetic.

## Secret handling

`~/.agents/mcp.json` carries a live OmniRoute bearer token. It sits outside the repository and must stay there. No token, header value, or secret id from that file belongs in a commit, a Paperclip config row, or a stdio template argument.

## Reproducing any of this

Read-only checks against the running instance:

```
GET  /api/companies/<companyId>/tools/connections
GET  /api/companies/<companyId>/tools/stdio-templates
GET  /api/companies/<companyId>/tools/runtime-health
GET  /api/companies/<companyId>/tools/runtime-slots
GET  /api/tool-connections/<connectionId>/catalog
```

Mutations used for the fix, in order: `POST .../tools/stdio-templates`, `PATCH /api/tool-connections/<id>`, `POST /api/tool-connections/<id>/catalog/refresh`.
