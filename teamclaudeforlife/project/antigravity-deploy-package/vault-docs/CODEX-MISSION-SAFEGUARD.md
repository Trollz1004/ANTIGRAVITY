# Codex Mission Safeguard

**Last updated:** 2026-04-21 (updated from 2026-03-31 snapshot)
**Node:** SABRETOOTH
**Vault root:** C:\Users\joshl\OneDrive\Personal Vault-Sabretooth

---

## Purpose

- Preserve a clean off-repo continuity lane for launch-critical recovery
- Keep recovery notes and credentials outside normal runtime paths
- Reduce drift by pointing every recovery decision back to canonical repo docs

---

## Guardrails

- Do not treat this vault as a runtime source for OpenClaw, PaperClip, or any other orchestration path
- Do not treat recovery env files as policy or public-copy authority
- If a recovery file conflicts with `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`, **the repo wins**
- Service-specific credentials may differ from the Windows / OneDrive identity and must not be generalized into doctrine

---

## Current Recovery Truth

- **Repo:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **Head:** run `git rev-parse HEAD` on Sabretooth to confirm current — do not hardcode commit SHA in vault docs
- **Frontend:** `https://youandinotai.com`
- **Paperclip HQ (public):** `https://paperclip-hq.youandinotai.com` *(updated from mcp.youandinotai.com — retired)*
- **Paperclip local:** `http://127.0.0.1:3100`
- **Paperclip health:** `http://127.0.0.1:3100/api/health`
- **Dashboard gateway:** `https://dashboard.aidoesitall.website`
- **Owner login note:** `PAPERCLIP-OWNER-LOGIN.txt` *(filename without date — keep in vault root, not git)*

---

## Revenue Doctrine (Permanent — 2026-04-17)

- **1 wallet:** all platform revenue in, all costs out. No separate routing.
- **10% minimum reserve:** set aside from revenue. Josh's money — taxable income.
  He decides quarterly: donate, reinvest, stake, or hold.
- **Language:** "contractual revenue disbursement" only. Never "donate / donation / solicitation / charitable cap."
- Historical `60/30/10`, `100% charity`, `100% DAO`, `§496.405`, and `GospelDonation` language is **terminated**.
- This is a permanent survivability and tax-risk control decision.

---

## Mission Floor

- ENIGMA / OMEGA separation stays absolute
- Secrets stay out of git — always
- LLC-controlled revenue follows permanent 1-wallet / 10% reserve doctrine
- Canonical doctrine files:
  - `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`
  - `C:\ANTIGRAVITY\briefings\DAO-ARCHITECTURE-CANONICAL.md`

---

## Recovery Lane

- Active continuity docs remain in the root of this vault
- Secret bundles and historical env exports live under `RECOVERY-SECRETS-NOT-DOCTRINE\`
- **Do not commit this file to git** — it lives in OneDrive vault only

---

## What Changed in This Update (2026-04-21)

| Field | Old Value | New Value |
|-------|-----------|-----------|
| Paperclip URL | `mcp.youandinotai.com` | `paperclip-hq.youandinotai.com` |
| Head commit | hardcoded SHA | `git rev-parse HEAD` (do not hardcode) |
| Revenue language | "10% charitable cap" | "10% minimum reserve" |
| Login note filename | dated txt file | undated — keep one canonical copy |
