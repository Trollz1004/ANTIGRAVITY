# Marketing inbox — how marketing work reaches Joshua for approval

Producers (Paperclip on the 9020 node, marketing agents, scripts) never publish
directly. They drop one JSON file per batch into this folder at the repo root —
`C:\ANTIGRAVITY\ops\marketing-inbox\` — on any node. Mission Control ingests it,
the item appears as PENDING in the PAPERWEIGHT social command center
(`http://localhost:3151/paperweight/` → 🔔 Approvals), and Joshua approves or
denies with an optional response. Ingested files move to `processed/`
(unparseable ones get a `.rejected` suffix — fix and re-drop).

## Drop format

One object or an array of objects:

```json
{
  "source": "paperclip-9020",
  "platform": "instagram",
  "kind": "post",
  "title": "Heart Fingerprint launch reel — caption v2",
  "body": "Full copy of the post/reply/campaign exactly as it would publish."
}
```

- `kind`: `post` | `reply` | `campaign` | `listing` | `other`
- `title` ≤ 300 chars, `body` ≤ 20,000 chars — both required.
- Public-surface copy rules apply (business-only framing; no charity/donation
  vocabulary — see the Canonical Record at `/canonical/`).

Loopback alternative on Sabretooth: `POST http://127.0.0.1:3151/api/marketing/queue`
with the same JSON. Decisions land in
`mission-control-v5/server/data/marketing-queue.json`; producers read their
verdicts there or via `GET /api/marketing/queue`.
