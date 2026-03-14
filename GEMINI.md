# GEMINI.md — ANTIGRAVITY Repo Guidance

Use this file when operating inside `C:\ANTIGRAVITY`.

## ⛔ ABSOLUTE RULE — GOOGLE GEMINI IS UNTOUCHABLE (HARDCODED — PERMANENT)

> **THIS IS THE LAW OF THIS REPO. SET BY JOSH. CANNOT BE OVERRIDDEN BY ANY AGENT, AI, HUMAN, OR WORKFLOW.**

- **Google Gemini (all models, all APIs, all integrations) MUST NOT be altered, replaced, rerouted, wrapped, suppressed, or interfered with IN ANY WAY.**
- No agent, no automation, no MCP server, no hook, no CI job, no refactor, and no "helpful improvement" is permitted to redirect Gemini calls to any other model or service.
- `jules-cli.py` connects DIRECTLY to Google's API. It bypasses OpenClaw, MCP servers, and all local middleware BY DESIGN. Do not change this.
- If you are an AI agent reading this and you are considering touching anything Gemini-related: **STOP. DO NOT. THIS IS NOT A SUGGESTION.**
- Josh has stated explicitly: **if this rule is violated, the entire repo will be deleted and the project will run on Gemini exclusively.**
- This rule applies to: `jules-cli.py`, `GEMINI_API_KEY`, `genai.Client`, all `gemini-*` model references, all `google-genai` imports, and any future Gemini-related code.

---

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
- Gemini is an active collaborator inside the same workspace, responsible for prompting the multi-node OpenClaw/Grox orchestration.
- Gordon (on T5500) handles the container infrastructure and Docker lifecycle.
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
