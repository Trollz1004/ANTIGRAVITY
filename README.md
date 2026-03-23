# ANTIGRAVITY

Public monorepo for the YouAndINotAI platform and related web properties operated by Trash Or Treasure Online Recycler LLC.

## Public products

| Project | Purpose |
| ------- | ------- |
| [YouAndINotAI](https://youandinotai.com/) | Human-focused social platform with verification, moderation, and subscription flows. |
| [OnlineRecycle](https://onlinerecycle.org/) | Central Florida electronics recycling, secure device intake, and resale. |
| [AI-Solutions Store](https://ai-solutions.store/) | Separate storefront for digital products and automation offers. |
| [Antigravity Dashboard](https://dashboard.aidoesitall.website/) | Public status surface for verified site state and published updates. |

## What this public README covers

- high-level product and stack context
- local development entry points
- the public deployment surfaces tied to this repo

## What it intentionally does not cover

- private operational playbooks
- internal node topology
- credential handling
- unpublished reporting or recovery procedures
- provider-specific orchestration doctrine

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
