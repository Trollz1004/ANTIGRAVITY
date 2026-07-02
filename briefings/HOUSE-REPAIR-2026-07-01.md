# HOUSE REPAIR — 2026-07-01

> **Authority:** Joshua Coleman (direct: "your house, your code" — Claude repo custody, subagent-preferred execution).
> **Session:** claude.ai Max / Cowork, first-party FULL authority.
> **Status:** Repair pass 1 complete. Internal briefing.

## Survey Method

Sonnet Explore subagent swept all ACTIVE surfaces for the canonical-7 banned terms
(FL §496.405), watch-list terms (tax-deductible, 60/30/10, 100% charity, Shriners),
and doctrine drift. Archives, node_modules, and historical exports excluded per the
CLAUDE.md verification standard.

## Findings and Actions

### CRITICAL — fixed
`apps/mission-control/status.html` — live public status page, dated 2026-06-04
(pre-doctrine). Contained "disbursement" in fiscal-doctrine copy, "children in need"
funding claims, and mission hashtags on a public surface.
**Fixed 2026-07-01:** fiscal bullet replaced with Square product/payments copy, vision
paragraph rewritten business-only, hashtags removed from public copy. Re-scanned clean.

### Verified CLEAN (no action)
- `apps/youandinotai-static/` generated public bundle — zero hits.
- `frontend/` (react-app + src) — zero hits; StorefrontMode.js already carries the
  "Square hosted checkout wording only" doctrine comment.
- `backend/fastapi-app/` public API responses — zero hits; legacy DB column names
  (`charitable_amount_cents`) properly isolated and aliased before exposure; a
  regression test actively guards `/api/v1/metrics/impact` against banned terms.
- Square/product copy — compliant.
- `briefings/` root — no retired framing presented as active doctrine.

### LOW — left as-is (internal tools, not customer surfaces)
- `apps/antigravity-dashboard/src/data.ts:207` — mock bucket label "Grants & Donations".
- `apps/antigravity-cockpit/` + `apps/web-prototype/` — mock agent-status/comms strings
  containing "charity".
- `apps/mission-control/src/components/CommandCenterPanel.tsx:67` — internal Ollama node
  name "Ollama Shriners".
- `apps/paperweight/static/index.html` — internal kanban tool title hashtag + JS field
  accessor.
These are internal ops surfaces. If any is ever exposed publicly, scrub first.

### Watch item
`frontend/src/modes/StorefrontMode.js` renders `kids_fund_usd` / "kids fund" runway note
from config. Not a banned term, but if that component ships on a customer surface with
that field populated, it becomes a funding claim. Recommend the field stay null/hidden
on public deploys.

## Push Status

Edits are in the working tree on the Cowork mount. Push step belongs to Sabretooth per
the push rule — branch `claude/house-repair-2026-07-01` when Joshua or a Sabretooth
session runs the git step. Files touched:
- `apps/mission-control/status.html` (scrubbed)
- `briefings/DAO-FINALIZATION-2026-07-01.md` (new)
- `briefings/DREAM-ONLINE-AND-DAO-SEPARATION-2026-07-01.md` (new)
- `briefings/FABLE-DESIGN-PROMPT-2026-07-01.md` (new)
- `contracts/ynai/README.md` (status header)
- this file

## Pass 2 (queued, subagent work)
- Structural sweep: placeholder files, stale generated bundles in
  `apps/youandinotai-static`, contradictory root docs.
- Confirm frontend build regenerates static output without retired chunks.
