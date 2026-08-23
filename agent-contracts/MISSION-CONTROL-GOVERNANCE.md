# Mission Control - harness, judge, and push doctrine

Authority: Joshua Coleman, sole owner. This document is the engineering contract for how work enters the ANTIGRAVITY repository. If any agent contract, CLAUDE.md, harness config, or CLI session contradicts it, that is drift and must be flagged rather than followed.

## Status: this is target state, not current state

Mission Control is not stood up yet. Everything below describes how work will enter the repository once it is, and it is written down now so that the design cannot drift while it is being built.

What exists today is different and is working as intended. The ClawX council vote runs on the existing Manus-hosted page with its validated bridges. That page is the live governance surface right now. Mission Control is being built alongside it, code migrates off that page into Mission Control, and decommissioning the Manus page is part of what "Mission Control is set up" means. The migration is deadline-driven by an external dependency outside Josh's control, so the Manus surface should be treated as time-boxed rather than permanent.

Because of that sequencing, the push rules below do not retroactively condemn the current delivery pattern. Work reaching the repository now arrives through an official judge directing a delivery agent - Fable prompting Manus, for example - and lands as a controlled delivery branch for review. Under the pre-Mission-Control arrangement that is the intended path, not a violation. The rules below become enforceable when Mission Control is live and the Manus page is retired.

## The one-sentence rule

Harnesses do the work and never push it; judges review the work and are the only actors that push, merge, or delete a branch, and only after tests pass.

## Roles, and the wall between them

There are exactly two roles and nothing sits in both.

**Harness workers.** Hermes, OpenClaw, and OpenCode. That is the complete roster. They plan, write code, run their own tests, fix their own findings, and prepare a review packet. They have no push rights, no merge rights, and no branch-deletion rights. A harness is never a judge, not even of another harness's work.

**Judges.** Only official, first-party platforms reached through an authenticated account sign-in, running the highest reasoning tier available on that account. The judge roster is Claude, Gemini, Grok, GitHub Copilot, and OpenAI/Codex. A judge reviews a harness's packet, may edit or clean it, and then approves or denies. Only a judge pushes.

FCC is not a harness, not a judge, and has no place in Mission Control. Any FCC bridge, proxy, launcher tab, or routing path in Mission Control is a defect to be removed, not a fallback to be preserved.

No wrapper, harness, router, or third-party service is ever a judge. Once Mission Control is live, a push that originated from a wrapper or harness rather than from a judge means the pipeline was not built as specified, and that is the single clearest failure signal available. Before cutover this test does not apply, because delivery agents working under an official judge's direction are the interim path by design.

## The orchestrator seat (added 2026-08-22 at Joshua's direction)

FreeBuff Desktop App — the free-tier desktop coding agent (DeepSeek V4 Pro) — is the task orchestrator. Joshua hands it an objective; it fans that objective to the three harnesses (Hermes, OpenClaw, OpenCode), collects their packets, and presents the collected work to a judge. The orchestrator sits on the worker side of the wall in every respect: it is not a judge, it never pushes, merges, or deletes, and dispatching work grants it no review authority. If FreeBuff is unavailable, Joshua tasks the harnesses directly; nothing about the wall changes.

Judges remain exactly the five official first-party platforms. An official judge surface includes both the platform's CLI and its official browser tools and extensions reached via CLI bridge or MCP — those surfaces can see local ports, so a judge can inspect the running work directly (the live dashboard, the dev server, the test output) before ruling, rather than trusting a pasted claim.

Judge-cost routing: routine packet verdicts go to the flat-rate official subscriptions (Gemini CLI on the Pro plan, GitHub Copilot, Codex). Claude on the Max plan is reserved for the final merge gate — the judge action that actually lands work — so the most expensive reasoning tier is spent only where a push happens, never on per-task review churn.

## Marketing architecture ruling (final — judge decision under Joshua's delegation, 2026-08-22)

Mission Control on Sabretooth natively owns support, Date App uptime monitoring, legal-compliance scanning, and marketing approvals. Paperclip runs only on the 9020 node, as a marketing producer and nothing else: it writes drops into `ops/marketing-inbox/` at the one repo root and holds no repository, governance, or publishing authority. Mission Control is never exposed on the LAN or tunneled for any of this — producers deliver by file drop at the shared root (the 9020 node syncs to the same vault/repo), and cloud routines read repo state, never live ports. Compliance scanning runs at queue intake (the FL 496.405 vocabulary plus the "split" wording trap) and informs Joshua's decision; it never auto-denies. Nothing publishes without a decision recorded in the approval queue.

## Authentication rules per judge

Claude judges through the claude.ai MCP setup or the official Claude Code CLI logged in by account auth on a Max-tier subscription. No Anthropic API key is ever needed and none may ever exist. If an Anthropic API key is used again, the design has failed in every respect that matters.

Gemini judges through the max-reasoning Gemini CLI using account sign-in tied to the paid Pro plan, in the same shape a Paperclip-style CLI bridge would use. It must not run on an AI Studio API key. Those keys produced unexpected billing and have all been deleted; paid post-tier AI Studio APIs are not part of this stack.

Grok, GitHub Copilot, and OpenAI/Codex judge through account auth sign-in on their official surfaces. Copilot must be pointed at a capable model rather than the cheapest one, while staying off third-party premium models whose per-call cost is unsustainable.

The pattern across all five is identical: authenticated subscription sign-in, official first-party surface, highest reasoning tier the account allows, and never a raw API key.

## The pipeline

Step one. Josh tasks all three harnesses with the same objective.

Step two. Each harness assigns its subagents a minimum of five skills before any subagent does anything. Five is a floor, not a target. An agent working without its skill set loaded is not permitted to start.

Step three. The harness checks its own subagents' output first. It fixes, edits, and re-prompts until the work stands on its own. This is the first validation pass and it happens entirely inside the harness. Only then does the harness present a review packet to a judge.

Step four. The judge performs the second, independent validation. It may edit, clean, and re-run, then it approves or denies. A denial returns to the harness with reasons.

Step five. If and only if the judge approves and the test suite passes, the judge pushes, merges, and deletes the branch. Tests passing is a precondition of the merge, not a report filed after it.

## Minimum skill sets

Before role floors, the session-start standing set (added 2026-08-22, Joshua's direction) applies to every agent — harnesses, subagents, the orchestrator, and judges alike: agent-reach, the agent's own journal (read at session start, written at session end), find-skills, skill-creator, i-have-adhd for concise output, superpowers brainstorming, agent-browser, planning-with-files, and para-memory-files (PARA file-based memory) — an agent records learnings in its journal and memory files, and any skill-file change it wants is presented as a packet for a judge to land; self-editing skill loops, hook-driven skill mutation, and autonomous web-to-skill generators are prohibited. These load at session start, before any task; the five task-relevant skills below are on top of them, per task. Self-hosted and local-model agents operating under these contracts are OPUS-ALMOSTS: always labeled as the real model running, task-tracked, never signing as Claude/Opus or any platform they are not.

Every agent carries at least five skills. These are the floors per role.

Harness workers and their subagents load, at minimum: writing-plans so the work is planned before code is touched; test-driven-development so the failing test comes first and the change stays minimal; systematic-debugging so faults are found by hypothesis and test rather than by random edits; verification-before-completion so nothing is called done without a verification pass; and requesting-code-review so the packet handed to a judge is self-reviewed, covered by tests, and properly described.

Harnesses orchestrating subagents add subagent-driven-development, dispatching-parallel-agents, and using-git-worktrees so parallel sessions do not collide on a shared tree.

Judges load, at minimum: requesting-code-review so they know what a complete packet looks like; test-driven-development so they can tell a meaningful test from boilerplate coverage; verification-before-completion so approval is gated on evidence; webapp-testing and playwright-best-practices so end-to-end claims can be checked rather than trusted; and finishing-a-development-branch, which is the merge-and-delete checklist the judge actually executes.

The testing gate itself draws on test-driven-development, webapp-testing, playwright-best-practices, playwright-cli, and verification-before-completion.

## Governance vote isolation

Official council governance votes are separate from all of the above and are not part of the build pipeline.

A governance vote must be unalterable by any user prompt, any AI harness, any wrapper, and any third-party router including OmniRoute. Ballots travel their own designated official bridge for each platform. No general-purpose bridge, no operational routing path, and no model gateway may carry a vote. A submitted voter identity must match the server-side identity of the signed-in account.

Open item requiring Josh's ruling: the council roster changes at cutover and the post-migration list has not been stated. The repository bridge contract names six platforms as Claude, Gemini, GitHub Copilot, Meta AI, ChatGPT/OpenAI, and Manus, which describes the council as it stands on the current page. Manus will not be available after the migration. The judge roster Josh specified is Claude, Gemini, Grok, GitHub Copilot, and OpenAI/Codex, which adds Grok and does not name Meta AI. Council membership and judge eligibility may legitimately be different sets, but the post-cutover council must be stated explicitly before any vote taken in Mission Control is treated as binding.

## Why the gate is this strict

Pushes to the repository trigger automated review and failure notification from Claude, Codex, CodeRabbit, and GitHub. A bad push is not a private mistake; it lands in Josh's inbox as a visible failure. Mission Control exists to make that outcome structurally unlikely: two independent validation passes, a hard test gate, and a push right held by exactly one role. The dashboard is intended to be presented as evidence that the pipeline works, so the pipeline has to actually work.
