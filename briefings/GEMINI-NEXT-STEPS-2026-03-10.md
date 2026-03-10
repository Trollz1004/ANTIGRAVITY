# Gemini Direct Prompt — Next Steps After Payment Truth Block Cleared

Use this as the direct next prompt for Gemini.

---

We cleared the payment-truth block.

Current hard truth:

- live repo is `C:\ANTIGRAVITY`
- live git truth is `origin/main`
- Square is the confirmed live payment rail in code
- the March 5, 2026 $1 Square Bot-Shield receipt proves the charge path worked
- Google Pay is still unproven until the Google Pay receipt is found
- dormant Paymentwall code exists in `ClawX`, but it is recovery material only, not live truth
- the real live engineering risk is identity binding, not whether Square can process the $1 charge

Canonical payment file to read first:

- `C:\ANTIGRAVITY\briefings\LIVE-PAYMENT-SOURCE-OF-TRUTH.md`

Live code files to anchor on:

- `C:\ANTIGRAVITY\youandinotai-api\app\routers\verify.py`
- `C:\ANTIGRAVITY\youandinotai-api\app\routers\webhooks.py`
- `C:\ANTIGRAVITY\youandinotai-api\app\config.py`
- `C:\ANTIGRAVITY\youandinotai-api\app\routers\health.py`
- `C:\ANTIGRAVITY\youandinotai\src\App.tsx`
- `C:\ANTIGRAVITY\youandinotai\src\components\MerchStore.tsx`
- `C:\ANTIGRAVITY\square_catalog.json`

Your next job is not to reopen payment-processor debates.

Your next job is:

1. Read the canonical payment file and the live code files above.
2. Stay anchored to Square as the live rail unless new evidence overrides it.
3. Focus on the identity-binding path:
   - how `user_id` and `event_id` are appended in the checkout URL
   - how the Square webhook actually resolves the user
   - what exact proof we still need to say the verification loop is fully clean
4. If a Google Pay receipt is provided, classify it precisely:
   - Google Pay wallet on top of an existing rail
   - Stripe underneath
   - or a separate processor path
5. Do not use old PR email archaeology or `ClawX` exports as live truth.
6. Keep DAO/governance settled and out of scope unless explicitly reopened.
7. Keep marketing automation discussion inside the legal-safe draft-first boundary:
   - no node auto-posting to third-party socials
   - use `CodeX\state\marketing` and the approved safe-node files

Preferred output back:

- one short reality summary
- one short list of the exact remaining payment proof gaps
- one short list of the next highest-leverage actions
