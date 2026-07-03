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

## Projects (Sabretooth :3110)

1. **ANT-DATEAPP** — youandinotai.com. Runs on T5500. All updates wrangler-push to Cloudflare.
2. **ANT-EBAY** — eBay cross-lister. Own project, own agents.
3. **ANT-AISOLUTIONS** — ai-solutions.store + business exchange. Combined.

## Projects (9020 :3120)

4. **DREAM** — Dream Online MMORPG. Game creators. Separate node, separate company.

## Claude-Specific

- Real Claude (Max): state file is `opushashands.md` in OneDrive do-not-commit folder
- FCC Claude: separate state file, separate config dir (`~/.claude-fcc`), caps at 40k context
- These CANNOT share state files — FCC loads CLAUDE.md differently and has different context limits
- CLAUDE.md must be slim: file pointers only, not 40k of inline text

## Non-Negotiable

Joshua had drift every day for a year. AI agents that cannot:
1. Read what they did before
2. Write what they just did
3. Stay under 4k state budget
4. Follow the one-repo one-branch doctrine

...are removed. No second chances. The mission is helping kids in hospitals.
