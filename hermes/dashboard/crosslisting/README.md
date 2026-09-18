# Crosslisting

Internal catalog, inventory, and marketplace listing controls.

## Features

- Catalog with verified product records
- Inventory ledger (on-hand, reserved, available)
- Channel listing previews with preflight validation
- Channel readiness for eBay and Google Merchant; review paths for other marketplaces
- Automation profiles (disabled by default)
- AI draft assist for title and description from supplied facts only
- Activity ledger and exception queue

## Guardrails

No marketplace submission is automatic. Listings stay in review until data, inventory, approval, and channel controls pass.

Secrets stay server-side. The browser only sees non-sensitive configuration status.

## Development

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

Production:

```bash
pnpm build
pnpm start
```

Default port: 3000.
