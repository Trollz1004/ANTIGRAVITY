#!/usr/bin/env bash
# Run performance benchmarks for the ANTIGRAVITY API
# Usage: ./scripts/run-benchmarks.sh [API_BASE_URL]
# Exit code 0 = all SLOs met, 1 = at least one SLO violated

set -euo pipefail

API_BASE="${1:-http://localhost:8000}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_FILE="/tmp/benchmark-results-$(date +%Y%m%d-%H%M%S).json"

echo "=== ANTIGRAVITY Performance Benchmarks ==="
echo "API Base: ${API_BASE}"
echo "Results:  ${RESULTS_FILE}"
echo ""

cd "${REPO_ROOT}/backend/fastapi-app"

# Run benchmarks with pytest, output JSON
python -m pytest tests/benchmarks/ \
    -v \
    --tb=short \
    --json-report \
    --json-report-file="${RESULTS_FILE}" \
    -x \
    2>&1 || true

echo ""
echo "=== Results ==="
if [ -f "${RESULTS_FILE}" ]; then
    python3 -c "
import json, sys
with open('${RESULTS_FILE}') as f:
    data = json.load(f)
tests = data.get('tests', [])
passed = sum(1 for t in tests if t.get('outcome') == 'passed')
failed = sum(1 for t in tests if t.get('outcome') == 'failed')
total  = len(tests)
print(f'Total: {total}  Passed: {passed}  Failed: {failed}')
for t in tests:
    status = '✓' if t.get('outcome') == 'passed' else '✗'
    node = t.get('nodeid', 'unknown')
    print(f'  {status} {node}')
if failed > 0:
    print(f'\n{failed} benchmark(s) exceeded SLO thresholds!')
    sys.exit(1)
else:
    print('\nAll SLOs met!')
"
else
    echo "No results file generated. Benchmark run may have failed."
    exit 1
fi
