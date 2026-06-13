"""Integration tests for the one-click repair HTTP API."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app, repair_store
from app.repair import RepairAction


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def _clean_store():
    # Reset the in-memory store between tests.
    repair_store._tickets.clear()
    yield
    repair_store._tickets.clear()


def test_health_all_still_works(client: TestClient) -> None:
    response = client.get("/health/all")
    assert response.status_code == 200
    body = response.json()
    assert "overall" in body
    assert "categories" in body


def test_repair_submit_returns_ticket(client: TestClient) -> None:
    response = client.post(
        "/repair",
        json={
            "target": "t5500:5432",
            "kind": "lan_bind",
            "reason": "test",
            "playbook": "lan-bind-port",
            "command": [],
            "ssh_target": None,
        },
    )
    assert response.status_code == 200
    ticket = response.json()
    assert ticket["action"]["target"] == "t5500:5432"
    assert ticket["status"] == "queued"


def test_repair_listing(client: TestClient) -> None:
    client.post(
        "/repair",
        json={"target": "a", "kind": "manual", "reason": "r", "playbook": "p"},
    )
    client.post(
        "/repair",
        json={"target": "b", "kind": "manual", "reason": "r", "playbook": "p"},
    )
    response = client.get("/repair/tickets")
    assert response.status_code == 200
    body = response.json()
    assert len(body["tickets"]) == 2


def test_repair_get_404(client: TestClient) -> None:
    response = client.get("/repair/tickets/missing")
    assert response.status_code == 404


def test_repair_dispatch_endpoint(client: TestClient) -> None:
    submit = client.post(
        "/repair",
        json={"target": "x", "kind": "manual", "reason": "r", "playbook": "p", "command": []},
    )
    ticket_id = submit.json()["id"]
    response = client.post(f"/repair/tickets/{ticket_id}/dispatch")
    assert response.status_code == 200
    assert response.json()["status"] in {"ok", "failed"}


def test_repair_dispatch_404(client: TestClient) -> None:
    response = client.post("/repair/tickets/missing/dispatch")
    assert response.status_code == 404


def test_repair_plan_walks_red_checks(monkeypatch, client: TestClient) -> None:
    # Stub the health builder to return a known red state without network probes.
    from app import main

    def fake_health() -> dict:
        return {
            "captured_at": "2026-06-13T00:00:00Z",
            "overall": "red",
            "counts": {"green": 0, "yellow": 0, "red": 1},
            "categories": [
                {
                    "name": "t5500_services",
                    "status": "red",
                    "checks": [
                        {
                            "name": "uandinotai-postgres",
                            "status": "red",
                            "summary": "closed",
                            "data": {"open": False},
                        }
                    ],
                }
            ],
            "events_tail": [],
        }

    monkeypatch.setattr(main, "_build_health", fake_health)

    response = client.post("/repair/plan", json={"auto_dispatch": False})
    assert response.status_code == 200
    body = response.json()
    assert len(body["submitted"]) == 1
    assert body["submitted"][0]["action"]["target"] == "t5500:5432"
    assert body["submitted"][0]["status"] == "queued"


def test_repair_plan_auto_dispatch(monkeypatch, client: TestClient) -> None:
    from app import main

    def fake_health() -> dict:
        return {
            "captured_at": "2026-06-13T00:00:00Z",
            "overall": "red",
            "counts": {"green": 0, "yellow": 0, "red": 1},
            "categories": [
                {
                    "name": "cloudflare_pages",
                    "status": "red",
                    "checks": [
                        {"name": "youandinotai.com", "status": "red", "summary": "503", "data": {}}
                    ],
                }
            ],
            "events_tail": [],
        }

    monkeypatch.setattr(main, "_build_health", fake_health)

    response = client.post("/repair/plan", json={"auto_dispatch": True})
    assert response.status_code == 200
    body = response.json()
    assert body["submitted"][0]["status"] in {"ok", "failed"}
