"""Shared fixtures for the Mission Control v6 test suite.

Everything here is real: probes hit loopback sockets and subprocesses, the
store is a real SQLite file in a tmp dir, notifications write a real JSONL
file. The only stand-ins are *targets* (an ephemeral HTTP probe server) —
never the behaviour under test.
"""

from __future__ import annotations

import json
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

from mission_control.config import build_config
from mission_control.monitor import Monitor
from mission_control.notify import build_hub
from mission_control.store import Store

PY_OK = [sys.executable, "-c", "print('ok')"]
PY_FAIL = [sys.executable, "-c", "import sys; sys.exit(1)"]


def unused_port() -> int:
    """A port guaranteed closed *right now* (good enough for loopback tests)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def flag_command(flag_path: Path) -> list:
    """A probe command that exits 0 only while *flag_path* exists."""
    code = (
        "import sys, pathlib; "
        f"sys.exit(0 if pathlib.Path(r'{flag_path}').exists() else 1)"
    )
    return [sys.executable, "-c", code]


def make_raw(tmp_path: Path, **extra) -> dict:
    """Baseline config used by the tests; merge top-level *extra* keys."""
    raw = {
        "server": {
            "host": "127.0.0.1",
            "port": 18999,
            "state_db": str(tmp_path / "state" / "mc.db"),
            "base_url": "http://mc-test",
            "startup_grace_s": 0,
            "monitor_enabled": False,
        },
        "notifiers": [
            {"type": "console"},
            {"type": "file", "path": str(tmp_path / "alerts.jsonl")},
        ],
        "links": [{"id": "hermes", "label": "Hermes", "url": "http://localhost:9119"}],
        "playbooks": {
            "fixer": {
                "description": "pretend to fix (prints FIXED)",
                "script": "fix-scripts/fixer.cmd",
                "cooldown_s": 0,
                "commands": {"all": [[sys.executable, "-c", "print('FIXED')"]]},
            },
            "breaker": {
                "description": "always fails",
                "cooldown_s": 0,
                "commands": {"all": [[sys.executable, "-c", "import sys; sys.exit(3)"]]},
            },
        },
        "services": [
            {
                "id": "svc-up", "name": "Svc Up", "group": "Test", "kind": "command",
                "command": list(PY_OK), "interval_s": 1, "timeout_s": 15, "fail_threshold": 1,
            },
            {
                "id": "svc-down", "name": "Svc Down", "group": "Test", "kind": "command",
                "command": list(PY_FAIL), "interval_s": 1, "timeout_s": 15,
                "fail_threshold": 2, "playbook": "fixer", "notify_cooldown_s": 0,
            },
            {
                "id": "svc-standby", "name": "Svc Standby", "group": "Test", "kind": "command",
                "command": list(PY_FAIL), "interval_s": 1, "timeout_s": 15,
                "fail_threshold": 1, "expected": False,
            },
        ],
    }
    raw.update(extra)
    return raw


@pytest.fixture
def raw_cfg(tmp_path):
    return make_raw(tmp_path)


@pytest.fixture
def cfg(raw_cfg):
    return build_config(raw_cfg)


@pytest.fixture
def store(tmp_path):
    st = Store(tmp_path / "state" / "mc.db")
    yield st
    st.close()


@pytest.fixture
def monitor(cfg):
    st = Store(cfg.state_db_abs())
    hub = build_hub(cfg.notifiers, resolve_path=cfg.notifier_path_abs)
    mon = Monitor(cfg, st, hub)
    mon.store = st
    yield mon
    st.close()


def read_jsonl(path: Path) -> list:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


class _ProbeHandler(BaseHTTPRequestHandler):
    """Deterministic endpoints for the HTTP-check tests."""

    def do_GET(self):  # noqa: N802 (stdlib naming)
        if self.path == "/ok":
            body, status = b"ok", 200
        elif self.path == "/bad":
            body, status = b"broken", 500
        elif self.path == "/redirect":
            self.send_response(302)
            self.send_header("Location", "/ok")
            self.end_headers()
            return
        elif self.path == "/slow":
            import time as _t
            _t.sleep(2.0)
            body, status = b"slow", 200
        else:
            body, status = b"missing", 404
        self.send_response(status)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # keep the test output clean
        pass


@pytest.fixture(scope="session")
def probe_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), _ProbeHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"127.0.0.1:{server.server_address[1]}"
    server.shutdown()
    thread.join(timeout=2)
