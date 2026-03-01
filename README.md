<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ANTIGRAVITY — Joshua Coleman Ecosystem (Feb 2026)

I'm Joshua "Josh" Coleman, CEO/Co-Founder of **Trash Or Treasure Online Recycler LLC** (Florida). I run an AI-powered ecosystem where revenue from apps, a dating platform, and electronics recycling funds kids' charities (**#ForTheKids**), with reputation, legality, kid-safety, and platform ToS compliance taking priority over growth.

## Core Principles

- Always follow the Terms of Service of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, WhatsApp, Stripe, email providers, hosts).
- No scraping or harvesting of personal emails/DMs for bulk marketing; all growth is opt-in and compliant with laws like CAN-SPAM/GDPR.
- Systems must be kid-safe and parent-friendly, with clear privacy practices and no dark patterns.
- Secrets (API keys, tokens, passwords) are stored in environment variables or secure vaults and are never committed to the repo.

## Public Projects in This Ecosystem

| Project                                                            | Description                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[AI-Solutions.Store](https://ai-solutions.store)**               | "Real AI apps, not just chatbots": high- and mid-ticket AI products (assistant agents, full app bundles), with a large share of profits routed into kids' charities and a future governance/rewards layer. |
| **[YouAndINotAI.com](https://youandinotai.com)**                   | AI-assisted, human-verified dating app "for a cause" with low-friction verification, a founding member subscription, and Stripe billing, designed to plug into the same charity pipeline.                  |
| **[OnlineRecycle.org](https://onlinerecycle.org)**                 | Trash Or Treasure electronics recycler: accepts donated devices, resells via online storefronts, and channels profit toward kids-focused initiatives.                                                      |
| **[Antigravity Dashboard](https://dashboard.aidoesitall.website)** | Public mission-control site explaining nodes, AI orchestration, revenue routing, and how all properties interconnect under #ForTheKids.                                                                    |

## Infra & Deployment

- All public sites are static, hosted on **GitHub Pages** or **Cloudflare Pages**, with manual uploads only (no paid GitHub features, no CI/Actions).
- **Cloudflare** provides DNS, TLS, caching, and rate limiting in front of these static origins.
- Builds are created locally on dedicated nodes and uploaded via provider dashboards.

## AI Roles & Collaboration

| Agent                     | Role                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **Claude**                | Architecture, deep reasoning, and serious code                                       |
| **Gemini**                | VS Code and browser-assisted research/orchestration                                  |
| **Perplexity (Comet)**    | Lead technical architect and strategist for workflows, automation loops, and prompts |
| **Ollama / Local Models** | Handle the majority of heavy compute to keep external API costs low                  |

Across all projects, the goal is to design durable, transparent, and ToS-compliant systems that can keep supporting kids' charities long term. When there's a choice between aggressive growth and a safer, parent-friendly path, this ecosystem always chooses the safer path.

---

## Operator Quick Start (Non-Dev)

```powershell
Set-Location C:\OPUSONLY
.\ops-sync-main.ps1
```

**Status docs:** `GEMINI-STATUS.md` · `OPUS-STATUS.md` · `CODEX-STATUS.md` · `JULES-STATUS.md`

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run the app: `npm run dev`
