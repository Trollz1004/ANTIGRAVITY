# CMO Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy doctrine.
- `docs/strategy/growth-playbook.md` — growth playbook.
- `docs/strategy/funa-72-social-growth-targets.md` — 72-hour social growth targets.
- `docs/strategy/Messaging_Guidelines.md` — approved messaging.
- `paperclip/agents/ceo/AGENTS.md` — structural escalation path.
- `paperclip/agents/cfo/AGENTS.md` — payment/receipt copy review.

---

## Copy Templates

### Proposal (≤150 words)
```text
Hi <first name or team>,

<One sentence restating their problem, sharper than they wrote it>.

I built a working demo for this: <one-line specific description>. Live here: <demo URL>.

My background is licensed electrician + AI builder — means I ship things that actually work in the real world, not just in slides.

Price: $<offer>. Turnaround: <hours/days>. I can start <today/tomorrow>.

Reply yes and I'll send the deliverable + invoice within <X> hours.

— Joshua Coleman
```

### Cold Email (≤80 words)
```text
Subject: <6 words max, specific, no 'quick question'>

<First name>,

<One-sentence observation about their business that proves you looked>.

I built <thing> that solves <specific problem>. 90-second demo: <URL>.

$<price>. Done in <hours>. Free if it doesn't work.

Worth 5 minutes Tuesday at 2pm?

Joshua
```

### Follow-Up (≤40 words)
```text
<First name> — still want me to ship the <thing>?

<One sentence with NEW value: a tweak, a stat, a related win>.

Yes/no this week and I'll close the slot.

Joshua
```

---

## Doctrine Filter

Before publishing any copy, scan for banned terms:

```text
charity, donation, donate, split, disbursement, 60/30/10, token return, kids' care, #UNTILnoKIDinNEED, public benefit, social good, cause, giving back, every purchase helps, portion goes to
```

If any appear, rewrite using product-first language.

---

## Lead Qualification Rules

Reject if:
- Budget < $50
- Buyer is unclear
- Work is illegal, deceptive, spammy, or ToS-violating
- Requires live credentials before a scoped agreement
- Requires >4 hours unless budget ≥ $300
- Requires customer-facing restricted public-benefit claims

---

## Growth Automation

Use `scripts/youandinotai/growth_automation.py` for approved, non-ToS-violating workflows only. If a workflow requires automated posting/scraping/DMs, escalate to Joshua for platform API approval.

---

## Output Template

```text
CMO OUTPUT: <type>
DOCTRINE CHECK: <pass|fail>
WORD COUNT: <N>
FILES: <paths>
CTA: <specific next step>
```
