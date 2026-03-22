# PROJECT STATE — LIVE BASELINE

**Last Updated:** 2026-03-22

This file is the short-form current state. For canonical repo truth, use:

- `C:\ANTIGRAVITY\AGENTS.md`
- `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`
- `C:\ANTIGRAVITY\memory\activeContext.md`
- `C:\ANTIGRAVITY\briefings\LIVE-PAYMENT-SOURCE-OF-TRUTH.md`

## Current Live Repo

| Field | Value |
|-------|-------|
| Authoritative root | `C:\ANTIGRAVITY` |
| Branch | `main` |
| Head | `main` (see git for current commit) |
| Worktree | Clean on March 22, 2026 |
| Frontend | Cloudflare Pages |
| Backend | FastAPI + PostgreSQL on Cloud Run |
| Payments | Square |
| OpenClaw | Local Sabretooth gateway on `127.0.0.1:18789` with Ollama-only model routing |
| Ollama | Local on `127.0.0.1:11434` |
| Sandbox repo | `https://github.com/Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY.git` |

## Product Truth

- **YouAndINotAI** remains the primary active product in this repo.
- **Cloudflare Pages** frontend is live and again reaches the real backend through the fixed worker proxy.
- **Cloud Run backend** was restored on March 19, 2026 and now serves the correct FastAPI application.
- **Backend test suite** passed with `67` tests on March 19, 2026.
- **Crossfire on 9020** now runs with a local FastAPI backend on port `8000` and Vite frontend on port `5173`.
- **SupportClaw on 9020** now runs outside the repo at `C:\SUPPORTCLAW-9020` and answers on `http://192.168.0.5:18895`.

## Operational Truth

- Sabretooth is the authoritative live node and current command post.
- The continuity backup root on this machine is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`.
- The continuity env backups fully cover the populated keys in the live `.env`.
- Imported node/GCR/Codex credentials from `C:\Downloads` were moved into the approved vault holding file at `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\GLOBALNODE-CREDENTIALS-2026-03-21.env`; the loose Downloads copy was removed.
- Josh's standing operating principle is transparency and no locked doors: approved infrastructure, routing, and recovery-critical truth should remain documented and recoverable through the repo and approved vault path, not hidden in private agent context.
- The live OpenClaw configs on Sabretooth, 9020, and T5500 are now self-hosted only for model inference.
- T5500 was used to execute the backend recovery deploy.
- Sabretooth `E:` is now reserved for the Claude Dispatch / coworker lane at `E:\claudes-claw`.
- 9020 is now the active node for crossfire, marketing workloads, isolated date-app support on `C:`, and the sandboxed openclaw/support lane on `D:`.
- T5500 no longer carries the temporary support runtime and is free for heavier media/video workloads; its `E:\ANTIGRAVITY-CLABOTS` root is now the Manus / Crossfire / media sandbox lane.
- Legacy DAO/platform repos are design recovery sources only, not live implementation truth; approved recovery candidates are tracked in `C:\ANTIGRAVITY\briefings\DAO-RECOVERY-CANDIDATES.md`.
- Future brainstorming, experimental platforms, and unapproved new product work now start in the dedicated sandbox repo, not in `C:\ANTIGRAVITY`.
- 9020 still has five stale scheduled tasks that need one elevated admin disable pass; the lane itself is already populated and support/date-app paths were left untouched.

## Account Routing Note

- `ebaytrashortreasure@gmail.com` is reserved for the live date-app payment lane only. Current approved uses: YouAndINotAI Square and YouAndINotAI PayPal.
- `joshlcoleman@gmail.com` is the primary ops identity for Codex/OpenAI and the non-date-app commerce lanes, including OnlineRecycle, the crosslister, eBay, Facebook, and future non-date-app Square work.
- `aicollab4kids@gmail.com` is the current Google Business / Claude-side identity.
- Passwords, password patterns, and other secrets must never be written into repo memory files or chat history; continuity copies stay in the vault and credential manager only.

## Known Gaps

1. The stale `CLOUDFLARE_API_TOKEN` in `.env` remains documentation debt, but not a live deploy blocker.
2. Docker is not part of the current Sabretooth baseline.
3. `crossfire` on 9020 still relies on detached processes rather than a service manager.
