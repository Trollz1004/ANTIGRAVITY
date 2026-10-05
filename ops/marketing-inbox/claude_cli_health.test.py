"""Pytest-style smoke tests for claude_cli_health.py.

Pure-Python test, no pytest dependency. Run:

    python C:/ANTIGRAVITY/ops/marketing-inbox/claude_cli_health.test.py

Tests the probe() function's classification logic by patching
subprocess.run. Verifies the script writes a status file and exits
cleanly in both AUTH_BAD and OK cases.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

# Load the script under test
sys.path.insert(0, r"C:/ANTIGRAVITY/ops/marketing-inbox")
import claude_cli_health as cch  # noqa: E402


class FakeResult:
    def __init__(self, returncode: int, stdout: str = "", stderr: str = ""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def _patched_run(stdout: str, stderr: str = "", returncode: int = 0):
    """Return a function that stands in for subprocess.run."""
    def fake(*a, **kw):
        return FakeResult(returncode, stdout, stderr)
    return fake


def test_probe_classifies_not_logged_in_as_auth_bad():
    with patch.object(cch.subprocess, "run", _patched_run("", "Not logged in · Please run /login")):
        status, raw = cch.probe(timeout_s=5)
    assert status == 1, f"expected AUTH_BAD=1, got {status}"
    assert "Not logged in" in raw


def test_probe_classifies_exit_1_as_cli_broken():
    with patch.object(cch.subprocess, "run", _patched_run("some stdout", "some stderr", returncode=1)):
        status, _ = cch.probe(timeout_s=5)
    assert status == 2, f"expected CLI_BROKEN=2, got {status}"


def test_probe_classifies_clean_exit_as_ok():
    with patch.object(cch.subprocess, "run", _patched_run("ok", "")):
        status, raw = cch.probe(timeout_s=5)
    assert status == 0, f"expected OK=0, got {status}"
    assert "ok" in raw


def test_probe_classifies_filenotfound_as_cli_broken():
    def boom(*a, **kw):
        raise FileNotFoundError("claude not on PATH")
    with patch.object(cch.subprocess, "run", boom):
        status, _ = cch.probe(timeout_s=5)
    assert status == 2, f"expected CLI_BROKEN=2, got {status}"


def test_probe_classifies_timeout():
    def hang(*a, **kw):
        raise subprocess.TimeoutExpired(cmd="claude", timeout=5)
    with patch.object(cch.subprocess, "run", hang):
        status, raw = cch.probe(timeout_s=5)
    assert status == 3, f"expected TIMEOUT=3, got {status}"
    assert "timeout" in raw.lower()


def test_write_status_creates_json_file():
    with tempfile.TemporaryDirectory(prefix="claude_health_test_") as td:
        tmp_path = Path(td) / "status.json"
        with patch.object(cch, "STATUS_PATH", tmp_path):
            cch.write_status(1, "Not logged in")
        assert tmp_path.exists()
        data = json.loads(tmp_path.read_text())
        assert data["status"] == 1
        assert data["statusLabel"] == "AUTH_BAD"
        assert data["raw"] == "Not logged in"


# --- runner ---

if __name__ == "__main__":
    failed = 0
    passed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"  PASS  {name}")
                passed += 1
            except AssertionError as e:
                print(f"  FAIL  {name}: {e}")
                failed += 1
            except Exception as e:
                print(f"  ERROR {name}: {type(e).__name__}: {e}")
                failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
