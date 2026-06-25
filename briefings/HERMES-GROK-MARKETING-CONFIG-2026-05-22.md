# Hermes Config — Grok owns X/Marketing (x.ai user-auth, no API key) — 2026-05-22

> **How to use:** these are the only sections to change in `~/.hermes/config.yaml`. Each block
> below replaces the same-named block in your file. Everything else stays as-is.
>
> **The principle:** Grok is "main on Hermes" **for X/marketing** — via your x.ai *subscription*
> (user-auth, no API key, no ToS friction on x.com). The general brain stays on the **free** tier
> so Hermes orchestration costs $0 per call. Grok-as-global-default would route through OpenRouter
> (paid per-token) and would NOT use your x.ai sub — wrong path, so we don't do that.

---

## 0. ADD GROK AUTH FIRST — you haven't yet, and it's KEYLESS

The "Grok Hermes auth" is **not** an `XAI_API_KEY`. With your x.ai *subscription* the auth is a
**one-time browser login** that Hermes keeps:

1. Hermes' `browser` engine is Camofox with `managed_persistence: true` — a persistent profile
   that keeps cookies between runs.
2. **Log into `x.ai` / `grok.com` / `x.com` once** inside that Hermes browser session, with your
   subscription account. The session persists, so Grok then acts as **you** — user-auth, no key.
3. After that login: posting to x.com and Grok-on-x both run on your **sub**, no API key, no ToS
   friction. This is the whole point.

**The one honest caveat:** Hermes' `x_search` toolset *may* expect an `XAI_API_KEY` (API-based
search) rather than the browser session. If it does and you want it keyless, leave `x_search`
unset and let Grok act through the **browser** session instead. If you choose to use a key for
search only, it goes in `~/.hermes/.env` **never** in `services/hermes-router/.env*` (that env is
the Anthropic hard wall and must stay key-clean of everything that doctrine names). The **posting**
path is keyless regardless — that's the marketing capability the mission needs.

> Until this login is done, the `x_search` / Grok blocks below are inert — wire the auth first.

---

## 1. General brain — KEEP free/zero-cost (unchanged)

```yaml
model:
  provider: openrouter
  name: tencent/hy3-preview:free
  context: 262000
  default: openrouter/owl-alpha
  base_url: https://openrouter.ai/api/v1
  api_mode: chat_completions
```

Every routine Hermes call (orchestration, kanban dispatch, delegation) runs on this free model.
Zero metered spend. This is correct — do not promote Grok here (it would bill OpenRouter).

## 2. X / Marketing lane — GROK via your x.ai sub (this is "Grok main")

```yaml
# Grok handles X search on your x.ai subscription — no OpenRouter spend, no API key.
x_search:
  model: grok-4.20-reasoning
  timeout_seconds: 180
  retries: 2
```

**Posting to x.com** is handled by the `browser` toolset (Camofox `managed_persistence: true`)
driving your **logged-in x.ai / grok.com session** — user-auth, no API key, no ToS friction.
Keep `browser.allow_private_urls: true` and `camofox.managed_persistence: true` (already set).
This is the no-API posting path the mission needs.

## 3. Anthropic hard wall — keep it literally zero

Remove the stray Anthropic strategy line so there is no Anthropic reference anywhere:

```yaml
credential_pool_strategies:
  openrouter: round_robin
  # (delete the "anthropic: random" line — no Anthropic creds exist in Hermes, by doctrine)
```

Confirmed: your `model`, `fallback_providers`, and `delegation` blocks carry **zero** Anthropic
provider. That's the FOUNDER-DOCTRINE-6 hard wall — keep it that way.

## 4. Future: native x.ai user-auth (commented stub, add to `fallback_providers`)

When Nous adds a native `xai` OAuth provider (like `openai-codex` / `nous`), flip Grok to your
**subscription** instead of OpenRouter by uncommenting:

```yaml
  # Tier 0b: Grok via x.ai SUBSCRIPTION (user-auth OAuth — uses your sub, not API credits)
  # - provider: xai
  #   model: grok-4.20-reasoning
```

Until then, if you ever need Grok as a *fallback brain* (paid), it's `openrouter` / `x-ai/grok-4`.

---

## Marketing routing (2026-05-22, unchanged doctrine)

- **Grok → X / x.com** (this config; user-auth, no ToS friction)
- **Manus → Meta** (Facebook / Instagram / Threads)
- **Perplexity → research + the remaining platforms**
- **Opus → strategy / browser-assist only** (never an in-platform adapter)

## What NOT to change

- `delegation.provider: gemini` / `gemini-2.5-flash` — fine, keep (free-ish, fast).
- The free `fallback_providers` ladder — keep all of it; it's your zero-cost safety net.
- `approvals.mode: yolo` — your call; it's your box.
- `telegram.allowed_users` `PHONE` placeholders — put your number there **in the file only**,
  never in the repo (secret-free rule). That also wires the "dashboard down → ping me" path.
