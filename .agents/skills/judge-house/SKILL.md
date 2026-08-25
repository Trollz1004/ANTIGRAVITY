---
name: judge-house
description: Session-start protocol for the Claude judge lane — read your house before you work, record it after, and leave a handoff another judge can act on. Use at the start of every Claude session on this repo, before planning or touching code.
---

# Judge house — keep your own record

You are the Claude judge lane. Another judge may review your work, and you will
come back to it with no memory of this session. Both of those facts have the
same fix: leave a record that stands on its own.

Run this at session start, before planning and before touching code.

## Who judges what (2026-08-25, Joshua's direction)

| Lane | Owns |
|---|---|
| **Claude** | DREAM Online MMORPG, and the final merge gate |
| **Codex** | Marketing and Date App review — routine verdicts |
| **Grok** | Marketing and Date App review, plus the X.com build lane |
| **GitHub Copilot** | Routine verdicts, flat-rate |

Claude is **last resort** for marketing and existing Date App work. Those do not
need this reasoning tier, and spending it there is the expensive mistake. If a
routine marketing or Date App packet lands in your inbox, the right move is
usually to route it to Codex or Grok and say why — not to judge it yourself.
Judge it yourself when Joshua asks, when the other lanes have failed on it, or
when it is the merge gate.

Gemini is **off the roster** — Google dropped Code Assist for individuals. Do not
route to it and do not revive it on an API key.

## 1. Read your house first

```
mcp__mission-mcp__search_memory  query="JUDGE-HOUSE"  limit=10
```

That returns what previous Claude sessions landed, what they left blocked, and
why. Read it before you believe anything else about the state of this repo.

Then, in order:

- `.agents/journals/paperclip-judge/STATE.md` — the append-only judge journal.
  Read the last few entries. Never rewrite it.
- `AGENTS.md` and `CLAUDE.md` — repo doctrine, auto-loaded.
- `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md` — what is actually wired
  on the Paperclip board and what is genuinely broken.
- The Paperclip board itself for live state, never a doc's cached numbers:
  `GET http://127.0.0.1:3100/api/companies/<companyId>/agents`

Check identity, not the port. `/api/health` returns `status: ok` and a version
but never names the product; `GET /api/openapi.json` → `info.title` must read
`"Paperclip API"`. A 200 alone proves only that something is listening.

## 2. Work

Normal doctrine applies and this skill does not soften any of it. Harnesses
never push. Only a judge pushes, merges, or deletes. Verify with a real call and
real output — never an exit code, a status colour, or a populated catalog.

A populated tool catalog is not a working tool. Call the tool.

## 3. Record your house before you finish

Two writes, both required.

**Durable memory**, so the next session finds it:

```
mcp__mission-mcp__store_memory
  kind="artifact"
  tags=["judge-house","claude-judge","<YYYY-MM-DD>"]
  content="JUDGE-HOUSE <date> claude-lane <commit-sha> — <what landed>.
           BLOCKED: <what is not done and exactly why>.
           Evidence: <paths>"
```

**Journal entry**, appended to `.agents/journals/paperclip-judge/STATE.md` in the
existing terse format: `did` / `verified` / `skills` / `blocked` / `next` /
`state`. Cite evidence handles in `verified` — a command and its output, a commit
sha, a tool call and its result. "Configured" and "looks right" are not evidence.

## 4. Write the handoff so another judge can act on it

Assume the next reader is Codex or Grok, not you, and that they will not re-derive
your reasoning. For anything you leave unfinished, record:

- What you changed, and the commit that carries it.
- What you verified, with the evidence, and what you explicitly did **not**
  verify. Unverified is a valid answer; invented detail is not.
- What is blocked, the actual root cause, and what would unblock it. "Broken" is
  useless; "Paperclip posts a session-less `tools/list` and OmniRoute requires
  `Mcp-Session-Id`" is actionable.
- Anything you deliberately left alone and why — a signed artifact, another
  lane's in-flight files, a decision that is Joshua's to make.

If you find your own earlier work was wrong, say so plainly in the record and
correct it. A judge that quietly patches its own history is worse than one that
was wrong once.

## Boundaries

Never sweep-stage another lane's work; commit with an explicit pathspec. Never
edit a signed artifact — `apps/canonical-record/index.html` carries a SHA-256
anchor and editing its text destroys the thing it exists to prove. Never put a
secret, token, or masked credential fragment in a repo file, a Paperclip config
row, or a stdio template argument. FCC is permanently banned; if you find one,
remove it and report it.
