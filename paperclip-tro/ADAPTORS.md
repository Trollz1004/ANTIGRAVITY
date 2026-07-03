# ADAPTORS — Hermes-only Paperclip runtime

> Updated 2026-07-03 by Joshua directive.
> Paperclip has one active agent: Hermes CEO. Other models/tools are capabilities Hermes can use, not standing Paperclip agents.

## Active adapter

| Agent | Adapter | Paperclip adapterType | Runtime | Purpose |
|---|---|---|---|---|
| hermes-ceo | `hermes` | `pi_local` | Hermes Agent CLI/dashboard | CEO/operator brain; loads skills, uses tools/APIs, spawns temporary subagents when useful |

Hermes status/feed is visible through local port `9119`:

- Dashboard/API status: `http://127.0.0.1:9119/api/status`
- Workspace UI: `http://127.0.0.1:3000`
- Mission Control/Paperclip visual surface may consume the same Hermes work/status feed.

## Adapter config source

Use `adapters/hermes/manifest.yaml` as the active manifest. The important fields are:

```yaml
paperclip_adapter_type: "pi_local"
paperclip_adapter_config:
  cwd: "C:\\antigravity"
  model: "openai/gpt-5.5-pro"
  thinking: "high"
paperclip_alias: "hermes"
```

If a wake payload is large, use `adapters/hermes/env-aware-prompt-template.txt` and pass Paperclip wake details through env variables instead of a giant command-line prompt.

## Optional helper: FCC-Claude

FCC-Claude may be used as a task helper or browser-controlled CEO hand when Josh explicitly wants it. It is not a required permanent Paperclip agent.

If used, keep it under Hermes/Opus monitoring:

- FCC proxy/admin: `http://127.0.0.1:8082/admin` when available.
- Browser-visible execution preferred so Hermes/Opus can inspect the same work.
- No Anthropic API key is required for FCC mode.
- Any FCC-Claude output is evidence/proposal until Hermes verifies it.

## Browser/localhost resources

Paperclip can show that Hermes used local/browser tools without registering them as agents. Examples:

| Resource | URL | Role |
|---|---|---|
| ChatPlayground | `https://www.chatplayground.ai/` / purchased StackSocial lifetime account | Browser AI cockpit for model comparison/drafting/review |
| Hermes Workspace | `http://127.0.0.1:3000` | Human/operator UI |
| Hermes Dashboard | `http://127.0.0.1:9119` | Hermes status/API/work feed |

ChatPlayground is localhost/browser material for Hermes to use. It is not an OpenAI-compatible relay and does not need to be.

## Inactive legacy adapters

The previous roster registered Codex, Grok, Gemini, Pi, OpenCode, Ollama, OpenClaw, and support workers as standing Paperclip agents. That is now inactive by default.

Hermes may still call those runtimes through built-in tools, CLI auth, browser sessions, MCP, or subagents for a concrete task. Paperclip should record the Hermes-owned task and timestamped evidence rather than creating a permanent worker seat.

## Rule

One visible accountable owner: Hermes CEO. Many tools/skills are allowed. Permanent agent sprawl is not.
