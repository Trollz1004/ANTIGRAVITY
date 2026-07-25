# E-Waste Intake Workflow ( Impact Ops)

## Mission

Convert contributed PCs, servers, and laptops into transparent resale outcomes that fund kids-focused  impact through contractual revenue payout.

## Operating Rule

Every unit must carry one persistent key: `intake_id` (format: `EW-YYYYMMDD-####`).

## Template Pack

- `data/ewaste-intake/intake-inventory-template.csv`
- `data/ewaste-intake/condition-grading-template.csv`
- `data/ewaste-intake/testing-status-template.csv`
- `data/ewaste-intake/resale-estimate-template.csv`
- `data/ewaste-intake/ebay-listing-readiness-template.csv`
- `data/ewaste-intake/-impact-ledger-template.csv`
- `data/ewaste-intake/-impact-weekly-summary-template.csv`

## Stage Workflow

1. Intake and Asset Tagging

- Log contributor details, device specs, and visible condition.
- Assign `intake_id` and physical asset tag.
- Mark whether data wipe is required before any resale handling.

2. Condition Grading

- Score cosmetics, display, inputs, ports, thermal/noise, and battery.
- Assign grade and route (`list_now`, `refurb_then_list`, `parts_only`, `recycle`).
- Capture repair estimate to avoid unrealistic pricing.

3. Testing and Data Sanitization

- Run baseline functional checks (POST/boot, stress, memory, storage, ports, network).
- Record failures and blockers.
- Require documented wipe method and second-person verification before listing.

4. Resale Value Estimation

- Use recent sold comparables on eBay (not active asking prices alone).
- Estimate sale price, shipping, fees, and refurb cost.
- Calculate expected net and projected  contribution before listing.

5. eBay Listing Readiness QA

- Confirm complete condition disclosure and photo evidence.
- Confirm test summary and data-wipe statement are included.
- Confirm -impact line and percentage are set.
- Do not publish when `final_qa_pass` is not `yes`.

6. Post-Sale  Impact Logging

- Capture sale, payout, and contribution references for every sold eBay order.
- Calculate net proceeds and  allocation per item.
- Reconcile contribution proof and reviewer signoff before weekly close.
- Roll up totals in the weekly summary template for reporting.

## Grade Rubric

| Grade | Score Range | Meaning                             | Default Disposition       |
| ----- | ----------: | ----------------------------------- | ------------------------- |
| A     |      90-100 | Clean and fully functional          | List immediately          |
| B     |       75-89 | Fully functional with moderate wear | List with clear notes     |
| C     |       60-74 | Works with notable flaws            | Discount or refurb first  |
| D     |       40-59 | Partial function / major defects    | Parts or repair listing   |
| F     |        0-39 | Unsafe or non-functional            | Recycle and harvest parts |

## Key Formulas

- `expected_net_proceeds_usd = expected_sale_price_usd - expected_shipping_cost_usd - expected_ebay_fees_usd - expected_refurb_cost_usd`
- `projected__usd = expected_net_proceeds_usd * (_share_pct / 100)`

## -Safe Listing Line (Template)

Use this in descriptions:
"This device sale supports #ForTheKids through contractual revenue payout. A defined share of net proceeds is allocated to youth programs and logged in our impact ledger."

## Weekly Ops Snapshot (Recommended)

- Units received
- Units graded
- Units tested and wipe-verified
- Units listed
- Units sold
- Net proceeds
-  allocation
- Average days intake-to-listing
