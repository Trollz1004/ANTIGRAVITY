Run a security review on recently changed files.

## Steps

1. **Get recently modified files** (last commit or staged changes):
   ```bash
   git diff --name-only HEAD~1 HEAD
   ```

2. **For each changed file**, check against Opus Guardian invariants:
   - **Zero Secrets in Source**: Scan for API keys, tokens, passwords (regex: `sk_live_`, `<SQUARE_ACCESS_TOKEN>`, `Bearer `, hardcoded URLs with keys)
   - **Auth on Every Endpoint**: If a new FastAPI router was added, verify it has auth dependency
   - **Doctrine Boundary**: live code must not reintroduce retired split markers or unsupported charity-side routing claims
   - **Revenue Policy**: If metrics.py was touched, verify the founder-directed 10% charitable cap is hardcoded (not from env/config)
   - **PII Isolation**: If /metrics/ endpoints changed, verify no emails/names/user IDs leak
   - **No Raw SQL**: Check for f-string SQL or string interpolation in queries
   - **Input Validation**: New POST/PUT endpoints must use Pydantic schemas
   - **CORS**: Only youandinotai.com and localhost:3000 allowed

3. **Also check**:
   - New dependencies for known vulnerabilities
   - Hardcoded URLs that should be environment variables
   - Console.log/print statements left in production code

4. **Report**: PASS/FAIL for each invariant, with file:line for any violations.
