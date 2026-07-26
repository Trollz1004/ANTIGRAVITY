# Business operations (clean)

## Goal

Sell real products. Collect payment through Square (and normal business channels). Use revenue to cover operating costs, including AI subscriptions and infrastructure.

This is a **regular business**. There is no split protocol file, no cause waterfall, and no percentage routing table in this repo.

## Cost reality (standing)

- ~$400/mo class spend is mostly **subscriptions** (Claude Max, Codex, Ollama Pro), not metered API keys.
- Protect paid quota you already bought. Prefer free/local for grunt work.
- Do not recommend new paid tools unless Josh asks.

## Where funds go (plain)

1. Customer pays for a product (membership, verification, service, digital good).
2. Processor (Square, etc.) settles to the business account.
3. Josh allocates operating cash (hosting, domains, AI tools, labor, inventory).

No agent invents a split. No agent markets a split.

## Payment rules

- YouAndINotAI checkout: **Square** production links in `payments.py`.
- Stripe is legacy unless Josh reopens a specific surface.
- Never commit keys. Env / vault only.

## Sales discipline

- Ship real posts and real checkout links, or don’t claim “marketing done.”
- No fabricated social proof or fake revenue numbers.
- Unverified = say unverified.
