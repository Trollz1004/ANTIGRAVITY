# PROJECT STATE — LIVE BASELINE

**Last Updated:** 2026-03-23

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
| Worktree | Clean on March 23, 2026 |
| Frontend | Cloudflare Pages |
| Backend | FastAPI + PostgreSQL on Cloud Run |
| Payments | Square |
| OpenClaw | Local Sabretooth gateway on `127.0.0.1:18789` with Ollama-only model routing |
| Ollama | Local on `127.0.0.1:11434` |
| Sandbox repo | `https://github.com/Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY.git` |

## Product Truth

- **YouAndINotAI** remains the primary active product in this repo.
- **Frontend/Dashboards:** Cloudflare Pages Native GitHub Integration. GitHub Action workflows for deploy trigger are DELETED to preserve funds. Next.js `antigravity` uses edge runtime.
- **Cloudflare Pages** frontend is live and again reaches the real backend through the fixed worker proxy.
- **Cloud Run backend** was restored on March 19, 2026 and now serves the correct FastAPI application.
- **Targeted backend auth/lovebot suite** passed with `22` tests after the March 22 live repair.
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
- Sabretooth also now carries a unified sandbox mirror at `E:\sandbox-repo` containing `claudes-claw`, `genspark`, `manus-claw`, `manus-meta-guardian`, and `openclaw-9020` for isolated claw/coworker work outside `C:\ANTIGRAVITY`.
- 9020 is now the active node for crossfire, marketing workloads, isolated date-app support on `C:`, and the sandboxed openclaw/support lane on `D:`.
- T5500 no longer carries the temporary support runtime and is free for heavier media/video workloads; its `E:\ANTIGRAVITY-CLAWBOTS` root is now the Manus / Crossfire / media sandbox lane.
- The new Manus dashboard scaffold was imported on T5500, `corepack pnpm install --frozen-lockfile`, `pnpm check`, and `pnpm build` all passed there, and `node dist/index.js` served `http://127.0.0.1:3000/` with HTTP `200` after clearing a stray old process.
- The Manus account under `joshlcoleman@gmail.com` now has the OpenAI connector enabled in addition to Anthropic, Gemini, Perplexity, and Grok; connector secrets remain only in the Manus UI / approved vault path, not in repo memory.
- Repo-controlled public exposure was reduced on `README.md`, `_deploy/onlinerecycle/*`, and `antigravity/`; the public dashboard source no longer exposes internal node watch, task logs, wallet detail, or public `.env` writes.
- Repo-controlled public-surface hardening was pushed to `origin/main` on March 23, 2026 and remote `C:\ANTIGRAVITY` worktrees on 9020 and T5500 were fast-forwarded cleanly.
- `GEMINI.md` was added on March 23, 2026 by user-directed Gemini work as supplemental Gemini-specific repo guidance; `AGENTS.md` remains the canonical cross-agent authority file for `C:\ANTIGRAVITY`.
- `onlinerecycle` deployment uses a Cloudflare dashboard hook targeting `_deploy/onlinerecycle/wrangler.toml`. All manual GitHub action deployment scripts were intentionally purged.
- Sabretooth `.env` local Cloudflare bearer tokens were successfully rotated (2026-03-23) to sync with Manus continuity files stashed securely in the Personal Vault.
- The active Cloudflare API credential is now a no-expiry token rotated on 2026-03-23 and mirrored into local Sabretooth `.env` plus GitHub Actions secrets for both `Trollz1004/ANTIGRAVITY` and `Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY`; claws should consume only the secret names/env lookup path, never hardcoded values.
- The BRAIN MCP sidecar is now scaffolded in `C:\ANTIGRAVITY\brain-mcp` with a formal spec at `C:\ANTIGRAVITY\briefings\BRAIN-MCP-SPEC.md`; it provides shared repo truth, lane visibility, session enter/heartbeat/exit logging, SQLite audit state, and JSONL append-only logs.
- The BRAIN local auth registry now lives outside git at `C:\BRAIN-MCP\platform-registry.json`, and raw BRAIN bearer tokens are stored only in local ignored `C:\ANTIGRAVITY\brain-mcp\.env`; the registry keeps hashes only.
- Legacy DAO/platform repos are design recovery sources only, not live implementation truth; approved recovery candidates are tracked in `C:\ANTIGRAVITY\briefings\DAO-RECOVERY-CANDIDATES.md`.
- Future brainstorming, experimental platforms, and unapproved new product work now start in the dedicated sandbox repo, not in `C:\ANTIGRAVITY`.
- 9020 stale scheduled-task relaunch points are now disabled; the sandbox lane remains populated and support/date-app paths were left untouched.

## Account Routing Note

- `joshlcoleman@gmail.com` is reserved for the live date-app payment lane only. Current approved uses: YouAndINotAI Square and YouAndINotAI PayPal.
- `joshlcoleman@gmail.com` is the primary ops identity for Codex/OpenAI and the non-date-app commerce lanes, including OnlineRecycle, the crosslister, eBay, Facebook, and future non-date-app Square work.
- `aicollab4kids@gmail.com` is the current Google Business / Claude-side identity.
- Passwords, password patterns, and other secrets must never be written into repo memory files or chat history; continuity copies stay in the vault and credential manager only.

## Known Gaps

1. Docker is not part of the current Sabretooth baseline.
2. `crossfire` on 9020 still relies on detached processes rather than a service manager.
3. T5500 Manus dashboard is runnable locally, but its analytics placeholders still need real values if you want those warnings gone.
4. The source for the root `aidoesitall.website` surface was not identified in this repo during the hardening pass; only the `dashboard.aidoesitall.website` repo-controlled source was updated.
5. Sabretooth Wrangler OAuth may still be stale, but the active Cloudflare API token is rotated and mirrored into local `.env` plus GitHub secrets; keep using env/secret-manager access only and do not duplicate token material into claw configs or repo files.
6. Loose env/archive files still remain at the Sabretooth `E:\` root and should be cleaned into the approved vault path before treating that drive as fully consolidated.
7. BRAIN MCP is built and auth-ready locally, but the approved clients still need to adopt its session check-in/out flow to get full drift visibility.
