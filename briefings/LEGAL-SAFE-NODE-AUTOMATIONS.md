# Legal-Safe Node Automations

Updated: 2026-03-07

## Operating Rule

CodeX nodes do not live-post to third-party social networks.

The nodes are allowed to:
- generate draft packs
- generate handoff queues
- generate owned-site content queues
- generate revenue support packs
- generate compliance, drift, and audit reports

The nodes are not allowed to:
- auto-post to X
- auto-post to Facebook
- auto-post to Reddit
- auto-post to LinkedIn
- auto-post to any other third-party social platform from the legacy browser daemon

## Human-Gated Ownership

- X: Perplexity with Josh supervising
- Facebook: Perplexity with Josh supervising
- Reddit: Devvit, Opus, or Perplexity
- LinkedIn: draft-only until a separately reviewed official API path is approved

## Safe Node Profiles

### 9020

Role: content factory

Installed task:
- `CodeX-9020-Safe-Drafts`

What it does:
- runs `scripts/Run-Safe-NodeAutomation.ps1 -Profile 9020-content`
- writes draft packs and handoff queues to `CodeX/state/marketing`
- does not open browsers or publish directly

### T5500

Role: compliance and revenue support

Installed tasks:
- `CodeX-T5500-Safe-Marketing-Audit`
- `CodeX-T5500-Revenue-Pack`

What they do:
- publish the latest policy audit and queue summary
- build the local OnlineRecycle marketing pack
- keep outputs local under `CodeX/state/marketing` or `data/local/onlinerecycle-worker`

### Sabretooth

Role: control plane

Optional task:
- `CodeX-SABRETOOTH-Safe-Control`

What it does:
- refreshes the control-plane summary pack for review

## Compatibility Shims

These files remain in place only so old shortcuts and tasks fail safe:
- `scripts/social-engine-24x7.py`
- `scripts/daemon-start.py`
- `scripts/daemon-login.py`
- `scripts/social-engine-boot.bat`
- `scripts/social-engine-login.bat`
- `scripts/opus-marketing-watchdog.ps1`
- `scripts/register-watchdog-task.ps1`

They no longer represent an approved live-posting path.

## Install

Run on each node locally:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile 9020
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile t5500
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile sabretooth
```

## Outputs

Primary output directory:
- `CodeX/state/marketing`

Expected files:
- `safe-node-marketing-pack-latest.md`
- `safe-automation-audit-latest.md`
- `perplexity-handoff-latest.md`
- `reddit-devvit-handoff-latest.md`
- `linkedin-drafts-latest.md`
- `owned-content-queue-latest.md`
- `safe-node-marketing-manifest-latest.json`
