Scan all frontend code for Florida §496.405 violations.

## Context
Under Florida Statutes §496.405, our 60/30/10 charity split is a **contractual revenue disbursement**, NOT a donation or solicitation. Using "donate" or "donation" language in customer-facing code creates legal risk.

## Steps

1. **Scan all frontend source files** for the words "donate", "donation", "donations", "donating":
   - `youandinotai/src/**/*.{tsx,ts,jsx,html}`
   - `antigravity/**/*.{tsx,ts,jsx,html}` (excluding node_modules)
   - `revenue-core/**/*.{tsx,ts,jsx,html}`
   - `_deploy/**/*.{html,js}`
   - `mcp-server/src/**/*.{ts}`

2. **For each match**, classify as:
   - **VIOLATION**: Word used in a way that implies WE are soliciting donations
   - **SAFE**: Word used in legal disclaimer context ("not a donation/solicitation")
   - **EXTERNAL**: Link to Shriners' own donation page (their URL, their language)

3. **Also scan for related risky terms**:
   - "charitable contribution"
   - "tax-deductible" (we cannot claim this for OUR platform)
   - "solicitation" (unless in disclaimer)
   - "501(c)(3)" used to describe US (we are an LLC, not a nonprofit)

4. **Report**: Total violations found, file:line for each, suggested replacement language.

## Approved replacement terms
- "donation" → "disbursement" or "revenue split"
- "donate" → "support" or "give back"
- "charitable contribution" → "contractual revenue disbursement"
- "tax-deductible" → REMOVE (we cannot make this claim)
