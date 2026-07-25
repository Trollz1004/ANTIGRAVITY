# CREDENTIALS MAP — WHERE KEYS LIVE (PATHS ONLY)

**Last Updated**: 2026-03-21
**RULE**: This file stores PATHS to credentials, NEVER the values themselves. Values stay in vault files only.
**CHAIN NOTE**: any on-chain wallet rows below are historical address references only; do not infer current multisig status or current LLC operating doctrine from this file alone.

## Vaults

| Vault | Path | Contains |
|-------|------|----------|
| Runtime .env | C:\ANTIGRAVITY\.env | Active runtime secrets (gitignored) |
| Master vault | briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env | All keys (gitignored) |
| Fallback vault | E:\WHEN OPUS FORGETS\ | Emergency backup (never push) |
| Hidden local | C:\Users\joshl\.antigravity\master.env | Local copy |
| Cloud backup | OneDrive\...\MASTER-UNIVERSAL-ENV-TROLLZ1004.env | Cloud sync |
| Imported node/GCR bundle | C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\GLOBALNODE-CREDENTIALS-2026-03-21.env | Separate holding file for imported node, GCR admin, and Codex service credentials |
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
| Imported GCR/Admin env bundle | C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\GLOBALNODE-CREDENTIALS-2026-03-21.env |
| GCP Project | ai-collab4kids |

## Telegram Bot

| Credential | Location |
|------------|----------|
| Primary Bot | Sabretooth local OpenClaw config / local env only |
| Backup Bot | T5500 local OpenClaw config only |
| Bot Tokens | Local env or local OpenClaw config only (rotate if exposed) |

## Cloudflare

| Credential | Location |
|------------|----------|
| Account ID | .env → CLOUDFLARE_ACCOUNT_ID |
| API Token | Cloudflare dashboard (Profile > API Tokens) |
| Login | joshlcoleman@gmail.com (Google sign-in) |

## Historical Base Contract References (Chain 8453) — not current LLC operating doctrine

| Wallet | Address | Type |
|--------|---------|------|
| Gospelpayment Contract | 0x9855B75061D4c841791382998f0CE8B2BCC965A4 | Verified on BaseScan |
|  Fund (60%) | 0x8d3dEADbE2b4B857A43331D459270B5eedC7084e | Historical payout wallet reference |
| Infrastructure/Dev (30%) | 0xe0a42f83900af719019eBeD3D9473BE8E8f2920b | Historical payout wallet reference |
| Founder/Ops (10%) | 0x7c3E283119718395Ef5EfBAC4F52738C2018daA7 | Historical payout wallet reference |

> Wallet addresses are PUBLIC by design (on-chain). These are NOT secrets.
> They are historical reference points only and do not, by themselves, authorize current live routing claims.

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

## Apify (web scraping — trend research + content seeding)

| Credential | Location |
|------------|----------|
| Account | console.apify.com (GitHub OAuth — signed in 2026-03-14) |
| API Token | Vault file → `APIFY_TOKEN` ← **needs to be generated and added** |
| Token path | Settings → Integrations → "Create new token" → name: ANTIGRAVITY |
| Used by | `scripts/apify_content_scout.py`, `.vscode/mcp.json` (Apify MCP server) |
| Free tier | $5/month credits, no card required |
| Briefing | `briefings/apify-openclaw/BRIEFING.md` |
