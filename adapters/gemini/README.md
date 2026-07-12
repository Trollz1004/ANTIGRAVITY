# Gemini Adapter

Gemini models are routed through **Hermes Router** at `localhost:11435`.

Direct Google API is disabled — `GEMINI_API_KEY` is not available on Sabretooth.

## Usage in OpenCode

```
hermes-router/gemini-2.5-pro
hermes-router/gemini-2.5-flash
```

## Health

Health check is Hermes Router health: `http://localhost:11435/health`

## Routing history

- 2026-07-12: Rerouted from `google` provider (broken) → `hermes-router`
