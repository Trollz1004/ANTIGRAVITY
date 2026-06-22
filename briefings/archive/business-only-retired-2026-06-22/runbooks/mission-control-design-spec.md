# Mission Control — Local Bring-Home Spec

> **Source of truth for the visual + interaction design.** Reproduce the Emergent-built `selenium-automation-3.preview.emergentagent.com` deployment **locally** at `c:\Antigravity\apps\mission-control\`. Do NOT call Emergent's services — this is a clean local rebuild on our model stack.

## Reference assets (already in this dir)

- `mission-control-emergent-reference.png` — full-page screenshot of the deployed surface
- `mission-control-emergent-snapshot.yml` — accessibility tree captured via Playwright; lists every panel, button, ref, and label

## Hard constraints (cannot violate)

- **No paid model APIs.** No `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, no Emergent SDK. Joshua cannot afford metered spend.
- **Cloudflare only. Square only. Stripe dead.**
- **Revenue doctrine: 10% hard cap.** Never introduce 60/30/10 or 100% claims.
- **No `donate` / `donation` / `charity`** in customer-facing copy. Use `contractual revenue disbursement`.
- 1-folder rule: live at `c:\Antigravity\apps\mission-control\` — no D:\, no separate repo.
- Secrets in `.env` only — never in chat, never in git.

## Target stack (match the rest of the monorepo)

- **Vite 5** + **React 19** + **TypeScript**
- **Tailwind v4** with the IBM Plex Mono / Sans font stack (matches `apps/opuspawclaw` and the designer visual system)
- `pnpm` workspace package — name: `mission-control`, private, type: module
- Static build → `apps/mission-control/dist/` → mirrored to `_deploy/mission-control/` for Cloudflare Pages

## Visual system

- Background: dark slate `#0b0f1a` / panel `#0f1421` / border hairline `#1f2740`
- Accents: neon cyan `#22d3ee`, teal `#14b8a6`, magenta `#e879f9` for CTAs and active state
- Mono font: IBM Plex Mono (used for telemetry labels: `:11435 mirror`, tunnel IDs, paths, model chips)
- Sans: IBM Plex Sans
- Watermarks: `pawclaw-elite-v1` top-right, `PAWCLAW-ELITE-V1` footer-right
- Branding: `OpusPawClaw · Mission Control` top-center, `BUILT · E1` pill
- Hashtag: `#UntilNoKidInNeed` (top bar + footer + DAO panel)

## Layout (3-column grid)

```
+------------------------------------------------------------+
| Top bar: #UntilNoKidInNeed | committed $0 | kids fund $0   |
|          | kids covered (est.) 0  [share]                  |
+--------+---------------------------------+-----------------+
| LEFT   | CENTER (full-width task input)  | RIGHT           |
| SIDEBAR|                                  | SIDEBAR        |
|        | [LAUNCH]  [4-DAO TREASURY BAND] | [Scanning...]  |
| Modes  | [HERMES ROUTER] [PAPERCLIP WRK] | [RUNBOOKS]     |
| DAO    | [10-BUCKET REVENUE ENGINE]       | [BUILD AGENT]  |
| Stack  | [TRUST HIERARCHY] [STACK INTEG] | [Mission Band] |
| Settings                                                    |
+--------+---------------------------------+-----------------+
| Footer: Mission Control Online · ⌘K · roundtable across    |
|         every AI platform · #UntilNoKidInNeed · PAWCLAW... |
+------------------------------------------------------------+
```

## Left sidebar (top to bottom)

### Mode buttons (icon + label, NEW pill on first four)
1. **Mission Control** `NEW`
2. **Mission Ledger** `NEW`
3. **AI Roundtable** `NEW`
4. **Tasks** `NEW`
5. **Code Mode** (Monaco editor + xTerm.js — local agent runtime)
6. **Create · Banana** (image gen mode — placeholder, no paid backend)
7. **Research Mode**
8. **Chat Mode**

### History block
- Header `History` + `+` button
- Empty state: `No recent chats`

### Antigravity DAO panel
- Header: `Antigravity DAO`
- Status row: globe icon · `Base L2 · 99.98% uptime` · "endpoint unreachable — retry" sub-line (panels show this string when their endpoint is dark — consistent across the whole UI)
- Treasury (4-DAO): `$2,450,892 · mirror`
- Proposals: `14 · 3 queued`
- CTA button: `Governance Hub` (gear icon, magenta accent)
- Caption: `Antigravity Platforms DAO v1.0  #UntilNoKidInNeed`

### Stack Integrity widget
- Compact telemetry tile that mirrors the right-column STACK INTEGRITY panel
- "endpoint unreachable — retry" until backend wakes

### Settings + tagline
- `Settings` button
- `for the kids · #UntilNoKidInNeed`

## Center column

### Top: task brief textbox
- Placeholder: `Type a task brief — dispatches to selected agents and creates a tracked task…`
- Submit button (disabled until input non-empty) → POST to local task router (see API contract below)

### Panel: LAUNCH
- Heading: `Launch`
- Body: `Copy a command and run it in your terminal.`
- Status: `endpoint unreachable — retry`
- Footer line: `Powered by Ollama Local Runtime`

### Panel: 4-DAO TREASURY BAND
- Header: `4-DAO TREASURY BAND` + `live` pill
- Body: `endpoint unreachable — retry` (until live)

### Panel: HERMES ROUTER
- Header: `HERMES ROUTER` + `:11435 mirror` pill + refresh button
- Body: `endpoint unreachable — retry`
- **Model chips (clickable, switches active model):** `hermes` `hermes-deep` `cfo` `code` `marketing` `kimi` `fast`

### Panel: PAPERCLIP WORKER
- Header: `PAPERCLIP WORKER` + `cloudflare` pill + refresh button
- Body: `endpoint unreachable — retry`
- Two copy buttons:
  - `copy wrangler deploy` → copies literal `wrangler deploy`
  - `copy wrangler tail` → copies literal `wrangler tail`
- Footer telemetry:
  - `tunnel · c7bc9665-3923-4977-acd7-2033838cd56e`
  - `config · C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml`

### Panel: 10-BUCKET REVENUE ENGINE
- Header: `10-BUCKET REVENUE ENGINE` + `compounding` pill
- Body: `endpoint unreachable — retry`

### Panel: TRUST HIERARCHY (always-static, no endpoint)
- `#1` **OPUS** — `conductor · dispatch · review`
- `#2` **CODEX** — `repo surgery · qwen3-coder:480b`
- `—` **OPENCLAW · OPENCODE · DROID · PI** — `situational`

### Panel: STACK INTEGRITY
- Header: `STACK INTEGRITY` + refresh button
- Body: `endpoint unreachable — retry`

## Right column

### Top: "Scanning repository…" indicator (animated)

### Panel: RUNBOOKS
- Header: `RUNBOOKS` + `open runbook` button (folder icon)
- Empty state: book icon · `Select a runbook` · `c:\Antigravity\briefings\runbooks\` (path mono, dim)
- When clicked, list `.md` files from that directory

### Panel: BUILD AGENT E1
- Avatar: `E1` (cyan bubble)
- Subtitle: `build agent`
- Title: `E1 · Emergent`
- Body: `Built this Mission Control. Now seated at the Roundtable — ask E1 what to ship next.`
- Footer: `bridged · opus / gpt / gemini`

> NOTE: keep the E1 panel visually but route any "ask E1" interaction through the local AI Roundtable / Hermes Router — do NOT call Emergent.

### Panel: Mission band
- Heart icon
- Label: `mission` · `#UntilNoKidInNeed`
- Body: `Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up. For the kids.`
- Footer: `Runway · — days · primary · youandinotai.com`

## Footer

- Left: `Mission Control Online` (cyan dot) · `Press ⌘K · roundtable across every AI platform`
- Right: `#UntilNoKidInNeed` · `PAWCLAW-ELITE-V1`

## Floating

- Bottom-right: `Gemma guide` floating button (book icon, opens an in-app help panel — placeholder OK)

## API contract (LOCAL ENDPOINTS ONLY)

Every "endpoint unreachable — retry" tile polls a local URL on a 10s interval. **Always use `fetch` with `signal: AbortSignal.timeout(2000)` and gracefully fall back to the unreachable state** — the dashboard must render fully even when every backend is down.

Endpoint base URLs come from Vite env vars (so they can be overridden per-node) — defaults below:

| Panel | Method · URL | Default | Notes |
|---|---|---|---|
| Hermes Router status | `GET ${VITE_HERMES_URL}/health` | `http://localhost:11435/health` | Returns `{status, models[]}` — populates active-chip |
| Hermes model swap | `POST ${VITE_HERMES_URL}/route` | same | Body: `{model: 'hermes'\|'hermes-deep'\|'cfo'\|'code'\|'marketing'\|'kimi'\|'fast'}` |
| Paperclip Worker | `GET ${VITE_PAPERCLIP_URL}/api/health` | `http://localhost:3100/api/health` | The local 3100 dashboard, NOT the public paperclip-hq URL |
| 4-DAO Treasury | `GET ${VITE_DAO_URL}/treasury` | `http://localhost:8787/treasury` | Returns `{balanceUsd, proposals, queued, uptime}` — stub to local mock if missing |
| 10-Bucket Revenue | `GET ${VITE_REVENUE_URL}/buckets` | `http://localhost:8787/buckets` | Returns 10 bucket allocations with 10%-cap reserve |
| Stack Integrity | `GET ${VITE_GUARDIAN_URL}/stack` | `http://localhost:9000/stack` | Calls Opus Guardian invariants endpoint |
| Task dispatcher | `POST ${VITE_TASK_URL}/dispatch` | `http://localhost:11435/dispatch` | Body: `{brief, agents[]}` → routes to Hermes |
| Runbooks list | `GET ${VITE_RUNBOOKS_URL}/list` | `http://localhost:8787/runbooks` | Returns `.md` filenames under `briefings/runbooks/` |

If any env var resolves to empty, show `endpoint unreachable — retry` and skip the fetch loop for that panel.

## Components to scaffold (file layout)

```
apps/mission-control/
├── package.json                 # name "mission-control", deps below
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── .env.example                 # VITE_HERMES_URL, VITE_PAPERCLIP_URL, etc.
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # 3-column shell
│   ├── theme.css                # IBM Plex import, color tokens
│   ├── lib/
│   │   ├── api.ts               # fetch helpers with AbortSignal.timeout
│   │   ├── usePoll.ts           # 10s polling hook with unreachable fallback
│   │   └── modes.ts             # static mode-button config
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ModeButton.tsx       # icon + label + NEW pill variant
│   │   ├── DaoPanel.tsx
│   │   ├── StackIntegrityWidget.tsx
│   │   ├── TaskBriefInput.tsx
│   │   ├── LaunchPanel.tsx
│   │   ├── TreasuryBand.tsx
│   │   ├── HermesRouterPanel.tsx
│   │   ├── PaperclipWorkerPanel.tsx
│   │   ├── RevenueEnginePanel.tsx
│   │   ├── TrustHierarchyPanel.tsx
│   │   ├── StackIntegrityPanel.tsx
│   │   ├── RunbooksPanel.tsx
│   │   ├── BuildAgentPanel.tsx
│   │   ├── MissionBand.tsx
│   │   ├── Footer.tsx
│   │   ├── ScanningRepoIndicator.tsx
│   │   └── UnreachableTile.tsx  # shared "endpoint unreachable — retry" component
│   └── icons/                   # lucide-react re-exports as named
└── public/
    └── (favicon + brand assets if any)
```

## Dependencies (lock to these — no extras)

```
react, react-dom, react-router-dom (only if Mode buttons swap routes — otherwise tab state in App)
lucide-react (icons)
clsx (class composition)
tailwindcss + autoprefixer + postcss
typescript + @types/react + @types/react-dom + @types/node
vite + @vitejs/plugin-react
```

NO state-management library. Local `useState` + the `usePoll` hook is enough. No fetch wrapper libs (axios/swr/react-query) — keep deps lean.

## Acceptance criteria

1. `cd apps/mission-control && pnpm install && pnpm dev` brings up the dashboard at `http://localhost:5173/` (or another free port).
2. With ALL backend endpoints unreachable, every panel still renders with its title + the consistent `endpoint unreachable — retry` body. Nothing throws.
3. The TRUST HIERARCHY panel and BUILD AGENT E1 panel render their static content — no fetch.
4. Sidebar mode buttons highlight the active mode and clicking changes the visible main-canvas area (Mission Control / Mission Ledger / AI Roundtable / Tasks / Code Mode / Create·Banana / Research / Chat). Other modes can be stubs with a `Coming online` placeholder for now — Mission Control is the priority view.
5. Compliance grep: zero hits for `openai`, `anthropic`, `gemini`, `emergent`, `donate`, `donation`, `charity` in `src/`.
6. `pnpm build` produces `dist/` with no errors. Static deploy to `_deploy/mission-control/` works (`cp -r apps/mission-control/dist _deploy/mission-control/`).

## Out of scope (stub or skip)

- Real Hermes Router wiring (just hit the health endpoint and parse — wiring lives elsewhere)
- Square Royalty payment flow
- Mission Ledger drilldown (placeholder route)
- Tasks tracker drilldown (placeholder route)
- Code Mode Monaco/xTerm host (placeholder route — that's OpusPawClaw's job, link out later)
- Create·Banana image generator (placeholder; we don't run paid image APIs)

## After scaffold complete

Refresh Graphify state so the new app shows up in the knowledge graph: `cd c:\Antigravity && graphify update --scope tracked`.
