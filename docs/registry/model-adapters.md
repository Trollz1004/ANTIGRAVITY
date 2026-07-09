# Model Adapter Registry

This registry documents authority and ID rules. It does not store secrets.

## Model ID format

Default model IDs use `provider/model`.

Exceptions:

- Pi may require adapter-specific strings such as `Ollama.minimax3.cloud` when its local adapter expects that shape.
- Browser-auth tools use their own login/session and should be recorded as `browser/<tool>` rather than treated as API routes.
- OpenCode Codex-shaped routes should stay Codex-specific, for example `opencode/gpt-5.3-codex` or `openrouter/openai/gpt-5.3-codex`.
- Vercel AI Gateway can route provider/model IDs and provider fallback order when explicitly configured with its own approved key.

## Authority tiers

| Adapter | Role | Decision authority |
|---|---|---|
| Codex | coding, repo integration, final review when assigned | may decide implementation under Joshua approval |
| Claude CEO / FCC-Claude | code, compliance, PR/payment gates | may propose; doctrine/payment/public-copy gates require approved lane/Joshua |
| Hermes | growth, support, research, memory, routing | proposals and triage; no doctrine/payment/public-copy decisions |
| OpenCode | code search and bounded helper edits | proposals unless explicitly assigned |
| Ollama | local support, summaries, tests, batch work | evidence/proposals only |
| NVIDIA/OpenRouter/cloud | overflow model capacity | evidence/proposals unless approved lead model |
| Pi | conversational/explanatory worker | no doctrine/payment/public-copy decisions |
| OpenClaw/ClawX | support tickets | support-only, no policy/payment/business-control decisions |
| Browser/no-tool agent | browser evidence and draft proposals | no direct repo writes; uses read-only skill/task mirrors |

## Required registry fields

Each adapter manifest or runbook entry should include:

- `platform`
- `node`
- `endpoint`
- `access_mode`
- `auth_class`
- `health_probe`
- `auto_dispatch`
- `manifest_path`
- `wake_shape`
- `env_requirements`
- `decision_authority`

Secret values are never included.
