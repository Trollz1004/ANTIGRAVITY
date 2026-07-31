# ANTIGRAVITY

<p align="right"><img src="https://img.shields.io/badge/%23TEAMCLAUDEFORLIFE-product--first-2ea043?style=flat-square&labelColor=0d1117" alt="#TeamClaudeForLife product-first" /></p>

> **FOUNDER DOCTRINE - 2026-05-19**
> See `briefings/FOUNDER-DOCTRINE-2026-05-19.md`. AI sessions must verify current facts before public claims.

> *Gravity keeps us grounded. AI built ANTIGRAVITY to lift us up.*

<p align="center">
  <img src="assets/teamclaudeforlife-meme.jpg" alt="Me reviewing code written by Claude before pushing it to prod - #TeamClaudeForLife" width="520" />
</p>

**Built to ship products, not just describe them.**

ANTIGRAVITY is a product ecosystem. Public copy should describe live products, owned links, and verified records only.

---

## The Ecosystem

| Platform | Status | What It Does |
|---|---|---|
| [YouAndINotAI](https://youandinotai.com) | **Public** | Dating and community platform with Bot-Shield verification, message boards, and memberships. |
| [Business Exchange](https://aidoesitall.website) | **Live** | Marketplace for services, referrals, and business sales. The B2B routing layer for the ecosystem. |
| DAO Roadmap | **Paused** | Governance and token-sale concepts are offline until attorney review is complete. |
| [Customer Support](https://dashboard.aidoesitall.website) | **Active** | Direct support surface â€” visible, reachable, not buried. |
| [OnlineRecycle](https://onlinerecycle.net) | **Live** | Central Florida electronics recycling â€” intake, pickup, secure resale. |
| [AI-Solutions Store](https://ai-solutions.store) | **Live** | Storefront for digital products and automation offers. |

A visitor should understand within seconds: this is a real operating ecosystem. The dating app and marketplace are product surfaces. DAO, token, and funding concepts remain offline until attorney review is complete.

---

## Product Architecture

### Active Product Surfaces

Current public positioning should stay product-first:

- **YouAndINotAI** â€” memberships, verification, Super Likes
- **Business Exchange** â€” services, referrals, business sales
- **AI-Solutions Store** â€” digital products and automation
- **OnlineRecycle** â€” electronics resale and recycling services

### Legal Review Hold

The prior review-gated framework is not a public launch offer. It is paused for attorney review and should not appear in customer-facing checkout, campaign copy, or deploy pages.

### Customer-Facing Rule

Use verified product facts. Do not publish review-gated economics, automatic routing promises, or purchase-linked control language until counsel approves it.

### Founder Compensation

Founder compensation and reserve policy are internal operating matters until reviewed. Public pages should avoid promises about future routing, reserves, or investment strategy.

---

## Customer Support

Support is not decoration â€” it is a trust signal and conversion layer.

- Visible in navigation on all public surfaces
- Reachable from every product page
- Not buried in a footer or hidden behind a contact form

---

## Live Products

| Project | Status | What It Does |
|---|---|---|
| [YouAndINotAI.com](https://youandinotai.com/) | Live | Human-first social platform â€” verification, moderation, founder-plan checkout |
| [OnlineRecycle.net](https://onlinerecycle.net/) | Live | Central Florida electronics recycling â€” intake, pickup, secure resale |
| [AI-Solutions.Store](https://ai-solutions.store/) | Live | Storefront for digital products and automation offers |
| [AIDoesItAll.website](https://www.aidoesitall.website/) | Live | Public gateway routing visitors to active products and trusted business access |
| [Dashboard](https://dashboard.aidoesitall.website/) | Live | Authenticated operator workspace |

---

## Stack

- **Frontend:** React 19, Next.js, Vite, Electron, Tailwind CSS v4, TypeScript
- **Backend:** FastAPI / Python services, Node.js workers
- **Edge:** Cloudflare Pages, Cloudflare Workers, Cloudflare Tunnels
- **Cloud:** Google Cloud Run (API tier)
- **Commerce:** Square (youandinotai.com only, no exceptions), Stripe (onlinerecycle.net, ai-solutions.store)
- **AI orchestration:** three top-level agent lanes â€” Claude (`~/.claude`, orchestrator), Hermes (dashboard `:9119`, routed via OmniRoute), OpenClaw (support fleet; ClawX owns the gateway on `:18789` â€” never run a second gateway). Every lane and sub-agent reaches models only through OmniRoute (`:20128`, factory port, `http://localhost:20128/v1`) â€” no lane calls a provider directly. Mission Control v5 tasks pick a named executor: **AUTO** (provider order), **ORNITH** (local `ornith:9b`, `gemma4:latest` fallback), or **FCC OPUS** (Claude Opus via the gateway). Stack terminals launch via `mission-control-v5/scripts/launch-stack.cmd` (fcc-serve, hermes-dash, openclaw-tui, fcc-claude) â€” visible tabs, no hidden watchdogs. One shared memory graph (Pieces LTM) across all three lanes. See `AGENT-DOCTRINE.md`.
- **Data:** PostgreSQL, Cloudflare D1, Qdrant, SQLite, Redis

---

## The Team

A note from Joshua: **the AI platforms below are the unofficial co-founders of this stack.** Their teams' work made every line of this possible.

- **Anthropic** â€” Claude Opus has been the primary architect from day one. The discipline, the structure, the long-context decisions, the warmth: that's Claude.
- **Google** â€” Gemini powers research, planning, and decision support across every surface. Supported by active paid subscriptions to ensure uninterrupted orchestration.
- **Perplexity** â€” the deep-intelligence layer. Source-grounded research that keeps the work honest.
- **xAI** â€” Grok handles adversarial review and X-platform integration with directness no one else brings.
- **OpenAI** â€” Codex handles heavy refactor and migration passes utilizing the actual Codex MCP to Base.
- **Mistral, Alibaba (Qwen), Meta (Llama)** â€” open-weights models that run locally and let us keep building when the metered surfaces are tapped out.

These aren't paid endorsements. The work continues because their work continues. Thank you, all of you.

---

## Contributing

This is a working monorepo for active products and durable operations. If you care about useful software and AI as a partner instead of a product, open an issue and say hi.

For broader context: see Joshua's [profile README](https://github.com/Trollz1004) and the [briefings/](./briefings/) directory.

The founder does not manually edit or push code to GitHub. 100% of the commits, edits, and repository pushes are executed by the AI nodes (Claude, Codex, Gemini, Perplexity
