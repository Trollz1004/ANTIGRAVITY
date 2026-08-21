---
name: security-findings
description: 2026-08-21 security audit summary for node 9020 - no secret values recorded here
type: reference
created: 2026-08-21
---

# security-findings

Security audit of [[node-9020]], 2026-08-21. No secret values are recorded in this note - secrets are referenced by name and location only.

## Findings

1. OpenClaw config plus 5 backup copies contain plaintext Telegram and gateway tokens. Action: rotate the tokens, then scrub the config and backups.
2. node-agent binds 0.0.0.0:3140 with an empty default API key - reachable from the network with no auth. Action: set an API key or bind to loopback.
3. Hermes auth.json sits unprotected in the disabled-hermes folder even though Hermes is quarantined/disabled. Action: remove or lock down the file.

## Related

- [[node-9020]]
- [[Home]]
