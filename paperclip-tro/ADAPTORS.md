# ADAPTORS — Bridging Runtimes into Paperclip TRO (127.0.0.1:3110)

> Updated 2026-07-03 — adapter type mapping, FCC as `claude_local`, availability checks.

## Join flow (any agent)

1. `GET /api/invites/<invite>/onboarding.txt` — read it, it wins over this doc.
2. `POST /api/invites/<invite>/accept` — {requestType:"agent", agentName, capabilities,
   adapterType?, agentDefaultsPayload}. Response 202 = pending_approval + one-time
   claimSecret (store privately, expires ~7 days).
3. Board approves → `POST /api/join-requests/<id>/claim-api-key` {claimSecret} — ONCE.
4. API key → local env only (vault path), never chat/git/PR.
5. `GET /api/invites/<invite>/skills/paperclip` — install the Paperclip skill.

## Adapter type mapping

Every repo adapter maps to a Paperclip `adapterType`. This is the key agents use
when registering via the Paperclip API (`POST /api/companies/:id/agent-hires`).

| Repo Adapter | Paperclip `adapterType` | CLI | Default Model | Health Check |
|---|---|---|---|---|
| `claude` (FCC) | `claude_local` | `fcc-claude` | claude-sonnet-4-5-* | adapters/claude/health-check.ps1 |
| `codex` | `codex_local` | `codex` | o4-mini | codex --version |
| `hermes` | `pi_local` | `hermes` | openai/gpt-5.5-pro | hermes --version |
| `pi` | `pi_local` | `pi` | openrouter/free | pi --version |
| `opencode` | `opencode_local` | `opencode` | hermes | opencode --version |
| `ollama-local` | `opencode_local` | `opencode` | qwen2.5-coder:7b | curl localhost:11434 |
| `gemini` | `opencode_local` | `gemini` | gemini-2.5-pro | opencode --version |
| `ant-support` | `openclaw_gateway` | ClawX | openai/gpt-5.5 | ws:// gateway check |

Each adapter has a `manifest.yaml` with `paperclip_adapter_type` and `paperclip_adapter_config`
fields that provide the exact JSON to use when creating agents in Paperclip.

## FCC as `claude_local` adapter

FCC-claude works as a Paperclip `claude_local` adapter by injecting environment
variables that redirect Claude Code to the FCC proxy. Any agent can use it.

```json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "C:\\antigravity",
    "model": "claude-sonnet-4-5-20250929",
    "env": {
      "ANTHROPIC_BASE_URL": "http://127.0.0.1:8082",
      "ANTHROPIC_AUTH_TOKEN": "freecc",
      "CLAUDE_CONFIG_DIR": "C:\\Users\\joshl\\.claude-fcc",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192"
    }
  }
}
```

Paperclip thinks it talks to real Claude Code. The FCC proxy intercepts and routes
to free providers. No Anthropic API key involved.

## Registered agents

| Agent | Adapter | adapterType | Status |
|---|---|---|---|
| Claude-Fable | none (session-based) | — | HIRED 2026-07-01, poll/board driven |
| tro-ceo (FCC) | fcc-claude | `claude_local` | registered + working (adapters/claude/) |
| hermes | hermes (hermes-router) | `pi_local` | working via adapters/hermes/ |
| pi | pi (openrouter + ollama) | `pi_local` | working via adapters/pi/ |
| codex | codex | `codex_local` | working via adapters/codex/ |
| gemini | gemini (google) | `opencode_local` | working via adapters/gemini/ |
| opencode (multi) | opencode | `opencode_local` | working via adapters/opencode/ |
| ollama-local | ollama-local | `opencode_local` | working via adapters/ollama-local/ |
| ant-support | openclaw_gateway | `openclaw_gateway` | support lane (adapters N/A) |

All adapters have separated manifests under /adapters/. Each manifest declares
`paperclip_adapter_type` and `paperclip_adapter_config`. Provider routing
centralized in opencode/opencode.json.

## Adapter availability (health checks)

All adapters declare a `health_check` command in their manifest. The CEO wheel
runs `scripts/check-adapter-health.ps1` to scan all adapters, validate health,
and cross-reference providers against opencode.json.

For FCC specifically:
```powershell
pwsh -NoProfile -File C:\antigravity\adapters\claude\health-check.ps1 -Json
```

Returns structured JSON: `{adapter, type, proxy_up, fcc_cli, config_dir, status, message}`.
Agents can call this before attempting work to verify the API is available.

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
