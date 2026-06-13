# CEO Tools — Paperclip Pi Runtime

## Runtime Tooling

- Runtime adapter: `pi_local`.
- Pi command wrapper: `/home/josh/.paperclip/bin/pi-paperclip`.
- Real Pi executable behind wrapper: `/mnt/c/Users/joshl/AppData/Roaming/npm/pi`.
- Working directory: `/mnt/c/antigravity`.
- Paperclip API: `http://127.0.0.1:3100`.

## Why the Wrapper Exists

Paperclip probes Pi by running `<command> --list-models` with a 20 second timeout. The real Windows npm Pi executable can hang during provider/auth metadata discovery. The wrapper returns a fast, deterministic, Paperclip-parseable model table for discovery, then delegates all non-discovery commands to real Pi unchanged.

## Model Discovery Entries

The wrapper advertises these routable IDs to Paperclip:

- `openai-codex/gpt-5.5` — primary CEO / heavy reasoning.
- `xai/grok-4.20-0309-reasoning` — primary paid Grok reasoning lane.
- `xai/grok-4.4` — Grok compatibility alias if this is the local configured ID.
- `ollama-cloud/qwen2.5:7b` — cloud/local fallback lane.
- `ollama/gemma4:e2b` — local Ollama fallback observed installed.
- `ollama/gemma4:31b-cloud` — Ollama cloud model observed installed.
- `ollama/hectron_genesis` — local model observed installed.
- `openrouter/moonshotai/kimi-k2.6` — last-resort OpenRouter lane.
- `opencode/kimi-k2.6` — free/opencode fallback lane.
- `opencode-go/qwen3.6-plus` — free/opencode-go fallback lane.

## Available Pi Tools

Pi supplies file and shell tools equivalent to:

- read files
- run bash commands
- edit files
- write files
- grep/search
- find/list files

Use file edits only where the current agent is allowed to write. Respect Antigravity protected file rules.

## External Tools / Services

- Paperclip control plane: internal task routing, agents, companies, issues, routines.
- Ollama: local/cloud fallback models.
- OpenAI Codex: primary CEO model via signed-in Pi/OpenAI Codex setup.
- xAI/Grok: paid lane; sign-in/auth path preferred where available, no secrets in prompts.
- OpenRouter / OpenCode: fallback lanes only.
- Playwright MCP: browser automation when available from repo MCP config.
- Mission MCP / Brain MCP: repo-side memory/orchestration when available.

## Secrets Rule

Never print API keys, OAuth tokens, cookies, login secrets, vault lines, or full env values. It is acceptable to name required variables and where the operator should configure them.
