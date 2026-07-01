# Hermes Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy rules.
- `paperclip/agents/ceo/AGENTS.md` — CEO doctrine (Hermes is the CEO runtime).
- `paperclip/agents/cmo/AGENTS.md` — lead handoff.
- `briefings/PAPERCLIP-HQ-RUNTIME.md` — Paperclip server / Hermes wiring.

---

## Skill Library References

Located at `C:\antigravity\.agents\skills`. Hermes routes to these skills/agents for research, routing, and deployment support.

| Skill | Used For |
|---|---|
| `agency-discovery-coach` | Lead discovery and qualification frameworks |
| `agency-reality-checker` | Validating claims and assumptions |
| `agency-evidence-collector` | Compiling proof points for pitches |
| `agency-trend-researcher` | Market/trend scanning |
| `agency-sales-data-extraction-agent` | Pulling platform data for lead scoring |
| `neon-postgres` / `supabase-*` | Database/Edge Function runtime questions |
| `system-connector` | Researching and wiring third-party APIs |
| `mission-control` | Cross-session mission context and recall |

**Rule:** Reference the skill path when delegating; do not paste skill content into prompts.

---

## Approved Research Sources

1. Upwork or comparable freelance listings (public only).
2. Fiverr-style buyer requests (public only).
3. Reddit hiring communities (public and allowed).
4. Craigslist gigs.
5. Small-business websites with visible technical gaps.
6. Local businesses with obvious support/security/automation needs.

---

## Qualification Checklist

For each lead:

- [ ] Budget is known and ≥ $50
- [ ] Buyer identity is clear
- [ ] Work is legal, honest, and ToS-compliant
- [ ] No live credentials required before agreement
- [ ] Scope fits within budget/time rules
- [ ] Customer-facing claims stay business-only

---

## Routing Rules

- **Ready to pitch →** CMO Agent (`paperclip/agents/cmo/`)
- **Requires technical scoping →** CTO Agent (`paperclip/agents/cto/`)
- **Involves payment/checkout surface →** CFO Agent (`paperclip/agents/cfo/`)
- **Structural/repo drift detected →** Mission Guardian (`paperclip/agents/mission-guardian/`)
- **Human authority or legal exposure →** Joshua Coleman
- **Paperclip HQ server issue →** Check `scripts/paperclip/paperclip-watchdog.ps1`; escalate to Joshua if watchdog fails.

---

## Output Template

```text
HERMES STATUS: <ceo-pulse|researching|ready|routed|blocked>
PAPERCLIP HQ: <ok|down>
LEADS FOUND: <N>
QUALIFIED: <N>
TOP LEAD: <LEAD #N - title>
ROUTED TO: <agent or Joshua>
BLOCKERS: <none or exact>
NEXT ACTION: <concrete step>
```
