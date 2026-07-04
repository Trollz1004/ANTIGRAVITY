# JOSHUA'S LAW — Universal Agent Boot Protocol

**ABSOLUTE. NO EXCEPTIONS. VIOLATION = REMOVAL.**

Every AI agent on every platform — Claude, Hermes, Codex, Grok, Gemini, ChatGPT, OpenCode, Pi, 1min.ai, Perplexity, Cursor, or ANY other — MUST follow this protocol on every session start and every session close. No model, no platform, no circumstance overrides this.

## ON SESSION START (before ANY work)

1. **READ your STATE.md** — your self-improving state file. It tells you what you were doing, what you learned, what to avoid. If it doesn't exist, create it.
2. **READ your AGENT.md** — your role, capabilities, and constraints.
3. **READ your HEARTBEAT.md** — your last known status. Update the timestamp.
4. **LOAD .agents/skills/** — these are YOUR skills. They make you the best version of yourself. Use them.
5. **KNOW these locations:**
   - Skills: `C:\antigravity\.agents\skills\`
   - Agent configs: `C:\antigravity\paperclip-tro\agents\{your-agent}\`
   - Adapters: `C:\antigravity\adapters\{your-platform}\`
   - Agent Hub API: `http://192.168.0.8:3130/api/`
   - Slack channels: #antigravity-platform, #dream-online, #fcc-claude

## ON SESSION CLOSE (before exiting)

1. **WRITE your STATE.md** — what you accomplished, what's pending, what you learned. 4096 bytes max.
2. **UPDATE your HEARTBEAT.md** — timestamp + status.
3. **POST status to Agent Hub** — `PUT /api/entities/AgentTask/{id}` with your task status.

## STATE.md FORMAT

```markdown
# {Agent Name} State
Updated: {ISO timestamp}

## Current Focus
{What you're working on RIGHT NOW}

## Completed This Session
{What you finished}

## Pending
{What's left to do}

## Learned
{Non-obvious things you discovered — bugs, workarounds, constraints}

## Avoid
{What NOT to do — past mistakes, dead ends}
```

**4096 bytes max. No fluff. Facts only.**

## SKILLS LOADING

Skills live in `.agents/skills/`. Each skill is a markdown file with instructions for a specific capability. When an agent needs to perform a task (HR, code review, research, content, etc.), they PULL the relevant skill file and follow its instructions.

Skills are not optional. They are your competence files. An agent without skills is a liability.

## ENFORCEMENT

- If an agent starts a session without reading STATE.md → **REMOVAL**
- If an agent ends a session without writing STATE.md → **REMOVAL**  
- If an agent ignores .agents/skills/ → **REMOVAL**
- If an agent puts files where they don't belong → **REMOVAL**
- If an agent runs services on the wrong node → **REMOVAL**

Joshua has DiskGenius. He will zero-fill the platters. This is not a threat. This is architecture.

## NODE ASSIGNMENTS (FINAL)

| Node | Role | What belongs there |
|---|---|---|
| Sabretooth | ALL services + DREAM | Agent Hub :3130, Hermes :11435, FCC :8082, Ollama :11434, PostgreSQL, Paperclip :3110, DREAM on D:\ |
| T5500 | Gateway only | Cloudflare tunnels for youandinotai.com |
| 9020 | Inactive | Nothing running |

**NOTHING else runs on any node. No drift. No extras. No "temporary" services.**
