# Ops-Runs Data Dictionary

> **Document**: OPU-87 — Data dictionary for the ops-runs schema
> **Location**: `backend/fastapi-app/app/routers/ops_runs.py`
> **Last Updated**: 2026-05-17

---

## Overview

The **ops-runs** module is a lightweight audit log for recording operational script executions in the YouAndINotAI platform. It captures when a script ran, whether it succeeded, how long it took, and any additional context.

Events are stored **in-memory** (volatile — lost on server restart) with a cap of **500 entries**. For production persistence, replace the in-memory store with a database-backed implementation.

### Storage

| Property       | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Store          | Python list (`_RUNS: list[dict]`) — in-memory           |
| Max entries    | 500 (`_MAX_RUNS = 500`)                                  |
| Eviction       | FIFO — oldest entry is popped when the cap is exceeded   |
| Persistence    | None — data is lost on process restart                   |

---

## Schema: `OpsRunCreate` (POST Request Body)

Sent by the client to create a new ops-run record.

| Field         | Type              | Required | Constraints                                   | Description                                                                 |
| ------------- | ----------------- | -------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `script`      | `string`          | **Yes**  | Non-empty                                      | Identifier or path of the script/operation that was executed (e.g. `"data-export.py"`). |
| `status`      | `string`          | **Yes**  | `"success"` \| `"failure"` \| `"skipped"`      | Outcome of the script execution.                                            |
| `duration_ms` | `integer \| null` | No       | Non-negative integer (milliseconds)           | Wall-clock execution time. Omit if not applicable (e.g. for `"skipped"`).   |
| `details`     | `string \| null`  | No       | Free-form text                                 | Additional context: error messages, output snippets, or notes.              |

---

## Schema: `OpsRunResponse` (API Response)

Returned by all endpoints. Contains all `OpsRunCreate` fields plus server-generated metadata.

| Field         | Type              | Required | Constraints                                   | Description                                                                 |
| ------------- | ----------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `id`          | `string`          | **Yes**  | UUID v4 format                                  | Unique identifier for this run event, generated server-side.                |
| `script`      | `string`          | **Yes**  | Non-empty                                       | Identifier/path of the executed script (mirrored from request).             |
| `status`      | `string`          | **Yes**  | `"success"` \| `"failure"` \| `"skipped"`       | Execution outcome.                                                          |
| `duration_ms` | `integer \| null` | No       | Non-negative integer (milliseconds)            | Execution duration. `null` if not provided or not applicable.               |
| `details`     | `string \| null`  | No       | Free-form text                                  | Additional context from the run.                                            |
| `recorded_at` | `string`          | **Yes**  | ISO 8601 / RFC 3339 (UTC)                       | Timestamp when the record was created on the server. Example: `"2026-05-17T09:47:00.000000+00:00"` |

---

## Status Values

| Value       | Meaning                                                             |
| ----------- | ------------------------------------------------------------------- |
| `"success"` | The script completed without errors.                                |
| `"failure"` | The script encountered an error or exited non-zero. Check `details`.|
| `"skipped"` | The script was intentionally not run (e.g. pre-condition failed).   |

---

## Sample Records

### JSONL Record (one per line)

```jsonl
{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","script":"data-export.py","status":"success","duration_ms":3420,"details":"Exported 12,847 rows to S3.","recorded_at":"2026-05-17T09:47:00.000000+00:00"}
{"id":"b2c3d4e5-f6a7-8901-bcde-f12345678901","script":"nightly-cleanup.sh","status":"failure","duration_ms":1200,"details":"Error: database connection timeout after 30s","recorded_at":"2026-05-17T08:00:00.000000+00:00"}
{"id":"c3d4e5f6-a7b8-9012-cdef-123456789012","script":"sync-subscriptions","status":"skipped","duration_ms":null,"details":"No pending subscriptions to sync.","recorded_at":"2026-05-17T07:30:00.000000+00:00"}
```

### Single JSON Record (pretty-printed)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "script": "data-export.py",
  "status": "success",
  "duration_ms": 3420,
  "details": "Exported 12,847 rows to S3.",
  "recorded_at": "2026-05-17T09:47:00.000000+00:00"
}
```

---

## API Endpoints

All endpoints require **JWT authentication** (via `Authorization: Bearer <membership record>` header). The `get_current_user` dependency enforces active-user checks.

### POST `/api/v1/ops-runs`

Record a new ops-run event.

| Property | Value |
| -------- | ----- |
| **Method** | `POST` |
| **Path** | `/api/v1/ops-runs` |
| **Auth** | Required (JWT Bearer membership record) |
| **Status Code** | `201 Created` |
| **Request Model** | `OpsRunCreate` |
| **Response Model** | `OpsRunResponse` |

**Request body example:**

```json
{
  "script": "data-export.py",
  "status": "success",
  "duration_ms": 3420,
  "details": "Exported 12,847 rows to S3."
}
```

**Response body example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "script": "data-export.py",
  "status": "success",
  "duration_ms": 3420,
  "details": "Exported 12,847 rows to S3.",
  "recorded_at": "2026-05-17T09:47:00.000000+00:00"
}
```

---

### GET `/api/v1/ops-runs`

List recent ops-run events, most-recent-first (sliced from the in-memory list).

| Property | Value |
| -------- | ----- |
| **Method** | `GET` |
| **Path** | `/api/v1/ops-runs` |
| **Auth** | Required (JWT Bearer membership record) |
| **Query Params** | `limit` (integer, default `50`) — max number of records to return |
| **Response Model** | `list[OpsRunResponse]` |

**Example:** `GET /api/v1/ops-runs?limit=10`

**Response body example:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "script": "data-export.py",
    "status": "success",
    "duration_ms": 3420,
    "details": "Exported 12,847 rows to S3.",
    "recorded_at": "2026-05-17T09:47:00.000000+00:00"
  }
]
```

---

### GET `/api/v1/ops-runs/{run_id}`

Retrieve a single ops-run event by its UUID.

| Property | Value |
| -------- | ----- |
| **Method** | `GET` |
| **Path** | `/api/v1/ops-runs/{run_id}` |
| **Auth** | Required (JWT Bearer membership record) |
| **Path Params** | `run_id` (string, UUID v4) — the unique run identifier |
| **Response Model** | `OpsRunResponse` |
| **Error** | `404 Not Found` with code `NOT_FOUND` if the ID does not exist |

**Example:** `GET /api/v1/ops-runs/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Error response example:**

```json
{
  "code": "NOT_FOUND",
  "message": "Ops run 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' not found",
  "details": null
}
```

---

## Error Responses

All error responses follow the standard `ErrorResponse` format from `app.error_responses`:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "details": null
}
```

| HTTP Status | Error Code              | When                                      |
| ----------- | ----------------------- | ----------------------------------------- |
| 401         | `INVALID_CREDENTIALS`   | Missing or invalid JWT membership record              |
| 403         | `INSUFFICIENT_PERMISSIONS` | User account is inactive               |
| 404         | `NOT_FOUND`             | `run_id` does not match any recorded run  |
| 422         | `VALIDATION_ERROR`      | Request body fails Pydantic validation    |
| 500         | `INTERNAL_ERROR`        | Unexpected server error                   |

---

## Mission-Control Dashboard Integration

The mission-control frontend (`apps/mission-control/`) uses a **separate, more detailed** operation-run schema via its own API (`/ops/runs`). That schema is distinct from the FastAPI ops-runs documented here:

| Mission-Control Field | Type                              | Description                                    |
| --------------------- | --------------------------------- | ---------------------------------------------- |
| `run_id`              | `string`                          | Unique run identifier                          |
| `command_id`          | `string`                          | Reference to the command template              |
| `title`               | `string`                          | Human-readable operation name                  |
| `command`             | `string`                          | The shell command that was executed            |
| `cwd`                 | `string`                          | Working directory for execution                |
| `status`              | `"running" \| "succeeded" \| "failed" \| "queued"` | Current run state               |
| `started_at`          | `string` (ISO 8601)               | When execution began                           |
| `finished_at`         | `string \| null` (ISO 8601)       | When execution completed                       |
| `duration_s`          | `number \| null`                  | Duration in seconds                            |
| `exit_code`           | `number \| null`                  | Process exit code                              |
| `output`              | `string`                          | Captured stdout/stderr                         |
| `error`               | `string \| null`                  | Error message if failed                        |

> **Note:** The mission-control dashboard polls `/ops/runs` every 4 seconds. This is a different API surface from the `/api/v1/ops-runs` endpoints documented above. The two schemas serve different purposes: the FastAPI ops-runs are a lightweight audit log; the mission-control runs are a full command-execution tracker.

---

## Implementation Notes

- **Router registration**: The ops-runs router is mounted at `/api/v1` with the tag `"ops-runs"` in `backend/fastapi-app/app/main.py` (line 399).
- **ID generation**: UUID v4 via Python's `uuid.uuid4()`.
- **Timestamp**: UTC ISO 8601 via `datetime.now(timezone.utc).isoformat()`.
- **No database**: The current implementation uses a module-level `_RUNS` list. For production, migrate to a database-backed store (e.g., PostgreSQL via SQLAlchemy async).
- **No DELETE/PATCH endpoints**: Runs are append-only. There is no endpoint to modify or delete records.
- **No filtering**: The list endpoint returns the most recent N records. There is no query filtering by script name, status, or date range.
