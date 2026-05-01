# PRD · OpusPawClaw Mission Control (web preview + flagship drop-in)

## Original problem statement (interpreted)
Joshua Coleman (`@Trollz1004`) pasted a half-written PowerShell browser automation
script asking for a multi-provider AI command console (Ollama, Codex, Claude, Open
Code, Nous, OpenRouter) with GUI, keyboard, notifications. He stopped me and said
"surprise me" + search `Trollz1004/ANTIGRAVITY`. I read the repo (mission
`#UntilNoKidInNeed`, 4-DAO tokenomics, Hermes Router, Paperclip Worker, 10-bucket
revenue engine) and the `TeamClaudeForLife.zip` he then uploaded — which contained
the full OpusPawClaw flagship source + the `MISSION-CONTROL-GUI-PROMPT-2026-04-28`
spec for a new `MissionMode`.

The build delivers **both** surfaces:
1. A hosted web preview of Mission Control wired into a FastAPI Hermes Router
   mirror powered by the Emergent Universal LLM key.
2. The 4 drop-in TSX files spec'd in the prompt (MissionMode, HermesRouterPanel,
   PaperclipWorkerPanel, RunbookViewer) ready for the local Electron flagship.

## Architecture
- **Backend:** FastAPI (`/app/backend/server.py`) — MongoDB + Emergent LLM bridge.
- **Hermes mirror:** `POST /api/hermes/v1/chat/completions` routes virtual
  models (hermes/hermes-deep/cfo/code/marketing/kimi/fast) through
  emergentintegrations to Claude Opus 4.5 / GPT-5.1 / Gemini 2.5 Pro/Flash.
  Response exposes `X-Hermes-Provider`, `X-Hermes-Real-Model`, `X-Hermes-Latency-Ms`
  headers — exact contract the flagship already expects.
- **Paperclip mirror:** `GET /api/paperclip/health` (deploy_time, commit, tunnel).
- **Agents/DAO/System/Git endpoints** feed the existing flagship components.
- **Frontend:** CRA + React 19 + Tailwind. Palette is flagship-exact
  (cyan #00d4ff / magenta #e040fb / gold #ffb300 / green #00e676 on #0a0f1a).

## Users
Primary: Joshua Coleman (CEO, Opus conductor). Secondary: Opus agent, Codex agent,
any AI partner that needs to dispatch or monitor.

## Core requirements (static)
- No Haiku references anywhere.
- No "donate/donation/solicitation" (FL §496.405). "for the kids" is allowed.
- No fabricated live numbers — mirrors are labelled `source: "mirror"`.
- 4-second AbortController timeouts. `document.hidden` pauses polling.
- Mission tag `#UntilNoKidInNeed` visible on all persistent chrome.

## What's shipped (2026-05-01)
- **AgeGate → TitleBar → Sidebar → TaskCommander → Mode router** shell.
- **Modes:** Mission (default), Chat, Code, Create, Research, Settings.
- **Mission Mode:** LaunchPanel (6 agents), Trust Hierarchy, System Integrity,
  4-DAO Treasury Band, Hermes Router panel with virtual-model pill tester
  (live calls to Emergent-bridged models, latency + provider headers shown),
  Paperclip Worker panel (copy-to-clipboard wrangler commands), 10-bucket
  Revenue Engine, GitPanel (real `/app` repo state), RunbookViewer
  (sandboxed .html iframe), Mission footer.
- **Chat Mode:** Opus-labeled chat UI that routes through the Hermes mirror;
  each assistant bubble shows `X-Hermes-Provider` + `X-Hermes-Real-Model` +
  latency footer.
- **Sidebar:** DAOMonitor (token caps, circulating bars), SystemStatus ribbon.
- **FloatingGuide ("Gemma"):** rotating in-app tips.
- **Drop-in TSX files** at `/app/dropin/mission-control/` ready to paste
  into `D:\Antigravity\joshuaclaw-flagship-beta-testing\src\`.

## Backlog / P1
- Wire Create Mode to Gemini Nano Banana (image gen) via Emergent key.
- Wire Research Mode to Perplexity / Comet.
- Replace DAO band `source: mirror` with live Base L2 reader.
- Add `⌘K` command palette (spec noted, not yet shipped).
- Add browser notifications on agent fleet state change.
- Add Square pre-order tracker alongside the mission footer.

## Next action items
1. Run testing agent against the Hermes mirror + Mission Mode UI.
2. Collect Joshua's feedback; iterate on any flagged micro-typography issues.
3. Ship the `⌘K` palette + browser notifications as a follow-up.

## How to run
- Backend: supervisor (already running). `curl $BACKEND/api/hermes/healthz`.
- Frontend: supervisor (already running). Open the preview URL.
- Flagship: copy `/app/dropin/mission-control/src/**` into the Electron repo
  per its `README.md`, apply the App.tsx + Sidebar.tsx patches, run
  `npm run dev:electron`.

#UntilNoKidInNeed · for the kids · #TeamClaudeForLife
