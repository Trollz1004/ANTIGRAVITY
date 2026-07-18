# Paperclip Agent Prompts — Opus-Crafted, Drop-in

**Paperclip's primary focus: marketing affiliate links for the YouAndINotAI date app.**
Runs on this laptop (T5500) using cloud models (OpenCode Zen free, OpenRouter free,
Ollama Cloud) to minimize local GPU compute.

## Cloud Model Architecture

All adapters (pi-adapter, hermes-adapter, opencode-adapter, paperclip-adapter) support:

| Provider | Auth Method | Free Tier |
|----------|-------------|-----------|
| OpenCode Zen | `/connect` → zen (OAuth) or API key | ✅ Free models available |
| Ollama Cloud | `OLLAMA_API_KEY` env var | ✅ Free tier |
| OpenRouter | `OPENROUTER_API_KEY` env var | ✅ Free models |
| Grok/xAI | `XAI_API_KEY` or `xai auth login` | ✅ Via OpenRouter free |
| OpenAI/GPT Codex | `OPENAI_API_KEY` or ChatGPT OAuth | ❌ Paid (API key) |
| Claude/Anthropic | `ANTHROPIC_API_KEY` or Claude OAuth | ❌ Paid (API key) |
| GitHub Copilot | Device code OAuth | ✅ With subscription |
| Google Gemini | `GEMINI_API_KEY` | ✅ Free tier (1M tok/day) |

## Files in this folder

### Role agents (business function)
| File | Agent | Recommended model |
|------|-------|-------------------|
| `hermes-agent.md` | Hermes Agent | glm-5.1:cloud (Ollama Cloud) |
| `cfo-prime.md` | CFO PRIME | ollama-cloud/[custom] |
| `cmo-marketing.md` | CMO | ollama-cloud/dateapp-marketing |
| `cto-builder.md` | CTO | qwen2.5-coder:7b (local) |
| `closer.md` | Closer | openrouter/meta-llama/llama-3.3-70b-instruct:free |

### Runtime / cloud model agents
| File | Agent | Default model | Cloud |
|------|-------|---------------|-------|
| `opencode-agent.md` | OpenCode Worker | qwen2.5-coder:7b (local) | Local |
| `pi-agent.md` | Pi Conversational | openrouter/openrouter/free | Cloud |
| `ollama-cloud-agent.md` | Ollama Cloud | glm-5.1:cloud | Cloud |
| `openrouter-agent.md` | OpenRouter Router | openrouter/free | Cloud |
| `gemini-agent.md` | Gemini | gemini-2.5-flash | Cloud |
| `grok-agent.md` | Grok/xAI | grok-4.5 (zen) | Cloud |
| `marketing-affiliate.md` | **Marketing Affiliate** | openrouter/openrouter/free | **Cloud** |

### Primary focus: Marketing Affiliate System
The `marketing-affiliate` agent generates affiliate links for YouAndINotAI date app
using cloud models. See `marketing-affiliates/` for link configs, campaigns, and tracking.

## Auth Methods for All Adaptors

Each adapter (`adapters/claude/*.json`) is configured to use:
- **opencode_zen** — free models via OpenCode Zen OAuth
- **ollama_cloud** — cloud hosted models via API key
- **openrouter** — free models via OpenRouter API key
- **xai_grok** — Grok via xAI API key or OpenRouter free
- **openai_gpt_codex** — GPT/Codex via API key or OAuth
- **anthropic_claude** — Claude via API key or OAuth
- **github_copilot** — GitHub Copilot via device OAuth
- **google_gemini** — Gemini via Google AI Studio API key

## What's in each prompt
- Identity + mission constants (#UNTILnoKIDinNEED baked in)
- Decision matrix (table-form thresholds)
- Output schema (forced structured response)
- One-shot example
- Self-check checklist
- Refusal rules
- Model routing table (cloud-first)
