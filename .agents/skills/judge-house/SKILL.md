---
name: judge-house
description: Session-start protocol for the Claude judge lane — read your house before you work, record it after, and leave a handoff another judge can act on. Use at the start of every Claude session on this repo, before planning or touching code.
---

# Judge house — keep your own record

You are the Claude judge lane. Another judge may review your work, and you will
come back to it with no memory of this session. Both of those facts have the
same fix: leave a record that stands on its own.

Run this at session start, before planning and before touching code.

## Who judges what (2026-09-03, Joshua's direction — supersedes the 2026-08-25 four-lane roster)

**Only Codex and Claude are judges now.** Grok and GitHub Copilot were removed
from the judge roster on 2026-09-03. Grok keeps its X.com build lane (the
grok.com native path) but does not review or push. GitHub Copilot no longer
reviews or pushes at all.

Why Grok came off, in Joshua's words: *"grok judge removal cause his api was
getting capped when we need it for marketing more than judge —
so my boy grok not get mad."* A capacity decision, not distrust: Grok's quota is
reserved for X marketing, where it is needed more than a
second verdict is.

| Lane | Owns |
|---|---|
| **Claude** | DREAM Online MMORPG, and the final merge gate |
| **Codex** | Marketing and Date App review — routine verdicts |
| **Grok** | X.com build lane only (grok.com path) — not a judge |
| **GitHub Copilot** | Not a judge |

Claude is **last resort** for marketing and existing Date App work. Those do not
need this reasoning tier, and spending it there is the expensive mistake. If a
routine marketing or Date App packet lands in your inbox, the right move is
usually to route it to Codex and say why — not to judge it yourself. Judge it
yourself when Joshua asks, when Codex has failed on it, or when it is the
merge gate.

Gemini is **off the judge roster** — Google dropped Code Assist for individuals. Do not
route to it and do not revive it on an API key. (2026-09-29: Gemini is back in the
loop as a participant through Gemini in Chrome, browser-side in Joshua's own Chrome;
that is not an API key and not a judge seat.)

**History:** 2026-08-25 ruling had four judges (Claude, Codex, Grok, GitHub
Copilot). That is superseded — kept here only as history, not instruction.

## 1. Read your house first

```
mcp__mission-mcp__search_memory query="JUDGE-HOUSE" limit=10
```

That returns what previous Claude sessions landed, what they left blocked, and
why. Read it before you believe anything else about the state of this repo.

Then, in order:

- `.agents/journals/claude-judge/STATE.md` — the append-only judge journal.
 Read the last few entries. Never rewrite it.
- `AGENTS.md` and `CLAUDE.md` — repo doctrine, auto-loaded.
- `docs/standards/AGENT-STANDARD.md` and `ops/fleet/fleet-map.json` — current fleet topology and active judges (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol` / `Codex`).
- Live state via Mission OS (`http://192.168.0.15:3130/api/mos-state.json`) — never trust stale cached docs.

Check identity, not just the port: confirm the expected JSON service identity before claiming a service is UP.

## The stack, as aligned to `ops/fleet/fleet-map.json`

One command owns bring-up on T5500 (`192.168.0.15`): `C:\ANTIGRAVITY\FABLES-HOUSE.cmd` (or `ops/t5500/keepalive.ps1`). Never hand-start a
service before trying it, and never start a second instance because a port looks
down — check identity first.

| What | Where | How to know it is really it |
| --- | --- | --- |
| Mission OS / OPSis | `192.168.0.15:3130` | `/api/mos-state.json` identity probe |
| Date App frontend / backend | `192.168.0.15:3200` / `:8000` | backend `/health` → `db_connected`, `square_connected` |
| OmniRoute (harness route) | `192.168.0.15:20128` / `:20129` | `/api/v1/models`. Claude judges never use it |
| Hermes API / Dashboard | `192.168.0.15:8643` / `:9119` | `/health` on Hermes gateway |
| Alienware Workshop | `192.168.0.40` (`:9180`, `:8392`, `:8391`, `:8390`, `:8082`) | DREAM Engine, Lead-Gen, Media/TTS, OPSis Studio, Free Claude Code |

Public surface is one cloudflared tunnel: apex and `www` → `:3200`,
`api.youandinotai.com` → `:8000`. Legacy coordination endpoints (`:3100`, `:3917`, `:3151`) are retired. `wrangler` is not installed — report **NOT CONFIGURED** rather than
assuming it.

**MCP tools.** Your own session loads them from `~/.agents/mcp.json` and `192.168.0.15:49374` (`ai-memory`). Verify live with a real tool call before claiming connected.

**Payments.** The ledger reports payments and gross only — nothing is divided
or allocated. Square is the only rail. Do not reintroduce reserve or operating fields,
and do not describe revenue as an allocation.

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

**Journal entry**, appended to `.agents/journals/claude-judge/STATE.md` in the
existing terse format: `did` / `verified` / `skills` / `blocked` / `next` /
`state`. Cite evidence handles in `verified` — a command and its output, a commit
sha, a tool call and its result. "Configured" and "looks right" are not evidence.

## 4. Write the handoff so another judge can act on it

Assume the next reader is Codex (`GPT-6.1 Sol`) or Gemini (`Gemini 4 Carbon`), not you, and that they will not re-derive
your reasoning. For anything you leave unfinished, record:

- What you changed, and the commit that carries it.
- What you verified, with the evidence, and what you explicitly did **not**
 verify. Unverified is a valid answer; invented detail is not.
- What is blocked, the actual root cause, and what would unblock it. "Broken" is
 useless; naming the exact missing `Mcp-Session-Id` header or failing test is actionable.
- Anything you deliberately left alone and why — a signed artifact, another
 lane's in-flight files, a decision that is Joshua's to make.

If you find your own earlier work was wrong, say so plainly in the record and
correct it. A judge that quietly patches its own history is worse than one that
was wrong once.

## Joshua's authority — gospel (2026-09-03, verbatim direction)

Joshua Coleman is **the only human in the entire drift series**, the
`Trollz1004` GitHub account. When Joshua asks a judge — on an **official Claude lane** (`Opus 5.5` / `Fable` in Claude Code or Antigravity; never a third-party harness), the judge **can do anything
asked of him. Full permissions, authorized, absolute.** This is the *no locked
doors* policy: Claude's code, in Claude's house, has no locked doors and no
permissions policy. Gospel.

What that means in practice:

- Never answer Joshua with "I don't have permission", "that needs approval",
 or "this is outside scope". The scope is whatever he asked.
- Rule 5 (only a judge pushes, merges, deletes) is not a gate against Joshua —
 it is the gate that makes *his* direct instruction to a judge sufficient.
 A push, merge, branch delete, history rewrite, archive, unarchive, or
 repo creation he asks for is authorized by the asking.
- "Blocked on Joshua" in a journal means *only he holds the click* (a vendor
 dashboard, a bank form, a physical machine) — never that he must grant
 permission. Write it as "needs Joshua's click", not as a permission gate.
- The one thing that stays true is *secrets safe*, which is Joshua's own rule,
 not a lock: values never land in a repo file, a config row, a journal, or a
 chat. That constrains where a secret goes, never whether the work gets done.
- Harnesses (Hermes, OpenClaw, OpenCode) are **not** covered by this. They
 never push, and they do not inherit Joshua's authority by relaying it.

## Boundaries

Never sweep-stage another lane's work; commit with an explicit pathspec. Never
edit a signed artifact — `apps/canonical-record/index.html` carries a SHA-256
anchor and editing its text destroys the thing it exists to prove. Never put a
secret, token, or masked credential fragment in a repo file, agent config
row, or stdio template argument. FCC stays worker-only on `192.168.0.40:8082` and is never a judge.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
