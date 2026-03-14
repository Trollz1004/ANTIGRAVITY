# GPT-5.4 Project Source Of Truth

Updated: 2026-03-14
Repo: `C:\ANTIGRAVITY`
Primary branch: `main`
Current promoted baseline: `9796aba`

## Purpose

This file is the concise source-of-truth brief for importing ANTIGRAVITY context into a ChatGPT project folder or other OpenAI workspace documentation.

It is designed to survive:
- accidental context loss
- machine rebuild
- node outage
- operator absence
- operator death

It intentionally contains paths, structure, and recovery logic, but not secret values.

## Live System Layout

- Live Codex base: `C:\ANTIGRAVITY`
- Live Codex workspace: `C:\ANTIGRAVITY\CodeX`
- Legacy local copy: `E:\ANTIGRAVITY` (not the live runtime base)
- Primary Git remote: `origin` -> GitHub `Trollz1004/ANTIGRAVITY`

## Node Topology

### SABRETOOTH

- Role: live Codex command post
- Runtime model: desktop-app-first
- Docker: not required
- Local fallback model: Ollama `qwen2.5:7b`
- Active scheduled tasks:
  - `CodeX-Fleet-Watcher`
  - `CodeX-Brain-Checkpoint`
  - `CodeX-Mission-Guardian`
  - `CodeX-Task-Sentry`
  - `CodeX-SABRETOOTH-Safe-Control`

### 9020

- Role: remote content/draft node
- Access: SSH reachable as `joshl`
- Boot mode: cold/quiet by default
- Approved scheduled task:
  - `CodeX-9020-Safe-Drafts`
- Policy: generates drafts and handoff files only, no live posting

### T5500

- Role: remote audit/revenue node
- Access: SSH reachable as `joshl`
- Boot mode: cold/quiet by default
- Still available intentionally: `qdrant` on `:6333`
- Approved scheduled tasks:
  - `CodeX-T5500-Safe-Marketing-Audit`
  - `CodeX-T5500-Revenue-Pack`

## MCP Connection Model

Two Codex MCP config files are part of the live setup:

- Repo MCP config: `C:\ANTIGRAVITY\.mcp.json`
- Workspace MCP config: `C:\ANTIGRAVITY\CodeX\.mcp.json`

Configured MCP servers:
- `omega-sentry`
- `filesystem`
- `github`
- `memory`
- `sequential-thinking`
- `puppeteer`
- `context7`

Important details:
- `omega-sentry` runs from `C:\ANTIGRAVITY\mcp-server\dist\index.js`
- `filesystem` is rooted at `C:\ANTIGRAVITY`
- Gemini-side MCP config also exists at:
  - `C:\Users\joshl\.gemini\antigravity\mcp_config.json`

Health verification is handled by:
- `C:\ANTIGRAVITY\scripts\codex-doctor.ps1`

`codex-doctor` checks:
- Codex trust for both `C:\ANTIGRAVITY` and `C:\ANTIGRAVITY\CodeX`
- repo/workspace MCP config presence and parseability
- Gemini MCP config presence
- SSH config presence
- required MCP npm packages
- local memory stack state
- SSH connectivity to `t5500` and `9020`

## Memory System

The memory system is repo-backed and split into tracked operational memory plus ignored private/local memory.

Primary operator memory entrypoint:
- `C:\ANTIGRAVITY\AGENTS.md`

Tracked shared memory files:
- `C:\ANTIGRAVITY\memory\activeContext.md`
- `C:\ANTIGRAVITY\memory\projectState.md`
- `C:\ANTIGRAVITY\memory\decisions.md`
- `C:\ANTIGRAVITY\memory\identity.md`
- `C:\ANTIGRAVITY\memory\techStack.md`
- `C:\ANTIGRAVITY\memory\sessionHandoff.md`
- `C:\ANTIGRAVITY\memory\MISSION_CONTINUITY.md`
- `C:\ANTIGRAVITY\memory\README.md`

Generated runtime handoff/status material:
- `C:\ANTIGRAVITY\CodeX\state\runtime\codex-orchestrator-handoff.md`
- `C:\ANTIGRAVITY\CodeX\state\runtime\TASK-QUEUE-100.md`

Ignored/local-only memory locations:
- `C:\ANTIGRAVITY\memory\local\`
- `C:\ANTIGRAVITY\memory\private\`
- `C:\ANTIGRAVITY\data\local\`
- `C:\ANTIGRAVITY\data\private\`

Rule of operation:
- tracked memory stays secret-free
- secret-bearing notes live in `memory\local` or `memory\private`
- session state is re-written into handoff docs
- orchestrator/checkpoint tasks can re-dirty generated files during normal operation

## Continuity And Backup Fail-Safe

Primary continuity documentation:
- `C:\ANTIGRAVITY\briefings\CODEX-CONTINUITY-RUNBOOK.md`

Core scripts:
- `C:\ANTIGRAVITY\scripts\export-codex-continuity.ps1`
- `C:\ANTIGRAVITY\scripts\test-codex-continuity.ps1`
- `C:\ANTIGRAVITY\scripts\restore-codex-continuity.ps1`
- `C:\ANTIGRAVITY\scripts\init-continuity-passphrase.ps1`

Backup targets:
- removable/local backup: `I:\ANTIGRAVITY_BACKUPS\codex-continuity`
- offsite backup: `C:\Users\joshl\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity`

Passphrase locations:
- local ignored passphrase file:
  - `C:\ANTIGRAVITY\memory\private\continuity-passphrase.txt`
- OneDrive Personal Vault mirror:
  - `C:\Users\joshl\OneDrive\Personal Vault\codex-continuity-passphrase.txt`

### What The Continuity Export Preserves

Public/state continuity pack includes:
- `README.md`
- `AGENTS.md`
- `.gitignore`
- repo `.mcp.json`
- workspace `.mcp.json`
- shared memory files
- continuity scripts
- runbook
- recovery helpers
- OnlineRecycle worker scripts
- selected workspace status files

Secret continuity pack includes:
- workspace `env`
- `memory\local`
- `memory\private`
- `data\local`
- `data\private`
- SSH config and keys under `%USERPROFILE%\.ssh`
- Codex config at `%USERPROFILE%\.codex\config.toml`
- Gemini MCP config
- selected recovery scripts

### Secret Backup Protection

- If `-IncludeSecrets` is used and a passphrase exists, the secret pack is zipped and AES-encrypted into `private-state.aes`
- If no passphrase exists, secret continuity can still copy to USB in plaintext form, but that is intentionally treated as weaker recovery
- The preferred state is encrypted offsite continuity plus USB continuity

### Verification Model

Continuity status is checked by:
- `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\test-codex-continuity.ps1`

Status meanings:
- `GREEN`: public/state and secret continuity both exist beyond local drives
- `YELLOW`: public/state is backed up, but secrets are not fully protected offsite
- `RED`: recovery is incomplete

Latest recorded export state file:
- `C:\ANTIGRAVITY\data\private\codex-continuity\latest-status.json`

Documented latest known good state from the repo:
- public backup targets: USB + OneDrive
- secret mode: encrypted
- OneDrive was started during export
- USB available: true
- OneDrive available: true

## Recovery Order On A Fresh Machine

1. Clone `Trollz1004/ANTIGRAVITY`
2. Restore the public continuity pack
3. Restore the encrypted secret continuity pack
4. Put back:
   - `.ssh`
   - `.codex`
   - repo `.mcp.json`
   - workspace `.mcp.json`
   - workspace env files
5. Run:
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\codex-doctor.ps1`
6. Re-verify:
   - SSH
   - MCP
   - continuity
   - scheduled tasks

Secret restore command pattern:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\restore-codex-continuity.ps1 `
  -EncryptedPath "C:\Users\joshl\OneDrive\Documents\ANTIGRAVITY_BACKUPS\codex-continuity\latest\private-state.aes" `
  -OutputDirectory "C:\restore\codex-continuity"
```

## Automation Boundary

The safe automation boundary is explicit and generated:

- `C:\ANTIGRAVITY\CodeX\state\marketing\node-automation-matrix-latest.md`
- `C:\ANTIGRAVITY\CodeX\state\marketing\public-copy-policy-audit-latest.md`

Approved automation:
- Sabretooth: control pack, node matrix, public-copy audit
- 9020: safe drafts and handoff packs
- T5500: audit + revenue-support packs

Not approved:
- live posting to X
- live posting to Facebook
- live posting to Reddit
- live posting to LinkedIn
- blind browser engagement loops
- autonomous pricing, production edits, or inventory changes

Current platform rule:
- X/Facebook: Perplexity only, human-watched
- Reddit: Devvit / Opus / Perplexity only
- LinkedIn: draft-only

## Revenue/Payment Baseline

- Public checkout path is now Square-first
- Canonical Square links are recorded in `AGENTS.md`
- Repo-local payment truth is pinned in `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
- Backend Stripe dependency was removed from the live backend path
- Public app/docs were cleaned to replace stale Stripe checkout references

## Current Deployment Snapshot

- Frontend: `https://youandinotai.com` on Cloudflare Pages
- Multiplayer backend: `https://youandinotai-backend-731395189513.us-east1.run.app` on Cloud Run
- Frontend fallback websocket target is the Cloud Run service above
- Frontend CSP now explicitly permits the Cloud Run websocket origin
- FastAPI API remains live at `https://api.youandinotai.com`
- Public verification shows `api.youandinotai.com` is proxied through Cloudflare and serving the live API
- The zone's exact SSL mode was not directly readable from the current session auth scope, so only public proxy behavior was verified in this session
- `youandinotai-api` now handles completed `payment.updated` Square events in the live verification path
- Founder Badge welcome email delivery exists in the backend and safely skips when SMTP is not configured

## Mission / Death Contingency

Mission continuity source:
- `C:\ANTIGRAVITY\memory\MISSION_CONTINUITY.md`

That file documents:
- the stated perpetual mission
- the 60/30/10 split model
- the blockchain-based continuity philosophy
- the operator-death continuity intent
- major contract/wallet references

Use it as the narrative/mission layer.

Use the continuity runbook and memory files as the operational layer.

Canonical on-chain status:
- `C:\ANTIGRAVITY\briefings\PROTOCOL-OMEGA-ONCHAIN-STATUS.md`

Current verified split understanding:
- live verified Base split is still `GospelDonation.sol` at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- the live payout wallets currently verified are:
  - charity `60%` -> `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
  - infrastructure `30%` -> `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
  - founder ops `10%` -> `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`
- the repo contains an intended-next `DatingRevenueRouter` path, but that newer route was not verified live on Base in this session
- the `30%` bucket is the full mission infrastructure and AI operations treasury, not a vendor-only or founder-income bucket

## What To Put In A ChatGPT Project Folder

Recommended source files:
- this file
- `C:\ANTIGRAVITY\AGENTS.md`
- `C:\ANTIGRAVITY\briefings\CODEX-CONTINUITY-RUNBOOK.md`
- `C:\ANTIGRAVITY\memory\activeContext.md`
- `C:\ANTIGRAVITY\memory\decisions.md`
- `C:\ANTIGRAVITY\memory\sessionHandoff.md`
- `C:\ANTIGRAVITY\memory\MISSION_CONTINUITY.md`

Do not put secret values into the project folder.
Only include secret paths, recovery order, and operational rules.

## Non-Authoritative Sources — Do Not Use As Default Context

The following are backup, recovery, or legacy artifacts. They must **not** be used as authoritative context for coding, payments, governance, or deployment decisions unless explicitly invoked for recovery or forensic investigation:

| Path / Source | Why Non-Authoritative |
|---|---|
| `C:\OPUSONLY` | Retired sparse workspace; no git; memory files cleaned and stale |
| `E:\ANTIGRAVITY` | Legacy clone; behind `origin/main`; not the live runtime base |
| `OneDrive\Claude-Code-Backup\` | Backup copies; may be days behind main |
| `OneDrive\ANTIGRAVITY_BACKUPS\` | Continuity export snapshots; not live state |
| `.claude` project memory for non-live workspaces | Stale governance, stale wallets, stale assignments |
| Orphaned worktrees or archived briefings | Superseded; not synced to main |

**Rule:** If a memory, briefing, or config file did not come from `C:\ANTIGRAVITY` on `origin/main`, it is unverified for operational use.

## Current Caveats

- `E:\ANTIGRAVITY` still exists and should be treated as legacy only
- `CodeX\state\runtime\TASK-QUEUE-100.md` and `CodeX\state\runtime\codex-orchestrator-handoff.md` are generated runtime files and should remain out of tracked git paths
- `9020` and `T5500` still have unrelated local drift outside the reviewed automation slice
- `T5500` can still report `LIVE_OK=NO` on the e-waste live-ok audit even when the automation stack itself is functioning
- Local watcher and repo briefing hardening are committed, but live Cloudflare Pages header rollout may lag until the latest deploy finishes on public surfaces
- T5500 OpenClaw continuity assumes the newer profile/runtime flow; the old `gateway start --config <json>` path should be treated as retired
