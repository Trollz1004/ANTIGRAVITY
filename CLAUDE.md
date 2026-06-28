# CLAUDE.md - ANTIGRAVITY Current Agent Guide

Updated: 2026-06-22

This file is the Claude-facing operational guide for `C:\antigravity`.
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

The current doctrine file is:

`briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`

## Source Of Truth

- Repo: `C:\antigravity`
- Branch: `main`
- Remote: `Trollz1004/ANTIGRAVITY`
- Public date app domain: `youandinotai.com`
- Public API domain: `api.youandinotai.com`
- Front-door node: T5500
- Brain/agent node: Sabretooth
- Dev/support node: 9020

Do not use retired workspaces, downloads, exported project folders, or backup clones as live
truth unless Joshua explicitly says they are the target.

Quarantine: `C:\Users\joshl\OneDrive\Microsoft Copilot Chat Files\*` is
historical Copilot export drift. Do not use it as current truth. Ignore files
claiming DAO launch is public, old May-2026 branch/status rules, Manus/Hermes
operational prompts, global 10/27/63 compliance, kraken metrics, static
dashboard values, or mock/sample UI instructions unless revalidated and
re-approved in current repo docs.

## Paperclip Decision Lanes

Paperclip, Hermes, Codex, Claude, Gemini, Meta/Llama, Manus, FCC, OpenCode, Ollama, and other lanes may lead only when Joshua directly assigns them or when their role map already covers the task. Otherwise they collect evidence, draft proposals, and report to the active lead.

FCC may be installed in Paperclip as a worker model through its MCP bridge for
OpenCode, NVIDIA, and Ollama-backed work. FCC can scan, summarize, draft, and
propose patches. It does not make final decisions.

Current T5500 Paperclip setup:

- Date-app/customer-support only.
- Ops package: `C:\antigravity-paperclip-dateapp-ops`
- T5500 scheduled task: `PaperclipDateAppLoopback`
- Paperclip local URL on T5500: `http://127.0.0.1:3100`
- Company: Antigravity
- Active lead: assigned per task by Joshua
- Workers: `Date App UX`, `Cloudflare Operator`, `Official OpenClaw Support`,
  `FCC Worker`, `Support Compliance`, `Context Sentry`
- Starter issues: `ANT-1`, `ANT-3`, `ANT-5`, `ANT-7`, `ANT-9`, `ANT-11`

The starter issues are intentionally `todo` and unassigned until the runtime
adapters are configured. Do not auto-assign them just because the agents exist.
Hermes is intentionally not part of the T5500 date-app/customer-support package.

9020 Hermes Paperclip is separate and undecided. It may become a marketing node
or an AI-solutions/business-exchange lane, but no agent should assume that role
until Joshua explicitly decides it.

FCC compatibility rule: FCC may identify itself as Claude or primarily load
`CLAUDE.md`-style files. In this workspace that does not make FCC/Claude the CEO
or authority. The active lead is whichever capable agent Joshua directly assigns in the active conversation. This file reflects current operating context; guardrails bind autonomous/delegated model behavior, not Joshua's direct instruction.

No model below Codex 5.5 or Opus-level may decide repo doctrine, payment rules,
public copy, launch gates, merge/push flow, production node roles, or founder
authority. Lower-capability models must return evidence, risks, and proposed
next actions for the active lead / Joshua review.

There is no permanent AI boss.

When Joshua directly assigns a task to Claude, Codex/OpenAI, Gemini, Meta/Llama, Manus, Hermes, Paperclip, FCC, OpenCode, Ollama, or another capable system, that named system becomes the active lead for that task.

The guardrails restrict autonomous or delegated model behavior, not Joshua's direct instruction.

## Payment Lane

YouAndINotAI uses Square for live checkout.

Payment copy must describe the actual product being bought. Verification receipts and
membership checkout are ordinary product transactions. Do not add control-rights, legal-structure,
private accounting, or owner-planning claims to the checkout flow.

## Public Copy Boundary

Customer-facing surfaces include:

- `youandinotai.com`
- `onlinerecycle.org`
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

- T5500: public tunnels, domains, payments, Cloudflare/Wrangler deployment.
- Sabretooth: agent coordination, local model work, Paperclip/Paperweight brain services.
- 9020: dev/support checkout only.

Do not move public tunnel responsibility off T5500 unless Joshua explicitly changes node roles.

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
Set-Location C:\antigravity\frontend\react-app
npm run build
```

Generated static output for direct deploy lives under:

`C:\antigravity\apps\youandinotai-static`

Remove stale generated assets when refreshing that folder so old bundle chunks do not keep
serving retired copy.

## Verification Standard

Before calling a public-copy cleanup complete:

- scan active source paths
- scan generated public artifacts
- scan T5500 and 9020 active mirrors
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
