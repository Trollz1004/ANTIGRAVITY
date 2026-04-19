# Copilot CLI + Ollama Local Executor for Paperclip

## Purpose
Run GitHub Copilot CLI agentic workflows through Sabretooth's local Ollama instance.
Zero API cost. Zero cloud calls. Full air-gap capability.

## Setup (Sabretooth)
```bash
export COPILOT_PROVIDER_BASE_URL=http://localhost:11434
export COPILOT_MODEL=qwen2.5:7b
export COPILOT_OFFLINE=true
copilot
```

## Why
- Paperclip agents can use Copilot CLI as a free local executor
- Heartbeat checks, file reads, code review — all on GTX 1070
- No Anthropic/OpenAI token burn for routine tasks
- Fully offline/air-gapped when COPILOT_OFFLINE=true

## Node Compatibility
| Node | Ollama | Model | Copilot CLI Ready |
|------|--------|-------|-------------------|
| SABRETOOTH | 127.0.0.1:11434 | qwen2.5:7b | YES |
| 9020 | 127.0.0.1:11434 | qwen2.5:7b | YES (cold-start) |
| T5500 | 127.0.0.1:11434 | qwen2.5:7b | YES (cold-start) |
