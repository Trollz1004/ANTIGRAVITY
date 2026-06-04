from fastapi.testclient import TestClient

from app.main import app
from app.status import Check


def test_health_all_shape(monkeypatch) -> None:
    green = [Check("ok", "green", "ok")]
    monkeypatch.setattr("app.main.probe_nodes", lambda: green)
    monkeypatch.setattr("app.main.probe_t5500_services", lambda: green)
    monkeypatch.setattr("app.main.probe_pages", lambda: green)
    monkeypatch.setattr("app.main.probe_hermes", lambda: green)
    monkeypatch.setattr("app.main.probe_mission_mcp", lambda: green)
    monkeypatch.setattr("app.main.probe_github", lambda: green)
    monkeypatch.setattr("app.main.probe_revenue", lambda: green)
    monkeypatch.setattr("app.main.probe_vault_sync", lambda: green)
    monkeypatch.setattr("app.main.probe_graph_device_list", lambda: Check("graph", "green", "ok"))
    monkeypatch.setattr("app.main.probe_vault_feature", lambda: Check("vault", "green", "ok"))
    monkeypatch.setattr("app.main.probe_paperweight_audit", lambda: green)
    monkeypatch.setattr("app.main.probe_graphify", lambda: green)
    monkeypatch.setattr("app.main.read_events_tail", lambda: ["event"])

    response = TestClient(app).get("/health/all")

    assert response.status_code == 200
    payload = response.json()
    assert payload["overall"] == "green"
    assert payload["events_tail"] == ["event"]


def test_events_tail_endpoint(monkeypatch) -> None:
    monkeypatch.setattr("app.main.read_events_tail", lambda: ["a", "b"])

    response = TestClient(app).get("/events/tail")

    assert response.status_code == 200
    assert response.json()["events"] == ["a", "b"]
