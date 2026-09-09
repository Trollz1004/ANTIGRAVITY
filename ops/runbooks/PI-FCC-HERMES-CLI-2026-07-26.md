# Pi / FCC / Hermes CLI — Verified Commands

## Pi Binary

- Repo-local: `bin/pi` (v0.71.1)
- Global: `C:\Users\joshl\AppData\Roaming\npm\pi`

## Providers

- OpenCode: local Ollama `ornith:9b` via `http://127.0.0.1:11434/v1`
- OpenRouter free: `openai/gpt-oss-120b:free`, `deepseek/deepseek-v4-flash:free`, `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-nano-9b-v2:free`, `z-ai/glm-4.5-air:free`, `minimax/minimax-m2.5:free`
- Gemini: `gemini-2.5-flash` via Gemini CLI auth
- Grok: `grok-build-0.1` via xAI SuperGrok OAuth
- OpenAI: CLI auth, Bucket 1 only
- **No Claude API / no Anthropic key** — hard wall

## Hermes Model Routing (hermes-config.json)

- Primary: `grok-build-0.1`
- Fallback chain: OpenRouter free → Gemini → OpenCode local Ollama
- Pi adapter: use `bin/pi --provider ollama --model ornith:9b -p "<task>"` in wrappers

## FCC = Free-Claude-Code via OpenRouter Only

- No `:8082` proxy
- No Anthropic API
- Models: `openrouter/nvidia/nemotron-3-super-120b-a12b:free` and siblings
- Config: `adapters/claude/fcc-claude-adapter.json`, `services/omni-router/.env.example`

## Exact CLI Examples

- `cd E:\ANTIGRAVITY && bin\pi --provider ollama --model ornith:9b -p "list frontend routes"`
- `cd E:\ANTIGRAVITY && bin\pi --offline --no-tools --no-extensions --no-skills --provider openrouter --model openai/gpt-oss-120b:free -p "ping"`
- Hermes CLI invokes pi for coding tasks via configured adapter; no separate pi setup needed

## Paperclip Verification

- Verify pi: `bin\pi --version` and `bin\pi --help`
- Verify Hermes router: check `hermes-config.json` fallback providers list
- Verify FCC: check `adapters/claude/fcc-claude-adapter.json` provider == openrouter
