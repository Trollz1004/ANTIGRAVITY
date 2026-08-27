# OmniRoute MCP server: transport mismatch, fixed 2026-08-26

## Symptom

Every Claude Code session start reported the `omniroute` MCP server as failed:

```
omniroute (400): Error POSTing to endpoint: { "error": "MCP transport is set to
\"stdio\", not \"streamable-http\". Change it from Settings." }
```

The gateway was **up** the whole time — `:20128` listening, `/v1/models`
returning 200. Only the MCP surface was unreachable, so the failure was easy to
misread as "OmniRoute is down" when nothing about routing was broken.

## Cause

Client and server disagreed about transport, and each was internally consistent:

- **Client** (`~/.claude.json`) — `{"type":"http","url":"http://127.0.0.1:20128/api/mcp/stream"}`
  with an Authorization header. Correct for streamable-http.
- **Server** — `key_value` row `namespace='settings'`, `key='mcpTransport'`,
  value `"stdio"`. A stdio server does not answer an HTTP handshake, so it
  rejected the POST with a 400 before authentication was ever considered.

## Fix

Set the server-side value to match the client:

```sql
-- database: ~/.omniroute/data/storage.sqlite   (the data/ one, not the stale sibling)
UPDATE key_value SET value = '"streamable-http"'
 WHERE namespace = 'settings' AND key = 'mcpTransport';
```

Backed up first to `db_backups/db_pre-mcptransport-2026-08-26.sqlite`.
The value is stored **JSON-encoded**, so the quotes inside the string are part of
the value — `streamable-http` without them will not match.

## Verification status — partial, deliberately stated as such

Before: `POST /api/mcp/stream` → **400**, transport-mismatch message.
After:  same request → **401 `AUTH_001` Authentication required**.

The transport rejection is gone and the request now reaches authentication, which
is the expected behaviour for an unauthenticated probe. **This is not full
confirmation.** A complete check needs an authenticated client to finish the
handshake, and MCP servers only initialize at session start, so it could not be
done from inside the session that made the change. Confirm at the next session:
`omniroute` should appear connected rather than in the failed list.

If it still fails, the likely cause is that the gateway caches settings at boot —
restart the OmniRoute service and re-check before assuming the value is wrong.
