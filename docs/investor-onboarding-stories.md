# Investor Onboarding User Stories

## Scope

These stories define investor-facing onboarding behavior for the YouAndINotAI investor surface in **TRO-299**.

- Signup
- Accreditation signal
- Deal preferences
- Match discovery
- Save / pass actions

## Epic 1 — Investor Signup

### INV-101: Email + password investor registration
As an investor, I want to create an account with email and password so I can enter the investor onboarding flow with a protected profile.

#### Acceptance criteria
1. The signup page accepts email, password, and confirm-password plus required consent checkboxes for terms/privacy.
2. The platform validates:
   - email format is valid,
   - password meets security policy,
   - password and confirmation match,
   - consent fields are checked where required.
3. On submit with valid input:
   - a new investor identity is created,
   - a verification email is sent,
   - a secure onboarding session is started.
4. Invalid input returns clear inline errors without losing entered values.
5. Duplicate or existing email returns a duplicate-account message with recovery path (sign in / reset password).

### INV-102: Email verification before progress
As a new investor, I want to verify my email before continuing so my account remains secure and trustworthy.

#### Acceptance criteria
1. After signup, the investor is placed in a “pending verification” state and cannot access onboarding tabs.
2. Clicking the email link verifies identity and unlocks onboarding.
3. Expired verification tokens show a recoverable resend path.

## Epic 2 — Accreditation Signal

### INV-201: Collect accreditation status during onboarding
As an investor, I want to provide my accreditation signal so matches can be filtered by suitable opportunities and compliance posture.

#### Acceptance criteria
1. The flow asks for one explicit accreditation signal choice:
   - Accredited
   - Not accredited
   - Prefer not to disclose yet
2. If “accredited” is selected:
   - the investor can continue into deal discovery,
   - selected signal is visible in profile summary.
3. If “not accredited” is selected:
   - the investor can continue,
4. If “prefer not to disclose yet” is selected:
   - onboarding continues with “pending accreditation” status.
5. The investor can edit the accreditation signal later from onboarding settings.

### INV-202: Add supporting accreditation details
As an investor, I want to add supporting details once selected so support and review teams have context for underwriting and matching.

#### Acceptance criteria
1. If “accredited” is selected, optional supporting fields are available (jurisdiction, source type, preferred documents).
2. The investor can skip optional fields and return later.
3. Saved details are stored and surfaced in the investor profile for admin review.

## Epic 3 — Deal Preferences

### INV-301: Capture core preferences
As an investor, I want to set deal preferences so I only see opportunities that match my strategy.

#### Acceptance criteria
1. Investors can set:
   - geography,
   - stage,
   - ticket size,
   - sectors,
   - minimum traction signal,
   - liquidity/safety constraints.
2. All preferences support sensible defaults and are optional by section.
3. The system persists preferences immediately and confirms save success.
4. Investors receive a completion indicator (“incomplete”, “saved”, “finalized”).

### INV-302: Validate and refine preferences
As an investor, I want inline validation while setting preferences so I can fix mistakes quickly.

#### Acceptance criteria
1. Non-numeric inputs in numeric fields show validation messages.
2. Range-based fields enforce min/max boundaries and support soft warnings for outliers.
3. Conflicting preferences (for example “no stage selected + finalized required”) block finalization with guidance.

## Epic 4 — Match Discovery

### INV-401: Show ranked deal feed
As an investor, I want a ranked feed of deals matching my preferences so I can evaluate opportunities efficiently.

#### Acceptance criteria
1. After preferences are saved, the system presents a match feed within a defined SLA (for example immediate or within 1 business minute if async enrichment is needed).
2. Each card includes:
   - deal title,
   - key metrics,
   - stage,
   - risk/compliance flags,
   - last updated date.
3. The feed respects all active preference filters and accreditation rules.
4. If no matches exist, a “no results” state displays recommendations to widen criteria.

### INV-402: Show rationale for ranking
As an investor, I want to understand why a deal is recommended so I can make decisions faster.

#### Acceptance criteria
1. Each match card has a short “why this match” summary based on two to five weighted criteria.
2. Expanding details shows score breakdown by preference dimension.
3. The investor can adjust criteria and see refreshed ranking for future sessions.

## Epic 5 — Save / Pass Actions

### INV-501: Save a deal for follow-up
As an investor, I want to save promising matches so I can revisit them later.

#### Acceptance criteria
1. Each match card has a save action with distinct visual state.
2. Saving records a timestamp and updates the investor dashboard under “Saved”.
3. Saved items maintain their match context and preference snapshot.
4. Saved view is filterable by type, stage, and saved date.

### INV-502: Pass on a deal
As an investor, I want to pass on deals that are not a fit so I can focus on relevant opportunities.

#### Acceptance criteria
1. Each match card has a pass action with optional reason tags.
2. Passing removes the card from the immediate feed and updates the recommendation model input.
3. The investor can undo pass within one session window.
4. Pass reasons are included in analytics exports and matching feedback loops.

## Cross-cutting requirements

1. All onboarding steps are resumable by secure session state.
2. Progress is saved automatically every 30 seconds while editing.
3. Investors can export an onboarding audit snapshot (profile, accreditation signal, preferences, and saved/passed actions).
4. Sensitive onboarding data follows platform security and least-privilege access policies.
