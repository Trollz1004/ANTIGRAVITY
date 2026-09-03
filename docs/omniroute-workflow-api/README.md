# OmniRoute Gateway — API Reference + Workflow Kit

Generated 2026-09-03 from the installed package at
`C:\Users\joshi\AppData\Roaming\npm\node_modules\omniroute\`, version **3.8.49**
(VERIFIED — `package.json:3`: `"version": "3.8.49"`).

Every claim below is marked **VERIFIED** (cites a `file:line` in the installed
package or a command run against the live instance) or **UNVERIFIED**
(plausible but not directly confirmed — usually because the actual Next.js
route-handler source files are not shipped in this npm package; only the
compiled `dist/.build/next/...` bundle and shared `src/lib`, `src/sse`,
`src/server`, `src/domain` helper modules are).

## What OmniRoute is, here

OmniRoute is the normal **authenticated, OpenAI-compatible** route for harness
work on this machine (per `C:\ANTIGRAVITY\CLAUDE.md`). It's a unified AI
router/gateway (160+ providers, MCP/A2A, desktop, PWA) running as a local
Node/Next.js service.

- Base URL (Sabretooth, local): `http://127.0.0.1:20128/api/v1` — VERIFIED reachable (see Known State).
- Base URL (other LAN nodes): `http://192.168.0.8:20128/api/v1` — VERIFIED **currently timing out**, see Known State.
- Env vars (names only, never values): `OPENAI_COMPAT_BASE_URL`, `OMNI_ROUTE_API_KEY`.

## Route table

| Path | Methods | Auth class | Notes |
|---|---|---|---|
| `/` | GET | none | 307 redirect → `/dashboard`. VERIFIED live + `src/server/authz/classify.ts:53-59`, `pipeline.ts:258-263`. |
| `/api/v1/models` | GET | CLIENT_API (optional here — see Auth) | Lists all models incl. combo aliases. VERIFIED live, 200 OK, 2758 models. |
| `/api/v1/chat/completions` | POST | CLIENT_API | OpenAI-compatible chat. SSE when `stream:true` or `Accept: text/event-stream`. VERIFIED route exists (`dist/.build/next/server/app/api/v1/chat/route.js`); request validation VERIFIED in `src/sse/handlers/chat.ts`. **Live POST call did not return — see Known State.** |
| `/api/v1/responses` | POST | CLIENT_API | Responses-API-shaped endpoint; also reachable via `/codex` alias (`classify.ts:19-21`). UNVERIFIED body schema (route source not shipped). |
| `/api/v1/files` | POST/GET | CLIENT_API | File upload/list. Table schema VERIFIED: `src/lib/db/migrations/028_create_files_and_batches.sql` (`id, bytes, created_at, filename, purpose, content, mime_type, api_key_id, deleted_at, status, expires_at`). |
| `/api/v1/images/edits` | POST | CLIENT_API | Image edit endpoint (dir `dist/.../app/api/v1/images` VERIFIED to exist). Body schema UNVERIFIED. |
| `/api/v1/audio/transcriptions` | POST | CLIENT_API | Route dir VERIFIED to exist. Body schema UNVERIFIED (OpenAI-compatible multipart assumed, not directly confirmed). |
| `/api/v1/ws` | GET (handshake) | CLIENT_API (special-cased) | `?handshake=1` is treated as an anonymous metadata read even with no key — VERIFIED `src/server/authz/policies/clientApi.ts:10-19,65-67`. Live GET to the handshake URL did not return a response in this session (see Known State). |
| `/api/docs` | GET | MANAGEMENT | Requires a management-scoped credential (an `oma_` access token, or an API key with the `manage` scope) — plain client API keys are NOT sufficient. VERIFIED live: 401 with `AUTH_001`. |
| `/api/v1beta/*`, `/v1/*`, `/v1beta/*`, `/chat/completions`, `/responses`, `/models`, `/codex*` | — | CLIENT_API | Aliased to the canonical `/api/v1/...` paths. VERIFIED `src/server/authz/classify.ts:8-45`. |

Other `/api/v1/*` route directories exist in the compiled bundle but were out
of scope for this pass (VERIFIED present, not documented in depth):
`accounts`, `agents`, `antigravity`, `auto-combo`, `batches`, `chatgpt-web`,
`combos`, `completions`, `embeddings`, `issues`, `management`, `me`,
`messages`, `moderations`, `music`, `ocr`, `provider-plugin-manifest`,
`providers`, `quotas`, `registered-keys`, `relay`, `rerank`, `search`,
`videos`, `vscode`, `web`.

## Auth

**VERIFIED** — `src/server/authz/policies/clientApi.ts:21-50` (`extractBearer`).
For `CLIENT_API`-class routes (everything under `/api/v1/*` and its aliases),
the credential is read in this order:

1. `Authorization: Bearer <key>` header (case-insensitive `bearer ` prefix; a
   malformed/foreign Authorization header does NOT short-circuit — it falls
   through to the next options rather than rejecting).
2. `x-api-key: <key>` header.
3. `x-goog-api-key: <key>` header (accepted so `@google/genai`-based clients,
   e.g. gemini-cli, work unmodified).
4. A URL/path-embedded token (`extractApiKey`, used e.g. by tokenized
   `/vscode/{token}/...` routes).

If `REQUIRE_API_KEY` is **not** enabled, an absent or invalid key degrades to
an anonymous "local" identity instead of a 401 — `clientApi.ts:73-95`. This
means `/api/v1/models` answered with no `Authorization` header at all in the
live test below; that is expected behavior on this instance, not a bug.

`/api/docs` and other unlisted `/api/*` paths classify as **MANAGEMENT**
(`classify.ts:103-119`), which is a *different, stricter* policy
(`src/server/authz/policies/management.ts`): it needs either an `oma_`
management access token or an API key carrying the `manage` scope — a normal
inference API key is rejected with `AUTH_001`.

## Streaming

**VERIFIED** `src/sse/handlers/chat.ts:365-377`. SSE activates when either:
- the request body sets `"stream": true`, or
- the request has no `stream` field but sends `Accept: text/event-stream`
  (and does *not* also list `application/json`, which signals a
  non-streaming OpenAI/Vercel-AI-SDK client).

An explicit `stream: true`/`false` in the body always wins over the header.

## Error envelope

Two shapes coexist (both **VERIFIED live**):

Route-not-found (any unmatched `/api/v1/...` path):
```json
{"error":{"message":"Unknown API route: /api/v1/does-not-exist-xyz","type":"not_found","code":"unknown_route","path":"/api/v1/does-not-exist-xyz"}}
```
HTTP 404. Also present verbatim in the compiled bundle
(`dist/.build/next/server/chunks/[root-of-the-server]__0b3erg-._.js`).

MANAGEMENT-class auth rejection (e.g. `/api/docs` with no credential):
```json
{"error":{"code":"AUTH_001","message":"Authentication required","correlation_id":"<uuid>"}}
```
HTTP 401. Source: `src/server/authz/policies/management.ts:308-313` +
`src/server/authz/pipeline.ts:73-91` (adds `correlation_id`).

CLIENT_API-class auth rejection uses the same envelope shape but code
`AUTH_002` (`"Authentication required"` / `"Invalid API key"`) —
**VERIFIED in source** (`clientApi.ts:77,96`); not exercised live because
`REQUIRE_API_KEY` currently allows anonymous fallthrough on this instance.

A third, older envelope shape also exists in the codebase
(`src/lib/api/errorResponse.ts`): `{"error":{"message,"type","details"},"requestId"}`
— used by some management/API-key-scoped handlers (e.g.
`requireManagementAuth.ts`). UNVERIFIED which routes hit this vs. the
`authz/pipeline.ts` shape without reading each route file individually.

## Known state — 2026-09-03

- **LAN address unreachable.** `http://192.168.0.8:20128/api/v1/models`
  **TIMES OUT** even from Sabretooth itself (VERIFIED: `curl --noproxy '*' -m 8`
  → exit 28, no response in 8s). `http://127.0.0.1:20128/...` answers
  normally. `netstat -ano` shows the listener bound to `0.0.0.0:20128`
  (VERIFIED), owned by PID whose command line is
  `node ... omniroute\dist\server-ws.mjs` (VERIFIED via
  `wmic process where "ProcessId=<pid>" get CommandLine`). Binding to
  `0.0.0.0` means the process itself listens on all interfaces; the LAN
  timeout is most likely a Windows Firewall inbound-rule gap for that port,
  not an application bind issue. Fix (**needs elevated shell — Joshua runs
  it**):
  ```
  netsh advfirewall firewall add rule name="OmniRoute 20128" dir=in action=allow protocol=TCP localport=20128
  ```

- **POST requests did not return in this session.** Independently
  reproduced with Git-Bash `curl` (both with and without an `Authorization`
  header, against `/api/v1/chat/completions` and even a garbage POST body to
  `/api/v1/models`) and with PowerShell `Invoke-WebRequest` — all hung past a
  30-60s timeout with zero bytes received (curl exit 28 / HTTP status `000`).
  `netstat` showed the resulting sockets sitting in `ESTABLISHED`/`CLOSE_WAIT`
  against the OmniRoute PID rather than closing, i.e. the server accepted the
  TCP connection but never completed the HTTP response. GET requests on the
  same port respond immediately and correctly. This means: the live
  "1-token authenticated chat completion" verification the task asked for
  could **not** be completed — it timed out with no HTTP status and no body,
  same as the unauthenticated control call. Treat every POST-endpoint
  description in this kit (chat completions, files, images/edits, audio
  transcriptions, responses) as **schema-verified from source, not
  live-verified for a successful response** until this is retested.

- Confirmed **combo model ids**: `/api/v1/models` (GET, unauthenticated,
  200 OK) returned 2758 models total, 39 of them `owned_by: "combo"`:
  `auto/best-coding`, `auto/best-reasoning`, `auto/best-fast`,
  `auto/best-vision`, `auto/best-chat`, `auto/best-coding-fast`,
  `auto/pro-coding`, `auto/pro-reasoning`, `auto/pro-vision`, `auto/pro-chat`,
  `auto/pro-fast`, `auto/coding`, `auto/fast`, `auto/chat`, `auto/cheap`,
  `auto/offline`, `auto/smart`, `auto/claude-opus`, `auto/claude-sonnet`,
  `auto/best-free`, `auto/best-chaos`, `auto/chaos`, `auto/coding:fast`,
  `auto/coding:cheap`, `auto/coding:free`, `auto/coding:pro`,
  `auto/coding:reliable`, `auto/reasoning`, `auto/reasoning:pro`,
  `auto/vision`, `auto/multimodal`, `auto/glm`, `auto/minimax`, `auto/mimo`,
  `auto/zai`, `auto/gemma`, `auto/llama`, `auto/gemini`, `coder-cascade`.
  `auto/best-coding` has `context_length: 1050000`, `max_output_tokens: 1048576`,
  capabilities `tool_calling/reasoning/thinking/temperature: true`.

## Files in this kit

- `openapi.yaml` — OpenAPI 3.1 for the routes above, both base URLs, bearer scheme.
- `examples/curl.sh`, `examples/invoke.ps1`, `examples/node.mjs`, `examples/python.py`
  — list models, non-streaming chat, streaming chat. All read the key from
  `OMNI_ROUTE_API_KEY` in the environment; none hardcode it.
- `postman_collection.json` — Postman v2.1, `{{baseUrl}}`/`{{apiKey}}` variables (empty).

Also copied to `C:\ANTIGRAVITY\ops\omniroute\workflow_api\`.
