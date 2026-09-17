# Dashboard / Mission-Control Inventory — 2026-09-17

Read-only survey of every dashboard/HUD/console on GitHub (`Trollz1004`, `Ai-Solutions-Store`) and in local clones, for a single-consolidated-Mission-Control design pass. No secrets printed; no repos cloned.

## GitHub repo counts

- **Trollz1004**: 27 total, 21 archived (6 active).
- **Ai-Solutions-Store**: 6 total, 3 archived (3 active).

## Matching repos (name/description hit on the keyword list)

| Repo | Owner | Archived | Pushed | Note |
|---|---|---|---|---|
| ANTIGRAVITY | Trollz1004 | no | 2026-09-17 | monorepo, public overview README only |
| hermes | Trollz1004 | no | 2026-09-17 | "Ultimate Hermes Agent dashboard" |
| Ai-Solutions-Jules-Code-Review-Agentic-Dashboard | Trollz1004 | no | 2026-09-17 | **404 on README** — repo exists, no README committed |
| dream-online | Trollz1004 | no | 2026-09-13 | game project, no dashboard UI, just service endpoints |
| OnlineRecycle | Trollz1004 | no | 2026-09-11 | **404 on README** — can't confirm a dashboard exists |
| llc-crosslisting-os | Trollz1004 | no (PRIVATE) | 2026-08-31 | superseded — folded into Ai-Solutions-Store/ai-solutions 2026-09-03 |
| mission-control-v5 | Trollz1004 | **yes** | 2026-08-12 | stale/archived GitHub copy; live copy is local `C:\ANTIGRAVITY\mission-control-v5\` (newer, unarchived on disk) |
| antigravity-dashboard | Trollz1004 | yes | 2026-05-30 | archived — old "Mission Control — Secured Personal Dashboard" (GitHub OAuth + Cloudflare Pages), superseded |
| income-engine | Trollz1004 | yes | 2026-05-11 | archived Paperclip lead-gen dashboard |
| Ai | Ai-Solutions-Store | no | 2026-09-09 | duplicate/mirror of ANTIGRAVITY's public README, not a separate dashboard |
| ai-solutions | Ai-Solutions-Store | no | 2026-09-03 | consolidated home; contains folded `crosslisting-os/` (from llc-crosslisting-os, "the live copy") |
| llc_crosslisting_os | Ai-Solutions-Store | no (PRIVATE) | 2026-08-31 | same README as Trollz1004/llc-crosslisting-os — stale duplicate, superseded by the fold into `ai-solutions` |
| EMERGENT-if-self-hosted... | Ai-Solutions-Store | yes | 2026-08-26 | archived |

**Live GitHub dashboard app**: the LLC Crosslisting OS (folded into `Ai-Solutions-Store/ai-solutions/crosslisting-os/`) — full internal ops dashboard: catalog, inventory ledger, channel-gated listings (eBay/Google Merchant live; Facebook/Mercari/Poshmark prepared), disabled-by-default automation profiles, AI drafting (gpt-5-mini, review-required), governance/activity ledger + exception queue. Stack: Drizzle schema, server routers, React client (`client/src/pages/`).

## Local dashboards

| Dashboard | Location | Port | State |
|---|---|---|---|
| Mission Control v5 (MC5) | `C:\ANTIGRAVITY\mission-control-v5\` | **3151** | live — current canonical Mission Control per CLAUDE.md ruling 2026-09-10 |
| AIRI | `C:\ANTIGRAVITY\ops\dashboard-airi\` | 9150 | live — embeds MC5 |
| JARVIS | `C:\ANTIGRAVITY\ops\dashboard-jarvis\` | 9150 (per its README — same port as AIRI, unresolved overlap) | live — moved from `Trollz1004/hermes/dashboard/jarvis` today (2026-09-17) by Joshua's direction; superset of AIRI |
| Fable's Sentry | `C:\ANTIGRAVITY\apps\fables-sentry\` | n/a (health-check tool) | live — service health wall, 8 monitored groups |
| Emergent | `C:\ANTIGRAVITY\frontend\` | 3210 (via `launch-emergent-dashboard.cmd`, `craco start`) | live — richest local console by component count |
| Hermes legacy shell | `C:\Users\joshi\hermes\dashboard\{index.html,applet.html,crosslisting\}` | n/a (static/local) | live but older — origin of the JARVIS/AIRI panel set |
| dream-online prototypes | `dream-online` repo (external D: path) | 9127 (Live NPC Lab), 9133 (DreamOps Bridge) | health endpoints only, no dashboard UI found |

No folder named `mission-control` under `ops/` or `apps/` besides `dashboard-airi`/`dashboard-jarvis`/`fables-sentry` matched the keyword scan; MC5 itself lives at the repo root, not under `ops/` or `apps/`.

## Feature matrix

Y = present with evidence, P = partial/overlaps another surface, — = not found. Emergent's cells are component-name evidence only (file list read, not content verified) — flag before treating as fully proven.

| Feature | MC5 :3151 | AIRI :9150 | JARVIS :9150 | Sentry | Emergent :3210 | Hermes legacy shell | GitHub LLC-Crosslisting-OS |
|---|---|---|---|---|---|---|---|
| Node cards / God's Eye | — | — | **Y** `lib/nodes.mjs`, `js/jarvis/globe.js` | P (flat health cards, no globe) | — | — | — |
| Service health wall / Sentry | — | P (embeds MC5) | P | **Y** `apps/fables-sentry/targets.json`, `server.mjs` | P `SystemStatus.js` | — | — |
| Judge lanes / proposals | — | — | — | — | P `DAOMonitor.js` (unverified) | — | — |
| Agent fleet / token spend | **Y** Agent Library + Swarm Engine live feed (model/latency/provider) | P (OmniRoute widgets, no per-agent spend) | P | — | P `HermesRouterPanel.js`, `OpenClawSupportPanel.js`, `TaskCommander.js` (unverified) | P `data-panel="hermes"` (skills+memory, no spend) | — |
| Game admin (DREAM ONLINE) | — | — | — | — | — | — | — |
| CRM / leads | — | — | — | P (health-checks a hosted CRM + MongoDB, no CRM UI) | — | — | — |
| Fable's House dispatch log | — | **Y** "House at a glance" panel | **Y** same panel | P (`Stack Health watchdog` target only) | — | — | — |
| Obsidian knowledge graph | — | **Y** panel | **Y** panel | P (health-check only) | — | P `data-panel="obsidian"` | — |
| Skills tree | — | **Y** "Agents (skills tree)" | **Y** | — | — | **Y** `data-panel="skills"` | — |
| Avatar / voice | — | **Y** panel | **Y** panel + `hermes-voice.js` | — | — | — | — |
| Claude CLI launcher | — | **Y** "Official Claude CLI" | **Y** | — | — | **Y** `data-panel="claude"` | — |
| OmniRoute widgets | P (backend router, no widget UI) | **Y** panel | **Y** panel | P (health-checks the gateway) | — | — | — |
| Crosslisting / eBay | — | — | **Y** "Crosslisting" panel | — | — | P (`/crosslisting` subfolder present, not wired into nav) | **Y** full app — catalog/inventory/listings/channels |
| Recycling | — | — | — | — | — | — | — (OnlineRecycle repo has no README to confirm) |
| Date app ops | — | — | — | P (health-checks Date App UI :3200 + API :8000) | ? (title is generic "Emergent \| Fullstack App"; distinct from :3200 Date App UI — relationship unclear) | — | — |
| Paperclip board | — | — | — | — | — | — | — (parked per CLAUDE.md 2026-09-10) |
| Revenue / Square | — | — | — | — | P `StorefrontMode.js`, `LedgerMode.js` (unverified) | — | — |

## Three most feature-dense (by distinct live features found)

1. **Emergent** (`frontend`, :3210) — widest component/mode spread (11 modes + 9 top-level panels: mission ribbon, task commander, DAO monitor, git panel, Hermes router, OpenClaw support, system status, runbook viewer, storefront/ledger modes), but contents unverified beyond filenames — needs a follow-up read pass before trusting scope claims.
2. **JARVIS** (`ops/dashboard-jarvis`, claims :9150) — superset of AIRI plus God's-Eye globe/node cards, Crosslisting panel, Hermes AI panel, ClawX AI Board; freshest (moved from the hermes repo today, 2026-09-17).
3. **AIRI** (`ops/dashboard-airi`, :9150) — same core 9-panel baseline as JARVIS minus the newest additions; the two currently collide on port 9150, which the consolidation should resolve.

Fable's Sentry and MC5 are narrower but the most operationally load-bearing: Sentry is the only real cross-stack health-identity check (8 groups, ~20 targets), and MC5 is the only one running real swarm dispatch against the 3 harness orchestrators.

## Open questions for the consolidation design

- AIRI and JARVIS both declare port 9150 — decide which is canonical or merge them (JARVIS looks like the intended successor as of today).
- `Ai-Solutions-Jules-Code-Review-Agentic-Dashboard` and `OnlineRecycle` have no README — can't say what they show without opening file contents (out of scope for this read-only pass).
- Emergent's feature claims are filename-only; verify `DAOMonitor.js`, `LedgerMode.js`, `StorefrontMode.js` content before counting them as proven judge-lane/revenue features.
- `Ai-Solutions-Store/Ai` and `Ai-Solutions-Store/llc_crosslisting_os` are stale mirrors of content that already lives canonically elsewhere (`Trollz1004/ANTIGRAVITY`, `Ai-Solutions-Store/ai-solutions`) — candidates for archiving, not design input.
