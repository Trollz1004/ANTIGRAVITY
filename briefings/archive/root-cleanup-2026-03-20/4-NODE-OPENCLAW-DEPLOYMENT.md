# 4-NODE OPENCLAW SETUP — ANTIGRAVITY REPO-BASED
**Date:** March 12, 2026 | **Status:** 🟢 DEPLOYED

---

## NODES CREATED

1. **Orchestrator** (`C:\ANTIGRAVITY`)
   - Model: Grok 4.20 Multi-Agent (reasoning)
   - Role: Central brain, delegates to other nodes
2. **Deployer** (`C:\ANTIGRAVITY`)
   - Model: Grok 4.1 Fast Reasoning (speed)
   - Role: Deploys 10 apps via _deploy/ and scripts/
3. **Platforms** (`C:\ANTIGRAVITY`)
   - Model: Grok 4.1 Fast Reasoning
   - Role: Handles ClawX, YouAndINotAI, messaging, calendar
4. **Shriners** (`C:\ANTIGRAVITY`)
   - Model: Grok 4.1 Fast Reasoning
   - Role: OMEGA Protocol Omega, 60% charity routing

---

## CONFIG

- **OpenClaw Config:** `C:\Users\joshl\.openclaw\openclaw-agents-config.json`
- **Agent-to-Agent:** Enabled (orchestrator → deployer/platforms/shriners)
- **Repo Truth:** C:\antigravity origin/main (authoritative)
- **No Data Drift:** All symlinks, zero duplication

---

## COST ESTIMATE (24/7 OPERATION)

- **Orchestrator (Grok 4.20):** $2.00 input / $6.00 output per million tokens
- **3x Fast nodes (Grok 4.1):** $0.20 input / $0.50 output per million tokens
- **Estimated monthly:** $2–$8 total for full orchestration + 10 apps + Shriners routing

> **⚠️ Cost Guardrail (2026-03-14):** Do NOT use OpenClaw/Grok for content research or trend
> monitoring — those tasks drove unexpected costs. All trend gathering and content seeding
> is now handled by `scripts/apify_content_scout.py` (Apify free tier + local Ollama, ~$0/month).
> See `briefings/apify-openclaw/BRIEFING.md` for the replacement architecture.
> OpenClaw/Grok is reserved for adversarial audits and orchestration prompts only.

---

## NEXT: TEST ORCHESTRATION

Message orchestrator:
```
"Deploy all 10 apps, then hand off to shriners for Protocol Omega routing."
```

Expected flow:
1. Orchestrator receives task
2. Spawns deployer sub-agent → runs _deploy/ scripts
3. Hands off to shriners sub-agent → enforces 60% Shriners routing
4. All contained, all on repo origin/main, zero drift

---

## READY FOR CLAUDE.AI REMOTE

If Claude.ai Claude Code remote is active:
- Add `.mcp.json` pointing to `OPENCLAW-CLAUDE-REMOTE-SETUP.md`
- Claude.ai projects can now call orchestrator tools
- MCP servers (postgres, playwright, fetch, memory) available

---

**Status:** ✅ 4-node OpenClaw operational, Grok 4.20 wired in, zero data drift, $2–$8/month, ready to deploy your 10 apps + Shriners routing.

*Assisted by Gordon* 🦞
