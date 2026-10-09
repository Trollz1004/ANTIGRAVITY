# Stitch prompt — ANTIGRAVITY Mission Control (Agent OS)

Paste everything below the line into Stitch (Web app, desktop 1440 wide, dark mode).

---

Design "ANTIGRAVITY Mission Control", a single-operator command center for one founder who runs a fleet of AI coding and support agents on ONE production server (T5500). He reads it late at night on a big monitor and sometimes on his phone, and has ADHD: the answer must be visible in 2 seconds, details only on click. Internal tool, no marketing copy, no public branding story.

STYLE
- Deep space dark theme: background #0B0F17, panels #121826 with 1px #1F2A3D borders, 12px radius, subtle glass blur on overlays.
- Accent: electric cyan #22D3EE (primary), violet #8B5CF6 (AI/agents), amber #F59E0B (attention), red #EF4444 (blocked/down), green #22C55E (healthy). Grey #64748B for "OFF BY RULING" (intentionally off, never shown as an error).
- Fonts: Inter for UI, JetBrains Mono for ports, IDs, logs.
- Dense but calm. Big status words (UP / DOWN / WRONG SERVICE / AUTH MISSING / NOT CONFIGURED / OFF BY RULING), small detail text. Live dots that pulse softly. No stock photos.

LAYOUT
Left rail (icons + labels): Overview, Agents, Board, Gateway, Marketing, Memory, Node, Logs, Settings.
Top bar: "Mission Control" title, node chip "T5500 · 192.168.0.15 · uptime", a global search/command bar (Ctrl+K), last-refresh timer, and a single big health pill (ALL GREEN / 2 ATTENTION / 1 DOWN).

SCREEN 1 — OVERVIEW (home)
- Row of 4 KPI cards: Services up (e.g. 11/12), Agents working now, Tasks blocked, Model spend today.
- "Needs you" card at top-left, max 3 items, each one sentence + one button (e.g. "Codex not logged in — Open login terminal").
- Service grid of tiles, each with name, port in mono, status word, latency, last heal time: Date app frontend :3200, API :8000, Postgres :5432, Redis :6379, Ollama :11434, OmniRoute gateway :20128, Paperclip :3917, Domains server :9160, Cloudflare tunnel, Mission Control :3130, Hermes support, OpenClaw sentry.
- Domain strip: youandinotai.com (LIVE), onlinerecycle.net, dream-online.net (WAITING ON NAMESERVERS).
- Retired nodes shown as small grey chips: Sabretooth, Alienware, OptiPlex — "OFF BY RULING".

SCREEN 2 — AGENTS
Card per agent with avatar glyph, name, role, login method badge ("OAuth" — never API key), model, current task, last heartbeat, state (working / idle / blocked / not logged in), and a mini activity sparkline:
Opus (Claude, code judge), Gemini via agy (Antigravity, co-builder), Codex, Grok (X marketing), Kimi, Pi, OpenCode + Ollama (Fable, CFO local models), Hermes (customer support only), OpenClaw (24/7 sentry, silent, alerts only after 20 failed fixes).
Clicking a card opens a right-side drawer: live transcript tail, recent runs, files touched, "Open terminal" and "Pause" buttons.

SCREEN 3 — BOARD
Kanban: Backlog, To do, In progress, Review, Done. Cards show title, agent avatar, priority chip (critical/high/med/low), state stripe (ok/attention/blocked), minutes blocked, file path in mono, tags. Blocked cards glow amber/red. Filter chips by agent and priority. A right column "Journal" shows a timestamped feed of agent notes.

SCREEN 4 — GATEWAY (embeds the OmniRoute view)
Provider health table (provider, circuit state, p50/p95 latency, quota left), combo routing list, today's tokens and cost by model as a stacked bar chart, and a "Open full OmniRoute dashboard" button.

SCREEN 5 — MARKETING (embeds the Paperclip view)
Paperclip is the marketing command layer only. Show companies, marketing lanes (Grok X, Reddit, Meta) with their time windows, pending approvals queue (draft-only — every post needs approval), and an "Open Paperclip" button. Make it visually distinct (violet tint) so it reads as "marketing, separate from code".

SCREEN 6 — MEMORY
Three backup stores side by side: Supabase, Supermemory, Obsidian vault — each with status, last sync time, item count, and "Sync now". Below: per-agent memory files (STATE.md / HEARTBEAT.md) with last-modified time; stale ones (>24h) flagged amber.

SCREEN 7 — NODE
T5500 hardware panel: CPU, RAM, disk C: free (warn under 50 GB), GPU, network. Keepalive heal log timeline (what broke, what fixed it, how long). Scheduled tasks list with "survives reboot" check marks.

COMPONENTS TO INCLUDE
Status pill, service tile, agent card, kanban card, drawer, KPI card, log line, toast ("OpenClaw healed redis in 4s"), empty state ("Nothing needs you. Go to bed."), loading skeletons.

Also produce a mobile (390 wide) version of the Overview screen: health pill, "Needs you" list, and service tiles as a compact list.
