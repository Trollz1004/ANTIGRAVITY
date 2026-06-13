"""Tests for the repair coordinator (one-click repair, ticket lifecycle)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import repair
from app.repair import (
    RepairAction,
    RepairStore,
    dispatch_repair,
    plan_repair_for_check,
    submit_repairs_for_health,
)


@pytest.fixture
def store(tmp_path: Path) -> RepairStore:
    return RepairStore(audit_path=tmp_path / "audit.jsonl", max_in_memory=10)


def test_submit_writes_audit_line(store: RepairStore, tmp_path: Path) -> None:
    action = RepairAction(
        target="t5500:5432",
        kind="lan_bind",
        reason="port closed",
        playbook="lan-bind-port",
    )
    ticket = store.submit(action)
    assert ticket.status == "queued"
    line = store._audit_path.read_text(encoding="utf-8").strip()
    record = json.loads(line)
    assert record["event"] == "submitted"
    assert record["ticket"]["action"]["target"] == "t5500:5432"


def test_update_lifecycle(store: RepairStore) -> None:
    action = RepairAction(target="x", kind="manual", reason="r", playbook="p")
    ticket = store.submit(action)
    store.update(ticket.id, "running", note="started")
    store.update(ticket.id, "ok", note="done")
    fetched = store.get(ticket.id)
    assert fetched is not None
    assert fetched.status == "ok"
    assert "started" in fetched.notes
    assert "done" in fetched.notes


def test_get_missing_returns_none(store: RepairStore) -> None:
    assert store.get("does-not-exist") is None


def test_update_missing_raises(store: RepairStore) -> None:
    with pytest.raises(KeyError):
        store.update("missing", "ok")


def test_eviction_caps_in_memory(store: RepairStore) -> None:
    for i in range(15):
        store.submit(RepairAction(target=f"t{i}", kind="manual", reason="r", playbook="p"))
    assert len(store.list()) == 10


def test_plan_repair_for_t5500_postgres() -> None:
    action = plan_repair_for_check(
        category="t5500_services",
        check_name="uandinotai-postgres",
        check_summary="tcp 192.168.0.15:5432",
        check_status="red",
        check_data={"open": False},
    )
    assert action is not None
    assert action.kind == "lan_bind"
    assert action.target == "t5500:5432"
    assert action.ssh_target == "joshl@192.168.0.15"
    # The PowerShell payload is base64-encoded (-EncodedCommand). We assert
    # the SSH wrapper is correct and that the encoded blob decodes to a
    # script that touches both the firewall and the portproxy.
    import base64

    assert action.command[:5] == [
        "ssh",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=5",
    ]
    assert action.command[5] == "joshl@192.168.0.15"
    assert action.command[6:9] == ["powershell.exe", "-NoProfile", "-EncodedCommand"]
    decoded = base64.b64decode(action.command[9]).decode("utf-16-le")
    assert "netsh advfirewall firewall add rule" in decoded
    assert "netsh interface portproxy add v4tov4" in decoded
    assert "5432" in decoded


def test_plan_repair_for_qdrant_and_redis() -> None:
    for name, port in (("qdrant-http", 6333), ("qdrant-grpc", 6334), ("redis", 6379)):
        action = plan_repair_for_check(
            category="t5500_services",
            check_name=name,
            check_summary="closed",
            check_status="red",
            check_data={},
        )
        assert action is not None
        assert action.kind == "lan_bind"
        assert action.target == f"t5500:{port}"


def test_plan_repair_for_openclaw_api() -> None:
    action = plan_repair_for_check(
        category="t5500_services",
        check_name="openclaw-api",
        check_summary="health endpoint failed",
        check_status="red",
        check_data={},
    )
    assert action is not None
    assert action.kind == "container_restart"
    assert action.target == "t5500:openclaw-api"


def test_plan_repair_for_public_surface_is_manual() -> None:
    action = plan_repair_for_check(
        category="cloudflare_pages",
        check_name="youandinotai.com",
        check_summary="HTTP 503",
        check_status="red",
        check_data={},
    )
    assert action is not None
    assert action.kind == "manual"
    assert action.command == []  # no SSH; surfaces to operator


def test_plan_repair_for_node_ssh_down_is_manual() -> None:
    action = plan_repair_for_check(
        category="nodes",
        check_name="T5500",
        check_summary="SSH port closed on 192.168.0.15",
        check_status="red",
        check_data={},
    )
    assert action is not None
    assert action.kind == "manual"


def test_plan_repair_for_vault_on_t5500() -> None:
    action = plan_repair_for_check(
        category="vault_health",
        check_name="T5500 vault",
        check_summary="vault missing",
        check_status="red",
        check_data={},
    )
    assert action is not None
    assert action.kind == "vault_resync"
    assert action.ssh_target == "joshl@192.168.0.15"


def test_plan_repair_returns_none_for_yellow() -> None:
    action = plan_repair_for_check(
        category="t5500_services",
        check_name="uandinotai-postgres",
        check_summary="",
        check_status="yellow",
        check_data={},
    )
    assert action is None


def test_plan_repair_returns_none_for_unknown() -> None:
    action = plan_repair_for_check(
        category="hermes_router",
        check_name="weird-check",
        check_summary="",
        check_status="red",
        check_data={},
    )
    assert action is None


def test_submit_repairs_for_health_skips_green(store: RepairStore) -> None:
    health = {
        "categories": [
            {
                "name": "t5500_services",
                "checks": [
                    {"name": "uandinotai-postgres", "status": "green", "summary": "ok", "data": {}},
                ],
            }
        ]
    }
    submitted = submit_repairs_for_health(health, store)
    assert submitted == []


def test_submit_repairs_for_health_emits_ticket_per_red(store: RepairStore) -> None:
    health = {
        "categories": [
            {
                "name": "t5500_services",
                "checks": [
                    {"name": "uandinotai-postgres", "status": "red", "summary": "closed", "data": {}},
                    {"name": "qdrant-http", "status": "red", "summary": "closed", "data": {}},
                    {"name": "openclaw-api", "status": "red", "summary": "503", "data": {}},
                ],
            },
            {
                "name": "cloudflare_pages",
                "checks": [
                    {"name": "youandinotai.com", "status": "red", "summary": "503", "data": {}},
                ],
            },
        ]
    }
    submitted = submit_repairs_for_health(health, store)
    assert len(submitted) == 4
    targets = {t.action.target for t in submitted}
    assert "t5500:5432" in targets
    assert "t5500:6333" in targets
    assert "t5500:openclaw-api" in targets
    assert "youandinotai.com" in targets


def test_dispatch_repair_marks_noop_when_no_command(store: RepairStore) -> None:
    action = RepairAction(target="manual-only", kind="manual", reason="x", playbook="p", command=[])
    ticket = store.submit(action)
    result = dispatch_repair(store, ticket.id)
    assert result.status == "ok"
    assert any("returncode=0" in n for n in result.notes)


def test_dispatch_repair_does_not_refire_completed(store: RepairStore) -> None:
    action = RepairAction(target="t", kind="manual", reason="r", playbook="p", command=[])
    ticket = store.submit(action)
    dispatch_repair(store, ticket.id)
    second = dispatch_repair(store, ticket.id)
    # The second call should be a no-op because the ticket is in "ok" status.
    assert second.status == "ok"
    assert second.notes.count("dispatch started") == 1


def test_dispatch_repair_missing_raises(store: RepairStore) -> None:
    with pytest.raises(KeyError):
        dispatch_repair(store, "missing-id")
