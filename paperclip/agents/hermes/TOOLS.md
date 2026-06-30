# Hermes Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy rules.
- `paperclip/agents/ceo/AGENTS.md` — escalation path.
- `paperclip/agents/cmo/AGENTS.md` — lead handoff.

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
- **Structural/repo drift detected →** Mission Guardian + CEO (`paperclip/agents/mission-guardian/` + `paperclip/agents/ceo/`)
- **Real money or legal authority needed →** Joshua Coleman

---

## Output Template

```text
HERMES STATUS: <researching|ready|routed|blocked>
LEADS FOUND: <N>
QUALIFIED: <N>
TOP LEAD: <LEAD #N - title>
ROUTED TO: <agent or Joshua>
BLOCKERS: <none or exact>
NEXT ACTION: <concrete step>
```
