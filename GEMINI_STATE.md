# Gemini State - Current

Status date: 2026-07-12

## Routing Status

**Direct Google provider: DISABLED** (GEMINI_API_KEY unavailable on Sabretooth)

**Gemini work routes through: `hermes-router` at `localhost:11435`**

Use in OpenCode:
- `hermes-router/gemini-2.5-pro`
- `hermes-router/gemini-2.5-flash`

Adapter manifest: `adapters/gemini/manifest.yaml`

## CEO Wheel Hosts

CEO wheel agents do not run direct Gemini health checks.
Gemini health = Hermes Router health (`localhost:11435/health`).

## Operating Rules

- Sell product value only
- Keep checkout moving
- Keep support and safety reliable
- Use current repo files as source of truth
- Do not import old launch, allocation, or community-control framing into public copy

## Source of Truth

- `AGENTS.md`
- `CLAUDE.md`
- `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- `adapters/gemini/manifest.yaml`
