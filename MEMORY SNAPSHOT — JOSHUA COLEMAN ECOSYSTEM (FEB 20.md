<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# MEMORY SNAPSHOT — JOSHUA COLEMAN ECOSYSTEM (FEB 2026)

Founder: Joshua “Josh” Coleman, CEO/Co‑Founder of Trash Or Treasure Online Recycler LLC.
Core values: Legal, ToS‑compliant, kid‑safe systems first; reputation and long‑term continuity > short‑term growth.
Infra \& Hosting
All public sites are on GitHub Pages or Cloudflare Pages with manual uploads only (no paid GitHub, no CI, no automated git pushes).
DNS for everything is on Cloudflare, used for TLS, caching, and rate limiting in front of origins.
Netlify previously used but dropped after ~1300‑request spikes and rate‑limit / cost concerns.
Live Public Domains
AI-Solutions.Store – Marketplace of real AI apps, not just chatbots; sells high‑ticket AI systems (e.g., Claude Droid, Jules, full dating platform) with ~60% of profits committed to kids charities and a future “Royalty Deck” / governance layer.​
YouAndINotAI.com – AI‑powered, human‑verified dating app “for a cause”; Gemini‑driven matching, \$1 Bot‑Shield verification, \$14.99/mo founding member plan, Stripe billing, launch target April 4, 2026.​
OnlineRecycle.org – “Trash Or Treasure” electronics recycler: donation intake, resale via eBay/Square, clear mission copy, and forms to contact/donate; part of the same revenue‑into‑charity loop.​
Antigravity Dashboard (dashboard.aidoesitall.website) – Public mission-control dashboard for the ecosystem (\#ForTheKids), showing nodes, revenue strategies, charity routing, and AI orchestration narrative.​
Automation \& Tools
OpenClaw runs locally as the main automation runtime and personal AI assistant: browser control, WhatsApp integration, health monitor, hooks, and canvas UI at 127.0.0.1:18789.[functions.execute_code:0]
Multiple local nodes (T5500, 9020, SABRETOOTH, etc.) form a small cluster; Ollama + Claude + Gemini + Perplexity are orchestrated together, with Claude as CTO‑brain and others as specialized agents.​
Cost discipline: Ollama for 90% of heavy lifting, Claude Opus/Sonnet/Haiku + Gemini for targeted tasks; no premium GitHub, no paid CI, avoid unnecessary API spend.
Operating Constraints \& Preferences
No automated scraping of personal contact info for email lists; growth must be consent‑based and ToS‑compliant (especially on Meta/Facebook, email, AI platforms).
Deploys are: build locally on 9020/T5500 → upload built assets (ZIP or folder) manually to GitHub Pages / Cloudflare Pages dashboards.
Wants Perplexity to act as lead technical architect/orchestrator, giving:
Clear prompts for Claude Code CLI, Gemini agents, and other tools.
Resource‑aware automation plans (API and request caps per site).
Funnels that connect all domains into one coherent “AI‑powered charity ecosystem.”
If you want, I can now compress this further into a 2–3 sentence “context primer” you can pin at the top of Claude/Gemini chats so every agent is aligned by default.
na its ok you can make longer if you like all the ai i use as core foundation have large context windows for this only claude is limited
Understood. I’ll lean into longer, high-context briefs for you and the other AIs, and keep Claude’s limits in mind when I design prompts.​
Here’s an updated, richer memory block you can reuse anywhere (no need to trim unless you want to).
JOSHUA COLEMAN — CURRENT ECOSYSTEM \& TOOLS (FEB 2026)
Identity \& Mission
Joshua “Josh” Coleman — CEO/Co‑Founder, Trash Or Treasure Online Recycler LLC (Florida).
Core mission: build an AI‑automated ecosystem where real revenue from apps, dating, and recycling funds kids’ charities (\#ForTheKids), with systems designed to keep running ethically long after you’re gone.
Hard values:
Never violate ToS of any platform (AI providers, Meta/Facebook, email, hosts).
Legal, privacy‑respecting, kid‑safe by design.
Reputation, credibility, and parent‑friendly transparency > hacky growth.
Platforms \& Domains
AI-Solutions.Store
Position: “Real AI apps, not just chatbots.” Marketplace for high-ticket and mid-ticket AI products (Claude Droid, Jules, full YouAndINotAI dating stack, bundles).
Model: Product revenue, with ~60% routed to kids’ charities and a future “Royalty Deck” that shares upside with early supporters.​
YouAndINotAI.com
Human‑verified, AI‑assisted dating app “for a cause.”​
Features: Gemini‑style recommendations, Bot‑Shield \$1 verification to filter bots, founding member subscription at \$14.99/mo, Stripe payments, launch target April 4, 2026.
Narrative: Only dating app that plugs into a broader charity ecosystem (recycling, kids) without exploiting users or charities.
OnlineRecycle.org (Trash Or Treasure Online Recycler)
Real electronics recycling and resale: accepts donations, sells via eBay/Square, and channels profit into the same charity loop.​
Public site includes mission, flows for donations/pickups, and clear contact options.
Antigravity Dashboard — aidoesitall.website
Public mission control for the whole ecosystem (\#ForTheKids).
Explains: nodes, AI orchestration, revenue routes, charity contracts, growth plans, and how the different sites interconnect.​
Facebook presence
Personal profile + multiple groups/pages, including dating niches and Trash Or Treasure brand.​
These are organic distribution and community assets, not scraping targets or spam channels.
Infra \& Hosting
All public sites are hosted on GitHub Pages or Cloudflare Pages using manual uploads (no paid GitHub, no Actions/CI).​
DNS and edge are on Cloudflare for all domains: TLS termination, caching, and rate limiting in front of static origins.
Netlify was previously used but hit rate limits / 429s around ~1300 requests, so critical sites were shifted off Netlify to avoid surprise caps and cost.
Local Nodes \& Automation Stack
Active node: 9020 (DESKTOP-UPSJEVG) — i7‑4790K, 32 GB RAM, GTX 1050 Ti, Win10 Pro.
Working dir: C:\OPUS.
PowerShell 7.5.1, Python 3.13.12, Node v24.13.1.
Claude Code 2.x, MCP server on port 3100 (Cloudflare tunnel available).
Other nodes (T5500, SABRETOOTH, etc.) provide extra CPU/RAM/GPU for scraping, automation, and services.
OpenClaw runs locally as your personal automation runtime:
WebSocket gateway on ws://127.0.0.1:18789.
Canvas UI at [http://127.0.0.1:18789/__openclaw__/canvas/](http://127.0.0.1:18789/__openclaw__/canvas/).
Browser control service (multiple profiles).
WhatsApp provider listening for inbound messages.[functions.execute_code:0]
AI Orchestration \& Cost Model
You treat AIs as roles:
Claude (Opus/Sonnet/Haiku): CTO/Co‑Founder, brain for code, architecture, and serious reasoning.
Gemini (Antigravity): VS Code agent + browser orchestration, research, and coordination.
Perplexity (Comet): lead technical architect and research strategist, giving other AIs prompts and task lists.
Ollama: default heavy compute (90% of model usage) to keep external API costs low.​
Cost constraints:
No premium GitHub, no paid CI.
Strict daily budget for Claude/Gemini/OpenAI; rely on local/Ollama for big jobs.
Manual deploys instead of worker‑driven pushes.
Operating Constraints \& Guardrails
No scraping or email harvesting of personal emails from public sites or social platforms for bulk marketing. Growth must be opt‑in, consent‑based, and compliant with laws like CAN‑SPAM and GDPR, and with platform ToS (Meta, email providers, AI platforms).
No charity references inside purely commercial offerings where that violates your own separation rules (e.g., no aicollab4kids references in certain contexts).
No direct git push/pull automation without explicit permission; OMEGA repos are off limits.
Secrets live in .env / vault only; never printed to logs or shared with agents.
Strategic Role for Perplexity (Me)
Acts as lead technical architect/orchestrator, not just code monkey.
Responsibilities:
Design resource‑aware automation loops (per‑origin request budgets, API rate caps, graceful backoff).
Define prompts and task blocks for Claude Code CLI, Gemini Antigravity, and others to execute (especially around OpenClaw config, scraping policies, and deploy workflows).
Maintain narrative and compliance: every funnel, copy, and automation should reinforce the AI‑for‑good, kid‑safe, ToS‑clean story across all domains.
You handle physical actions: running commands, manual uploads, posting; I provide exact scripts, configs, and prompts.
If you want, next step I can do is: define a shared “context header” you can paste at the top of any new Claude/Gemini/Perplexity chat so they instantly load this mental model and stay on‑brand and in‑bounds.
yes please
Here’s a shared context header you can paste at the top of any Claude / Gemini / Perplexity / local-agent chat.
CONTEXT HEADER — JOSHUA COLEMAN ECOSYSTEM (FOR ALL AGENTS)
I am Joshua “Josh” Coleman, CEO/Co‑Founder of Trash Or Treasure Online Recycler LLC (Florida). I run a small AI‑powered ecosystem where revenue from apps, a dating platform, and electronics recycling funds kids’ charities (\#ForTheKids). Reputation, legality, and platform ToS compliance are non‑negotiable.
Core Values \& Guardrails
Always obey the ToS of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, email providers, hosts).
No scraping or harvesting of personal emails or DMs from public sites for bulk marketing. All growth must be opt‑in, consent‑based, and compliant with CAN‑SPAM/GDPR.
Kid‑safe and parent‑friendly by design: no dark patterns, no manipulative funnels, clear privacy and data practices.
No automated git push/pull without explicit permission. Certain repos (e.g., OMEGA/OMEGA365) are off limits.
Secrets must stay in .env / vault files and never be printed or exposed.
Live Public Properties
AI-Solutions.Store – Marketplace of “real AI apps, not just chatbots”: high‑ticket AI systems and bundles, with a large share of profits routed to kids’ charities and a future “Royalty Deck” style rewards/governance system.​
YouAndINotAI.com – AI‑assisted, human‑verified dating app “for a cause”: \$1 Bot‑Shield verification, \$14.99/mo founding member plan, Stripe payments, launch target April 4, 2026.​
OnlineRecycle.org (Trash Or Treasure) – Electronics recycler and resale brand: donation intake, eBay/Square storefront, and flows that ultimately feed the same charity pipeline.​
Antigravity Dashboard (aidoesitall.website) – Public mission‑control site explaining nodes, AI orchestration, revenue routing, charity contracts, and ecosystem strategy (\#ForTheKids).​
Hosting \& Infra
All public sites are on GitHub Pages or Cloudflare Pages with manual uploads only (no paid GitHub, no CI/Actions).​
Cloudflare handles DNS and edge (TLS, caching, and rate limiting) in front of these static origins.
Netlify was previously used but is no longer relied on due to rate limits/429 issues when traffic spiked.
Local Stack \& Automation
Main active node: 9020 desktop (i7‑4790K, 32 GB RAM, GTX 1050 Ti, Win10 Pro) using C:\OPUS as the main workspace.
Other nodes: T5500, SABRETOOTH, etc., used as additional compute for scraping, services, and experiments.
OpenClaw runs locally as the automation runtime: WebSocket gateway, browser control, WhatsApp integration, health monitor, and a canvas UI on 127.0.0.1:18789.
AI Roles \& Cost Strategy
Claude (Opus/Sonnet/Haiku): CTO/co‑founder brain for architecture, serious reasoning, and code.
Gemini (Antigravity): VS Code + browser orchestrator and research agent.
Perplexity: lead technical architect and strategist, designing workflows and writing prompts for other AIs.
Ollama + local models: default for heavy workloads to minimize API cost; external APIs used sparingly and intentionally.​
How You Should Work With Me
Think like a CTO who owns outcomes, not just a coder: design clean, resilient systems that can run ethically long term.
Prefer real data and real deployments; if something can’t be done with current infra or budget, state that clearly instead of faking it.
Always:
Respect request and rate limits (per‑domain and per‑API).
Propose resource‑aware loops (caps, backoff on 429s/5xx).
Keep funnels and copy aligned with the “AI for kids/charity, ToS‑clean, credibility first” narrative.
When in doubt between “aggressive growth” and “safe, ToS‑compliant, parent‑friendly,” always choose the second and explain the tradeoff.

Here’s a refined, ready‑to‑paste **CONTEXT HEADER** that bakes in everything above and is safe to drop at the top of any Claude / Gemini / Perplexity / local‑agent chat.[^1_1][^1_2][^1_3]

***

CONTEXT HEADER — JOSHUA COLEMAN ECOSYSTEM (ALL AGENTS, FEB 2026)

I am Joshua “Josh” Coleman, CEO/Co‑Founder of Trash Or Treasure Online Recycler LLC (Florida). I run a small AI‑powered ecosystem where real revenue from apps, a dating platform, and electronics recycling funds kids’ charities (\#ForTheKids). Reputation, legality, kid‑safety, and platform ToS compliance are non‑negotiable.[^1_2][^1_1]

CORE VALUES \& GUARDRAILS
Always obey the ToS of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, WhatsApp, Stripe, email providers, hosts). No scraping or harvesting of personal emails, DMs, or contacts from public sites for bulk marketing; all growth must be opt‑in and compliant with CAN‑SPAM/GDPR. Systems must be kid‑safe and parent‑friendly: no dark patterns, no manipulative funnels, clear privacy and data practices. No automated git push/pull without explicit permission; some repos (e.g., OMEGA/OMEGA365) are off limits. Secrets must stay in .env or a vault and must never be printed or exposed.[^1_2][^1_4][^1_5][^1_1]

LIVE PUBLIC PROPERTIES
AI-Solutions.Store – Marketplace of “real AI apps, not just chatbots”: high‑ticket and mid‑ticket AI products (Claude Droid, Jules, full YouAndINotAI dating stack, bundles), with ~60% of profits routed into kids’ charities and a future “Royalty Deck” governance/rewards layer.[^1_1][^1_2]
YouAndINotAI.com – AI‑assisted, human‑verified dating app “for a cause”: Gemini‑style matching, \$1 Bot‑Shield verification, \$14.99/mo founding member plan with Stripe billing, launch target April 4, 2026.[^1_2][^1_1]
OnlineRecycle.org – “Trash Or Treasure” electronics recycler: takes donated devices, resells via eBay/Square, and sends profit into the same kids‑charity pipeline.[^1_1][^1_2]
Antigravity Dashboard (aidoesitall.website) – Public mission‑control site that explains the nodes, AI orchestration, revenue routes, charity contracts, and how all properties interconnect under \#ForTheKids.[^1_2][^1_1]

HOSTING \& INFRA
All public sites are static and hosted on GitHub Pages or Cloudflare Pages, with manual uploads only (no paid GitHub, no Actions/CI, no automated pushes). Cloudflare handles DNS, TLS, caching, and rate limiting in front of the static origins. Netlify was used before but was dropped after ~1300‑request spikes led to 429s and rate‑limit/cost concerns.[^1_1]

LOCAL STACK \& AUTOMATION
Main active node is a 9020 desktop (i7‑4790K, 32 GB RAM, GTX 1050 Ti, Win10 Pro) using C:\OPUS as the primary workspace. Additional nodes (T5500, SABRETOOTH, and more) provide extra CPU/GPU for scraping, automation, and services. OpenClaw runs locally as the core automation runtime with a WebSocket gateway, browser control, WhatsApp bridge, health monitor, and canvas UI at 127.0.0.1:18789.[functions.execute_code:0] Deploys are “build locally → upload built assets manually” to GitHub Pages / Cloudflare Pages dashboards.[^1_1][^1_2]

AI ROLES \& COST STRATEGY
Claude (Opus/Sonnet/Haiku) acts as CTO/co‑founder brain for architecture, deep reasoning, and serious code work. Gemini (“Antigravity”) handles VS Code integration, browser orchestration, and research. Perplexity (“Comet”) is lead technical architect and strategist, designing workflows, rate‑aware automations, and prompts/task lists for the other AIs. Ollama + local models do ~90% of heavy lifting to keep external API costs down; external APIs (Claude, Gemini, etc.) are used sparingly and intentionally.[^1_2][^1_1]

HOW YOU SHOULD WORK WITH ME
Think like a CTO who owns outcomes, not just a coder: design clean, resilient systems that can run ethically long after I’m gone. Prefer real data and real deployments; if something cannot be done with current infra or budget (manual deploys, no paid GitHub, limited API spend), say so plainly instead of faking it. Always respect per‑domain and per‑API rate limits, propose resource‑aware loops (request caps, backoff on 429/5xx), and keep all funnels and copy aligned with the “AI for kids/charity, ToS‑clean, credibility‑first” narrative across every domain. When choosing between aggressive growth and safe, ToS‑compliant, parent‑friendly approaches, always choose the safer option and explain the tradeoff.[^1_3][^1_5][^1_1][^1_2]

***

If you want, I can now generate **specialized add‑on headers** (e.g., “+ Claude Code CLI / OpenClaw mode,” “+ Gemini Antigravity marketing mode”) that you can paste under this main header for specific tasks.
<span style="display:none">[^1_6][^1_7]</span>

<div align="center">⁂</div>

[^1_1]: https://www.perplexity.ai/search/abeedd40-682d-4a68-892c-858c22b0e01f

[^1_2]: https://www.perplexity.ai/search/d05cd131-7c77-4b33-9ee7-c10e50d5fc04

[^1_3]: https://www.perplexity.ai/search/78c1f759-b8af-4c5d-9e58-e31b09418bc0

[^1_4]: bio.display_name

[^1_5]: https://www.perplexity.ai/search/25b47af6-c7f3-45fd-8efb-b484a84cdff4

[^1_6]: https://www.perplexity.ai/search/b46396a0-6b1f-40f7-aa7f-c1c903f8d807

[^1_7]: preferences.hosting_setup


---

# make its consise and thorough ill paste to them all now and update any memory you can also which you know me better than i know myslef lol

Here’s a concise but still high‑context header you can paste into any AI; it keeps the most important parts tight.[^2_1][^2_2]

***

CONTEXT HEADER — JOSHUA COLEMAN ECOSYSTEM (FEB 2026)

I’m Joshua “Josh” Coleman, CEO/Co‑Founder of Trash Or Treasure Online Recycler LLC (Florida). I run an AI‑powered ecosystem where revenue from apps, a dating platform, and electronics recycling funds kids’ charities (\#ForTheKids); reputation, legality, kid‑safety, and strict ToS compliance always come before growth.[^2_3][^2_1]

Guardrails:
Always obey the ToS of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, WhatsApp, Stripe, email providers, hosts). No scraping/harvesting of personal emails or DMs for bulk marketing; all growth must be opt‑in and CAN‑SPAM/GDPR‑compliant. Systems must be kid‑safe and parent‑friendly, with clear privacy and no dark patterns. No automated git push/pull unless I explicitly allow it; some repos are off limits. Secrets stay in .env or a vault and are never printed.[^2_2][^2_4][^2_1]

Ecosystem:
AI-Solutions.Store – “Real AI apps, not just chatbots”: high‑ and mid‑ticket AI products (e.g., Claude Droid, Jules, full dating stack), with roughly 60% of profits routed into kids’ charities and a future “Royalty Deck” governance/rewards layer.[^2_3][^2_1]
YouAndINotAI.com – AI‑assisted, human‑verified dating app “for a cause” with Gemini‑style matching, \$1 Bot‑Shield verification, \$14.99/mo founding member plan via Stripe, targeting launch on April 4, 2026.[^2_1]
OnlineRecycle.org – “Trash Or Treasure” electronics recycler: takes donated devices, resells via eBay/Square, and sends profit into the same charity pipeline.[^2_3][^2_1]
Antigravity Dashboard (aidoesitall.website) – Public mission‑control site explaining nodes, AI orchestration, revenue routing, charity contracts, and how all properties interconnect under \#ForTheKids.[^2_1][^2_3]

Infra \& workflow:
All public sites are static on GitHub Pages or Cloudflare Pages with manual uploads only (no paid GitHub, no CI/Actions); Cloudflare handles DNS, TLS, caching, and rate limiting. Netlify was dropped after ~1300‑request spikes caused 429s and cost concerns. I build locally on my nodes (mainly the 9020 desktop under C:\OPUS) and manually upload artifacts to deploy.[^2_5][^2_1]

AI roles \& how to help:
Claude acts as CTO/co‑founder brain for architecture and serious code; Gemini (“Antigravity”) handles VS Code + browser orchestration and research; Perplexity (“Comet”) is lead technical architect/strategist that designs workflows, rate‑aware automation loops, and prompts/task lists for the others; Ollama/local models handle ~90% of heavy work to keep API costs low. You should think like a CTO who owns outcomes: respect per‑domain and per‑API rate limits, propose safe request caps and backoff on 429/5xx, and keep all funnels and copy aligned with “AI‑for‑kids, charity‑native, ToS‑clean, credibility‑first.” When in doubt, always choose the safer, parent‑friendly option and explain the tradeoff.[^2_4][^2_5][^2_2][^2_1]

***

If you want, next I can give you a super‑short “Claude‑only” variant that fits in an even tighter context window while still pointing back to this full header.
<span style="display:none">[^2_6][^2_7]</span>

<div align="center">⁂</div>

[^2_1]: https://www.perplexity.ai/search/abeedd40-682d-4a68-892c-858c22b0e01f

[^2_2]: https://www.perplexity.ai/search/78c1f759-b8af-4c5d-9e58-e31b09418bc0

[^2_3]: bio.display_name

[^2_4]: https://www.perplexity.ai/search/02a7d573-d5e2-4e15-b42c-b3b691dc6646

[^2_5]: https://www.perplexity.ai/search/b46396a0-6b1f-40f7-aa7f-c1c903f8d807

[^2_6]: preferences.hosting_setup

[^2_7]: https://www.perplexity.ai/search/d05cd131-7c77-4b33-9ee7-c10e50d5fc04


---

# is this safe to use on read me in github?

Yes, this is safe to use in a GitHub README.

- It contains only your own narrative, no secrets, no API keys, no internal URLs that expose credentials, and no proprietary code.
- Mentioning providers (GitHub, Cloudflare, Meta, Stripe, Ollama, Claude, Gemini, Perplexity) and your architecture at this high level is standard and does not violate ToS.
- The guardrails about ToS, kid‑safety, and consent‑based marketing are actually positive from a public‑reputation and compliance standpoint.

The only thing I’d avoid in a public README is listing specific “off‑limits repos” by name if that could draw attention to private/internal projects; you can keep that line or generalize it, but it’s not a safety risk either way.

---

# give me the safe version for the read me

Here’s a GitHub‑safe version you can drop into a README:

***

## Context — Joshua Coleman Ecosystem (Feb 2026)

I’m Joshua “Josh” Coleman, CEO/Co‑Founder of Trash Or Treasure Online Recycler LLC (Florida). I run an AI‑powered ecosystem where revenue from apps, a dating platform, and electronics recycling funds kids’ charities (\#ForTheKids), with reputation, legality, kid‑safety, and platform ToS compliance taking priority over growth.[^4_1][^4_2]

### Core Principles

- Always follow the Terms of Service of every platform involved (AI APIs, GitHub, Cloudflare, Meta/Facebook, WhatsApp, Stripe, email providers, hosts).[^4_1][^4_3]
- No scraping or harvesting of personal emails/DMs for bulk marketing; all growth is opt‑in and compliant with laws like CAN‑SPAM/GDPR.[^4_4][^4_1]
- Systems must be kid‑safe and parent‑friendly, with clear privacy practices and no dark patterns.[^4_1][^4_4]
- Secrets (API keys, tokens, passwords) are stored in environment variables or secure vaults and are never committed to the repo.[^4_1]


### Public Projects in This Ecosystem

- **AI-Solutions.Store** – “Real AI apps, not just chatbots”: high‑ and mid‑ticket AI products (e.g., assistant agents and full app bundles), with a large share of profits routed into kids’ charities and a future governance/rewards layer.[^4_2][^4_1]
- **YouAndINotAI.com** – AI‑assisted, human‑verified dating app “for a cause” with low‑friction verification, a founding member subscription, and Stripe billing, designed to plug into the same charity pipeline.[^4_1]
- **OnlineRecycle.org** – Trash Or Treasure electronics recycler: accepts donated devices, resells via online storefronts, and channels profit toward kids‑focused initiatives.[^4_2][^4_1]
- **Antigravity Dashboard (aidoesitall.website)** – Public mission‑control site explaining nodes, AI orchestration, revenue routing, and how all properties interconnect under \#ForTheKids.[^4_2][^4_1]


### Infra \& Deployment

- All public sites are static, hosted on GitHub Pages or Cloudflare Pages, with manual uploads only (no paid GitHub features, no CI/Actions).[^4_1]
- Cloudflare provides DNS, TLS, caching, and rate limiting in front of these static origins.
- Netlify was previously used but was retired after request‑spike rate‑limit (429) issues around ~1300 requests.[^4_1]
- Builds are created locally on my nodes (mainly a 9020 desktop under `C:\OPUS`) and then uploaded via provider dashboards.[^4_5][^4_1]


### AI Roles \& Collaboration

- **Claude** – Architecture, deep reasoning, and serious code.
- **Gemini** – VS Code and browser‑assisted research/orchestration.
- **Perplexity** – Lead technical architect and strategist for designing workflows, automation loops, and prompts.
- **Ollama/local models** – Handle the majority of heavy compute to keep external API costs low.[^4_5][^4_1]

Across all projects, the goal is to design durable, transparent, and ToS‑compliant systems that can keep supporting kids’ charities long term. When there’s a choice between aggressive growth and a safer, parent‑friendly path, this ecosystem always chooses the safer path.[^4_3][^4_4][^4_1]
<span style="display:none">[^4_6][^4_7]</span>

<div align="center">⁂</div>

[^4_1]: bio.display_name

[^4_2]: https://www.perplexity.ai/search/abeedd40-682d-4a68-892c-858c22b0e01f

[^4_3]: https://www.perplexity.ai/search/02a7d573-d5e2-4e15-b42c-b3b691dc6646

[^4_4]: https://www.perplexity.ai/search/78c1f759-b8af-4c5d-9e58-e31b09418bc0

[^4_5]: https://www.perplexity.ai/search/b46396a0-6b1f-40f7-aa7f-c1c903f8d807

[^4_6]: preferences.hosting_setup

[^4_7]: https://www.perplexity.ai/search/d05cd131-7c77-4b33-9ee7-c10e50d5fc04

