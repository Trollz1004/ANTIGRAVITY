# Designer Prompt — Mission Control mode for OpusPawClaw

**Use:** Paste the block between the `=== PROMPT ===` markers into claude.ai Designer. **One shot.** Designer returns drop-in TypeScript files for the existing OpusPawClaw flagship at `c:\Antigravity\apps\opuspawclaw\` — no new app, no rebuild.

**Why this is structured this way:**
- OpusPawClaw already exists — Vite + Electron + React 19 + Tailwind v4, with `LaunchPanel`, `TaskCommander`, `SystemStatus`, `DAOMonitor`, `GitPanel`, `ProviderDropdown` already built. Mission Control is a missing **mode** alongside `code/chat/create/research/settings/mars/social`, not a new app.
- The flagship has its own visual system (cyan/magenta/gold/green on `#0a0f1a`) — Designer must match it exactly. Inventing new colors breaks the brand.
- Specifying drop-in file paths means Joshua copies the files into the existing repo and runs `npm run dev:electron`. No glue work.

---

## === PROMPT ===

You are extending an existing flagship desktop app called **OpusPawClaw** (codename `pawclaw-elite-v1`) at `c:\Antigravity\apps\opuspawclaw\`. Vite + Electron + React 19 + Tailwind v4. Owner: Joshua Coleman, mission tag `#UntilNoKidInNeed`. ~14 days runway. Mission: medical care for children.

Your task: produce a new **Mission Control** mode that drops into the existing repo. After this ships, Joshua works inside OpusPawClaw daily — Mission Control is the orchestrator surface where Opus dispatches and Joshua monitors.

### What to deliver — drop-in files

Produce **5 files** as a single artifact:

1. `src/modes/MissionMode.tsx` — the new mode component (default export). Composes existing components + your new panels into the Mission Control assembly.
2. `src/components/HermesRouterPanel.tsx` — health + virtual-model tester for the local hermes-router on `localhost:11435`.
3. `src/components/PaperclipWorkerPanel.tsx` — Cloudflare Worker deploy/health panel.
4. `src/components/RunbookViewer.tsx` — loads HTML runbooks from the user's filesystem into a sandboxed iframe (file picker UI).
5. A patch block at the end of the artifact showing the **two edits** needed in `src/App.tsx`:
   - Add `'mission'` to the `activeMode` union type.
   - Add `case 'mission': return <MissionMode />;` to `renderMode()`.
   And the **one edit** in `src/components/Sidebar.tsx` (which I haven't shown you — assume it's a list of mode buttons, infer the pattern, add a "Mission" entry with Lucide `Compass` icon).

### Existing project context — match this

**File `src/index.css`** (Tailwind v4 `@theme`) — use these tokens, do NOT invent new ones:

```
--color-bg-primary:    #0a0f1a   (deep navy-black; main background)
--color-bg-secondary:  #111827   (panel background)
--color-bg-card:       #1a2332   (card background)
--color-border:        #2a3a52   (default border)
--color-accent-cyan:   #00d4ff   (primary accent — links, status dots, headers)
--color-accent-magenta:#e040fb   (mission/branding accent — #UntilNoKidInNeed)
--color-accent-gold:   #ffb300   (warning / highlight)
--color-accent-green:  #00e676   (success / terminal / OK)
--color-text-primary:  #e8f0ff
--color-text-muted:    #6b82a6
```

**Sans body, monospace for code.** Use existing micro-typography conventions: `text-[10px]` chrome labels, `text-[8px] tracking-widest uppercase` for footers, `text-xs font-bold tracking-wide` for section titles. Status pills use `text-[8px] tracking-widest uppercase` inside `bg-{color}/10 border-{color}/20 rounded-full px-2 py-0.5`.

**Lucide icons only.** Match the existing `Copy`, `Terminal as TerminalIcon` import pattern from `LaunchPanel.tsx`.

**No login/auth.** AgeGate already wraps the app at the top level — don't add another gate.

### Existing components Mission Mode must compose (do NOT rebuild these — import them)

- `import { LaunchPanel } from '../components/LaunchPanel';` — already perfect for ollama agent dispatch (6 cards: OpenClaw/Claude/Codex/OpenCode/Droid/Pi). Reuse as-is.
- `import { TaskCommander } from '../components/TaskCommander';` — already mounted above each mode by App.tsx. Don't include it inside MissionMode.
- `import { SystemStatus } from '../components/SystemStatus';` — for the top status ribbon.
- `import { DAOMonitor } from '../components/DAOMonitor';` — for the financial / runway / revenue band.
- `import { GitPanel } from '../components/GitPanel';` — for repo state side-panel.

If any of these imports don't compile (path mismatch), use the path `../components/<Name>` and trust they exist; Joshua will fix imports.

### MissionMode layout (your job)

A **3-column grid** filling the available space:

- **Left column (240px):** stacked panels —
  1. `LaunchPanel` (the existing 6-agent launcher, full-height-ish).
  2. Below it: a small "Trust Hierarchy" card showing `OPUS #1` (cyan) → `CODEX #2` (green) → `Others (situational)` (muted).
- **Center column (flex-1):** stacked stack of —
  1. `SystemStatus` ribbon at top.
  2. `DAOMonitor` financial band.
  3. `HermesRouterPanel` (your new component — see below).
  4. `PaperclipWorkerPanel` (your new component — see below).
- **Right column (320px):** stacked —
  1. `GitPanel` (existing).
  2. `RunbookViewer` (your new component) below it.
  3. A "Mission Footer" card with the orange-magenta `#UntilNoKidInNeed` ribbon and a small "" line.

Each new panel uses the same card chrome as existing panels: `bg-[#1a2332] border border-[#2a3a52] rounded-md` with a header row (`bg-[#111827] border-b border-[#2a3a52] px-3 py-2 flex items-center justify-between`) and body (`p-3`).

### HermesRouterPanel.tsx (your component)

Polls `GET http://localhost:11435/healthz` every 5 seconds (pause when `document.hidden`). Shows:
- Status dot (green=ok, red=down, gold=timeout) + label "HERMES ROUTER" in the header.
- Three rows for the three providers (Nous / Ollama-Cloud / Ollama-Local) — provider name, base URL, enabled badge.
- Below: a horizontal scroll row of pill buttons: `hermes`, `hermes-deep`, `cfo`, `code`, `marketing`, `kimi`, `fast`. Click a pill → opens an inline test panel under the row with a textarea + "TEST" button. TEST fires `POST http://localhost:11435/v1/chat/completions` with `{ model: <pill>, messages: [{role:'user', content: <textarea>}], stream: false }`. Render the response inline; show provider + real model from `X-Hermes-Provider` and `X-Hermes-Real-Model` response headers.
- 4-second `AbortController` timeout on every fetch. On timeout: show "TIMEOUT" pill + retry link.

### PaperclipWorkerPanel.tsx (your component)

Polls `GET https://paperclip-hq.youandinotai.com/api/health` every 10 seconds (with `document.hidden` pause). Shows:
- Status dot + "PAPERCLIP WORKER" header.
- Last deploy info if the response includes `deploy_time` or `commit` fields; otherwise "deploy info not exposed".
- Two copy-to-clipboard action buttons:
  - "COPY: wrangler deploy" → `cd c:\Antigravity\infra\paperclip-worker && wrangler deploy`
  - "COPY: wrangler tail" → `cd c:\Antigravity\infra\paperclip-worker && wrangler tail`
- A small static info row showing the tunnel ID `c7bc9665-3923-4977-acd7-2033838cd56e` and tunnel config path `C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml` for reference.

### RunbookViewer.tsx (your component)

A simple HTML runbook loader:
- Header with title "RUNBOOKS" + a `<input type="file" accept=".html">` styled as a button labeled "OPEN RUNBOOK".
- Below: an `<iframe sandbox="allow-scripts allow-same-origin" srcDoc={contents}>` that displays the loaded HTML. The runbooks already contain their own copy-to-clipboard wiring; the iframe just renders.
- Empty state: instruction text "Select a runbook from c:\Antigravity\briefings\runbooks\" + a Lucide `BookOpen` icon.

### Hard rules — do not violate

- NEVER reference Claude Haiku as a model option anywhere.
- NEVER use the words "payment", "payment", or "outreach" in any UI string. The phrase "" is allowed.
- No mock data. If an endpoint is unreachable, show "endpoint unreachable" + retry. Never fabricate numbers.
- No third-party tracking, analytics, or external script tags.
- Only Anthropic-side model name allowed in UI strings is "Opus". Never "Haiku" or "Sonnet" by name.
- Match existing micro-typography. Don't import new fonts.
- All polling stops when `document.visibilityState === 'hidden'`.
- 4-second `AbortController` timeout on every fetch.

### Output format

Return one artifact containing all 5 deliverables as code blocks with file paths as code-block headers. Include a brief README at the end of the artifact (10 lines max) listing:
- The drop-in commands Joshua runs to integrate.
- Any caveats (e.g., "Sidebar.tsx patch is best-effort — verify the Lucide icon import path").

End of brief. Build it.

## === END PROMPT ===

---

## After Designer returns the artifact

1. Drop the 5 files into `c:\Antigravity\apps\opuspawclaw\src\` at the paths Designer specifies.
2. Apply the App.tsx + Sidebar.tsx patches manually (Designer's diffs are best-effort).
3. From the flagship dir: `npm install` (only if Designer added new deps — it shouldn't), then `npm run dev:electron`.
4. Click "Mission" in the sidebar — Mission Control loads.
5. From here forward, that's the working surface. Opus stays in Claude Code terminal as conductor; Mission Control is where dispatch + monitoring happen.

## Notes for Opus reviewing the returned artifact

- Verify all fetch URLs are exactly: `http://localhost:11435`, `http://localhost:11434`, `http://127.0.0.1:3100`, `http://127.0.0.1:5555`, `https://paperclip-hq.youandinotai.com`.
- Verify the visual tokens match `index.css` exactly — no invented colors.
- Verify no Haiku string anywhere.
- Verify no §496.405 trigger words.
- Verify model dropdowns / virtual-model pills match the hermes-router's actual route list.
- If Designer adds a chat-with-Opus pane to MissionMode, remove it. Opus runs in the Claude Code terminal; MissionMode is dispatch + monitor only.
