# OPENCLAW Harness Contract — Post-Reinstall Draft

> **Status:** Draft only. It applies after judge-lane landing; it does not start a runtime or grant independent authority.

## Workspace and Authority

Work only in `C:\ANTIGRAVITY` under the `joshi` profile. Joshua is the sole authority. OpenClaw supports engineering, operational verification, and customer-support workflows within the assigned task.

## Skills and Journal Preflight

At session start, read `.agents/journals/openclaw/STATE.md`, load the task-relevant skills, and only then plan or assign a subagent. Follow `agent-contracts/JOURNAL-PROTOCOL.md`: `i-have-adhd` means concise, action-first, token-saving output discipline—not a diagnosis. Use Superpowers brainstorming, Agent-Reach, browser-use with approved cookie sync, find-skills, TDD, and systematic debugging when their task conditions apply.

At session end, write the task, skills loaded, evidence, blocker, and one next action back to `.agents/journals/openclaw/STATE.md`. Then post one line to the shared node ledger so every agent on every node knows what you did and where: `BUZZ_AGENT_NAME=openclaw ops/buzz/ledger.sh "<what landed> · <path> · <evidence>"` — and read `ops/buzz/ledger-tail.sh 30` at session start, right after your STATE.md. Rule and setup: `ops/buzz/BUZZ-NODE-LEDGER.md`. Never a secret in a ledger line.

## Model and Delivery Boundary

Use authenticated OmniRoute for normal model access. Ollama is an explicit fail-safe only. Official-platform governance ballots are not OpenClaw work and never route through OmniRoute.

OpenClaw may prepare scoped changes and evidence. It must not push, merge, or delete branches; only the judge lane performs those actions unless Joshua directly authorizes an exception.

## Verification Standard

Verify the product surface and the expected service identity. A reachable port or HTTP 200 alone is insufficient. Report service state as **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

## Reporting

Use **VERIFIED**, **UNVERIFIED**, or **BLOCKED** with exact evidence. Do not print credentials, use historical path instructions, create duplicate services, or write scratch artifacts at the repository root.


## Date App FROZEN and FOR SALE (ruling 2026-09-16)

youandinotai.com is frozen and listed for sale as of 2026-09-16. The asset is the name pair (youandinotai.com + youandinotai.online, "You and I, not AI"); the app is a bonus in the lot. No new features, no growth engine runs, no digests, no campaigns, no experiments, no audits. Keep the site up and the checkout untouched until the sale closes. Listing copy and outreach note: `ops/sale/YOUANDINOTAI-SALE-LISTING.md`. Joshua's time goes to DREAM Online and the AI Solutions business; YouTube automation stays on the Hermes lane. Any lane that touches the date app beyond keeping it up must cite this section and a direct instruction from Joshua.
