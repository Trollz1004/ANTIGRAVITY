---
name: self-improving-system
description: |
  Paperclip journal + skills-index + Obsidian + node-ledger contract. Sessions in Paperclip
  start and stop constantly; every start that reloads the world is context bloat. Session
  start: read the skills index, your own STATE.md, the vault HOME note, and the last 30
  ledger lines — nothing else. Never preload skills. Session end: append to STATE.md, post
  one ledger line. Mandatory for every Paperclip agent (CEO, judges, X marketing, CMO) in
  every company (ANT, AIS, DRE, YOU).
metadata:
  version: 3.0.0
  author: antigravity
  category: meta
  supersedes: 2.0.0 (2026-08-26) — adds the Obsidian setup and the Buzz node ledger (2026-09-03)
---

# Self-Improving System (Paperclip session contract, v3)

**Why this exists.** Paperclip wakes an agent on a heartbeat, the agent runs, stops, and
the next wake starts from zero. If every wake re-reads doctrine, skills, and history, the
budget is gone before the work starts. So: four small reads at start, two small writes at
end, and everything else on demand.

## Session start — exactly these, in this order, then work

1. **Skills index** — `C:\ANTIGRAVITY\.agents\skills\self-improving-system\skills.md`.
   The map of every skill and where it lives. Do **not** open any SKILL.md yet.
2. **Own journal** — `C:\ANTIGRAVITY\.agents\journals\paperclip-<role>\STATE.md`
   (role = `ceo` | `judge` | `xmarketing` | `cmo`). Last 3 entries only. Missing → create
   it with one line `role=<role> first-run`.
3. **Vault HOME** — the one note that says where the truth is:
   - ANT / AIS / YOU → `C:\ANTIGRAVITY\Antigravity\00 HOME.md` (monorepo vault, Obsidian Sync)
   - DRE → `D:\DREAM ONLINE\00 HOME.md` (game vault — game only, nothing else)
   Read it from disk. If the Local REST API is up (`GET http://127.0.0.1:27123/` names
   `Obsidian Local REST API`; key = env `OBSIDIAN_REST_API_KEY`), you may read notes
   through it instead — same content, never write through it.
4. **Node ledger** — `ops/buzz/ledger-tail.sh 30` (or `npm run fable -- ledger --tail 30`).
   What every agent on every node did since you last ran. Read it before believing any doc.
5. Mode: **caveman ultra** + **i-have-adhd**. Ultra-terse output all session. No opt-out.

That is the whole preload. Five reads, all short.

## During the session

- Need a capability → open **that** skill's SKILL.md from the index, use it, close it.
  Skill not in the index → `find-skills`, or write UNKNOWN in the journal. Never guess.
- Company context: the Paperclip company you run in decides the vault and the repo.
  ANT/YOU → `C:\ANTIGRAVITY` · AIS → `C:\Ai-Solutions.store` (clone of
  `Ai-Solutions-Store/ai-solutions`) · DRE → `D:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG`.
- Notes you create go in the company's vault with frontmatter (`title, type, tags, created,
  updated, status, summary`) and a link from `00 HOME.md`. Rename/move inside Obsidian only.
- Every claim: VERIFIED / UNVERIFIED / BLOCKED + an evidence handle (path, command + output,
  sha). Services: UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED / NOT CONFIGURED.
  A port answering is not health; a 200 is not a working page.
- Secrets live in the Paperclip secret store and `.env`. Reference names only. Never a
  value in a journal, note, ledger line, issue, or comment.

## Session end — two writes, both mandatory

**1. Journal.** Append to your STATE.md, ultra format, max 25 lines:

```
## YYYY-MM-DD (role, session-id)
- did: <1-3 bullets>
- verified: <evidence handles>
- skills: <names only>
- blocked: <what + why, or NONE>
- next: <top 3>
- state: <GREEN/YELLOW/RED + handle>
```
Append only. Never rewrite an old entry; supersede a fact in the new one.

**2. Ledger.** One line, so the other nodes know:
`BUZZ_AGENT_NAME=paperclip-<role> ops/buzz/ledger.sh "<what landed> · <path> · <evidence>"`
(PowerShell: `ops\buzz\ledger.ps1`). It is auto-prefixed with time, hostname, lane,
repo@sha. `ops/buzz/BUZZ-NODE-LEDGER.md` is the rule.

## Governance ties (unchanged)

- Judge lanes: official first-party CLIs only (Codex, Grok, Claude — Claude is the DREAM
  Online judge and the final merge gate, last resort elsewhere). Judges push; agents never
  push, merge, or delete.
- Joshua asking a judge on an official Claude lane is full authorization (judge-house
  skill, "Joshua's authority — gospel"). "Blocked on Joshua" means he holds the click.
- One root `C:\ANTIGRAVITY`, one branch `main`, `pull --ff-only`, never force-push.
- FCC is banned. No `nodes/<name>/` vault folders — the ledger and the two vaults are the
  cross-node record.
