# Opus Status — T5500 (Orchestrator)

> Auto-updated by Claude Code (Opus 4.6). Last update: 2026-03-02

## Node Health
| Component | Status | Details |
|-----------|--------|---------|
| Claude Code | ONLINE | Opus 4.6, Max $200/mo subscription |
| Ollama | ONLINE | llama3.2:latest, llama2:13b, nomic-embed-text, deepseek-v3.1 |
| OpenClaw Gateway | ONLINE | Port 18789, PID active, Telegram polling |
| Docker: Redis | ONLINE | Port 6379 |
| Docker: Qdrant | ONLINE | Port 6333-6334 |
| Docker: WhatsApp Bridge | REPAIRING | Chromium session reset, needs QR re-pair |
| SSH → 9020 | ONLINE | 192.168.0.5, ed25519 key auth verified |

## Current Focus
- eBay 52-Card Founders DAO Deck listings (prompts delivered to Gemini + Perplexity)
- OpenClaw T5500 gateway running with local Ollama (zero API cost)
- WhatsApp bridge fix in progress (Chromium profile rebuilt)

## Blockers
- STRIPE_SECRET_KEY not in .env (4 Omega Sentry tools dead)
- Max $200/mo subscription at financial risk
- WhatsApp bridge needs QR code re-pair from Josh's phone

## Completed This Session
- Consolidated .env from both nodes → C:\OPUSONLY\.env
- Reconfigured T5500 OpenClaw from Moonshot/Kimi → local Ollama
- Fixed WhatsApp bridge crash loop (stale Chromium singleton lock)
- eBay card designs, listings, and agent prompts created and pushed

## Infrastructure
- GPU: GTX 1070 8GB (CUDA 12.6) — getting 1050 Ti after swap
- RAM: 72GB installed / 64GB usable (DIMM/riser issue)
- Ollama: customer-facing only (onboarding, support, safety alerts)
- 9020 link: SSH + Ollama HTTP (http://192.168.0.5:11434)

## Next Actions
1. Josh: paste Stripe secret key into .env
2. Josh: scan WhatsApp QR code to re-pair bridge
3. Josh: paste 9020 master .env keys (Plaid, YouTube, Gmail, GCR)
4. Build Ollama Bridge MCP server (when finances stable)
5. Fix YouAndINotAI hero AI branding ("powered by Gemini" → remove)
