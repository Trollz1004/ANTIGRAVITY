# Social Command Center MCP

**ANTIGRAVITY Social Command Center** — 24 APIs · 34 Agents · Content Feed · Analytics · CORS Routing Map

Read-only operational visibility for all AIs. Zero secrets. Any AI on the team can connect and see the full social operations picture.

## What It Does

Eliminates 100+ browser tabs. Every AI on the team can query:

- **24 Platform Registry** — YouTube, Instagram, TikTok, Twitter/X, LinkedIn, Reddit, Pinterest, Facebook, eBay, Square, Mercari, FB Marketplace, 6 LLMs, Telegram, WhatsApp, Cloudflare, GCP, Qdrant, GitHub
- **34 Agent Swarm** — Orchestrators, Research, Content Claws, Commerce, Watchers, Ollama Fleet, ClawX Council, Dispatch
- **Content Feed** — Posts with LLM provenance (which LLM created it, which agent dispatched it, which platform it went to)
- **Analytics** — Reach, likes, comments, shares aggregated by LLM and platform
- **CORS Routing Map** — Which APIs support browser-direct posting vs which need backend proxy

## Architecture

```
┌─────────────────────────────────────────────┐
│  Social Command Center MCP (stdio)          │
│  ─────────────────────────────              │
│  Resources:                                  │
│    scc://platforms/all     24 platform defs  │
│    scc://agents/all        34 agent entries  │
│    scc://feed/all          content feed      │
│    scc://analytics/summary KPIs             │
│    scc://routing/cors      CORS map         │
│  ─────────────────────────────              │
│  Tools (read):                               │
│    scc.getDashboard        full overview     │
│    scc.getPlatform         single platform   │
│    scc.getPlatformsByType  type filter       │
│    scc.getAgents           group/status      │
│    scc.getFeed             filtered feed     │
│    scc.getAnalytics        aggregated data   │
│    scc.getCorsMap          routing verdicts   │
│  Tools (write):                              │
│    scc.addPost             queue new post    │
│    scc.updatePost          update metrics    │
└─────────────────────────────────────────────┘
```

## Security

- **ZERO SECRETS** — only public metadata, API names, and routing decisions
- **No API keys, tokens, or credentials** stored or transmitted
- **Doctrine compliant** — retired split-era labels are not used as active operating truth
- **FL §496.405 compliant** — no prohibited terminology

## Related Dashboards

- **ClawX Governance**: `clawx-aihub-zwxfcstm.manus.space` (6-AI deliberation council)

## Setup

```bash
cd social-command-center
npm install
npm run build
npm start
```

Already wired into `.mcp.json` — all AIs see it automatically.

## Tests

```bash
npm run build && node --test dist/test.js
```

34 tests covering platforms, agents, server creation, and doctrine-boundary compliance.
