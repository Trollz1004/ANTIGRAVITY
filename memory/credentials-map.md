# CREDENTIALS MAP — WHERE KEYS LIVE (PATHS ONLY)

**Last Updated**: 2026-02-14T08:30:00Z  
**RULE**: This file stores PATHS to credentials, NOT the values. Values stay in vault files.

## Vaults

| Vault | Path | Contains |
|-------|------|----------|
| ADMIN-KEY-9020.env | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env | ANTHROPIC_ADMIN_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY |
| MASTER-ENV (SABRETOOTH) | C:\OPUSONLY\.vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env (when SSD back in SABRETOOTH) | All keys |

## Claude / Anthropic

| Credential | Path |
|------------|------|
| Claude Code OAuth | C:\Users\joshl\.claude\.credentials.json |
| Subscription | Max (rateLimitTier: default_claude_max_20x) |
| Admin Key | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env → ANTHROPIC_ADMIN_KEY |
| API Key | D:\OPUSONLY\.vault\ADMIN-KEY-9020.env → ANTHROPIC_API_KEY |
| Setup Token | dmXGIjm26ElQNQ7THx3FszvHV70Kk9yLcxHtVyAXd4AnwKje#UT8z0xP1a1qd1Y9JxOOBEzsV9aqzDEen9Px7JCjCddo |

## Google / Gemini

| Credential | Path / Value |
|------------|-------------|
| Gemini API Key | AIzaSyC4MEyP2XofywMZ6aqMTNnk4rRwVijGNC0 (in openclaw.json memorySearch) |
| GCP Service Account | Was on E:\.claude\ (SABRETOOTH) — may need to re-download from GCP console |
| GCP Project | ai-collab4kids (ACTIVE — NOT banned) |

## Telegram Bot

| Credential | Value |
|------------|-------|
| Bot Name | @AiSolutionsForTheKids_bot |
| Bot Token | 8313006115:AAH5xv4ol7RoScmuM3SAUJgt_93IS6rpblQ |

## OpenClaw (being replaced with custom code)

| Credential | Path |
|------------|------|
| Config | C:\Users\joshl\.openclaw\openclaw.json |
| Auth Profiles | C:\Users\joshl\.openclaw\agents\main\agent\auth-profiles.json |
| Models | C:\Users\joshl\.openclaw\agents\main\agent\models.json |
| OAuth | C:\Users\joshl\.openclaw\credentials\oauth.json |
| Gateway Token | opus-9020-2026 |
| Gateway Port | 18789 |

## Cloudflare

| Credential | Location |
|------------|----------|
| Account ID | 516a3a855f44f5ad8453636d163ae25d |
| API Token | 1qmSQ2fLPTYk30MuENHQ6HWg435nv-0vaKOzVr78 |
| Login | joshlcoleman@gmail.com (Google sign-in, account may show as "OMEGA") |
| Dead Tunnel ID | e7de7653-980c-49fc-a116-4a05871025ae (DELETE THIS) |

## Crypto / DAO (Base Mainnet, Chain 8453)

| Wallet | Address |
|--------|---------|
| DAO Treasury | 0xa87874d5320555c8639670645F1A2B4f82363a7c |
| Dating Revenue | 0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121 |
| Ops Wallet | 0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4 |

## SSH / Remote Access

| Node | User | Method |
|------|------|--------|
| 9020 | opus (password: opus2026) | SSH, SMB (\\192.168.0.5\DATE APP STORAGE LOCAL) |
| T5500 | aicol | SSH (NO SCP/SFTP — use base64 through SSH) |
| 9020 Chrome RDP | joshlcoleman@gmail.com | PIN: 1004 |
| AWS EC2 | - | dateapp.pem (recovered from Antigravity history) |

## GitHub

| Item | Value |
|------|-------|
| Account | Trollz1004 |
| ENIGMA-private secrets | 29 secrets deployed |
