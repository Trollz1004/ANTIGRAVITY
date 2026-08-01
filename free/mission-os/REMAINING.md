# Mission Agent OS — build state

Scaffold, vendored dependencies, and the design system are in place. Eleven
source files still need pulling from the Claude Design project before it runs.

## Why it is not one file

The project has a pre-bundled `Mission Agent OS (standalone).html`, but it is
**256.5 KiB and `DesignSync.get_file` caps at 256 KiB**, so it returns truncated
mid-stream and the page fails with `Error: missing bundle data`. Do not retry
that path — it cannot succeed. Build from source instead, which stays editable.

## Done

| Path | State |
|---|---|
| `index.html` | written — loads everything below |
| `_ds/ds_bundle.js` | 142,247 chars, complete (10 components: Avatar, Button, GlassPanel, MonoLabel, StatCard, Badge, StatusPill, Input, ProductChip, SurfaceLink) |
| `vendor/react*.js`, `babel.min.js`, `lucide.min.js` | vendored — zero CDN, runs offline |

## Still to pull

Project `d20f7896-a456-4690-a642-47b340a31bd5`. Each is well under the cap.

| Fetch from project | Write to |
|---|---|
| `_ds/antigravity-design-system-58589bbe-.../styles.css` | `_ds/styles.css` |
| `ui_kits/mission-os/theme.css` | `ui_kits/theme.css` |
| `ui_kits/mission-os/data.js` | `ui_kits/data.js` |
| `ui_kits/mission-os/tweaks-panel.jsx` | `ui_kits/tweaks-panel.jsx` |
| `ui_kits/mission-os/core.jsx` | `ui_kits/core.jsx` |
| `ui_kits/mission-os/board.jsx` | `ui_kits/board.jsx` |
| `ui_kits/mission-os/fleet.jsx` | `ui_kits/fleet.jsx` |
| `ui_kits/mission-os/router.jsx` | `ui_kits/router.jsx` |
| `ui_kits/mission-os/skills.jsx` | `ui_kits/skills.jsx` |
| `ui_kits/mission-os/memory.jsx` | `ui_kits/memory.jsx` |
| `ui_kits/mission-os/spend.jsx` | `ui_kits/spend.jsx` |
| `ui_kits/mission-os/fable.jsx` | `ui_kits/fable.jsx` |
| `assets/logo/logo-favicon-32.png` | `assets/logo-favicon-32.png` |

Load order in `index.html` matters — `core.jsx` must come before the tab files,
and `app.jsx` last. It is already correct.

## What it is

Six tabs — Board (kanban), Fleet, OmniRouter, Skills, Memory, Spend — over a
simulation engine with a blocked-SLA escalation rule (30 min escalates one pay
grade, 45 min reroutes through the OmniRoute fallback chain).

Two things make it the right dashboard to stream:

- **Redact toggle.** Tweaks → Security → "Redact secrets". Secrets render as
  dots; the `Secret` component never holds a real value in the first place.
- **It refuses to lie.** In live mode it polls a real endpoint and shows a red
  `LIVE · UNREACHABLE` pill when the endpoint drops, rather than leaving stale
  green numbers on screen. The footer reads `$0.00 is the truth today`.

## Going live

Sim is the default. To drive it from real state, build a read-only
`GET /api/mos-state.json` returning `{tasks:[…], journal:[…]}` with
`Access-Control-Allow-Origin: *` and no secrets in the payload, then set
Tweaks → Source → live and point Live URL at it. The in-app "Go live" button
contains the full spec prompt.

Note: the default Live URL in the design is `http://localhost:3130` (the old
Agent Hub). Mission Control now serves `:3151` — repoint it when wiring real data.
