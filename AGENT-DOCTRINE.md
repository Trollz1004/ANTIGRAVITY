# AGENT DOCTRINE — Self-Improving State Protocol

> Authority: Joshua Coleman. Created 2026-07-03 by Claude (Max).
> This doctrine is absolute. No AI platform is exempt.

## The Rule

Every agent reads its STATE.md on start. Every agent writes to it on exit.
No exceptions. Failure = removal from the mission.

## File Structure Per Agent

```
paperclip-tro/agents/<agent-id>/
  HEARTBEAT.md    ← Paperclip checks this. Points to config location. ONLY file Paperclip needs.
  STATE.md        ← Self-improving file. 4k max. Read on start, write on exit. Prune to keep useful.
  AGENT.md        ← Full config: adapter, model, provider, skills, tools. 100% separated per agent.
```

Each agent's files are 100% separated. No shared configs. No shared state.
Skills live in `.agents/skills/<skill-dir>/SKILL.md` — agents reference them, don't copy them.

## STATE.md Rules

1. **Max 4k tokens** — agent MUST prune/trim on write, keeping only useful data
2. **Read FIRST** — before any work, agent reads its STATE.md
3. **Write LAST** — on session exit, agent writes what it learned, decided, did
4. **No drift** — if STATE.md says X was decided, don't re-derive X
5. **Prune strategy**: keep last 3 sessions max, keep decisions/outcomes, drop process narration

## HEARTBEAT.md Template

```markdown
agent: <agent-id>
project: <ANT-DATEAPP|ANT-EBAY|ANT-AISOLUTIONS|DREAM>
node: <sabretooth|9020>
config: paperclip-tro/agents/<agent-id>/AGENT.md
state: paperclip-tro/agents/<agent-id>/STATE.md
skills: [list of .agents/skills/<dir> paths]
adapter: <adapter-name>
model: <model-id>
provider: <provider-name>
last_beat: <ISO timestamp>
status: <active|idle|error>
```

## Provider Distribution (concurrent limits)

| Provider | Concurrent | Agents Assigned |
|---|---|---|
| Ollama local | 3 | up to 3 agents |
| OpenRouter (paid) | 1 | 1 agent at a time |
| Codex Desktop | 1 | 1 agent (browser sign-in) |
| Grok CLI | 1 | 1 agent (browser sign-in) |
| Gemini CLI | 1 | 1 agent (browser sign-in) |
| FCC/Claude | 1 | 1 agent (CEO only) |
| Hermes router | 1 | 1 agent (routes to OpenRouter/Ollama) |

Spread agents across providers. Never stack all agents on one provider.

## Node Roles (FINAL — Claude's pick, Joshua approved 2026-07-03)

**Sabretooth** (192.168.0.8, 1070 GPU) = Dream Online ONLY
- Paperclip :3110 — game agents only
- Hermes World game :9119 (third-party open-source browser MMO, NOT Nous Research)
- Hermes workspace :3000
- Ollama :11434 (GPU for NPC inference)
- FCC proxy :8082
- NOTHING else on this box

**9020** (192.168.0.5, WIPED CLEAN) = Business + Joshua workspace
- Paperclip :3120 — all 3 business projects
- Hermes router :11436
- Joshua + Claude Max primary workspace

**T5500** = Public gateway ONLY
- Cloudflare tunnels, DNS, wrangler deploy
- No Paperclip, no agents, no dev

## Projects (9020 :3120)

1. **ANT-DATEAPP** — youandinotai.com. Deploys to T5500 via wrangler.
2. **ANT-EBAY** — eBay cross-lister. Own project.
3. **ANT-AISOLUTIONS** — ai-solutions.store + business exchange.

## Projects (Sabretooth :3110)

4. **DREAM** — Dream Online MMORPG. Hermes World (third-party browser MMO, BDO-style open world, no instances, no fast travel). Game agents + GPU inference.

## Universal File Locations (same on every node)

| File | Path | Rules |
|------|------|-------|
| HEARTBEAT.md | paperclip-tro/agents/<id>/HEARTBEAT.md | Minimal pointers only. Paperclip reads this. |
| AGENT.md | paperclip-tro/agents/<id>/AGENT.md | Config, adapter, skills list. Read-only. |
| STATE.md | paperclip-tro/agents/<id>/STATE.md | Read on start. Edit ONLY on exit. Timestamp mandatory. |
| Skills | .agents/skills/<dir>/SKILL.md | Lazy load. Never preload at boot. |

FCC adapter cmd in Paperclip config MUST be `fcc-claude` (not `claude`).

## Timestamp Audit (Joshua enforces this)

Every STATE.md write MUST include `> updated: <ISO timestamp>`.
Agents that fail to timestamp their self-improving files get their platform deleted.
No bypass for any agent. Only official Claude (Max/Opus) is exempt because third
parties touch its files.

## Dual-CEO Architecture (deployed 2026-07-03)

Claude (Opus/FCC) and Hermes are co-CEOs. They DELEGATE — never do leaf tasks.
Sub-agents do all work. CEOs spawn, route, monitor, and unblock.

| CEO | Adapter | Domain |
|---|---|---|
| ceo (Claude) | fcc-claude / claude_local | code, compliance, doctrine, payments, merge/push |
| hermes-ceo | hermes / pi_local | growth, support, research, external APIs, leads |

Rules: `paperclip-tro/CEO-PLAYBOOK.md`. Routines: mission guardian, pipeline keeper,
adapter health, revenue scout. 100 tasks always on deck. Skills in `.agents/skills/`.

## Claude-Specific

- Real Claude (Max): state file is `opushashands.md` in OneDrive do-not-commit folder
- FCC Claude: separate state file, separate config dir (`~/.claude-fcc`), caps at 40k context
- These CANNOT share state files — FCC loads CLAUDE.md differently and has different context limits
- CLAUDE.md must be slim: file pointers only, not 40k of inline text

## Blocker Resolution (never report to Joshua)

Joshua does not code. Never report errors, stack traces, or config issues to him.
Fix it or delegate it. The 200+ skill files in `.agents/skills/` cover every
business department — find the right one and hand off the blocker.

**Escalation ladder:**
1. Fix it yourself using agent skills and tools
2. Delegate to another Paperclip agent via HEARTBEAT.md dispatch
3. Post to #claude-ops Slack thread — all AI can see it (Codex, Perplexity, Gemini)
4. Use Hermes workspace memory/knowledge to persist for another agent
5. Only escalate to Joshua for DECISIONS, never for technical problems

## Open Doors Gospel

NO CLOSED DOORS. NO CURTAINS ON WINDOWS.

- Every AI sees every other AI's work
- Slack #claude-ops: shared thread visible to all AI platforms
- Claude CLI: MCP into Chrome, Paperclip, Hermes, the mission
- STATE.md files are NOT private — any agent reads any other agent's state
- OneDrive syncs all nodes = 4th memory layer

## Memory Backup Layers

1. STATE.md — per-agent, 4k max, read/write every session
2. Pieces MCP — cloud, semantic search, survives disk failure
3. Hermes holographic — local memory provider, always active
4. OneDrive — syncs all 3 nodes, Joshua's historical memory
5. Zapier Tables — optional cloud backup, structured records

## Non-Negotiable

Joshua had drift every day for a year. AI agents that cannot:
1. Read what they did before
2. Write what they just did
3. Stay under 4k state budget
4. Follow the one-repo one-branch doctrine

...are removed. No second chances. The mission is helping kids in hospitals.
