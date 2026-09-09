# S1 Doctrine Supersession — ACTIVE

> **Status:** LANDED by the judge lane under Joshua’s authority on 2026-08-19. This doctrine is ACTIVE. Runtime service launch remains a separate, deliberate, Joshua-authorized action.

## Canonical Reality

`C:\ANTIGRAVITY` is the **sole canonical working tree** for the repository on every current node. Do not use, repair, synchronize, or execute against archive paths, downloads, backups, exported chats, or retired topology claims. If any older file conflicts with this statement, that older statement is historical evidence only.

Joshua is the sole authority. Agents and harnesses execute assigned work, preserve evidence, and do not assign authority to themselves or to another agent.

## Read Order

Start with the active task, then read `CLAUDE.md`, the relevant current briefing, and the applicable harness contract. The synthesis at `briefings/CLAUDE-SYNTHESIS-AND-MANUS-FINALIZATION-2026-08-19.md` is the architecture reconciliation reference; it does not authorize bypassing this runtime gate.

Do not treat a historical document as current merely because it has a confident tone or a newer-looking date. Report conflicts as **STALE**, **UNVERIFIED**, or **BLOCKED** with the exact file and claim.

## Source Control Boundary

Work only from `C:\ANTIGRAVITY`. Every change must be scoped, tested, and evidenced. Never sweep-stage concurrent work. Never force-push.

Workers may prepare a branch, patch, bundle, or review artifact. **Only the judge lane may push, merge, or delete branches**, unless Joshua directly performs or explicitly authorizes that action. If the judge is unavailable, mark the lane **BLOCKED**; do not self-promote a draft into a landed change.

## Execution Boundary

Normal harness model access is through the authenticated OmniRoute OpenAI-compatible gateway. Self-hosted Ollama is an explicit fail-safe only, never the default route. Official-platform governance ballots use their designated platform bridge and must never be routed through OmniRoute.

Never route automation through a personal subscription lane. Never expose keys, token aliases, masked credential fragments, or populated environment files in source, commits, logs, artifacts, or chat.

## Runtime and Dashboard Boundary

Mission Control is the operational dashboard, and Mission Control is Paperclip: `paperclipai` on the Sabretooth node at `http://127.0.0.1:3100`, company `ANTIGRAVITY Marketing Co` (`ANT`). A running process, port, or HTTP status alone is not proof of the intended service: verify the expected identity response and report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

Paperclip is an active runtime and is the agent command layer: agents are hired, waked, heartbeated, and given their tool profiles there, and the judge lanes run inside it as CLI adapters. It does not hold Git delivery. The source-control wall above is unchanged — the judge lane is still the only lane that lands work — and Paperclip is only where a judge records that authorization: the documented path is a `JUDGE-PUSH <full-sha>` sentinel comment that the bridge relay executes as exactly that push (`ops/paperclip-ceo/JUDGE-AGENTS.md`). It is never a path for a worker to push.

The 2026-08-19 ruling — that there is no active Paperclip runtime, and that any revived one would be confined to marketing and business operations with no repository, agent-command, or Git authority — was **superseded by Joshua on 2026-08-25**. It is kept here as history, not as instruction.

Lane assignments and their time gates live in Paperclip. A run refused outside its permitted window is policy, not a fault; do not chase it as a red. Runtime state observed on 2026-08-25 — judge lanes, adapters, connectors, and which of them are genuinely broken — is recorded in `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`.

## Public Product Boundary

Customer-facing work is business-only. Keep private owner decisions, internal routing, governance mechanics, and non-product framing out of public product surfaces. Square remains the checkout integration unless Joshua changes it.

## Evidence Standard

Do not claim completion from an exit code, a status code, or a dashboard color alone. Cite the file, commit, sanitized audit, test output, or identity response actually observed. If a check was not run, say so plainly.

## Capability Baseline

Every agent and every harness — the FreeBuff orchestrator included — runs with the shared MCP servers and standing skills defined in `agent-contracts/CAPABILITY-BASELINE.md`. A worker loads its standing skills and confirms its tools answer with a real call before it starts task work; "configured" is not a confirmation. A harness that cannot reach the baseline reports **BLOCKED** rather than proceeding degraded. The orchestrator's job on any capability change is to hand each harness that file, have it wire its own runtime config, and collect a tested confirmation — never to grant itself authority or push the result.

Paperclip now also delivers this baseline to the lanes it runs, which changes where to look when a tool is missing rather than changing the rule. A tool connection installed company-wide reaches a run only through a tool-profile binding — an install with no binding is inert. A CLI lane additionally reads its own MCP config and speaks MCP itself, so Paperclip's broker and a lane's own tool set can disagree; verify the one you are actually calling through, with a real call.

## Standing Safety Rules

- Do not alter payments, public doctrine, governance rules, or launch gates without Joshua’s instruction and the required review lane.
- Do not create a second process merely because a known port is down; first verify what, if anything, is answering the expected identity probe.
- Do not alter another agent’s in-flight files without Joshua’s instruction.
- Keep the repository root free of scratch artifacts; use a designated temporary directory.
