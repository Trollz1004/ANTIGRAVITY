# HER-12 triage — onlinerecycle.net support queue

Checked: 2026-10-18 (this Support heartbeat, run 6d8c80de-873a-45f1-8f37-b9d5fcbaedca).
Disposition: no open customer ticket to draft. Nothing sent.

## What was checked

1. Date-app identity: GET http://127.0.0.1:8000/ returned HTTP 200, service "YouAndINotAI API", status running, version 0.1.0.
2. Operator queue without a session: GET http://127.0.0.1:8000/api/v1/support/operator/tickets returned HTTP 401, code INVALID_CREDENTIALS. That is the expected gate, not a ticket.
3. Database `uandinotai_dating` on localhost:5432, table `public.support_tickets`:
   - total rows: 0
   - open / pending / escalated: 0
   - status groups: none
   - newest update: none
4. Local draft inbox `ops/marketing-inbox/`: no onlinerecycle support draft waiting. Files there are YouTube and daily notes, not customer tickets.
5. Public site copy already answers the usual recycling questions. Source: `domains/onlinerecycle.net/site/index.html` FAQ (`#faq`).

## Queue result

No customer message exists to triage. No reply was drafted and none was sent.

## Public answers already live (do not duplicate)

From `domains/onlinerecycle.net/site/index.html`:

- Free drop-off and free pickup in Central Florida (Sorrento, Lake, Orange, Seminole).
- Accepted items: computers, laptops, phones, tablets, printers, consoles, cables, batteries, and most consumer electronics.
- Data: devices are assessed for storage media and handled through wipe or destruction before resale or recycling. Customers should factory-reset when they can.
- Booking: Square appointments, widget LY5GN09F5AN83. Address is given after booking.
- Phone on the page: (321) 396-2008.
- Contact email on terms, privacy, disclaimer, and about: collaboration@youandinotai.com.

## SLA

There is no ticket age, owner, or breach to score, because the table is empty. SLA log review stays on HER-14 (`todo`), not this issue.

## Acceptance

- Source named: date-app identity, operator route status, support_tickets counts, FAQ file.
- No invented customer, no send, no payment check.
- Next action: only if a new row appears in `support_tickets` or a customer writes the published contact. Until then this triage is closed.
