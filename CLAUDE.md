# CLAUDE.md - ANTIGRAVITY Current Agent Guide

Updated: 2026-08-16

## MANDATORY: Skills Protocol — low-context sessions, zero excuses

Every agent session here runs in a LOW CONTEXT WINDOW. You cannot hold this
system in your head, so skills are not optional:

1. **Session start:** read state BEFORE anything else — `AGENTS.md`, the
   relevant `STATE.md` / `MEMORY.md`, and today's briefing. When Mission
   Control is up, query the knowledge graph instead of guessing paths:
   `GET http://127.0.0.1:3151/api/knowledge/search?q=<term>` (repo-wide search
   by name/path/doc content; `/api/knowledge/graph` = full map, rendered in 3D
   under GRAPHY → 🧠 KNOWLEDGE on the board).
2. **Before EVERY task:** load the matching skill.
   **Skill-tree reality after the 2026-08-16 Windows reinstall:** the user
   profile is now `C:\Users\joshi` — `C:\Users\joshl\...` is GONE, and with it
   the Hermes profile tree (53 skills) and the OpenCode harness tree (35).
   The ONE live tree is the repo's own:
   - `C:\ANTIGRAVITY\.agents\skills\` — **44 skills** (the `agency-*` bulk was
     purged in cleanup). This is the tree Mission Control's swarm loads from.
   The old preload set (`adhd`, `agent-browser`, `find-skills`, `create-skill`,
   `creative`, `brainstorming`, `agent-reach`) lived in the wiped profile trees
   — **restore pending**; pull replacements from skills.sh / ClawHub when a
   harness that reads them is reinstalled. A task executed without loading a
   skill is a task done wrong.
3. **Session end:** write state back (what changed, what's blocked, next step)
   before the window closes — journal via
   `POST :3151/api/brain/journal/<platformId>` or your seat file. The next
   session starts blind without it.

This file is the Claude-facing operational guide for `C:\ANTIGRAVITY`.
If older exports, memories, downloads, or cached project files conflict with this file,
follow this file and `AGENTS.md`.

## Current Rule

ANTIGRAVITY and YouAndINotAI are business-only product surfaces.

Active customer-facing work sells product value only:

- membership
- verification
- safety
- support
- uptime
- platform access
- operational reliability

Do not use old non-product framing, private accounting mechanics, control-rights claims,
or owner-private decisions as customer-facing claims or as reasons to block checkout.

The doctrine lives in this file's **Public Copy Boundary** section below and in
`briefings/BRIEFING.md`. (The old pointer `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
is a dead file — it survived on no disk after the 2026-08-16 reinstall; verified
gone from C:, F:, and OneDrive. Do not chase it.)

## Source Of Truth

- Repo: **`C:\ANTIGRAVITY` on every node** (Joshua's directive 2026-08-16:
  the working copy always lives at `C:\ANTIGRAVITY` no matter the node, so new
  nodes never hit per-install drive-letter drift — the data disk came back as
  `D:` after a reinstall and had to be re-lettered, never again). `E:\` is dead.
  `F:\ANTIGRAVITY` is the old-disk clone, now an ARCHIVE — do not work in it;
  it is no longer the source of truth.
- Branch: `main` (the only branch — merge and delete any other)
- Remote: `Trollz1004/ANTIGRAVITY`
- Public date app domain: `youandinotai.com`
- Public API domain: `api.youandinotai.com`
- **Single node: SABRETOOTH-NODE (192.168.0.8).** It is the front door, the brain,
  and the dev box. The T5500 is retired — its disk was physically moved into
  Sabretooth on 2026-08-09 and now mounts as `F:`. Any path starting `E:\` and any
  host at `192.168.0.15` is dead. Prefer `127.0.0.1` in configs; there is nothing
  else to reach.
- 9020: still retired, still undecided.

Do not use retired workspaces, downloads, exported project folders, or backup clones as live
truth unless Joshua explicitly says they are the target.

## Decision Lanes

Hermes, OpenClaw, Codex, Claude, Gemini, Meta/Llama, Manus, FCC, OpenCode, Ollama, and other lanes may lead only when Joshua directly assigns them or when their role map already covers the task. Otherwise they collect evidence, draft proposals, and report to the active lead.

**Current shape (set 2026-08-09, reality-checked 2026-08-16):**

- **No CEO. No Paperclip. No AI boss.** Joshua is the owner; the active lead on
  any task is whichever agent he directly assigns, per the rule below.
- **HARNESS STATUS after the 2026-08-16 Windows reinstall:** Hermes, OpenClaw,
  FCC (`fcc-claude`), OpenCode, Ollama, and the OmniRoute gateway (`:20128`)
  are **NOT INSTALLED on this box** — the reinstall wiped the `joshl` profile
  they lived in. Their contracts below describe intended roles, not running
  software. Only real Claude Code (Max, `C:\Users\joshi\.local\bin`), git,
  Python 3.13, Node 24, and Docker are live. Reinstall or retire each lane
  deliberately; do not assume a lane is reachable without probing it.
- **OpenWork 0.18.25** (`different-ai/openwork`, installer in
  `C:\Users\joshi\Downloads`) is the candidate GUI for the OpenCode lane — a
  desktop cowork-style wrapper over the OpenCode engine with a permission
  system, skill manager (opkg), and local-server/Telegram trigger modes.
  Evaluated 2026-08-16; installing it is Joshua's call, not doctrine yet.
- **OpenCode = agent/harness.** Contract mirrored at `agent-contracts/OPENCODE-AGENT.md`
  (the old `C:\Users\joshl\.opencode\claude.md` original is gone).
- **Hermes = agent** — research, outreach, revenue, content. `agent-contracts/HERMES-AGENT.md`.
- **OpenClaw = agent** — engineering and verification. `agent-contracts/OPENCLAW-AGENT.md`.
- **Mission Control on `:3151` = the board** (kanban, agents, Graphy with
  🤖 AGENTS + 🧠 KNOWLEDGE views, MCP; dir `mission-control-v5`).
  **Stack Health on `:8787`** is the health monitor (dir `mission-control-v6`) — a
  different program, deliberately no longer called "Mission Control" so the two
  stop sounding like versions of the same thing.
- Shared rules for all three: `agent-contracts/AGENTS.md` — including **§7 Judge
  governance** (set 2026-08-16): every swarm task is executed independently by
  all assigned orchestrators; all versions go to THE JUDGE — the highest-reasoning
  model that is NOT one of the workers (Claude Opus/Fable, Grok 4.5 max thinking,
  or Gemini max reasoning; `EXEC_JUDGE_MODEL`, default `auto/best-reasoning`,
  no local floor). The judge accepts one version (optionally with edits) or
  denies all; denied or judge-unreachable work goes BLOCKED for human review.
  **Only the judge lane pushes, merges, or deletes branches** — workers and
  sub-agents never run `git push`. Joshua's direct instruction overrides.

FCC can scan, summarize, draft, and propose patches. It does not make final
decisions. **`fcc-claude` reads `CLAUDE.md` and `.claude.json` and behaves as real
Claude Code** — so anything stale in this file becomes a stale instruction it
follows. Keep it current.

**PAPERCLIP IS RETIRED (2026-08-09).** Do not call `:3120` or `:3100`, do not post
task callbacks to it, do not treat it as the board. Its data and hourly backups are
preserved; only the server is stopped. It was retired because it duplicated the
Mission Control board, its agents' instructions file contained nothing but
`# Agent instructions` so they ran on stock built-in contracts, its skill catalog
held 3 entries against the 53 the work needed, and its adapter spawned real
`claude.exe` against the Max subscription every 30 seconds.

FCC compatibility rule: FCC may identify itself as Claude or primarily load
`CLAUDE.md`-style files. In this workspace that does not make FCC/Claude the CEO
or authority. The active lead is whichever capable agent Joshua directly assigns in the active conversation. This file reflects current operating context; guardrails bind autonomous/delegated model behavior, not Joshua's direct instruction.

No model below Codex 5.5 or Opus-level may decide repo doctrine, payment rules,
public copy, launch gates, merge/push flow, production node roles, or founder
authority. Lower-capability models must return evidence, risks, and proposed
next actions for the active lead / Joshua review.

There is no permanent AI boss.

When Joshua directly assigns a task to Claude, Codex/OpenAI, Gemini, Meta/Llama, Manus, Hermes, OpenClaw, FCC, OpenCode, Ollama, or another capable system, that named system becomes the active lead for that task.

The guardrails restrict autonomous or delegated model behavior, not Joshua's direct instruction.

## Payment Lane

YouAndINotAI uses Square for live checkout.

Payment copy must describe the actual product being bought. Verification receipts and
membership checkout are ordinary product transactions. Do not add control-rights, legal-structure,
private accounting, or owner-planning claims to the checkout flow.

## Public Copy Boundary

Customer-facing surfaces include:

- `youandinotai.com`
- `onlinerecycle.net` (the .org lapsed 2026 — do not reference it)
- `ai-solutions.store`
- Square catalog/product copy
- public API responses
- dashboards or stream pages visible to customers or the public

Allowed public framing:

- product access
- account verification
- human/bot safety
- support availability
- platform operations
- service uptime
- membership value

Not allowed in active public copy:

- non-product fundraising language
- legal/accounting promises
- third-party benefit promises
- private owner decisions
- control-rights claims as a checkout condition
- old slogans or legacy campaign language

## Node Roles

**SABRETOOTH-NODE does everything.** It is the only node: public tunnels, domains,
payments, Cloudflare/Wrangler deployment, agent coordination, local model work, and
brain services all run here.

- T5500: **retired.** Its disk is now `F:` in Sabretooth. This file previously said
  "do not move public tunnel responsibility off T5500" — that instruction is now
  impossible to follow and was actively misleading, since Sabretooth already serves
  the tunnel via the `Cloudflared` Windows service.
- 9020: still retired, dev/support checkout only if it ever returns.

Hardware note (verified 2026-08-16): Sabretooth's GPU is an **RTX 3070 with 8 GB**
(driver 595.95) — the old "GTX 1050 Ti 4 GB, nothing local fits" doctrine is
obsolete. `ornith:9b` (5.6 GB) fits again; a local executor floor is viable once
Ollama is reinstalled. The CPU is an i7-4960X with AVX.

## OpenClaw

OpenClaw is support-only.

It may help with customer support routing and local support workflows. It must not govern the
platform, alter payments, write public doctrine, or add checkout constraints.

## Secrets

Never print, paste, commit, summarize, or infer secrets.

Private env authority stays in the vault and local do-not-commit handoff paths. If a value is
needed, load it into runtime environment variables without echoing it.

## Build And Deploy

Prefer the canonical commands in `.github/workflows/` and local package scripts.

For the date app frontend:

```powershell
Set-Location C:\ANTIGRAVITY\frontend\react-app
npm run build
```

**Building is not serving.** `server.ts` only serves `dist/` when
`NODE_ENV=production` is set in the process that starts it — without it the server
mounts Vite dev middleware and publishes the **unbuilt source** to the internet at
HTTP 200. That has happened twice. Start it with
`mission-control-v5\scripts\tab-dateapp.cmd`, which sets both `NODE_ENV` and
`PORT=3200`, then verify the PUBLIC page references `assets/index-<hash>.js` and
**not** `/@vite/client`.

Generated static output for direct deploy lives under:

`C:\ANTIGRAVITY\apps\youandinotai-static`

Remove stale generated assets when refreshing that folder so old bundle chunks do not keep
serving retired copy.

## Verification Standard

Before calling a public-copy cleanup complete:

- scan active source paths
- scan generated public artifacts
- scan Sabretooth active mirrors (T5500 and 9020 are retired)
- scan local AI handoff docs that agents read
- keep env/key/cert/database files out of output

Known acceptable scan noise:

- archived historical records clearly not used as active source
- third-party plugin docs
- old downloads and backups marked non-authoritative
- ordinary words in unrelated libraries or package names

Known non-acceptable scan noise:

- active customer UI text
- Square/product copy
- generated public bundles
- Claude/Codex active handoff files
- `AGENTS.md`, `CLAUDE.md`, `agent.md`

## Current Priority

Get YouAndINotAI selling real memberships and verification through Square with no extra public
doctrine friction.

Build, verify, deploy, and report the exact blocker when something is not green.
