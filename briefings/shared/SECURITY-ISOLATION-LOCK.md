# SECURITY ISOLATION LOCK

> Cross-node security directive for sensitive operations.
> Last updated: 2026-03-05

---

## Purpose

Protect financial integrations, customer data paths, and operational control by enforcing strict environment isolation.

---

## Mandatory Rules

1. **One repo / one branch**
   - Repo: `Trollz1004/ANTIGRAVITY`
   - Branch: `main` only

2. **Sabretooth Codex isolation**
   - Codex runs in an isolated Docker terminal for sensitive operations.
   - Financial/MCP-sensitive work should be executed from that isolated Codex session.

3. **Drive ownership**
   - **E:\** is for Sabretooth operations (Codex + Gemini only).
   - **C:\** is the Claude primary workspace on nodes.
   - 9020 and T5500 Claude workflows remain on `C:\ANTIGRAVITY`.

4. **Marketing ownership**
   - Marketing production remains locked to **9020 Opus** only.
   - Sabretooth Codex does not run posting/content engines.

5. **Memory durability**
   - Keep memory sync active:
     - `memory/sync-memory.ps1`
     - `memory/KRAKKEN-SYNC.ps1`
   - Do not delete `C:\OPUSONLY\memory` unless migration is completed and verified.

6. **Secrets handling**
   - No secrets in git, chat logs, or briefings.
   - Store only in approved env/vault locations.

---

## Node Intent

- **Sabretooth (E:\ANTIGRAVITY)**: Codex task sentry, e-waste pipeline, vault/memory operations (isolated Docker workflow for sensitive actions).
- **9020 (C:\ANTIGRAVITY)**: Opus marketing production.
- **T5500 (C:\ANTIGRAVITY)**: Opus heavy compute/backend; may use Docker-isolated terminal for sensitive workloads.

---

## Verification Checklist

- `git fetch origin main`
- `git status --short --branch`
- `git rev-parse --short HEAD`
- Confirm node role boundaries are unchanged.
- Confirm memory sync scripts are present and usable.
