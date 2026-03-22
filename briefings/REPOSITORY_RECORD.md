# REPOSITORY RECORD — SABRETOOTH LIVE STATE

> **Date:** March 22, 2026
> **Status:** `main` clean, frontend/backend live, node sandbox lanes isolated
> **Authority:** Joshua Coleman

---

## Repository Truth

- **Authoritative root:** `C:\ANTIGRAVITY`
- **Git truth:** `main` on Sabretooth, pushed to `origin/main`
- **Worktree state:** clean after restoring the live API path, repairing the Cloud Run workflow, and revalidating the stack
- **Secrets posture:** secrets stay in local `.env` and the Sabretooth continuity vault only
- **Transparency rule:** approved infrastructure, routing, and recovery-critical operational truth stay documented in repo briefings/memory or the approved continuity vault path; no intentional locked-door continuity model
- **Continuity vault root:** `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`
- **Continuity files:** `ENVwhen ai loses.env`, `UNIVERSAL-NODE.env`, `UNIVERSAL-NODE-MANIFEST.md`, `CODEX-MISSION-SAFEGUARD.md`
- **Sandbox repo for new/unapproved work:** `https://github.com/Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY.git`

## Current Runtime Truth

| Component | State | Notes |
|-----------|-------|-------|
| Sabretooth repo | LIVE | `C:\ANTIGRAVITY` on `main` |
| Frontend | LIVE | `https://youandinotai.com/api/v1/health` returns healthy JSON |
| Backend | LIVE | Cloud Run service `dateapp-backend` in `us-east1` fully configured (Square + SMTP) |
| Backend revision | LIVE | Revision `dateapp-backend-00028-zsk` serving the repaired beta-access flow |
| GitHub deploy workflow | PASS | `deploy-gcr.yml` fixed; workflow run `23308309685` succeeded |
| Backend tests | PASS | Targeted live auth/payment suite `22 passed` after the March 22 repair |
| OpenClaw gateway | LIVE | `http://127.0.0.1:18789/healthz` |
| OpenClaw model runtime | LIVE | Sabretooth, 9020, and T5500 configs are self-hosted only (Ollama/local inference; no cloud model providers) |
| Ollama | LIVE | `http://127.0.0.1:11434/api/tags` |
| Continuity env backup | CURRENT | Vault backup covers every populated key from live `.env` |
| 9020 crossfire backend | LIVE | Python 3.12 installed; `http://localhost:8000/api/health` returns `{"status":"ok"}` |
| 9020 crossfire frontend | LIVE | Vite dev server responding on `http://localhost:5173` |
| 9020 SupportClaw | LIVE | Isolated support gateway at `http://192.168.0.5:18895` with Telegram disabled and state outside the repo |
| 9020 sandbox lane | ISOLATED | `D:\claws\openclaw-9020` populated from sanitized Sabretooth export; stale relaunch tasks disabled in the elevated admin pass |
| T5500 Manus lane | ISOLATED | `E:\ANTIGRAVITY-CLAWBOTS\manus-claw\ForTheKids-Guardian` materially restored from sanitized Sabretooth export |
| T5500 Manus dashboard | VALIDATED | new scaffold imported; `corepack pnpm install --frozen-lockfile`, `pnpm check`, and `pnpm build` all passed |
| Sabretooth Claude lane | ISOLATED | `E:\claudes-claw` remains the Claude Dispatch / coworker lane |

## Product State

- **Primary product:** YouAndINotAI
- **Frontend host:** Cloudflare Pages
- **Backend host:** Google Cloud Run
- **Backend stack:** FastAPI + PostgreSQL + Square
- **Live API contract restored:** Pages worker now proxies `/api/v1/*` directly to the Cloud Run backend without the stale adapter layer
- **Runtime config restored:** Square Location ID corrected to `LY5GN09F5AN83`; SMTP configured for `aicollab4kids@gmail.com`
- **New Feature:** LoveBot premium love consultant (compatibility, quotes, tips, gift ideas) added to API
- **Runtime deps restored:** missing scheduler/file runtime deps were added to `requirements.txt`
- **Live auth flow restored:** beta access codes and authenticated `/api/v1/auth/me` now work live again
- **Manus dashboard scaffold restored:** T5500 imported the updated dashboard zip, replaced the incomplete flat export, and built the project successfully

## Operational Notes

- **Cloudflare deploy auth:** Wrangler OAuth is the active deploy path; the stale `.env` API token is not the production auth mechanism
- **OpenClaw model baseline:** Sabretooth now runs `qwen2.5:7b` primary, `qwen2.5:3b` fallback, and `nomic-embed-text` for memory search with no cloud model providers in the live config
- **Cloud Run source deploy:** the repaired GitHub workflow now deploys from `youandinotai-api` source instead of the broken container path
- **T5500 role:** used for backend recovery and deploy execution when Sabretooth needed the live service restored; its temporary support container is now offline so the box can stay available for heavier media/build work
- **Sabretooth secondary-drive role:** `E:\claudes-claw` is reserved for Claude Dispatch / coworker work only
- **9020 node role:** crossfire, marketing workloads, the isolated date-app SupportClaw on `C:`, and the openclaw/support sandbox lane on `D:`
- **T5500 secondary-drive role:** `E:\ANTIGRAVITY-CLAWBOTS` is the isolated Manus / Crossfire / media sandbox root
- **T5500 Manus dashboard validation note:** build passed with analytics placeholder warnings in `index.html`; runtime boot looks possible but was not fully proven beyond a short non-failing process start
- **Node repo state:** Sabretooth, 9020, and T5500 are all back on `main` at the same GitHub commit
- **Legacy DAO/platform material:** old repos and archived briefs are recovery-library inputs only; reusable elements must be ported intentionally into the current repo baseline. See `briefings/DAO-RECOVERY-CANDIDATES.md`.
- **Sandbox policy:** future experimental or brainstorming work starts in the sandbox repo, not in `C:\ANTIGRAVITY`.
- **Account routing note:** `ebaytrashortreasure@gmail.com` stays reserved for the live date-app payment lane only; `joshlcoleman@gmail.com` is the primary non-date-app ops identity (Codex/OpenAI, OnlineRecycle, crosslister, eBay, Facebook, future non-date-app Square); `aicollab4kids@gmail.com` remains the current Google Business / Claude-side identity.
- **Secrets posture addendum:** passwords, password patterns, and other credentials do not belong in repo memory files; continuity copies stay in the vault and credential manager only.

## Current Open Items

1. **Vault continuity snapshots should stay in sync with any future real credential change.**
2. **The stale Cloudflare API token in `.env` is still informational debt, not an operational blocker.**
3. **`crossfire` on 9020 still uses detached processes; convert those to scheduled tasks or services if reboot persistence is required.**
4. **T5500 Manus dashboard now builds, but runtime boot is only partially verified and analytics placeholders still warn until real values are supplied.**

## Recent Pushed Commits

- `9d9e92d` `chore: clean repo clutter and externalize news runtime`
- `610560e` `feat: add guided live support lanes`
- `346facc` `fix: align cloud run workflow with source deploy`
- `0ac16cc` `fix: include scheduler runtime dependencies`
- `95fd3d5` `fix: restore cloud run api compatibility`

---

*This file is the repo-level state summary for Sabretooth as of March 22, 2026.*
