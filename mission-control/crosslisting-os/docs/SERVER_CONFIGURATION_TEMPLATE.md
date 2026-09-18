# Server Configuration Template

Copy these **names only** into the project’s secure server-side credential settings. Leave any channel blank until the LLC has authorized access. Do not place values in browser code, source files, logs, profile memory, or repository configuration.

| Channel | Server-side credential names | Operational state before configuration |
|---|---|---|
| eBay | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REFRESH_TOKEN` | Review mode; create and revise operations remain disabled. |
| Google Merchant | `GOOGLE_MERCHANT_CLIENT_ID`, `GOOGLE_MERCHANT_CLIENT_SECRET`, `GOOGLE_MERCHANT_REFRESH_TOKEN`, `GOOGLE_MERCHANT_ACCOUNT_ID` | Review mode; synchronization remains disabled. |
| Facebook Marketplace | `FACEBOOK_MARKETPLACE_ACCESS_TOKEN` | Prepared review mode until approved marketplace access is confirmed. |
| Mercari | `MERCARI_API_ACCESS_TOKEN` | Prepared review mode until the eligible API product and account are confirmed. |
| Poshmark | `POSHMARK_ACCESS_TOKEN` | Prepared workflow only unless authorized access is supplied. |

The dashboard reports only whether a required secret is configured. It never receives, displays, returns, or logs a secret value.
