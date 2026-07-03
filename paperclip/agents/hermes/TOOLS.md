# Hermes Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy rules.
- `paperclip/agents/ceo/AGENTS.md` — CEO doctrine (Hermes is the CEO runtime).
- `paperclip-tro/ROSTER.md` — active Paperclip seat list (Hermes only).
- `.agents/skills/*/SKILL.md` — department skills Hermes loads on demand.
- `briefings/PAPERCLIP-HQ-RUNTIME.md` — Paperclip server / Hermes wiring.

---

## Skill Library References

Located at `C:\antigravity\.agents\skills`. Hermes loads these as department skills for research, routing, and deployment support. They are not permanent Paperclip agents by default.

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

- **Ready to pitch →** load relevant sales/content/growth skill; spawn temporary reviewer only if needed.
- **Requires technical scoping →** load engineering/code-review skill; spawn Codex/OpenCode only for concrete implementation/review.
- **Involves payment/checkout surface →** load finance/payment evidence skill; escalate money authority to Joshua.
- **Structural/repo drift detected →** Hermes handles directly using repo doctrine; spawn evidence/reality-checker only if useful.
- **Human authority or legal exposure →** Joshua Coleman
- **Hermes/Paperclip feed issue →** probe `http://127.0.0.1:9119/api/status`; repair/restart Hermes if safe, then verify body shape.

---

## Output Template

```text
HERMES STATUS: <ceo-pulse|researching|ready|routed|blocked>
HERMES/PAPERCLIP FEED: <ok|down|wrong-shape>
LEADS FOUND: <N>
QUALIFIED: <N>
TOP LEAD: <LEAD #N - title>
ROUTED TO: <Hermes skill/subagent/helper or Joshua>
BLOCKERS: <none or exact>
NEXT ACTION: <concrete step>
```
