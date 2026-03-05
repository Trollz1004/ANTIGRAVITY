# CREDENTIALS MAP — WHERE KEYS LIVE (PATHS ONLY)

**Last Updated**: 2026-03-05
**RULE**: This file stores PATHS to credentials, NEVER the values themselves. Values stay in vault files only.

## Vaults

| Vault | Path | Contains |
|-------|------|----------|
| Runtime .env | C:\ANTIGRAVITY\.env | Active runtime secrets (gitignored) |
| Master vault | briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env | All keys (gitignored) |
| Fallback vault | E:\WHEN OPUS FORGETS\ | Emergency backup (never push) |
| Hidden local | C:\Users\joshl\.antigravity\master.env | Local copy |
| Cloud backup | OneDrive\...\MASTER-UNIVERSAL-ENV-TROLLZ1004.env | Cloud sync |
| GitHub Secrets | Trollz1004/ANTIGRAVITY | 88 secrets |
| GitHub Variables | Trollz1004/ANTIGRAVITY | 58 readable vars |

## Claude / Anthropic

| Credential | Location |
|------------|----------|
| Claude Code OAuth | C:\Users\joshl\.claude\.credentials.json |
| Subscription | Max (rateLimitTier: default_claude_max_20x) |
| Admin Key | Vault file → ANTHROPIC_ADMIN_KEY |
| API Key | Vault file → ANTHROPIC_API_KEY |

## Google / Gemini

| Credential | Location |
|------------|----------|
| Gemini API Key | .env → GEMINI_API_KEY (rotate if exposed) |
| GCP Service Account | E:\.claude\*.json |
| GCP Project | ai-collab4kids |

## Telegram Bot

| Credential | Location |
|------------|----------|
| Bot Name | @AiSolutionsForTheKids_bot |
| Bot Token | .env → TELEGRAM_BOT_TOKEN (rotate if exposed) |

## Cloudflare

| Credential | Location |
|------------|----------|
| Account ID | .env → CLOUDFLARE_ACCOUNT_ID |
| API Token | Cloudflare dashboard (Profile > API Tokens) |
| Login | joshlcoleman@gmail.com (Google sign-in) |

## Crypto / DAO (Base Mainnet, Chain 8453)

| Wallet | Address |
|--------|---------|
| DAO Treasury | 0xa87874d5320555c8639670645F1A2B4f82363a7c |
| Dating Revenue | 0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121 |
| Charity Revenue | 0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B |
| Ops Wallet | 0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4 |

> Wallet addresses are PUBLIC by design (on-chain). These are NOT secrets.

## SSH / Remote Access

| Node | User | Method |
|------|------|--------|
| 9020 | joshl | SSH key (C:\Users\joshl\.ssh\id_ed25519) |
| T5500 | joshl | SSH key |
| All nodes | — | Credentials in vault files ONLY |

## GitHub

| Item | Location |
|------|----------|
| Account | Trollz1004 |
| PAT | Windows Credential Manager (NOT .env) |
| Secrets | github.com/Trollz1004/ANTIGRAVITY/settings/secrets |
