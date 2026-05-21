"""
Tests for the dependency scanning and reporting logic.
Uses mock data to test report generation without requiring pip-audit or npm.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Add scripts dir to path
SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from scan_dependencies import SEVERITY_ORDER, generate_report


class TestGenerateReport(unittest.TestCase):
    """Test the report generation with mock data."""

    def test_empty_data(self):
        """No vulnerabilities in either source."""
        report, total, critical, high = generate_report({}, {})
        self.assertIn("No vulnerabilities found", report)
        self.assertEqual(total, 0)
        self.assertEqual(critical, 0)
        self.assertEqual(high, 0)

    def test_pip_vulnerabilities(self):
        """pip-audit reports vulnerabilities."""
        pip_data = {
            "dependencies": [
                {
                    "name": "vulnerable-pkg",
                    "version": "1.0.0",
                    "vulns": [
                        {
                            "id": "GHSA-1234",
                            "description": "A bad vulnerability",
                            "fix_versions": ["1.0.1"],
                        },
                    ],
                },
            ],
        }
        report, total, critical, high = generate_report(pip_data, None)
        self.assertIn("vulnerable-pkg", report)
        self.assertGreaterEqual(total, 1)

    def test_npm_vulnerabilities(self):
        """npm audit reports vulnerabilities."""
        npm_data = {
            "vulnerabilities": {
                "bad-package": {
                    "severity": "high",
                    "via": [
                        {
                            "title": "XSS vulnerability",
                            "url": "https://example.com",
                            "cwe": "CWE-79",
                            "range": ">=1.0.0 <2.0.0",
                        }
                    ],
                    "range": ">=1.0.0 <2.0.0",
                },
            },
        }
        report, total, critical, high = generate_report(None, npm_data)
        self.assertIn("bad-package", report)
        self.assertIn("HIGH", report)
        self.assertGreaterEqual(total, 1)
        self.assertGreaterEqual(high, 1)

    def test_report_has_summary(self):
        """Report includes a summary section."""
        report, _, _, _ = generate_report(None, None)
        self.assertIn("## Summary", report)

    def test_report_has_timestamp(self):
        """Report includes generation timestamp."""
        report, _, _, _ = generate_report(None, None)
        self.assertIn("Generated:", report)


class TestSeverityOrder(unittest.TestCase):
    """Test severity ordering constants."""

    def test_severity_order(self):
        self.assertLess(SEVERITY_ORDER["critical"], SEVERITY_ORDER["high"])
        self.assertLess(SEVERITY_ORDER["high"], SEVERITY_ORDER["medium"])
        self.assertLess(SEVERITY_ORDER["medium"], SEVERITY_ORDER["low"])


if __name__ == "__main__":
    unittest.main()
