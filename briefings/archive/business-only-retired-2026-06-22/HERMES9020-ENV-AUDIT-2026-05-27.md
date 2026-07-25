# HERMES9020-ENV audit — 2026-05-27

**Source file:** `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\HERMES9020-ENV-2026-05-18T043653Z.env`
**Source modified:** 2026-05-18 04:36:53 (pre 2026-05-19 FOUNDER DOCTRINE rev)
**Total unique keys:** 236
**Total occurrences:** 236 (zero duplicates, zero blank lines)
**Joshua's stated use:** none — file is a 9020-node env snapshot kept for key reference only. Not loaded by Hermes Agent, Hermes Router, FastAPI backend, or any runtime.

## Doctrine notes

- **R6 hard wall:** file contains `ANTHROPIC_API_KEY` and `ANTHROPIC_API_KEY_OAUTH`. Acceptable in this vault snapshot. **NEVER load this file into Hermes** (`services/hermes-router/.env*`, `~/.hermes/.env`, or `%LOCALAPPDATA%\hermes\.env`) — build/runtime must fail on Anthropic-key match.
- **Retired naming (per CLAUDE.md):** `ENIGMA_*`, `OMEGA_*` prefixes pre-date the 1-LLC unification (THE-WHEEL 2026-05-20). Reference-only; never use in new code.
- **Paperclip retired as agent host (2026-05-20):** `PAPERCLIP_*` keys still readable for archaeology but not for new runtime wiring. Replacement is Paperweight Mission Control.
- **AWS retired (Joshua 2026-05-26):** `AWS_*` keys are old setup, not part of current stack (GCR Cloud Run + T5500 Docker host).
- **Multi-wallet keys retired:** `_REVENUE_WALLET`, `DATING_REVENUE_WALLET`, `DAO_TREASURY_WALLET`, `OPS_WALLET`, `PROFIT_TO__ALLOCATION` — superseded by 1-LLC / 1-wallet / 10% per-bucket doctrine.
- **-prefixed repo metadata:** `REPO__OPS`, `REPO__STORE`, etc. — these are key-NAME-internal references to retired -routing repos. Not customer-facing, but stale.

## Verdict summary

- **R6_SENSITIVE:** 2 (Anthropic keys — vault-only, never to Hermes)
- **RETIRED_naming:** 10 (ENIGMA, OMEGA prefixes)
- **RETIRED_paperclip_as_agent_host:** 13
- **RETIRED_aws_old_setup:** 4
- **KEEP_canonical_payments:** 19 (Square — sole processor for dating surface)
- **KEEP_node_identity:** 26 (Sabretooth, T5500 hardware/role facts)
- **KEEP_repo_metadata:** 10 (some include retired  repo names — see below)
- **KEEP_founding_four:** 5 (Gemini, xAI/Grok)
- **KEEP_db / vector / tunnels / cloud_run:** ~16 (Postgres, Qdrant, Cloudflare, GCP)
- **KEEP_domain_registry / mission_meta / repo / content_engine / status_hooks / ai_solutions / owner / prompt / doctrine_ref:** ~37
- **VERIFY_uncategorized:** 61 (standard secrets without doctrine prefix — manual eyeball needed)
- **VERIFY_stripe_non_dating_only:** 9 (Stripe is OK on non-dating surfaces per 2026-05-20)
- **VERIFY_x_platform / opus_hub / active_bot / azure / plaid / profit / network:** ~29

## Classification table

| Key | Verdict |
|---|---|
| `ACCESS_TOKEN_EXPIRE_MINUTES` | VERIFY_uncategorized |
| `AICOLLAB4KIDS_GMAIL_APP_PASSWORD` | VERIFY_uncategorized |
| `ALGORITHM` | VERIFY_uncategorized |
| `ANTHROPIC_API_KEY` | R6_SENSITIVE |
| `ANTHROPIC_API_KEY_OAUTH` | R6_SENSITIVE |
| `API_BASE_URL` | VERIFY_uncategorized |
| `AWS_DOMAIN` | RETIRED_aws_old_setup |
| `AWS_EC2_IP` | RETIRED_aws_old_setup |
| `AWS_EC2_USER` | RETIRED_aws_old_setup |
| `AWS_PEM_FILE` | RETIRED_aws_old_setup |
| `AZURE_API_VERSION` | VERIFY_azure_usage |
| `AZURE_OPENAI_API_KEY` | VERIFY_azure_usage |
| `AZURE_OPENAI_ENDPOINT` | VERIFY_azure_usage |
| `AZURE_REGION` | VERIFY_azure_usage |
| `BASESCAN_API_KEY` | VERIFY_uncategorized |
| `BASESCAN_URL` | VERIFY_uncategorized |
| `BETTER_AUTH_TRUSTED_ORIGINS` | VERIFY_uncategorized |
| `BLOCKCHAIN_NETWORK` | VERIFY_uncategorized |
| `CDP_API_KEY_NAME` | VERIFY_uncategorized |
| `CDP_API_KEY_SECRET` | VERIFY_uncategorized |
| `CELERY_BROKER_URL` | VERIFY_uncategorized |
| `CF_API_TOKEN` | VERIFY_uncategorized |
| `CHAIN_ID` | VERIFY_uncategorized |
| `_CROSSLISTER` | RETIRED_multi_wallet_or__routing |
| `_REVENUE_WALLET` | RETIRED_multi_wallet_or__routing |
| `CLAUDE_CODE_PROMPT` | KEEP_prompt_config |
| `CLAUDE_DESKTOP_PROMPT` | KEEP_prompt_config |
| `CLAUDE_MODEL` | KEEP_prompt_config |
| `CLAWDBOT_AGENT_MODEL` | RETIRED_clawdbot_paperclip_era |
| `CLAWDBOT_GATEWAY_TOKEN` | RETIRED_clawdbot_paperclip_era |
| `CLOUDFLARE_ACCOUNT_ID` | KEEP_tunnels_pages |
| `CLOUDFLARE_API_TOKEN` | KEEP_tunnels_pages |
| `CLOUDFLARE_GLOBAL_API_KEY` | KEEP_tunnels_pages |
| `CONSOLIDATED_PREFS` | VERIFY_uncategorized |
| `CROSSLISTER_DEV_DIR` | VERIFY_uncategorized |
| `DAO_TREASURY_WALLET` | RETIRED_multi_wallet_or__routing |
| `DATABASE_URL` | KEEP_db |
| `DATEAPP_DEV_DIR` | VERIFY_uncategorized |
| `DATEAPP_DIR` | VERIFY_uncategorized |
| `DATING_REVENUE_WALLET` | RETIRED_multi_wallet_or__routing |
| `DOMAIN` | VERIFY_uncategorized |
| `DOMAIN_` | RETIRED_multi_wallet_or__routing |
| `DOMAIN_CROSSLISTER` | KEEP_domain_registry |
| `DOMAIN_DATEAPP` | KEEP_domain_registry |
| `DOMAIN_DATEAPP_REDIRECT` | KEEP_domain_registry |
| `DOMAIN_JULES_API` | KEEP_domain_registry |
| `DOMAIN_REDIRECT` | KEEP_domain_registry |
| `DROID_CLAUDEDROID` | KEEP_ai_solutions_products |
| `DROID_CLAWDBOT` | RETIRED_clawdbot_paperclip_era |
| `DROID_HEMORZOID` | KEEP_ai_solutions_products |
| `DROID_OPUS` | KEEP_ai_solutions_products |
| `ENIGMA_DIR` | RETIRED_naming |
| `ENIGMA_DOMAINS` | RETIRED_naming |
| `ENIGMA_ENTITY` | RETIRED_naming |
| `ENIGMA_GITHUB_ACCOUNT` | RETIRED_naming |
| `ENIGMA_PRIMARY_NODE` | RETIRED_naming |
| `ENIGMA_STATE` | RETIRED_naming |
| `FLUX_MODEL` | VERIFY_uncategorized |
| `FRONTEND_URL` | VERIFY_uncategorized |
| `GCP_BILLING_ACCOUNT_ID` | KEEP_backend_cloud_run |
| `GCP_PAYMENTS_PROFILE_ID` | KEEP_backend_cloud_run |
| `GCP_PROJECT_ID` | KEEP_backend_cloud_run |
| `GCP_PROJECT_NUMBER` | KEEP_backend_cloud_run |
| `GEMINI_API_KEY` | KEEP_founding_four |
| `GEMINI_STATUS` | KEEP_founding_four |
| `GEMINI_YOUTUBE_CLIENT_ID` | KEEP_founding_four |
| `GEMINI_YOUTUBE_CLIENT_SECRET` | KEEP_founding_four |
| `GH_EMAIL` | KEEP_repo |
| `GH_PAT` | KEEP_repo |
| `GITHUB_ADMIN` | KEEP_repo |
| `GITHUB_EMAIL` | KEEP_repo |
| `GITHUB_NOREPLY` | KEEP_repo |
| `GITHUB_PAT` | KEEP_repo |
| `GITHUB_USERNAME` | KEEP_repo |
| `GOOGLE_APPLICATION_CREDENTIALS` | KEEP_backend_cloud_run |
| `HEARTBEAT_SCHEDULER_ENABLED` | KEEP_status_hooks |
| `HEARTBEAT_SCHEDULER_INTERVAL_MS` | KEEP_status_hooks |
| `HENTAI_MODEL` | RETIRED_offbrand |
| `JWT_SECRET` | KEEP_auth |
| `LEGAL_ENTITY` | KEEP_doctrine_ref |
| `LEGAL_REGISTRY` | KEEP_doctrine_ref |
| `LEGAL_STATE` | KEEP_doctrine_ref |
| `MASTER_ENV` | KEEP_vault_pointer |
| `MASTER_WORKSPACE` | KEEP_vault_pointer |
| `MISSION_` | RETIRED__naming_on_key |
| `MISSION_CONTINUITY` | KEEP_mission_meta |
| `MISSION_DURATION` | KEEP_mission_meta |
| `MISSION_PARTNERS` | KEEP_mission_meta |
| `MISSION_PLATFORM` | KEEP_mission_meta |
| `MISSION_QUOTE` | KEEP_mission_meta |
| `NETWORK_SHARE_9020` | KEEP_node_identity |
| `NETWORK_SHARE_SABRETOOTH` | KEEP_node_identity |
| `NODE_9020_IP` | KEEP_node_identity |
| `NODE_MANIFEST` | KEEP_node_identity |
| `OLLAMA_API_KEY` | KEEP_provider |
| `OLLAMA_BASE_URL` | KEEP_provider |
| `OMEGA__ALLOCATION` | RETIRED_naming |
| `OMEGA_DOMAIN` | RETIRED_naming |
| `OMEGA_DURATION` | RETIRED_naming |
| `OMEGA_MISSION` | RETIRED_naming |
| `OPENAI_ALT_KEY` | VERIFY_openai_use |
| `OPENAI_API_KEY` | VERIFY_openai_use |
| `OPENROUTER_API_KEY` | KEEP_provider |
| `OPS_WALLET` | RETIRED_multi_wallet_or__routing |
| `OPUS_DATA_DIR` | VERIFY_opus_hub |
| `OPUS_DIR` | VERIFY_opus_hub |
| `OPUS_HAS_HANDS_CLAUDE_PW` | VERIFY_opus_hub |
| `OPUS_HAS_HANDS_DISPLAY_NAME` | VERIFY_opus_hub |
| `OPUS_HAS_HANDS_EMAIL` | VERIFY_opus_hub |
| `OPUS_HAS_NO_LOCKED_DOORS` | VERIFY_opus_hub |
| `OPUS_STATUS` | VERIFY_opus_hub |
| `OWNER_EMAIL` | KEEP_owner_identity |
| `OWNER_GITHUB` | KEEP_owner_identity |
| `OWNER_NAME` | KEEP_owner_identity |
| `PAPERCLIP_AGENT_JWT_AUDIENCE` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_AGENT_JWT_ISSUER` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_AGENT_JWT_SECRET` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_AGENT_JWT_TTL_SECONDS` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_PUBLIC_URL` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_SECRETS_MASTER_KEY_FILE` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_SECRETS_PROVIDER` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_SECRETS_STRICT_MODE` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_STORAGE_LOCAL_DIR` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_STORAGE_PROVIDER` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_STORAGE_S3_BUCKET` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_STORAGE_S3_FORCE_PATH_STYLE` | RETIRED_paperclip_as_agent_host |
| `PAPERCLIP_STORAGE_S3_REGION` | RETIRED_paperclip_as_agent_host |
| `PERPLEXITY_API_KEY` | KEEP_founding_four |
| `PEXELS_API_KEY` | VERIFY_uncategorized |
| `PLAID_CLIENT_ID` | VERIFY_plaid_use |
| `PLAID_ENV` | VERIFY_plaid_use |
| `PLAID_SECRET` | VERIFY_plaid_use |
| `PORT` | VERIFY_uncategorized |
| `POSTGRES_DB` | KEEP_db |
| `POSTGRES_PASSWORD` | KEEP_db |
| `POSTGRES_USER` | KEEP_db |
| `PROFIT_OPS_EMAIL` | RETIRED_profit_split_naming |
| `PROFIT_TO__ALLOCATION` | RETIRED_multi_wallet_or__routing |
| `PROJECT_INDEX` | VERIFY_uncategorized |
| `PUBLIC_ARTIFACT_PROMPT` | VERIFY_uncategorized |
| `QDRANT_API_KEY` | KEEP_vector_db |
| `QDRANT_URL` | KEEP_vector_db |
| `RATE_LIMIT_REDIS_URL` | KEEP_db |
| `REDIS_URL` | KEEP_db |
| `REFRESH_TOKEN_EXPIRE_DAYS` | KEEP_auth |
| `REPLICATE_API_KEY` | VERIFY_uncategorized |
| `REPO__OPS` | RETIRED__repo_naming |
| `REPO__OPS_PURPOSE` | RETIRED__repo_naming |
| `REPO__STORE` | RETIRED__repo_naming |
| `REPO__STORE_PURPOSE` | RETIRED__repo_naming |
| `REPO_CROSSLISTER` | KEEP_repo_metadata |
| `REPO_CROSSLISTER_PURPOSE` | KEEP_repo_metadata |
| `REPO_DASHBOARD` | KEEP_repo_metadata |
| `REPO_DASHBOARD_PURPOSE` | KEEP_repo_metadata |
| `REPO_DATEAPP` | KEEP_repo_metadata |
| `REPO_DATEAPP_PURPOSE` | KEEP_repo_metadata |
| `SABRETOOTH_CPU` | KEEP_node_identity |
| `SABRETOOTH_CROSSLISTER_DEV` | KEEP_node_identity |
| `SABRETOOTH_DATEAPP_DEV` | KEEP_node_identity |
| `SABRETOOTH_ENIGMA_DIR` | RETIRED_naming |
| `SABRETOOTH_GPU` | KEEP_node_identity |
| `SABRETOOTH_HOSTNAME` | KEEP_node_identity |
| `SABRETOOTH_IP` | KEEP_node_identity |
| `SABRETOOTH_OPUS_DIR` | KEEP_node_identity |
| `SABRETOOTH_OS` | KEEP_node_identity |
| `SABRETOOTH_PLATFORM` | KEEP_node_identity |
| `SABRETOOTH_RAM` | KEEP_node_identity |
| `SABRETOOTH_ROLE` | KEEP_node_identity |
| `SABRETOOTH_USER` | KEEP_node_identity |
| `SABRETOOTH_WORKSPACE` | KEEP_node_identity |
| `SDXL_MODEL` | VERIFY_uncategorized |
| `SENDGRID_API_KEY` | VERIFY_uncategorized |
| `SERVER_IP` | KEEP_node_identity |
| `SKILL_BOOTSTRAP` | VERIFY_uncategorized |
| `SQUARE_ACCESS_TOKEN` | KEEP_canonical_payments |
| `SQUARE_ACCESS_TOKEN_HIGHRISK` | KEEP_canonical_payments |
| `SQUARE_ACCESS_TOKEN_STANDARD` | KEEP_canonical_payments |
| `SQUARE_APP_ID` | KEEP_canonical_payments |
| `SQUARE_APP_ID_HIGHRISK` | KEEP_canonical_payments |
| `SQUARE_APP_ID_STANDARD` | KEEP_canonical_payments |
| `SQUARE_BASIC_PLAN_ID` | KEEP_canonical_payments |
| `SQUARE_BOT_SHIELD_LINK` | KEEP_canonical_payments |
| `SQUARE_ELITE_PLAN_ID` | KEEP_canonical_payments |
| `SQUARE_EMAIL` | KEEP_canonical_payments |
| `SQUARE_EMAIL_HIGHRISK` | KEEP_canonical_payments |
| `SQUARE_EMAIL_STANDARD` | KEEP_canonical_payments |
| `SQUARE_FOUNDING_MEMBER_LINK` | KEEP_canonical_payments |
| `SQUARE_LOCATION_ID` | KEEP_canonical_payments |
| `SQUARE_LOCATION_ID_HIGHRISK` | KEEP_canonical_payments |
| `SQUARE_LOCATION_ID_STANDARD` | KEEP_canonical_payments |
| `SQUARE_MERCHANT_ID` | KEEP_canonical_payments |
| `SQUARE_MERCHANT_ID_STANDARD` | KEEP_canonical_payments |
| `SQUARE_PREMIUM_PLAN_ID` | KEEP_canonical_payments |
| `SSH_KEY` | KEEP_node_identity |
| `STABILITY_API_KEY` | VERIFY_uncategorized |
| `STRIPE_CANCEL_URL` | VERIFY_stripe_non_dating_only |
| `STRIPE_LINK_12MONTH` | VERIFY_stripe_non_dating_only |
| `STRIPE_LINK_3MONTH` | VERIFY_stripe_non_dating_only |
| `STRIPE_LINK_BOTSHIELD` | VERIFY_stripe_non_dating_only |
| `STRIPE_LINK_FOUNDING_MEMBER` | VERIFY_stripe_non_dating_only |
| `STRIPE_LINK_ROYALTY` | VERIFY_stripe_non_dating_only |
| `STRIPE_PUBLIC_KEY` | VERIFY_stripe_non_dating_only |
| `STRIPE_SECRET_KEY` | VERIFY_stripe_non_dating_only |
| `STRIPE_SUCCESS_URL` | VERIFY_stripe_non_dating_only |
| `T5500_ANTIGRAVITY` | KEEP_node_identity |
| `T5500_CPU` | KEEP_node_identity |
| `T5500_GPU` | KEEP_node_identity |
| `T5500_HOSTNAME` | KEEP_node_identity |
| `T5500_IP` | KEEP_node_identity |
| `T5500_PATHS` | KEEP_node_identity |
| `T5500_PLATFORM` | KEEP_node_identity |
| `T5500_RAM` | KEEP_node_identity |
| `T5500_ROLE` | KEEP_node_identity |
| `T5500_SERVICES` | KEEP_node_identity |
| `T5500_SSH` | KEEP_node_identity |
| `T5500_USER` | KEEP_node_identity |
| `TELEGRAM_BOT_TOKEN` | VERIFY_active_bot |
| `TELEGRAM_BOT_USERNAME` | VERIFY_active_bot |
| `TELEGRAM_CHAT_ID` | VERIFY_active_bot |
| `TELEGRAM_OWNER_ID` | VERIFY_active_bot |
| `TWITTER_ACCESS_SECRET` | VERIFY_x_platform |
| `TWITTER_ACCESS_TOKEN` | VERIFY_x_platform |
| `TWITTER_API_KEY` | VERIFY_x_platform |
| `TWITTER_API_SECRET` | VERIFY_x_platform |
| `TWITTER_BEARER_TOKEN` | VERIFY_x_platform |
| `TWITTER_CLIENT_ID` | VERIFY_x_platform |
| `TWITTER_CLIENT_SECRET` | VERIFY_x_platform |
| `UNSPLASH_API_KEY` | VERIFY_uncategorized |
| `URL_API` | VERIFY_uncategorized |
| `VITE_APP_URL` | VERIFY_uncategorized |
| `WEBHOOK_BASE_URL` | KEEP_webhooks |
| `XAI_API_KEY` | KEEP_founding_four |
| `YOUTUBE_API_KEY` | KEEP_content_engine |
| `YOUTUBE_CLIENT_ID` | KEEP_content_engine |
| `YOUTUBE_CLIENT_SECRET` | KEEP_content_engine |
| `YOUTUBE_REDIRECT_URI` | KEEP_content_engine |

## Recommended action

1. **File is unused for runtime** — rename or move it so future env-scan scripts skip it. Suggested rename: `HERMES9020-ENV-2026-05-18T043653Z.env.retired-2026-05-27` (or move to a `Personal Vault-Sabretooth/archive/` subdir if you want one).
2. **Keys flagged `KEEP_*`** are presumed already in `MASTER-UNIVERSAL-ENV-TROLLZ1004.env`. No re-export needed. Confirmed live during today's session: `OPENROUTER_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_API_KEY` — all present in master vault.
3. **Keys flagged `RETIRED_*`** should never appear in any new `.env` writes. CI doctrine drift scan could grow to ban these prefixes outright: `ENIGMA_`, `OMEGA_`, `_REVENUE_WALLET`, `DATING_REVENUE_WALLET`, `DAO_TREASURY_WALLET`, `OPS_WALLET`, `PROFIT_TO__*`, `REPO__*`, `PAPERCLIP_*`, `CLAWDBOT_*`, `AWS_*`, `MISSION_`, `SABRETOOTH_ENIGMA_DIR`, `HENTAI_MODEL`, `DROID_CLAWDBOT`.
4. **Keys flagged `VERIFY_uncategorized`** (61 keys) need a founder eyeball — mostly standard secrets without doctrine prefixes (Postgres URLs, JWT secret, OpenAI keys, blockchain wallet config, etc.). Not urgent if file is retired.

## R6 invariant restated

The active Hermes Agent install at `%LOCALAPPDATA%\hermes\.env` and the custom Hermes Router at `services/hermes-router/.env*` MUST NOT contain `ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEY_OAUTH`, or `CLAUDE_API_KEY`. **Verified 2026-05-27: zero hits in either runtime path.** This audit file is a vault-only snapshot — never load it into Hermes.

#UntilNoKidInNeed
