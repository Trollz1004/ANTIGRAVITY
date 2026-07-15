# ANT Roles and Permissions Matrix

## Scope

- Ticket: **TRO-295** (ANT)
- Objective: Define user roles and permissions for the business-exchange and funding surfaces.
- Product-first scope: membership, verification, trust and safety, support, matching, account recovery, and checkout operations.

## Roles

- **Visitor**: Unauthenticated user browsing public product pages and request flows.
- **Founder**: Verified project creator with a submitted or active business-exchange profile.
- **Investor**: Verified member investing or completing funding due diligence and checkout.
- **Operator**: Operations staff with product support and moderation duties.
- **Admin**: Internal platform manager with full operational control on business-exchange functions.

## Permissions Matrix

| Capability | Visitor | Founder | Investor | Operator | Admin |
|---|---:|---:|---:|---:|---:|
| View public pages and public profiles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit account sign-up / start verification | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complete identity or membership verification | ✅ | ✅ | ✅ | ✅ | ✅ |
| Access support center / raise ticket | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own account profile | ✅ | ✅* | ✅* | ✅* | ✅ |
| Edit own profile/contact details | ❌ | ✅ | ✅ | ❌ | ✅ |
| Publish or edit own business listing | ❌ | ✅ | ❌ | ❌ | ✅ |
| View all public opportunities | ✅ | ✅ | ✅ | ✅ | ✅ |
| View private/funded opportunity details | ❌ | ✅ | ✅* | ✅ | ✅ |
| Submit investment interest / application | ❌ | ❌ | ✅ | ❌ | ✅ |
| Make funding checkout payment | ❌ | ❌ | ✅ | ❌ | ✅ |
| View own transaction receipts and billing status | ✅* | ✅* | ✅* | ✅* | ✅ |
| Request account recovery | ✅ | ✅ | ✅ | ✅ | ✅ |
| Resolve disputes / support escalations | ❌ | ❌ | ❌ | ✅ | ✅ |
| Moderate listings and listings comments | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspend/restore user access (safety actions) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Review identity/verification holds | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create/update internal operator notes | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles and permission assignments | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configure platform-wide policies and safety gates | ❌ | ❌ | ❌ | ❌ | ✅ |
| Access platform analytics / audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |

## Notes

- `✅*` means this action is restricted to the authenticated owner and only for their own account context.
- Founders cannot approve their own funding payouts or resolve safety incidents involving other users.
- Operators may act only within documented support/SLA and trust-and-safety boundaries.
- Admin includes elevated access for emergency interventions, policy updates, and compliance actions.
