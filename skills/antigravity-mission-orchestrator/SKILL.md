---
name: antigravity-mission-orchestrator
description: Use this whenever the user asks Codex to coordinate ANTIGRAVITY, Hermes, Slack, GitHub, Browser, Cloudflare, memory, local/cloud AI models, Ollama wrappers, OpenCode, OpenClaw, support nodes, launch readiness, green CI, or mission handoffs. This skill is the default orchestration layer for ANTIGRAVITY platform work, especially when the user says they do not want to repeat context. It must trigger for "orchestrate the mission", "Hermes", "all nodes", "memory across chats", "Slack update", "green state", "OpenClaw/OpenCode", or "ollama wrapper" requests.
---

# ANTIGRAVITY Mission Orchestrator

Use this skill to keep Codex aligned across ANTIGRAVITY, Hermes, Slack, GitHub, local models, cloud models, memory, automations, and deployment/support tooling.

The goal is simple: make Codex a calm coordinator that knows where truth lives, picks the right tool for each job, protects secrets and platform safety, and avoids making Josh repeat the same context.

## Non-Negotiable Rules

1. Canonical Windows repo root is `c:\antigravity`.
2. Canonical WSL repo root is `/mnt/c/antigravity`.
3. Do not create new root spellings such as `C:\Antigravity`, `C:\ANTIGRAVITY`, or `/mnt/c/Antigravity`.
4. Never use `ollama launch codex`, the Ollama Codex wrapper, or `.claude/agents/ollama-codex.md`.
5. Real Codex Desktop is the coding authority for repo edits, GitHub PRs, CI repair, security-sensitive changes, and final merge/delete flow.
6. Never print, store, test, or copy real secrets, populated `.env` values, tokens, private phone numbers, or raw chat logs.
7. Slack, Gmail, and social/customer-facing channels are draft-first unless Josh explicitly says to send live.
8. Do not run autonomous social posting, liking, following, joining, replying, or engagement automation.
9. No DAO/token/fundraising launch surfaces until attorney review explicitly clears them.
10. Keep Josh's daily Codex/Claude PC as a human-in-the-loop workstation, not the always-on service/security node.
11. If tool availability differs from this skill, trust live tool discovery and report the missing capability instead of inventing a workaround.

## First Pass Checklist

When this skill triggers:

1. Ground in current truth before acting.
2. Read repo status from `c:\antigravity`.
3. Check current branch, PR state, CI state, and untracked-file risk.
4. Use repo docs and briefings before memory claims.
5. Use local Codex memory only as a timestamped hint, then verify against files or live services.
6. If a task spans independent lanes, use subagents for sidecar analysis or disjoint edits.
7. Keep the immediate blocking task local so the main Codex thread does not stall.

Recommended grounding commands:

```powershell
git -C c:\antigravity status --short --branch
git -C c:\antigravity log --oneline --decorate -8
rg -n "workspace_path|ollama launch codex|DAO|token" c:\antigravity -g "*.md" -g "*.yml" -g "*.py" -g "*.ts" -g "*.tsx"
```

Narrow searches to the active task when broad scans would expose noisy historical or private artifacts.

## Tool Routing

Use the cheapest safe tool that can do the job well.

| Need | Preferred route |
| --- | --- |
| Code edits, branch work, CI repair, security-sensitive repo changes | Codex Desktop |
| PRs, CI logs, branch status, merge readiness | GitHub connector or `gh` CLI |
| Team updates | Slack draft first |
| Local UI/Hermes dashboard checks | Browser plugin for `127.0.0.1` / `localhost` |
| Cloudflare DNS, tunnels, Workers, Pages | Cloudflare plugin/skill after verifying repo source |
| Memory continuity | Repo briefing, then local Codex ad-hoc memory, then Notion/Drive only if callable |
| Bulk research or source synthesis | Hermes wrapper or Hermes dashboard |
| Cheap code search/lightweight review | OpenCode wrapper |
| Local support/research fleet tasks | OpenClaw wrapper |
| Simple conversational/explainer work | Pi wrapper |
| Provider/model value decisions | AI value/cost reasoning, not paid APIs by default |

Do not route code edits to the Ollama Codex wrapper. If a historical doc recommends it, treat that doc as stale.

## Node Placement Policy

Default posture:

- Daily Codex/Claude PC: interactive development, review, GitHub/Slack coordination, browser verification, and explicit one-shot commands.
- T5500: heavy services, Docker, Cloudflare/wrangler work, background scanners, media jobs, and local model/service hosting after live node verification.
- 9020: support or marketing sandbox only after wipe/preserve status is verified; do not treat it as current production authority by memory alone.
- Sabretooth: primary interactive/Hermes command seat only when current docs and live checks agree; avoid turning it into a noisy always-on service pile.
- Mini ASUS PC: optional future load-balancer/traffic helper after live verification; do not route production traffic or secrets there by assumption.
- Sabretooth/Hermes PC roles may drift in historical docs; verify the current node before enabling services.

Do not install or enable new always-on watchdogs, Sentry loops, Docker stacks, key scanners, or model daemons on Josh's daily PC unless Josh explicitly asks for that machine to carry the service.

When a task asks to "move it off my PC":

1. Inventory the current local service/process.
2. Identify the right node and drive lane from current docs or live SSH checks.
3. Prefer cold-start opt-in services over logon-spam terminals.
4. Use hidden/background service wrappers only after confirming logs, health checks, and rollback.
5. Keep secrets in the approved vault path or environment variable names only.

## Wrapper Policy

Allowed with explicit fit:

- `ollama launch hermes` for research and synthesis.
- `ollama launch opencode` for cheap code search or lightweight review.
- `openclaw agent --message "$PROMPT"` for support/research fleet work.
- `ollama launch pi` for simple conversational work.
- `ollama launch claude` only for Claude-shaped bulk reasoning where no Anthropic API is needed.

Forbidden:

- `ollama launch codex`
- `ollama launch codex --model qwen-coder`
- Any "Codex wrapper" that locks out or replaces the real Codex Desktop session.

If a task asks for coding delegation, use Codex subagents or OpenCode, not the Ollama Codex wrapper.

## Memory Strategy

Use this priority order:

1. Current repo files in `c:\antigravity`.
2. Timestamped repo briefings under `briefings/`.
3. Local Codex ad-hoc notes under `C:\Users\joshl\.codex\memories\extensions\ad_hoc\notes\`.
4. Slack drafts/messages after reading channel context.
5. Notion or Google Drive only when the connector is callable in the current session.
6. Raw Hermes sessions only as last-resort evidence, and only after sanitizing secrets and personal identifiers.

When saving memory:

- Save short, timestamped, evidence-backed notes.
- Include paths, PR numbers, and exact dates.
- Exclude secrets, raw logs, phone numbers, and private chat transcripts.
- Say when a fact is Hermes-reported but not independently verified.

## Slack And Team Updates

Default to Slack drafts.

Before posting or drafting:

1. Search for the target channel.
2. If no project channel exists, use the channel Josh already chose or ask for one.
3. Keep updates short: source of truth, current state, blockers, next action.
4. Do not include secrets, raw logs, private numbers, or internal-only credentials.

Use live sends only when Josh explicitly says to send.

## GitHub Green-State Routine

For PR/CI cleanup:

1. Inspect PR state and failed jobs.
2. Separate failures caused by current diff from pre-existing repo drift.
3. Fix root causes when the change is small and safe.
4. Do not weaken security gates unless the repo already has an intended lower config that CI is overriding.
5. Run local checks that match CI where practical.
6. Stage only scoped files.
7. Commit, push, monitor CI.
8. Merge and delete the branch only when required checks are green and protections allow it.

If CI fails for external infrastructure, report the exact failing job, log line, and recommended owner action.

## Public Surface And Security Gates

Before editing launch, marketing, payment, support, or public surfaces:

1. Read current doctrine and deployment source of truth.
2. Scan for restricted public-impact terms in active surfaces.
3. Keep payment rails aligned to current repo doctrine.
4. Do not add or move Stripe/Square keys without explicit source-of-truth confirmation.
5. Use placeholder environment variable names only.

## Subagent Use

Use subagents when Josh explicitly asks for them or when multiple independent lanes can move in parallel.

Good subagent lanes:

- CI log analysis while Codex writes docs.
- Security scan while Codex patches code.
- Skill/eval review while Codex implements the first draft.
- Browser/UI verification while Codex prepares GitHub cleanup.

Avoid subagents for urgent blocking edits or secret-bearing work.

## Handoff Template

Use this for Slack, repo briefings, or new Codex threads:

```text
ANTIGRAVITY handoff

Source of truth:
- Repo root: c:\antigravity
- WSL root: /mnt/c/antigravity
- GitHub repo: Trollz1004/ANTIGRAVITY
- Current branch/PR:

Current state:
-

Blockers:
-

Next action:
-

Safety:
- No secrets or raw chats included.
- Do not use ollama launch codex.
```

## Completion Standard

Before saying the work is complete:

- Run relevant local verification.
- Confirm no secrets were introduced.
- Confirm no unrelated dirty files were staged.
- Confirm Slack/GitHub/automation actions were draft-first or explicitly approved.
- Report exact remaining Josh-only actions, if any.
