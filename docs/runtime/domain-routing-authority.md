# Domain Routing Authority

Source data: `ops/mission-control/domain-routes.json`

Mission Control owns the routing map. Live DNS changes are operational changes,
not chat notes. Apply them only after the target service, node, local port,
protection mode, and rollback path are explicit.

T5500 owns Cloudflared, public proxy/front-door routing, and always-on repair.
Sabretooth is the dev/control workstation. Do not run Cloudflared, watchdogs,
sentries, Hermes loops, or MCP proxy autostarts on Sabretooth.

## Current Routing Intent

| Domain | Lane | Target | Method |
| --- | --- | --- | --- |
| `aidesistail.online` | Date App | T5500 date-app gateway | Cloudflare Pages or T5500 tunnel |
| `ai-solutions.store` | AI-Solutions / Business Exchange | Business exchange storefront/API | Cloudflare Pages plus T5500 backend route |
| `onlinerecycle.net` | Online Recycle | Online recycle public site | Cloudflare Pages or T5500 tunnel |
| `untilnokidinneed.com` variants | Holding / Boundary | Park, noindex, or redirect only | Cloudflare redirect/holding page |
| `dream-online.org` | DREAM ONLINE | Game landing/docs first | Static landing; game services private |
| `mission.ai-solutions.store` | Mission Control | Sabretooth Mission Control via T5500 proxy only if approved | Cloudflare Access protected tunnel only |
| `paperclip.ai-solutions.store` | Optional Paperclip | Standby workbench | T5500 Access tunnel only if approved |
| `hermes.ai-solutions.store` | Hermes workbench | T5500 dashboard/workspace links | T5500 Access tunnel only if approved |
| `fcc.ai-solutions.store` | FCC | `:8082` and `/admin` | Private LAN first; T5500 Access only if approved |

## Port Rules

- Mission Control: authoritative board. Current live local port is `:3222`
  because third-party Paperclip occupied `:3110`; intended authority port is
  `:3110` when the port is free.
- Optional third-party Paperclip: standby workbench, default `:3111`.
- Hermes dashboard: official dashboard stays on `:9119`.
- Hermes workspace: movable workbench. Do not assume `:3000`; move it when it
  conflicts with date-app or other APIs.
- FCC server: `:8082`; admin UI is `/admin`.
- Claude official: `https://claude.ai`.
- Codex official/OpenAI GPT app: external tool link only unless an official local
  integration is configured.
- Slack: external collaboration link/tool lane; no automated posting without
  approval.

## DNS Safety

- Public product domains can use Cloudflare Pages or production tunnels.
- Private control surfaces must use Cloudflare Access if exposed at all.
- Cloudflared runs on T5500, not on Sabretooth.
- Sabretooth startup must remain safe: Mission Control only, no watcher/sentry
  loops, no background browser controllers, no Hermes/FCC/MCP autostart.
- Holding domains must not publish private mission, giving, split, tax,
  ownership, voting, investment, or non-product public claims.
- No DNS apply script may print tokens or `.env` values.
- No worker node can become a second command center through DNS.
- All DNS changes must be logged back into Mission Control events.
