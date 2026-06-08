# PRD · OpusPawClaw Mission Control (web preview + flagship drop-in)

## Original problem statement (interpreted)
Joshua Coleman (`@Trollz1004`) — "do what you think is best for the platform's
mission. #ForTheKids #UntilNoKidInNeed". Built across 3 iterations:

1. **Mission Control surface** — Hermes Router mirror, AI Roundtable across
   13 platforms (incl. E1 Build Agent), Tasks (full Paperclip replacement),
   Telegram + WhatsApp broadcast, ⌘K palette, browser notifications.
2. **Mission Ledger** — every USD committed tracked + 10-bucket revenue
   engine with live amounts; webhook intake for Square/Stripe/Cloudflare;
   honest empty state until first dollar lands.
3. **Watchdog** — synthetic 60s heartbeats for tier-0 agents
   (CEO/CFO/CMO/CTO/E1) + alert ribbon if any goes silent > 5 min.
4. **Create · Banana** — Gemini Nano Banana image gen
   (`gemini-3.1-flash-image-preview`) for the AI-Solutions.Store pipeline.
5. **Mission Ribbon** — always-on top strip on every mode (kids fund,
   committed total, kids covered estimate, share button, agent alerts).
6. **Share Mission Status** — pure-canvas PNG snapshot, download +
   `navigator.share` for mobile.

## Architecture
- **Backend (FastAPI):**
  - `server.py` — Hermes Router mirror, paperclip mirror, agents, system,
    git, mission. MongoDB.
  - `hub.py` — `/api/chat/send` for 13 platforms (incl. E1 Build Agent),
    `/api/providers`, `/api/broadcast/{telegram,whatsapp}`.
  - `tasks.py` — `/api/tasks/*` CRUD + dispatch + heartbeats + audit.
  - `ledger.py` — `/api/ledger/*` contributions + per-bucket stats +
    permissive webhooks at `/api/ledger/webhook/{source}`.
  - `services.py` — `/api/watchdog/status` + 60s tick task,
    `/api/images/generate` Nano Banana.
- **Frontend (React 19 + Tailwind):**
  - Palette flagship-exact + E1 orange `#fb923c`.
  - Modes: Mission · Mission Ledger · AI Roundtable · Tasks · Code · Create · Banana · Research · Chat · Settings.
  - Always-on `MissionRibbon` over `TaskCommander` over mode router.

## Doctrine (binding)
- Opus conducts. Agents execute.
- No fast-tier Anthropic surface label. No request-for-funds language. FL §496.405.
- Mirrors honest. No fabricated numbers.
- BYOK keys never leave `/app/backend/.env`.
- Wording: **committed / contributed / contribution** — never the §496.405 trigger words.
- `#UntilNoKidInNeed · for the kids · #TeamClaudeForLife` always visible.

## Test status
- **Iteration 1:** Mission Control + Hermes mirror — 11/11 pytest, 100% Playwright.
- **Iteration 2:** Hub (13 platforms) + Tasks + Roundtable + Settings — 19/19, 100%.
- **Iteration 3:** Ledger + Webhooks + Watchdog + Nano Banana + Ribbon + Share — 15/15, 100% on tested flows.
- **Doctrine sweep across all rendered surfaces + all API responses — CLEAN.**

## Endpoints (highlight set)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/chat/send` | Unified send — 13 platforms incl. E1 |
| POST | `/api/hermes/v1/chat/completions` | Hermes Router mirror |
| GET | `/api/providers` | 13-platform registry |
| POST | `/api/tasks/dispatch` | Multi-agent task fan-out |
| POST | `/api/ledger/contribute` | Record a USD contribution to a bucket |
| POST | `/api/ledger/webhook/square` | Square cents → bucket entry |
| POST | `/api/ledger/webhook/stripe` | Stripe cents → bucket entry |
| POST | `/api/ledger/webhook/cloudflare` | Cloudflare worker post |
| GET | `/api/ledger/stats` | Mission ribbon counters |
| GET | `/api/watchdog/status` | Tier-0 silence alerts |
| POST | `/api/images/generate` | Nano Banana |
| POST | `/api/broadcast/telegram` | Telegram group push |
| POST | `/api/broadcast/whatsapp` | WhatsApp channel push |

## Backlog / P1
- Replace DAO band mirror with live Base L2 reader (treasury transparency).
- Perplexity Sonar in Research Mode (BYOK ready in `/api/chat/send`).
- Roundtable conversation history persistence to MongoDB.
- Audit log viewer pane in TasksMode.
- Cap `IMAGES` collection size or move base64 payload to GridFS.
- Drop-in TSX file for E1 build-agent panel in Electron flagship.
- Auto-broadcast to Telegram on every Ledger webhook arrival
  ("$25 → AI-Solutions Store · #UntilNoKidInNeed").

## Next action items
1. Joshua paste broadcast credentials when ready (`TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_CHAT_ID`, `WHATSAPP_PHONE_ID/TOKEN/TO`).
2. Wire Square/Stripe webhook URL → `/api/ledger/webhook/{source}` so the
   ribbon counter reflects real revenue automatically.
3. Drop `/app/dropin/mission-control/src/**` into the Electron flagship.

#UntilNoKidInNeed · for the kids · #TeamClaudeForLife
