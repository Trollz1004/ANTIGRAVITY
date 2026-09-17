# Feature Specification: JARVIS Social Command Center and Approval Inbox (Phase C)

**Feature Branch**: `003-jarvis-social-approvals`

**Created**: 2026-09-17

**Status**: Draft

**Input**: `ops/handoffs/JARVIS-CONSOLIDATION-DISPATCH-2026-09-17.md`, Phase C

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compose and check a post before it exists anywhere public (Priority: P1)

Joshua opens the Social panel, picks a brand ("DREAM Online" or "AI Solutions"),
a platform, and writes a title/body/schedule. The panel runs the compliance
check and the copy-score check live and shows both before anything is saved.

**Why this priority**: nothing should be postable without these two checks
having already run once, honestly, in front of the person who will approve it.

**Independent Test**: submit a draft containing a banned word; the compliance
check fails with a rule index and no rendered word list.

**Acceptance Scenarios**:

1. **Given** a draft body with ordinary business copy, **When** it is submitted,
   **Then** a PROPOSED proposal is created with both checks attached.
2. **Given** a draft naming brand "date app" or "youandinotai", **When** it is
   submitted, **Then** the request is rejected with a message citing the
   freeze ruling and no proposal is created.

---

### User Story 2 - Approve, reject, or snooze from one inbox (Priority: P1)

Joshua opens the Inbox panel and sees every open item — social proposals,
judge-lane items, health-loop triggers, and a synthetic RED item when the
heartbeat is unhealthy — each showing its checks. He approves with his
founder token; anything else is a no-op.

**Why this priority**: this is the single gate between a drafted post and the
public internet, and between an open trigger and being ignored.

**Independent Test**: call approve without `x-founder-token` and confirm the
route refuses (401/503) and nothing executes.

**Acceptance Scenarios**:

1. **Given** `JARVIS_FOUNDER_TOKEN` unset, **When** approve is called,
   **Then** the route returns 503 with a message showing how to set the env
   var (never the value).
2. **Given** the correct token, **When** a manual-handoff social proposal is
   approved, **Then** the approved copy is written to
   `ops/marketing-inbox/approved/<date>-<platform>-<id>.md` and the proposal
   moves to EXECUTED with the file path as evidence.
3. **Given** `ops/heartbeat/sabretooth-health.json` reports overall RED,
   **When** the inbox is read, **Then** a synthetic RED item appears (never a
   fixture row when health is not RED).

---

### User Story 3 - Know something needs attention without hunting for it (Priority: P2)

A bell in the header shows an unread count; a top strip appears when health
is RED or a trigger exists; a browser notification fires when permission is
granted and the tab is open.

**Why this priority**: an inbox nobody looks at is not a gate.

**Independent Test**: seed one open inbox item and confirm the bell count is
non-zero and the alerts strip renders.

**Acceptance Scenarios**:

1. **Given** zero open items, **When** the inbox loads, **Then** the bell
   shows no count and the alerts strip is absent.

## Requirements *(mandatory)*

- **FR-001**: Every new response redacts secrets and non-Joshua emails
  (`lib/redact.mjs`) before leaving the server.
- **FR-002**: Proposals persist as append-only JSONL under
  `ops/dashboard-jarvis/data/proposals/YYYY-MM-DD.jsonl`, rebuilt into an
  in-memory index on server start, and survive a restart.
- **FR-003**: Compliance checks parse `.githooks/pre-commit-canonical` at
  runtime for the live banned-word/split list; the list itself never reaches
  the client, only a pass/fail and the matched rule index/text.
- **FR-004**: Copy-score checks reimplement SlopMonster's (ItsssssJack/SlopMonster,
  MIT) scoring rules as a local, pure JS function; no network call at score time.
- **FR-005**: `GET /api/social/platforms` reports adapter configuration by env
  var presence only; values are never sent to the client.
- **FR-006**: Only "DREAM Online" and "AI Solutions" are postable brands; a
  "date app"/"youandinotai" brand is rejected citing the 2026-09-16 freeze.
- **FR-007**: Manual-handoff adapters (X/Grok lane, Reddit, TikTok, YouTube/Hermes
  lane) write approved copy to `ops/marketing-inbox/approved/` instead of
  calling an API.
- **FR-008**: Approve/reject/snooze require `x-founder-token` equal to
  `JARVIS_FOUNDER_TOKEN`; unset env returns 503 with setup guidance, never the
  value.
- **FR-009**: Every inbox action appends to `data/audit/YYYY-MM-DD.jsonl`.
- **FR-010**: A sale-inbound item is shown as `SOURCE: PENDING`, never a
  fabricated row, because the Gmail connector is not reachable from the server.

## Success Criteria *(mandatory)*

- **SC-001**: `npx vitest run` passes with only the 4 known pre-existing
  failures.
- **SC-002**: A House one-pass reports JARVIS UP after the routes are wired.
- **SC-003**: A real POST creates a PROPOSED item visible in `GET /api/inbox`.
