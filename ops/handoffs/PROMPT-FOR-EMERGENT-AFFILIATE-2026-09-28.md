# Emergent lane — You and I, not AI affiliate program (approved brief)

**From:** the Claude judge lane (Fable), on Joshua's instruction of 2026-09-28.
**To:** the Emergent agent (Claude Sonnet) that now owns date-app marketing.
**Status:** APPROVED to execute inside the rails below. Anything outside them is a proposal, not an action.

Joshua's words, so nobody softens them later: affiliate marketing at up to 50 percent
of subscriptions, for the life of the referred subscription, is how the bills get
caught up. Treat this as the lane's first job.

## 1. The offer (founder-approved terms)

| Term | Value |
|---|---|
| Product | youandinotai.com, "You and I, not AI", an 18+ dating app |
| Plans (live in the app's billing router) | Founding Member $14.99 / month · 3 months $39.99 · 12 months $99.99 |
| Commission | **up to 50% of net subscription revenue** from every user the affiliate refers, for the **lifetime of that user's paid subscription** (renewals included) |
| "Net" | what Square settles after its fee and after any refund or chargeback; a refunded charge earns nothing and is clawed back from the next payout |
| Tiers inside "up to 50%" | 50% on the affiliate's first 20 paying referrals and on every referral after that as long as the affiliate stays active (one referral in the trailing 90 days); 30% on renewals for an inactive affiliate. Joshua can flatten this to 50% for everyone with one line; do not invent other tiers |
| Attribution | last-touch, by the affiliate's referral code, for the lifetime of the account it was entered on |
| Payout | monthly, by Joshua by hand, from the recorded Square settlement; minimum payout $25, balances roll over |
| Banned | self-referral, referring existing accounts, paid ads in the app's name, spam, any earnings claim ("make $X"), any claim about user counts or revenue that is not in the app's own records |
| Disclosure to affiliates | the app is listed for sale (`ops/sale/`); the program transfers to a buyer or ends with 30 days notice and every earned balance paid. Say this in the agreement, first page |

## 2. What exists and what does not (real or zero)

- Exists: the app, the checkout (Square, the only rail, untouched), three owner test accounts, zero paying users, zero affiliates, zero payouts. Every public number starts at zero.
- Does not exist: referral-code capture in the app, an affiliate dashboard, automated payouts. None of that is built in this brief. The program starts manual: a code per affiliate, the code entered by the new subscriber at sign-up in the existing free-text profile field or sent by email to the support address, and a monthly reconciliation against Square by the judge lane. When the first ten paying referrals exist, the judge lane specs the code capture as a JARVIS proposal; the checkout itself stays as frozen.

## 3. The rails (unchanged, from CLAUDE.md and specs/010)

1. Every public post, page, DM template or outreach email is a **JARVIS inbox proposal** (`POST /api/social/proposals`, brand `youandinotai`), drafted in the Fable voice (`POST /api/social/draft`), passing the four checks (compliance, copy score, 18-and-over footer, business-only). The Fable judge lane approves on Joshua's delegation of 2026-09-19; two approvals per brand per day. Nothing posts directly. Nothing ever uses browser automation of a personal account.
2. Adults only: every surface carries the 18+ footer. Never target, mention or picture anyone under 18. Never a "younger" angle.
3. FL §496.405 word rule: the words on the banned list in `.githooks/pre-commit-canonical` never appear on a customer surface, an affiliate page, or an agreement. This is a commercial program; describe it as one.
4. FTC: every affiliate must disclose the relationship on every post ("I earn a commission"); the agreement requires it and the program removes an affiliate who does not.
5. No secrets, no tokens, no private URLs in any file. Square keys never leave the vault.
6. Protected paths are not yours: `scripts/fables-house/**`, `scripts/drift.cmd`, `ops/runbook/**`, `ops/skills/sabretooth-node/**`, `.github/**`, `docs/PAYMENTS-TRUTH.md`.
7. Git: commit on a branch with an explicit pathspec; the judge lane pushes and merges. Never `main`.

## 4. Your deliverables, in order

1. **Affiliate agreement** (`ops/marketing/affiliate/AGREEMENT-DRAFT.md`): the table above in plain English, the sale disclosure on page one, the FTC clause, the ban list, the payout schedule. Proposal to the inbox; the judge lane reviews wording before any affiliate sees it.
2. **Affiliate page copy** for `youandinotai.com/affiliates` (copy only, as a proposal; the page ships as a static page through the normal landing path when approved, not as an app feature).
3. **Recruiting list** (`ops/marketing/affiliate/PROSPECTS.md`): 50 creators and communities in dating, relationships, and "human-verified" online-safety niches, with the official channel to reach each (creator email, platform partner form). No scraping, no DMs from personal accounts.
4. **Outreach template** as a proposal; send only through the approved path.
5. **Tracking sheet** (`ops/marketing/affiliate/LEDGER.md`): one row per affiliate (code, start date, referrals, paid, owed), zeros until real. This is the source the monthly payout is computed from; it is never edited to look better.
6. **Weekly report** in your journal (`.agents/journals/emergent/STATE.md`): affiliates signed, referrals, revenue, payouts, all from records. Real or zero.

## 5. What you do not do

- No feature work on the app, no checkout change, no new payment rail, no discount codes that change the price without Joshua's line.
- No paid ads. No claims of partnership with any AI company. No numbers that are not in a record.
- If a prospect asks about the sale: it is listed, it is public, the program survives a sale or ends with notice and full payment.

Sign your first journal entry with the date you read this brief.
