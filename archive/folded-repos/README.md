# Folded repos

Content rescued from standalone GitHub repos before they were archived, under the
consolidation rule: two repos survive — `ANTIGRAVITY` (everything non-game) and
`dream-online` (the game).

Archiving on GitHub is **read-only, not deletion** — the source repos remain
readable. These copies exist so the content is reachable from the monorepo without
going back to a frozen repo, and so archiving costs nothing.

| Folded from | What was worth keeping | Left behind |
|---|---|---|
| `Ai-Solutions-Store/revenue-first-products` | `CEO-API-QUICKREF.md`, `hermes-clean-revenue.yaml`, its README | nothing — that was the whole repo |
| `Trollz1004/ai-marketplace-grok-production` | `README.md` (16 KB — the only real content) | `deploy.sh` (12 bytes), `docker-compose.grok.yml` (20 bytes), `services/main-app/src/index.js` (12 bytes) — all empty stubs |

READMEs are stored as `README.source.md` so they do not shadow this index.

## Not folded here, deliberately

- `Trollz1004/DREAM-ONLINE-MMORPG-PvP-OPENWORLD-OR-OPEN-DREAM-` — README only, and
  it is game material. It belongs in `dream-online`, not in this repo.
- `Trollz1004/llc-crosslisting-os` — its work is real and lives at
  `apps/crosslisting-os`, not on this shelf. See that directory's `PROVENANCE.md`.
- `youandinotai-links`, `youandinotai-join` — **not archived at all.** Both serve
  live GitHub Pages (verified HTTP 200 on 2026-08-26) and campaign traffic is
  pointed at the links one from `mission-control-v5/server/data/marketing-queue.json`.
  They are deployment targets, not code repos, and are a standing exception to the
  two-repo rule.
- `MANUS-Has-Hands` — holds a committed credential dump. Audit and rotate before
  folding anything out of it.
