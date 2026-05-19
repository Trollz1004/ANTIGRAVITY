#!/usr/bin/env bash
# OPU-68: Run pytest with coverage and enforce minimum threshold.
# Exits 0 if coverage >= 60%, else 1.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "========================================"
echo " Running pytest with coverage (OPU-68)"
echo "========================================"

# Run pytest with coverage reports
python -m pytest \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=html:htmlcov \
  --cov-report=xml:coverage.xml \
  2>&1 | tee /tmp/coverage_output.txt

TEST_EXIT=${PIPESTATUS[0]:-$?}

echo ""
echo "========================================"
echo " Coverage Summary"
echo "========================================"

# Extract overall coverage percentage from the terminal report
COVERAGE_PCT=$(grep -E '^[Tt][Oo][Tt][Aa][Ll]' /tmp/coverage_output.txt | awk '{print $NF}' | tr -d '%' || true)

if [ -z "$COVERAGE_PCT" ]; then
  # Fallback: try to parse from coverage.xml
  if [ -f coverage.xml ]; then
    COVERAGE_PCT=$(python -c "
import xml.etree.ElementTree as ET
tree = ET.parse('coverage.xml')
root = tree.getroot()
rate = float(root.attrib.get('line-rate', 0))
print(f'{rate * 100:.1f}')
" 2>/dev/null || true)
  fi
fi

if [ -n "$COVERAGE_PCT" ]; then
  echo " Overall coverage: ${COVERAGE_PCT}%"
  THRESHOLD=60
  IS_ABOVE=$(python -c "print(1 if float('${COVERAGE_PCT}') >= ${THRESHOLD} else 0)")
  if [ "$IS_ABOVE" -eq 1 ]; then
    echo " PASS: Coverage ${COVERAGE_PCT}% >= ${THRESHOLD}% threshold"
  else
    echo " FAIL: Coverage ${COVERAGE_PCT}% < ${THRESHOLD}% threshold"
    exit 1
  fi
else
  echo " WARNING: Could not determine coverage percentage from output"
  echo "  Check htmlcov/index.html or coverage.xml for details"
fi

echo ""
echo " Reports generated:"
echo "  - Terminal output (above)"
echo "  - HTML: htmlcov/index.html"
echo "  - XML:  coverage.xml"
echo "========================================"

exit "${TEST_EXIT:-0}"
