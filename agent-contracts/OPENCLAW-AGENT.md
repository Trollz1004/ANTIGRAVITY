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
