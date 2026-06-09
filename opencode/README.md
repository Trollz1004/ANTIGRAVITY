# OpenCode Multi-Provider Setup

Drop-in config wiring all providers through OpenCode CLI:

| Provider       | Use for                                       | Cost                 |
| -------------- | --------------------------------------------- | -------------------- |
| Anthropic Max  | Opus 4.7 closer, orchestration                | Your Max sub         |
| OpenAI         | GPT-5, o3 reasoning                           | Pay-per-token        |
| Google Gemini  | 2.5 Pro / Flash (FREE 1M tok/day)             | Free tier first      |
| Nous Research  | Hermes-4 405B / 70B / 36B                     | Portal account       |
| Ollama Cloud   | CFO + Hermes Prime + Kimi + GLM               | Cloud sub            |
| Local Ollama   | Qwen-Coder, Llama 3.2 (free, unlimited)       | $0                   |
| Hermes Router  | Auto-fallback across all of the above on 429  | $0 routing layer     |

The hermes-router referenced here is the canonical one at `services/hermes-router/`
in this repo (NOT a separate implementation). All routing virtual-model names
(`hermes`, `hermes-deep`, `cfo`, etc.) resolve through that service on `localhost:11435`.

## Setup (one-time)

Elevated PowerShell on Sabertooth:

```powershell
setx ANTHROPIC_API_KEY "sk-ant-..."
setx OPENAI_API_KEY    "sk-..."
setx GEMINI_API_KEY    "..."             # https://aistudio.google.com/apikey
setx NOUS_API_KEY      "..."
setx OLLAMA_API_KEY    "..."
```

Close + reopen the terminal so vars load.

## Install

```cmd
npm install -g opencode-ai
cd C:\ANTIGRAVITY
# opencode picks up project-local opencode.json automatically when run from this dir
```

## Use

```cmd
opencode                                              REM TUI w/ provider switcher
opencode run "build a landing page"                   REM uses default: hermes-router/hermes
opencode run --model anthropic/claude-opus-4-7 "close this gig"
opencode run --model google/gemini-2.5-flash "quick task"   REM FREE tier
opencode run --model hermes-router/cfo "score this lead"
```

## Built-in Agents

- `orchestrator` — Opus 4.7, plans + delegates
- `closer` — Opus 4.7, max-quality demos + proposals
- `hunter` — Hermes-fast, cheap gig scanning
- `cfo` — CFO model w/ fallback, revenue gating
- `coder` — Local Qwen first, falls through to Hermes 70B

Invoke from inside a session: `@orchestrator plan this` / `@closer build the demo`.

## When Claude Max Throttles

Flip default model to `hermes-router/hermes-deep` (Hermes-4-405B). Closest open peer
to Opus. Zero quota anxiety.
