# Paperclip Control Plane Doctrine

**Status:** Authoritative  
**Repo:** `Trollz1004/ANTIGRAVITY` on `main`  
**Paperclip HQ:** `http://127.0.0.1:3110` (Sabretooth)  
**Public exposure:** Port Warp  
**Date:** 2026-07-01

---

## Core Principle

**Paperclip is the single execution and audit plane for ANTIGRAVITY.**

Every action that can run through Paperclip, does. Every action that runs through Paperclip is logged, time-stamped, and attributed. Claude, Hermes, Grok, Cursor, Codex, Gemini, and any other assistant are tools the CEO runtime delegates to; the canonical record of what happened lives in Paperclip and the repo.

---

## Identity Mapping

| Runtime | Paperclip Role | Repo Folder | Authority |
|---|---|---|---|
| Hermes Agent | **CEO runtime** | `paperclip/agents/hermes/` + `paperclip/agents/ceo/` | Joshua Coleman (`Trollz1004`) |
| Paperclip server | **HQ dashboard / control plane** | `C:\antigravity` = `Trollz1004/ANTIGRAVITY` | Joshua Coleman |
| Claude / Opus | Executive coding peer | Delegated by CEO runtime | Joshua Coleman |
| Grok | Cost-destruction brain / research | Delegated by CEO runtime | Joshua Coleman |
| Cursor / Codex / Gemini | Coding specialists | Delegated by CTO via CEO | Joshua Coleman |
| CFO / CMO / CTO / Mission Guardian | Division agents | `paperclip/agents/{cfo,cmo,cto,mission-guardian}/` | CEO routes to them |

---

## Execution Rules

1. **Paperclip-first operations.** If a task can be created, tracked, or executed inside the Paperclip UI (`http://127.0.0.1:3110`), it happens there first. The repo mirrors the result.
2. **Repo remains source-of-truth.** Files, code, and doctrine live in `Trollz1004/ANTIGRAVITY` on `main`. Paperclip operates on top of the repo, never beside it.
3. **All delegations are logged.** When the CEO runtime assigns work to CFO/CMO/CTO/Mission Guardian or to an external assistant, the assignment is recorded as a Paperclip issue/task/heartbeat.
4. **No shadow work.** Work done outside Paperclip must be imported into Paperclip within the same session (via issues, heartbeat logs, or commit messages).
5. **Time-stamped audit trail.** The watchdog log at `logs/paperclip-watchdog.log`, the Paperclip server logs, and Git history together form the canonical audit trail.

---

## Drift Prevention

Paperclip HQ enforces the 1-repo / 1-branch / 1-root rule:

- No second repo for ANTIGRAVITY work.
- No long-lived branches.
- No new root-level directories without CEO + Joshua Coleman approval.
- All external project folders (Grok production, OneDrive extractions, etc.) are either archived as read-only briefings or deleted after explicit approval.

---

## Operational Checklist

### Every session start

1. Confirm `http://127.0.0.1:3110/api/health` returns `ok`.
2. Confirm working tree is on `main` and clean.
3. Read `paperclip/agents/ceo/AGENTS.md` and `paperclip/agents/hermes/AGENTS.md`.
4. Read `SOL.md` and `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md`.

### Before any non-trivial action

1. Create or update the corresponding Paperclip issue/task.
2. Route through the CEO delegation map.
3. Record the decision and outcome in the repo (commit message, STATE.md, or briefing).

### After any external assistant work

1. Summarize what was done.
2. Record it in Paperclip (issue comment, task log, or heartbeat).
3. Commit the artifact to `main` if it changed the repo.

---

## Useful Patterns Extracted from Grok Production Stack

The folder `C:\Users\joshl\OneDrive\DREAM-ONLINE-MMORPG\ai-marketplace-grok-production-main` contains patterns worth adopting under SOL doctrine:

1. **Cost-destruction model** — route high-volume/simple tasks to free/cheap models; reserve premium reasoning for high-value decisions. Already aligned with Hermes smart routing.
2. **Webhook-driven ledger** — Stripe/Square payment success → revenue source metadata → internal 10% kids allocation. Reject the public charity/split framing; keep the allocation internal.
3. **Swarm kanban via Hermes/Paperclip** — track multi-step tasks visually inside the Paperclip UI. Paperclip issues and routines are the canonical kanban.
4. **Multi-channel comms** — Discord/Telegram channels per domain. CMO owns customer-facing channels; CTO/Hermes own ops alerts.
5. **Self-hosted service stack** — Postgres, Redis, Qdrant, Nginx, Grafana. Only adopt if it survives the superior-to-existing test vs. current ANTIGRAVITY architecture.

**Doctrine filter:** Strip all "charity bucket", "10% to Shriners", and "tax-visible labeling" language from public copy. Preserve the internal 10% allocation rule per `SOL.md` §3.3.

---

**Paperclip runs everything. The repo owns the truth. The CEO runtime (Hermes) makes it happen under Joshua Coleman’s authority.**
