# Affiliate Attribution Protocol (Verified Prod V1.0)

Role: Lead Architect (Wingman)
Objective: Capture and persist influencer referrals yielding 50% revenue share.

### 1. Frontend: Capture & Persist (Aider)
- Logic: implement a context-based URL parameter listener.
- Capture: Read the `ref` parameter from the URL (e.g., `/register?ref=bot-slayer`).
- Persistence: Store the value in `LocalStorage` as `antigravity_partner_id`. 
- Payload: Inject `partner_id` into the `AuthRegisterRequest` payload for verification.

### 2. Backend: Schema & API (Aider)
- User Schema: Add an optional `partner_id` (Founder_ID) string field to the User record.
- Registration Controller: Update the /v1/auth/register endpoint to accept `partner_id` and save it during user creation.
- Revenue Hook: On successful payment, calculate the 50% split and log to the `Platform Fees` ledger.


### 3. Verification (Hermes)
- Step 1: Verify `pref` param is captured in the browser context.
- Step 2: Confirm the `register` POST payload includes the `partner_id`.
- Step 3: Approve merge to main only after 90% verification.
