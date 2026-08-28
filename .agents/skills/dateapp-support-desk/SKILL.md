---
name: dateapp-support-desk
description: Use when handling YouAndINotAI customer support — answering a user, triaging or resolving a ticket, drafting a support macro, responding on the WhatsApp channel, or handling a safety/block report. Also use when support work must reach a customer surface, because everything customer-facing goes through the approval gate. Covers the live support and safety endpoints, the draft-only rule, the compliance wall, and conversation recall.
---

# Date app support desk

The five existing `dateapp-*` skills are swarm-lane **dispatchers**. None of them
runs the support desk. This one does.

## Non-negotiables — read before touching a reply

1. **Never publish or send directly to a customer.** Everything customer-facing
   is a DRAFT that goes through the approval gate below. Producers do not
   publish; Joshua approves.
2. **Business-only language.** Public copy stays on product value — membership,
   verification, safety, support, uptime, access. The vocabulary that is banned
   on customer surfaces is **not repeated here**: it lives in
   `.githooks/pre-commit-canonical` and nowhere else, because markdown gets swept
   and a shell script does not. Load `product-copy-business-only` before writing
   any customer-visible sentence, and let the guard be the authority.

   This is a Florida compliance wall, not a style preference — flag bots
   keyword-match the live site, and a sentence *denying* the framing still trips.
   Rephrasing around it does not help; the words simply never appear.

3. **Never promise a refund, a payout, or a verification outcome.** Payments are
   Square-only on this platform and are the `dateapp-payments-agent` lane. Do not
   claim government-ID verification — the product verifies humans, it does not
   fake or vouch for identity documents.
4. **Never expose another user's data** in a reply, including in a block or
   safety response.

## The live surfaces

Backend is FastAPI on `127.0.0.1:8000`, routes under `/api/v1`.

| Purpose | Endpoint |
|---|---|
| Support chat | `POST /api/v1/support/chat` |
| Create ticket | `POST /api/v1/support/tickets` |
| User's tickets | `GET /api/v1/support/tickets` |
| **Operator queue** | `GET /api/v1/support/operator/tickets` |
| WhatsApp channel | `GET`/`POST /api/v1/support/whatsapp/webhook` |
| Block list | `GET /api/v1/safety/blocks` |
| Block a user | `POST /api/v1/safety/users/{user_id}/block` |

Verify the backend is the right service before trusting it — a port answering is
not identity (operating rule 7):

```bash
curl -s http://127.0.0.1:8000/ | grep -o '"service":"[^"]*"'   # -> YouAndINotAI API
curl -s http://127.0.0.1:8000/api/v1/health
```

## The approval gate

Two equivalent routes. Both are draft-only.

**File drop** — one JSON object or array into `ops/marketing-inbox/`:

```json
{
  "source": "dateapp-support-desk",
  "platform": "support",
  "kind": "reply",
  "title": "Ticket 1234 — billing question, draft reply",
  "body": "The reply exactly as it would send."
}
```

`kind`: `post` | `reply` | `campaign` | `listing` | `other`. `title` ≤ 300 chars,
`body` ≤ 20,000 — both required. Unparseable files get a `.rejected` suffix; fix
and re-drop.

**Loopback API** — same JSON to `POST http://127.0.0.1:3151/api/marketing/queue`.

Verdicts land in `mission-control-v5/server/data/marketing-queue.json`, readable
via `GET http://127.0.0.1:3151/api/marketing/queue`.

> **Stale route warning.** Older docs send you to the PAPERWEIGHT approvals UI at
> `:3151/paperweight/`. That surface was **retired and deleted**. The API route
> above is live and is the one to use. Likewise ignore any instruction to produce
> from "the 9020 node" — there is one node, Sabretooth.

## Conversation recall

Before answering a repeat contact, search memory rather than re-asking the
customer what they already told you:

- `mcp__plugin_supermemory_supermemory__search_memory` — prior context.
- Save only **durable** support facts (a recurring defect, an agreed policy).
  Never save ticket contents, personal data, or anything a customer said in
  confidence. Memory is recall, never a system of record — see
  `agent-contracts/MEMORY-LAYER-RULING-2026-08-28.md`.

## Channel work

The WhatsApp webhook already exists. For channel design, routing, or escalation,
load the Twilio kit rather than improvising:

- `twilio-developer-kit:twilio-customer-support-architect` — desk design
- `twilio-developer-kit:twilio-conversation-memory` — cross-message continuity
- `twilio-developer-kit:twilio-taskrouter-routing` — queue and escalation
- `twilio-developer-kit:twilio-whatsapp-send-message` — the send path
- `resend:agent-email-inbox` — email side

## Working a ticket

1. **Read the queue** — `GET /api/v1/support/operator/tickets`.
2. **Recall** — search memory for this customer or this defect class.
3. **Classify** — billing (Square, payments lane) · safety/block · account ·
   product question · bug.
4. **Bug?** Do not answer around it. File it, and check whether Sentry already
   has the trace (`sentry:sentry-debug-issue`).
5. **Draft the reply** — business-only, no promises from §3 above.
6. **Gate it** — file drop or loopback API. Never send.
7. **Record the outcome** once approved, so the next contact has context.

## Reporting

Use **VERIFIED** / **UNVERIFIED** / **BLOCKED**. Cite the endpoint and status you
actually observed. An exit code or a 200 is not proof the intended system
answered — check the identity.
