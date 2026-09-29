# Design handoff of 2026-05-26, placed 2026-09-28

Source: the Claude Design project "Antigravity #UntilNoKidInNeed" (project
`019e1d35-249f-75f6-9e5c-7699eaf837c5`), built in May 2026 with its own
`HANDOFF-FOR-OPUS.md`. Placed by the Claude judge lane from a cloud session on
2026-09-28, on branch `claude/design-handoff-0928`, on Joshua's instruction
("implement the selected files"). The May memo assumed a `_deploy/` tree, five
nodes, Paperclip, a Paperweight surface and a `tools/status` page; none of
those exist in the September architecture (one repo, one dashboard, two
nodes, domains served from `domains/`). Each file was mapped onto what exists
now. Nothing here changes DNS; the pending registrar click stays Joshua's.

## Where each file went

| Design file | Ruling | Home |
|---|---|---|
| `DAO Transparency.html` | placed, edited | `domains/untilnokidinneed.com/dao/index.html`, linked from the landing footer; Square-only rail, DREAM Online as bucket five, founder token proposal recorded and not adopted, Wyoming DAO LLC named as the intended form (not filed), word rule applied, fixed publish date |
| `OpusHasHands.html` | placed, edited | `domains/untilnokidinneed.com/opushashands/index.html`; word rule, two nodes, five buckets, no operator links, no email gate, no live-feed fetch |
| `Cockpit.html` | placed, edited, local only | `tools/cockpit/index.html`; LAN endpoints only, two nodes, CRD session links read from gitignored `cockpit.local.json`; CI job `cockpit-local-only` fails if it ever appears under `domains/` |
| `AntiGravity.html` (landing) | not placed | the domain already has a real landing page; the May page carries illustrative money figures and surfaces (Paperweight, Comms, Hermes 9020) that do not exist. Stays in the Design project |
| `AntiGravity Prototype.html` + `app.jsx`, `shell.jsx`, `pg-*.jsx`, `icons.jsx`, `tweaks-panel.jsx`, `theme.css` | not placed | a second dashboard with seeded agent chatter; the ruling of 2026-09-17 is that a new view is a JARVIS panel. `theme.css` and `tweaks-panel.jsx` are worth borrowing for JARVIS later; they stay in the Design project until then |
| `AntiGravity Walkthrough.html` | not placed | a tour of the prototype above |
| `STATUS Live.html`, `STATUS Live-print.html`, `uploads/STATUS.html` | not placed | JARVIS is the status surface; the seed data (CI red on a May issue, 399 of 467 tests, 166 dirty files, five nodes) is stale and would print as if live |
| `setup-antigravity-stack.ps1`, `start-dao.ps1` | not placed | scaffold three MCP servers and a Paperweight stack that the September node does not run |
| the four `(standalone)` bundles | not placed | offline mirrors of the pages above; larger than the design tool's read cap, so they could not even be copied whole |
| `uploads/*` (Perplexity export, production runbook of April, Paperweight response, kraken json, images, PDF, sheet) | not placed | reference material; the Genspark sheet is the reason Genspark is now a helper lane |

The Design project itself is the archive of record for everything not placed;
the repo does not carry a second copy.

## What the same session recorded elsewhere

- Node allocation, screenshot health cron, LAN-only endpoints, the Emergent
  and Genspark lanes: runbook §1, §5, §6, §10, §12; `mission-control/lib/nodes.mjs`;
  `mission-control/scripts/screenshot-health.mjs`; both Hermes skills.
- Verification: every placed page was opened through the local domains
  server in headless Chromium and its frame read by the judge lane. Public
  hostnames are unreachable from the cloud egress, so their live state is
  UNVERIFIED until the Hermes cron runs on Sabretooth.
- Open for Joshua: the registrar click for the three domains; setting the
  JARVIS tokens; registering the Hermes `Screenshot Health` cron; dropping
  `cockpit.local.json` beside the cockpit on the node.
