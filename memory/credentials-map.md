# CREDENTIALS MAP — WHERE KEYS LIVE (PATHS ONLY)

**Last Updated**: 2026-03-01
**RULE**: This file stores PATHS to credentials, NOT the values. Values stay in vault files.
**WARNING**: This file is tracked in git. NEVER put actual key values here.

## Vaults

| Vault | Path | Contains |
|-------|------|----------|
| ADMIN-KEY-9020.env | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env | ANTHROPIC_ADMIN_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY |
| MASTER-ENV (SABRETOOTH) | C:\OPUSONLY\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env (when SSD back in SABRETOOTH) | All keys |

## Claude / Anthropic

| Credential | Location |
|------------|----------|
| Claude Code OAuth | C:\Users\joshl\.claude\.credentials.json |
| Subscription | Max (rateLimitTier: default_claude_max_20x) |
| Admin Key | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env → ANTHROPIC_ADMIN_KEY |
| API Key | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env → ANTHROPIC_API_KEY |

## Google / Gemini

| Credential | Location |
|------------|----------|
| Gemini API Key | C:\Users\joshl\.openclaw\openclaw.json → memorySearch.apiKey |
| GCP Service Account | Re-download from GCP console if needed |
| GCP Project | ai-collab4kids (ACTIVE) |

## Telegram Bot

| Credential | Location |
|------------|----------|
| Bot Name | @CLAUDEsMiniBot |
| Bot Token | C:\Users\joshl\.openclaw\openclaw.json → channels.telegram.token |
| Old Bot (DEAD) | @AiSolutionsForTheKids_bot (decommissioned 2026-03-01) |

## OpenClaw

| Credential | Location |
|------------|----------|
| Config | C:\Users\joshl\.openclaw\openclaw.json |
| Auth Type | Ollama local (FREE — no API token needed for chat) |
| Embeddings | Gemini gemini-embedding-001 (FREE tier) |
| Gateway Token | Set in openclaw.json → gateway.auth.token |
| Gateway Port | 18789 |

## Cloudflare

| Credential | Location |
|------------|----------|
| Account ID | In vault / Cloudflare dashboard |
| API Token | In vault (rotate if compromised) |
| Login | joshlcoleman@gmail.com (Google sign-in) |

## Crypto / DAO (Base Mainnet, Chain 8453)

| Wallet | Address |
|--------|---------|
| DAO Treasury | 0xa87874d5320555c8639670645F1A2B4f82363a7c |
| Dating Revenue | 0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121 |
| Ops Wallet | 0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4 |

Note: Wallet addresses are public by design (blockchain). Private keys are in vault ONLY.

## SSH / Remote Access

| Node | User | Auth Method |
|------|------|-------------|
| 9020 | opus | Password in vault |
| T5500 | aicol | SSH key (NO SCP/SFTP — use base64 through SSH) |
| AWS EC2 | - | dateapp.pem (C:\Users\joshl\.antigravity\dateapp.pem) |

## GitHub

| Item | Value |
|------|-------|
| Account | Trollz1004 |
| ENIGMA-private secrets | 29 secrets deployed via GitHub Secrets |
