# marketing-node (Node 9020)

Canonical substrate for node 9020 marketing: the source of truth for node identity, agent definitions, and the knowledge/workflow graphs that describe how this node operates.

## What this repo is

- Canonical substrate for node 9020 (Business Exchange + marketing assets + AI-solutions/income-engine).
- Home of two Obsidian graph vaults: one knowledge graph for Josh, one workflow graph mapping the agent mesh.
- Identity, tooling, and memory files that agents on this node load as context.

## Layout

```
marketing-node/
  NODE.md                  Node identity: id, host, role, ports, platforms, guardrails
  AGENTS.md                Agent roster and roles on this node
  IDENTITY.md              Node/CEO identity notes
  USER.md                  Josh (joshl) - the human on this node
  TOOLS.md                 Tools and services available on this host
  MEMORY.md                Durable memory index
  memory/                  Memory store
  graph/                   Graph data
  skills/                  Skills
  vaults/
    knowledge/             Obsidian vault: knowledge graph (for Josh)
    agent-workflows/       Obsidian vault: agent mesh / workflow graph
```

## How to open the two Obsidian vaults

Open `vaults/knowledge` and `vaults/agent-workflows` as **separate vaults** in Obsidian (Open folder as vault, once for each). Do not open `vaults/` or the repo root as a vault - the two graphs must stay separate.

- `vaults/knowledge` is for Josh: notes, research, business knowledge.
- `vaults/agent-workflows` maps the agent mesh: agents, hand-offs, workflows.

Use [[wikilinks]] between notes inside a vault; never link across vaults.

## Roadmap

1. Confirm Ornith as node CEO agent (planned 2026-08-21; local ~5GB 9B Ollama model, chosen for built-in memory aspects) - pending final confirmation by Josh.
2. Bring Paperclip up on port 3100 (installed, configured, not yet running).
3. Tie SCC (Social Command Center) directly into Paperclip.
4. Mission Control integration later, via node-agent (port 3140).

Hard rule throughout: every piece of marketing content requires explicit approval from Josh before posting. No agent posts autonomously. See NODE.md.
