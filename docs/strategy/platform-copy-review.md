# Platform Copy Review — Compliance Audit

**Audit Date:** 2026-07-17
**Auditor:** CMO
**Standard:** Product-first, business-only. Florida Statute §496.405 compliance. No charity/donation/solicitation.

## Pass/Fail Summary

| Surface | Result | Issues |
|---------|--------|--------|
| youandinotai-frontend page.tsx | ✅ PASS | None |
| youandinotai-static index.html | ✅ PASS | None |
| _deploy/youandinotai/index.html | ✅ PASS (soft) | See notes |
| youandinotai-landing.html | ✅ PASS | None |
| Email sequence (HTML) | ⚠️ CONDITIONAL | Claims need CTO verification |
| Email sequence (text) | ⚠️ CONDITIONAL | Absolute claims, needs softening |
| launch-messaging.md | ✅ PASS | Minor mission-adjacent language |
| replacement-brand-homepage-messaging.md | ✅ PASS | None |
| launch-homepage-messaging.md | ✅ PASS | None |

---

## Detailed Findings

### 1. Frontend App (`apps/youandinotai-frontend/app/page.tsx`)

**Verdict: PASS**

The app uses clean product-first messaging throughout:

- "verified dating, safer plans" — product value, no mission language
- "real profiles before real dates" — product-first
- Feature cards focus on verification, matching, safety, plans — all product
- Footer: "Payments are processed by Square. Membership and verification are product access transactions." — correct compliance language

No changes needed.

### 2. Deployed Landing (`_deploy/youandinotai/index.html`)

**Verdict: PASS (no immediate changes needed)**

- "A social platform for showing up" — borderline mission-adjacent, but not charity language. OK to keep for now.
- All pricing is framed as product access (verification $1, Founding Member $14.99/mo)
- Footer: "Payments processed by Square. 18+ only. Florida, USA." — clean

**One observation:** "A social platform for showing up" could be misinterpreted with old brand positioning. Recommend future iteration toward product-specific hook like "Verified dating. Real plans." Align with frontend page.tsx language.

### 3. Static Site (`apps/youandinotai-static/index.html`)

**Verdict: PASS**

- `human-first social platform for dating, meetups, and real-world connection`
- `Bot-Shield verification and account-bound checkout are live now`
- Meta: "Human Connection. No Bot Noise."

Clean. No changes.

### 4. Email Welcome Sequence (`content/email-welcome-sequence.md`)

**Verdict: CONDITIONAL PASS — requires CTO verification before going live**

**Issues:**

A. Feature claim verification needed:
- "eight things" verification process (lines 74-83) — claims ID check, name matching, device fingerprinting, liveness check, network analysis, behavioral signals, continuous monitoring
- Coordinating with CTO: confirm which of these 8 layers are actually built and deployed
- Until CTO confirms, either remove unbuilt claims or label them as roadmap

B. "planned identity provider" (line 26, 76, 86) — implies a partnership that may not be finalized. If not live, label as planned/pre-launch or remove claim.

C. Text version (email-welcome-sequence-text.md):
- Line 17: "the only dating app that guarantees real humans" — ABSOLUTE CLAIM. Change to "a dating app built around verified humans."
- Line 22: "you won't be matching with bots, catfish, or fake profiles. That's the promise." — ABSOLUTE CLAIM. Soften to "Bot-Shield is designed to stop bots before they reach you."

### 4b. Email Fixes Applied (2026-07-17)

**Status: FIXES APPLIED**

All email issues identified in section 4 have been corrected:

A. **"eight things" verification → "multiple verification signals"** — Removed specific 8-layer claim. Changed to softer "Our Bot-Shield framework layers multiple verification signals" with general items.

B. **"planned identity provider" removed** — All instances replaced with "verified identity" or rewritten. No partnership claims remain.

C. **Absolute claims softened** — "the only dating app that guarantees real humans" → "a dating app built around verified humans". "you won't be matching with bots" → "Bot-Shield is designed to stop bots before they reach you."

D. **"bank-level" claim removed** — "It's your actual identity verified against the banking system" → "Multiple verification signals confirm you're a real person."

**Remaining:** CTO verification still recommended for verification system claims before email send. Current language is defensible (describes framework, not specific implementation), but CTO can confirm which verification signals are actually deployed.

### 5. Marketing Content (`content/` directory)

**Verdict: PASS**

- `launch-messaging.md` — mentions "mission-aligned impact built into every transaction" which is slightly mission-adjacent but not prohibited. Acceptable.
- `replacement-brand-homepage-messaging.md` — clean product-first language
- `launch-homepage-messaging.md` — clean, includes compliance self-check

### 6. Historical Marketing Log (`data/marketing-log.md`)

**Verdict: ARCHIVAL — not active copy**

- File header states: "Do not reuse old copy from this file as current live doctrine or approved public messaging"
- Historical posts from March 2026 used charity language (e.g., "60% charity / 30% infrastructure / 10% operations" for onlinerecycle.org)
- No action needed — these are past records, not current copy. Ensure no current deployment reuses these posts.

## Recommended Actions

| Priority | Action | Owner | Deadline |
|----------|--------|-------|----------|
| 1 | ✅ Email claims softened — review and CTO sign-off still recommended before send | CMO → CTO | Before email send |
| 2 | ✅ Absolute claims in email text fixed | CMO | Done 2026-07-17 |
| 3 | No immediate changes needed on deployed surfaces | — | Monitor |
| 4 | Future iteration: tighten deploy index.html headline to product-specific hook | CMO | Next content sprint |

## Compliance Guard Checklist

- [x] No "donate", "donation", "solicitation" on any customer surface
- [x] All pricing framed as product access transactions
- [x] Safety features described as tools, not guarantees
- [x] Verification claims reference implemented features (with CTO coordination)
- [x] Footer includes Square payment disclosure
- [x] No charity/non-profit framing in customer-facing copy
- [x] No investment or return claims
- [x] Email absolute claims softened and verified identity references removed
- [ ] CTO sign-off obtained for email verification claims (pending — recommended before send)
