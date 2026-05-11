---
name: Graph Knowledge
description: Maintain and query the income-engine knowledge graph. Auto-updates graph.json and GRAPHY.md when files, services, or architecture changes. Use when asked about project structure, service status, provider routing, or node fleet.
version: 1.0.0
---

# Graph Knowledge Skill

## Purpose
Keep the income-engine knowledge graph in sync with reality. Every time the codebase, services, or infrastructure changes, update `graphy/` to match.

## When to Activate
- User asks about project structure, service ports, or node fleet
- Files are created/deleted/renamed in the repo
- Services are started, stopped, or reconfigured
- Provider model routing changes
- Agent definitions change

## Actions

### Read the Graph
Read `graphy/graph.json` and `graphy/GRAPHY.md` to understand current state.

### Update the Graph
When any of these change, update both files:
1. `graphy/graph.json` — machine-readable state
2. `graphy/GRAPHY.md` — human-readable state with ASCII diagram

### Validate the Graph
Before committing, verify:
- All service ports match reality
- Provider model routing matches .env
- Agent definitions match Paperclip config
- THE WALL violations are flagged (never include Antigravity references)
- Node fleet info matches current machine

## THE WALL (absolute, never changes)
- Antigravity (Trollz1004) and income-engine (AidoesitAll) NEVER cross
- Separate accounts, separate stack, separate .env, separate Paperclip instance
- No changes to Antigravity platform

## Key Files
- `graphy/graph.json` — structured data (services, providers, agents, wall rules)
- `graphy/GRAPHY.md` — human-readable diagram + docs

## Service Map (Port 3101 for Paperclip)
Paperclip runs on port **3101** on 9020 (NOT 3100 — that's Sabretooth's instance).