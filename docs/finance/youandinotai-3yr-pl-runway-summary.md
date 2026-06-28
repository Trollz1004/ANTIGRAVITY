# YouAndINotAI 3-year P&L / runway summary

Deliverables:
- Spreadsheet model: `youandinotai-3yr-pl-runway-model.xlsx`
- Calculated monthly CSV export: `youandinotai-3yr-pl-runway-monthly.csv`
- Generated metrics JSON: `youandinotai-3yr-pl-runway-calculated-summary.json`

## Bottom line

| Scenario | 36-month ending cash | Cash-out month | Operating break-even | Self-sustainability |
|---|---:|---:|---:|---:|
| Conservative | $11,057 | M13 | M19 | M19 |
| Base | $304,041 | No cash-out | M09 | M09 |
| Optimistic | $2,993,519 | No cash-out | M03 | M03 |

## What drives the model

The model uses the repository's architecture and go-to-market documents instead of inventing a new operating plan. Costs mirror `docs/architecture.md` (Cloudflare frontend/CDN/tunnel, FastAPI API, Postgres, Square payments, monitoring), `hermes.md` (free-first model routing with paid tool buckets), and `docs/dao-architecture-plan.md` (DAO/legal/security milestones). Revenue follows `docs/strategy/growth-playbook.md` for community partnerships/events, `paperclip/agents/cmo-marketing.md` for automation/service proposals, plus product revenue allowed by `AGENTS.md` and `agent.md`: membership, verification, safety, support, access, uptime, matching quality, and pricing.

## Base-case readout

Base case starts with $25,000, reaches operating break-even in M09, and reaches self-sustainability in M09. It assumes month-1 operating revenue of $2,826, month-36 operating revenue of $68,513, one $15,000 funding inflow in M12, and a $5,000 DAO/security/legal milestone in M12. The base case does not cash out within 36 months and ends with $304,041.

## Biggest risks

1. Conversion risk: the paid conversion rate and active-user growth are the highest-leverage revenue assumptions.
2. Services execution risk: early automation/service revenue bridges runway before membership and events compound.
3. Cost discipline risk: contractor/dev support and marketing spend can outrun early revenue if not tied to proof points.
4. Pricing validation risk: external web pricing lookup was unavailable in this Hermes session, so Square/provider/hosting costs are explicit editable assumptions and should be validated before external investor or board use.

## Sensitive levers

The spreadsheet's `Sensitivity` sheet tests base-case runway impact for active-user growth, paid conversion, marketing spend, and contractor/dev cost. Inputs are highlighted yellow; formula-driven outputs are green. Changing any scenario input in the `Inputs` sheet propagates through monthly P&L, cash flow, cumulative runway, summary, and sensitivity formulas when opened in Excel/Google Sheets.
