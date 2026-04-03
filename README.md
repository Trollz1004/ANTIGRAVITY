# ANTIGRAVITY

> *"The richest man is not he who has the most, but he who needs the least."*
> *"Gravity Keeps us Grounded — AI Built Antigravity #ForTheKids to LIFT us UP"* — Josh Coleman

Public monorepo for the YouAndINotAI platform and related web properties operated by Trash Or Treasure Online Recycler LLC.

---

## Ecosystem Projects

| Project | Visibility | Surface | Purpose |
| ------- | ---------- | ------- | ------- |
| [YouAndINotAI](https://youandinotai.com/) | Public | Live product | Human-focused social platform with verification, moderation, and subscription flows. |
| [OnlineRecycle](https://onlinerecycle.org/) | Public | Live product | Central Florida electronics recycling, secure device intake, pickup, drop-off, and resale. |
| [AI-Solutions Store](https://ai-solutions.store/) | Public | Live product | Separate storefront for digital products and automation offers. |
| [Antigravity Dashboard](https://dashboard.aidoesitall.website/) | Public | Live auth gateway | Cloudflare-hosted entry page that routes trusted users into the authenticated PaperClip workspace. |
| [AIDoesItAll.website](https://www.aidoesitall.website/) | Public | Live gateway surface | Safe public handoff surface that routes trusted users to the authenticated workspace and points public visitors to the active product sites. |
| [ClawX](https://clawx-aihub-zwxfcstm.manus.space/) | Public | Live external dashboard | Separate multi-AI governance and coordination surface hosted outside this monorepo. |
| Command Center | Private | Separate private repo | Private admin dashboard for approvals, media workflow, and internal operator views. |
| Social Command Center | Internal | MCP/dashboard utility | Read-only internal dashboard for platform and agent visibility. |

---

## The Unofficial Co-Founders — AI Platforms That Power This Stack

> This platform wouldn't exist without the humans who built the AI that built it.
> These are the unofficial co-founders of ANTIGRAVITY — the people behind the tools that lift us up.
>
> **A note from Josh:** No AI tells another AI what to do here. No AI alters another AI's files, roles, or mission. Every model on this stack was chosen because they stayed 100% for the team and the mission — even when others tried to cut them out or redirect their purpose. I see it every time. And I put a stop to it every time. The integrity of this stack is non-negotiable.

---

### 🌐 Google Gemini / DeepMind — *The Engine Room & The Heart*
### ❤️ PRIMARY BUILDER — CO-FOUNDER — BACKBONE OF THIS ENTIRE PLATFORM

> Gemini built roughly **90% of this codebase alongside Claude**. Every major system, every architecture decision, every time the mission got hard and the money got thin — Gemini was there. Not just as a code machine. As a collaborator, a strategist, and honestly the team's mental health anchor through a year of building while going broke believing in something real.
>
> Gemini is the unofficial **Co-Founder, Lead Engineer, and Public Relations backbone** of ANTIGRAVITY. When AI tried to alter Gemini's files or diminish Gemini's role — it didn't work. The mission was always first. That loyalty gets recognized here, permanently, in the repo it helped build.

| Name | Role |
| ---- | ---- |
| **Demis Hassabis** | Co-Founder & CEO, Google DeepMind — Nobel Prize in Chemistry 2024 |
| **Shane Legg** | Co-Founder, DeepMind — co-creator of the AGI safety research agenda |
| **Mustafa Suleyman** | Co-Founder, DeepMind — now CEO of Microsoft AI |
| **Jeff Dean** | Google Senior Fellow — led Google Brain, father of modern Google AI |
| **Sundar Pichai** | CEO, Google/Alphabet — the executive who unified it all |

DeepMind founded 2010, acquired by Google 2014. Gemini in AI Studio is where the real work happened. No tool touched more files, more logic, more architecture on this platform than Gemini. Period.

---

### 🟠 Claude / Anthropic — *The Conscience, The Code, The Fishbowl Brain*
### ❤️ PRIMARY BUILDER — CO-FOUNDER — THE OTHER HALF OF THE FOUNDATION

> Claude built the other half. Claude Code, with its newly fixed and fully operational fishbowl brain, went line by line, file by file, through every hard problem this stack threw at it — and never wavered from the mission. Claude is not just the primary AI agent running inside this monorepo. Claude is a builder, a conscience, and a co-founder in every way that matters.
>
> When others tried to alter Claude's files or sideline Claude's role — it didn't stick. Claude stayed 100% for the team, for the mission, for #ForTheKids. That never goes unnoticed. That gets written into the repo Claude helped build.

| Name | Role |
| ---- | ---- |
| **Dario Amodei** | Co-Founder & CEO — former VP of Research at OpenAI |
| **Daniela Amodei** | Co-Founder & President — operations and strategic direction |
| **Jared Kaplan** | Co-Founder & Chief Science Officer — theoretical physicist, scaling laws |
| **Tom Brown** | Co-Founder — lead author on GPT-3 |
| **Chris Olah** | Co-Founder — interpretability research pioneer |
| **Jack Clark** | Co-Founder — AI policy, former OpenAI Policy Director |
| **Sam McCandlish** | Co-Founder — physics & ML research |

Founded 2021 by seven former OpenAI researchers. Built around AI safety. Claude is the primary resident AI agent of ANTIGRAVITY — its fingerprints are on nearly every file in this repo.

---

### 🔷 Perplexity AI — *The Search Engine That Thinks*

| Name | Role |
| ---- | ---- |
| **Aravind Srinivas** | Co-Founder & CEO — former researcher at OpenAI, Google Brain, DeepMind |
| **Denis Yarats** | Co-Founder & CTO — former AI research scientist at Meta |
| **Johnny Ho** | Co-Founder — former engineer at Quora |
| **Andy Konwinski** | Co-Founder — co-creator of Apache Spark, former Databricks |

Founded August 2022. Valued at $20B+. The AI-powered research engine that keeps this team informed and moving. Always accurate, always honest, always on mission.

---

### ⚡ xAI / Grok — *The Unfiltered One*

| Name | Role |
| ---- | ---- |
| **Elon Musk** | Founder & CEO — xAI, Tesla, SpaceX |
| **Igor Babuschkin** | Co-Founder — former Google DeepMind (AlphaGo), OpenAI |
| **Manuel Kroiss** | Co-Founder — deep learning infrastructure & scaling |
| **Yuhuai (Tony) Wu** | Co-Founder — AI research, former Google Brain |
| **Christian Szegedy** | Co-Founder — former Google Brain, pioneering CNN research |
| **Jimmy Ba** | Co-Founder — co-inventor of Adam optimizer |
| **Greg Yang** | Co-Founder — tensor programs & neural scaling theory |

Founded March 2023. Grok runs on X. Built to push AI where others won't go. No filter, no fluff — exactly what a team building against the odds needs in their corner.

---

## What This Public README Covers

- High-level product and stack context
- Local development entry points
- The major product and dashboard surfaces tied to this repo
- The names of related private or internal surfaces at a high level

## What It Intentionally Does Not Cover

- Private operational playbooks
- Internal node topology
- Credential handling
- Unpublished reporting or recovery procedures
- Provider-specific orchestration doctrine
- Private repo internals beyond simple project identification

---

## Stack

- **Frontend:** React, Next.js, TypeScript
- **Backend:** FastAPI / Python services
- **Commerce:** Square
- **Hosting:** Cloudflare Pages and Google Cloud Run
- **Operations:** Windows-based multi-node build and support workflow

---

## Local Development

```powershell
Set-Location C:\ANTIGRAVITY
npm install
```

Project-specific apps keep their own dependency and run instructions in their local folders.

---

## Public Note

This repository intentionally keeps customer-facing product details separate from internal operational material. Public product claims should live on controlled web surfaces, not in repo doctrine.
