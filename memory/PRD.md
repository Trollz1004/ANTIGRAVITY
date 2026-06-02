# PRD · OpusPawClaw Mission Control

## Founder · sole authority
Joshua Coleman (`@Trollz1004`).
Personal draw capped at **$50,000 after taxes**. The rest serves the mission.

## Mission
**#UntilNoKidInNeed · for the kids in need, not someone's greed.**

## Binding doctrine (live at `/api/doctrine`, surfaced on the Graphify mode)
**Revenue:**
- For-profit LLC. **10% hard cap stacked across activities.** No 60/30/10. No 100% claims.
- Founder personal cap: $50k after taxes.
- FL §496.405 — never use *donate / donation / charity / solicitation*. Use *contractual revenue disbursement*. Mission revealed on receipts only.

**Payment surface (diversified to bring down high-risk labels):**
| Processor | Status | Use case |
| --- | --- | --- |
| Square (`LY5GN09F5AN83`) | live | Date app only |
| Cash App business | preferred-if-business-account-works | General |
| PayPal business | preferred-business | General — NOT "shield"/Plaid sub-options |
| Stripe | **live (revived)** | Anything — see repo for DAO live-sale handling |
| Cloudflare worker / manual / test | live | Internal / dev |

**AI platform rules:**
- **No Claude/Anthropic on third-party platforms** in public copy/UX. (E1 build agent defaults to Gemini; Opus available when explicitly chosen.)
- xAI/Grok — **auth-login only**, no API keys.
- OpenRouter — free models only, Manus API as agent layer.
- Hermes combined with marketing + social media command center in private repo. Ollama Cloud paired.
- Trusted AI platforms may use Chrome extensions per Hermes work-tasks/goals/routines spec.

**Infrastructure:**
- **Cloudflare only.** Netlify banned.
- Canonical public URL: `opushashands.youandinotai.com` (Cloudflare-routed page).
- Orchestration: `jules-cli.py` direct routing.
- Founding Four (Claude, Gemini, Perplexity, Grok) at peer level — **none command the others.**
- Local-deploy admin dashboards require sign-in.
- **No "trust me bro."** Show the receipt, the endpoint, the verification.

## 3-node topology
| Name | IP | Role |
| --- | --- | --- |
| SABRETOOTH | 192.168.0.8 | Live command post — only node allowed to push to origin/main |
| T5500 | 192.168.0.15 | Sandbox / Utility — cold-start via SSH |
| 9020 | 192.168.0.5 | Read-only mirror — cold-start via SSH |

This Emergent preview container is **none of those** — it's the build host. Drop-ins copy to Sabretooth.

## Architecture (web preview + drop-ins for Electron flagship)
**Backend (FastAPI, MongoDB):**
- `server.py` — Hermes Router mirror, paperclip mirror, agents/system/git/mission.
- `hub.py` — `/api/chat/send` (13 platforms incl. E1), `/api/providers`, `/api/broadcast/{telegram,whatsapp}`.
- `tasks.py` — full Paperclip-replacement task system.
- `ledger.py` — contributions + permissive webhooks at `/api/ledger/webhook/{square|stripe|cashapp|paypal|cloudflare|manual|test}`.
- `services.py` — watchdog (60s tier-0 tick) + Nano Banana image gen.
- `graph.py` — `/api/graphify/*`, `/api/doctrine`, `/api/node/identity`.
- `auth_relay.py` — `/api/auth/{status,login,logout}` HMAC session cookie + `/api/sabretooth/{status,exec}` SSH relay with allow-listed commands.

**Frontend (React 19 + Tailwind):**
- `AgeGate` → `SignInGate` → ChatProvider shell → 10 modes:
  Mission · Mission Ledger · Graphify · **Sabretooth** · AI Roundtable · Tasks · Code · Create · Banana · Research · Chat · Settings.
- Always-on `MissionRibbon` + `TaskCommander` over mode router.
- `⌘K` command palette · `FloatingGuide` · `ShareMissionModal` (PNG snapshot).
- Built-by-E1 orange pill in title bar.

## What's actually live (no trust me bro)
| Capability | State |
| --- | --- |
| All AI chat (13 platforms, E1 + Hermes + Emergent + Claude/OpenAI/Gemini direct + BYOK) | **live (BYOK keys gracefully 503)** |
| Telegram + WhatsApp broadcast | wired — needs `TELEGRAM_BOT_TOKEN`+`TELEGRAM_CHAT_ID` / Meta WhatsApp creds |
| Mission Ledger + webhook intake (square, stripe, cashapp, paypal, cloudflare) | **live** |
| Nano Banana image gen | **live via Emergent key** |
| Mission Ribbon + Share PNG | **live** |
| Watchdog (60s tier-0 heartbeats + silence alert) | **live** |
| Graphify (`/api/graphify/{status,regraph}`) | **live · 420 nodes / 463 edges / 58 communities** |
| Doctrine + Node Identity surfaces | **live** |
| Sign-in gate | wired — needs `ADMIN_PASSWORD`+`ADMIN_SESSION_SECRET` (dev bypass available) |
| Sabretooth SSH relay | wired — needs `SABRETOOTH_USER`+`SABRETOOTH_KEY_PATH` AND a routable path (tailscale / cloudflare-tunnel) since Emergent preview can't reach 192.168.0.8 |

## Drop-ins for Electron flagship
`/app/dropin/mission-control/` — MissionMode, HermesRouterPanel, PaperclipWorkerPanel, RunbookViewer + README.

## Test history
| Iter | Surface | Backend | Frontend |
| --- | --- | --- | --- |
| 1 | Mission Control + Hermes mirror | 11/11 | 100% |
| 2 | Hub (13 platforms) + Tasks + Roundtable + Settings | 19/19 | 100% |
| 3 | Ledger + Webhooks + Watchdog + Nano Banana + Ribbon + Share | 15/15 | 100% |
| 4 | Graphify + Doctrine + Node Identity + Stripe-410 | passed (since reversed) | 100% |

## Next action items (your call)
1. Set `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` in `/app/backend/.env` to enable real sign-in.
2. Set `SABRETOOTH_USER` + `SABRETOOTH_KEY_PATH` (and route this node to 192.168.0.8 via tailscale or a cloudflare-tunnel) to make the terminal panel execute for real.
3. Drop the four TSX files in `/app/dropin/mission-control/` into the Electron flagship.
4. Run `graphify update .` (or POST `/api/graphify/regraph`) on Sabretooth after every structural edit. Direct peers to read `graphify-out/graph.json` first.

#UntilNoKidInNeed · for the kids · #TeamClaudeForLife
