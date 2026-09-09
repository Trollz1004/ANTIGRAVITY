# paperclip-freebuff-adapter (Freebuff / Buffy CEO)

External Paperclip adapter that makes the Freebuff (Buffy CEO) session a
native Paperclip agent type: `freebuff_local`.

## Install (Paperclip → Install External Adapter)

1. Choose the **Local path** tab (not npm — this package is repo-private).
2. Path: `C:\ANTIGRAVITY\ops\paperclip-ceo\adapter-freebuff`
3. Click **Install**. Paperclip's plugin-loader imports the package main and
   validates `createServerAdapter()` (same checks as `adapter.test.js` §1).

## How a run executes

1. Paperclip calls `execute(ctx)` → adapter writes `<runId>.json` into the
   CEO bridge's wakes dir (`ops/paperclip-ceo/wakes/` by default, configurable
   via the `wakesDir` adapter-config field). The wake is written with
   `status: "pending"` — the Freebuff session only lists wakes whose status
   is exactly `pending`.
2. The Freebuff desktop session picks up the wake (`kind: "adapter"`, status
   `pending`), does the work, and reports completion through the bridge's
   normal protocol: `POST /wakes/<runId>/done` (or `/fail`). The bridge
   records this by setting `status: "done"|"failed"` in the wake file itself
   (`bridge.js` `handleDone`).
3. `execute()` polls the wake file for that status field, default timeout
   900s (`timeoutSec` config), and maps it onto `AdapterExecutionResult`. On
   resolution it removes its own wake file so the wakes dir does not
   accumulate. Timeout = honest failed run — the adapter never invents a
   success, and leaves the wake in place so a slow session can still report
   without a 404.

`testEnvironment()` probes the wakes dir (writable → error if not) and the
CEO bridge `:3140/health` (warn only — wake files work without the bridge).

## Verify

```bash
node ops/paperclip-ceo/adapter-freebuff/adapter.test.js
```

Covers: export shape, live environment test, execute success/timeout, and
missing-prompt handling.
