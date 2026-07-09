# Revenue And Marketing Approval Contract

All revenue and marketing work for Date App, AI-Solutions, and Business Exchange uses draft-first workflow. No public action happens before Joshua or an approved CEO lane reviews the exact artifact.

## State machine

`intake_new -> research_ready -> draft_ready -> founder_review -> approved -> actioned -> won | lost | nurture`

Every record carries `no_send=true` until approval records the artifact, recipient/use, price/scope if any, and allowed execution path.

## Allowed public themes

- membership
- verification
- trust and safety
- support
- account recovery
- real profiles
- events and matching
- uptime and reliability
- pricing and checkout
- terms, privacy, refunds, receipts
- product value and operational reliability

## Blocked public themes

- charity, donation, proceeds, or named-beneficiary claims
- split math, tax, reserve, accounting, wallet, or routing claims
- ownership, voting, control, token, DAO launch, or investment-return claims
- claims that checkout automatically routes money to non-product purposes

## Worker behavior

- T5500 support gateway creates support-only Agent Hub tasks.
- 9020 marketing worker creates draft-only Agent Hub tasks.
- Both workers stop when Agent Hub is unavailable.
- Neither worker sends messages, posts, spends, publishes, scrapes, or stores a durable local backlog.
