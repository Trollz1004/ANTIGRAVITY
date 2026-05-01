# Universal Ecosystem Sync

**Last updated:** 2026-04-21 (updated from 2026-03-31 snapshot)
**Node:** SABRETOOTH

---

## Repo Authority

1. `C:\ANTIGRAVITY` remains the only canonical live repo root
2. `main` / `origin/main` remains canonical git truth
3. `paperclip/agents/*/AGENTS.md` and `briefings/` remain canonical operating context
4. Vault docs (this file) defer to repo on any conflict

---

## Current Operating Doctrine

1. LLC-controlled revenue follows the founder-directed **10% minimum reserve** model (permanent 2026-04-17)
2. Do not treat older `60/30/10`, `100% charity`, or `100% DAO` language as current launch truth
3. Do not use "charitable cap" — the correct term is **"10% minimum reserve"**
4. The March 31 + April 17 doctrine corrections are survivability and tax-risk control decisions
5. Customer-facing language: **"contractual revenue disbursement"** only
6. Never: "donate", "donation", "solicitation", "charitable cap", "charity routing"

---

## Active Services (April 2026)

| Service | URL |
|---------|-----|
| Frontend | `https://youandinotai.com` |
| Paperclip HQ | `https://paperclip-hq.youandinotai.com` |
| Paperclip local | `http://127.0.0.1:3100` |
| Dashboard gateway | `https://dashboard.aidoesitall.website` |
| Cloudflare tunnel | `c7bc9665-3923-4977-acd7-2033838cd56e` |

> ⚠️ `mcp.youandinotai.com` is **retired**. Do not reference it in new docs.
> ⚠️ `dashboard.aidoesitall.website` — confirm still active.

---

## Paperclip

1. **Local:** `http://127.0.0.1:3100`
2. **Public HQ:** `https://paperclip-hq.youandinotai.com`
3. **Health check:** `/api/health` on both URLs
4. **Tunnel config:** `C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml`
5. **Bootstrap:** `C:\ANTIGRAVITY\scripts\autostart.ps1`
6. **Owner login note:** `PAPERCLIP-OWNER-LOGIN.txt` in vault root (not in git)

---

## Agent Stack (April 2026)

| Agent | Role | Model Tier |
|-------|------|-----------|
| CEO (Hermes) | Orchestration | Claude API / Codex API / korpohermes-prime |
| CTO | Build + deploy | Codex API |
| CMO | Marketing | joshlcoleman/dateapp-marketing |
| CFO | Finance | qwen3.5 local |
| CSO | DAO strategy | korpohermes-prime |
| UX Designer | Design | Claude API |
| Mission Guardian ×2 | Doctrine | Claude API + Codex API |
| Helper agents | Intern assist | OpenCode free / gemma2 local |

---

## Vault Cleanup Status

- ✅ Old Sabretooth snapshot folders removed from vault root
- ✅ Secret bundles and historical env exports in `RECOVERY-SECRETS-NOT-DOCTRINE\`
- ✅ Root continuity files updated to April 21 repo and doctrine truth
- ✅ Retired `mcp.youandinotai.com` references corrected
- ✅ "charitable cap" language corrected to "minimum reserve"

---

## Do Not Commit This File to Git

Vault docs stay in OneDrive only.
The repo is always the source of truth.
