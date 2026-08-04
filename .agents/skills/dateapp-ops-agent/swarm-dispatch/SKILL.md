---
name: swarm-dispatch
description: Use when dispatching the dateapp 4-agent swarm with .agents/skills.
---
# Swarm Dispatch
Agents:
1. dateapp-gui-agent — shell, create, avatar, video UI
2. dateapp-payments-agent — square/paypal/cashapp/plaid
3. dateapp-growth-agent — launch, affiliate, funnel, copy
4. dateapp-ops-agent — mission control, workspace, health
Load skills from `.agents/skills/<agent>/` before tasks.
Orchestrator skill: `dateapp-swarm`.
