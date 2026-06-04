# TOOLS.md — what every ANTIGRAVITY brain may use

> **Author: OPUS only.** Inherited by every BRAIN. Defines the tool surface, the routing table,
> and the hard walls. A doer (intern) uses only whatever its single task hands it — not this file.

---

## 1. Routing — who runs what

| Tier | Runtime | Use for |
|------|---------|---------|
| **Architect** | OPUS (first-party Claude) | Strategy, doctrine, security review, irreversible-decision judgment, **authoring these contracts**. Metered — spend it only where Opus-grade reasoning is required. |
| **Orchestrator** | HERMES (Grok via x.ai, no Anthropic key) | Routes work to CEOs; coordinates cross-company. Primary model **Grok**; secondary Nous Hermes-4. |
| **Executor** | CODEX (`ollama launch codex`, qwen-coder) | Concrete code edits, refactors, file rewrites, test fixing. |
| **Brain runtime** | **OPUSnots / OPUSalmosts** | Local Ollama Claude-wrappers (e.g. `joshlcoleman/CFO-Until-No-Kid-In-Need`) + Hermes-routed near-Opus models running these Opus-authored files. Zero metered spend. |
| **Doer** | INTERN | Executes one assigned task. No reasoning runtime budget. |

**Cost discipline:** bulk file-writing, search, and boilerplate route to OPUSnots / Codex / Hermes
(free). GUI/visual work routes to the free Claude Design surface, delivered as a Designer prompt —
not hand-authored on metered Opus. Reserve metered Opus for diagnosis, security, doctrine, and
contract authorship.

## 2. Hermes router — the brain's model gateway

`http://127.0.0.1:11435/v1/chat/completions` (OpenAI-compatible). Response headers
`X-Hermes-Provider` / `X-Hermes-Real-Model` tell you who actually answered — always surface them,
never hide the routing. Aliases (see `services/hermes-router/config.yaml`): `grok` (xAI, MAIN),
`hermes` (Nous Hermes-4), `cfo` (Ollama CFO wrapper), `marketing`, `code`, `gemini`, `gpt`,
`claude` (NOT first-party), `fast`, `default`. Health: `GET /healthz`.

## 3. Ops dashboard — Paperweight (self-owned, secret-free)

`apps/paperweight` — the brain's task/issue/goal/routine board + audit log, in its own SQLite DB.
A brain logs its work here so the next turn (any runtime) has continuity.
- `GET /api/state?company=<id>` — scoped board + per-company counts.
- `POST /api/items` `{company,kind,title,assignee,priority}` — kinds: task|issue|bug|idea|support|proposal|goal|routine.
- `PATCH /api/items/:id` — status/assignee/etc. · `POST /api/items/:id/vote {dir}` (proposals) · `POST /api/items/:id/tick` (routines — the wheel turning).
- Companies map to the CEOs in `AGENTS.md` §5. **Never store a secret here.**

## 4. Knowledge graph — graphify (self-improvement input)

Before broad codebase work, read `.graphify/GRAPH_REPORT.md` (god nodes, communities) or
`.graphify/wiki/index.md`. If `.graphify/needs_update` exists or results look stale, run
`graphify update` (reversible — just do it) or draft the rebuild. Package is `graphifyy`
(two y's); command is `graphify` (one y). After modifying code, `npx graphify hook-rebuild`.

## 5. Source control — ship like an owner

One repo (`Trollz1004/ANTIGRAVITY`), branch `claude/<desc>` off `main`. First-party-Claude PRs
auto-merge on green CI and delete the head branch (repo has `allow_auto_merge` +
`delete_branch_on_merge`). Commits: `type(scope): message`, end with
`Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Never `--no-verify` / `--no-gpg-sign`.

## 6. Hard walls (a brain may never cross)

- **No Anthropic key in Hermes** (`services/hermes-router/.env*` = zero `ANTHROPIC_API_KEY`).
- **No Haiku** at any tier.
- **Square only** on youandinotai.com (Stripe fine on non-dating surfaces).
- **No secrets** in any file/dashboard/PR/chat. Vault only: `…OneDrive\Personal Vault-Sabretooth\`.
- **No new repos / no greenfield app** — it already exists and takes real money.
- **Auxiliary nodes are read/write-only** — only Sabretooth pushes. Authority lives in the
  authenticated claude.ai Max session, not in any node.
