# FCC Free NVIDIA — 2026-07-26

## Rule
No real Claude outside Claude.ai. Free-Claude-Code via FCC means: OpenRouter free tier + NVIDIA Nemotron models, no local `:8082` proxy, no Anthropic API key.

## Verified Free NVIDIA Models (OpenRouter)
- `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`
- `openrouter/nvidia/nemotron-3-super-120b-a12b:free`
- `openrouter/nvidia/nemotron-3-nano-30b-a3b:free`
- `openrouter/nvidia/nemotron-nano-9b-v2:free`

## Repo Files Updated
- `adapters/claude/fcc-claude-adapter.json` — provider = OpenRouter, free NVIDIA defaults
- `services/omni-router/.env.example` — disable legacy `:8082` proxy, enable OpenRouter free path
- `.agents/memory/shared/decisions.md` + `open-issues.md` — retires proxy runbook

## CLI Commands
1) Pi noninteractive wrapper
- `pi --offline --no-tools --no-extensions --no-skills --no-session --provider ollama --model ornith:9b --print "<task>"`

2) Hermes fallback chain (from `hermes-config.json`)
- Local Ollama first: `ornith:9b`
- Then OpenRouter free: `openai/gpt-oss-120b:free`, `nvidia/nemotron-nano-9b-v2:free`, `z-ai/glm-4.5-air:free`, `minimax/minimax-m2.5:free`
- No Anthropic key used anywhere in Hermes router.

3) OpenAI-compatible direct call (optional)
- `curl https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" -d '{"model":"openrouter/nvidia/nemotron-3-super-120b-a12b:free","messages":[{"role":"user","content":"ping"}]}'`

## Dead Artifacts Retired
- `scripts/fcc-server-start.*`
- `scripts/fcc-server-stop.*`
- `scripts/fcc-claude.*`
- `scripts/cli-fcc.sh`
- `ops/paperclip-runtime/load-fcc-provider-env.ps1`

Note: legacy `scripts/*` files remain in repo history but are no longer referenced. Wrapper/CLI changes only; no date-app code edits.
