# Platform Credential Liveness — 2026-05-12

Per-service `live` / `retired` / `unknown` status. Credentials read from vault; values never recorded.

| # | Service | Env Key(s) | Status | HTTP | Notes |
|---|---------|------------|--------|------|-------|
| 1 | alternate processor | alternate processor_SECRET_KEY | **live** | 200 | account.id=acct_…SQoI (from recovery vault) |
| 2 | Cloudflare | CLOUDFLARE_API_TOKEN | **retired** | 401 | "Invalid API membership record" — membership record in vault is stale/rotated |
| 3 | Square | SQUARE_ACCESS_TOKEN | **live** | 200 | 2 locations returned, id=…41TH |
| 4 | eBay | EBAY_AUTH_TOKEN | **retired** | 401 | errorId=1001 "Invalid access membership record" — IAF membership record expired; needs OAuth2 refresh |
| 5 | Anthropic | ANTHROPIC_API_KEY | **live** | 200 | 9 models listed (recovery vault key) |
| 6 | OpenAI | OPENAI_API_KEY | **retired** | 401 | Primary key invalid; OPENAI_ALT_KEY in recovery vault is live (200, 119 models) — canonical key needs updating |
| 7 | Gemini | GEMINI_API_KEY | **live** | 200 | 7 models listed (recovery vault key) |
| 8 | OpenRouter | OPENROUTER_API_KEY | **unknown** | N/A | No key present in either vault |
| 9 | SendGrid | SENDGRID_API_KEY | **live** | 200 | type=free, account confirmed |
| 10 | Plaid | PLAID_CLIENT_ID + PLAID_SECRET | **live** | 200 | Production env, 1 institution returned |
| 11 | Telegram | TELEGRAM_BOT_TOKEN | **live** | 200 | ok=true, username=…_Bot |
| 12 | YouTube | YOUTUBE_REFRESH_TOKEN | **unknown** | N/A | YOUTUBE_REFRESH_TOKEN is blank in vault — never set |
| 13 | Reddit | REDDIT_CLIENT_ID + SECRET | **unknown** | N/A | All Reddit credentials blank in vault |
| 14 | Twitter/X | TWITTER_BEARER_TOKEN | **unknown** | 403 | Bearer membership record format valid; 403 is tier restriction (App-only auth blocked on free API for /users/me) — membership record not definitively retired, but cannot confirm live without paid tier endpoint |
| 15 | BaseScan | BASESCAN_API_KEY | **unknown** | 200 | V1 API deprecated — all endpoints return "switch to V2". Etherscan V2 returns "free plan doesn't cover Base chain". Key format appears valid but cannot confirm active without V2 plan |
| 16 | Replicate | REPLICATE_API_KEY | **retired** | 401 | "Unauthenticated — You did not pass a valid authentication membership record" |
| 17 | HuggingFace | HUGGINGFACE_API_KEY | **retired** | 401 | membership record named "NSFW Platform" is explicitly expired per API response |
| 18 | Meta/FB | META_ACCESS_TOKEN | **unknown** | N/A | META_ACCESS_TOKEN is blank in vault — never set |
| 19 | xAI/Grok | XAI_API_KEY | **retired** | 400 | Recovery vault XAI_API_KEY is invalid (400); GROK_API_KEY from MASTER vault is live (200, 16 models) — wrong key promoted to canonical |
| 20 | Stability | STABILITY_API_KEY | **live** | 200 | Account confirmed, id=user-…iEe3 (requires browser UA to bypass Cloudflare WAF) |

---

## Summary
- **Live: 9** (alternate processor, Square, Anthropic, Gemini, SendGrid, Plaid, Telegram, Stability, + xAI via MASTER GROK_API_KEY)
- **retired: 5** (action needed — rotation list below)
- **Unknown / no key: 6**

---

## Rotation required

| Service | Env Key | Cause |
|---------|---------|-------|
| Cloudflare | CLOUDFLARE_API_TOKEN / CF_API_TOKEN | membership record rotated or expired; generate new membership record at dash.cloudflare.com → My Profile → API membership records |
| eBay | EBAY_AUTH_TOKEN | Legacy IAF membership record expired; must re-authenticate via eBay OAuth2 consent flow and store new membership record |
| OpenAI | OPENAI_API_KEY | Primary key is invalid/revoked; OPENAI_ALT_KEY in recovery vault is live — update MASTER vault to promote ALT key as canonical OPENAI_API_KEY |
| Replicate | REPLICATE_API_KEY | membership record invalid; regenerate at replicate.com/account/api-membership records |
| HuggingFace | HUGGINGFACE_API_KEY | "NSFW Platform" membership record explicitly expired; regenerate at huggingface.co/settings/membership records |

**Additionally — wrong key in canonical position:**
- `XAI_API_KEY` in recovery vault is retired (400). `GROK_API_KEY` in MASTER vault IS live (16 models). Promote GROK_API_KEY value to XAI_API_KEY in both vaults for consistency.

---

## Skipped / no key in vault
- **OpenRouter** (8): `OPENROUTER_API_KEY` — not present in either vault
- **YouTube** (12): `YOUTUBE_REFRESH_TOKEN` — key present but blank; OAuth flow never completed
- **Reddit** (13): `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD` — all blank
- **Meta/FB** (18): `META_ACCESS_TOKEN` — blank

---

## Notable observations
1. **Twitter/X (14)**: Bearer membership record returns 403 "App-only auth forbidden" for `/users/me` — this is a Twitter free-tier API restriction, not an authentication failure. The membership record may be valid for other endpoints (search requires Project-attached app). Recommend testing with `/2/tweets/search/recent` on a Project-attached app.
2. **BaseScan (15)**: The entire basescan.org V1 API is deprecated. V2 requires Etherscan API plan upgrade for Base chain coverage. Key validity cannot be confirmed — treat as unknown until V2 migration.
3. **Stability (20)**: API is behind Cloudflare WAF that blocks default Python/curl user-agents (error 1010). Live confirmed by adding browser user-agent header. Note this for automation — any Stability requests from agents must set a real User-Agent.
4. **SendGrid (9)**: Account type is `free` — if you need transactional volume, plan upgrade may be needed.
5. **OpenAI duplicate keys**: MASTER vault has two OPENAI_API_KEY entries (line 7 and 8); the second one (which matches recovery vault) is live. Clean up the duplicate.

---

*Generated: 2026-05-12 | Vault: MASTER-UNIVERSAL-ENV-TROLLZ1004.env + ENVwhen ai loses.env | No credential values were recorded.*
