Run the pre-launch checklist for youandinotai.com:
1. FastAPI backend live and returning 200 on /health
2. Square webhooks: SQUARE_WEBHOOK_VERIFY_SIGNATURE=true in CI, all 5 product links functional
3. CI: all 6 jobs green on main (validate, eslint-prettier-check, black-ruff-check, run-tests, js-tests, guardian-check)
4. pytest coverage ≥ 80%
5. No canonical-7 ban terms on customer surfaces
6. No secrets in source (run opus-guardian.py)
7. Auth on every endpoint verified
Report each item DONE / BLOCKED / UNKNOWN.
