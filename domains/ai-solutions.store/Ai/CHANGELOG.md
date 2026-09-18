# Changelog

All notable changes to the ANTIGRAVITY project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Mission Control v6** (`mission-control-v6/`): self-healing stack watchdog (FastAPI + SQLite, no build step). Probes the whole ANTIGRAVITY stack on independent intervals — Hermes Dashboard (:9119, the `cmd hermes dashboard` UI), Hermes Agent/Router, OpenClaw Gateway + Web UI (port via `OPENCLAW_PORT`, default 18789), OmniRoute (:20128), Ollama, date-app backend/frontend, date-service, redis/qdrant/postgres, plus standby entries for Paperclip/OpenCode. Services marked `expected` page on DOWN via console, JSONL file, Discord/Slack webhook, SMTP, and Windows toast; every notification embeds the **easy button** (`POST /api/services/<id>/fix`), the dashboard FIX button, and the shipped `fix-scripts/*.cmd`. Opt-in per-service `auto_fix` runs the allow-listed playbook before paging. Ops dashboard with OMNI ROUTE nav bar on port 8787, token-guarded mutations, 144 tests at ~95% coverage.
- Backend (fastapi-app): 19 new test suites — 871 passing at 94% real coverage, gate raised from 60% to **90%** in `backend/fastapi-app/pytest.ini`, with concurrency-aware measurement (`thread` + `greenlet`)

### Changed

- Backend (fastapi-app): marketing router rewritten as real CRUD backed by a new `MarketingContent` model + alembic migration (`20260730_marketing_content`) — no more mock payloads; `video_rooms` now returns 503 instead of a fake `is_mock` room when `DAILY_API_KEY` is unset

### Fixed

- Backend (fastapi-app): 500s on uploads (`user.get("sub")` on ORM object), 500s on validation errors (non-JSON-serializable ctx), 500s on `GET /ops-runs` (response_model mismatch), double `/api/v1` prefix on the ClawX router, duplicate-webhook 500s, and a `video` call-end TypeError on naive `started_at` from SQLite

### Removed

- Backend (fastapi-app): dead zero-importer modules (`payments.py`, `audit_log.py`, `middleware/audit_middleware.py`); unmounted `migrations` router excluded from coverage

## Historical

### Added

- Repository structure with `/frontend`, `/backend`, `/infra`, `/scripts`, `/docs` directories
- Prettier + ESLint for JS/TS formatting and linting
- Black + Ruff for Python formatting and linting
- Git hooks configuration for pre-commit checks
- Comprehensive documentation in docs/ directory:
  - `contributing.md` - Contribution guidelines
  - `architecture.md` - System architecture overview
  - `api.md` - API endpoints and usage
  - `workflows.md` - Core business workflows
- `.env.example` file with all required environment variables
- README.md with setup instructions and project overview
- SECURITY.md with vulnerability reporting process
- docs/governance.md with branch protection, PR approval rules, release/versioning
- CHANGELOG.md for release tracking

### Changed

- Organized existing YouAndINotAI apps into proper directory structure
- Updated root README.md with new structure and setup instructions

### Fixed

- Improved consistency between repository structure and documentation

### Removed

- None

## [1.0.0] - 2026-04-15

### Added

- Initial project structure and documentation
- Basic CI validation workflow
- Deployment workflow to Google Cloud Run

[Unreleased]: https://github.com/Trollz1004/Antigravity/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Trollz1004/Antigravity/releases/tag/v1.0.0
