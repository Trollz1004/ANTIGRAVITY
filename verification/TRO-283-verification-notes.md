# TRO-283 Verification Notes — Membership Signup Flow (Square -> Backend -> Receipt)
Date: 2026-07-12
Run mode: local validation in heartbeat session

## Latest comment acknowledged
- Continuation summary contains `latest comment id: unknown` and `pending comments: 0/0`.
- Previous run failure was harness model error (`codex-mini-5.3` unsupported with ChatGPT account), not a code-level failure. This heartbeat resumed the issue directly.

## Objective checked
Verify the membership checkout flow end-to-end and record evidence for:
1) CTA -> checkout endpoint
2) Checkout payload binding to user/session
3) Square webhook -> subscription/payment record
4) Receipt email mapping behavior

## Evidence captured
### Frontend CTA and route mapping
- Pricing cards map membership tier selection to `/app/checkout/:tier` in `frontend/react-app/src/App.tsx`.
- Frontend routing maps `/app/checkout/:tier` to `CheckoutLaunch` in `frontend/react-app/src/main.tsx`.
- `CheckoutLaunch` posts `{tier}` to `/api/v1/billing/checkout-link`, then redirects to returned `checkout_url`.
  - `backend/fastapi-app/app/routers/billing.py`

### Backend checkout binding
- `/api/v1/billing/checkout-link` requires auth and creates a `VerificationEvent` with `challenge_type="payment"` and `status="pending"`.
- It stores a signed reference token with `build_checkout_reference(user_id, event_id, tier, jwt_secret)` in `challenge_token`.
- It builds Square payment payload with:
  - `payment_note` containing tier + signed marker (`agref:<token>`)
  - `buyer_email` pre-populated from user
  - `redirect_url` for app profile

### Receipt / user mapping in webhook
- `app/routers/webhooks.py` reads `payment.receipt_url` and `buyer_email_address` in `_extract_square_customer_email`.
- `extract_checkout_reference` reads signed marker from payment `note`/`reference_id`/order reference.
- If checkout ref resolves, webhook binds payment to the checkout event user.
- If checkout ref absent/invalid, it falls back to `square_customer_id` then `buyer_email` match.
- Founding/family subscriptions are set by tier inferred from amount and/or hints (`YouAndINotAI Founding Member`, etc.) via `payment_truth.py`.

### End-to-end test execution
Executed targeted tests with local pytest (no coverage gate):
1) `python -m pytest tests/test_billing.py -k "checkout_link_returns_bound_square_url or e2e_founder_checkout_flow_receipt_email_maps_webhook_payment_to_user or completed_prepaid_payment_sets_expiry" --no-cov`
   - Result: `3 passed, 3 deselected`
2) `python -m pytest tests/test_webhooks.py -k "completed_founding_member_payment_activates_subscription or completed_bot_shield_payment_with_valid_binding_promotes_user" --no-cov`
   - Result: `2 passed, 26 deselected`

The `e2e_founder_checkout_flow_receipt_email_maps_webhook_payment_to_user` test explicitly asserts receipt-email mapping logic in webhook fallback/parse path.

## Status
- This issue is verifiably passed at code + test level for membership flow binding and receipt-email mapping.
- No source code changes were required for this heartbeat.

## Remaining risks
- Full-system live Square credentials/webhook end-to-end in production is still environment-dependent; these checks validate routing and binding logic with representative fixtures.

## Paperclip Resume Delta Handoff
- Date: 2026-07-12
- Final disposition from resumed heartbeat: done
- No code changes applied in this run.
- Next step: move issue to `done` state in tracker with this evidence bundle attached.
