# ANTIGRAVITY

Public monorepo for the YouAndINotAI platform and related web properties operated by Trash Or Treasure Online Recycler LLC.

## Ecosystem projects

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

## What this public README covers

- high-level product and stack context
- local development entry points
- the major product and dashboard surfaces tied to this repo
- the names of related private or internal surfaces at a high level

## What it intentionally does not cover

- private operational playbooks
- internal node topology
- credential handling
- unpublished reporting or recovery procedures
- provider-specific orchestration doctrine
- private repo internals beyond simple project identification

## Stack

- Frontend: React, Next.js, TypeScript
- Backend: FastAPI / Python services
- Commerce: Square
- Hosting: Cloudflare Pages and Google Cloud Run
- Operations: Windows-based multi-node build and support workflow

## Local development

```powershell
Set-Location C:\ANTIGRAVITY
npm install
```

Project-specific apps keep their own dependency and run instructions in their local folders.

## Public note

This repository intentionally keeps customer-facing product details separate from internal operational material. Public product claims should live on controlled web surfaces, not in repo doctrine.
