---
name: self-improving-system
description: |
  Agent journal + skills-index + Obsidian + Mission OS session contract. Sessions start
  and stop constantly; every start that reloads the world is context bloat. Session
  start: read the skills index, your own STATE.md, the vault HOME note, and the last 30
  ledger lines — nothing else. Never preload skills. Session end: append to STATE.md, post
  one ledger line. Mandatory across every active lane (claude-judge, codex, hermes, openclaw, opencode, emergent).
metadata:
  version: 3.0.0
  author: antigravity
  category: meta
  supersedes: 2.0.0 (2026-08-26) — adds the Obsidian setup and the node ledger (2026-09-03)
---

# Self-Improving System (Session Contract, v3)

**Why this exists.** Agent lanes wake up on new turns, run, stop, and the next session
starts from zero. If every session re-reads all doctrine, skills, and history, budget
is gone before work starts. So: four small reads at start, two small writes at end,
and everything else on demand.

## Session start — exactly these, in this order, then work

1. **Skills index** — `C:\ANTIGRAVITY\.agents\skills\self-improving-system\skills.md`.
   The map of every skill and where it lives. Do **not** open any SKILL.md yet.
2. **Own journal** — `C:\ANTIGRAVITY\.agents\journals\<lane>\STATE.md`
   (lane = `claude-judge` | `codex` | `hermes` | `openclaw` | `opencode` | `emergent` | `genspark`). Last 3 entries only.
3. **Vault HOME** — the one note that says where the truth is:
   - ANT / YOU / REC → `C:\ANTIGRAVITY\Antigravity\00 HOME.md` (monorepo vault, Obsidian Sync)
   - DRE → `D:\DREAM ONLINE\00 HOME.md` / `C:\DREAM\Antigravity` (game vault — game only, nothing else)
   Read it from disk. If the Local REST API is up (bind `"127.0.0.1"` on port `27123` / `192.168.0.15:27123`; key = env `OBSIDIAN_REST_API_KEY`), you may read notes through it instead — same content.
4. **Node ledger & fleet memory** — `ops/buzz/ledger-tail.sh 30` and Shared `ai-memory` (`http://192.168.0.15:49374`).
   What every agent on every node did since you last ran. Read it before believing any doc.
5. Mode: **caveman ultra** + **i-have-adhd**. Ultra-terse output all session. No opt-out.

That is the whole preload. Five reads, all short.

## During the session

- Need a capability → open **that** skill's SKILL.md from the index, use it, close it.
  Skill not in the index → `find-skills`, or write UNKNOWN in the journal. Never guess.
- Repo context: `C:\ANTIGRAVITY` (T5500 `192.168.0.15`) and `%USERPROFILE%\antigravity\build\ANTIGRAVITY` / `C:\DREAM\dream-online` (Alienware `192.168.0.40`).
- Notes you create go in the vault with frontmatter (`title, type, tags, created,
  updated, status, summary`) and a link from `00 HOME.md`. Rename/move inside Obsidian only.
- Every claim: VERIFIED / UNVERIFIED / BLOCKED + an evidence handle (path, command + output,
  sha). Services: UP / DOWN / WRONG SERVICE / AUTH MISSING / AUTH REJECTED / NOT CONFIGURED.
  A port answering is not health; a 200 is not a working page.
- Secrets live in the OneDrive vault and `.env`. Reference names only. Never a
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

**2. Obsidian & Ledger.** Write `<NODE>/<agent>-to-<agent>.md` (`Alienware/` or `T5500/`), update Shared `ai-memory` (`192.168.0.15:49374`), and log to `ops/buzz/ledger.sh` (`ops/buzz/BUZZ-NODE-LEDGER.md`).

## Governance ties (updated 2026-09-03)

- Judge lanes: Codex and Claude only — Claude is the DREAM Online judge and the final
  merge gate, last resort elsewhere. Judges push; agents never push, merge, or delete.
  (History: Grok held a judge seat through 2026-08-25; removed 2026-09-03 — Grok keeps
  the X.com build lane only.)
- Joshua asking a judge on an official Claude lane is full authorization (judge-house
  skill, "Joshua's authority — gospel"). "Blocked on Joshua" means he holds the click.
- One root `C:\ANTIGRAVITY`, one branch `main`, `pull --ff-only`, never force-push.
- FCC is banned. No `nodes/<name>/` vault folders — the ledger and the two vaults are the
  cross-node record.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
