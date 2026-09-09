# Marketing inbox — how marketing work reaches Joshua for approval

Producers (marketing agents, the support desk, scripts) never publish
directly. **Stale reference corrected 2026-08-28:** this line used to say
"Paperclip on the 9020 node." There is one node, Sabretooth — see
`docs/ops/NODE-AND-PORT-MAP.md`. They drop one JSON file per batch into this folder at the repo root —
`C:\ANTIGRAVITY\ops\marketing-inbox\` — on any node. Mission Control ingests it,
the item appears as PENDING and Joshua approves or denies it with an optional
response.

**Stale route corrected 2026-08-28:** this used to send you to the PAPERWEIGHT
approvals UI at `http://localhost:3151/paperweight/`. That surface was retired by
doctrine and has since been deleted from the tree. The live surface is the API
below — `GET http://127.0.0.1:3151/api/marketing/queue` (verified 200). Ingested files move to `processed/`
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
- Public-surface copy rules apply. The banned vocabulary is deliberately NOT
  restated here -- it lives in `.githooks/pre-commit-canonical` and nowhere
  else, because markdown gets swept and a shell script does not. See the
  Canonical Record at `/canonical/`.

Loopback alternative on Sabretooth: `POST http://127.0.0.1:3151/api/marketing/queue`
with the same JSON. Decisions land in
`mission-control-v5/server/data/marketing-queue.json`; producers read their
verdicts there or via `GET /api/marketing/queue`.


## Submitting from an agent

`services/dateapp-desk-mcp/` exposes this queue as MCP tools. Its `submit_draft`
writes the same JSON shape here, enforces the size limits, and screens the copy
against the banned customer-surface vocabulary before the file is written.

That server deliberately has **no publish tool and no send tool**. An agent using
it cannot reach a customer directly — the capability is absent, not merely
discouraged. See `.agents/skills/dateapp-support-desk/SKILL.md`.
