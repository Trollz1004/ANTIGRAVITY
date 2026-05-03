# PRD · OpusPawClaw Mission Control (web preview + flagship drop-in)

## Original problem statement (interpreted)
Joshua Coleman (`@Trollz1004`) pasted a half-written PowerShell browser automation
script asking for a multi-provider AI command console. After "surprise me" + the
TeamClaudeForLife.zip drop, the build covers:

1. The full **OpusPawClaw Mission Control** web preview, with Hermes Router
   mirror powered by the Emergent Universal LLM key.
2. **AI Roundtable** — every AI platform Joshua named (Hermes, Emergent,
   Claude, OpenAI, Gemini, Grok, Perplexity, OpenRouter, Genspark, Manus,
   OpenClaw, Ollama) chat-capable from one screen with fan-out.
3. **Telegram + WhatsApp broadcast** baked into chat send and exposed
   standalone — same shape as ClawX in the JoshuaClaw repo.
4. **Tasks Mode** — full Paperclip-replacement task management system
   (12-agent fleet, kanban, dispatch fan-out, audit log, heartbeats, stats).
5. **⌘K command palette** + browser notifications + grain overlay.
6. **Drop-in TSX files** for the local Electron flagship at
   `/app/dropin/mission-control/`.

## Architecture
- **Backend:** FastAPI — three modules:
  - `server.py` — Hermes Router mirror (`/api/hermes/*`), Paperclip mirror,
    DAO/system/git/agents/mission endpoints, MongoDB.
  - `hub.py` — unified `/api/chat/send` for 12 AI platforms, `/api/providers`,
    `/api/broadcast/{telegram,whatsapp}`. Bridges Emergent / BYOK / local.
  - `tasks.py` — `/api/tasks/*` CRUD + dispatch + heartbeats + audit + stats.
- **Frontend:** CRA + React 19 + Tailwind. Palette flagship-exact
  (cyan #00d4ff / magenta #e040fb / gold #ffb300 / green #00e676 on #0a0f1a).

## Doctrine (binding rules)
- Opus conducts. Agents execute.
- No fast-tier Anthropic label visible. No request-for-funds language. FL §496.405.
- Mirror endpoints honest — no fabricated live numbers.
- BYOK keys never leave `/app/backend/.env`.
- #UntilNoKidInNeed · for the kids.

## What's shipped (2026-05-03)
- **AgeGate → TitleBar → Sidebar (7 entries) → TaskCommander → Mode router** shell.
- **Modes:** Mission, AI Roundtable, Tasks, Code, Create, Research, Chat, Settings.
- **Mission Mode:** LaunchPanel (6 ollama agents), Trust Hierarchy, System
  Integrity, 4-DAO Treasury Band, Hermes Router pill tester (live bridge),
  Paperclip Worker panel, 10-bucket Revenue Engine, real GitPanel,
  sandboxed RunbookViewer, mission footer.
- **AI Roundtable:** 12 AI platforms grouped by tier, multi-select, fan-out
  send, side-by-side response cards with per-card latency + real-model
  footer, Telegram/WhatsApp broadcast chips, browser notifications toggle.
- **Tasks Mode (Paperclip replacement):** 12-agent fleet (CEO/CFO/CMO/CTO/
  2× INTERN + 6 launch agents) with capacity bars, 4-column kanban,
  per-task status PATCH, NEW TASK modal, DISPATCH modal (multi-agent),
  agent heartbeats, audit log, stats endpoint.
- **Chat Mode:** routes through Hermes mirror with 7 virtual models;
  X-Hermes-Provider/Real-Model/Latency footer on every assistant bubble.
- **Settings:** AI Platforms grid (12 cards w/ ready state), Broadcast
  Channels (Telegram + WhatsApp) with TEST PING, endpoints list, doctrine.
- **TaskCommander:** typing fires `opuspawclaw-task` + `opuspawclaw-mode`
  events → switches to Tasks mode and opens dispatch modal with prefill.
- **⌘K Command Palette:** ↑↓↵ navigation across all modes + actions.
- **FloatingGuide ("Gemma"):** rotating in-app tips.
- **Drop-in TSX files** at `/app/dropin/mission-control/` for the
  Electron flagship.

## Backlog / P1
- Wire Create Mode to Gemini Nano Banana (image gen) via Emergent key.
- Wire Research Mode to Perplexity / Comet (BYOK ready in /api/chat/send).
- Replace DAO band `source: mirror` with live Base L2 reader.
- Add Square pre-order tracker alongside the mission footer.
- Persist Roundtable conversation history per session_id (currently in-mem).
- Export Mission status as a sharable PNG snapshot (X/Insta).

## Test status
- `iteration_2.json` — backend 19/19 pass + iter1 regression pass; frontend
  Playwright sweep 100% after the doctrine-bullet fix (rephrased so
  the prohibition itself doesn't contain the prohibited tokens).

## How to run
- Backend: supervisor (already running). `curl $BACKEND/api/providers`.
- Frontend: supervisor (already running). Open the preview URL.
- Flagship: copy `/app/dropin/mission-control/src/**` into the Electron repo
  per its `README.md`, apply the App.tsx + Sidebar.tsx patches, run
  `npm run dev:electron`.

## Next action items
1. Joshua paste BYOK keys (XAI/PERPLEXITY/OPENROUTER/GENSPARK/MANUS) and
   broadcast creds (TELEGRAM_BOT_TOKEN+CHAT_ID, WHATSAPP_*) into
   `/app/backend/.env` — or set via Settings later.
2. Drop the 4 TSX files into the Electron flagship.
3. Pick one P1 from backlog (image gen / Base L2 reader / Square tracker)
   for the next session.

#UntilNoKidInNeed · for the kids · #TeamClaudeForLife
