# onemin-shim

OpenAI-compatible loopback front for the **1min.ai** proprietary API, so OmniRoute
can route to the lifetime-prepaid 1min.ai account like any other provider.

**Why this exists (verified 2026-08-19):** 1min.ai has **no** OpenAI-compatible
endpoint — `/v1/*` paths all 404. Its docs advertise an *OpenAPI* (Swagger) spec,
which is not *OpenAI* compatibility. The only chat endpoint is
`POST https://api.1min.ai/api/chat-with-ai` speaking `UNIFY_CHAT_WITH_AI` with a
`promptObject`. This shim translates both directions, including SSE streaming.

## Security model

- Binds **127.0.0.1 only** (port `20130`, override `ONEMIN_SHIM_PORT`).
- **Holds no secrets.** The `Authorization: Bearer <key>` OmniRoute sends (from
  its encrypted connection config) is forwarded upstream as `API-KEY`. The key
  is never logged, never persisted, never in this repo.
- Fails closed: an empty upstream payload returns a 502 error, never a silent
  empty completion.
- Token counts in responses are **ESTIMATED** (chars/4) — 1min.ai does not
  return usage. Do not treat as billing truth; the credit ledger lives at
  app.1min.ai → Billing.

## Run

```powershell
node C:\ANTIGRAVITY\services\onemin-shim\server.mjs
```

Health check: `GET http://127.0.0.1:20130/health`

## Wire into OmniRoute (one-time, Joshua does the key step)

1. Start the shim (above).
2. OmniRoute dashboard → **Providers → New connection** → custom
   **OpenAI-compatible** type:
   - Base URL: `http://127.0.0.1:20130/v1`
   - API key: *paste the 1min.ai API key* (from app.1min.ai → API)
3. **Test** the connection, then place it high in the fallback chain / combos —
   it is prepaid lifetime capacity, so it should absorb bulk work before any
   metered API. It will cap itself out on heavy jobs (credit-limited, not
   unlimited); the router then falls through to the next lane by design.

The `model` field passes through verbatim — any model id the 1min.ai account
supports works even if `/v1/models` doesn't list it.

## Tests

```powershell
cd C:\ANTIGRAVITY\services\onemin-shim
node --test test.mjs
```

5 tests: models list, 401 without auth, request/response translation +
verbatim model passthrough, SSE streaming translation, fail-closed empty payload.
