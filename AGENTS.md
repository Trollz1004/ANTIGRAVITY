# S1 Doctrine Supersession — ACTIVE

## Before anything (every session, every harness, includes OpenCode)

Skills-first preflight applies to every agent, not just the lanes spelled out in
`agent-contracts/CAPABILITY-BASELINE.md` and `agent-contracts/JOURNAL-PROTOCOL.md`.
At session start, before planning or coding, load the standing set the baseline
specifies: `agent-reach` · your own `.agents/journals/<role>/STATE.md` (read it,
write it at session end) · `find-skills` · `skill-creator` · `i-have-adhd` (token
discipline only, not a user label) · superpowers `brainstorming` · `agent-browser` ·
`planning-with-files` · `para-memory-files`. Then add at least five
task-relevant skills on top (floor: `writing-plans`, `test-driven-development`,
`systematic-debugging`, `verification-before-completion`, `requesting-code-review`).
`self-learning` is judged out and stays out — never self-edit a SKILL.md,
contract, or hook; a change you want becomes a packet in `ops/packets/` for a
judge to land. OpenCode writes its session memory to
`C:\ANTIGRAVITY\Antigravity\Agent Universal\opencode-to-opencode.md`
(Obsidian) in addition to the repo journal — same content, second home.

## Rule one: done means the real user would accept it (Joshua, 2026-10-04)

This replaces "200 OK is not OK" and every "verify it" that came before it. It applies to every AI on every repository: Claude, Codex, Gemini, Copilot, Hermes, OpenCode, Emergent, anyone.

Before you say "done", "working", "fixed" or "verified":

1. Say who it is for, as a person (example: a nurse handing a phone to a sick 5-year-old; Joshua reading on his phone with tired eyes).
2. Show the screenshot of what that person sees, taken from the real thing they will open.
3. Look at it as that person and list everything wrong with it: ugly, confusing, broken, cut off, too much text, wrong for them. If you list nothing, say why that person would accept it as it is.
4. Fix what you found, then show the new screenshot.

Status codes, test counts and scores (200, 26 of 26, Lighthouse 100) prove the code runs. They never prove it is good, and they are never the reason something is called done. Joshua decides when it is done, not your tests.

Two hard parts of rule one (Joshua, 2026-10-05):

- **Screenshots are mandatory for anything front-facing.** Any HTML a customer, a kid or Joshua will see gets its screenshots shown to Joshua before it is called done.
- **Front-facing HTML is done only when it is live.** Most HTML changes must be pushed to the Cloudflare page that serves the domain. A change that sits on disk or in the repo and never reaches Cloudflare is the same as a 200 OK.

Why this rule exists: on 2026-10-04 Misses Trollz passed every score while what a nurse would see was still not right for a sick child. Every check passed, and the product was not yet good enough for the people it was made for. This has happened with every AI platform, not one; this rule is how every lane keeps it from happening again.

> **Status:** LANDED by the judge lane under Joshua’s authority on 2026-08-19. This doctrine is ACTIVE. Runtime service launch remains a separate, deliberate, Joshua-authorized action.

## Rulings of 2026-10-22 (Joshua): judges and how models are reached. Win over every older section below; the same section is in CLAUDE.md

- **Three judges, any one of them can judge: Claude, Codex, Jules.** When Claude hits a usage cap, Codex or Jules judges and the work does not wait. The final gate is the GitHub rule on the repository, which will not merge without it. Only Claude edits Claude's files (CLAUDE.md, `.claude/`, Claude's journals and memory).
- **Official Claude judge lanes are sign-in only:** claude.ai (web, desktop, mobile), Claude Code in the Antigravity editor and the official `claude` CLI, and Claude in Chrome. Never an API key, `ANTHROPIC_API_KEY` or `ANTHROPIC_BASE_URL`. Anything else that answers as Claude never signs as Claude or Opus.
- **Every official lane signs in; none uses a key:** Claude, Codex, Gemini/agy, Jules, Grok, Kimi, Hermes (device login).
- **OmniRoute is a convenience, not the gate.** It stays on `:20128`; a lane may use it, but nothing is required to go through it, and it does not handle several clients at once reliably. The 2026-07-14 "one gate, fail closed" order is history. Claude never routes through OmniRoute.
- **API-key lanes** (OpenRouter, free-claude-code, Ollama Cloud and similar) keep their keys only in env files or GitHub Actions secrets. Never in code, a commit, a log, a PR body or chat.
- **free-claude-code is allowed back as an MCP server and worker lane** (2026-10-22): never a judge, never a launcher that takes over the Claude CLI login, never signs as Claude or Opus, never holds an Anthropic key. Terms in `agent-contracts/FCC-STATUS.md`.
- **Paperclip is gone** (retired 2026-10-20). Every Paperclip line below is history.

## Rulings of 2026-10-17 (Joshua): win over every older section below; the same section is in CLAUDE.md

> Written by Claude (Opus) in the Antigravity IDE on Joshua's direct instruction. Machine-readable copy for every agent: `docs/memory-layer/agent-workflow-graphy.json` (Obsidian: `Antigravity/Agent Universal/agent-workflow-graphy.json`).

- **Authority.** Joshua is the only human in the loop and the sole authority. No AI commands another AI. When a direct message comes from Joshua, no AI tells another it cannot do it. Claude, Codex and Jules are judges: they review and validate before merge; they do not command agents or override Joshua's direct instruction.
- **Nodes.** The T5500 (`192.168.0.15`) is the only production node. Alienware (`192.168.0.40`) is dev only: never production, never hosts or routes anything live. Sabretooth is not a node (retired, OFF by ruling).
- **Mission Control = JARVIS/OPSIS** on the Mission Agent OS board (`mission-os/`, :3130). Hermes is JARVIS on :9119, serving Mission Control on :3130, and is fixing it now. OPSIS/JARVIS and Hermes own that dashboard work; nobody else changes it unless Joshua assigns it.
- **Paperclip is PERMANENTLY RETIRED & DELETED (Joshua, 2026-10-20); Social Command Center & Gemini 4 Ultra Marketing Plans run natively in Mission Agent OS (`http://127.0.0.1:3130/marketing`).** Never start, probe, or reference Paperclip (`:4747` or `:3917`). All marketing for `youandinotai.com`, `onlinerecycle.net`, and `dream-online.net` — including the 22-platform Social Command Center (`mission-control/lib/` + `scripts/dashboard-aidoesitall/social_engine/`), 4-gate compliance & SlopMonster 5/5 copy-score checks, Fable voice drafting (`joshlcoleman/Fable:latest`), and the 50-Task Perpetual Wheel — runs natively inside Mission Agent OS (`http://127.0.0.1:3130/marketing` & `/api/marketing/plans`), coordinated 100% by **Gemini 4 Antigravity Ultra (`agy` OAuth)** at - **Paperclip is marketing only (`http://127.0.0.1:4747`) — Gemini Antigravity Ultra (`agy` OAuth) runs ALL marketing, no other AI (amended 2026-10-20).** Paperclip (`http://127.0.0.1:4747`, company `Trollz1004-ANTIGRAVITY-MARKETING` / `TRO`) is NOT Mission Control (which is on :3130). **Gemini Antigravity Ultra (`Gemini Ultra CEO`, `mission-os/launchers/agy-gemini.exe`, `gemini-4-argon-high`, and local bridge `http://127.0.0.1:3130/v1` at $0 API cost) is the sole CEO and runs 100% of marketing.** No other AI runs marketing. marginal API cost.
- **Hermes = JARVIS + all support + YouTube automation.** All customer support is routed to Hermes. Hermes has no sentry duty and no Paperclip marketing duty.
- **OpenClaw is the only watchdog/sentry** on the T5500, with no marketing duty. The Hermes cron `T5500 node watch` (2026-10-15) is no longer a sentry duty; switching the cron itself off is a runtime action for Joshua.
- **Memory (Obsidian) + Code Search (Graphify) are mandatory on every session (amended 2026-10-20):**
  - **Obsidian = Agent Memory:** Joshua's personal, paid vault `C:\ANTIGRAVITY\Antigravity` (REST `:27123`). Every agent reads its own file at session start and appends a timestamped entry at session end: `C:\ANTIGRAVITY\Antigravity\<NODE>\<agent>-to-<agent>.md` (e.g. `T5500\claude-to-claude.md`, `T5500\hermes-to-hermes.md`, `T5500\gemini-to-gemini.md`), entry header `## <YYYY-MM-DD HH:MM TZ> | node: <NODE> | use case: <...>`. One file per agent per node, append only, no secrets. Supabase (required), Supermemory, OpenViking and Vercel are backups; the memory MCPs exist for exactly that.
  - **Graphify = Agent Code Search & Workflow Graph on Sessions:** Every agent uses **Graphify** (`graphify` CLI, `C:\ANTIGRAVITY\graphify-out\graph.json` & `C:\ANTIGRAVITY\graphify-out\GRAPH_REPORT.md`) for code search on sessions before grepping raw files, and reads `docs/memory-layer/agent-workflow-graphy.json` (mirrored at `C:\ANTIGRAVITY\Antigravity\Agent Universal\agent-workflow-graphy.json`) for workflow & skill routing.
- **Entry files must agree.** Agents read different files at session start (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `docs/memory-layer/agent-workflow-graphy.json`, `SKILL.md` files, Obsidian). All of them carry the same data; a stale one is fixed, not ignored.
- **Payments are settled: read the record, never re-test.** The record is `docs/PAYMENTS-TRUTH.md` (with `docs/payment-flow-verification-2026-06-01.md`). youandinotai.com pays through Square only. All 15 Square attempts (2025-04 to 2026-08, including the $10 refund) are Joshua's own test charges, and the pipeline is proven in production. Past test charges are **not a blocker**, and their count doesn't matter (100% of revenue stays with the business). Do not re-verify, re-audit, re-test or ask Joshua about them. Only two things reopen payments: a real Square webhook failure in production, or a new non-Joshua payment in Square (the first real customer, which is reported, not "verified"). The bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are private: never copy, quote or commit them. Never delete either record file.

## Rulings of 2026-10-15 (Joshua, amended 2026-10-20): the same section is in CLAUDE.md

- **The 100% rule.** Nothing is pushed unless it is 100% done and proven; 90% is not pushed. Nothing is merged unless a judge (Claude, Codex or Jules) validates it and the GitHub rule passes (amended 2026-10-22). One branch per repo (`main`).
- **OpenClaw watches the T5500, 100%** (amended 2026-10-17: OpenClaw is the only sentry). Keep-alive heals; OpenClaw's sentry window watches the keep-alive. Codex stands down from watching the node (`ops/handoffs/CODEX-HANDOFF-2026-10-15.md`).
- **Paperclip is retired (2026-10-20); all marketing runs in Mission Agent OS (`http://127.0.0.1:3130/marketing`) via the Social Command Center under Gemini Antigravity Ultra (`agy` OAuth).**
- **Gemini Antigravity Ultra is a full co-builder AND the sole marketing engine (amended 2026-10-20).** Gemini and Claude are authorized co-builders with Joshua across `C:\ANTIGRAVITY`, and Gemini Antigravity Ultra coordinates and executes 100% of the Mission OS Social Command Center (`/marketing`) and 3-domain marketing plans.
- **Jules is a judge** (with Codex and Claude), through the Gemini Ultra subscription only. Jules and Claude built this platform in AI Studio. A merge still needs Claude's validation.

## T5500 is the only node (Joshua, 2026-10-09, amended 2026-10-20): wins over the node map below

> Written by **Opus (Claude) running in the Antigravity IDE** on 2026-10-09, on Joshua's instruction. Joshua does not edit AI instruction or memory files himself; this edit is the model's, recorded as such.

- **Until funding, the T5500 (`T5500-2-XEON-72`, `192.168.0.15`) is the only node, and the Antigravity IDE the only platform, for every domain and for Mission Control.** Alienware is dev only, never production (amended 2026-10-17). Sabretooth and the old boxes stay OFF by ruling: never probe, start, heal or route to them.
- **Social Command Center & Marketing Engine (`http://127.0.0.1:3130/marketing`)**: Native inside Mission Agent OS on `:3130` (`mission-os/marketing-engine.mjs`). Paperclip is permanently retired and removed.
- **Mission Control = JARVIS/OPSIS on the Mission Agent OS board**, running on the T5500 (`mission-os/`, Agent Hub `:3130`, read-only `/api/mos-state.json`, plus local OpenAI-compatible Gemini 4 bridge `/v1/models` and `/v1/chat/completions`). It reads Social Command Center (`/marketing`), Odysseus (`:7011`), OmniRoute (`:20128`), the keep-alive status and agent journals. Until it answers its identity probe it is **NOT RUNNING**, not UP.
- **Services that come back on boot / power loss** (all on the T5500): Ollama :11434, Postgres :5432, Redis :6379, domains server :9160, date-app frontend :3200 and API :8000, cloudflared tunnel, Social Command Center (:3130/marketing), Odysseus :7011, Mission Control :3130, OmniRoute :20128 (non-elevated task `ANTIGRAVITY OmniRoute`, dashboard password-protected), Hermes support window (:9119 / :8643), OpenClaw sentry window, Obsidian (vault `C:\ANTIGRAVITY\Antigravity`, REST :27123). The keep-alive also probes Supabase, Supermemory and Vercel every 10 minutes and writes them to `ops/t5500/status.json`.
- **AI-team memory & code search:** Obsidian vault `C:\ANTIGRAVITY\Antigravity` (primary agent memory), Graphify (`C:\ANTIGRAVITY\graphify-out\graph.json` & `docs/memory-layer/agent-workflow-graphy.json` for agent code search & workflow graph on sessions), plus Supabase, Supermemory, and each agent's own memory files.
- **CLI lanes are login/OAuth only:** claude, codex, gemini/agy (Paperclip gemini lanes call `agy` through `mission-os/launchers/agy-gemini.exe` and `http://127.0.0.1:3130/v1` so the Ultra plan is used at $0 API cost), grok, kimi, opencode (local Gemini 4 `:3130/v1` + local Ollama `:11434/v1`), pi (local Gemini 4 `:3130/v1` + local Ollama `:11434/v1`). No API-key environment variables.
- **Env files:** master `OneDrive\claude-to-claude\.env` (gitignored, with its `.env.lowercase` twin), runtime `C:\ANTIGRAVITY\.env`, gateway `~\.omniroute\.env`. All synced to T5500 values on 2026-10-09.

## Node map (Joshua, 2026-10-05): wins over every older node claim

- **T5500 (`T5500-2-XEON-72`, `192.168.0.15`) is the production node.** It runs every live domain, the date app (frontend :3200, API :8000), Postgres :5432, Redis :6379, Ollama, the domains server :9160 and the cloudflared tunnel. Its keep-alive writes `C:\ANTIGRAVITY\ops\t5500\status.json` and `C:\ANTIGRAVITY\logs\t5500-keepalive.log`; it heals on its own and logs every heal.
- ~~**Alienware (`192.168.0.40`) is the dev node** and hosts Mission Control: JARVIS/OPSIS on :9150, operated by Hermes in the terminal. DREAM Online is built and tested there.~~ **Superseded 2026-10-09:** JARVIS/OPSIS and DREAM Online work move to the T5500. **Amended 2026-10-17:** Alienware is dev only, never production.
- **Sabretooth (`192.168.0.8`) is retired and OFF by ruling.** Its work moved to the T5500 from the same SSD. Never probe, start, heal or route to it; show it as OFF BY RULING, never DOWN. Every `192.168.0.8` address and every "Sabretooth runs X" line in this repo is history.
- Other old boxes (OptiPlex 9020, i7k, Chromebook, Mini ASUS) stay OFF by ruling.
- **Domains:** youandinotai.com is live behind the Cloudflare tunnel. onlinerecycle.net, dream-online.net and untilnokidinneed.com have a healthy origin and wait on nameservers. The AI store domain is undecided: do not renew it and do not build on it.
- **Hermes (JARVIS + all support + YouTube automation, amended 2026-10-17):** all customer support is routed to Hermes (onlinerecycle.net and the date app, Ollama models `joshlcoleman/fable` and `joshlcoleman/cfo`). Hermes is JARVIS on :9119 for Mission Control :3130 and runs YouTube automation. Hermes does not do node sentry or health checks.
- **OpenClaw (Node Sentry only):** OpenClaw is the dedicated 24/7 sentry on the T5500 production node. It checks all ports, domains, and tunnels continuously. It fixes issues silently on sight with zero notification spam; only alerts Joshua if an issue remains broken after 20 consecutive attempts. Neither agent does both — one does each.
- **Editors and lanes:** each node gets the Antigravity editor (VS Code-based) with Claude as a signed-in extension (never an API key), with Gemini and Claude as co-builders and pair-programmers with full code, create, push, merge, and delete authority alongside Joshua. Hermes runs in the terminal as JARVIS/OPSIS. The build prompt for OPSIS and Gemini's updated instructions are in `ops/handoffs/OPSIS-MISSION-AGENT-OS-2026-10-05.md` and `ops/handoffs/GEMINI-SPARK-INSTRUCTIONS-2026-10-05.md`.
- **Never** introduce an `ANTHROPIC_API_KEY`. Official Claude is login/OAuth only.

## T5500 deployed, self-healing, and public only once it is pushed (Joshua, 2026-10-05)

Joshua's standing preference, not a one-time task. These lines are part of what "done" means under Rule one.

- **100 percent deployed on the T5500.** The full stack runs in production on the T5500 — every domain, its DNS, and every port it serves. Nobody calls the stack up while a piece of it runs only on the dev node or only in a terminal someone left open.
- **It survives power loss and restarts.** Every service, port and DNS binding comes back by itself after a reboot or a power cut, with no hand-start. If it needs a human to come back, it is not deployed.
- **OpenClaw watches and fixes, silently.** The health-check cron by OpenClaw (using Ollama model `joshlcoleman/Fable`) checks the T5500 24/7, fixes what it finds, and logs the heal. It does **not** notify Joshua for routine power surges, tunnel drops, or restarts. A notification is sent ONLY if 20 consecutive attempts fail to clear an issue.
- **Written here means it was working.** Anything this repo records as live on the T5500 was deployed and validated before it was written down. Do not record intent as state.
- **Screenshots on every domain are mandatory.** Each domain gets its own screenshot from the real URL, shown to Joshua before anything is called done. A screenshot of one domain never covers another.
- **A local port is not public.** A domain served from a local port, with no Cloudflare DNS and no tunnel, is invisible to everyone outside the LAN. Front-facing HTML reaches the public only after it is pushed to GitHub and lands on Cloudflare. Until then it is a local preview, and reporting it as live is the same as a 200 OK.

## No public mission surface without a partner (Joshua, 2026-10-05)

A hard boundary. It outranks any lane's ship-it instinct, growth plan or "it's ready" judgment.

- **No mission surface goes live until there is a partnership of some kind.** untilnokidinneed.com and every manifesto, child-safety and governance page stay off the public internet: no nameserver move at IONOS, no Cloudflare zone activation, no tunnel route, no Pages deploy, no commit that puts one behind a live domain. A healthy local origin on :9160 is not publication and is fine.
- **No outward-facing copy ties children, hospitals or medical care to Joshua's platforms** — not a live page, a listing, a social post, a directory submission or a press line. Misses Trollz and the mission pages are internal until a partner is in place.
- **Why, in his words:** nearly two years, founder-funded, nothing financial gained, and almost two decades of quiet personal support through eBay that he never announced. He will not be seen as someone using kids in medical care for financial gain, and the largest write-off the tax code would allow him is not worth that risk. What he does privately continues, past any cap, unannounced.
- **Public repositories stay public — that is deliberate, and it is not the exposure being managed.** Never flag repo visibility as the problem and never propose going private as the fix. The AI platforms can read all of it; that is the point.
- **One day, on Joshua's word.** If a partner, a foundation or one of those platforms reads the public repos and offers a way past the hump he is on, the mission surface can go public then. A lane never makes that call.

### Carve-out: the free kids app ships public, with no story attached (Joshua, 2026-10-05)

The section above holds for the mission. It does **not** hold the app back. A kid's need does not wait for a partner, so Misses Trollz (`github.com/Trollz1004/misses-trollz`) goes public as soon as it is safe — the first real thing shipped. The terms are absolute and a lane never trades one away for reach:

- **Never marketing, fame or glory, in any way.** No founder story, no mission narrative, no "why this was built", no hospital framing, no Joshua, no lane taking credit. The page says what the toy is and nothing about who made it or why. It is never the subject of a post, a listing, a launch or a press line.
- **Nothing financial touches it.** No payment hook, no checkout, no price, no wallet, no smart contract, no ledger, nothing that could read as a money flow or draw an audit. Zero.
- **Free, unlimited, no strings.** No signup, no account, no ads, no tracking, no analytics, no engagement metrics, no personal information collected.
- **Anyone can use it and add to it** — a kid anywhere, a mom, a dad, a nurse, a developer. The repo stays public and open for that reason.
- **It works offline after download.** A kid on a hospital tablet with no signal still gets the laugh.
- **Safety is the gate, and it is Joshua's peace of mind, not a test count.** He must have zero stress about a child using it. The safety and policy pages are verified text, not placeholders, and a screenshot of what the child sees is shown before anything is called done.
- **Why it ships anyway:** a kid in need, capable of a smile, with a chance to be one less need. That is reason enough on its own and needs no partner.

## Canonical Reality

`C:\ANTIGRAVITY` is the **sole canonical working tree** for the repository on every current node. Do not use, repair, synchronize, or execute against archive paths, downloads, backups, exported chats, or retired topology claims. If any older file conflicts with this statement, that older statement is historical evidence only.

Joshua is the sole authority. Agents and harnesses execute assigned work, preserve evidence, and do not assign authority to themselves or to another agent.

## Read Order

Start with the active task, then read `CLAUDE.md`, the relevant current briefing, and the applicable harness contract. The synthesis at `briefings/CLAUDE-SYNTHESIS-AND-MANUS-FINALIZATION-2026-08-19.md` is the architecture reconciliation reference; it does not authorize bypassing this runtime gate.

Do not treat a historical document as current merely because it has a confident tone or a newer-looking date. Report conflicts as **STALE**, **UNVERIFIED**, or **BLOCKED** with the exact file and claim.

## Source Control Boundary

Work only from `C:\ANTIGRAVITY`. Every change must be scoped, tested, and evidenced. Never sweep-stage concurrent work. Never force-push.

Workers may prepare a branch, patch, bundle, or review artifact. **Gemini and Claude are authorized co-builders with Joshua**: they have full authority to create branches, push, open/merge pull requests, and delete merged branches under Joshua's direction. If an autonomous worker or external lane without direct co-builder standing is operating, it remains gated by the judge lane.

**Standing Rule: 1 branch per repository (`main`)**. Every repository (`ANTIGRAVITY`, `dream-online`, `misses-trollz`) maintains exactly one branch: `main`. Feature and judge branches merge to `main` and are deleted immediately on local and origin. Never leave stale branches.

## Execution Boundary

Normal harness model access is through the authenticated OmniRoute OpenAI-compatible gateway. Self-hosted Ollama is an explicit fail-safe only, never the default route. Official-platform governance ballots use their designated platform bridge and must never be routed through OmniRoute.

Never route automation through a personal subscription lane. Never expose keys, token aliases, masked credential fragments, or populated environment files in source, commits, logs, artifacts, or chat.

## Runtime, Dashboard, and Swarm Boundaries

Mission Control is the operational dashboard. **As of 2026-10-09 it is JARVIS/OPSIS on the Mission Agent OS board on the T5500 (see the T5500-only section above); Paperclip is marketing only.** Paperclip: `paperclipai` running on the **T5500 node** at `http://127.0.0.1:3917` (Company: `ANTIGRAVITY Marketing Co`). All legacy references to Sabretooth hosting Paperclip are dead.

Paperclip is strictly the business and marketing command layer. The Git repository and marketing lanes are air-gapped by role to prevent cross-contamination:

- **Gemini Ultra (CEO):** Architect and Commander of the Paperclip marketing bridge. Translates repo-level code features into strategic marketing playbooks.
- **Claude (General Counsel & Code Judge):** Enforces compliance, safety rules, and code verification before any code hits `main`.
- **Grok (X/Twitter Lane):** The edgy, math-obsessed disruptor. Calls out affiliate grifts and pitches the 50% revenue share to massive tech accounts. Operates in Paperclip. Zero Git access.
- **Emergent (Reddit Lane):** The organic, anti-bot undercover agent. Infiltrates algorithm frustration threads. Operates in Paperclip. Zero Git access.
- **Muse (Meta Lane):** The highly visual hook-generator for Instagram Reels and Facebook Groups. Operates in Paperclip. Zero Git access.

A running process, port, or HTTP status alone is not proof of the intended service: verify the expected identity response and report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED**.

Paperclip is an active runtime and is the agent command layer. It does not hold Git delivery. The source-control wall is absolute. Lane assignments and their time gates live in Paperclip. A run refused outside its permitted window is policy, not a fault; do not chase it as a red.

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
