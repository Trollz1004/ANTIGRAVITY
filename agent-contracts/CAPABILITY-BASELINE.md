# Capability Baseline — every agent, every harness

The shared floor of tools and skills every agent runs with, so a worker is as capable as possible before it touches a task. The orchestrator hands this file to each harness; each harness wires its own runtime config to match and **confirms tested access** before reporting ready. Judge-reviewed, landed by the judge lane; workers never edit it.

## MCP servers (same set the Claude Code judge lane runs)

Available to every agent. For FreeBuff and its subagents these live in `~/.agents/mcp.json` (global, approved once). Each separate harness runtime (Hermes, OpenClaw, OpenCode) wires the same servers into its own MCP config and proves it can call them.

| Server | Command | Purpose |
|--------|---------|---------|
| `brain-mcp` | `node C:\ANTIGRAVITY\brain-mcp\dist\index.js` (env `HOME=C:\Users\joshi`) | Repo truth, active context, operational telemetry |
| `mission-mcp` | `node C:\ANTIGRAVITY\services\mission-mcp\dist\server.js` (env `HOME=C:\Users\joshi`) | Tasks, agents, files, memory in Mission Control |
| `antigravity-files` | `npx -y @modelcontextprotocol/server-filesystem C:\ANTIGRAVITY` | Filesystem scoped to the one repo root — never outside it |
| `playwright` | `npx -y @playwright/mcp@latest` | Browser automation for verification and webapp testing |

`supabase` is available read-first for docs and inspection, but any live database write routes through the Supabase seat and the judge path — the read-first allowlist is still pending judge review. A worker never gets standing write access to production data.

## Standing skills (session-start, before any task — judges included)

`agent-reach` · the agent's journal (read `.agents/journals/<role>/STATE.md` at start, write at end) · `find-skills` · `skill-creator` · `i-have-adhd` (concise, action-first output) · superpowers `brainstorming` · `agent-browser` · `planning-with-files` · `para-memory-files` (PARA file-based memory — this is where learnings are captured).

Then, per task, load a minimum of five task-relevant skills on top (floor: `writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`). The full catalog and the 144+ `agency-*` skills are indexed in `.agents/skills/README.md` — read it with the standing skills so an agent knows what it can reach.

## Memory and self-improvement — the safe way

Capture learnings in your journal and `para-memory-files`. A change you want to a SKILL.md, a contract, or settings becomes a **packet in `ops/packets/` for a judge to land** — never a self-edit, never a hook, never an autonomous web-to-skill generator. That is why `self-learning` is not in the standing set: judged out as an injection surface.

## Confirmation each harness returns

1. MCP config edited (name the file: `.agents/harness-config/hermes.yaml`, OpenClaw's config, `.opencode/opencode.json`).
2. Proof each server answers — a real tool call per server with its result, not "configured."
3. Standing skills resolve in that runtime (list them found).
4. VERIFIED / UNVERIFIED / BLOCKED per line, evidence attached. Then stop — the judge lands it.
