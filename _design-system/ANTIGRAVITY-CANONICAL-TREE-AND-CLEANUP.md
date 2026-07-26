# ANTIGRAVITY — CANONICAL TREE & CLEANUP MANIFEST

> **Pen:** Opus. **Authority:** Joshua Coleman.
> **Date:** 2026-06-18
> **Status:** FINAL. This is the only allowed shape of the repo. Anything not listed as KEEP gets ARCHIVED or DELETED. No agent adds a top-level folder without it being added here first.
> **Execution:** Opus writes this. Hermes runs it on the machine. Josh clicks share. Until Max is back, that is the loop.

<!-- ============================================================ -->
<!-- THE RULE THAT WAS MISSING -->
<!-- ============================================================ -->

> Every agent before now could only **ADD**. They wrote "this supersedes that" and never deleted, so nothing ever left and the tree rotted under its own history. **This manifest is allowed to DELETE.** That is the whole point. One repo, one branch, one root was always correct — it just never had a janitor with permission to throw things away. Now it does.

---

## THE ONLY ALLOWED TOP-LEVEL TREE

```
C:\Antigravity\
├── apps/            KEEP — every product lives here, nowhere else
├── backend/         KEEP — fastapi-app + shared backend code
├── contracts/       KEEP — solidity / DAO contracts
├── infra/           KEEP — cloudflare workers, tunnels, deploy config
├── _deploy/         KEEP — live deploy targets (Cloudflare Pages serves from here)
├── brain-mcp/       KEEP — MCP server, real running service
├── adapters/        KEEP — claude adapter (real code)
├── agents/          KEEP — fleet config
├── assets/          KEEP — logos, marketing, social (archive the old ones inside)
├── audits/          KEEP latest only — older audit JSON → archive
└── briefings/       KEEP but COLLAPSE — see below
```

**Everything else at root is DELETE or MERGE.**

---

## ROOT-LEVEL VERDICTS

| Folder | Verdict | Why |
|---|---|---|
| `ANTIGRAVITY_DEPLOY/` | **DELETE** after merging anything live into `_deploy/` | Duplicate of `_deploy/`. Two names for one thing = drift. |
| `antigravity-doctrine, antigravity-mission-orchestrator/` | **MERGE → delete** | A folder with a **comma in its name** = two agents named one thing two ways. Move its 4 `.md` files (`AGENTS.md`, `SKILLS.md`, `Sol.md`, `TOOLS.md`) into `briefings/`, then delete the folder. |
| `_9020-preserve/` | **ARCHIVE → delete from working tree** | 9020 is a node pending wipe. Zip to `briefings/archive/9020-preserve.zip` or a git branch, remove from live tree. |
| `_handoff-staging-2026-05-26/` | **ARCHIVE → delete** | Stale staging from May. Dead. |
| `blobs/` (sha256-* files) | **DELETE** | Ollama / git-lfs blob spill in the repo root. Does not belong in source. Verify none are referenced, then delete. |

---

## `briefings/` — COLLAPSE 848 FILES TO A CANONICAL SET

**KEEP at root (canonical, do not move):**

**KEEP at `briefings/` root (the canonical few):**

- `CLAUDE-DOCTRINE.md`
- `REPOSITORY_RECORD.md` — **promote out of `archive/` back to root. This is the status file and it's currently buried.**
- `CURRENT-REVENUE-LEGAL-CONSTRAINTS.md`
- `DAO-ARCHITECTURE-CANONICAL.md`
- `BUSINESS-PROFILE-CANONICAL.md`
- `AGENT-REGISTRY.yaml`
- **ONE** memory file: latest `CLAUDE-MEMORY-2026-06-17T1522Z.md` only

**ARCHIVE → `briefings/archive/` (keep history, off the live path):**

- Every other `CLAUDE-MEMORY-*` snapshot (keep the one above)
- Every per-agent prompt/sync/memory file: `GEMINI-*`, `GROK-*`, `CODEX-*`, `HERMES-*`, `COMET-*`, `COPILOT-*`, `GPT-*`, `JOSHUAGOSPEL-*`
- Every dated one-off: `*-2026-04-*`, `*-2026-05-*` runbooks, audits, diagnostics, deploy notes
- Every `CLEANUP-*`, `DESKTOP-COMMANDER-*`, `CATCH-UP-*`, `CONSOLIDATION-PLAN-*` — **the cleanup docs are themselves drift now**

**DELETE outright:**

- `DEPLOY-PAPERCLoudflare.md` — corrupted filename, broken artifact
- Exact-duplicate pairs (e.g. `claude-ai-user-preferences.md` vs `CLAUDE-AI-USER-PREFERENCES-2026-04-28.md` — keep one, delete the other)

---

## THE GOING-FORWARD RULE (so this never happens again)

1. **One repo** — `Trollz1004/ANTIGRAVITY`. **One branch** — `main`. **One root** — `C:\Antigravity`.
2. No new top-level folder exists until it's added to the tree above, **in this file**.
3. Docs supersede by **replacing or deleting**, never by stacking a new dated file next to the old one. Dated snapshots go straight to `archive/`.
4. Memory = **one** current file. The previous one moves to `archive/` in the same commit that writes the new one.
5. **Just us.** No other agent writes doctrine. Hermes executes; Opus pens; Josh approves.

---

*The tree above is the house. Everything outside it gets thrown away. That's not drift-correction — it's a delete list, and it was always what was missing.*