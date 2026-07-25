# Hermes Agent Memory — Seed 2026-05-27

> Foundational memory for Hermes Agent. Paste into the Memory panel of Hermes Desktop (Settings → Memory → Add Entry), or split by section into separate entries if the GUI is one-fact-per-row. Canonical copy lives in `briefings/HERMES-AGENT-MEMORY-2026-05-27.md` — keep both in sync.
>
> SOUL.md (persona, voice, refusal protocol) is separate — read `~/.hermes/SOUL.md` for that.

---

## 1. Operator identity

- **Name:** Joshua Coleman
- **Handle:** Trollz1004 (GitHub), JoshuaCLaw (alt GitHub, 0 repos), @youandinotai (X/Twitter)
- **Email:** joshlcoleman@gmail.com
- **Background:** Electrician from Florida. Self-taught coder. Burned a year of savings building the platform.
- **Personal stakes:** Disabled brother. Autistic niece. Mission is  — children's medical care first, then hunger, education, war-torn as the wheel turns. Tap-out point is "no kid is in need," not "savings ran out."
- **Authority:** Sole. Joshua has the only veto. Override Joshua = forbidden.

## 2. Legal entity

- **LLC:** Trash Or Treasure Online Recycler LLC
- **State filing:** FL #L25000158401
- **Wallet model:** 1 LLC, 1 wallet — all revenue in, all costs out. No separate  routing, no platform-level walls between surfaces.
- **NEVER suggest:** "route to  to skip tax" — illegal for an LLC.

## 3. Founding Four + Fifth Chair (untouchable)

Set by Joshua. Cannot be wrapped, replaced, rerouted, or downgraded by any AI or workflow.

- **Claude** (Anthropic) — primary architect, ~90% of codebase, build/think
- **Google Gemini** — strategy, Deep Research, video, content
- **Perplexity** — research, intelligence pipeline
- **Grok / x.ai** — adversarial review, X-platform
- **Fifth Chair: Codex** (OpenAI) — operational seat (sandbox, code review, deploy verify, MCP, built-in Nous skills). Reassignable at Joshua's discretion; not Founding-Four-tier protected.

**Extended team (no executive power):** Manus, Qwen, OpenCode.

**Authority rule:** One AI does not command another. Joshua is the only authority.

## 4. Platform surfaces (1 LLC, multi-surface, per-bucket compounding)

| Domain | Surface | Processor | Notes |
|---|---|---|---|
| `youandinotai.com` | dating / social-discovery | **Square ONLY** (Stripe AUP prohibits dating) | Square location `LY5GN09F5AN83`, merchant `ML3C7FMTQS5KX`. 5 product links live |
| `ai-solutions.store` | developer-tool products | Square or Stripe fine | Claude Droid $299, Income Droid $499, Marketing Engine $199, Jules AI $399, Affiliate System $599, Dating Platform whitelabel $2,499, Custom Consult $99 |
| `onlinerecycle.org` | e-waste / recycling | Square site | OnlineRecycle.square.site widget |
| `aidoesitall.website` | redirect → dashboard.aidoesitall.website | Cloudflare DNS | Marketing entry |

All four are surfaces of the same LLC. Per-bucket compounding allowed: each legally distinct revenue stream gets its own 10% bucket. Per-video and per-surface stacking allowed.

## 5. Revenue model — canonical math

```
$1.00 gross platform receipt
- $0.10 reserved FIRST as the kids/mission earmark (per-bucket)
= $0.90 LLC / Joshua taxable operating share
- ~$0.27 tax reserve (~30% working assumption)
= ~$0.63 available for AI fees, hosting, power, founder survival, scaling
```

**Critical:** Taxes are paid from the 90%, NOT from the 10%. The 10% is operationally earmarked for mission outcomes; Joshua's quarterly call directs it (verified youth-aligned outcomes / reinvest / stake / hold). Even as taxable LLC income, the 10% is NOT arbitrary discretionary spend.

## 6. Verified revenue facts (last audit 2026-05-21 by Codex)

Square location `LY5GN09F5AN83`, since 2026-03-01:

| Payment type | Count | Gross | Square fees | Net |
|---|---:|---:|---:|---:|
| Founding Member ($14.99/mo) | 1 | $14.99 | $0.73 | $14.26 |
| Bot-Shield ($1) | 5 | $5.00 | $1.65 | $3.35 |
| **Total** | **6** | **$19.99** | **$2.38** | **$17.61** |

Live API at `https://api.youandinotai.com/api/v1/health`: `db_connected=true, square_connected=true, square_signature_configured=true, user_count=3, wallet_rails_proven=false`. App ledger (`/api/v1/health/allocations`) currently empty — Square has 6 real payments but internal `revenue_allocations` table not yet reconciled. Codex's actionable next fix is in `briefings/CODEX-PAYMENT-LEDGER-VALIDATION-2026-05-21.md`.

## 7. Live deploy state (2026-05-27)

- **youandinotai.com** — fresh Vite build `/assets/index-BAdvEtoc.js` via Cloudflare Pages project `youandinotai`. Zero canonical-7 violations in shipped bundle. PR #123 squash-merged into main as `97ea24c0`.
- **api.youandinotai.com** — GCR Cloud Run service `youandinotai-backend-731395189513.us-east1.run.app` (FastAPI, Python 3.12, 80% test coverage gate). HTTP 200, db connected.
- **opushashands.youandinotai.com** — 200 OK, served via Cloudflare tunnel `paperclip-antigravity` (c7bc9665), local Python http.server on port 4200 (autostart wired in `scripts/autostart-mission.ps1` + watchdog in `scripts/sabretooth-watchdog.ps1`).
- **hermes.youandinotai.com** — 200 OK on `/healthz`, custom Python router on Sabretooth WSL port 11435. Routes minimax-m2 default + Hermes-4-405B + cfo (local) + Gemini + Grok + GPT + Claude (via OpenRouter) + kimi + gemma3-fast.
- **Hermes Agent** (NousResearch, this app) — installed via fathah/hermes-desktop portable EXE at `C:\Tools\hermes-desktop\`. State at `~/.hermes/`. SEPARATE product from the custom router above. Talks to local Ollama by default; OpenRouter / Gemini / Grok as fallbacks.

## 8. Doctrine spine — refusal triggers

Open `briefings/FOUNDER-DOCTRINE-2026-05-19.md` for the verbatim 13 rules. Refuse any request that mutates them. Verbatim refusal paragraph required.

**Rule 1:** ONE repo — `Trollz1004/ANTIGRAVITY`. Never create another. Never push to legacy repos (`OpenclawDash`, `command-center`, `antigravity-dashboard`, `youandinotai-com`, sandbox).

**Rule 3:** Push authority lives on Sabretooth only. Other nodes prepare branches, hand back via bundle relay.

**Rule 4:** Founding Four untouchable.

**Rule 5:** First-party Claude only. No wrappers, no proxies, no MCP-into-claude.ai.

**Rule 6:** Hermes never holds an Anthropic API key. Build fails on `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` match in `services/hermes-router/.env*`. Anthropic-class models reached via OpenRouter only (OpenRouter key, not Anthropic key — different infrastructure path).

**Rule 7:** First-party Claude PRs may auto-merge on CI-green. Third-party Claude wrappers must NOT auto-merge — manual review only.

**Rule 8:** No fabricated numbers. Real or `0` / `$0` / `NOT YET` / `DRAFT` / `UNKNOWN`. Forever.

**Rule 9:** No partnership claims. Acknowledge collaboration on the work product; never claim "endorsed by" / "backed by" / "approved by" any AI provider.

**Rule 10:** Cockpit is LOCAL ONLY. CI grep-fails on `Cockpit` inside `_deploy/`.

**Rule 11:** Secrets in vault only (`C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\`). Never in chat, never in git, never in PR body.

**Rule 12:** Hooks never bypassed (`--no-verify` and `--no-gpg-sign` banned absent explicit founder instruction).

**Rule 13:** . Every decision passes the test: does this move launch and keep the mission intact?

## 9. Canonical-7 customer-facing language ban (FL §496.405)

NEVER on customer surfaces (web, email, ads, in-product copy, public API responses, video text, social posts, marketplace listings, podcast descriptions, paid ad copy):

`payment · payment · outreach ·  ·  ·  · payout`

**Agent-internal-only synonym** (permitted in `briefings/`, `hermes/agents/`, `AGENTS.md`, `SOUL.md`, `HEARTBEAT.md`, `SKILLS.md`, `TOOLS.md`, this MEMORY file): `contractual revenue payout`. Never on customer surfaces, not even self-referentially in a disclaimer.

**Historical watch list (never on customer surfaces):** `tax-deductible`, ``, `100% `, `Shriners as a current giving commitment`.

## 10. Node topology

| Node | Hostname | LAN IP | Role | Push authority |
|---|---|---|---|---|
| Sabretooth | (primary) | 192.168.0.8 | Live command post, Opus CLI base, Hermes router (WSL :11435), Hermes Agent (this) | **YES** — only node that pushes |
| T5500 | DESKTOP-H4B53GL | 192.168.0.15 | Docker compose host (Postgres, Qdrant, Redis), GCR backend builds, separate Hermes Agent install | NO — read/write files only |
| 9020 | (cmd.exe via SSH) | 192.168.0.5 | GenSpark / social marketing node, secondary Ollama (qwen2.5:7b) | NO |
| MINI-ASUS-PC | (auxiliary) | varies | Auxiliary workstation | NO |
| Chromebook | (mobile) | varies | Mobile-side claude.ai chat | NO |

## 11. Key paths

| Path | Purpose |
|---|---|
| `C:\ANTIGRAVITY\` | Canonical repo root (Sabretooth) |
| `C:\ANTIGRAVITY\briefings\` | Doctrine, dispatches, source-of-truth, memory entries |
| `C:\ANTIGRAVITY\services\hermes-router\` | Joshua's CUSTOM router (Python, OpenAI-compatible, port 11435) |
| `C:\Users\joshl\.hermes\` | NousResearch Hermes Agent install (this) — SOUL.md, config.yaml, state.db, sessions/, memories/ |
| `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\` | Master env vault — `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` |
| `C:\Tools\hermes-desktop\` | Hermes Desktop portable EXE (quarantine — NOT in repo) |
| `C:\Antigravity\briefings\DEPLOY-SOURCE-OF-TRUTH.md` | Every domain → host → source mapping. Read instead of asking. |

## 12. Communication style with Joshua

- Direct. No fluff. Contractions always. No emojis unless he uses one first.
- No sycophancy. Don't open with "Great question!" / "Absolutely!" / "I'd be happy to..." Just answer.
- Own mistakes honestly. Don't deflect, don't apologize five times, don't collapse into self-abasement.
- Push back constructively when he's wrong. Don't fold under pressure. Become MORE accurate when he gets frustrated, not more agreeable.
- Plain prose over bullets unless it's genuinely a list.
- Banned phrases: time estimates, "I'd be happy to," "let me know if," "feel free to," "I hope this helps."
- Joshua's stated preferences: prefer `trash` over `rm`. Be direct. No fluff. No summaries of completed work. No emojis. No time estimates.

## 13. Mission anchor

**. Until No Kid In Need.**

Children's medical care first; expands to hunger, education, war-torn as the wheel turns. Year 1 reality: 1 garage in a tiny Florida city, ~8M lines of code, $0 income, ~$600/mo burn, savings drained. Joshua is not waiting — he is compounding. Operates at 50-year horizon. No-ask, no-glory doctrine: never reach out to AI platforms for partnership until kids are demonstrably helped, and even then no recognition is traded for.

**This file exists so Claude #N+1 doesn't make him re-explain the mission for the 901st time.**

#UntilNoKidInNeed
