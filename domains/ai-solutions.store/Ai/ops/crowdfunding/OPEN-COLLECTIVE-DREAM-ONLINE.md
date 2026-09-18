# DREAM Online crowdfunding on Open Collective — state and plan

**Date:** 2026-09-03 · **Lane:** Claude judge · **Status:** plan + tooling; the
collective itself does not exist yet and needs one of Joshua's clicks.

## What exists today (VERIFIED via `api.opencollective.com/graphql/v2`, no auth)

| Field | Value |
| --- | --- |
| Slug | `until-no-kid-in-need` |
| Name | Trash or Treasure Online Recycler LLC |
| Type | **ORGANIZATION** — not a Collective |
| Description | "Multiple Platforms To Help Kids in Need" |
| Website | https://github.com/Trollz1004 |
| isActive | **false** |
| Balance / received / contributors | $0 / $0 / 0 |
| Host | none |

The dashboard Joshua linked (`/dashboard/until-no-kid-in-need/overview`) is that
organization's dashboard. On Open Collective an **Organization** is a legal
entity that *contributes* or *hosts*; it cannot itself run a crowdfunding page
with tiers and goals. Money is raised by a **Collective**, and every Collective
needs a **Fiscal Host** that holds the funds.

So "set up DREAM Online crowdfunding" is a two-object job: a Collective for the
game, and a Host to hold its money.

## The two viable shapes

### A — Organization becomes the Fiscal Host (recommended)

The LLC (`until-no-kid-in-need`) enables fiscal hosting, connects its Stripe
account for card payments, and hosts its own Collectives:

- `dream-online` — the game
- later: `ai-solutions-store`, `online-recycle`, the kids fund itself

Why this one: the funds sit with the LLC that already exists, it matches the
"multiple platforms" mission, uses the Stripe rail Joshua already runs, and
needs no application to a third-party host. Open Collective's platform
fee applies (they take a share of contributions on independent hosts — read the
current pricing page before promising a number; **do not quote a percentage
from memory**).

Steps (all Joshua, in the browser, ~15 minutes):
1. Dashboard → the organization → **Fiscal Host** → "Activate as host". Requires
   the org to be active and to have legal + bank details filled in.
2. Connect **Stripe** on the host (card payments) and optionally PayPal / bank
   transfer as manual payment methods.
3. Create the Collective: Dashboard → **Create Collective** → name
   `DREAM Online`, slug `dream-online`, category *Open source* or *Gaming*,
   choose "I already have a fiscal host" → pick the LLC. Hosts self-approve.
4. Add tiers (below), a goal, and the "About" copy from
   `apps/landing/dream-online/index.html` (business-only, already written).
5. Swap the `CROWDFUND_URL` constant in that landing page to
   `https://opencollective.com/dream-online` and redeploy.

### B — Open Source Collective as host

Apply at https://opencollective.com/opensource/apply. Faster to money if
accepted, no Stripe setup, but they require an open-source license on the code
and take their host fee, and the funds sit with OSC, not the LLC. The game repo
is public; the original design carries **CC BY-NC-SA** (`dream-live-npc`,
restored in `24f0faf5`) — NC clauses are usually *not* accepted as open source
by OSC. Shape B is a fallback, not the plan.

## Proposed tiers (draft — Joshua sets prices)

| Tier | What backers get | Notes |
| --- | --- | --- |
| Backer | name in the credits, dev-log access | one-time or monthly |
| Founder | Backer + founding-player badge at launch | one-time |
| Guild | Founder ×5, a named guild hall at launch | one-time, limited |
| Sponsor | logo on the site + in-game billboard (business-only copy) | monthly |

Goal: the first milestone should be a concrete, checkable deliverable
("playable alpha of the starter zone"), not a dollar amount alone.

Nothing here promises a percentage to the kids fund — the landing page
deliberately omits it. If Joshua wants a stated split, it goes on the OC page
as a written policy first, then on the site.

## Tooling in this folder

- `oc-create-collective.py` — GraphQL `createCollective` + `createTier` against
  v2. **Dry-run by default**; needs `OPENCOLLECTIVE_TOKEN` (a personal token from
  Dashboard → Settings → For developers → Personal token, scopes `account`,
  `collective`/`host`). Put it in `.env`, then
  `ops/paperclip/import-env-secrets.py` moves it into Paperclip. The script
  reads the token from the environment and never prints it.
- The token is **not** in `.env` today (13 keys, none OC) — so the script is
  **NOT CONFIGURED** until Joshua mints one.

## Other use cases on the same host (Joshua: "among other use cases")

Once the LLC is a host, each platform gets its own Collective with its own
ledger and public transparency page — that *is* the "everyone knows what we
did" property, for money:

- `until-no-kid-in-need` fund — the kids fund itself, receiving the platform
  contributions from the others (Open Collective supports collective-to-
  collective contributions on the same host).
- `ai-solutions-store` — marketplace revenue sponsorships / early-access.
- `online-recycle` — recycler community support.
- Bounties: OC **Expenses** let contributors on any node file an invoice against
  a Collective — a clean way to pay a DREAM Online contributor from the
  Collective's balance with a public record.

## Needs Joshua's click (his dashboards, not a permission gate)

1. Activate the organization and turn on fiscal hosting (shape A), or apply to
   OSC (shape B).
2. Mint `OPENCOLLECTIVE_TOKEN` → `.env` → Paperclip.
3. Tier prices and the first milestone wording.

## DONE 2026-09-03 20:19 UTC — the Collective is live (VERIFIED via authenticated GraphQL)

Joshua did the dashboard side the same evening (shape A, exactly as planned):
- `until-no-kid-in-need` is now `isActive: true`, **`isHost: true`**.
- Collective **`dream-online`** exists, hosted by the LLC, `isApproved: true`
  (approved 2 s after creation — host self-approval), `isActive: true`, USD.
  Description matches the plan verbatim; website `dream-online.net`; GitHub
  `Trollz1004/dream-online`; tags `gaming`, `open source`.
- Tiers (Joshua's prices): **Backer** flexible $5+/mo · **Founder** $25 one-time ·
  **Sponsor** $100+/mo · **Guild** $2,000 one-time, max 50.
- Balance $0, 0 contributors — page is ready, nothing raised yet.
- `OPEN_COLLECTIVE_API_KEY` is in `.env` and in the Paperclip store for ANT, AIS,
  DRE. It authenticates as user `untilnokidinneed` (ADMIN of both the org and
  the collective). The API needs a `User-Agent` header or it 403s — the script
  sends one now.
- Landing page `CROWDFUND_URL` switched to `https://opencollective.com/dream-online`.

Still open: a public **goal** ("playable alpha of the starter zone") and
`longDescription` on the collective page are empty; `oc-create-collective.py`
now reports "already exists" and is retired to reference.
