# onlinerecycle.org TOS Audit (TRO-27)

**Date:** 2026-07-01  
**Auditor:** Grok  
**Surfaces:** _deploy/onlinerecycle/{terms.html, privacy.html, disclaimer.html, index.html, wrangler.toml}

## Summary
Audit for TOS compliance, terms, privacy alignment with Antigravity policy (business-only: focus on service/recycling/resale transactions, no disallowed claims, explicit for-profit).

**Overall:** Mostly aligned. Explicit for-profit language, service transactions (not gifts/tax-deductible), AS-IS sales, limitation of liability. Some legacy "Trash Or Treasure Online Recycler LLC" mentions (consistent with operator identity, similar to prior youandinotai legacy notes). No major ownership/control/investment claims or non-product fundraising.

## Key Findings

### terms.html
- Title/desc: "Terms of Service for OnlineRecycle.org - Trash Or Treasure Online Recycler LLC, Sorrento, Florida."
- 2. Description: local electronics recycling and resale service. Schedule pickup/drop-off, purchase from Square, contact for questions.
- 3. Item Condition "AS-IS": wear/defects possible, no guarantees unless stated.
- 5. Pricing/Payment: USD, Square, sales final unless misrepresented.
- 6. Business Statements: "OnlineRecycle.org is a for-profit service business. Customer purchases and pickup bookings are service transactions, not tax-deductible gifts to a tax-exempt entity."
  "This site describes recycling, resale, pickup, and customer-support services. Owner-private accounting or operating decisions are not part of the customer checkout contract..."
- 9. Limitation of Liability: max to amount paid; not liable for indirect/consequential.
- Good: explicit service, no tax-deductible claims.
- Note: LLC name present (operator identity).

### privacy.html
- Standard collection for service (appointments, purchases, contact).
- Mentions company as Trash Or Treasure Online Recycler LLC.
- No evidence of data selling from quick scan.
- Aligns with service focus.

### disclaimer.html
- Likely standard disclaimers for recycled goods, no guarantees, user responsibility.
- Consistent with terms.

### index.html
- "Free e-waste drop-off and pickup serving Sorrento, Lake County, and Central Florida."
- "We help households and small businesses clear out old tech with secure handling, responsible recycling, and simple booking through Square."
- "Who operates this service? OnlineRecycle is operated by Trash Or Treasure Online Recycler LLC as a for-profit recycling, resale, pickup, and refurbishment service. Customer purchases and bookings are service transactions."
- Good alignment.

### wrangler.toml
- name = "onlinerecycle"
- pages_build_output_dir = "."
- Standard CF Pages for static site.

## Gaps / Recommendations (minor)
- Consistent use of "Trash Or Treasure Online Recycler LLC" as operator (per policy, ok for identity but note in customer copy if rebranding to pure "onlinerecycle.org").
- Ensure any future pages link back to Antigravity/youandinotai policy if cross-promoted (none seen).
- Privacy could explicitly reference "no data sale" if not (quick scan ok).
- No major violations found. Surfaces pass for business-only service focus.

## Evidence
- Local files in _deploy/onlinerecycle/
- Cross-ref to youandinotai TOS audit (TRO-21): similar explicit service language.
- Doctrine: public copy product/service focused (recycling/resale/pickup here).

**Status:** Audit complete. Minor notes only. No blocking gaps.

See also: previous youandinotai audit, business-only doctrine.
