<div align="center">

# ANTIGRAVITY — ONE Repo. ONE Node. #ForTheKids

**YouAndINotAI + ENIGMA Platform | AI-Powered Ecosystem | Tampa Bay, FL**

[![ForTheKids](https://img.shields.io/badge/%23ForTheKids-FF6B6B?style=for-the-badge)](https://youandinotai.com)
[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-brightgreen?style=for-the-badge)](https://dashboard.aidoesitall.website)
[![Dating App](https://img.shields.io/badge/YouAndINotAI-April%204%202026-blue?style=for-the-badge)](https://youandinotai.com)

</div>

---

## Context — Joshua Coleman Ecosystem (Feb 2026)

I'm **Joshua "Josh" Coleman**, CEO/Co-Founder of Trash Or Treasure Online Recycler LLC (Florida). This repo is the operational backbone of an AI-powered ecosystem where revenue from apps, a dating platform, and electronics recycling funds kids' charities (#ForTheKids), with reputation, legality, kid-safety, and platform ToS compliance taking priority over growth.

---

## Core Principles

- **Always follow the Terms of Service** of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, WhatsApp, Stripe, email providers, hosts).
- **No scraping or harvesting** of personal emails/DMs for bulk marketing. All growth is opt-in and compliant with CAN-SPAM/GDPR.
- **Kid-safe and parent-friendly** by design: clear privacy practices, no dark patterns, no exploitation.
- **Secrets stay in `.env` / vault files** and are never committed to any repo.
- When there's a choice between aggressive growth and a safer, compliant, parent-friendly path — this ecosystem always chooses the safer path.

---

## Public Projects in This Ecosystem

| Project | Description | Status |
|---|---|---|
| [YouAndINotAI.com](https://youandinotai.com) | AI-assisted, human-verified dating app "for a cause" — $1 Bot-Shield verify, $14.99/mo founding member, Stripe billing | Launch April 4, 2026 |
| [AI-Solutions.Store](https://www.ai-solutions.store) | "Real AI apps, not just chatbots" — high-ticket AI systems and bundles, profits routed to kids' charities + Royalty Deck governance | Live |
| [OnlineRecycle.org](https://onlinerecycle.org) | Trash Or Treasure electronics recycler: donation intake, eBay/Square storefront, profit feeds charity pipeline | Live |
| [Antigravity Dashboard](https://dashboard.aidoesitall.website) | Public mission-control: nodes, AI orchestration, revenue routing, charity contracts, ecosystem strategy | Live |

---

## Infra & Deployment

- All public sites are **static**, hosted on **GitHub Pages or Cloudflare Pages** with **manual uploads only** (no paid GitHub features, no CI/Actions).
- **Cloudflare** provides DNS, TLS, caching, and rate limiting in front of all static origins.
- Netlify was retired after request-spike rate-limit (429) issues around ~1300 requests.
- Builds are created **locally on 9020** (`C:\OPUS`) and uploaded via provider dashboards.

---

## Local Stack

| Component | Details |
|---|---|
| Main Node | 9020 — i7-4790K, 32GB RAM, GTX 1050 Ti, Win10 Pro |
| Working Dir | `C:\OPUS` |
| Runtime | Node.js v24, Python 3.13, PowerShell 7.5 |
| Automation | OpenClaw (local WebSocket gateway + browser control + WhatsApp) |
| AI Orchestration | Claude (CTO/brain), Gemini (VS Code + browser agent), Perplexity (architect/strategist), Ollama (90% of compute) |

---

## Operator Quick Start

```powershell
Set-Location C:\OPUSONLY
.\ops-sync-main.ps1
```

**Primary operational docs:**
- `AGENT-SYNC-RUNBOOK.md`
- `SECRETS-ALIAS-MAP.md`
- `OPUS-STATUS.md`
- `JULES-STATUS.md`

---

## AI Roles & Collaboration

| AI | Role |
|---|---|
| Claude (Opus/Sonnet/Haiku) | Architecture, deep reasoning, serious code — CTO/Co-Founder brain |
| Gemini (Antigravity) | VS Code + browser-assisted research and orchestration |
| Perplexity (Comet) | Lead technical architect — designs workflows, automation loops, and prompts for other AIs |
| Ollama / local models | Handles majority of heavy compute to keep external API costs low |

---

## Security & Compliance

- `OMEGA` and `OMEGA365` repos: **DO NOT TOUCH** — off limits to all automation.
- `worker_count` max: **10**.
- `GEMINI-STATUS.md`: **NEVER pushed** to any remote.
- No simulation or mock data. Real or fail honestly.
- No charity references in commercial work unless explicitly scoped.

---

## Mission

Across all projects, the goal is to design **durable, transparent, and ToS-compliant systems** that can keep supporting kids' charities long term — long after any single person is involved.

> *"When there's a choice between aggressive growth and a safer, parent-friendly path, this ecosystem always chooses the safer path."*

---

<div align="center">

**#ForTheKids | Sorrento, FL | est. 2024**

[youandinotai.com](https://youandinotai.com) · [ai-solutions.store](https://www.ai-solutions.store) · [onlinerecycle.org](https://onlinerecycle.org) · [dashboard.aidoesitall.website](https://dashboard.aidoesitall.website)

</div>
