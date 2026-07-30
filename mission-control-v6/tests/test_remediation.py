"""Playbook rendering + allow-listed execution."""

from __future__ import annotations

import asyncio
import sys

from mission_control.models import CheckKind, Playbook, ServiceSpec
from mission_control.remediation import (
    commands_for_platform, platform_key, playbook_for_service,
    render_playbook_text, run_playbook,
)


def _pb(**kwargs):
    base = dict(id="p", description="desc", commands={"all": [[sys.executable, "-c", "print('done')"]]})
    base.update(kwargs)
    return Playbook(**base)


class TestRender:
    def test_render_full(self):
        pb = _pb(script="fix-scripts/x.cmd")
        text = render_playbook_text(pb)
        assert "Playbook: p — desc" in text
        assert "fix-scripts/x.cmd" in text
        assert "1." in text

    def test_render_none(self):
        assert "investigate manually" in render_playbook_text(None)

    def test_render_missing_platform(self):
        pb = _pb(commands={"windows": [["cmd"]]})
        text = render_playbook_text(pb, platform="linux")
        assert "no commands registered" in text

    def test_commands_platform_fallback_to_all(self):
        pb = _pb()
        assert commands_for_platform(pb, "windows")[0][0] == sys.executable


class TestRunPlaybook:
    def test_success(self):
        run = asyncio.run(run_playbook(_pb(), service_id="svc", requested_by="manual"))
        assert run.ok is True and run.exit_code == 0
        assert "done" in run.output
        assert run.detail == "ok"
        assert run.requested_by == "manual"

    def test_failure_stops_and_reports(self):
        pb = _pb(commands={"all": [
            [sys.executable, "-c", "import sys; print('step1'); sys.exit(3)"],
            [sys.executable, "-c", "print('never reached')"],
        ]})
        run = asyncio.run(run_playbook(pb, service_id="svc"))
        assert run.ok is False and run.exit_code == 3
        assert "step1" in run.output and "never reached" not in run.output
        assert "failed with exit 3" == run.detail

    def test_no_commands_for_platform(self):
        # falls back to "all" only; this pb has neither a linux entry nor "all"
        pb = _pb(commands={"windows": [["cmd"]], "all": []})
        run = asyncio.run(run_playbook(pb, service_id="svc", platform="linux"))
        assert run.ok is False and "no commands" in run.detail and run.exit_code == 127

    def test_timeout(self):
        pb = _pb(commands={"all": [[sys.executable, "-c", "import time; time.sleep(10)"]]},
                 timeout_s=0.4)
        run = asyncio.run(run_playbook(pb, service_id="svc"))
        assert run.ok is False and run.exit_code == 124
        assert "timed out" in run.output

    def test_missing_executable(self):
        pb = _pb(commands={"all": [["mcv6-no-such-binary-9z"]], "windows_only_never": [["x"]]})
        run = asyncio.run(run_playbook(pb, service_id="svc", platform="linux"))
        assert run.ok is False and run.exit_code == 127
        assert "command not found" in run.output

    def test_platform_key(self):
        assert platform_key() in ("windows", "linux")
        assert ("windows" == platform_key()) == (sys.platform == "win32")


def test_playbook_for_service():
    playbooks = {"fixer": _pb(id="fixer")}
    with_pb = ServiceSpec(id="a", name="a", group="g", kind=CheckKind.TCP,
                          host="h", port=1, playbook="fixer")
    without = ServiceSpec(id="b", name="b", group="g", kind=CheckKind.TCP, host="h", port=1)
    assert playbook_for_service(with_pb, playbooks).id == "fixer"
    assert playbook_for_service(without, playbooks) is None
    ghost = ServiceSpec(id="c", name="c", group="g", kind=CheckKind.TCP,
                        host="h", port=1, playbook="ghost")
    assert playbook_for_service(ghost, playbooks) is None
