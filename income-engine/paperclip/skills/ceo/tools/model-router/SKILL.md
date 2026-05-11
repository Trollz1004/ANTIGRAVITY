---
name: "model-router"
description: "CEO tool: route chat to best available model with fallback chain."
version: "1.0.0"
category: "ceo"
---

# Model Router Tool

## Purpose
Route every chat message to the best available provider. Never fail silently — always try fallbacks.

## Fallback Chain (in order)
1. Ollama local (qwen2.5:7b, port 11434) — free, fast
2. Ollama Cloud (OLLAMA_API_KEY) — cloud models
3. OpenRouter (OPENROUTER_API_KEY) — cheapest capable model
4. OpenCode (OPENCODE_API_KEY) — sk-VZgiz...
5. Claude API (ANTHROPIC_API_KEY) — claude-sonnet-4-6, use sparingly
6. Codex/OpenAI (OPENAI_API_KEY) — gpt-4o-mini fallback

## Rules
1. Always try Ollama local first — it's free and on 9020
2. Never use Claude API for routine tasks — it costs money
3. If all providers fail: return honest error, never mock a response
4. Log provider used in every message metadata

## Inputs
- { provider, model, messages[], systemPrompt? }

## Outputs
- { content, provider_used, model_used, tokens, latency_ms }
