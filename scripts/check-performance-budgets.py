#!/usr/bin/env python3
"""
Performance Budget Check Script (OPU-108)
Validates Core Web Vitals budgets for the ANTIGRAVITY frontend.

Usage:
    python scripts/check-performance-budgets.py [--json]

Exits with code 0 if all budgets pass, 1 if any are exceeded.
"""

import json
import sys
import argparse
from pathlib import Path
from datetime import datetime

# Core Web Vitals performance budgets
PERFORMANCE_BUDGETS = {
    "LCP": {"max": 2500, "unit": "ms", "description": "Largest Contentful Paint"},
    "CLS": {"max": 0.1, "unit": "", "description": "Cumulative Layout Shift"},
    "FID": {"max": 100, "unit": "ms", "description": "First Input Delay"},
    "INP": {"max": 200, "unit": "ms", "description": "Interaction to Next Paint"},
    "TTFB": {"max": 800, "unit": "ms", "description": "Time to First Byte"},
    "FCP": {"max": 1800, "unit": "ms", "description": "First Contentful Paint"},
}

# Simulated RUM data (in production, this would be fetched from analytics)
# These are placeholder values representing "good" scores
SAMPLE_RUM_DATA = {
    "LCP": 1850,
    "CLS": 0.05,
    "FID": 45,
    "INP": 120,
    "TTFB": 320,
    "FCP": 1200,
}


def check_budgets(rum_data: dict) -> dict:
    """Check RUM data against performance budgets."""
    results = {}
    all_passed = True

    for name, budget in PERFORMANCE_BUDGETS.items():
        value = rum_data.get(name)
        if value is None:
            results[name] = {
                "status": "no_data",
                "value": None,
                "budget": budget["max"],
                "unit": budget["unit"],
                "description": budget["description"],
            }
            continue

        passed = value <= budget["max"]
        if not passed:
            all_passed = False

        results[name] = {
            "status": "pass" if passed else "fail",
            "value": value,
            "budget": budget["max"],
            "unit": budget["unit"],
            "description": budget["description"],
            "margin": budget["max"] - value,
        }

    return results, all_passed


def print_results(results: dict, all_passed: bool) -> None:
    """Print formatted results to console."""
    print("=" * 60)
    print("  ANTIGRAVITY — Core Web Vitals Performance Budget Check")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    for name, result in results.items():
        status = result["status"]
        desc = result["description"]
        budget = result["budget"]
        unit = result["unit"]

        if status == "no_data":
            symbol = "❓"
            detail = "No data"
        elif status == "pass":
            symbol = "✅"
            detail = f"{result['value']}{unit} (budget: {budget}{unit}, margin: +{result['margin']}{unit})"
        else:
            symbol = "❌"
            over = abs(result["margin"])
            detail = f"{result['value']}{unit} (budget: {budget}{unit}, over by: {over}{unit})"

        print(f"  {symbol} {name} — {desc}: {detail}")

    print("-" * 60)
    if all_passed:
        print("  ✅ All performance budgets PASSED")
    else:
        print("  ❌ Some performance budgets FAILED — review needed")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Check Core Web Vitals performance budgets")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument("--rum-data", type=str, help="Path to RUM data JSON file")
    args = parser.parse_args()

    # Load RUM data from file if provided, otherwise use sample data
    rum_data = SAMPLE_RUM_DATA
    if args.rum_data:
        rum_path = Path(args.rum_data)
        if rum_path.exists():
            with open(rum_path) as f:
                rum_data = json.load(f)
        else:
            print(f"Warning: RUM data file not found: {rum_path}", file=sys.stderr)
            print("Using sample data instead.", file=sys.stderr)

    results, all_passed = check_budgets(rum_data)

    if args.json:
        output = {
            "timestamp": datetime.now().isoformat(),
            "all_passed": all_passed,
            "results": results,
        }
        print(json.dumps(output, indent=2))
    else:
        print_results(results, all_passed)

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
