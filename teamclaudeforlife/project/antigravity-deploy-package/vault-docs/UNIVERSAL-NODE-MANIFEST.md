# Universal Node Manifest

**Last updated:** 2026-04-21 (updated from 2026-03-31 snapshot)
**Node:** SABRETOOTH
**Vault root:** C:\Users\joshl\OneDrive\Personal Vault-Sabretooth

---

## Current Continuity Set

- `ANTIGRAVITY-MEMORY-SNAPSHOT-[date].md` *(keep latest only)*
- `UNIVERSAL-SYNC-[date].md` *(keep latest only)*
- `CODEX-MISSION-SAFEGUARD.md`
- `PAPERCLIP-OWNER-LOGIN.txt` *(undated — one canonical copy)*
- `RECOVERY-SECRETS-NOT-DOCTRINE\`

---

## Current Repo Truth

- **Canonical repo:** `C:\ANTIGRAVITY`
- **Canonical branch:** `main`
- **Canonical head:** run `git rev-parse HEAD` on Sabretooth — do not hardcode SHA in vault docs
- **Sandbox repo:** confirm existence before referencing — `E:\sandbox-repo` may have been cleaned

---

## Active Service URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | `https://youandinotai.com` | Active |
| Paperclip HQ (public) | `https://paperclip-hq.youandinotai.com` | Active *(replaces mcp.youandinotai.com)* |
| Paperclip local | `http://127.0.0.1:3100` | Active |
| Dashboard gateway | `https://dashboard.aidoesitall.website` | Confirm active |
| Ollama local | `http://127.0.0.1:11434` | Active |
| Hermes CEO | `http://127.0.0.1:5555` | Active |
| Cloudflare tunnel | `c7bc9665-3923-4977-acd7-2033838cd56e` | Active |

---

## Current Operating Doctrine

1. LLC-controlled revenue follows the founder-directed **10% minimum reserve** model (permanent 2026-04-17)
2. Do not treat older `60/30/10`, `100% charity`, or `100% DAO` language as current launch truth
3. Do not use "charitable cap" — correct term is "minimum reserve"
4. The revenue doctrine is a survivability and tax-risk control decision, not a compromise
5. Josh decides quarterly: donate, reinvest, stake, or hold the reserve — his money, his call

---

## Canonical Doctrine Files (repo wins over vault on conflicts)

- `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`
- `C:\ANTIGRAVITY\briefings\DAO-ARCHITECTURE-CANONICAL.md`
- `C:\ANTIGRAVITY\briefings\DAO-TOKEN-DESCRIPTIONS-COMPLIANT-2026-04-19.md`
- `C:\ANTIGRAVITY\paperclip\agents\ceo\AGENTS.md`

---

## The Four DAOs

| DAO | Token | Platform | Purpose |
|-----|-------|----------|---------|
| Love DAO | $LOVE | youandinotai.com | Platform governance |
| #UntilNoKidInNeed | $UKID | ai-solutions.store | AI oversight & tools |
| AiGreenTeam | $GREEN | onlinerecycle.org | Sustainability |
| Antigravity DAO | $AGRAV | aidoesitall.website | Shared infrastructure |

2.5M tokens per DAO. 10M hard cap total. DAOs are governance — **not charity vehicles**.

---

## Vault Cleanup Status (2026-03-31 + 2026-04-21)

- ✅ Old dated snapshot clutter removed from vault root
- ✅ Superseded PaperClip bootstrap invite note retired
- ✅ Secret bundles, env copies, historical exports moved to `RECOVERY-SECRETS-NOT-DOCTRINE\`
- ✅ `mcp.youandinotai.com` replaced with `paperclip-hq.youandinotai.com` throughout
- ✅ "10% charitable cap" language corrected to "10% minimum reserve"
- ✅ Hardcoded commit SHAs removed — use `git rev-parse HEAD` at runtime
- ⚠️ Sandbox repo (`E:\sandbox-repo`) — confirm still exists before referencing

---

## Do Not Commit This File to Git

This manifest lives in OneDrive vault only.
It exists to recover from catastrophic local loss.
The repo is always the source of truth for everything else.
