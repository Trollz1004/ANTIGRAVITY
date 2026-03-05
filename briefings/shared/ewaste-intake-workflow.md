# E-Waste Intake Workflow (Charity Impact Ops)

## Mission
Convert donated PCs, servers, and laptops into transparent resale outcomes that fund kids-focused charity impact.

## Operating Rule
Every unit must carry one persistent key: `intake_id` (format: `EW-YYYYMMDD-####`).

## Template Pack
- `data/ewaste-intake/intake-inventory-template.csv`
- `data/ewaste-intake/condition-grading-template.csv`
- `data/ewaste-intake/testing-status-template.csv`
- `data/ewaste-intake/resale-estimate-template.csv`
- `data/ewaste-intake/ebay-listing-readiness-template.csv`
- `data/ewaste-intake/charity-impact-ledger-template.csv`

## Stage Workflow
1. Intake and Asset Tagging
- Log donor details, device specs, and visible condition.
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
- Calculate expected net and projected charity contribution before listing.

5. eBay Listing Readiness QA
- Confirm complete condition disclosure and photo evidence.
- Confirm test summary and data-wipe statement are included.
- Confirm charity-impact line and percentage are set.
- Do not publish when `final_qa_pass` is not `yes`.

6. Post-Sale Charity Impact Logging
- Capture actual sale economics and final net proceeds.
- Record the donated amount, destination, and transaction reference.
- Keep ledger audit-ready for weekly impact reporting.

## Grade Rubric
| Grade | Score Range | Meaning | Default Disposition |
|---|---:|---|---|
| A | 90-100 | Clean and fully functional | List immediately |
| B | 75-89 | Fully functional with moderate wear | List with clear notes |
| C | 60-74 | Works with notable flaws | Discount or refurb first |
| D | 40-59 | Partial function / major defects | Parts or repair listing |
| F | 0-39 | Unsafe or non-functional | Recycle and harvest parts |

## Key Formulas
- `expected_net_proceeds_usd = expected_sale_price_usd - expected_shipping_cost_usd - expected_ebay_fees_usd - expected_refurb_cost_usd`
- `projected_charity_usd = expected_net_proceeds_usd * (charity_share_pct / 100)`

## Charity-Safe Listing Line (Template)
Use this in descriptions:
"This donated device sale supports #ForTheKids. A defined share of net proceeds is allocated to charity and logged in our impact ledger."

## Weekly Ops Snapshot (Recommended)
- Units received
- Units graded
- Units tested and wipe-verified
- Units listed
- Units sold
- Net proceeds
- Charity allocated
- Average days intake-to-listing

