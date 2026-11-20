# LLC Crosslisting OS Architecture

## Operating model

LLC Crosslisting OS is an internal system for a single LLC. It maintains one canonical product catalog and creates marketplace-specific listing work only from verified catalog records. The catalog is the source of truth for SKU, UPC, title, condition, product attributes, media references, price, quantity, and fulfillment defaults.

No marketplace action is implicitly authorized. A listing creation, revision, inventory reservation, or sold-item synchronization event must carry an explicit rule, a recorded approval requirement, and an activity-log entry. The system must retain the before-and-after state of every attempted action.

## Core modules

| Module | Responsibility | Control boundary |
|---|---|---|
| Canonical catalog | Stores verified product and media facts. | Only verified records can generate a listing payload. |
| Inventory ledger | Tracks on-hand, reserved, and available quantity. | Available quantity may never be negative. |
| Channel adapters | Translate catalog records into channel-specific payloads. | A channel can submit work only when enabled and capability checks pass. |
| Approval controls | Gates create, revise, and synchronization actions. | Approval policy is evaluated before submission. |
| Exception queue | Holds invalid, incomplete, unsupported, or failed work. | Exceptions require a recorded resolution. |
| Automation profiles | Give each approved use case a scoped purpose, memory reference, skill set, and allowed actions. | Profiles cannot bypass approvals or access credentials. |
| Activity ledger | Records actions, decisions, payload outcomes, and status changes. | Entries are append-only from application workflows. |
| Credentials and policy settings | Reports non-sensitive connection state and operating defaults. | Secret values remain server-side environment values and are never returned to the browser. |

## Channel capability model

Each marketplace has an adapter record and a capability state. Capability determines whether the dashboard can prepare a payload, validate a payload, submit a request, or only produce a human-review workflow. The channel state may be changed only through LLC-owned configuration controls.

| Channel | Initial capability | Initial operation mode |
|---|---|---|
| eBay | API-capable after authorized credentials are configured. | Import, payload preparation, and approval-gated create or revise requests. |
| Google Merchant | API-capable after authorized credentials are configured. | Product-data payload preparation and approval-gated synchronization. |
| Facebook Marketplace | Conditional. | Payload preparation and review until approved marketplace access is confirmed. |
| Mercari | Conditional. | Payload preparation and review until the exact eligible API product and account are confirmed. |
| Poshmark | Prepared workflow. | Export and review only unless authorized access is supplied. |

## Controlled listing flow

1. A user verifies the canonical product record.
2. The selected channel adapter creates a preview payload.
3. Required-field validation runs against the channel capability and policy mapping.
4. Invalid or unsupported work enters the exception queue with a precise reason.
5. A logged rule determines whether the action requires approval. Listing submission requires approval by default.
6. When approved and the channel is enabled, the server-side adapter submits the action using LLC-owned credentials.
7. The result is written to the channel listing record and activity ledger. Any inventory impact is executed as a ledger transaction.

## Inventory protection

The system calculates available inventory as on-hand quantity minus active reservations. A channel listing can reserve quantity only after it passes validation and enters an approved state. A sold-item event commits the matching reservation; cancellation or failed submission releases it. Cross-channel quantity changes become logged synchronization events so incomplete or conflicting events can be reviewed in the exception queue.

## Automation profiles

An automation profile is not an unrestricted agent. It is a named, LLC-owned execution profile with a specific use case, a short retained memory summary, assigned skills, allowed actions, channel scope, an enabled or disabled state, and a mandatory approval policy. Each run emits activity entries and may only act through the same rule, validation, and approval services used by the dashboard.

## External component registry

Any component copied from an external repository must be added to a component registry before use. The registry records the source repository URL, commit or release reference, license, attribution text, integration boundary, and review status. No external code is imported or executed solely because it appears in a repository. This keeps branding credit visible and preserves a reviewable provenance trail.

## Service boundaries

The first release uses one authenticated application with internal modules rather than prematurely splitting the dashboard into independent runtime services. The catalog, inventory ledger, adapters, approvals, exceptions, profiles, and audit records share one transaction boundary. If a channel workload later needs a separately deployed worker, it must use the same database contracts and write back through the activity ledger.
