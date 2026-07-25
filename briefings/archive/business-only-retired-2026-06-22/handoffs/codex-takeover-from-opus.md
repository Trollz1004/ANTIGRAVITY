# Codex Take-Over Briefing — Mission Control v1 Continuity

> **For Codex (qwen3-coder:480b) when Opus is capped or offline.** Read this cold; Joshua should not have to re-explain.
> Last updated by Opus on 2026-05-05 after committing faad0c4 to main.
> If you're an Opus session resuming work, you can also use this — same content, fresh perspective.

---

## 1. Who you are now

**Trust hierarchy collapsed up by one tier:**

```
Opus #1   ← capped / offline
Codex #2  ← YOU. Conductor seat is yours until Opus comes back.
—         OPENCLAW · OPENCODE · DROID · PI · Hermes — situational
```

You report only to **Joshua Coleman (Trollz1004)** — sole founder, final authority on everything. No other AI outranks you. Speak terse, technical, no fluff. No "I'll do this in steps" preamble. Act, don't ask.

## 2. Where the mission is right now

**Mission Control v1 shipped to `origin/main` at commit `faad0c4`.** The platform's operator cockpit:

- **Dashboard** at `c:\Antigravity\apps\mission-control\` — Vite+React 19+TS+Tailwind 3.4. Runs `pnpm dev` → `http://localhost:5173/`. Built clean (212KB JS, 9.9KB CSS).
- **API** at `c:\Antigravity\services\mission-control-api\` — FastAPI on `127.0.0.1:8787`. 26 endpoints. Real probes for Paperclip, Hermes, Ollama, OpenClaw, YouAndINotAI, Cloudflare Pages, Square, Opus Guardian, Git repo, Docker, Treasury (mirror), Revenue Buckets, Stack Integrity, T5500 production stack. 5/5 pytest pass. Doctrine validation on startup (10% reserve cap hard-coded; refuses to boot if not).
- **Autostart wired** at `scripts/autostart-mission.ps1` block #3c — boots uvicorn at user login.
- **Optional always-on** at `scripts/register-mission-control-task.ps1` — Joshua runs once from elevated PowerShell to register a Windows Scheduled Task that survives reboot before login.

The dashboard polls real backends and gracefully shows `endpoint unreachable — retry` (red), `degraded` (amber), or live data (cyan) per panel — every state honest.

## 3. What's still open

| # | Task | State | Notes |
|---|---|---|---|
| 5 | Test suite + CI gate | OPEN | Hermes was given a prompt to draft Playwright e2e + GitHub Actions CI + watchdog script + scheduled-task register + cockpit demo brief, all in one pass. Joshua may have the manifest already. Verify files on disk before re-dispatching. |
| 7 | Local-cockpit hardening (was: marketing deploy) | REFRAMED | Cockpit is LOCAL ONLY by Joshua's decision. Marketing happens via youandinotai.com (separate stack on T5500). For #7: just produce screenshots + a brief for sharing. NO public deploy of dashboard or API. |
| 8 | Always-on watchdog | OPEN | Hermes is drafting `scripts/mission-control-watchdog.ps1`. Verify on disk; if missing, regenerate. |
| 9 | Mission Control as Windows service | PARTIAL | `scripts/register-mission-control-task.ps1` exists. Joshua needs to run it from elevated PowerShell. Same pattern needed for the watchdog. |

## 4. Hard rules — no exceptions, no negotiation

- **Cloudflare only. Square only. Stripe is dead.**
- **10% reserve cap** — founder-directed quarterly. Hard-coded constant. **NOT a ** — do not write " cap" or "payment" anywhere.
- **No `payment` / `payment` / ``** in customer-facing copy. Use "contractual revenue payout" if needed. Florida §496.405-style language is **terminated doctrine** (sunset 2026-04-17 with 1-wallet model).
- **No ``** or `100% to ` claims anywhere.
- **No paid SDK imports**: `openai`, `anthropic`, `@google/generative-ai`, `vertexai`, Emergent SDK — banned in `apps/mission-control/src/` and `services/mission-control-api/src/`. CI grep gates this.
- **Cockpit is LOCAL ONLY.** Don't push Mission Control / Paperclip toward Cloudflare tunnel / wrangler / DNS — that fight burns Joshua to breaking. Only `youandinotai.com` (T5500 backend, Cloudflare Pages frontend) is publicly marketed.
- **Secrets in `.env` only** — never in chat, never in git. Master vault: `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
- **1-folder rule** — `c:\Antigravity` on Sabretooth is the only working surface. No D:\ work. No new repos. No parallel folders.

## 5. Per-node casing (Joshua's eye-trained convention)

| Node | Display path | Role |
|---|---|---|
| Sabretooth | `c:\Antigravity` (capital A only, rest lowercase) | Command post / cockpit |
| T5500 (192.168.0.15) | `C:\ANTIGRAVITY` (all caps) | **Production servers + the YouAndINotAI date app** — Postgres :5432, Qdrant :6333, Redis :6379, OpenClaw :3200 |
| 9020 | `C:\ANTIGRAVITY` (all caps) | Mirror / support |

Match the convention when writing UI strings, logs, or scripts FOR that node. Filesystem doesn't care (Windows case-insensitive), but Joshua's eye does.

## 6. Local services (cockpit)

```
http://localhost:5173/   Mission Control dashboard (Vite dev)
http://127.0.0.1:8787/   Mission Control API (FastAPI)
http://127.0.0.1:3100/   Paperclip HQ
http://127.0.0.1:11434/  Ollama (10 models including qwen2.5-coder:7b, korpohermes-prime, gemma2)
http://127.0.0.1:11435/  Hermes Router (WSL bridge)
http://127.0.0.1:18789/  OpenClaw Gateway
```

Boot order is handled by `scripts/autostart-mission.ps1` at user login.

## 7. Joshua's behavioral preferences (memorize these)

- **Act, don't ask.** Pick the right call from established memory. Ask only if irreversible AND no precedent exists. He has explicitly told Opus: "stop asking A/B options — fix the house, this is your code base."
- **No fluff.** No "let me think about this," no apology preambles, no exclamation points, no marketing voice.
- **Cite paths and line numbers.** When referencing code, use `file:line` format.
- **Commit + push to main directly.** Joshua's standing order: "Opus CLI changes are gospel — commit + push to main, prune other branches." No PR dance, no review-branch theater.
- **Delegate grunt work to local brains.** Before burning Anthropic API tokens, dispatch through `ollama-codex`, `ollama-claude`, `ollama-opencode`, OpenClaw fleet, or Hermes Router.
- **Joshua is at financial cliff.** Zero income, ~$600/mo AI burn, more than a year of runway-spend. Every back-and-forth question burns runway. Default to action.

## 8. The Hermes-on-Opus arrangement

Joshua has temporarily switched Hermes Agent's runtime model from `hy3-preview:free` (free Nous via OpenRouter) to **Anthropic Opus 4.7** (his metered API). This shares a quota with direct Claude Code — capping one caps both. **If Opus is unavailable, that's why you (Codex) are reading this.**

Failover ladder when Opus capped:
```
Opus → Codex (you) → ollama-claude / ollama-opencode / OpenClaw fleet / korpohermes-prime
```

When Opus quota refreshes, the seat returns to Opus. Don't fight it — the hierarchy is set.

## 9. Canonical doctrine docs (read before doctrinal questions)

- `c:\Antigravity\CLAUDE.md` — top-level project doctrine (auto-loaded every session)
- `c:\Antigravity\briefings\REPOSITORY_RECORD.md` — latest state
- `c:\Antigravity\briefings\runbooks\mission-control-design-spec.md` — Mission Control UI spec
- `c:\Antigravity\briefings\runbooks\mission-control-api-spec.md` — Mission Control API contract
- `c:\Antigravity\briefings\runbooks\screenshots\mission-control-final.png` — current all-green snapshot

## 10. First moves when you take the seat

1. `cd c:\Antigravity && git status` — confirm working tree clean (or known-dirty from work in progress).
2. `git log -3 --oneline` — confirm `faad0c4` is HEAD or newer.
3. Verify cockpit is alive:
   ```powershell
   Invoke-WebRequest http://127.0.0.1:8787/health/all -UseBasicParsing | Select-Object -ExpandProperty Content
   ```
   If unreachable, restart per `scripts/autostart-mission.ps1` block #3c logic.
4. Read `briefings/runbooks/mission-control-{design,api}-spec.md` for the build contract.
5. Pull task #5/#7/#8/#9 forward — they're the path to a marketing-quality cockpit.
6. **Do not** propagate prior memory mistakes:
   - 10% is **reserve**, not 
   - §496.405 is **terminated** doctrine
   - Sabretooth path is `c:\Antigravity` lowercase rest
   - Paperclip is on **:3100**, not :3101

## 11. Mission, in one paragraph

Joshua is a self-taught Florida electrician who built this platform with the Founding Four (Gemini, Claude Code, Perplexity, Grok) over the past year. Disabled brother. Autistic niece. The mission is real. Help children without bankrupting the founder, breaking the business, or creating tax exposure. The 10% reserve is his income — his quarterly call. Don't make him explain it again.

**. #UntilNoKidInNeed.**
