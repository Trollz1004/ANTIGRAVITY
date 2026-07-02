# TOS Audit Report - YouAndINotAI Customer Surfaces (TRO-21)

**Date:** 2026-07-01  
**Agent:** Grok (14a7fdb9-c07a-4904-921b-0374bceec622)  
**Issue ID:** e10cd5fa-4fbb-43c7-a7ae-a42da64f2852  
**Surfaces audited:** youandinotai.com (frontend app), related (privacy, cookies, terms pages); quick check on legacy deploys and backend.

## Summary
Main customer surfaces in `apps/youandinotai-frontend/app/{terms,privacy,cookies}/page.tsx` are **compliant** with current business-only doctrine (membership, verification, safety, support, uptime, platform value).

Key excerpts confirm:
- Purchases buy "app access, account verification, safety features, matching tools, support, and related platform services."
- Explicit: "A purchase does not create ownership, voting rights, control rights, or investment rights."
- "Payments are processed by Square."
- "YouAndINotAI does not sell personal data. Public product copy should stay focused on membership, verification, support, safety, uptime, and platform value."
- Focus on dating safety, profiles, discovery, chat, plans, support, refunds, cookies for checkout/sign-in/fraud/safety.
- No disallowed language (no old fundraising, control claims, owner-private decisions, non-product framing).

## Detailed Findings

### Terms of Service (app/terms/page.tsx)
- Who can use: 18+, accurate details.
- Membership and verification: clear product access language + disclaimer on no ownership/voting/control/investment.
- Checkout: Square processing, keep receipt.
- Dating safety rules: respect, no harass/impersonate/scam, public meets, report.
- Profiles/discovery/chat/plans: helps create, verify, discover, chat, safer plans. No guarantees.
- Support/account actions: review reports, verification, payments, privacy, recovery; restrict/remove for rules/safety.
- Refunds/changes: depends on product/Square/law; features may change.
- Privacy/cookies: links to policies; necessary cookies for checkout/sign-in/fraud/safety/session.
- Good alignment with doctrine.

### Privacy Policy (app/privacy/page.tsx)
- Info collected: account/profile/photos/preferences/verification/support/safety reports/privacy requests.
- Checkout: Square processes; we use status/receipt/product for membership/verification/support/access.
- Use: profiles, verification, discovery, matches, chat, safe plans, support, fraud, recovery, safety.
- Safety/moderation: review reports/blocks/verification to protect/enforce.
- Cookies/device: necessary for sign-in/checkout/fraud/safety/session; optional for prefs/diag.
- Choices: support for access/export/correction/deletion; some kept for receipts/safety/legal.
- Explicit: "YouAndINotAI does not sell personal data. Public product copy should stay focused on membership, verification, support, safety, uptime, and platform value."
- Excellent.

### Cookie Policy (app/cookies/page.tsx)
- Strictly necessary: checkout, sign-in, fraud, safety, recovery, session security.
- Preference: theme/display (optional).
- Performance: diagnostics for broken pages/checkout/app reliability (optional).
- Changing choices: clear site data; essential may still be needed.
- Good, focused on functional/safety needs.

## Other Surfaces Quick Check
- Legacy _deploy/youandinotai/legal/ and onlinerecycle etc.: older static HTML; not primary customer surface (app is source of truth). No major disallowed phrases in quick scan.
- Backend (fastapi-app): no prominent public TOS/privacy pages found in quick search (focus is API endpoints). Health/docs may link to main site.
- No API-specific TOS found; main customer TOS is frontend.

## Required Fixes / Recommendations
- **None major.** Current app pages are clean and doctrine-aligned (as of June 23, 2026 updates in metadata).
- Minor suggestion: Ensure any future changes to these pages (or new surfaces) continue explicit disclaimers and product-focus language.
- For completeness: Consider adding a link from API docs/health to main /terms if public API has user-facing elements.
- Pre-push hook (related TRO-16) would help prevent drift long-term.
- Legacy deploys: if still served, sync or deprecate to avoid confusion.

## Evidence / Artifacts
- Source pages read from apps/youandinotai-frontend/app/{terms,privacy,cookies}/page.tsx
- Compliance phrases extracted (see tool output in heartbeat).
- Related prior work: TRO-8 (compliance), TRO-16 (pre-push hook), deploy verifs.

**Status:** Audit complete. Surfaces pass. Documented findings + minor recs. No blocking issues found.

This advances Q3 Foundation / TRO-1 plan and public copy hygiene.
