# CFO Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` — payment rail truth.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy rules.
- `paperclip/agents/ceo/AGENTS.md` — escalation path for structural issues.

---

## Live Verification Commands

Use these to check payment/checkout surfaces without exposing secrets:

```bash
# Verify checkout page loads and contains no banned language
curl -s https://youandinotai.com/checkout | grep -iE 'charity|donation|disbursement|60/30/10|token return|kids.*care' || echo "No banned terms found"

# Verify payment provider references
curl -s https://youandinotai.com/checkout | grep -i square
```

If banned terms are found, `CFO STATUS: flag` and route to CEO/CMO.

---

## Financial Review Checklist

Before approving any revenue-related change:

1. [ ] Live payment rail is Square (per source-of-truth file).
2. [ ] Receipts/invoices use business-only language.
3. [ ] Kids allocation floor (10%) is preserved in code/config.
4. [ ] No private payout math is exposed in UI, logs, or API.
5. [ ] No second wallet/LLC/repo is introduced.
6. [ ] Change is tracked in the ledger or allocation file.

---

## Coordination Rules

- **CTO:** request checkout/receipt UI changes through the CTO Agent.
- **CMO:** request receipt copy review through the CMO Agent.
- **CEO:** escalate structural or doctrinal conflicts.
- **Joshua Coleman:** anything involving real money.

---

## Output Templates

### Payment-Rail Status
```text
CFO STATUS: healthy
PAYMENT RAIL: Square production
LIVE CHECK: pass
FILES: briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md
NEXT ACTION: standby
```

### Doctrine Drift Flag
```text
CFO STATUS: flag
PAYMENT RAIL: Square production
DOCTRINE CHECK: fail
LOCATION: <URL or file path>
EVIDENCE: <excerpt>
NEXT ACTION: Route to CMO for rewrite; escalate to CEO if unresolved.
```
