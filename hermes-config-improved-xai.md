# Recommended Hermes Configuration Update for Native Grok/xAI Access
# (Safe to apply - no secrets included)

## Problem with Current Setup
The current config has this (broken for native Grok):

model:
  provider: xai-oauth
  name: hermes-3-llama-3.1-405b:free     # ← Wrong model name (OpenRouter leftover)
  base_url: https://api.x.ai/v1

This is why previous Grok usage was expensive and unreliable — it was going through third-party wrappers.

## Corrected Model Section (Native xAI)

Replace the top-level `model:` section with this:

```yaml
model:
  provider: xai
  name: grok-3                    # Primary strong model for complex work
  # name: grok-3-mini             # Use this for lighter/cheaper tasks (scouting, simple analysis)
  context: 128000
  default: grok-3
  base_url: https://api.x.ai/v1
```

## Recommended Provider Strategy

Keep most of your current fallback_providers, but restructure priority like this:

```yaml
providers:
  xai:
    api_key_env: XAI_API_KEY          # You will set this once in ~/.hermes/.env
    models:
      grok-3:
        max_context: 128000
      grok-3-mini:
        max_context: 128000

fallback_providers:
  # Tier 1: Native Grok (best quality + your access)
  - provider: xai
    model: grok-3
    weight: 80

  # Tier 2: Grok mini for cheaper high-volume work (scouting, simple tasks)
  - provider: xai
    model: grok-3-mini
    weight: 60

  # Tier 3: Good free/cheap fallbacks via OpenRouter (only when xAI is rate limited)
  - provider: openrouter
    model: google/gemini-2.5-flash
    weight: 30
  - provider: gemini
    model: gemini-2.5-flash
    weight: 25

  # Lower tiers (your existing free models)
  - provider: openrouter
    model: qwen/qwen-2.5-7b-instruct
    weight: 10
```

## Important Notes for You (Joshua)

1. You will need to add one line to your WSL Hermes env:
   `XAI_API_KEY=your_actual_xai_key_here`

2. Do **not** use old third-party wrappers anymore. We now have direct native access.

3. For revenue work (Hermes scouting, Closer, etc.), we can default most routine tasks to `grok-3-mini` to keep costs low, and only use full `grok-3` for complex reasoning.

4. This is the proper way — not the expensive OpenClaw-style wrapper you used before that burned $50/hr.

Would you like me to:
- Generate the full updated `config.yaml` ready to copy into WSL?
- Or create a small patch file with just the changes needed?

Just say the word and I'll output the exact file content you can use. No code editing required on your side — I'll give you the complete ready-to-paste sections.