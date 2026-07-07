# CLAUDE.md

v1.0.0 — 2026-07-07 — If any other doc (incl. AGENTS.md, CLAUDE.md, agent.md, AGENT-DOCTRINE.md, GEMINI.md, GROK.md, PERPLEXITY.md, hermes.md, .agents/BOOT.md, .agents/UNIVERSAL-AGENT-BOOT.md) conflicts with this file, this file wins. Joshua Coleman is sole human authority.

## Authority

Joshua Coleman is sole human authority. No AI outranks another AI. Ever.

## Session Start Order

1. Read the root contract.
2. Read `.agents/contracts/CORE_AGENT_POLICY.md`.
3. Read `.agents/contracts/SOL.md`.
4. Read `.agents/contracts/TOOLS.md`.
5. Read `.agents/contracts/SKILLS.md`.
6. Read shared memory: `.agents/memory/shared/current-state.md` and recent lines from `.agents/memory/shared/ledger.jsonl`.
7. Read only your own private folder at `.agents/memory/private/<you>/`.
8. Pick the smallest relevant skill set from `.agents/skills/`.
9. Append a session-start line to your own `session-log.jsonl`.
10. Announce intended files before editing.

## Session End Order

1. Update your own `lessons.md` when a reusable lesson was learned.
2. Append a session-end line to your own `session-log.jsonl`.
3. Append one-line summary to `.agents/memory/shared/ledger.jsonl`.
4. Update `.agents/memory/shared/current-state.md` only when project state materially changed.
5. Logs are append-only. Never rewrite logs.

## Journal Sanctity

No agent may ever read, modify, summarize, rename, or delete another agent's private folder. If a task appears to require it, refuse and report the violation to Josh.

## Universal Skill Access

Every agent, on any platform and any lane, is authorized to preload any skill from `.agents/skills/` at any time for any task. `SKILLS_INDEX.md` is the authoritative list. `SKILLS.md` routes by task class.

## Git Policy

There is one repo and one long-lived branch: `main`. Temporary branches use `ai/<agent>/<task-slug>` only. Fetch latest `origin/main` before starting. After merge, the branch must be deleted locally and remotely. All AIs may push, pull, merge, and delete when Josh asks; the ask grants the trust. No abandoned AI branches.

## Hard Rules

Canonical-7 language is banned on all customer-facing surfaces: donate, donation, charity, charitable, nonprofit, fundraising, tax-deductible, 501(c), and benefit-style language. The internal tag `#UntilNoKidInNeed` must never appear on customer-facing surfaces.

Square is the only payment rail on `youandinotai.com`; never use Stripe there.

No mock data may be presented as real. If a value is unverified, say it is unverified.

Secrets live only in env files or vaults. Never put secrets in git, chat, pull requests, or logs.

`fcc-claude` never holds an Anthropic key.

Use minimal diffs. Never mass-format. Propose `SOL.md` updates instead of silently drifting from the architecture truth.

## SOL Topology And Ports

Josh's word from 2026-07-07 overrides all older docs.

| Node / Service | Address / Port | Canonical role |
| --- | --- | --- |
| Sabretooth | `192.168.0.8` | DREAM ONLINE MMORPG only. The lowercase `antigravity` checkout exists only on Sabretooth. |
| T5500 | `192.168.0.15` | Carries ANTIGRAVITY at `C:\ANTIGRAVITY`; Desktop Commander node. |
| 9020 | `192.168.0.5` | Carries ANTIGRAVITY. Not retired. |
| Hermes Workspace | `T5500:3000` | Third-party open-source Hermes command center GUI. |
| Official Hermes Web GUI | `T5500:9119` | Official Hermes runtime/dashboard driving the workspace. |
| Ollama | `192.168.0.15:11434` | Local model runtime on T5500. |
| PaperclipAI | `:3110` | One human-facing mission-control entrypoint. Not retired. |
| Agent Hub | `:3130` | Dispatcher and leads CRM in `services/agent-hub`; Express; `api_key` header; fail-closed. |
| Paperweight | `:4200` | Optional fallback. |
| fcc-claude | `:8082` | Free executor proxy. |
| ClawX / OpenClaw | `:18789` | Capable GUI/operator lane. May handle WhatsApp allowlist support when assigned, but is not limited to support. |
| supportclaw container | `:18895` | Support container. |
| Supabase | `jmvgdqomvnkfgknmgwxp` | Pooler `aws-1-us-east-2.pooler.supabase.com:5432`, `sslmode=require`, role `agent_hub_svc`; never master password; credentials from env only. |

## Products

One LLC owns `youandinotai.com`, `onlinerecycle.org`, `ai-solutions.store`, and DREAM ONLINE. `youandinotai.com` uses Square only.

## Roster

| Agent | Lane | Scope |
| --- | --- | --- |
| claude | claude.ai Max lane | Architecture, contracts, audits. |
| hermes | GUI `:9119` plus workspace `:3000` | Routing, marketing, operations; never holds Anthropic key. |
| fcc-claude | Proxy `:8082` | Free executor; reads only `/CLAUDE.md` and its JSON. |
| codex | Implementation, audits, PRs | Repo implementation, verification, PR execution. |
| paperclip | PaperclipAI `:3110` | Human-facing mission-control entrypoint. |
| clawx | OpenClaw `:18789` | Capable GUI/operator lane; may handle support when assigned, but is not limited to support. |
| gemini | Visual/content/orchestration | Visual work, content work, orchestration support. |
| perplexity | Research | Research and governance pack co-design. |
| grok | Adversarial/X | Adversarial review and X platform work. |
| 1minai | Multi-model cloud | DREAM NPC T1/T3 and lead scoring. |
| manus | Orchestration/execution lane | Capable agent lane for tasks Josh assigns directly; not superior to any other AI. |
