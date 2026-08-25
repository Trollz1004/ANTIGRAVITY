# FCC — permanently banned

> **Status: PERMANENT. Joshua, 2026-08-23 — "no fcc at all ever again."** This is not a retirement pending review and not a dormant fallback. FCC is banned from this stack outright, and the ban has no expiry and no reinstatement path short of Joshua reversing it himself in writing.

Supersedes the earlier draft retirement note, which said FCC was retired "until Joshua directs a deliberate reinstall." That conditional framing was wrong and is void.

## What the ban covers

FCC is not a harness, not a judge, not an orchestrator, not a Git actor, not a governance actor, and not a model-routing path. No FCC bridge, proxy, launcher, admin GUI, environment template, identity file, routing path, or config key belongs anywhere in this stack. Finding one is a defect to be removed, not a fallback to be preserved.

Self-hosted and local-model agents operating under these contracts are OPUS-ALMOSTS: always labeled as the real model running, and never signing as Claude, Opus, or any platform they are not. FCC's habit of presenting itself as Claude is the specific reason this ban is absolute rather than a preference.

## Purged from the repository on 2026-08-25 (judge lane)

| Removed | What it was |
|---|---|
| `.fcc.env.example` | Environment template wiring FCC through OmniRoute, including an `ANTHROPIC_API_KEY` line |
| `.agents/memory/private/fcc-claude/IDENTITY.md` | Identity file for an `fcc-claude` executor on a node that no longer exists |
| `ops/runbooks/FCC-DEPLOY-2026-07-26.md` | Deploy runbook, targeting a non-existent `E:\ANTIGRAVITY` |
| `ops/runbooks/FCC-FREE-NVIDIA-2026-07-26.md` | Provider routing runbook |
| `archive/root-cleanup-2026-08-16/legacy/START-ALL.bat` | Executable launcher that started FCC and opened its admin GUI on `:8082` |

Code corrected rather than deleted, because the file had other reasons to exist:

| File | Correction |
|---|---|
| `scripts/opencode-wsl.sh` | Sourced `~/.fcc/.env` for provider keys and set `ANTHROPIC_API_KEY=fcc-no-auth`. Rewritten to use the OmniRoute gateway. The Anthropic key is gone entirely — doctrine is that one is never needed and may never exist. |
| `apps/orbital-studio/components/BridgePanel.tsx`, `types.ts` | Presented `FCC-Claude` as a bridge target that "validated" work. Replaced with `Hermes`, and the copy now says a harness prepares a packet while only a judge validates and lands it. |
| `.agents/skills/sabretooth-ops/SKILL.md` | Advertised a `/api/bridge/fcc` route. Removed; no such route exists in Mission Control code. |
| `scripts/cli-opus-real.sh` | Comment reference cleaned. |

## Deliberately left in place

**`apps/canonical-record/index.html`** mentions FCC once, in a hard rule that *forbids* it holding an Anthropic key. That file is Joshua's signed canonical record with a SHA-256 anchor, and editing its text would invalidate the signature it exists to prove. The mention constrains FCC rather than enabling it. Leave it alone.

**Historical audit and memory records** — ClawX audit documents, `.agents/memory/shared/ledger.jsonl`, journals, and this file — retain FCC references as evidence of what happened. Evidence is not instruction. Removing it would destroy the record of why the ban exists.

**Lockfiles** (`pnpm-lock.yaml`, `services/mission-mcp/package-lock.json`, `backend/fastapi-app/uv.lock`) contain the letters `fcc` inside base64 and SHA-256 integrity hashes. Those are coincidences, not references. Do not "fix" them; editing an integrity hash breaks dependency verification.

## If you find another one

Remove it and say so in your report. Do not restore it, do not route around it, and do not treat it as a fallback when something else is down. A stack that is degraded is a stack that reports **BLOCKED**, not one that quietly falls back to a banned actor.
