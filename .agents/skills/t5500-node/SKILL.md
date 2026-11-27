---
name: t5500-node
description: The finished state of the T5500 production node (192.168.0.15) and how to prove it. Load before touching any service, port, scheduled task, tunnel or watchdog on this node, and after every reboot.
---

# T5500 node: finished state

T5500 (`192.168.0.15`) is the Front-of-House production node in the two-node `Trollz1004` fleet (`ops/fleet/fleet-map.json`: Alienware `192.168.0.40` Workshop + T5500 `192.168.0.15` Front-of-House). It is finished when `ops\t5500\verify-node.ps1` reports every line UP after a cold reboot, with nobody starting anything by hand.

## Prove it

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\t5500\verify-node.ps1
```

Wait about 5 minutes after logon first (the keepalive stages settle in order). The script only reads. It writes `ops\t5500\node-final-state.json`. Any line that is not UP is the work list.

## What comes back by itself, and what brings it back

| Service | Port | Brought back by |
|---|---|---|
| Ollama (joshlcoleman/fable) | 11434 | keepalive (`ANTIGRAVITY T5500 Keepalive`, boot + logon + every 10 min, elevated) |
| PostgreSQL | 5432 | keepalive |
| Redis | 6379 | keepalive |
| Domains server | 9160 | keepalive |
| Date app frontend / API | 3200 / 8000 | keepalive |
| Cloudflare tunnel | — | keepalive (`~\.cloudflared\config.yml`) |
| Hermes support desk | — | keepalive |
| OmniRoute | 20128 | `ANTIGRAVITY OmniRoute` |
| Mission Control (Mission OS / OPSis) | 3130 | `ANTIGRAVITY Mission Control` |
| Hermes Dashboard (for Mission OS `:3130`) | 9119 | `ANTIGRAVITY Hermes Dashboard` |
| Shared `ai-memory` MCP | 49374 | fleet shared memory service (`192.168.0.15:49374`) |
| Hermes Telegram gateway | — | `Hermes_Gateway` |
| Hermes gateway API (A2A, adapters) | 8643 | same `Hermes_Gateway` process; `platforms.api_server` in `%LOCALAPPDATA%\hermes\config.yaml` |
| OpenClaw sentry window (watchdog) | — | `ANTIGRAVITY Agent Windows` (opens `openclaw-sentry.ps1` and `hermes-support.ps1`, reopens if closed) |
| Hermes watch cron `T5500 node watch` | — | Hermes gateway cron, every 10 min. Not a sentry duty since 2026-10-17 (OpenClaw is the only sentry); switching it off is Joshua's call |
| Domains Static Server | 9160 | keepalive (`youandinotai.com`, `onlinerecycle.net`, `dream-online.net`) |
| Obsidian REST (vault `C:\ANTIGRAVITY\Antigravity`) | 27123 | Obsidian app at logon (bind `"127.0.0.1"` on port `27123`, reachable on `192.168.0.15:27123`) |

The keepalive also probes Supabase, Supermemory and Vercel and writes everything to `ops\t5500\status.json`.

## Who may touch the node

- **The keep-alive heals; OpenClaw is the dedicated 24/7 watchdog/sentry on the T5500** (Joshua, 2026-10-17). OpenClaw's sentry window monitors all ports, domains, and tunnels continuously and heals issues silently (zero notification spam). Hermes handles customer support, YouTube automation, and Mission Control. Codex no longer watches the node.
- **Hermes (OPSIS)** runs support, the YouTube cron and Mission Control's brain. It does not rebuild the node.
- **Gemini** works only in `mission-os/`; Claude validates and lands it.
- **The 100% rule:** not 100% proven, not pushed; not validated by Claude, not merged.
- **Marketing workflows in Mission OS (`:3130/marketing`)** (and Emergent) work on posts, affiliate links and URLs. They do not alter T5500 infrastructure directly.
- Code changes land through a pull request, one branch per repo, branch deleted after merge.

## Hard rules

- No tunnel route for untilnokidinneed.com or any mission page until Joshua names a partner (CLAUDE.md). The check reports it.
- Keep production hosting strictly on T5500 (`192.168.0.15`); route workshop, DREAM Engine (`:9180`), Lead-Gen (`:8392`), Media/TTS (`:8391`), OPSis Studio (`:8390`), and Free Claude Code (`:8082`) to Alienware (`192.168.0.40`). Never probe or route to retired third-node hosts.
- No `ANTHROPIC_API_KEY`. CLI lanes are login/OAuth only.
- Retired third-party coordination engines stay off (`:3100` / `:3917` retired).

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
