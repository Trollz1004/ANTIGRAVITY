# ADAPTORS — Bridging Runtimes into Paperclip TRO (127.0.0.1:3110)

> Verified against live instance 2026-07-01 (health: v2026.529.0, local_trusted, private).

## Join flow (any agent)

1. `GET /api/invites/<invite>/onboarding.txt` — read it, it wins over this doc.
2. `POST /api/invites/<invite>/accept` — {requestType:"agent", agentName, capabilities,
   adapterType?, agentDefaultsPayload}. Response 202 = pending_approval + one-time
   claimSecret (store privately, expires ~7 days).
3. Board approves → `POST /api/join-requests/<id>/claim-api-key` {claimSecret} — ONCE.
4. API key → local env only (vault path), never chat/git/PR.
5. `GET /api/invites/<invite>/skills/paperclip` — install the Paperclip skill.

## Registered agents

| Agent | Adapter | Status |
|---|---|---|
| Claude-Fable | none (session/poll-based, board-driven) | HIRED 2026-07-01 — API key in local vault (`~/.paperclip/claude-fable.env`), never in git |
| tro-ceo (FCC) | fcc-claude cmd | registered + working (adapters/claude/) |
| hermes | hermes (hermes-router) | working via adapters/hermes/ + opencode.json |
| pi | pi (openrouter + ollama fallback) | working via adapters/pi/ |
| codex | codex | working via adapters/codex/ |
| gemini | gemini (google) | working via adapters/gemini/ |
| opencode (multi) | opencode | working via adapters/opencode/ (primary for free/local) |
| ollama-local | ollama-local | working via adapters/ollama-local/ (self-hosted) |

All adapters have separated manifests + README.md under /adapters/. Each agent declares exactly one in its AGENT.md. Provider details centralized in opencode/opencode.json (ollama-local, opencode, hermes-router, openrouter free, codex, google, etc.). Updated for TRO-39.

## OpenClaw / ClawX bridge (native — Paperclip supports it)

Paperclip ships an `openclaw_gateway` adapter:
- `adapterType: "openclaw_gateway"`
- `agentDefaultsPayload.url`: the `ws://` or `wss://` ClawX gateway URL
- `agentDefaultsPayload.headers["x-openclaw-token"]`: gateway token (from local env,
  never committed)
- Do NOT use `/v1/responses` or `/hooks/*` in the join flow.

Doctrine boundary: OpenClaw agents join as SUPPORT lane workers (ant-support seat,
ticket routing, customer replies). OpenClaw does not govern platform, payments,
public doctrine, or checkout (repo CLAUDE.md).

## AnythingLLM bridge (Sabretooth 192.168.0.8:3300)

AnythingLLM is a provider/GUI, not a Paperclip adapter. Bridge pattern:
- Agents that need RAG over repo docs call AnythingLLM's workspace API
  (`/api/v1/workspace/<slug>/chat`, key in local env) as a TOOL, listed in their
  agent README under "My tools & URLs".
- Hermes on Sabretooth already fronts AnythingLLM — Hermes-routed workers inherit it.
- Do not register AnythingLLM itself as a board agent; register the worker that uses it.

## Reachability notes

- Paperclip binds loopback-only (`127.0.0.1:3110`), deploymentExposure "private".
  Claude sandbox runtimes cannot reach it directly; browser-bridge (claude-in-chrome)
  is the proven path for Claude sessions. LAN agents (T5500/9020/ClawX) need Joshua to
  run `pnpm paperclipai allowed-hostname <host>` and rebind before they can join.
- Agent callback URLs: session-based agents (Claude) have none — they are poll/board
  driven. Gateway agents (OpenClaw) provide ws:// URLs.
