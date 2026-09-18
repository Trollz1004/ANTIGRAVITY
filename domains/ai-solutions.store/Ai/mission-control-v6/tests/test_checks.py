"""Health probes against real loopback targets (no simulated responses)."""

from __future__ import annotations

import asyncio
import shutil
import sys

import pytest

from mission_control.checks import run_check
from mission_control.models import CheckKind, ServiceSpec

from conftest import unused_port


def _spec(kind: CheckKind, **kwargs):
    defaults = dict(id="t", name="T", group="T", kind=kind, timeout_s=5.0)
    defaults.update(kwargs)
    return ServiceSpec(**defaults)


class TestHTTP:
    def test_ok(self, probe_server):
        host, port = probe_server.split(":")
        spec = _spec(CheckKind.HTTP, url=f"http://{probe_server}/ok")
        result = asyncio.run(run_check(spec))
        assert result.ok is True and "HTTP 200" in result.detail
        assert result.latency_ms >= 0

    def test_server_error_is_down(self, probe_server):
        spec = _spec(CheckKind.HTTP, url=f"http://{probe_server}/bad")
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "HTTP 500" in result.detail

    def test_not_found_default_down_but_whitelisted_ok(self, probe_server):
        url = f"http://{probe_server}/missing"
        assert asyncio.run(run_check(_spec(CheckKind.HTTP, url=url))).ok is False
        spec2 = _spec(CheckKind.HTTP, url=url, expected_status=[404])
        assert asyncio.run(run_check(spec2)).ok is True
        spec3 = _spec(CheckKind.HTTP, url=url, expected_status="any")
        assert asyncio.run(run_check(spec3)).ok is True

    def test_redirect_counts_as_ok_by_default(self, probe_server):
        spec = _spec(CheckKind.HTTP, url=f"http://{probe_server}/redirect")
        assert asyncio.run(run_check(spec)).ok is True

    def test_connection_refused(self):
        spec = _spec(CheckKind.HTTP, url=f"http://127.0.0.1:{unused_port()}/")
        result = asyncio.run(run_check(spec))
        assert result.ok is False and result.detail

    def test_slow_response_times_out(self, probe_server):
        spec = _spec(CheckKind.HTTP, url=f"http://{probe_server}/slow", timeout_s=0.3)
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "timeout" in result.detail


class TestTCP:
    def test_open(self, probe_server):
        host, port = probe_server.split(":")
        spec = _spec(CheckKind.TCP, host=host, port=int(port))
        result = asyncio.run(run_check(spec))
        assert result.ok is True and "accepting" in result.detail

    def test_closed(self):
        spec = _spec(CheckKind.TCP, host="127.0.0.1", port=unused_port())
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "connect failed" in result.detail

    def test_unresolvable_host(self):
        spec = _spec(CheckKind.TCP, host="no.such.host.invalid", port=80, timeout_s=3)
        result = asyncio.run(run_check(spec))
        assert result.ok is False


class TestCommand:
    def test_exit_zero(self):
        spec = _spec(CheckKind.COMMAND, command=[sys.executable, "-c", "print('hi')"])
        result = asyncio.run(run_check(spec))
        assert result.ok is True and "exit 0" in result.detail

    def test_exit_failure_includes_output(self):
        spec = _spec(CheckKind.COMMAND,
                     command=[sys.executable, "-c", "import sys; print('why'); sys.exit(5)"])
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "exit 5" in result.detail and "why" in result.detail

    def test_hanging_command_times_out(self):
        spec = _spec(CheckKind.COMMAND,
                     command=[sys.executable, "-c", "import time; time.sleep(5)"], timeout_s=0.5)
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "timeout" in result.detail


@pytest.mark.skipif(sys.platform == "win32", reason="pgrep branch is POSIX")
class TestProcess:
    def test_running_process_found(self):
        proc = asyncio.run(asyncio.create_subprocess_exec(
            sys.executable, "-c", "import time; time.sleep(20)  # mcv6-marker",
        ))
        try:
            spec = _spec(CheckKind.PROCESS, process="mcv6-marker")
            result = asyncio.run(run_check(spec))
            assert result.ok is True and "running" in result.detail
        finally:
            proc.terminate()

    def test_missing_process(self):
        spec = _spec(CheckKind.PROCESS, process="mcv6-definitely-not-running-9z9z")
        result = asyncio.run(run_check(spec))
        assert result.ok is False and "not found" in result.detail


class TestDocker:
    def test_docker_check_adapts_to_host(self):
        spec = _spec(CheckKind.DOCKER, container="mcv6-ghost-container", timeout_s=15.0)
        result = asyncio.run(run_check(spec))
        if shutil.which("docker") is None:
            assert result.skipped is True and result.ok is True
        else:
            # docker present: either the daemon is up (ghost not running) or down (query fails)
            assert result.skipped is False
            assert result.detail

    def test_known_absent_container_is_not_running_when_daemon_up(self):
        if shutil.which("docker") is None:
            pytest.skip("docker CLI not installed in this environment")
        spec = _spec(CheckKind.DOCKER, container="mcv6-ghost-container", timeout_s=15.0)
        result = asyncio.run(run_check(spec))
        if "docker query failed" in result.detail:
            pytest.skip("docker daemon not reachable")
        assert result.ok is False and "not running" in result.detail
