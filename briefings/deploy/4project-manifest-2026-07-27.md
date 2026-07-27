# 4-Project Deploy Manifest
_Canonical ref: briefings/deploy/4project-manifest-2026-07-27.md_

## Projects
1. ClaudeDroid AI — NSFW-enabled mobile/desktop AI UI
2. Dating DAO — governance layer for YouAndINotAI
3. AI Marketplace — agent/model listing + contract flow
4. Admin Dashboard — unified ops panel

## Auth
- Google SSO + 2FA/TOTP mandatory
- One identity per project boundary

## Payments
- Square-only
- Square date-app wallet: ebaytrashortreasure@gmail.com
- Crypto off by default

## Integrations
- Claude via Claude.ai / OpenRouter only
- Perplexity
- Ollama local + OpenRouter free NVIDIA
- SMS: Twilio → +1 (352) 973-5909 only

## UI
- Floating triple preview windows
- Real-time agent feed
- Admin code execution whitelist only

## Routing
- OmnRoute LB :20128 / :20129
- Cloudflare tunnel per project subdomain
- Memory MCP consolidated

## Gate
- Founder approval required for production deploy
- Staging OK autonomously
