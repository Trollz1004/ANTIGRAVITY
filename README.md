# trollz1004/hermes

Ultimate Hermes Agent dashboard with multi-bridge integration.

## What's Inside

- `dashboard/` — Standalone HTML dashboard (Obsidian + Hermes + Buzz + Claude Code + Copilot + Browser)
- `skills/` — Custom topic-based skills (caveman, brainstorm, session-memory, etc.)
- `docs/` — Documentation
- `scripts/` — Utility scripts

## Dashboard Features

| Panel | Bridge | Status |
|-------|--------|--------|
| Overview | All systems | ✅ |
| Buzz | Slack-like agent chat | ✅ |
| Obsidian | Local REST API | 🔌 |
| Hermes | Session memory + skills | ✅ |
| Claude Code | Headless CLI | 🔌 |
| Copilot | BYOK endpoint | 🔌 |
| Browser | Chrome CDP | 🔌 |
| Skills | 12 custom + 7 caveman | ✅ |

## Quick Start

```bash
# Open dashboard
termux-open dashboard/index.html

# Or serve locally
cd dashboard && python -m http.server 8080
```

## Skills

All skills load automatically on session start via AGENTS.md preload.

- **caveman** — 65% token compression
- **brainstorm** — Structured ideation with scoring
- **session-memory** — Session start/end persistence
- **frontend-react** — React 19 patterns
- **nextjs** — App Router, RSC, caching
- **design-ui** — Design systems, accessibility
- **mobile** — React Native, Expo
- **agent-workflow** — Multi-agent orchestration
- **database** — PostgreSQL, Supabase, RLS
- **testing** — TDD, Playwright
- **marketing** — SEO, copywriting, CRO
- **youtube-automation** — Upload, SEO, analytics

## License

MIT
