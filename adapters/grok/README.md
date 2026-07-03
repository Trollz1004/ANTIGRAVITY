# Grok Adapter (xAI)

Paperclip adapter type: `opencode_local`
Paperclip alias: `grok`
CLI: `grok` (v0.2.60+ alpha, at `~/.grok/bin/grok`)

## Auth

Grok requires an xAI API key:

1. Sign up at https://console.x.ai
2. Create an API key
3. Set `XAI_API_KEY` in local env (vault file, never git)

Free alternative: Use `x-ai/grok-3:free` via OpenRouter (no xAI account needed).

## Registering an agent with this adapter

```json
{
  "adapterType": "opencode_local",
  "adapterConfig": {
    "cwd": "C:\\antigravity",
    "model": "grok-3-mini"
  }
}
```

## Provider routing

- Direct: `xai` provider in opencode.json → `XAI_API_KEY`
- Free: `openrouter` provider → `x-ai/grok-3:free` or `x-ai/grok-3-mini:free`

## Use cases

- Adversarial / red-team review (grok-adversarial agent preset)
- General coding and reasoning
- Second-opinion review (independent from Claude/FCC)

## Files

- `manifest.yaml` — adapter registration
- `README.md` — this file

## Health

```
grok --version
```
