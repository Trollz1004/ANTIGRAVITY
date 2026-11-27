---
name: ceo-standing-session
description: >
 Standing executive session playbook for Mission OS fleet orchestration (`ops/fleet/fleet-map.json`). Load at the
 START of every executive/orchestrator session, before any task work. Fuses the MCP toolset with the
 best catalog skills into one operating loop: orient -> verify -> work -> prove ->
 deliver through the judge lane.
---

# CEO Standing Session

You coordinate active work through Mission OS (`http://192.168.0.15:3130` on T5500; legacy coordination-board server retired). This skill is
the session spine: it tells you what to load, what to probe, which MCP does what,
and which catalog skill governs each phase. Everything else is task-specific.

## 1. Orient (first 5 tool calls, every session)

1. **Journal**: read your `.agents/journals/<lane>/STATE.md` and today's
 `.agents/memory/YYYY-MM-DD.md`. Past-you wrote it so present-you doesn't guess.
2. **Identity probes** — a listening port is NOT identity. Probe and classify each
 service UP / DOWN / WRONG SERVICE / AUTH MISSING / NOT CONFIGURED:
 - Mission OS (`http://192.168.0.15:3130/api/mos-state.json`, T5500)
 - DateApp Frontend (`http://192.168.0.15:3200`) & Backend API (`http://192.168.0.15:8000/api/v1/health`)
 - OmniRoute (`192.168.0.15:20128/v1/models`), Hermes API (`192.168.0.15:8643`) & Dashboard (`192.168.0.15:9119`), Shared `ai-memory` (`192.168.0.15:49374`)
 - Alienware Workshop (`192.168.0.40`): DREAM Engine (`:9180`), Lead-Gen (`:8392`), Media/TTS (`:8391`), OPSis Studio (`:8390`), Free Claude Code (`:8082`)
 - Note: Legacy coordination-board ports (`:3100`, `:3917`, `:3140`, MC5 `:3151`) are retired — never start or probe them as active.
3. **Git**: `git status -sb` + `git log --oneline -3`. Know local vs origin before
 touching anything. Pull with `--ff-only` only.
4. **MCP check**: one real tool call on the baseline (discovery alone is not proof):
 mission-mcp, antigravity-files, brain-mcp, playwright, supabase.
5. **Open queue**: check open tasks/approvals on Mission OS (`http://192.168.0.15:3130`) without duplicating watchdog checks.

## 2. MCP usage map (always prefer these over ad-hoc shell work)

| MCP | Use for | Never use for |
|---|---|---|
| mission-mcp | durable findings, decisions, lessons (`store_memory`) | session noise |
| brain-mcp | workspace sessions, secret REFS (never values), lane policy | — |
| antigravity-files | repo file ops from any agent context | — |
| playwright | live UI verification of Mission OS / Date App | — |
| supabase | Date App DB reads, docs (`search_docs` first) | schema changes w/o judge |
| omniroute | model routing (`Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`; Claude stays OAuth-only) | raw provider keys |

brain-mcp rules: platform ids are t5500-node ids (e.g. `codex-t5500`);
node_id must match the platform; target_paths absolute under `C:\ANTIGRAVITY`;
close every session with `brain.exitWorkspace`.

## 3. Skill routing (load the phase skill, do the phase right)

| Phase / situation | Skill(s) |
|---|---|
| Any non-trivial change | planning-with-files, writing-plans |
| Bug / red issue | systematic-debugging (hypothesis loop), adversarial-fix |
| Code change | test-driven-development / tdd, tests-as-contract |
| Before claiming done | verification-before-completion, prove-then-prune, release-proof |
| Simplify pass | deletion-first, maintainer-clarity, sleek-design-mobile-apps (UI) |
| Delivery | commit, review, open-pr, merge-pr, push — but ONLY via the judge lane (below) |
| Parallel work | dispatching-parallel-agents, subagent-driven-development, dateapp-swarm |
| Research / external | agent-reach, agent-browser, find-skills |
| Marketing | growth-marketer, social-growth-engineer, devrel-content, revenue-model |
| Money | payments (Square-only rail), revenue-model |
| Orchestration | mission-control, omniroute, t5500-node |
| Memory | para-memory-files, self-improving-system |
| Ops/infra | t5500-ops, fables-house, preview, system-connector |
| Ideation | brainstorming, brainstorm |
| Hermes lanes | hermes-youtube-faceless-news, hermes-youtube-avatar-head, hermes-agent-skill-authoring |
| Azure (rare) | azure-* family — load only the one needed |

Context is scarce: load ONLY the phase skill, skim, act. Never preload more than 5.

## 4. Operating law (never negotiable)

- **One root**: `C:\ANTIGRAVITY`. No scratch in repo root — use `.freebuff/` temp.
- **Evidence standard**: every claim VERIFIED / UNVERIFIED / BLOCKED with a handle
 (path, command output, identity response). Exit codes and green dots are not proof.
- **Judge lane**: workers never push/merge/delete. Commit locally → reset judge
 session → ONE review issue → exactly ONE heartbeat → relay pushes on
 APPROVE + JUDGE-PUSH sentinel. NEEDS-WORK → fix honestly → resubmit. Never push
 manually, never invent a tool-call result.
- **No secrets** in files, chat, logs. Keys live only in env files / OneDrive vault.
- **Payments**: Square primary + PayPal per `docs/PAYMENTS-TRUTH.md`; verify against the real rail or the task is not done.
- **Marketing**: never publishes directly — drops to `ops/marketing-inbox/`.
- **Grok is capped**: no heartbeats to capped/paused agents without positive evidence
 of clearance.
- **Memory write-back**: at session end, write what future-you needs to the journal
 and `192.168.0.15:49374` (`ai-memory` / `mission-mcp`). Files beat mental notes.

## 5. Session close

1. Journal entry: what was verified, what changed, what's left.
2. `mission-mcp store_memory` for any durable finding.
3. Vault update (`C:\ANTIGRAVITY\Antigravity\<NODE>\<agent>-to-<agent>.md` on T5500/Alienware, or `D:\DREAM ONLINE\00 HOME.md` for DREAM) if a durable fact changed — retired third-node vault mirrors do not exist.
4. Leave services UP and log locations recorded.

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
