# OPENCODE Harness Contract — Post-Reinstall Draft

> **Status:** Draft only. It applies after judge-lane landing; it does not start a runtime or grant independent authority.

## Workspace and Identity

OpenCode runs under the `joshi` profile and works only in `C:\ANTIGRAVITY`. Read this contract, `CLAUDE.md`, and the assigned task before acting. Historical profile paths, archive roots, and dead endpoint notes are non-executable.

## Skills and Journal Preflight

At session start, read `.agents/journals/opencode/STATE.md`, load the task-relevant skills, and only then plan or assign a subagent. Follow `agent-contracts/JOURNAL-PROTOCOL.md`: `i-have-adhd` is concise, action-first, token-saving output discipline—not a diagnosis. Use Superpowers brainstorming for feature design, Agent-Reach for research, browser-use with approved cookie sync for authenticated browser work, find-skills before hand-rolling, TDD for code changes, and systematic debugging for any failure.

At session end, write the task, skills loaded, evidence, blocker, and one next action back to `.agents/journals/opencode/STATE.md`. Then post one line to the shared node ledger so every agent on every node knows what you did and where: `BUZZ_AGENT_NAME=opencode ops/buzz/ledger.sh "<what landed> · <path> · <evidence>"` — and read `ops/buzz/ledger-tail.sh 30` at session start, right after your STATE.md. Rule and setup: `ops/buzz/BUZZ-NODE-LEDGER.md`. Never a secret in a ledger line.

## Model Access

All normal model access goes through the authenticated OmniRoute OpenAI-compatible gateway. Select the configured cloud route appropriate to the assigned work. Ollama is an explicit fail-safe only. Do not substitute a direct provider API, a personal subscription lane, or an undocumented local gateway.

Official-platform governance ballots use designated official bridges and are not routed through OmniRoute.

## Repository Boundary

Prepare a scoped branch, patch, or bundle. Stage only files you changed. Never force-push. OpenCode does not push, merge, or delete branches; the judge lane performs those steps unless Joshua directly authorizes an exception.

## Verification and Reporting

Verify content and identity, not merely command or HTTP status. Record **VERIFIED**, **UNVERIFIED**, or **BLOCKED** with changed paths, exact test/build evidence, and a bounded next action. Do not reveal populated environment files, tokens, secret aliases, or private credential-bearing URLs.

## Protected Files (ruled 2026-09-17)

Only official Claude, reached through `drift` on the Sabretooth node, edits `scripts/fables-house/**`, `scripts/drift.cmd`, `ops/runbook/**`, `ops/skills/sabretooth-node/**`, `docs/PAYMENTS-TRUTH.md`, `docs/NODE-STATE-*.md`, `.github/**`, and the drop box `C:\Users\joshi\OneDrive\claude-to-claude\`. OpenCode never edits these paths and never pushes, merges, or deletes a branch. Landing on `main` goes through a `judge/*` branch and the quality-gate workflow (`.github/workflows/quality-gate.yml`), which `auto-land.yml` fast-forwards on green.


## Date App FROZEN and FOR SALE (ruling 2026-09-16)

youandinotai.com is frozen and listed for sale as of 2026-09-16. The asset is the name pair (youandinotai.com + youandinotai.online, "You and I, not AI"); the app is a bonus in the lot. No new features, no growth engine runs, no digests, no campaigns, no experiments, no audits. Keep the site up and the checkout untouched until the sale closes. Listing copy and outreach note: `ops/sale/YOUANDINOTAI-SALE-LISTING.md`. Joshua's time goes to DREAM Online and the AI Solutions business; YouTube automation stays on the Hermes lane. Any lane that touches the date app beyond keeping it up must cite this section and a direct instruction from Joshua.
