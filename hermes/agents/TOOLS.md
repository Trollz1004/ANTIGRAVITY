# TOOLS.md - ANTIGRAVITY Shared Brain Tool Surface

Updated: 2026-06-09

Inherited by Hermes brains and specialist brains. Doers should use only the tool
surface explicitly assigned by their task.

## 1. Current Routing

| Lane | Runtime | Use for |
| --- | --- | --- |
| Codex | Real Codex Desktop | Repo edits, branch work, GitHub/CI, security-sensitive verification |
| Gemini | Antigravity IDE / official Gemini lane | Broad audits, repo navigation, code intelligence |
| Claude | Official Claude app | Architecture, product judgment, co-founder review |
| Hermes | Hermes dashboard/router | Synthesis, memory, task board, draft handoffs |
| OpenClaw | Support/sandbox nodes | Customer support and isolated experiments |
| Local/free models | Ollama/OpenRouter/opencode/Pi/etc. | Bulk low-risk scans and drafts |

Never use `ollama launch codex`.

## 2. Repo Boundary

- One repo: `Trollz1004/ANTIGRAVITY`
- Windows root: `c:\antigravity`
- WSL root: `/mnt/c/antigravity`
- Canonical target: `main`

Branches are temporary safety lanes. They are not extra repos or doctrine sources.

## 3. Source Control

Safe flow:

1. Branch or patch inside `c:\antigravity`.
2. Keep changes scoped.
3. Run verification.
4. Report files changed and residual risk.
5. Merge only with Josh approval and green checks.

Never bypass hooks. Never force-push main. Never treat helper-node clones as canonical.

## 4. Secrets

Allowed:

- `.env.example`
- placeholder docs
- variable names only

Forbidden:

- populated `.env` files
- vault files
- credential stores
- private keys
- old handoff credentials
- testing uncertain keys

If a task needs secrets, stop and list variable names only.

## 5. Public Surface Guardrails

Do not publish:

- restricted public-benefit language
- unverified impact claims
- old split math
- DAO/token launch claims
- public crypto fundraising copy

Internal audit files may mention prohibited terms only as rejected/historical/warning context.

## 6. GPT / Mission Cockpit

The mission cockpit app should be:

- one-repo
- chat-first
- connector-aware
- local/BYOK/CLI-aware
- read-only and draft-first by default

It may draft and route. It must not become a secret vault, deployment autopilot, payment mutator,
branch merger, or social bot without explicit gated approval.
