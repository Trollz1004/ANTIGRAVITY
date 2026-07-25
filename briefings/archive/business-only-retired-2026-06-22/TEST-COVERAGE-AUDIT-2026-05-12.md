# Test Coverage Audit — 2026-05-12

> Auditor: Claude Opus 4.7 (1M context), via focused Explore-agent inventory.
> Scope: Full monorepo. Inventories tests, identifies untested critical surfaces, ranks gaps by mission/money/security blast radius.

---

## TL;DR

One pocket of the codebase is well-tested (`backend/fastapi-app/`, ~30 pytest files with CI + 80% coverage threshold). Everything that touches **money, identity, or chain state** is effectively untested — and CI doesn't run the JS/TS or Solidity suites at all.

**Biggest single risk:** 19 Solidity contracts, zero tests, money-routing math, immutable post-deploy. With the Base L2 DAO deploy on the near horizon and the Financial Protection Rule locking tokenomics, this is the gap to close first.

---

## Section 1 — Inventory by stack

| Workspace | Framework | Tests | Approx. LOC | In CI? | Status |
|---|---|---|---|---|---|
| `backend/fastapi-app/` | pytest + pytest-cov | 30 | ~5,225 | ✅ enforced (80% threshold) | Strong |
| `services/mission-control-api/` | pytest | 3 | 46 | ⚠️ weak | Critical gap |
| `services/mission-mcp/` | vitest | 6 | 716 | ❌ | Minimal |
| `apps/mission-control/` | Playwright e2e | 1 | ~50 | ❌ | Bare |
| `tools/ClawX/` | vitest | 1 | ~80 | ❌ | Minimal |
| `income-engine/` | vitest | 2 | ~50 | ❌ | Untested |
| `scripts/` | pytest | 2 | ~80 | ❌ | Untested |
| `contracts/src/` (19 `.sol` files) | Hardhat-capable | **0** | — | ❌ | **CRITICAL** |
| `apps/` (5 other Next.js apps) | — | **0** | — | ❌ | **UNTESTED** |
| `services/youandinotai-api`, `crossfire`, `revenue-core`, `hermes` | FastAPI | unknown | — | ❌ | **UNKNOWN** |

**Totals:** ~45 test files across the repo. Only Python backend has active CI enforcement with coverage thresholds.

### CLAUDE.md drift surfaced during audit

Two doctrine/reality mismatches worth a reconcile pass (not blocking this briefing):

1. **Contracts location.** CLAUDE.md says `packages/contracts/src/` with exactly three files (`Router100.sol`, `DatingRevenueRouter.sol`, `Gospelpayment.sol`). Audit found `contracts/src/` with **19 `.sol` files** — including `PlatformSplitter`, governance tokens (AGRAV, LOVE, YANAI), and treasury logic. Either contracts moved or the doctrine wasn't updated when more were added.
2. **Canonical Python.** CLAUDE.md's folder map points at `services/youandinotai-api/` as the primary API. The well-tested Python actually lives in `backend/fastapi-app/`.

---

## Section 2 — Top 8 highest-priority gaps

### Gap 1: Solidity contracts — 19 files, ZERO tests

- **Location:** `contracts/src/` (Router100, DatingRevenueRouter, PlatformSplitter, Gospelpayment, governance tokens, treasury logic).
- **Why it matters:** Money routing math goes live unverified. Post-deploy these are immutable. With Base L2 DAO deploy approaching and the Financial Protection Rule locking tokenomics, this is the single highest-blast-radius gap in the repo.
- **Concrete test cases:**
  -  calculations (10% reserve, 90% platform; edge cases at $0.01, $10K, $100K)
  - Multi-wallet routing (Router100, DatingRevenueRouter, PlatformSplitter)
  - Governance token transfers (AGRAV, LOVE, YANAI)
  - Treasury operations and authorization checks
  - Reentrancy guards on payable paths
  - Access-control modifiers on admin functions

### Gap 2: Square webhook signature verification — tested but bypassed in CI

- **Location:** `backend/fastapi-app/app/routers/webhooks.py` (844 lines).
- **Why it matters:** HMAC-SHA256 signature verification prevents spoofed payments. The verification logic *has* tests, but `ci-validate.yml:198` sets `SQUARE_WEBHOOK_VERIFY_SIGNATURE: 'false'` — the real signature path is never exercised in CI. If verification broke, tests wouldn't catch it.
- **Concrete test cases:**
  - Flip CI flag to `true`
  - Replay-attack prevention (event_id deduplication)
  - Constant-time HMAC compare (timing-attack resistance)
  - Missing / malformed signature header rejection
  - Wrong-secret rejection

### Gap 3: Mission-Control-API — 18 probe modules, 3 tests

- **Location:** `services/mission-control-api/src/mission_control_api/probes/` (cloudflare, docker, guardian, hermes, http, ollama, openclaw, paperclip, public_sites, repo, revenue_buckets, shell, square, stack, t5500, tcp, treasury).
- **Why it matters:** These probes are the platform's health eyes. Currently 46 total lines of tests across `test_envelope.py`, `test_revenue_doctrine.py`, `test_routes.py`.
- **Concrete test cases:**
  - `revenue_buckets`: tracking logic matches backend allocation model
  - `treasury`: asset/wallet balance queries
  - `guardian`: invariant checks mirror `opus-guardian.py`
  - `square`: payment integration health
  - `hermes`: router message-routing validation

### Gap 4: Opus Guardian — 393 lines, not unit-tested, not in CI

- **Location:** `scripts/clawx-control/opus-guardian.py`
- **Why it matters:** Core security invariant validator (no secrets in source, auth on every endpoint,  is CODE not CONFIG, PII isolation, no raw SQL, input validation, CORS locked). Claimed score 96%, but the validator itself is unverified and not gated in CI. If its secret-pattern detector silently breaks, every guarantee evaporates.
- **Concrete test cases:**
  - Secret pattern detection (Stripe, Anthropic, GitHub PAT formats)
  - Doctrine drift detection (deprecated routing markers must NOT appear)
  - Public endpoint allowlist enforcement
  - Required ENV keys validation
  - Revenue-policy hardcoding check (10% reserve non-configurable)
  - Wire `opus-guardian.py --check` into `ci-validate.yml` as a gate

### Gap 5: Revenue allocation — happy-path math only

- **Location:** `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` + `/mnt/c/antigravity/services/mission-control-api/src/mission_control_api/probes/revenue_buckets.py`
- **Why it matters:** Encodes the 1-wallet / 10%-reserve invariant. Existing `test_revenue_allocation.py` covers basic math; missing integration coverage.
- **Concrete test cases:**
  - End-to-end: webhook → payment → allocation → treasury settlement
  - 10% accuracy at $0.01, $10K, $100K boundaries
  - Reserve-floor lockdown (no drain below floor)
  - Duplicate-payment idempotency (same Square `event_id` ⇒ one allocation)
  - Operator adjustments (quarterly reserve decisions)

### Gap 6: Six FastAPI routers fully untested

- **Location:** `backend/fastapi-app/app/routers/` — 1,128 lines combined:
  - `verify.py` (402 lines) — identity verification, age gate, tier validation
  - `metrics.py` (227 lines) — PII isolation in analytics
  - `video.py` (205 lines) — video infrastructure
  - `uploads.py` (139 lines) — file upload safety
  - `video_rooms.py` (86 lines) — room access control
  - `users.py` (69 lines) — registration / dedupe
- **Why it matters:** `verify.py` carries FL §496.405 age-gate compliance. `metrics.py` is a PII isolation surface. `uploads.py` is an injection-attack surface.
- **Concrete test cases per module:**
  - `verify`: identity proof validation, age-gate (FL compliance), tier verification
  - `metrics`: PII scrubbing, no user IDs in metric keys
  - `uploads`: file-type validation, size limits, malware-scan integration
  - `users`: registration validation, dedupe, email verification
  - `video` / `video_rooms`: room access control, participant limits

### Gap 7: Frontend / Next.js apps — zero tests across 6 apps

- **Location:** `apps/` — `youandinotai-frontend` (customer-facing dating app), `mission-control` (1 Playwright e2e only), `dashboard`, `command-center`, `opuspawclaw`, `antigravity-cockpit`.
- **Why it matters:** Dating UI is customer-facing pre-launch (April 4, 2026). No unit tests for matching display, payment-flow UI, profile validation, age-gate UI.
- **Concrete test cases:**
  - Square checkout button flow
  - Auth state on client
  - Age-gate UI compliance (§496.405)
  - Matching algorithm display

### Gap 8: Unknown-state services

- **Location:** `services/youandinotai-api/`, `services/crossfire/`, `services/revenue-core/`, `services/hermes/`
- **Why it matters:** Cannot audit coverage without confirming which are production-critical vs archived. Action: clarify lifecycle status of each.

---

## Section 3 — Tooling gaps

| Gap | Impact | Tool missing |
|---|---|---|
| No JS/TS coverage instrumentation | ~10 test files, no coverage % visibility | `c8`, `nyc`, or `vitest --coverage` |
| No Solidity coverage | 19 contracts, 0% coverage | `solidity-coverage` (Hardhat plugin) |
| JS/TS not in CI | Tests are shelfware; no fail-gate | Add `pnpm test` to `ci-validate.yml` |
| No integration tests | Payment flow untested end-to-end | pytest fixtures spanning webhook → allocation → treasury |
| No flake detection | Silent CI failures invisible | `pytest-xdist`, `pytest-retry`, flake-warning lint |
| Opus Guardian not automated | Security invariants are suggestions, not gates | `python scripts/clawx-control/opus-guardian.py --check` in CI |

---

## Section 4 — Quick wins, ordered by signal/effort

| # | Action | Effort | Signal |
|---|---|---|---|
| 1 | Hardhat + tests for `Router100`, `DatingRevenueRouter`, `PlatformSplitter` | ~4 hr | **CRITICAL** (closes pre-DAO gap) |
| 2 | Wire `opus-guardian.py --check` into CI | 1 hr | HIGH (security doctrine becomes a gate) |
| 3 | Add `pnpm test` to `ci-validate.yml`; fail on error | 30 min | HIGH (existing JS tests stop being shelfware) |
| 4 | Flip `SQUARE_WEBHOOK_VERIFY_SIGNATURE` to `true` in CI + replay/timing tests | 2 hr | HIGH (real signature path runs) |
| 5 | Tests for `verify.py` + `uploads.py` + `metrics.py` | ~8 hr | HIGH (privacy, compliance, injection) |
| 6 | Mission-Control-API probe tests (start with guardian, revenue_buckets, square) | 6 hr | MEDIUM |
| 7 | Integration: webhook → allocation → treasury end-to-end | 8 hr | MEDIUM |

**Sequence per Josh's doctrine (2026-05-12):** #1 first (pre-DAO money-routing math). Dispatch Codex for audit-review pass on the Solidity tests before any Base L2 deploy. Items #2–#5 follow.

---

## Bottom line

- **Strong:** Python backend (30 tests, 80% threshold, CI enforced).
- **Fragile:** Solidity contracts (0 tests, 19 files), mission-control-api probes (3 tests across 18 modules), frontend (0 tests across 6 apps).
- **Security risk:** Square webhook verification disabled in CI; Opus Guardian not automated.
- **Biggest bang:** Solidity tests + JS in CI + Opus Guardian gate ≈ 95% of signal gain in ~8 hours of work.
