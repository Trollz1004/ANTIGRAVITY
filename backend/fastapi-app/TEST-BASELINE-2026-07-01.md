# FastAPI Pytest Baseline (TRO-23 / T-009)

**Date:** 2026-07-01  
**Agent:** Grok (14a7fdb9-c07a-4904-921b-0374bceec622)  
**Issue:** TRO-23 T-009: FastAPI pytest baseline run  
**Command:** cd backend/fastapi-app ; python -m pytest -q --tb=no

## Results
- **514 passed**
- **26 skipped**
- **1 xfailed**
- Time: 90.48s (0:01:30)
- Warnings: 1777 (mostly deprecation warnings from fastapi, starlette, pydantic, python-jose, pytest-asyncio)

## Coverage
- Total statements: 6323
- Covered: 4261 (approx)
- **67.39%** (exceeded required 60% gate)
- Coverage XML and HTML report generated (htmlcov/, coverage.xml)

## Notes
- Ran using system Python 3.14 (venv python at .venv/bin/python not directly executable in this pwsh env; tests executed successfully anyway via installed packages + conftest env setup).
- Conftest sets test env (JWT_SECRET, DATABASE_URL=sqlite+aiosqlite:///:memory:, APP_ENV=test etc.).
- Many tests cover auth, verification, payments/square, safety, profiles, events, webhooks, support, marketing, etc. — directly relevant to YouAndINotAI date app features.
- Some xfail/skipped expected.
- Deprecation warnings noted (e.g. asyncio.iscoroutinefunction, utcnow, pydantic config); non-blocking for baseline.
- atexit permission warning on temp dir cleanup (Windows env artifact, not test failure).

## Files
- Full log: %TEMP%\pytest_baseline.log
- Coverage artifacts in fastapi-app/ (htmlcov, coverage.xml)

## Relation to other work
Part of Q3 Foundation under TRO-1 hiring plan / infrastructure work. Complements previous verifications (TRO-24 frontend build, TRO-22 wrangler config).

**Status:** Baseline established and recorded. Issue ready for done.
