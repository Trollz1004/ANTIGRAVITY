# Repo Issues Audit — 2026-05-22

> Branch: `claude/repo-issues-audit-jOxqE`
> Author: first-party Claude (Claude Code on the web, cloud execution environment)
> Scope: resolve what is resolvable in the cloud environment; document the rest.

---

## TL;DR

`main` could not install, import, or collect its backend test suite. This is the
root cause behind **issue #78 (revenue-blocker: main CI red)**. A series of
unreviewed bulk commits — **#84** (GraphQL + PII encryption + telemetry) and
**#85** ("complete rate-limit migration + restore black/ruff green") — landed code
that referenced undeclared dependencies, missing symbols, and a SQLAlchemy API
that does not exist, plus a half-finished test-fixture refactor.

This branch fixes every unambiguous blocker. The backend test suite went from
**total collection failure → 399 passing / 68 failing**. The remaining 68 failures
(plus 3 stale test modules) require product/architecture decisions and are
itemized below for a follow-up session.

---

## DONE (committed on this branch)

Commit `fix(backend): restore importability + test collection after #84/#85 bulk merges`

| Area | Fix | Why |
|---|---|---|
| `requirements.txt` | Replaced invalid `hypothesis==6.x.x` placeholder with `hypothesis==6.152.9` | Literal `6.x.x` is not a valid version specifier → `pip install` failed, breaking both `run-tests` and `black-ruff-check` CI jobs |
| `requirements.txt` | Added `strawberry-graphql[fastapi]==0.316.0` | `app/main.py` + `app/graphql/*` import `strawberry`, never declared (added by #84) |
| `requirements.txt` | Added `opentelemetry-sdk`, `-exporter-otlp-proto-http`, `-instrumentation-fastapi`, `-instrumentation-sqlalchemy` (1.42.1 / 0.63b1) | `app/telemetry.py` imports them, never declared (telemetry commit) |
| `app/graphql/types.py` | Defined `ProfileResponse` and `UserMeResponse` | Imported by `queries.py`/`mutations.py` but never created → ImportError |
| `app/encryption.py` | Derive `private_name` in `__set_name__` instead of `mapped_column.key` | `MappedColumn` has no `.key` in SQLAlchemy 2.0 → `User` model crashed at class-definition time, taking down the whole app import |
| `app/telemetry.py` | Instrument `engine.sync_engine` not the async engine | `AsyncEngine` cannot take event listeners → crash on import |
| `app/main.py` | Skip `setup_telemetry()` when `APP_ENV=test` | Suite was flooding stderr trying to export spans to a non-existent OTLP collector at localhost:4318 |
| `tests/conftest.py` | `db_session_factory` yields the callable sessionmaker again (was a tuple); `isolated_db_session` reads engine via `factory.kw["bind"]` | A half-finished refactor changed the fixture to yield `(engine, factory)` and updated only 2 internal consumers, breaking **~108** tests that call `db_session_factory()` directly |
| `tests/test_chaos_engineering.py` | Replaced tautological `... or True` assert with a real conditional check | Cleared ruff `SIM222` (the lint error failing `black-ruff-check`) |
| repo root | Deleted stray tracked `Edit` junk file | Accidental commit; garbage content |

Verification performed in a clean venv (`pip install -r requirements.txt` only):
app imports successfully and **470 tests collect** (excluding the 3 broken modules below).
`ruff check .` and `black --check .` are clean across the backend.

---

## TO DO (needs another Claude / Josh — decisions required)

### 1. PII encryption descriptors are non-functional — ARCHITECTURE DECISION
**Symptom:** `assert None == 'export_happy@example.com'`, `assert None == 'Some bio'`,
`AttributeError: 'NoneType' has no attribute 'google_id'`, `'User' object has no
attribute 'expires_at'` (~6 tests).

`app/encryption.py` `EncryptedString` / `EncryptedDate` are plain Python descriptors
assigned as `email = EncryptedString(mapped_column(...))`. SQLAlchemy 2.0 declarative
mapping **does not register these as ORM columns** — so encrypted fields do not
persist or read back (they return `None`). This whole approach (introduced in #84,
which previously used clean `Mapped[str] = mapped_column(...)`) is architecturally
incompatible with SQLAlchemy 2.0.

**Two clean paths (pick one — touches the PII Isolation guardian invariant + auth):**
- **(A) Revert to plain columns.** Restore the pre-#84 `Mapped[str] = mapped_column(...)`
  form for `email`, `display_name`, `date_of_birth`, `square_customer_id`, `google_id`.
  Lowest risk; matches the entire project history before #84. Drops the (never-working)
  at-rest encryption attempt.
- **(B) Reimplement with `sqlalchemy.TypeDecorator`.** A `TypeDecorator(String)` whose
  `process_bind_param`/`process_result_value` call `encrypt_data`/`decrypt_data` is the
  correct SQLAlchemy-native way to do transparent column encryption, and integrates with
  the existing `Mapped[str]` columns. More work; needs DB round-trip tests.

`encrypt_data`/`decrypt_data` themselves are fine and reusable under either path.

### 2. Error-response envelope changed — CONTRACT DECISION + a real bug
**Symptom:** `KeyError: 'detail'` (12 tests), `AssertionError: {"code":"ErrorCode.NOT_FOUND","message":...}` (4),
several `assert 404 == 200/403`.

`#85` rewrote `app/error_responses.py`. The API now returns `{"code": ..., "message": ...}`
instead of FastAPI's default `{"detail": ...}`. Decisions needed:
- Is `{code, message}` the **intended new public contract**? If yes, the tests are stale
  and should be updated — **and the frontend (`apps/youandinotai-frontend/`) must be
  checked for matching expectations.** If no, restore the `detail` shape.
- **Real bug regardless:** the `code` value serializes as the literal string
  `"ErrorCode.NOT_FOUND"` (the enum's `repr`) instead of its `.value`. Whoever owns this
  should emit `error_code.value`, not `str(error_code)`.

### 3. WebSocket auth tests — TEST UPDATE
**Symptom:** `TypeError: object MagicMock can't be used in 'await' expression`,
`WebSocketDisconnect` (~8 tests in `tests/test_websocket.py`).

`app/dependencies/websocket_auth.py` now does `await db.scalar(select(User)...)`, but the
tests mock `db` with a plain `MagicMock`. Update the mocks to `AsyncMock` (and align the
expected rejection reason string — one test expects `"Invalid membership record payload"` but the code
returns `"Could not validate credentials"`).

### 4. Three test modules import removed/renamed symbols — TEST OR CODE RESTORE
These currently **fail at collection** (CI collects all of `tests/` per `pytest.ini`):
- `tests/test_launch_audit.py` → imports `_verify_metrics_key` from `app/routers/metrics.py`.
  #85 stripped `metrics.py` down to an **unauthenticated** `/metrics` endpoint. Note: this
  may violate the **"Auth on Every Endpoint"** guardian invariant — decide whether to
  restore metrics-key auth (preferred, doctrine-aligned) or update the test.
- `tests/benchmarks/conftest.py` → imports `reset_rate_limits` from `app.rate_limit`. The
  module is now `app.rate_limit_redis` (function removed in the migration). Update the
  benchmark to the Redis limiter API or add a reset helper.
- `tests/test_migration_safety.py` → `from alembic.safety import ...` collides with the
  installed `alembic` package (local `alembic/safety.py` is shadowed). Needs an import
  strategy that targets the local migration dir.

### 5. Remaining misc assertion drift (~bucket)
Pydantic `ValidationError` (~12) and count/state asserts (`assert 9 == 1`, `assert 201 == 409`,
unique-constraint) across profiles/verify/messages/boards routes — likely downstream of
#1 (encryption) and #2 (error envelope); re-triage after those land.

---

## NOT TOUCHED — `awaiting-josh` doctrine decisions (open issues)

These need a founder A/B/C call, not a code fix. Listed for completeness:

- **#82** retired-code `Integrations.tsx` (alternate processor-as-primary doctrine drift) — recommend delete.
- **#80** coverage gate doc/CI mismatch (CLAUDE.md 80% vs `ci-validate.yml` 63%) — note: the
  gate is currently `--cov-fail-under=63`; raising it is moot until the 68 failures above are
  resolved.
- **#75** `ai-solutions.store` references in frontend — recommend Option B (narrow the scan scope).
- **#72** in-platform `claude_opus`/`codex_local` architect references — Option C (hybrid) suggested.
- **#73 / #71 / #57** Hermes integrity-watchdog REVIEW flags on `paperclip-9020/` config — these
  are baseline-approval decisions only Josh can resolve (update `integrity-watchdog.json` or revert).

---

## Recommendation for the next session

Work the TO-DO buckets in this order for the fastest path to green CI:
**#4 (collection errors)** → **#1 (encryption, pick A for speed)** → **#2 (error envelope + enum
bug)** → **#3 (websocket mocks)** → **#5 (re-triage)**. Each is independently committable.
The deeper lesson for doctrine: #84/#85 reached `main` broken because direct-to-main /
auto-merge bypassed a CI that was already red — consider branch protection (flagged in #78).
