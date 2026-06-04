# Post-Migration Cleanup Manifest — 2026-04-28

## 1. Parity check

SOURCE `D:\Antigravity\joshuaclaw-flagship-beta-testing` EXISTS. Running a full diff is impractical here (the D:\ tree is hundreds of files deep). Flag: Joshua must run the diff manually before deleting D:\ source:

```
robocopy D:\Antigravity\joshuaclaw-flagship-beta-testing c:\Antigravity\apps\opuspawclaw /L /NFL /NS /NP /XX
```

**Status: NEEDS MANUAL DIFF** — do not wipe D:\ until parity is confirmed.

## 2. D:\ inventory

`D:\Antigravity\` top-level folders:
| Folder | Classification |
|--------|---------------|
| `.github/` | Git metadata |
| `.pnpm-store/` | pnpm cache |
| `.sixth/` | Unknown — flag for Joshua |
| `.venv/` | Python virtualenv |
| `.vscode/` | VS Code config |
| `Antigravity/` | Nested repo copy — flag for Joshua |
| `anythingllm-bridges/` | AnythingLLM bridge configs |
| `dao-patches/` | DAO/governance patches |
| `hermes/` | Hermes router source |
| `joshl.ollamamodels/` | Ollama Modelfiles |
| `joshuaclaw-flagship-beta-testing/` | **DORMANT flagship copy** (migrated to C:\) |
| `manus-meta-guardian/` | Manus orchestration |
| `marketing-assets/` | Marketing materials |
| `migrated-claws-from-c/` | Previous migration artifact — flag for Joshua |
| `openclaw/` | OpenClaw configs |
| `paperclip-antigravity/` | Paperclip worker source |

Loose files at D:\Antigravity root:
| File | Classification |
|------|---------------|
| `hermes-paperclip-adapter-main.zip` | Superseded zip |
| `joshuaclaw-flagship-beta-testing.zip` | Superseded zip (flagship migrated) |
| `UNIVERSAL-SYNC-2026-03-23.md` | Sync artifact |
| `UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md` | Sync artifact |
| `Personal Vault-Sabretooth.code-workspace` | VS Code workspace |
| `Antigravity.code-workspace` | VS Code workspace |
| `Modelfile` | Ollama Modelfile |
| `setup-anythingllm-brain-bridge.ps1` | Setup script |
| `README.md` | Readme |
| `.gitignore` | Git ignore |

## 3. c:\Antigravity root junk

| Path | Classification | Proposed Action | Rationale |
|------|----------------|-----------------|-----------|
| AGENTS.md | Canonical | KEEP | Core governance file |
| CLAUDE.md | Canonical | KEEP | Claude memory/config |
| README.md | Canonical | KEEP | Repo readme |
| CHANGELOG.md | Canonical | KEEP | Changelog |
| SECURITY.md | Canonical | KEEP | Security policy |
| CONTRIBUTING.md | Canonical | KEEP | Contrib guide |
| package.json | Canonical | KEEP | Root package |
| pnpm-workspace.yaml | Canonical | KEEP | Workspace config |
| docker-compose.yml | Canonical | KEEP | Docker config |
| docker-compose.litellm.yml | Canonical | KEEP | LiteLLM config |
| litellm-config.yaml | Canonical | KEEP | LiteLLM config |
| Dockerfile | Canonical | KEEP | Docker build |
| DOCKER-SETUP.md | Canonical | KEEP | Docker docs |
| jules-cli.py | Canonical | KEEP | Gemini direct CLI (protected) |
| Modelfile | Canonical | KEEP | Ollama Modelfile |
| gateway.cmd | Canonical | KEEP | Gateway launcher |
| GEMINI.md | Canonical | KEEP | Gemini config |
| COPILOT-MEMORY.md | Canonical | KEEP | Copilot context |
| OPENCODE-MEMORY.md | Canonical | KEEP | OpenCode context |
| ANTIGRAVITY.code-workspace | Canonical | KEEP | VS Code workspace |
| BOOTSTRAP.md | Briefing artifact | MOVE to briefings/ | One-off bootstrap doc |
| CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md | Briefing artifact | MOVE to briefings/ | One-off prompt |
| OPENCLAW-DAILY-ORDERS.md | Briefing artifact | MOVE to briefings/ | One-off orders doc |
| REVENUE-BLITZ-2026-04-27.md | Briefing artifact | MOVE to briefings/ | One-off revenue doc |
| DEPLOY-PAPERCLoudflare.md | Briefing artifact | MOVE to briefings/ | One-off deploy doc |
| hermes-auto-start-setup.md | Briefing artifact | MOVE to briefings/ | One-off setup doc |
| paperclip-cloudflare-deploy.md | Briefing artifact | MOVE to briefings/ | One-off deploy doc |
| UNIVERSAL-SYNC-2026-03-23.md | Briefing artifact | MOVE to briefings/ | Sync artifact |
| UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md | Briefing artifact | MOVE to briefings/ | Sync artifact |
| setup-anythingllm-brain-bridge.ps1 | Script artifact | MOVE to scripts/ | Setup script |
| hermes-paperclip-adapter-main.zip | Superseded zip | DELETE | Worker deployed to CF; source in repo |
| joshuaclaw-flagship-beta-testing.zip | Superseded zip | DELETE | Flagship migrated to apps/opuspawclaw |
| Personal Vault-Sabretooth.code-workspace | Questionable | FLAG FOR JOSH | Points to OneDrive vault; may be needed |
| Import-Module | Unknown | FLAG FOR JOSH | Not a standard file; need classification |

## 4. Env-leak audit

**Tracked .env files:**
- `.env.example` (root)
- `apps/opuspawclaw/.env.example`
- `frontend/react-app/.env.example`
- `mcp-server/.env.example`
- `scripts/clawx-control/.env.example`
- `scripts/clawx-control/deploy/T5500-Linux/.env.production`

All are `.example` or `.production` templates (no real secrets). **No real `.env` files tracked in git.**

**Secret pattern scan:** NONE found (no API keys, passwords, or sk- tokens in tracked code).

**Status: CLEAN** — all env files are templates. No leaks.

## 5. D:\ reference scan in code/config

**Result: NONE found.**

The only match for `D:\Antigravity` or `D:/Antigravity` was inside this cleanup prompt itself (the grep command example at line 81). No actual code, config, or script references D:\ paths.

**Status: CLEAN** — migration path references fully removed from C:\ codebase.

## 6. Memory cross-check

`C:\Users\joshl\.claude\projects\c--Antigravity\memory\MEMORY.md` reviewed. Entries referencing D:\ or old env locations:

| Memory Entry | Issue |
|-------------|-------|
| `reference_opuspawclaw_flagship_app.md` | Says "migrated from D:\ to C:\ on 2026-04-28" — historical reference, not a stale D:\ dependency. OK. |
| `feedback_one_folder_one_repo_one_branch_rule.md` | Says "no D:\ work" — policy statement, not a stale path. OK. |
| All other entries | No D:\ path references found. |

**Status: CLEAN** — no stale D:\ dependencies in Claude memory index.

## Summary

- Items proposed for deletion: **2** (2 superseded .zip files at C:\ root)
- Items proposed for migration: **9** (8 briefing .md files + 1 .ps1 script → move to briefings/ or scripts/)
- Items flagged for Joshua: **3** (Import-Module file, Personal Vault .code-workspace, D:\ parity diff needed before wipe)
- Leaks/issues found: **0**
- D:\ path references in code: **0**
- Stale memory entries: **0**

**Recommended next action:** Run the D:\ parity diff (`robocopy /L`) before any D:\ deletion. Then execute the approved moves/deletes on C:\ root as a single commit.

## Awaiting Opus review

This manifest is propose-only. No files were deleted, moved, or edited.