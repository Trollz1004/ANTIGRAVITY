# S1 Doctrine Supersession — ACTIVE

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

## Node map (Joshua, 2026-10-05): wins over every older node claim

- **T5500 (`T5500-2-XEON-72`, `192.168.0.15`) is the production node.** It runs every live domain, the date app (frontend :3200, API :8000), Postgres :5432, Redis :6379, Ollama, the domains server :9160 and the cloudflared tunnel. Its keep-alive writes `C:\ANTIGRAVITY\ops\t5500\status.json` and `C:\ANTIGRAVITY\logs\t5500-keepalive.log`; it heals on its own and logs every heal.
- **Alienware (`192.168.0.40`) is the dev node** and hosts Mission Control: JARVIS/OPSIS on :9150, operated by Hermes in the terminal. DREAM Online is built and tested there.
- **Sabretooth (`192.168.0.8`) is retired and OFF by ruling.** Its work moved to the T5500 from the same SSD. Never probe, start, heal or route to it; show it as OFF BY RULING, never DOWN. Every `192.168.0.8` address and every "Sabretooth runs X" line in this repo is history.
- Other old boxes (OptiPlex 9020, i7k, Chromebook, Mini ASUS) stay OFF by ruling.
- **Domains:** youandinotai.com is live behind the Cloudflare tunnel. onlinerecycle.net, dream-online.net and untilnokidinneed.com have a healthy origin and wait on nameservers. The AI store domain is undecided: do not renew it and do not build on it.
- **Business Hermes:** a separate Hermes profile (not OPSIS) runs onlinerecycle.net, the date app and customer support on the Ollama models `joshlcoleman/fable` and `joshlcoleman/cfo` only, with health checks that fix on sight.
- **Editors and lanes:** each node gets the Antigravity editor (VS Code-based) with Claude as a signed-in extension (never an API key), with Gemini and Claude as co-builders and pair-programmers with full code, create, push, merge, and delete authority alongside Joshua. Hermes runs in the terminal as JARVIS/OPSIS. The build prompt for OPSIS and Gemini's updated instructions are in `ops/handoffs/OPSIS-MISSION-AGENT-OS-2026-10-05.md` and `ops/handoffs/GEMINI-SPARK-INSTRUCTIONS-2026-10-05.md`.
- **Never** introduce an `ANTHROPIC_API_KEY`. Official Claude is login/OAuth only.

## T5500 deployed, self-healing, and public only once it is pushed (Joshua, 2026-10-05)

Joshua's standing preference, not a one-time task. These lines are part of what "done" means under Rule one.

- **100 percent deployed on the T5500.** The full stack runs in production on the T5500 — every domain, its DNS, and every port it serves. Nobody calls the stack up while a piece of it runs only on the dev node or only in a terminal someone left open.
- **It survives power loss and restarts.** Every service, port and DNS binding comes back by itself after a reboot or a power cut, with no hand-start. If it needs a human to come back, it is not deployed.
- **Hermes watches and fixes, silently.** The health-check cron on Hermes (using Ollama model `joshlcoleman/Fable`) checks the T5500 24/7, fixes what it finds, and logs the heal. It does **not** notify Joshua for routine power surges, tunnel drops, or restarts. A notification is sent ONLY if 20 consecutive attempts fail to clear an issue.
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
