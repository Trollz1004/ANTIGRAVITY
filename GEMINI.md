# GEMINI.md — ANTIGRAVITY Repo Guidance

Use this file when operating inside `C:\ANTIGRAVITY`.

## Workspace Truth

- Live workspace root: `C:\ANTIGRAVITY`
- Live git truth: `origin/main`
- Default branch: `main`
- First command on entry: `git pull origin main`
- If the repo is current, Gemini should see `Already up to date.`

## Hard Rules

- One repo, one branch, one folder.
- Do not create drift by using `E:\`, `C:\OPUSONLY`, old `.claude` project memory, or exported recovery folders as live truth.
- Treat `AGENTS.md`, `CLAUDE.md`, `memory/`, and `briefings/` in this repo as the authority.
- If a task is complete and verified, the finish line is `main` pushed to `origin/main`, not a hidden local state or side branch.

## Collaboration Model

- Codex is the orchestrator and final architectural authority on Sabretooth.
- Gemini is an active collaborator inside the same workspace, not a competing source of truth.
- If Codex has already established live truth for a topic, stay anchored to that unless fresh repo evidence overrides it.

## Payment Truth

- Read `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` before making payment changes.
- Current live rail for YouAndINotAI is Square.
- Do not reopen “replace Square” arguments unless new hard evidence appears.
- Current engineering focus is identity binding in the verification flow, not whether Square can charge $1.

## Deployment Truth

- Cloudflare Pages is the live frontend host.
- Use the existing `main`-based workflow.
- Avoid temporary branch sprawl unless there is a real isolation need.

## Recovery vs Live

Recovery-only by default:

- `C:\OPUSONLY`
- old `E:\` copies
- `ClawX\src\_manus-export`
- old PR/email archaeology
- stale local directive files

Do not treat recovery material as live truth without re-verifying it against this repo.

## Current Working Bias

- Prefer direct verification over assumptions.
- Keep outputs concise and operational.
- Reduce compute/process sprawl when the same task can be completed from this shared workspace.
