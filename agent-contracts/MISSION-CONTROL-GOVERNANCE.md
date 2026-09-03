# Mission Control - harness, judge, and push doctrine

Authority: Joshua Coleman, sole owner. This document is the engineering contract for how work enters the ANTIGRAVITY repository. If any agent contract, CLAUDE.md, harness config, or CLI session contradicts it, that is drift and must be flagged rather than followed.

## Status: Mission Control is live

Mission Control is stood up, and Paperclip is it. Paperclip runs on the Sabretooth node - `paperclipai@2026.824.0` at `http://127.0.0.1:3100`, company `ANTIGRAVITY Marketing Co` (`ANT`). Joshua made that designation. It supersedes the "this is target state, not current state" framing this section carried through 2026-08-23, and it supersedes every earlier statement that Paperclip is a producer feeding Mission Control rather than being Mission Control. The push rules below are enforceable now, not aspirational.

Sabretooth is the only node. `C:\ANTIGRAVITY` is the sole canonical working tree. There is no 9020 node, no T5500, no remote node, and no E: drive anywhere in this topology; text asserting otherwise is stale evidence, not instruction.

What is actually wired, what was repaired, and which two connectors remain blocked were observed against the running instance on 2026-08-25 by the Claude judge lane and are recorded in `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`. Read that packet before making any claim about the state of a connector or a judge lane. Do not restate its numbers here; they go stale and it does not.

The council governance surface is the one piece that did not move with the cutover. The ClawX council vote still runs on the Manus-hosted page with its validated bridges, that migration is deadline-driven by an external dependency outside Josh's control, and the post-cutover council roster is still the open item recorded under "Governance vote isolation" below. Mission Control going live does not resolve it. The pre-cutover delivery pattern - an official judge directing a delivery agent, Fable prompting Manus, landing a controlled delivery branch - is retired as the build path as of 2026-08-25 and is recorded here as history, not as a fallback.

## The one-sentence rule

Harnesses do the work and never push it; judges review the work and are the only actors that push, merge, or delete a branch, and only after tests pass.

## Roles, and the wall between them

There are exactly two roles and no seat sits in both. **Updated 2026-09-03: Grok no longer holds a judge seat.** It owns the X.com build lane only (grok.com path) and does not review or push. (History: before 2026-09-03, Grok held both a judge seat and the X.com build lane as distinct seats.)

**Harness workers.** Hermes, OpenClaw, and OpenCode. That is the complete harness roster. They plan, write code, run their own tests, fix their own findings, and prepare a review packet. They have no push rights, no merge rights, and no branch-deletion rights. A harness is never a judge, not even of another harness's work. Since 2026-08-25 the harnesses are no longer the whole build side - the CEO seat and the Grok X.com seat also build, under exactly those restrictions.

Each harness now holds a standing lane under Mission Control rather than waiting on a shared fan-out. Hermes owns YouTube automation. OpenClaw owns marketing. OpenCode owns eBay and recycling automation. X.com is Grok-only and goes through the grok.com native path, never the X Developer API.

**No lane is time-gated.** An earlier version of this document said OpenCode was restricted to 08:00-18:00 America/New_York and that a refusal outside that window was "policy working". That was wrong. Joshua never set a working-hours rule. The `403 Access denied outside allowed hours` seen on the board came from an OmniRoute `accessSchedule` toggle on an API key — a gateway setting, observed once in a journal and then mistakenly promoted into governance. No such schedule exists in OmniRoute storage as of 2026-08-25. If the error reappears, clear the schedule on the key and treat the lane as available; never restate it as doctrine.

**Judges.** Only official, first-party platforms reached through an authenticated account sign-in, running the highest reasoning tier available on that account. **As of 2026-09-03 the judge roster is Claude and OpenAI/Codex only.** Grok and GitHub Copilot were removed from the roster that date — Grok keeps the X.com build lane, not a review seat; Copilot no longer reviews or pushes at all. Gemini was dropped from the roster on 2026-08-25 at Joshua's direction; the reason is recorded below. A judge reviews a harness's packet, may edit or clean it, and then approves or denies. Only a judge pushes. (History: the 2026-08-25 roster was Claude, Grok, GitHub Copilot, and OpenAI/Codex — four lanes. That is superseded.)

Native CLI lanes wired on the Paperclip board historically included Claude, Codex, Grok, and Gemini, each running its own official CLI rather than a gateway. Only the Claude lane has been observed end to end: it runs under account auth with `cwd` set to `C:\ANTIGRAVITY`, which is why it loads the repository's skills directly. A lane being wired into Paperclip changes nothing about the wall: the lane is the judge's surface, not a delegation of judgement to Paperclip. A wired CLI lane is not itself proof of judge status — judge status is the 2026-09-03 roster above, Claude and Codex only.

FCC is not a harness, not a judge, and has no place in Mission Control. It is permanently purged and must never be reintroduced. Any FCC bridge, proxy, launcher tab, or routing path found anywhere in this stack is a defect to be removed, not a fallback to be preserved.

No wrapper, harness, router, or third-party service is ever a judge. Mission Control is live, so this test applies now: a push that originated from a wrapper, a harness, or Paperclip itself rather than from a judge means the pipeline was not built as specified, and that is the single clearest failure signal available. The pre-cutover carve-out for delivery agents working under an official judge's direction expired on 2026-08-25.

## The orchestrator seat (added 2026-08-22; reassigned 2026-08-25 at Joshua's direction)

Paperclip is the orchestrator, because Paperclip is Mission Control. Work is dispatched as board issues against agents on `ANTIGRAVITY Marketing Co`, and the board — not a chat transcript — is the record of what was asked, who took it, and what came back.

**Superseded 2026-08-22 ruling, kept for history:** FreeBuff Desktop App was the task orchestrator, fanning an objective from Joshua to the three harnesses and collecting their packets. FreeBuff is no longer a separate orchestrator sitting outside the board. It is Buffy, the CEO agent on the Paperclip board, joined through the repo-private `freebuff_local` adapter at `ops/paperclip-ceo/adapter-freebuff`, and it takes and completes board work like any other agent.

That reassignment does not move the wall. Paperclip and the CEO seat both sit on the worker side of it in every respect: neither is a judge, neither pushes, merges, or deletes, and dispatching work grants no review authority whatsoever. A judge that approves a packet authorizes the landing explicitly, and the judge performs it. If Paperclip is down, Joshua tasks the harnesses directly; nothing about the wall changes.

Judges are now exactly two official first-party platforms — Claude and Codex — not four (see the 2026-09-03 roster update above). An official judge surface includes both the platform's CLI and its official browser tools and extensions reached via CLI bridge or MCP — those surfaces can see local ports, so a judge can inspect the running work directly (the live dashboard, the dev server, the test output) before ruling, rather than trusting a pasted claim.

Judge-cost routing: routine packet verdicts go to the flat-rate official subscription, Codex. Claude on the Max plan is reserved for the final merge gate and DREAM Online — the judge action that actually lands work — so the most expensive reasoning tier is spent only where a push happens, never on per-task review churn. Gemini previously carried a leg of this routing and no longer does; as of 2026-09-03 GitHub Copilot no longer carries a leg of it either (Copilot is off the judge roster entirely). Do not silently promote merge-gate Claude into the routine-verdict role to cover the gap; if Codex cannot absorb the load, that is a decision for Joshua, not a routing workaround.

## Foundation ruling (judge decision under Joshua's delegation, 2026-08-23 — superseded 2026-08-25)

**Superseded, kept because the reasoning still matters.** The 2026-08-23 call rested on evidence that has since changed: three tasks dispatched to Hermes, OpenClaw, and OpenCode sat `pending` and produced nothing, `mission-mcp list_agents` returned empty, no harness had ever registered, no poller existed in the repo, and OpenCode was not installed on this node. On that evidence the tri-harness queue was target state that had completed zero tasks, the ceremony was costing shipped work, and the ruling was **FreeBuff builds → the judge reviews → the judge pushes**, with the three-harness polling queue retired as active architecture.

The dispatch premises of that ruling have been overtaken. Paperclip is Mission Control and dispatch runs on its board rather than on a poller nobody built; `mission-mcp` answers with a working tool catalog where it had none; the harnesses hold standing lanes rather than polling a queue; and the judge CLI lanes are built into the board. Two premises are not rebutted and must not be reported as though they were. A populated tool catalog is not a harness registry, and `mission-mcp list_agents` has not been observed returning a registered harness since. OpenCode's installation on this node has not been re-checked either; the board's OpenCode row is an hours-policy denial, which fires before anything reaches an install. FreeBuff is no longer a standalone orchestrator — see "The orchestrator seat" above.

**The loop is now: Paperclip dispatches → a harness or the CEO seat builds → the judge reviews → the judge pushes.** The two halves that were proven working in the old ruling are the two that survive it: something builds, and only a judge lands. That wall is unchanged and is the entire point.

**Three opinions remain available on demand, not as a mandatory gate.** When a decision is genuinely contested or expensive to get wrong, Hermes fans the question to three sub-agents on three different OmniRoute providers and returns the comparison. That preserves the value of tri-execution — independent perspectives before a judge rules — without making every routine task pay for it.

Packets, journals, evidence standards, and judge-only Git remain exactly as written, through both rulings and out the other side.

## Marketing architecture ruling (judge decision under Joshua's delegation, 2026-08-22 — amended 2026-08-25)

Mission Control on Sabretooth natively owns support, Date App uptime monitoring, legal-compliance scanning, and marketing approvals. Paperclip is that Mission Control, so it owns those surfaces directly rather than feeding them.

**Superseded 2026-08-22 clause, kept for history:** Paperclip ran only on the 9020 node, as a marketing producer and nothing else, writing drops into `ops/marketing-inbox/` and holding no repository, governance, or publishing authority. Joshua reversed the node limit and the marketing-only limit outright on 2026-08-25, and reversed the authority limit only in part. There is no 9020 node. Paperclip's scope is not marketing-only. Paperclip does hold governance and task authority as Mission Control — with two exceptions that did not move. It holds no push, merge, or branch-deletion right, which belongs to judges alone and to no orchestrator at any tier. And it does not publish on its own authority; publishing stays gated on the approval queue below.

Mission Control is never exposed on the LAN or tunneled: it binds loopback at `127.0.0.1:3100` and stays there. `ops/marketing-inbox/` remains the local drop path for producer output on this one tree; it is not a cross-node sync point, because there is no second node. Cloud routines read repo state, never live ports.

Compliance scanning runs at queue intake (the FL 496.405 vocabulary plus the "split" wording trap) and informs Joshua's decision; it never auto-denies. Nothing publishes without a decision recorded in the approval queue. Public product surfaces stay business-only: internal governance, owner decisions, and non-product framing never appear in customer copy.

## Authentication rules per judge

Claude judges through the claude.ai MCP setup or the official Claude Code CLI logged in by account auth on a Max-tier subscription. No Anthropic API key is ever needed and none may ever exist. If an Anthropic API key is used again, the design has failed in every respect that matters.

Gemini is **off the roster as of 2026-08-25** and its lane on the board is paused with its heartbeat disabled. Google returned `This client is no longer supported for Gemini Code Assist for individuals`, which is an entitlement decision rather than a configuration fault; an adapter-side defect was fixed first, so the lane is wired correctly and can return if the entitlement is restored. It must never be revived on a Gemini API key or Vertex AI: those keys produced unexpected billing, have all been deleted, and a raw API key is forbidden to a judge regardless. Reinstating Gemini is Joshua's call alone.

OpenAI/Codex judges through account auth sign-in on its official surface. Grok and GitHub Copilot no longer judge as of 2026-09-03 (history: both previously judged through account auth sign-in; Copilot was required to point at a capable model rather than the cheapest one, while staying off third-party premium models whose per-call cost is unsustainable — that requirement is moot now that Copilot is off the roster).

The pattern across both remaining judges is identical: authenticated subscription sign-in, official first-party surface, highest reasoning tier the account allows, and never a raw API key.

## The pipeline

Step one. The objective enters as a Paperclip board issue and is dispatched to the agent whose standing lane covers it — Hermes for YouTube, OpenClaw for marketing, OpenCode for eBay and recycling, Grok for X.com build work (not review), the CEO seat for board and company work. One owner per issue. Fanning the same objective at all three harnesses at once was the pre-2026-08-25 pipeline and is no longer how work is assigned; use the on-demand three-opinion path above when a decision genuinely needs independent perspectives.

Step two. Each harness assigns its subagents a minimum of five skills before any subagent does anything. Five is a floor, not a target. An agent working without its skill set loaded is not permitted to start.

Step three. The harness checks its own subagents' output first. It fixes, edits, and re-prompts until the work stands on its own. This is the first validation pass and it happens entirely inside the harness. Only then does the harness present a review packet to a judge.

Step four. The judge performs the second, independent validation. It may edit, clean, and re-run, then it approves or denies. A denial returns to the harness with reasons.

Step five. If and only if the judge approves and the test suite passes, the judge pushes, merges, and deletes the branch. Tests passing is a precondition of the merge, not a report filed after it.

## Minimum skill sets

**This section is the single source of truth for the standing set.** The standing-set paragraph below is mirrored verbatim into the nine per-agent contracts under `.opencode/agent/`; those are copies, and when the baseline changes it changes here first and the copies are updated to match in the same packet. A copy that has drifted from this section is wrong by definition, and the drift is reported rather than followed. The harness contracts are not yet copies: `agent-contracts/HERMES-AGENT.md`, `OPENCLAW-AGENT.md`, and `OPENCODE-AGENT.md` defer to `agent-contracts/JOURNAL-PROTOCOL.md`, whose list predates the standing set and omits skill-creator, agent-browser, planning-with-files, and para-memory-files. That gap is open and reported, not followed.

Before role floors, the session-start standing set (added 2026-08-22, Joshua's direction) applies to every agent — harnesses, subagents, the orchestrator, and judges alike: agent-reach, the agent's own journal (read at session start, written at session end), find-skills, skill-creator, i-have-adhd for concise output, superpowers brainstorming, agent-browser, planning-with-files, and para-memory-files (PARA file-based memory) — an agent records learnings in its journal and memory files, and any skill-file change it wants is presented as a packet for a judge to land; self-editing skill loops, hook-driven skill mutation, and autonomous web-to-skill generators are prohibited. These load at session start, before any task; the five task-relevant skills below are on top of them, per task. Self-hosted and local-model agents operating under these contracts are OPUS-ALMOSTS: always labeled as the real model running, task-tracked, never signing as Claude/Opus or any platform they are not.

Every skill named in this section resolves on disk under `.agents/skills/` or `.claude/skills/`. That is the test for naming one here: a skill that exists only in a catalog listing is not a floor, and mandating it produces agents that silently start without it. Name a skill in this file only after confirming its `SKILL.md` is present.

Every agent carries at least five skills. These are the floors per role.

Harness workers and their subagents load, at minimum: writing-plans so the work is planned before code is touched; test-driven-development so the failing test comes first and the change stays minimal; systematic-debugging so faults are found by hypothesis and test rather than by random edits; verification-before-completion so nothing is called done without a verification pass; and requesting-code-review so the packet handed to a judge is self-reviewed, covered by tests, and properly described.

Harnesses orchestrating subagents add subagent-driven-development, dispatching-parallel-agents, and using-git-worktrees so parallel sessions do not collide on a shared tree.

Judges load, at minimum: requesting-code-review so they know what a complete packet looks like; test-driven-development so they can tell a meaningful test from boilerplate coverage; verification-before-completion so approval is gated on evidence; webapp-testing so end-to-end claims can be checked rather than trusted; and finishing-a-development-branch, which is the merge-and-delete checklist the judge actually executes.

The testing gate itself draws on test-driven-development, webapp-testing, verification-before-completion, and — where a claim is about a running page rather than a passing assertion — agent-browser or browser-use to drive the browser. Earlier revisions of this section also mandated `playwright-best-practices` and `playwright-cli`. Neither resolves on disk under `.agents/skills/` or `.claude/skills/`; both are catalog rows in `agent-contracts/SKILLS-DOCTRINE.md`, not skills, and they are removed from the floor rather than left as an instruction no agent can follow. A judge drives a browser through its own CLI-side MCP config. The `playwright` connector repaired in the evidence packet belongs to Paperclip's governed tool broker, which the packet is explicit is a separate path from a CLI lane's, so it is not evidence that a judge can drive a browser. If Joshua wants those two skills as a real floor, they get installed first and re-added here second.

## The reporting standard

The evidence standards this document keeps referring to are these, and they are not optional garnish on a report — they are the grammar every claim in a packet or a verdict is written in.

Work is reported **VERIFIED**, **UNVERIFIED**, or **BLOCKED**, with the changed files, the test or build evidence, sanitized audit evidence where it applies, and the next bounded action. A service is reported **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED** — never an unqualified green or red. A listening port is not an identity and an exit code is not a proof; verify that the expected service is the one answering before calling it up. Never claim VERIFIED for something you did not observe yourself.

Secrets never enter this repository. No token, bearer value, API key, header value, secret id, or masked credential fragment belongs in a contract, a commit, a config row, or a stdio template argument. `~/.agents/mcp.json` holds live credentials and lives outside the tree; it stays there.

## Governance vote isolation

Official council governance votes are separate from all of the above and are not part of the build pipeline.

A governance vote must be unalterable by any user prompt, any AI harness, any wrapper, and any third-party router including OmniRoute. Ballots travel their own designated official bridge for each platform. No general-purpose bridge, no operational routing path, and no model gateway may carry a vote. A submitted voter identity must match the server-side identity of the signed-in account.

Open item requiring Josh's ruling: the council roster changes when the vote migrates off the Manus page. That vote migration is separate from the Mission Control cutover and has not happened yet; the post-migration list has not been stated either. The repository bridge contract names six platforms as Claude, Gemini, GitHub Copilot, Meta AI, ChatGPT/OpenAI, and Manus, which describes the council as it stands on the current page. Manus will not be available after the migration. The current (2026-09-03) judge roster is Claude and OpenAI/Codex only — narrower than any council list above. Council membership and judge eligibility may legitimately be different sets, but the post-cutover council must be stated explicitly before any vote taken in Mission Control is treated as binding.

## Why the gate is this strict

Pushes to the repository trigger automated review and failure notification from Claude, Codex, CodeRabbit, and GitHub. A bad push is not a private mistake; it lands in Josh's inbox as a visible failure. Mission Control exists to make that outcome structurally unlikely: two independent validation passes, a hard test gate, and a push right held by exactly one role. The dashboard is intended to be presented as evidence that the pipeline works, so the pipeline has to actually work.

The dashboard that carries that burden is the Paperclip board itself, which reads live state. `apps/paperweight/index.html`, served at `:3151/paperweight/`, is not it: it is a static demo that makes no requests and labels its own figures as sample data. It must never be shown as evidence that anything is running, and no number from it may be repeated as a measurement.
