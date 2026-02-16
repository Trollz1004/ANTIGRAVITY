# PROJECT STATE — COMPLETE SYSTEM MAP

**Last Updated**: 2026-02-14T08:30:00Z

## Active Repos

| Repo                          | Owner              | Purpose                              | Status               |
| ----------------------------- | ------------------ | ------------------------------------ | -------------------- |
| Kraken_Assist_Local_Disk_9020 | Trollz1004         | REVENUE-CORE dashboard (React SPA)   | ACTIVE — main branch |
| ENIGMA-private                | Trollz1004         | Internal ops, scripts, opus-ai tools | ACTIVE               |
| youandinotai                  | youandinotai       | DateApp platform code                | PRIVATE              |
| onlinerecycle                 | onlinerecycle      | Crosslister for bridge funding       | PRIVATE              |
| ai-solutions-store            | Ai-Solutions-Store | Charity storefront                   | PRIVATE              |
| aicollab4kids                 | aicollab4kids      | Charity ops                          | PRIVATE              |
| aidoesitall-dashboard         | aicollabforkids    | Public transparency                  | PUBLIC               |
| Finding-ClaudeMo              | Trollz1004         | Pinned tribute repo                  | PRESERVED            |

## The 4 Duplicate Date Apps (THE MEMORY PROBLEM)

Joshua has built the SAME date app 4 times across different platforms because Claude loses context:

1. **GCP Cloud Run** — FastAPI backend, Cloud SQL PostgreSQL (ACTIVE — was thought banned, confirmed NOT banned)
2. **AWS EC2** — Backup backend (3.84.226.108, Nginx+FastAPI)
3. **Railway** — Dead deployment (API CNAME pointed here, now broken)
4. **This repo (Kraken/9020)** — React SPA dashboard, no backend, client-side only

**THIS MUST NEVER HAPPEN AGAIN. The memory-bank prevents it.**

## Node Architecture

| Node       | IP           | Role                            | Drive                                          | Status                                                |
| ---------- | ------------ | ------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| SABRETOOTH | 192.168.0.8  | Master Orchestrator / Dev       | C:\OPUSONLY (when SSDs back in)                | Primary dev machine — SSDs removed, will have C: only |
| 9020       | 192.168.0.5  | Secondary Dev / Network Storage | C: (OS 465GB), D: (OPUSONLY 447GB)             | CURRENT MACHINE — 2 drives only                       |
| T5500      | 192.168.0.15 | Marketing + Ollama              | C: (OS only, will have C:\OPUSONLY when setup) | SSDs removed, ready for setup                         |
| AWS-EC2    | 3.84.226.108 | Cloud Backend                   | -                                              | FastAPI on port 8000, PM2 managed                     |

## Domains

| Domain               | DNS              | Current State                                      |
| -------------------- | ---------------- | -------------------------------------------------- |
| youandinotai.com     | Cloudflare       | HTTP 530 — dead tunnel origin (T5500 was wiped)    |
| api.youandinotai.com | Cloudflare CNAME | DEAD — points to Railway, MUST change to Cloud Run |
| www.youandinotai.com | Cloudflare       | Broken — same as root                              |
| youandinotai.online  | Cloudflare       | Redirect domain — leave alone                      |

**Cloudflare Account ID**: 516a3a855f44f5ad8453636d163ae25d  
**Dead Tunnel to DELETE**: e7de7653-980c-49fc-a116-4a05871025ae

## Backend (What Actually Works)

- **Cloud Run URL**: https://dateapp-backend-io5tscl75a-ue.a.run.app (HTTP 200, 52 endpoints)  
  GCP project `ai-collab4kids` is ACTIVE (NOT banned)
- **AWS EC2**: 3.84.226.108 (FastAPI port 8000, PM2: `dateapp-backend`)
- **Database**: Cloud SQL `dateapp-db` (PostgreSQL 15, IP: 104.196.70.232, 6 tables: users, profiles, matches, messages, subscriptions, payments)
- **Stripe**: $1 AuthHold for human verification (void after verify)

## This Repo (Kraken_Assist_Local_Disk_9020)

- **Purpose**: REVENUE-CORE MISSION-CONTROL dashboard
- **Stack**: React 19 + TypeScript + Vite 6 + Tailwind CDN
- **Port**: 3000 (or 3001 if occupied)
- **Branch**: main (ONLY)
- **AI**: Was Gemini SDK (out of 300 credits), switching to Claude 100%
- **State**: Client-side SPA, localStorage persistence, MISSION-CONTROL Active
