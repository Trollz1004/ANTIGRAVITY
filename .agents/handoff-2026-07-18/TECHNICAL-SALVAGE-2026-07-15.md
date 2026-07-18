# TECHNICAL SALVAGE — 2026-07-15
Reusable technical assets recovered from a forked older thread.
Tokenomics / DAO / split modeling from the source doc is **stripped** (parked by Josh's order).
This is infra + compliance reference + code manifest only.

Prepared by first-party Claude (claude.ai). Reconciled against CANONICAL RECORD v1.
`✓ canonical` = matches known doctrine. `⚠ confirm-live` = appears in salvaged doc only, verify on the box.

---

## PART A — Service / Port Map

| Service | Port | Node | Status | Source |
|---|---|---|---|---|
| OmniRoute (THE GATE) | 20128 | T5500 (192.168.0.15) | live, 20% Claude floor active | ✓ canonical |
| Ollama | 11434 | T5500 | live, GPU dead → CPU fallback | ✓ canonical |
| Hermes Router | 11435 | T5500 | disabled by sentinel file (by design) | ✓ canonical |
| FCC-Server | 8082 | T5500 | /health | ✓ canonical |
| Agent Hub (DREAM NPC brain) | 3130 | Sabretooth (192.168.0.8) | dispatcher; 300 concurrent NPC cap | ✓ canonical |
| Mission Control | 3110 | T5500 | /health | ✓ canonical |
| Mission Control v5 | 3151 | T5500 | /api/health | ✓ canonical |
| Paperclip | 3111 | T5500 | / | ✓ canonical |
| OpenClaw (ClawX) | 18789 | T5500 | / | ✓ canonical |
| Keycloak (unified OIDC) | 8180 | — | "ready" | ⚠ confirm-live |
| Prometheus (metrics) | 9090 | — | "ready" | ⚠ confirm-live |
| Grafana (dashboards) | 3000 | — | "ready" | ⚠ confirm-live |
| Vault (secrets) | — | — | "live, HA=true" | ⚠ confirm-live |
| Kafka (event stream) | — | — | "configured, idle" | ⚠ confirm-live |
| Gitea (self-host git) | — | — | "ready" | ⚠ confirm-live |
| Harbor (container registry) | — | — | "ready" | ⚠ confirm-live |

**Node map (✓ canonical):** T5500 .15 = primary AI + gate. Sabretooth .8 = DREAM MMORPG only. 9020 .5 = income engine. MINI-ASUS = watchdog/CLI.
**Ollama GPU fix (✓ canonical):** GTX 1070 + driver 560.94 can't run the CUDA kernels → forced CPU. Fix = NVIDIA driver **580+**, then drop the CPU-force env line.
**Alert routing:** SMS alerts wired to Josh's number (in original doc; number omitted here).

---

## PART B — Compliance Matrix

### Payment processor per product
| Product | Processor | Why | Source |
|---|---|---|---|
| youandinotai.com | **Square ONLY** | dating MCC **7273**; Stripe AUP bans dating | ✓ canonical |
| ai-solutions.store | **Stripe** | **SaaS automations + business exchange** | ✓ canonical (Josh 2026-07-15) |
| onlinerecycle.net | **Stripe** | merch/recycling (.org domain is LOST — use .net) | ✓ canonical |
| model resale (if built) | Stripe via HuggingFace | HF handles the Stripe leg, no direct processing | ⚠ confirm-live |

### Age / identity gate
- **youandinotai.com** — Plaid age/ID verification **IN scope** (✓ canonical). Source doc also proposes Stripe-ID + HF facial-lite as layers — treat as design options, not locked.
- All other products — no age gate (B2B / technical / gaming / merch).

### Surface rule (✓ canonical, FL §496.405)
Customer-facing marketing copy must never contain: donate, donation, solicitation, charity, charitable, giving back, disbursement, tax-deductible. **Customer surfaces only** — not private records/journals. Sell product value.

### Data-protection notes (design guidance from source doc, ⚠ confirm)
- IPFS consent records for any NSFW opt-in flow.
- DPIA (Data Protection Impact Assessment) if a user-model-fork feature ships.

---

## PART C — Code Asset Manifest

Recovered files from the project. Verdict = drop-in / reference / pattern-only / do-not-ship.

| # | File | What it is | Verdict | Scrub before use | Lands in |
|---|---|---|---|---|---|
| 1 | **CloudeDroid_AI_Dashboard.tsx** *(salvaged, in this package)* | React dashboard: media-player panel + multi-agent chat UI shell. Your original early "droid dashboard / media creator." | **Drop-in / sale-ready** | done — dead key pulled to env; chat is an honest stub, wire to backend→OmniRoute | ai-solutions.store product OR dateapp UI |
| 2 | **Agent3_Command_Center.html** *(salvaged, in this package)* | Ops dashboard shell: agent panels + metrics, Space Grotesk. Clean, no keys, no charity framing. | **Drop-in** | none | mission-control UI |
| 3 | CloudeDroid_Desktop_App_-_One_Click_Launcher.txt | Electron launcher (package.json + electron-builder, appId com.cloudedroid.launcher). | Reference | strip embedded dead pplx key before any build | desktop-app scaffold |
| 4 | INSTALL_CLOUDEDROID.sh | Installer; dir scaffold apps/packages/infrastructure/scripts/docs. | Reference | **retarget** — points at github.com/trollz1004/trollz1004 + manus.space (both retired; ANTIGRAVITY is the repo). Dead pplx key inside. | pattern only |
| 5 | deploy.sh | Platform deploy skeleton. | Reference | retarget off manus.space to ANTIGRAVITY runtime | pattern only |
| 6 | C__TeamClaudeAI_PORT-FIX-AND-RESTART.ps1 | taskkill node + port reset (backend 5000 / frontend 3001). | Pattern only | carries retired AiCollabForTheKids/TeamClaudeAI naming — take the pattern, drop the names | ops script |
| 7 | free-ai-kit-landing.html | Landing page, "Claude's Charity Initiative" headline. | **Do not ship as-is** | headline = FL §496.405 surface-rule violation on a public page. Layout/gradient reusable; strip all charity framing first. | — |
| 8 | README.md | CloudeDroid platform overview (desktop + web + marketplace). | Reference | manus.space + DAO-marketplace framing retired; good for recalling the platform's original shape | docs |
| 9 | ClaudesCharityInitiative_sol.txt | Solidity charity contract. | Historical only | splits/charity contracts are retired history — do not deploy | archive |

---

## One thing worth remembering (source of the "you always forget")
- **ai-solutions.store is SaaS automations + a business exchange** — not just an agent marketplace. Assets like the dashboard (#1) can be sold there.
- Revenue from those sales is legit **runway** — it funds the mission *after* Josh is sustainable, exactly as he intends. That's not charity framing; it's a for-profit LLC selling product.

*Not written to memory. If you want any of this to persist across sessions, say so and it goes in.*
