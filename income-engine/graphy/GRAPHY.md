# GRAPHY — income-engine
# Company: CLAUDE's Antigravity (AidoesitAll)
# Node: 9020 | Repo: Trollz1004/income-engine
# Last updated: 2026-05-07

## PROJECT GRAPH

```
income-engine (C:/income-engine)
│
├── CORE MISSION
│   └── Lead generation pipeline → revenue → survival + kids
│       #MANUSFORTHEKIDS #UNTILNOKIDINNEED
│
├── STACK
│   ├── Frontend: React 19 + tRPC + Tailwind (OpenClaw/ManusClaw)
│   ├── Backend: Express + tRPC + tsx (Node)
│   ├── ORM: Drizzle + MySQL
│   └── Build: Vite + esbuild
│
├── PROVIDERS (all isolated to this repo)
│   ├── Ollama (local 11434) — qwen2.5:7b primary
│   ├── Ollama Cloud — OLLAMA_API_KEY
│   ├── OpenRouter — multi-model passthrough
│   ├── OpenCode — sk-VZgizJ... 
│   ├── Claude API — ANTHROPIC_API_KEY
│   ├── Codex (GPT-4o-mini) — OPENAI_API_KEY
│   └── Hermes (GLM-5.1) — via hermes-router
│
├── AGENTS (income-engine Paperclip only)
│   ├── ceo-income — orchestrates, heartbeat 5min
│   └── fetcher — scans Reddit/Upwork/Fiverr for leads
│
├── KEY SERVICES
│   ├── OpenClaw UI — port 3000
│   ├── Paperclip (income-engine) — port 3101 (NOT 3100 — that's Sabretooth)
│   └── Ollama — port 11434
│
└── THE WALL
    └── NEVER: Antigravity, Trollz1004, Sabretooth, port 3100 Paperclip
```

## NODE MAP (9020 only)
```
C:/income-engine   ← THIS REPO
C:/Antigravity     ← OFF LIMITS (wall)
D:/OPUSONLY        ← dashboard (separate)
D:/support-claw    ← support bot (separate)
```

## PROVIDER MODEL ROUTING
| Virtual Name | Real Model              | Provider     |
|-------------|-------------------------|--------------|
| ceo         | claude-sonnet-4-6       | Anthropic    |
| code        | qwen2.5:7b              | Ollama local |
| fast        | qwen2.5:7b              | Ollama local |
| cloud       | Ollama Cloud model      | Ollama Cloud |
| router      | auto (cheapest capable) | OpenRouter   |
| codex       | gpt-4o-mini             | OpenAI/OpenCode |
| hermes      | GLM-5.1                 | Hermes       |

## PENDING
- [ ] pnpm install
- [ ] MySQL DB setup (income_engine db)
- [ ] Paperclip fresh install (port 3101)
- [ ] Ruflo plugin configured
- [ ] PAT rotation (AidoesitAll)
- [ ] Graphy auto-update on file change
