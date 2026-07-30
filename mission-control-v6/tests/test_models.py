"""Dataclass behaviour + small pure helpers."""

from __future__ import annotations

from datetime import datetime

from mission_control.models import (
    ALERT_ACTIVE, Alert, CheckKind, CheckResult, Link, Playbook,
    ServiceSpec, describe_target, utcnow,
)


def test_utcnow_is_iso_utc():
    ts = utcnow()
    parsed = datetime.fromisoformat(ts)
    assert parsed.tzinfo is not None


def test_service_spec_serialises_kind():
    spec = ServiceSpec(id="x", name="X", group="g", kind=CheckKind.HTTP, url="http://x")
    data = spec.to_dict()
    assert data["kind"] == "http"
    assert data["expected"] is True


def test_describe_target():
    assert describe_target(ServiceSpec(id="a", name="a", group="g", kind=CheckKind.HTTP, url="http://h:1/x")) == "http://h:1/x"
    assert describe_target(ServiceSpec(id="b", name="b", group="g", kind=CheckKind.TCP, host="h", port=42)) == "h:42"
    assert "hermes" in describe_target(ServiceSpec(id="c", name="c", group="g", kind=CheckKind.PROCESS, process="hermes"))
    assert "redis" in describe_target(ServiceSpec(id="d", name="d", group="g", kind=CheckKind.DOCKER, container="redis"))
    assert describe_target(ServiceSpec(id="e", name="e", group="g", kind=CheckKind.COMMAND, command=["echo", "hi"])) == "echo hi"
    # unmatched combination falls back to the id
    assert describe_target(ServiceSpec(id="f", name="f", group="g", kind=CheckKind.COMMAND)) == "f"


def test_check_result_dict():
    result = CheckResult(service_id="a", ok=False, latency_ms=12.5, detail="refused")
    assert result.to_dict()["ok"] is False
    assert result.skipped is False


def test_alert_defaults():
    alert = Alert(service_id="a")
    assert alert.status == ALERT_ACTIVE
    assert alert.notify_count == 0
    assert alert.to_dict()["resolved_at"] is None


def test_playbook_and_link_dicts():
    pb = Playbook(id="p", description="d", commands={"all": [["echo"]]}, script="fix-scripts/x.cmd")
    assert pb.to_dict()["commands"]["all"][0] == ["echo"]
    link = Link(id="l", label="L", url="http://x")
    assert link.to_dict()["group"] == "nav"
