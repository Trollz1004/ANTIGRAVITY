# Mission OS API Contract (v1)

Plain HTTP/JSON contract served by the Mission OS server on the T5500 (`http://192.168.0.15:3130`) to the Mission OS desktop shell application.

Every JSON response carries `"apiVersion": "v1"` and `"ok": true | false` with `Content-Type: application/json; charset=utf-8`.

---

## 1. Base Address & Discovery

- **Fleet map source:** Clients and tools read the T5500 host and `mission-os` port from `ops/fleet/fleet-map.json`.
- **Canonical base URL:** `http://192.168.0.15:3130`
- **Version prefix:** `/api/v1` (for example, `http://192.168.0.15:3130/api/v1/status`).
- **Response envelope:** Every `/api/v1/*` JSON response includes `"apiVersion": "v1"`. Error responses use `{ "ok": false, "apiVersion": "v1", "error": "<message>" }`.

---

## 2. Authentication & Network Guard

- **Required request header:** Every `/api/v1/*` request must include one of:
  - `X-Mission-OS-Token: <token>`
  - `Authorization: Bearer <token>`
- **Verification:** The T5500 server reads `MISSION_OS_TOKEN` from its environment by variable name, never logs or echoes the value, and compares the supplied token in constant time (`crypto.timingSafeEqual` on equal-length UTF-8 byte buffers).
- **Missing or invalid token (`401 Unauthorized`):**
  ```json
  {
    "ok": false,
    "apiVersion": "v1",
    "error": "Unauthorized"
  }
  ```
- **Unconfigured server token (`503 Service Unavailable`):** When `MISSION_OS_TOKEN` is unset or empty on the T5500:
  ```json
  {
    "ok": false,
    "apiVersion": "v1",
    "error": "MISSION_OS_TOKEN not configured"
  }
  ```
- **Network guard:** The T5500 host firewall allowlist restricts inbound TCP `:3130` to the fleet node addresses listed in `ops/fleet/fleet-map.json`.

---

## 3. Route 1 — Node & Service Status (`GET /api/v1/status`)

Returns live health for the `Trollz1004` fleet nodes and their monitored services.

- **Method & path:** `GET /api/v1/status`
- **Query parameters:**
  - `refresh=1` (optional): bypasses the in-memory cache and probes immediately. Without `refresh=1`, responses may be cached up to 60 seconds (`pollIntervalSeconds: 60`).
- **Scope:** Only the two `Trollz1004` fleet nodes defined in `ops/fleet/fleet-map.json`:
  - `t5500` at `192.168.0.15`
  - `alienware` at `192.168.0.40`
- **Light rule:**
  - `light: "green"`, `flashing: false` when every monitored service on that node answers healthy (`status: "UP"`).
  - `light: "red"`, `flashing: true` when any monitored service on that node fails (`status: "DOWN"` or `"AUTH REQUIRED"`).
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "checkedAt": "2026-11-16T20:00:00.000Z",
    "pollIntervalSeconds": 60,
    "nodes": [
      {
        "id": "t5500",
        "name": "T5500",
        "host": "192.168.0.15",
        "up": true,
        "light": "green",
        "flashing": false,
        "services": [
          {
            "id": "mission-os",
            "name": "Mission OS",
            "host": "192.168.0.15",
            "port": 3130,
            "scope": "lan",
            "up": true,
            "status": "UP",
            "since": "2026-11-16T18:00:00.000Z",
            "lastError": null
          }
        ]
      },
      {
        "id": "alienware",
        "name": "Alienware",
        "host": "192.168.0.40",
        "up": true,
        "light": "green",
        "flashing": false,
        "services": [
          {
            "id": "dream-engine",
            "name": "DREAM Engine",
            "host": "192.168.0.40",
            "port": 9180,
            "scope": "lan",
            "up": true,
            "status": "UP",
            "since": "2026-11-16T18:00:00.000Z",
            "lastError": null
          }
        ]
      }
    ]
  }
  ```
- **Field contract:**
  - `nodes[].light`: `"green" | "red"`
  - `nodes[].flashing`: `boolean`
  - `nodes[].services[].status`: `"UP" | "DOWN" | "AUTH REQUIRED"`
  - `nodes[].services[].since`: ISO-8601 timestamp string or `null`
  - `nodes[].services[].lastError`: error string or `null`

---

## 4. Route 2 — PR Feed (`GET /api/v1/prs`)

Returns pull requests across the three `Trollz1004` repositories for the desktop shell PR feed.

- **Method & path:** `GET /api/v1/prs`
- **Query parameters:**
  - `repo`: `"all" | "ANTIGRAVITY" | "dream-online" | "swarm-command"` (default `"all"`)
  - `state`: `"open" | "closed" | "merged" | "all"` (default `"open"`)
  - `limit`: integer `1..100` (default `30`)
  - `refresh=1` (optional): bypasses cached GitHub PR results
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "generatedAt": "2026-11-16T20:00:00.000Z",
    "items": [
      {
        "repo": "Trollz1004/ANTIGRAVITY",
        "number": 418,
        "code": "#0418",
        "title": "[2026-11-16 #0418] Mission OS v1 API contract (docs/ops/MISSION-OS-API.md), by Gemini Carbon",
        "authorLabel": "Gemini Carbon",
        "state": "open",
        "branch": "claude/finalize-mission-os-api",
        "url": "https://github.com/Trollz1004/ANTIGRAVITY/pull/418",
        "updatedAt": "2026-11-16T20:00:00.000Z",
        "checksSummary": "passing"
      }
    ]
  }
  ```

---

## 5. Route 3 — Chat Box Send & Task List (`POST /api/v1/chat/send` and `GET /api/v1/chat/tasks`)

Queues operator or agent instructions from the desktop shell chat box and exposes queued task status for preview-panel tracking.

### `POST /api/v1/chat/send`

- **Request body:**
  ```json
  {
    "message": "string",
    "repo": "Trollz1004/ANTIGRAVITY",
    "node": "t5500",
    "author": "Josh",
    "ab": false
  }
  ```
- **Allowed field values & validation:**
  - `message` (required): non-empty trimmed string, `<= 16000` characters.
  - `repo` (optional): `"Trollz1004/ANTIGRAVITY" | "Trollz1004/dream-online" | "Trollz1004/swarm-command"` (defaults to `"Trollz1004/ANTIGRAVITY"`).
  - `node` (optional): `"t5500" | "alienware"` (defaults to `"t5500"`).
  - `author` (optional): `"Josh" | "Gemini Carbon" | "GPT-6 Astra" | "GPT-6.1 Sol" | "Codex" | "Opus" | "Fable"` (defaults to `"Josh"`).
  - `ab` (optional): `boolean` (defaults to `false`).
  - Invalid fields return `400 Bad Request` with `{ "ok": false, "apiVersion": "v1", "error": "<validation message>" }`.
- **Queue behavior:** Writes a JSON task file into `MISSION_OS_TASK_QUEUE_DIR` (read by env var name on the T5500) carrying:
  - Required PR title format: `"[YYYY-MM-DD #NNNN] <title>, by <author>"`
  - Required commit trailer: `"Authored-by: <author>"`
- **Response `202 Accepted`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "taskId": "task-20261116-200000-a1b2",
    "status": "queued",
    "repo": "Trollz1004/ANTIGRAVITY",
    "node": "t5500",
    "author": "Josh",
    "expectedTitleFormat": "[YYYY-MM-DD #NNNN] <title>, by Josh",
    "trailer": "Authored-by: Josh",
    "queuedAt": "2026-11-16T20:00:00.000Z"
  }
  ```

### `GET /api/v1/chat/tasks`

- **Purpose:** Returns queued and recent chat tasks from `MISSION_OS_TASK_QUEUE_DIR` for preview-panel tracking in the desktop shell.
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "items": [
      {
        "taskId": "task-20261116-200000-a1b2",
        "status": "queued",
        "message": "Update Mission OS status indicator",
        "repo": "Trollz1004/ANTIGRAVITY",
        "node": "t5500",
        "author": "Josh",
        "ab": false,
        "expectedTitleFormat": "[YYYY-MM-DD #NNNN] <title>, by Josh",
        "trailer": "Authored-by: Josh",
        "queuedAt": "2026-11-16T20:00:00.000Z"
      }
    ]
  }
  ```

---

## 6. Route 4 — Watchdog State & Fix-Task Action (`GET /api/v1/watchdog` and `POST /api/v1/watchdog/fix-task`)

Exposes continuous fleet watchdog state (including the 300-second red-light alert timer, Telegram notification state, active incidents, and keepalive stage counts) and lets the desktop shell queue a targeted service repair task.

### `GET /api/v1/watchdog`

- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "checkedAt": "2026-11-16T20:00:00.000Z",
    "redAlertAfterSeconds": 300,
    "telegramConfigured": true,
    "nodes": {
      "t5500": {
        "light": "green",
        "flashing": false,
        "redSince": null,
        "alertSentAt": null,
        "failingServices": []
      },
      "alienware": {
        "light": "green",
        "flashing": false,
        "redSince": null,
        "alertSentAt": null,
        "failingServices": []
      }
    },
    "incidents": [
      {
        "incidentId": "inc-t5500-hermes-20261116",
        "node": "t5500",
        "serviceId": "hermes",
        "serviceName": "Hermes",
        "host": "192.168.0.15",
        "port": 9119,
        "status": "DOWN",
        "since": "2026-11-16T19:50:00.000Z",
        "reason": "Connection refused",
        "lastError": "connect ECONNREFUSED 192.168.0.15:9119",
        "notifiedTelegram": true,
        "notifiedAt": "2026-11-16T19:55:00.000Z"
      }
    ],
    "keepalive": {
      "updated": "2026-11-16T19:59:00.000Z",
      "stagesUp": 4,
      "stagesTotal": 4
    }
  }
  ```

### `POST /api/v1/watchdog/fix-task`

- **Request body:**
  ```json
  {
    "node": "t5500",
    "serviceId": "hermes",
    "reason": "Connection refused",
    "lastError": "connect ECONNREFUSED 192.168.0.15:9119"
  }
  ```
  - `node` (required): `"t5500" | "alienware"`
  - `serviceId` (required): non-empty string identifying the failing service
  - `reason` (optional): string summary
  - `lastError` (optional): raw probe error string
  - Invalid `node` or empty `serviceId` returns `400 Bad Request` with `{ "ok": false, "apiVersion": "v1", "error": "<validation message>" }`.
- **Response `201 Created`:**
  ```json
  {
    "ok": true,
    "apiVersion": "v1",
    "taskId": "fix-20261116-200000-c3d4",
    "node": "t5500",
    "serviceId": "hermes",
    "lane": "t5500",
    "queuedAt": "2026-11-16T20:00:00.000Z"
  }
  ```
