# HANDOFF FOR FABLE: clear the queue, then audit, router, GUI, pipeline

Date: 2026-11-03
From: Joshua (drafted in a Claude Code cloud session)
To: Fable
Use: read this whole file, then run it as a loop or goal. Nothing in it needs a question back to Joshua except the one-tap items in Part -1 and the decisions listed at the end.

You already know this platform (doctrine, nodes, repos, judge-house, the Claude GM #1 role). This file adds only what is new and sets the order.

ORDER OF WORK: (1) clear the queue, (2) audit, (3) build. Do not start 2 or 3 until 1 is reported.
Status words: VERIFIED, UNVERIFIED, BLOCKED. Anything in this file marked "read 2026-11-03" is a snapshot and may have moved.

---

## PART -1. CLEAR THE QUEUE FIRST (entire GitHub account, Trollz1004, every repo, public and private)

Goal: when you start building, nothing of yours or anyone's is waiting, and everything you produce is a new PR that someone else merges.

Snapshot (read 2026-11-03). ANTIGRAVITY: open PRs #335 (Claude GM #1 review: 30-line router, backups, :8082 isolation, soul sync), #334 (dreamforge site, "de-branded, ToS-compliant"), #331 (sabretooth push source env fix), #327 (dependabot qs/express in services/mission-mcp); no open issues. side-work, mission-control-v5, antigravity-v2: no open PRs. The other repos on the account (dream-online, misses-trollz and the rest) were not visible to the author of this file: inventory them yourself.

Steps:
1. Inventory every open PR and issue on the whole account. Record: repo, number, author, age, checks status, review status, mergeable state.
2. Sort each item into exactly one class: MERGE, FIX, BLOCKED, CLOSE, ISSUE-ACTION.
3. MERGE only through the GitHub rule: required checks green, and a required review by someone other than the author. You may review and merge PRs you did not author. You never merge your own. Do not bypass, force-push, loosen a check, or change any repo setting to make something pass.
4. Before every merge run the doctrine check: no secrets; no public mission surface without a partner (no domain, nameserver, tunnel or Pages change that puts a mission page live); business-only public copy; nothing that wraps, resells or relays a provider login or presents one model as another; free-kids-app terms intact; payments untouched. #334 needs a real look: confirm what it is derived from and that it breaks neither the in-house rule nor any provider's terms.
5. FIX: if a PR needs a change, comment with exactly what, or push to that PR's own branch only if the fix is small and obvious. Then it needs a reviewer other than you.
6. BLOCKED: failing or missing checks, a review that cannot be satisfied, a conflict you cannot resolve safely, a hard-rule change. Say why in one line and park it for Joshua as a single yes/no tap. Known: main's CI was failing before this file existed (a workflow points at directories that do not exist; the npm audit has failed since 33b2f99). Evaluate each PR's required checks separately. While main is red, a PR whose required checks fail cannot go green. If that PR can repair the failing check itself, classify it as FIX; otherwise classify it as BLOCKED. Report it. Do not hide it. Do not bypass it.
7. CLOSE (stale or duplicate): close with a one-line reason. Never delete an unmerged branch. After a merge, delete that branch (one branch per repo: main).
8. Issues are not merged. Triage them: answer, label, link to the PR that fixes them, or close with a reason.
9. Write the queue report: one table, every item, class, action taken, evidence (check names and results, review links). Mark each VERIFIED / UNVERIFIED / BLOCKED. Then write your session entry to Obsidian and the memory graph.

After the queue: every change you make is a new PR from a fresh branch off main. You stop at the PR. Another judge (Codex, Gemini, Jules or Claude) reviews and merges; you do not merge your own.

MERGE RULE (enforced by GitHub, applies to every PR including router and weekly-loop PRs): reviews and merges happen in GitHub. The repository rule is the gate: required status checks (100% tests, lint, secret scan, doctrine check) and a required review by someone other than the author. No second path, no special case for the router, the weekly loop or any agent. Before building, read each repo's actual rule (branch protection or ruleset: required reviews, required checks, self-approval, bypass list, CODEOWNERS) and report it. Mark each item VERIFIED or UNVERIFIED. If a rule is weaker than intended, report the gap and let Joshua decide; do not change settings. Known so far (read 2026-11-03): in Trollz1004/ANTIGRAVITY, main is protected; master and the other branches are not; the rule details were not visible to the reader. The dashboard shows each open PR's required checks, reviewer and status in words, read from GitHub.

---

## JOB (after Part -1)

Audit the Hermes lead-gen dashboard on Sabretooth. Then design and build, in-house: (A) a plain accessible GUI, (B) an options-only task router, (C) a quality/merge pipeline. Stop at a PR. Do not merge.

## PART 0. THREE SEPARATE SYSTEMS

1. Mission OS (:3130, T5500): streaming-safe, public later only after proof AI helped kids. Do not touch.
2. YouTube lead-gen (Sabretooth, apps/hermes-leadgen, :8392): private, never streamed. Hermes :9119 is the chat orchestrator, not the dashboard.
3. Game dev (dream-online, Alienware): in-house only, never posts.

Each has its own config, cards, rules, outcome log, router and weekly loop.

## PART 1. HOUSE RULES

a) In-house only. Third-party tools (Panda Code, Panda Router, octoroute, reaatech llm-router) are reference reading only: borrow ideas, not code. Exceptions, both ruled by Joshua: Jev (TypeSafe) is core; OmniRoute is an optional lane under his 2026-10-22 rulings, usable only as 1c allows.
b) Provider terms are Joshua's terms. Core trusted providers: Anthropic, Google, xAI, OpenAI, Meta, Perplexity. Write TERMS-PROVIDERS.md: nothing altered, no model presented as another, nothing signs as Claude or Opus unless it came from official Claude.
c) Paths per model card, in order: direct (the provider's own official sign-in: claude, codex, agy, grok, gemini, hermes), then key (env only; never in code, a commit, a log or chat). OmniRoute (192.168.0.15:20128, model-specific ids or auto/*) is an optional third path and is OFF by default: it may be enabled only after TERMS-PROVIDERS.md reports the relay terms and Joshua approves with one yes/no tap in the dashboard. Until he approves, no card may list OmniRoute as an executable path. Read the current terms of Anthropic, Google, xAI, OpenAI, Meta, Perplexity, TypeSafe and OpenRouter on relaying subscription logins and on data retention, and report them with links. Do not decide that for Joshua.
d) Plans: Ultra agy tier includes Opus 5.5 and Sonnet officially, no Fable (Joshua-confirmed). Gemini 4 Argon (latest Google model, via agy) has a small usage pool: cards carry a quota note and a fallback to Flash.
e) Nothing posts without Joshua's approval. PRs only. Merge only by Codex, Gemini, Jules or Claude, through the GitHub rule above. Joshua is the final authority.
f) Existing repo rules stand: no secrets, business-only public copy, no kids/hospital/mission framing on any outward surface, payments are settled, T5500 is the only production node.
g) Rule one: nothing is done until the real person would accept it: screenshot of what they see, flaw list, fixes, new screenshot.

## PART 2. SKILLS (MANDATORY ON EVERY AGENT, PLATFORM AND TASK)

Present in .agents/skills (count the directory; trust no inventory): caveman, agent-reach, brainstorming, tdd, test-driven-development, systematic-debugging, find-skills, create-skills, i-have-adhd, motion-design, judge-house, obsidian-save, obsidian-think, obsidian-markdown, obsidian-wiki-fold, workspace-memory.
Not found in the cloud clone (check the nodes, the OneDrive vault and GAME-ENGINE; report FOUND or MISSING): humanized, remake, rea, impeccable, hyperframes, claude-game-designer, a memory-graph skill, last30days. Install last30days (github.com/mvanhorn/last30days-skill, MIT) by PR.
Rules: superpowers (brainstorming, TDD, systematic debugging) and test-driven deployment on every task. Humanized for anything a person outside the team reads. Caveman for agent output, notes and logs. Turn each finished piece into a skill with create-skills.

## PART 3. THE GUI

User: Joshua, electrician-friendly, bad eyesight, tired, phone or monitor. Layout like the GitHub, Codex and Claude apps: sidebar (tasks, board, files, git), chat, terminal, git/diff, preview/browser, model swapper, one primary action per screen.
Accessibility: base text 18px or more (nothing under 16px), contrast 7:1 or better, light/dark/high-contrast, works at 200% zoom, buttons 44px or more with plain words, status as word plus icon never color alone, full keyboard reach. No meme dashboard, no decoration.
Audit apps/hermes-leadgen on Sabretooth (what works, what is fake, what is broken; evidence only). Review ANTIGRAVITY PR #335 and say what unblocks it (this overlaps Part -1). Proof is screenshots of the real running thing as the Joshua persona.

## PART 4. THE ROUTER

Layer 1, rules (code, zero tokens). Hard rules run first and cannot be overridden: Reddit = Opus only; founder-tone replies = Opus or Fable only; judging and anything signed as Opus requires a direct path; X = Grok via the grok.com path, not the X API; the game node never posts; security = Codex; Fable-only tasks go to Fable's own account, not through agy. Unmatched = "No rule yet", parked. The router never asks Joshua anything and never writes prose; his only input is optional taps on predefined menus (A/B/C/D, yes/no).

Layer 2, Jev (core). Jev only selects. It never performs a task: no code, no content, no posting, no drafting. After Jev picks, an agent or plain code acts. Jev is a hosted decision model: output is a keyed choice or yes/no with a confidence value.
Verified facts (read 2026-11-03): Jev 1.13/1.14 cost $0.042 per million input tokens and $0 output (OpenRouter pages). Opus 5.5 costs $4 input and $20 output per million (Anthropic pricing page). OpenRouter's own test on 3,080 support messages with 77 options: Jev 81.0% vs Opus 5 84.4% accuracy, 175 ms vs 2,266 ms median latency, $0.11 vs $2.42 per 1,000 requests. That source is vendor-adjacent, so it is Tier 2 evidence only.
Jev's jobs: (1) support triage (customer issue -> A/B/C/D... or yes/no) routed to Hermes with the matching playbook; (2) pick the best agent from a short list for a task type; (3) pipeline gate yes/no; (4) the weekly loop's PROMOTE/HOLD/DEMOTE/PROBATION/RETIRE choice; (5) tie-breaks. These are small decisions: keep each option list to 7 or fewer.
Option design: atomic (one decision per call), closed, lettered A, B, C... in a fixed order, mutually exclusive, always with a final "none of these". Keyed by letter or number, never by wording; option text lives in code and is versioned. Safety/abuse is its own yes/no call; yes goes to human review, never auto-handled.
Rules around Jev: below the confidence threshold, a timeout, an error or a malformed answer = HOLD / "No rule yet". Jev never acts alone on anything irreversible, outward-facing or touching a hard rule. Key only in env or GitHub secrets; it is a keyed lane and never signs as Claude or Opus.
DATA RULE: support text can hold personal data and Jev is hosted. Send only what the decision needs (redacted text or extracted fields: issue keywords, product, plan type), never names, emails, payment details or message history. Joshua decides whether raw support text is ever allowed.
Shadow mode first: log question version, options, Jev's choice, confidence and the real outcome. Measure accuracy per confidence band. Thresholds come from that data, never guessed. Compare Jev against a plain-rules baseline on Joshua's own tasks and report the result.

Model cards: one JSON card per agent: strengths, task types, nodes allowed, provider, ordered paths, quota note, limits, fallback. Effort levels (low/medium/high/xhigh) are separate cards where exposed. A deterministic policy ranks cards per task type and node. Every decision returns a fallback order; escalate after two failed loops.

OmniRoute card generation (only after Joshua approves OmniRoute under Part 1c): read the live model list at startup (confirm /api/v1 vs /v1) and generate candidate cards from id, owned_by, parent, context_length, max_input_tokens, effort_tiers and capabilities. Entries with owned_by "combo" (auto/best-coding, auto/smart, auto/claude-opus, auto/claude-sonnet) are opaque: cards on the omniroute path only, never the decider, never counted as official Claude, and the log records the actual answering model when OmniRoute returns it. Direct-path cards have no list to read: define each by hand from the provider's own docs and mark every field VERIFIED or UNVERIFIED. Candidate cards start UNRANKED. Note for Joshua: check whether the model list endpoint is reachable without a login from the LAN.

Ranking evidence:
- Tier 1 (authority): Joshua's append-only outcome log in SQLite: task type, node, agent, path used, verifier result, human override.
- Tier 2 (starting prior only): documented third-party reviews, each with source, date, method and conflict of interest. A vendor's claim about its own model is never enough alone (two or more independent sources). Tier 2 never overrides Tier 1 once Tier 1 has enough samples (you set the number and show the reasoning).
- No platform is favored by default.

Weekly research loop (automatic, one per dashboard; Joshua does not track models). Sources, each run:
1. last30days (keyless sources first).
2. agent-reach: run `agent-reach doctor --json`; name the backend in use and any fallback.
3. GitHub trending and new-repo search for routers, coding agents and models (no official trending API: verify the fetch method, fall back to `gh search` sorted by recent stars).
4. Each provider's own model list on every direct path, diffed against the last run, and Jev's own model list for the newest version.
5. brainstorming and the superpowers skills on the combined findings.
Decisions are keyed (Jev layer), logged, shadow-mode first, and below threshold = HOLD. Output: a weekly PR, tests first, with the ranking diff and sources. It goes through the same GitHub merge rule as every other PR. A new model enters as UNRANKED, then PROBATION: shadow runs on harmless tasks beside the current best, judged by the pipeline. Every card carries an "as of" date; old data loses weight (you set the decay); the dashboard lists stale cards in words. Hard rules point at a family ("Opus family, latest verified card"), not a version. Parked for Joshua: any change to a hard rule, as one yes/no tap. Starting the weekly schedule on a node is Joshua's call; prepare it, do not start it.

Dashboard shows in plain words: what was chosen, which rule, fallback order, last result, dataset date, what changed this week, new models on probation, anything waiting for one tap.

Seed table (mark each VERIFIED or UNVERIFIED): X -> Grok; video -> ComfyUI/Maestro in-house, or Gemini/Veo/Nano Banana; comment replies in founder tone -> Opus/Fable; Reddit -> Opus; Meta posting -> Muse Code (Meta, beta since 2026-08-05); security -> Codex; build agents -> Gemini 4 Argon via agy, Flash, Sonnet, Haiku. Ask Joshua once, as a predefined list, about "Nimble" (octoroute is the closest match found) and the "Mila sec type quickness panda router repo".

## PART 5. THE PIPELINE

Router -> Worker -> Validator (a different model) -> Judge 1 -> slop/humanized-copy check -> Judge 2 (a different model again) -> security audit -> Fable/Opus advisory -> PR -> merge through the GitHub rule.
Non-AI gates run first: tests, lint, secret scan, doctrine check. No model reviews its own output; at merge, GitHub already forbids author self-approval. OPEN CONFLICT: Opus/Fable-authored content (founder-tone replies, Reddit) would be reviewed by the same family. Propose a fix. Joshua decides. Retry caps. An append-only log per stage. A failure stops the run.

## PART 6. PROTECT JOSHUA'S TIME

His time is the scarce thing. No clock and no time-of-day assumptions. No token or cost caps. Add: a meter of Joshua-minutes per decision, a Do-Not-Disturb switch only he can flip, and an open-screen summary on return: what finished, what failed, what needs one tap.

## PART 7. MEMORY (MANDATORY, ANY AGENT IN ANY REPO)

Memory graphy: a codename workflow graph per node in docs/memory-layer/, mirrored to Obsidian. After every session append to C:\ANTIGRAVITY\Antigravity\<NODE>\<agent>-to-<agent>.md with header `## <YYYY-MM-DD HH:MM TZ> | node: <NODE> | use case: <...>`. One file per agent per node, append only, no secrets. Node-local hooks handle the session-start read and the session-end append. CI checks only the in-repository `docs/memory-layer/` graph update and fails the PR if that update is missing. Repeated misses mean removal from the lane.

## PART 8. DELIVERABLES

1. Queue report (Part -1).
2. Audit report of the Sabretooth dashboard (evidence only).
3. TERMS-PROVIDERS.md with the findings from reading the providers' terms, and the report on each repo's actual GitHub rule.
4. Router: cards/, rules, Jev question sets, outcome log, tests, shadow-mode report, and a skill via create-skills.
5. Weekly loop, prepared and not started, with its first dry run.
6. GUI: running build, screenshots, flaw list, fixes.
7. Pipeline definition and a first dry run on a harmless task.
8. Skills report: FOUND or MISSING for each skill in Part 2.
9. A list of anything not verified, marked VERIFIED / UNVERIFIED / BLOCKED.
Work on a feature branch. Stop at the PR.

## DECISIONS THAT ARE JOSHUA'S (do not make them for him)

- The Opus/Fable self-review conflict (Part 5): Fable proposes, Joshua decides.
- Whether raw support text may ever go to Jev (Part 4 data rule). Default: redacted fields only.
- Whether relaying a subscription login through third-party software is acceptable under each provider's terms, and so whether OmniRoute is enabled (Part 1c): Fable reports the terms, Joshua decides with one tap.
- Starting the weekly schedule on a node.
- Any change to a hard rule.
- Closing stale or duplicate PRs is allowed with a reason (Part -1); change this to a tap if Joshua says so.
