---
name: buyer-outreach
description: Drafts personalized outbound messages and queues them for Josh to send
---

# Tool: buyer-outreach

## Inputs
- `buyer_id` — key into `paperclip-data/marketing/buyers.json`
- `tier` — bronze | silver | gold (anchors the price point referenced)
- `channel` — email | linkedin | reddit | twitter

## Steps

### 1. Load buyer profile
From `buyers.json`:
```json
{ "id": "ag-042", "name": "Acme Web Studio", "type": "agency", "size": "5-15",
  "stack": "wordpress,react", "contact": "hello@acmewebstudio.com",
  "last_contact_at": "2026-04-12", "notes": "Active in r/forhire as buyer" }
```

### 2. Pull 1-2 sample leads from the last 24h that match the buyer's stack
Read `paperclip-data/leads/` JSONL files. Filter by `stack` overlap and `qualified=true`.

### 3. Draft message — channel-specific length:
- **email** — 80-130 words, subject < 50 chars
- **linkedin** — 200-400 chars, no link in first message
- **reddit** — 600-1500 chars, mention specific post if relevant
- **twitter** — 280 chars, no link

### 4. Required ingredients in every draft:
- ONE specific lead reference (real, anonymized: title + budget + posted date)
- The price for that tier ($25 / $75 / $200)
- A clear "reply YES to receive this lead" CTA
- Honesty disclaimer: "We don't guarantee closes — these are pre-qualified leads with a budget floor, posted within 4 hours."

### 5. Append to outbound queue
`paperclip-data/marketing/outbound-queue.jsonl`:
```json
{"id":"<uuid>","buyer_id":"ag-042","channel":"email","tier":"silver","subject":"...","body":"...","drafted_at":"<iso>","status":"pending_send"}
```

### 6. Log the draft event
`paperclip-data/marketing/funnel.jsonl`:
```json
{"event":"drafted","buyer_id":"ag-042","queue_id":"<uuid>","at":"<iso>"}
```

## Constraints
- Never send. Josh sends manually until we have explicit board approval for automated send.
- Never include unverified claims ("trusted by 1000 agencies" etc).
- Never use AI-tell phrases ("I hope this email finds you well", "delve", "I wanted to reach out").
- One message per buyer per 14-day window. Honor `last_contact_at`.
