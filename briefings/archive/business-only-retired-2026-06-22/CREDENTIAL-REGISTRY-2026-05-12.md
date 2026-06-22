# Credential Registry — 2026-05-12

**Authored by:** Claude (Opus 4.7) on T5500
**Scope:** key-name inventory across all reachable credential sources. **No credential VALUES are stored in this file.** Format detection counts only.

---

## Sources scanned

| Source | Path | Last modified | Keys | Status |
|---|---|---|---|---|
| Vault MASTER | `C:\Users\joshl\OneDrive\Personal Vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` | 2026-04-19 | 16 | Current canonical |
| Vault ENVwhen-ai-loses | `…\RECOVERY-SECRETS-NOT-DOCTRINE\ENVwhen ai loses.env` | 2026-04-18 | ~180 | Recovery copy; label "not doctrine" misleading per Josh — contents are current |
| Vault ENVwhen-ai-loses.txt | `…\ENVwhen ai loses.env.txt` | 2026-04-18 | ~180 | Mirror of the above per the vault README |
| Vault UNIVERSAL-NODE | `…\RECOVERY-SECRETS-NOT-DOCTRINE\UNIVERSAL-NODE.env` | 2026-03-31 | ~22 | Node-topology + OAuth client IDs |
| Vault hermes-config.yaml | `…\Personal Vault\hermes-config.yaml` | 2026-04-19 | n/a | YAML, agent config — not flat env |
| Desktop MASTER | `C:\Users\joshl\OneDrive\Desktop\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` | 2026-04-02 | 31 | **Older than vault** — vault wins on overlap |
| Desktop important-info | `…\Desktop\.env.important-info.env` | 2026-05-07 | 0 KEY=VALUE | Notes/comments only |
| Desktop CLAUDE-TO-CLAUDE-HANDOFF | `…\Desktop\.env.CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md.env.md` | 2026-05-11 | 43 | **Service-config tier**: OpenRouter/OpenCode/Nous/Ollama/Telegram bot/WhatsApp/Email/Home Assistant/Terminal sandbox. Distinct from vault user-credential layer. |
| Genspark consolidation (paste, since wiped) | (was `…\AppData\Local\Temp\genspark-paste.env`) | 2026-05-12 (today) | 403 | **Largest source** — superset of ENVwhen-ai-loses; Josh's 9020-side consolidated env. Wiped after inventory. |
| ANTIGRAVITY .env | `C:\Antigravity\.env` | 2026-04-11 | not yet enumerated | dispatch-pending |
| ANTIGRAVITY .env.example | `C:\Antigravity\.env.example` | 2026-05-01 | not yet enumerated | dispatch-pending |
| ANTIGRAVITY .env.hermes.env | `C:\Antigravity\.env.hermes.env` | 2026-05-12 | 3 (GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH) | tiny |
| ANTIGRAVITY .env.backup | `C:\Antigravity\.env.backup-20260411-173332` | 2026-03-05 | not yet enumerated | historical |
| `gh secret list` per repo | 9 repos under Trollz1004 | — | not yet enumerated | requires re-dispatch |
| `grep process.env / os.environ` in code | various | — | not yet enumerated | "referenced but undefined" gap analysis pending |

**The original Sonnet subagent (id af…) for this audit was killed mid-step-B; partial output not recovered. This registry reflects what I (Claude/Opus) inline-scanned myself, not the subagent's deeper enumeration. A follow-up sweep can fill the "not yet enumerated" rows.**

---

## Services represented (by key-name prefix / pattern)

### AI providers
ANTHROPIC_API_KEY · ANTHROPIC_API_KEY_OAUTH · OPENAI_API_KEY · OPENAI_ALT_KEY · AZURE_OPENAI_API_KEY · GEMINI_API_KEY · GROK_API_KEY · XAI_API_KEY · PERPLEXITY_API_KEY · HUGGINGFACE_API_KEY · REPLICATE_API_KEY · STABILITY_API_KEY · CIVITAI_API_KEY · OPENROUTER_API_KEY · OPEN_ROUTER_API_KEY · NOUS_API_KEY · OPENCODE_ZEN_API_KEY · KIMI_API_KEY · ZAI_API_KEY · TINKER_API_KEY · CUSTOM_API_KEY · OLLAMA_API_KEY · CLAUDE_MODEL · FLUX_MODEL · SDXL_MODEL · HENTAI_MODEL

### Cloud / infra
CLOUDFLARE_API_TOKEN · CF_API_TOKEN · CLOUDFLARE_DOCKER_PAT · GCP_PROJECT_ID · GCP_PROJECT_NUMBER · GCP_BILLING_ACCOUNT_ID · GCP_PAYMENTS_PROFILE_ID · GOOGLE_APPLICATION_CREDENTIALS · AWS_EC2_IP · AWS_EC2_USER · AWS_DOMAIN · AWS_PEM_FILE · AZURE_OPENAI_ENDPOINT · AZURE_API_VERSION · AZURE_REGION · QDRANT_URL · QDRANT_API_KEY · REDIS_URL · POSTGRES_DB · POSTGRES_USER · POSTGRES_PASSWORD · DATABASE_URL

### Payments
STRIPE_SECRET_KEY · STRIPE_PUBLIC_KEY · STRIPE_PUBLISHABLE_KEY · STRIPE_WEBHOOK_SECRET · STRIPE_LINK_* (5 link slugs) · STRIPE_SUCCESS_URL · STRIPE_CANCEL_URL · SQUARE_ACCESS_TOKEN · SQUARE_APP_ID · SQUARE_LOCATION_ID · SQUARE_MERCHANT_ID · SQUARE_*_PLAN_ID (3) · SQUARE_*_LINK · SQUARE_WEBHOOK_SIGNATURE_KEY · SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY · SQUARE_BOOKING_WEBHOOK_SIGNATURE_KEY · PLAID_CLIENT_ID · PLAID_SECRET · PLAID_ENV

### Crypto / wallets / DAO
BASESCAN_API_KEY · BASESCAN_URL · BLOCKCHAIN_NETWORK · CHAIN_ID · CDP_API_KEY_NAME · CDP_API_KEY_SECRET · DAO_TREASURY_WALLET · CHARITY_REVENUE_WALLET · DATING_REVENUE_WALLET · OPS_WALLET · CHARITY_SAFE · TREASURY_SAFE · FOUNDER_SAFE · PROTOCOL_OMEGA_SPLIT · PROFIT_TO_CHARITY_ALLOCATION · OMEGA_CHARITY_ALLOCATION

### Social / messaging
REDDIT_CLIENT_ID · REDDIT_CLIENT_SECRET · REDDIT_USERNAME · REDDIT_PASSWORD · TWITTER_API_KEY · TWITTER_API_SECRET · TWITTER_BEARER_TOKEN · TWITTER_ACCESS_TOKEN · TWITTER_ACCESS_SECRET · TWITTER_CLIENT_ID · TWITTER_CLIENT_SECRET · TELEGRAM_BOT_TOKEN · TELEGRAM_BOT_TOKEN_GROK4KIDS · TELEGRAM_BOT_USERNAME · TELEGRAM_OWNER_ID · TELEGRAM_ALLOWED_USERS · TELEGRAM_HOME_CHANNEL · YOUTUBE_API_KEY · YOUTUBE_CLIENT_ID · YOUTUBE_CLIENT_SECRET · YOUTUBE_REDIRECT_URI · YOUTUBE_REFRESH_TOKEN · GEMINI_YOUTUBE_CLIENT_ID · GEMINI_YOUTUBE_CLIENT_SECRET · META_ACCESS_TOKEN · IG_ACCOUNT_ID · WHATSAPP_ENABLED · WHATSAPP_MODE · WHATSAPP_ALLOWED_USERS

### eBay / commerce
EBAY_APP_ID · EBAY_CERT_ID · EBAY_DEV_ID · EBAY_AUTH_TOKEN · EBAY_OAUTH_TOKEN · EBAY_ENVIRONMENT

### Email / SendGrid
SENDGRID_API_KEY · EMAIL_ADDRESS · EMAIL_PASSWORD · EMAIL_IMAP_HOST · EMAIL_IMAP_PORT · EMAIL_SMTP_HOST · EMAIL_SMTP_PORT · EMAIL_ALLOWED_USERS · LEGACY_GMAIL_APP_PASSWORD · AICOLLAB4KIDS_GMAIL_APP_PASSWORD · BUSINESS_EMAIL_AIDOESITALL · BUSINESS_EMAIL_OUTLOOK · BUSINESS_EMAIL_RECYCLE · BUSINESS_EMAIL_UANDINOTAI

### GitHub
**GITHUB_TOKEN** (vault MASTER — placeholder string, never live) · **GITHUB_ADMIN** (vault recovery + Genspark — `ghp_0ywu…` DEAD as of 2026-05-11 burn) · **GITHUB_PAT** (vault recovery + Genspark — `ghp_sFCy…` DEAD) · GITHUB_USERNAME · GITHUB_EMAIL · GITHUB_NOREPLY · OWNER_GITHUB · ENIGMA_GITHUB_ACCOUNT · MISSION_CONTROL_GITHUB_CLIENT_ID · MISSION_CONTROL_GITHUB_CLIENT_SECRET

### Misc API
PEXELS_API_KEY · UNSPLASH_API_KEY · NEWSAPI_KEY · DAILY_API_KEY · METRICS_API_KEY · WANDB_API_KEY · SDXL_MODEL · FLUX_MODEL · HENTAI_MODEL

### Auth / JWT
JWT_SECRET · ALGORITHM · ACCESS_TOKEN_EXPIRE_MINUTES · REFRESH_TOKEN_EXPIRE_DAYS · AUTH_RATE_LIMIT_PER_MINUTE · RATE_LIMIT_REDIS_URL · SSH_KEY · CLAWDBOT_GATEWAY_TOKEN

### Node / topology / paths (non-secret)
T5500_HOSTNAME · T5500_IP · T5500_CPU · T5500_GPU · T5500_RAM · T5500_USER · T5500_PATHS · T5500_SSH · T5500_SERVICES · T5500_ROLE · T5500_OPUSONLY · T5500_ANTIGRAVITY · T5500_PLATFORM · SABRETOOTH_* (15 keys, soon to be archival) · NETWORK_SHARE_9020 · NETWORK_SHARE_SABRETOOTH · NODE_MANIFEST · MASTER_ENV · MASTER_WORKSPACE

### Mission / org meta
MISSION_QUOTE · MISSION_CONTINUITY · MISSION_DURATION · MISSION_CHARITY · MISSION_PARTNERS · MISSION_PLATFORM · OMEGA_DOMAIN · OMEGA_MISSION · OMEGA_DURATION · LEGAL_ENTITY · LEGAL_REGISTRY · LEGAL_STATE · OWNER_NAME · OWNER_EMAIL · PROFIT_OPS_EMAIL · ENIGMA_DIR · ENIGMA_DOMAINS · ENIGMA_ENTITY · ENIGMA_PRIMARY_NODE · ENIGMA_STATE · DROID_OPUS · DROID_CLAUDEDROID · DROID_CLAWDBOT · DROID_HEMORZOID

### Domain / DNS / app URLs
DOMAIN · DOMAIN_REDIRECT · DOMAIN_CHARITY · DOMAIN_CROSSLISTER · DOMAIN_DATEAPP · DOMAIN_DATEAPP_REDIRECT · DOMAIN_JULES_API · PLATFORM_DOMAIN · FRONTEND_URL · API_BASE_URL · URL_API · VITE_APP_URL · WEBHOOK_BASE_URL · SERVER_IP

### Repos (referenced by name)
REPO_DATEAPP · REPO_DASHBOARD · REPO_CROSSLISTER · REPO_CHARITY_STORE · REPO_CHARITY_OPS · *_PURPOSE for each

---

## Token-format detection (counts only — no values)

From the Genspark paste (largest source):
- `ghp_*` (classic GH PAT): **4 occurrences** — but only 2 unique values (`ghp_0ywu…`, `ghp_sFCy…`), both DEAD
- `github_pat_*` (fine-grained GH PAT): 0
- `gho_*` (GH OAuth): 0
- `sk-ant-*` (Anthropic): 4
- `sk-or-v1-*` (OpenRouter v1): 0
- `sk-proj-*` (OpenAI new): 4
- `AIza*` (Google): 4
- `xai-*`: 2
- `SG.*` (SendGrid): 2
- `AKIA*` (AWS): 0
- `ya29.*` (Google OAuth): 0

---

## Known DEAD credentials (do NOT use)

| Key | Source | Prefix | Why dead |
|---|---|---|---|
| `GITHUB_ADMIN` | vault, Genspark | ghp_0ywu… | Sabretooth Opus gist-burn 2026-05-11 |
| `GITHUB_PAT` | vault, Genspark | ghp_sFCy… | Same burn (or earlier rotation) |
| `GITHUB_TOKEN` | vault MASTER | `(SetviaW…` | Placeholder string, never a real token |
| `gho_2RNa85…` | (historical, no longer in any file) | gho_* | Documented kill on 2026-05-11 |

**Net:** **zero live GitHub PATs anywhere on T5500's reachable filesystem.** Josh needs to mint a fresh one to grant admin-scope access. Current `gh auth` session is on a different OAuth credential that has `gist/read:org/repo/workflow` scopes.

---

## Action items / gaps

1. **Mint fresh GitHub admin PAT** when needed for audit-log / deleted-repo / org-settings work. Current operational scope is sufficient for everything mission-blocking.
2. **Audit subagent re-dispatch** to fill in: ANTIGRAVITY `.env*` enumeration, per-repo `gh secret list`, code-grep "referenced but undefined" gap analysis. The killed subagent didn't complete these.
3. **Vault drift cleanup** (Personal Vault) — separate from this registry; 4 stale Paperclip-status snapshots, paperclip-ceo/ subdir, duplicate ENVwhen-ai-loses .env + .env.txt.
4. **Token rotation candidates** — many of these keys are >30 days old. After mission gets to ship-state, consider a rotation pass for sensitive ones (Stripe Secret, Anthropic OAuth, Cloudflare, Square Access).

---

## Format of this registry — important for future-me

This file contains **only key names**, never values. If you ever need to use one of these credentials:
- Source: read directly from the corresponding `.env` file
- Don't echo, don't commit, don't put in chat
- For programmatic use: load via `dotenv` or similar at process startup; reference by name
- If you find this registry has been polluted with a credential value, **redact immediately** and treat as a leak (re-rotate the leaked credential)
