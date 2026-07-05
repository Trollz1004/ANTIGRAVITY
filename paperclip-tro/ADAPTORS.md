# ADAPTORS — Two-CEO PaperclipAI / Agent Hub runtime

> Updated 2026-07-05 by Joshua directive.
> The active PaperclipAI mission-control surface has two standing CEO lanes:
> Claude CEO and Hermes CEO. Other models/tools are capabilities or temporary
> subagents under those CEOs, not standing PaperclipAI agents.

## Active lanes

| Lane | Adapter | Runtime | Purpose |
|---|---|---|---|
| `claude-ceo` | `fcc-claude` / Claude CLI when available | FCC admin `:8082`, Claude CLI/browser | Code, compliance, doctrine, payments, merge/push, PR gates |
| `hermes-ceo` | `hermes` | Hermes workspace `:3000`, Hermes dashboard `:9119` | Growth, support, research, external APIs, leads, workspace memory |

## Canonical local surfaces

| Surface | URL | Role |
|---|---|---|
| PaperclipAI HQ | `http://127.0.0.1:3110` | Human-facing board, CEO cockpit, routines, evidence |
| Agent Hub | `http://127.0.0.1:3130` | Canonical task/orchestration backend |
| Paperweight Mission Control | `http://127.0.0.1:4200` | Optional fallback/local viewer |
| Hermes Workspace | `http://127.0.0.1:3000` | Human/operator workspace UI |
| Hermes Dashboard | `http://127.0.0.1:9119` | Hermes status/API/work feed |
| FCC admin | `http://127.0.0.1:8082/admin` | Claude/FCC helper lane when explicitly used |

PaperclipAI may consume Agent Hub and Hermes feeds, but it must remain secret-free
and must not expose private reserve/tax/accounting doctrine to every connected AI.

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

## Claude/FCC helper

FCC-Claude may be used as the Claude CEO execution lane when Josh explicitly wants
browser-controlled or free-tier execution. It is still a helper/runtime, not a new
third CEO.

- FCC proxy/admin: `http://127.0.0.1:8082/admin` when available.
- Browser-visible execution preferred so Claude/Hermes can inspect the same work.
- No Anthropic API key is required for FCC mode.
- Any FCC-Claude output is evidence/proposal until Claude CEO or Joshua verifies it.

## Codex helper

Codex may be joined to PaperclipAI as a task-specific helper with
`adapterType: codex_local`. It is not a third CEO lane. Use OpenAI/Codex auth
sign-in, `cwd: C:\antigravity`, and `model: codex-mini-5.3`.

Codex helper work reports evidence back to Claude CEO, Hermes CEO, or Joshua.

## OpenCode fallback ladder

OpenCode helpers use `adapterType: opencode_local`. The fallback ladder is:

1. `ollama-local/*` for zero-cloud local coding and support work.
2. `ollama-cloud/*` for Joshua-owned cloud models when local capacity is not enough.
3. `openrouter/*:free` for free cloud fallbacks.
4. `openai/gpt-5.5-pro`, Grok, Gemini, or other paid/auth lanes only when the
   active CEO or Joshua explicitly chooses quality over cost.

## Browser/localhost resources

PaperclipAI can show that a CEO lane used local/browser tools without registering
them as agents. Examples:

| Resource | URL | Role |
|---|---|---|
| ChatPlayground | `https://www.chatplayground.ai/` / purchased StackSocial lifetime account | Browser AI cockpit for model comparison/drafting/review |
| Hermes Workspace | `http://127.0.0.1:3000` | Human/operator UI |
| Hermes Dashboard | `http://127.0.0.1:9119` | Hermes status/API/work feed |

ChatPlayground is localhost/browser material for Hermes to use. It is not an OpenAI-compatible relay and does not need to be.

## Inactive legacy adapters

The previous roster registered Codex, Grok, Gemini, Pi, OpenCode, Ollama,
OpenClaw, and support workers as standing Paperclip agents. That is now inactive
by default.

Claude CEO or Hermes CEO may still call those runtimes through built-in tools, CLI
auth, browser sessions, MCP, or temporary subagents for a concrete task.
PaperclipAI should record the CEO-owned task and timestamped evidence rather than
creating a permanent worker seat.

## Rule

Two visible accountable owners: Claude CEO and Hermes CEO. Many tools/skills are
allowed. Permanent agent sprawl is not.
