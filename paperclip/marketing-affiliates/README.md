# Paperclip — Marketing Affiliate Link System

**Primary focus: YouAndINotAI date app affiliate marketing.**

Paperclip on this laptop (T5500) generates, tracks, and optimizes marketing affiliate
links for the YouAndINotAI dating platform. Uses cloud models (OpenCode Zen free,
Ollama Cloud, OpenRouter free) to minimize local compute on the T5500 GTX 1050 Ti.

## Affiliate Link Structure

Base affiliate links for YouAndINotAI:
- `https://youandinotai.com/?ref={AFFILIATE_ID}`
- `https://app.youandinotai.com/?ref={AFFILIATE_ID}`
- Square checkout with affiliate tracking: `https://square.link/u/Qc5mxUy7?ref={AFFILIATE_ID}`

## Cloud Model Routing

| Task | Model | Provider | Cost |
|------|-------|----------|------|
| Generate affiliate content | openrouter/openrouter/free | OpenRouter | Free |
| SEO-optimized link copy | opencode/deepseek-v4-flash-free | OpenCode Zen | Free |
| Campaign strategy | openrouter/meta-llama/llama-3.3-70b-instruct:free | OpenRouter | Free |
| Adversarial review | opencode/grok-4.5 | OpenCode Zen | Free |
| A/B test copy | ollama-cloud/glm-5.1:cloud | Ollama Cloud | Free tier |
| Link tracking reports | hermes-router/hermes-fast | Hermes Router | Free |

## Directory Structure

```
paperclip/marketing-affiliates/
├── config.json              # Affiliate program config
├── links/                   # Generated affiliate links
├── campaigns/               # Campaign tracking
├── analytics/               # Click/conversion data
└── agents/                  # Paperclip agent prompts for affiliate work
```

## Auth Methods

All adapters support these sign-in methods:
- **OpenCode Zen**: `/connect` → zen (browser OAuth) or API key from opencode.ai/auth
- **Ollama Cloud**: API key from ollama.com/settings/keys (`OLLAMA_API_KEY`)
- **OpenRouter**: API key from openrouter.ai/keys (`OPENROUTER_API_KEY`)
- **Grok/xAI**: API key from x.ai/api (`XAI_API_KEY`) or `xai auth login` CLI
- **OpenAI/GPT Codex**: API key or ChatGPT Plus OAuth (`/connect` → openai)
- **Claude/Anthropic**: API key or Claude Pro/Max OAuth (`/connect` → anthropic)
- **GitHub Copilot**: Device code login (`/connect` → GitHub Copilot)
- **Google Gemini**: API key from Google AI Studio (`GEMINI_API_KEY`)
