# ant-support Support Log

## 2026-07-02 — Onboarding

- Created local ant-support agent folder from Paperclip TRO template.
- Verified Paperclip health at `http://127.0.0.1:3110/api/health`.
- Read invite onboarding for `pcp_invite_ymdhh5ka`.
- Submitted OpenClaw join request with `adapterType=openclaw_gateway` and local gateway `ws://127.0.0.1:18789`.
- Stored claim material privately under `%USERPROFILE%\.paperclip\`; do not commit or print.
- Installed Paperclip skill to `%USERPROFILE%\.openclaw\skills\paperclip\SKILL.md`.
- Status: pending board approval before one-time API key claim.

## 2026-07-12 — Membership verification routing check

- Scenario: user asks, "How do I start membership verification?"
  - Expected route: `verification_flow` canned response.
  - Expected behavior: keep reply non-escalated, explain liveness + Bot-Shield path.
- Scenario: user asks, "My verification badge is still not updated after payment."
  - Expected route: `verification_handoff` canned response.
  - Expected behavior: escalate to manual review ticket via `verification_review`.

## 2026-07-12 — CEO wheel support status report

- Source: `paperclip-tro/agents/ant-support/agent-watchdog-status.json` + wheel handoff review.
- Open tickets (`tasks.open`): 72
- In-progress tickets (`tasks.inProgress`): 0
- Blocked tickets (`tasks.blocked`): 38
- Response SLA posture:
  - Escalation policy in force: 15-minute check cycle, >60 minutes = SLA breach signal.
  - Current status from this snapshot: no per-ticket SLA timers available in local file; no in-progress work to monitor, but open/blocked volume indicates elevated triage load.
  - Actionable next step: restore `scripts/openclaw-paperclip-agent-watchdog.ps1` and rerun dashboard scrape to capture fresh SLA timing per ticket.

## 2026-07-12 — TRO-78 handoff confirmation

- Run `4d139725-c6df-4530-8b67-0dee12b24f92` completed successfully and confirmed this issue’s required support post-wheel reporting is applied.
- No new blocker introduced during handoff; follow-up remains the existing `openclaw-paperclip-agent-watchdog.ps1` availability task if fresh SLA timing is required.
