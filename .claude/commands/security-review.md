Run security review across the stack:
1. Run opus-guardian: `python scripts/clawx-control/opus-guardian.py`
2. Check all 8 invariants: Zero Secrets in Source, Auth on Every Endpoint, Legacy Routing Drift Blocker, Revenue Split is CODE not CONFIG, PII Isolation, No Raw SQL, Input Validation, CORS Locked
3. Grep for any .env values accidentally committed: `git log --all --full-history -- "*.env" | head -20`
4. Check Hermes hard wall: `grep -r "ANTHROPIC_API_KEY" services/hermes-router/ 2>/dev/null`
Report score and any failures. Target: 100% (current baseline 96%).
