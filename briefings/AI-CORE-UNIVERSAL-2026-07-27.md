# AI Core Universal Briefing — 2026-07-27
_Update this file to sync Hermes/Gemini/Claude/Codex/Manus/OpenClaw on doctrine, services, and runtime state._

## Runtime State
- Repo: `github.com/Trollz1004/ANTIGRAVITY`, branch `main` only
- Working dir: `E:\ANTIGRAVITY`
- Date app frontend: `E:\ANTIGRAVITY\frontend\react-app`
- Mission control: `E:\ANTIGRAVITY\mission-control`
- Paperclip state: `E:\ANTIGRAVITY\.paperclip-local\instances\default\config.json`
- OmniRoute: local `http://127.0.0.1:20128`, public tunnel `https://louise-pee-lucky-scenarios.trycloudflare.com/v1`
- OpenClaw: `http://127.0.0.1:18789`
- Auth proxy: `http://127.0.0.1:3110`
- Dashboard: `http://127.0.0.1:5678` (red/green lights, easy button)
- Hermes profile: `C:\Users\joshl\AppData\Local\hermes\profiles\dateapp\`
- Live Hermes config: `C:\OPUS\hermes\config.yaml` + `E:\ANTIGRAVITY\hermes-config.json`

## Hardware
- T5500: dual Xeon, 72GB, no dedicated GPU
- Sabretooth: 64GB, NVIDIA GTX 1070 ASUS 8GB, CUDA 12.6 driver 560.94
- 9020: i7-4790, 32GB, income node
- GPU rule: 1 GPU per node. Sabretooth = 1070, others = none

## Services Auto-Start
Single scheduled task: `ANTIGRAVITY-Bootstrap` → `scripts/autostart-mission.ps1`
All other legacy ANTIGRAVITY/Paperclip/MissionControl/OpenClaw/Cloudflared/OmniRoute tasks disabled.

## Payment Canonical
- Square-only (`square.link`, NOT Stripe)
- Square date-app wallet: `ebaytrashortreasure@gmail.com`
- No crypto, no PayPal

## Auth
- Google SSO + 2FA/TOTP mandatory
- SMS to +1 (352) 973-5909 only

## Security
- No Anthropic API keys anywhere
- No secrets/keys/credentials in tracked code
- Rotate any exposed keys immediately
- OneDrive vault exempt from scans

## Agent Routing
- X/Twitter → Grok
- Meta → Manus
- YouTube/Google → Gemini
- Research/other → Perplexity
- Code → Codex
- Strategy → Opus/Claude Code CLI
- Default fallback: local Ollama → OpenRouter free → Gemini → OpenAI → Grok → Pi → Nous → Claude Code CLI

## Node Duties
- T5500: repo state, customer-service OpenClaw, date app
- Sabretooth: Opus + Hermes default node, NO ad-hoc AI work
- 9020: income node, zero overlap with Antigravity

## Recent Decisions
- 2026-07-27: 4-project deploy manifest scrubbed to Square-only, no crypto, no Anthropic
- 2026-07-27: Watchdog popups fixed — infinite loop removed, duplicates disabled
- 2026-07-27: Dashboard rebuilt as lights-only with easy-fix buttons
- 2026-07-27: Frontend startup fixed — npm.cmd via cmd.exe wrapper
- 2026-07-27: Mission control startup fixed — tsx entry detection
- 2026-07-27: Paperclip loopback simplified — no Docker dependency
- 2026-07-27: Node map updated — GTX 1070 ASUS 8GB on Sabretooth, CUDA live
