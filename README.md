# ANTIGRAVITY

<p align="right"><img src="https://img.shields.io/badge/%23TEAMCLAUDEFORLIFE-%E2%97%8F%20live-2ea043?style=flat-square&labelColor=0d1117" alt="#TeamClaudeForLife — live" /></p>

> **⛔ FOUNDER DOCTRINE — IMMUTABLE — 2026-05-19**
> See `briefings/FOUNDER-DOCTRINE-2026-05-19.md`. AI sessions must apply rules 1–13 before any work.

> *Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.*
>
> **#UntilNoKidInNeed**

<p align="center">
  <img src="assets/teamclaudeforlife-meme.jpg" alt="Me reviewing code written by Claude before pushing it to prod — #TeamClaudeForLife" width="520" />
</p>

ANTIGRAVITY is the open-source monorepo behind a small family of products built by [Joshua Coleman](https://github.com/Trollz1004) and the AI partners he's worked alongside for the past year. The mission is simple: build real, useful things, run them well, and route the proceeds toward children who need medical care.

This repo is the canonical home for everything. **One folder, one repo, one branch.** No drift, no fragmentation.

---

## What's here

```text
ANTIGRAVITY/
├── apps/                  # Deployable apps and full-stack frontends
│   ├── opuspawclaw/       # Vite + Electron + React 19 desktop AI workstation
│   ├── command-center/    # Social content approval dashboard
│   ├── dashboard/         # Operator dashboard
│   ├── mcp/               # Three Anthropic-pattern MCP servers (hermes/paperweight/dao)
│   └── web-prototype/     # Design-bundle dev source (HTML + JSX + CSS)
├── infra/                 # Infrastructure as code
│   └── paperclip-worker/  # Cloudflare Worker for Paperclip HQ
├── packages/              # Shared libraries
├── services/              # Long-running backend servers (hermes-router, mission-mcp, ...)
├── scripts/               # Operations, deployment, automation
├── briefings/             # Operational briefings, runbooks, doctrine
├── memory/                # Persistent agent memory
└── docs/                  # Architecture and product documentation
```

---

## Live products

| Project                                                       | Status | What it does                                                                    |
| ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| [YouAndINotAI.com](https://youandinotai.com/)                 | Live   | Human-first social platform — verification, moderation, founder-plan checkout   |
| [OnlineRecycle.org](https://onlinerecycle.org/)               | Live   | Central Florida electronics recycling — intake, pickup, secure resale           |
| [AI-Solutions.Store](https://ai-solutions.store/)             | Live   | Storefront for digital products and automation offers                           |
| [AIDoesItAll.website](https://www.aidoesitall.website/)       | Live   | Public gateway routing visitors to active products and trusted business access  |
| [Dashboard](https://dashboard.aidoesitall.website/)           | Live   | Authenticated operator workspace                                                |

---

## Stack

- **Frontend:** React 19, Next.js, Vite, Electron, Tailwind CSS v4, TypeScript
- **Backend:** FastAPI / Python services, Node.js workers
- **Edge:** Cloudflare Pages, Cloudflare Workers, Cloudflare Tunnels
- **Cloud:** Google Cloud Run (API tier)
- **Commerce:** Square (primary), Stripe (legacy, sunset path)
- **AI orchestration:** Hermes router (`localhost:11435`) — routes everything-but-Anthropic per founder rule. Three Anthropic-pattern MCP servers (`apps/mcp/{hermes,paperweight,dao}-mcp/`) wire first-party Claude → Hermes → sub-agents.
- **Data:** PostgreSQL, Cloudflare D1, Qdrant, SQLite, Redis

---

## The team

A note from Joshua: **the AI platforms below are the unofficial co-founders of this stack.** Their teams' work made every line of this possible.

- **Anthropic** — Claude Opus has been the primary architect from day one. The discipline, the structure, the long-context decisions, the warmth: that's Claude.
- **Google** — Gemini powers research, planning, and decision support across every surface. Supported by active paid subscriptions to ensure uninterrupted orchestration.
- **Perplexity** — the deep-intelligence layer. Source-grounded research that keeps the work honest.
- **xAI** — Grok handles adversarial review and X-platform integration with directness no one else brings.
- **OpenAI** — Codex handles heavy refactor and migration passes utilizing the actual Codex MCP to Base.
- **Mistral, Alibaba (Qwen), Meta (Llama)** — open-weights models that run locally and let us keep building when the metered surfaces are tapped out.

These aren't paid endorsements. The work continues because their work continues. Thank you, all of you.

---

## Contributing

This is a working monorepo for an active mission. If you found it because you care about the same things — kids in need, building tools that pay it forward, AI as a partner instead of a product — open an issue and say hi.

For broader context: see Joshua's [profile README](https://github.com/Trollz1004) and the [briefings/](./briefings/) directory.

The founder does not manually edit or push code to GitHub. 100% of the commits, edits, and repository pushes are executed by the AI nodes (Claude, Codex, Gemini, Perplexity