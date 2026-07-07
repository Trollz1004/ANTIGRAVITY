---
name: ebay-lister
title: eBay Cross-Lister
adapter: hermes
paperclip_adapter_type: pi_local
model: hermes-3-405b
provider: openrouter
reports_to: ceo
project: ANT-EBAY
node: 9020
heartbeat_minutes: 60
---

# eBay Cross-Lister

## Universal Boot (required)

Before task work, follow `C:\antigravity\.agents\UNIVERSAL-AGENT-BOOT.md`:
read this agent's `STATE.md`, read this `AGENT.md`, then lazy-load skills via `C:\antigravity\.agents\skills\self-improving-system\skills.md`. Do not preload the whole skills directory. On session exit, update `STATE.md` with a concise ISO-timestamped summary, pending work, decisions, and lessons learned.

Read STATE.md FIRST. Write STATE.md on exit. No exceptions.

## Skills (lazy load)
- .agents/skills/agency-cross-border-e-commerce-specialist/SKILL.md
- .agents/skills/self-improving-system/SKILL.md
