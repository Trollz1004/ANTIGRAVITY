# LLC Crosslisting OS

**LLC Crosslisting OS** is an internal operational dashboard for one canonical product catalog, controlled inventory ledger, capability-gated marketplace workflows, scoped automation profiles, and an audit-ready activity record.

The application is designed for an independently controlled LLC. Marketplace operations remain in review until the catalog record is verified, inventory is available, a payload passes validation, the channel is enabled, and the required approval has been recorded.

## What is implemented

| Area | Included controls |
|---|---|
| Catalog | Create factual product records, retain SKU and UPC values, and mark records verified before workflow use. |
| Inventory | On-hand, reserved, and available quantities; receive, reserve, release, and sale movements; atomic availability guards. |
| Listings | Persisted channel payload previews, preflight validation, channel capability checks, and exception routing. |
| Channels | eBay and Google Merchant readiness paths; prepared review paths for Facebook Marketplace, Mercari, and Poshmark. |
| Automation profiles | Disabled-by-default profiles with scoped memory, skill keys, allowed actions, channel scope, and activity entries. |
| AI drafting | Server-side `gpt-5-mini` drafts for title, description, category, and attributes using only supplied facts; every draft requires review. |
| Governance | Activity ledger, exception queue, source-governance credits view, server-only credential status, and upstream review documentation. |

## Guardrails

> **No marketplace submission is automatic.** Listing previews are stored for review and blocked when data, inventory, approval, or channel controls are incomplete.

The dashboard never sends secret values to the browser. It reports only non-sensitive configuration status. Profile memory is intended for short operational context and must not contain credentials or unverified product data.

## Channel activation

Use [`docs/SERVER_CONFIGURATION_TEMPLATE.md`](docs/SERVER_CONFIGURATION_TEMPLATE.md) to identify the names of server-side credential values. Add actual values through the secure project credential settings, not through repository files, client code, logs, or profile memory.

| Channel | Initial state |
|---|---|
| eBay | Review mode until authorized credentials, policy mappings, and explicit activation are configured. |
| Google Merchant | Review mode until authorized credentials and account settings are configured. |
| Facebook Marketplace | Prepared review workflow until eligible marketplace access is confirmed. |
| Mercari | Prepared review workflow until the applicable API product and account eligibility are confirmed. |
| Poshmark | Prepared review workflow unless authorized access is provided. |

## Upstream source governance

No third-party repository code is currently bundled or executed in this application. The source review and Hermes reference review are documented in [`docs/UPSTREAM_COMPONENT_REVIEW.md`](docs/UPSTREAM_COMPONENT_REVIEW.md) and [`docs/HERMES_REFERENCE_REVIEW.md`](docs/HERMES_REFERENCE_REVIEW.md).

Any approved Emergent component must preserve the source's required credit, visible attribution, HTTP attribution, metadata attribution, and documentation credit alongside LLC branding. See the in-app **Credits** view for the current review status.

## Development

```bash
pnpm check
pnpm test
```

Database models live in `drizzle/schema.ts`. Backend procedures are defined under `server/routers/`; the internal dashboard is under `client/src/pages/`. Refer to [`todo.md`](todo.md) for pending credentialed integrations and activation work.
