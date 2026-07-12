# Founder Onboarding User Stories

## Scope

These stories define founder-facing onboarding behavior for the YouAndINotAI founder surface in **TRO-300**.

- Signup
- Company profile
- Pitch creation
- Investor outreach
- Deal updates

## Epic 1 — Founder Signup

### FND-101: Create founder account with identity-safe signup
As a founder, I want to register with my email so I can start onboarding from a protected founder account.

#### Acceptance criteria
1. The signup screen accepts:
   - first/last name,
   - email,
   - password and confirmation,
   - required terms/privacy checkboxes.
2. The system validates required fields, email format, and password policy.
3. On submit with valid input:
   - a founder identity is created,
   - a verification email is sent,
   - the user is placed in a founder onboarding flow state.
4. Duplicate email attempts return a recoverable message (sign in / reset password).
5. Signup errors keep the user’s valid form values and surface field-level messages.

### FND-102: Require verified email before onboarding progression
As a founder, I want to verify my email before continuing so my account can be trusted for outreach and compliance.

#### Acceptance criteria
1. After signup, founders stay in a “pending verification” state until email verification succeeds.
2. The user cannot complete onboarding sections until verification is confirmed.
3. Verification email includes an expirable secure link and a resend option.
4. Expired links expose a clear recovery path.

## Epic 2 — Company Profile

### FND-201: Collect founder and company identity
As a founder, I want to capture the minimum company context so the platform can create a complete startup profile.

#### Acceptance criteria
1. The profile step captures:
   - founder name,
   - founder title/role,
   - company name,
   - legal entity type,
   - primary domain and stage indicators.
2. Optional fields include team size, city/country, and startup description.
3. The platform validates required fields and basic format constraints.
4. Profile progress is saved automatically and can be resumed from the same session.

### FND-202: Add supporting startup materials
As a founder, I want to upload verified company materials so investors and matching systems have baseline context.

#### Acceptance criteria
1. Founders can add:
   - logo/avatar,
   - pitch deck link,
   - short founding story (rich text),
   - website link.
2. Uploaded files/images enforce accepted formats and size limits.
3. Missing or malformed links show contextual validation.
4. Materials can be edited after initial save.

### FND-203: Make profile reusable and visible to founder
As a founder, I want to review my saved profile before moving on so I can correct details.

#### Acceptance criteria
1. A profile summary view displays all captured fields and materials.
2. The founder can go back and edit any profile field before finalizing.
3. Completion status is shown as draft, saved, or finalized.

## Epic 3 — Pitch Creation

### FND-301: Create a standardized pitch draft
As a founder, I want to create a structured pitch with business essentials so investor outreach starts from a strong baseline.

#### Acceptance criteria
1. The founder can create a pitch draft with sections for:
   - problem,
   - solution,
   - market,
   - traction,
   - business model,
   - use of funds,
   - timeline.
2. Required sections block finalization until completed.
3. Draft content autosaves and supports version history (latest + previous snapshots).
4. Founders can mark the pitch as publish-ready for outreach.

### FND-302: Import and refine pitch text
As a founder, I want to draft pitch content in small iterative steps so I can refine language before investors see it.

#### Acceptance criteria
1. The pitch editor supports section-by-section editing and autosave.
2. Empty required fields show inline validation.
3. Founders can preview investor-facing formatting.
4. At least one pitch version must be saved before investor outreach is enabled.

## Epic 4 — Investor Outreach

### FND-401: Create target investor list from signals
As a founder, I want to target outreach to likely investors so my pitch reaches the right audience.

#### Acceptance criteria
1. The founder can filter investors by:
   - sector,
   - stage,
   - geography,
   - accreditation preference where applicable.
2. The system returns a candidate list with counts and selection state.
3. Filters are sticky and editable after list generation.
4. Targeting saves as a reusable outreach segment.

### FND-402: Send introductory outreach
As a founder, I want to send my pitch to selected investors so I can start deal conversations.

#### Acceptance criteria
1. Founders can send outreach to one or many selected investors.
2. The send flow requires a publish-ready pitch and a confirmed profile.
3. The founder sees send status, timestamps, and per-investor delivery errors.
4. Duplicate sends are prevented within a configurable dedupe window unless explicitly overridden.

### FND-403: Track outbound outreach outcomes
As a founder, I want visibility into outreach replies and statuses so I can follow up effectively.

#### Acceptance criteria
1. The outreach dashboard shows sent, opened, clicked, replied, and failed states.
2. Founders can add private notes per outreach event.
3. Failed sends surface recovery actions (edit pitch, fix contact, resend).

## Epic 5 — Deal Updates

### FND-501: Submit key deal milestones
As a founder, I want to post concise deal updates so investors stay informed of progress.

#### Acceptance criteria
1. Founders can post updates with:
   - title,
   - update body,
   - stage impact,
   - optional attachments.
2. Updates include UTC timestamp and sort by recency.
3. Founders cannot post empty updates.
4. Draft updates can be saved and published later.

### FND-502: Share capped public snapshot for investors
As a founder, I want to publish investor-ready updates with consistent formatting so investor trust stays high.

#### Acceptance criteria
1. Public-facing snapshot excludes sensitive internal fields by policy.
2. Updated summary cards auto-recalculate “Last updated” and “Next planned update” cadence.
3. Founders can edit published updates with an audit trail.
4. Investors can opt into update notifications from the founder profile.

### FND-503: Archive completed fundraising cycle
As a founder, I want to close the onboarding/active outreach flow once a cycle completes so my dashboard reflects current status.

#### Acceptance criteria
1. Founders can mark a cycle as closed (funded, paused, or archived).
2. Closed cycles hide active outreach actions and surface a completion summary.
3. Closed cycles preserve historical pitch + outreach + updates in read-only mode.
4. Owners can start a new cycle without deleting past records.

## Cross-cutting requirements

1. Onboarding is resumable by secure session state across sessions and devices.
2. All edits are persisted with optimistic autosave every 30 seconds.
3. Founders can export an onboarding pack (profile, pitch, outreach, updates) from a secure workspace.
4. Sensitive founder data is protected by existing authentication and least-privilege access patterns.
5. Every step provides a clear completion indicator and actionable next step.
