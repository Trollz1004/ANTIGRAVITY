---
description: Show token routing guide — what goes to Ollama vs Claude, and current strategy
---

# Token Guard — ANTIGRAVITY

## The Problem
Claude Opus is metered. Ollama (glm-5.1:cloud, qwen3-coder) is not.
Every task that hits Claude when Ollama could handle it burns your budget.

## Routing Decision Tree

```
Is the output format already defined?
  YES → Ollama (paperclip-worker or ollama-opencode)
  NO  → Is it a judgment call with no clear right answer?
    YES → Claude
    NO  → Ollama
```

## Send to Ollama — FREE

Use `@paperclip-worker` or `@ollama-opencode`:
- Writing agent files (AGENTS.md, SOUL.md, TOOLS.md, HEARTBEAT.md)
- Generating scripts, SQL, configs, boilerplate
- Reading and summarizing files
- Rebuilding structures from a known spec
- Bulk content generation (social posts, copy variations)
- Searching the codebase for patterns

Use `@ollama-hermes`:
- Research and synthesis across multiple sources
- Summarizing logs or run history
- Explaining what a system does

## Keep for Claude — METERED

- Root-cause diagnosis on a broken system (unknown state)
- Security review of auth flows or credentials
- Architectural decisions with lasting consequences
- Anything Josh explicitly wants Claude's judgment on
- Cross-cutting decisions that affect multiple systems

## Available Ollama Agents

| Agent | Best For |
|-------|----------|
| `paperclip-worker` | Paperclip agent file builder — all 4 file types |
| `ollama-opencode` | Code generation, file writing, structured content |
| `ollama-hermes` | Research, synthesis, summarization |
| `ollama-claude` | Claude-shaped reasoning, no API spend |
| `router` | Not sure? Ask the router first |

## How to Use

Instead of: "Write the CFO agent files"
Do this: "@paperclip-worker Write all files for the CFO agent"

Instead of: "Search for all places we use Square API"
Do this: "@ollama-opencode Search C:\Antigravity for Square API usage"

Claude stays in the loop for: strategy, security, broken systems, Josh decisions.
Ollama handles: everything with a defined output.
