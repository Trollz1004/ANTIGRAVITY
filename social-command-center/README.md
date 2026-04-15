# Social Command Center MCP

**ANTIGRAVITY Social Command Center** — 25 APIs · 35 Agents · Content Feed · Approval Queue · Analytics · CORS Routing Map

Operational visibility for all AIs. Zero secrets. Any AI on the team can connect and see the social operations picture without direct access to tokens or live posting controls.

## What It Does

Eliminates tab sprawl. Every AI on the team can query:

- **25 Platform Registry** — YouTube, Instagram, TikTok, Twitter/X, LinkedIn, Reddit, Pinterest, Facebook, eBay, Square, Mercari, FB Marketplace, 6 LLMs, Discord, Telegram, WhatsApp, Cloudflare, GCP, Qdrant, GitHub
- **35 Agent Swarm** — Orchestrators, Research, Content Claws, Commerce, Watchers, Ollama Fleet, ClawX Council, Dispatch, plus the Hermes / Joshua Claw approval bridge
- **Content Feed** — Posts with approval state, LLM provenance, dispatch agent, and target platform
- **Approval Queue** — Drafts waiting on Discord, Telegram, WhatsApp, or OpenClaw review lanes before release
- **Analytics** — Reach, likes, comments, shares, and approval-state counts aggregated by LLM and platform
- **CORS Routing Map** — Which APIs support browser-direct access vs which need backend proxy

## Architecture

```
┌──────────────────────────────────────────────┐
│  Social Command Center MCP (stdio)           │
│  ─────────────────────────────               │
│  Resources:                                   │
│    scc://platforms/all     25 platform defs   │
│    scc://agents/all        35 agent entries   │
│    scc://feed/all          content feed       │
│    scc://analytics/summary KPIs + approvals   │
│    scc://routing/cors      CORS map           │
│  ─────────────────────────────               │
│  Tools (read):                                │
│    scc.getDashboard        full overview      │
│    scc.getPlatform         single platform    │
│    scc.getPlatformsByType  type filter        │
│    scc.getAgents           group/status       │
│    scc.getFeed             filtered feed      │
│    scc.getApprovalQueue    review queue       │
│    scc.getAnalytics        aggregated data    │
│    scc.getCorsMap          routing verdicts   │
│  Tools (write):                               │
│    scc.addPost             queue draft        │
│    scc.reviewPost          approve/reject     │
│    scc.updatePost          update metrics     │
└──────────────────────────────────────────────┘
```

## Approval Model

- Paperclip marketing agents create draft suggestions.
- Social Command Center stores those suggestions as feed entries with approval metadata.
- Hermes / Joshua Claw reads the queue on heartbeat and delivers compact approval packets.
- Discord is the primary approval inbox.
- Telegram and WhatsApp are fallback approval lanes.
- OpenClaw can remain an optional review surface, not the main messenger.
- Nothing is treated as live posting authority until a human approval decision is recorded.

## Security

- **ZERO SECRETS** — only public metadata, API names, routing decisions, and queue state
- **No API keys, tokens, or credentials** stored or transmitted
- **Doctrine compliant** — retired split-era labels are not used as current operating truth
- **FL §496.405 compliant** — prohibited terminology is excluded

## Related Dashboards

- **ClawX Governance**: `clawx-aihub-zwxfcstm.manus.space`

## Setup

```bash
cd social-command-center
npm install
npm run build
npm start
```

Already wired into `.mcp.json`.

## Tests

```bash
npm run build && node --test dist/test.js
```

Tests cover platforms, agents, access policy, approval-queue behavior, and server creation.
