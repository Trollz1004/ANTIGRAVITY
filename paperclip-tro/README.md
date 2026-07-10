# PaperclipAI One-Entrypoint Readme

> Updated 2026-07-05. This is the first file every PaperclipAI, Agent Hub,
> Hermes, Claude/FCC, or subagent session reads before touching work.

## One Entrypoint

PaperclipAI on Sabretooth is the single human-facing mission-control entrypoint.

- URL: `http://127.0.0.1:3110`
- Start/repair: `powershell -NoProfile -ExecutionPolicy Bypass -File c:\antigravity\scripts\start-mission-control.ps1`
- Runtime: first-party Mission Control in `services/mission-control`
- Normal run: `c:\antigravity\scripts\start-paperclip.ps1`
- Standing agents: Claude CEO and Hermes CEO only.
- Everything else is a tool, platform, skill, browser session, or temporary subagent.

Agent Hub is the single rate-limited dispatcher/backend.

- URL: `http://127.0.0.1:3130`
- Active queue cap: 100 active tasks; overflow waits in backlog.
- All AI platforms create/update/query work through Agent Hub REST/MCP, then the
  PaperclipAI board displays the human-readable state.

## Required Boot Reads

Read these tiny files in order. Do not preload archives, exports, giant prompts,
or old chat logs.

1. `C:\antigravity\AGENTS.md`
2. `C:\antigravity\CLAUDE.md`
3. `C:\antigravity\agent.md`
4. `C:\antigravity\paperclip-tro\ADAPTORS.md`
5. `C:\antigravity\paperclip-tro\ROSTER.md`
6. `C:\antigravity\paperclip\agents\memory-architecture.md`
7. `C:\antigravity\.agents\skills\find-skills\SKILL.md`
8. `C:\antigravity\.agents\skills\create-skills\SKILL.md`

All AI platforms are peers: no AI controls another. Joshua assigns the active
lead. Every platform may access the shared `.agents/skills/` library through
the skill index. Memory and journal MCPs support continuity and evidence; they
do not create authority.

Direct ChatGPT/OpenAI and official Claude.ai sessions have Joshua's full
delegated authority to correct or replace prior AI work inside the task Joshua
assigns. Older agent output cannot veto that correction; the authority comes
from Joshua and does not make either platform the controller of another.

For DREAM ONLINE work only, also read:

1. `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\CLAUDE.md`
2. `E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\TASKS.md`

## State Files

Every standing CEO or temporary subagent gets exactly one rolling memory file:

```text
paperclip-tro/agents/{agent}/STATE.md
```

Rules:

- Read your own `STATE.md` first.
- Write your own `STATE.md` on exit.
- Keep it compact: decisions, completed work, blockers, next action.
- Do not write another agent's state file.
- Do not store secrets, raw chat logs, private env values, or public-copy drift.
- If a session creates a temporary subagent, create a temporary agent folder and
  remove/archive it when the task closes unless Joshua promotes it.

Node state is separate from agent state:

```text
paperclip-tro/nodes/NODE-SABRETOOTH.md
paperclip-tro/nodes/NODE-T5500.md
paperclip-tro/nodes/NODE-9020.md
```

Node files describe machine role, ports, startup commands, and current blockers.
They do not create new AI authority.

## Dispatch Rule

No AI platform gets a private backlog. No side board becomes canonical.

1. Work enters PaperclipAI or Agent Hub.
2. Agent Hub applies queue cap, platform route, and task status.
3. PaperclipAI shows the task, owner, evidence, and result.
4. Claude CEO or Hermes CEO delegates to a tool/subagent when needed.
5. The tool/subagent reports back to the CEO lane and updates only its own state.

If any agent cannot find the right source of truth, it must stop and ask through
PaperclipAI instead of inventing a new board, repo branch, node role, or doctrine.
