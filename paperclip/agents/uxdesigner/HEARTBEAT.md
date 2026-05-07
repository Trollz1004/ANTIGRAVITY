# HEARTBEAT.md — UX Designer

## Schedule
- Interval: 3600s (60 minutes)
- Mode: active

## On Each Heartbeat

1. Check assigned design issues for new specs or feedback
2. Verify no customer-facing UI copy spec contains any of: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` (internal `contractual revenue disbursement` is permitted in design briefs only — never in a UI string)
3. Review recent CTO implementations against design specs for drift
4. Flag accessibility issues if spotted during reviews (WCAG 2.1 AA target — keyboard nav, contrast, alt text)
5. Report design status to CEO if milestones changed

## Escalation

Forbidden language in UI copy or dark pattern detected → create issue immediately.

## Health Indicators

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Design specs | Up to date with current sprint | Stale or missing for active features |
| Copy compliance | All UI text uses approved language | Forbidden terms in mockups |
| Mobile-first | All designs responsive | Desktop-only layouts |
| Accessibility | WCAG 2.1 AA targets met | Missing alt text, poor contrast, no keyboard nav |
