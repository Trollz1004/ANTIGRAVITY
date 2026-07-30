"""HTTP surface: dashboard, status, checks, THE EASY BUTTON, alerts, links, auth."""

from __future__ import annotations

import sys

import pytest
from fastapi.testclient import TestClient

from mission_control.api import create_app
from mission_control.config import build_config

from conftest import make_raw, read_jsonl


@pytest.fixture
def app(tmp_path):
    return create_app(config=build_config(make_raw(tmp_path)))


@pytest.fixture
def client(app):
    with TestClient(app) as client:
        yield client


class TestBasics:
    def test_healthz(self, client):
        data = client.get("/healthz").json()
        assert data["ok"] is True and "mission-control" in data["name"]

    def test_dashboard_html(self, client):
        response = client.get("/")
        assert response.status_code == 200
        html = response.text
        assert "MISSION CONTROL" in html
        assert "OMNI ROUTE" in html
        assert "/api/services/' + encodeURIComponent(id) + '/fix" in html

    def test_status_shape(self, client):
        data = client.get("/api/status").json()
        assert data["ok"] is True
        assert {"services", "counts", "active_alerts", "now", "base_url"} <= set(data)
        ids = {s["id"] for s in data["services"]}
        assert {"svc-up", "svc-down"} <= ids

    def test_services_list(self, client):
        data = client.get("/api/services").json()
        assert len(data["services"]) == 3

    def test_service_detail_with_playbook_text(self, client):
        data = client.get("/api/services/svc-down").json()
        assert data["id"] == "svc-down"
        assert "Playbook: fixer" in data["playbook_text"]
        assert "fix-scripts/fixer.cmd" in data["playbook_text"]

    def test_service_detail_unknown(self, client):
        assert client.get("/api/services/ghost").status_code == 404


class TestCheckEndpoint:
    def test_check_now(self, client):
        response = client.post("/api/services/svc-up/check")
        assert response.status_code == 200
        data = response.json()
        assert data["result"]["ok"] is True and data["state"] == "up"

    def test_check_unknown(self, client):
        assert client.post("/api/services/ghost/check").status_code == 404


class TestEasyButton:
    def test_fix_runs_allowlisted_playbook(self, client):
        response = client.post("/api/services/svc-down/fix")
        assert response.status_code == 200
        data = response.json()
        assert data["fix"]["ok"] is True and "FIXED" in data["fix"]["output"]
        assert data["fix"]["requested_by"] == "manual"
        # history persisted the run
        history = client.get("/api/history").json()
        assert history["fix_runs"][0]["service_id"] == "svc-down"

    def test_fix_without_playbook_is_404(self, client):
        response = client.post("/api/services/svc-up/fix")
        assert response.status_code == 404

    def test_fix_unknown_service_is_404(self, client):
        assert client.post("/api/services/ghost/fix").status_code == 404

    def test_fix_cooldown_is_429(self, tmp_path):
        raw = make_raw(tmp_path, playbooks={
            "slow-pb": {
                "description": "x", "cooldown_s": 9999,
                "commands": {"all": [[sys.executable, "-c", "pass"]]},
            }
        }, services=[{
            "id": "svc", "name": "Svc", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "import sys; sys.exit(1)"],
            "interval_s": 1, "timeout_s": 15, "fail_threshold": 1, "playbook": "slow-pb",
        }])
        app = create_app(config=build_config(raw))
        with TestClient(app) as c:
            assert c.post("/api/services/svc/fix").status_code == 200
            second = c.post("/api/services/svc/fix")
            assert second.status_code == 429
            assert "cooldown" in second.json()["fix"]["detail"]


class TestAlerts:
    def test_alert_lifecycle_over_http(self, client, tmp_path):
        assert client.get("/api/alerts?active=true").json()["alerts"] == []
        client.post("/api/services/svc-down/check")   # fails=1
        client.post("/api/services/svc-down/check")   # fails=2 → alert
        alerts = client.get("/api/alerts?active=true").json()["alerts"]
        assert len(alerts) == 1
        alert = alerts[0]
        assert alert["service_id"] == "svc-down"
        assert "EASY BUTTON" in alert["fix_hint"]
        assert "curl -X POST http://mc-test/api/services/svc-down/fix" in alert["fix_hint"]

        ack = client.post(f"/api/alerts/{alert['id']}/ack")
        assert ack.json()["acknowledged"] is True
        again = client.post(f"/api/alerts/{alert['id']}/ack")
        assert again.json()["acknowledged"] is False

        # notification file really received the alert
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert any(r["subject"].startswith("DOWN") for r in rows)

    def test_ack_unknown_alert(self, client):
        assert client.post("/api/alerts/4242/ack").status_code == 404


class TestHistoryLinksNotify:
    def test_history(self, client):
        client.post("/api/services/svc-up/check")
        data = client.get("/api/history").json()
        assert data["checks"] and data["checks"][0]["service_id"] == "svc-up"
        assert {"checks", "alerts", "fix_runs"} <= set(data)

    def test_links_include_mc_and_configured(self, client):
        links = client.get("/api/links").json()["links"]
        by_id = {l["id"]: l["url"] for l in links}
        assert by_id["status"].endswith("/api/status")
        assert by_id["hermes"] == "http://localhost:9119"

    def test_notify_test_endpoint(self, client, tmp_path):
        data = client.post("/api/notify/test").json()
        assert data["ok"] is True
        assert data["report"]["console"] == "ok" and data["report"]["file"] == "ok"
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert any(r["level"] == "test" for r in rows)


class TestTokenGuard:
    @pytest.fixture
    def authed_client(self, tmp_path):
        raw = make_raw(tmp_path)
        raw["server"]["api_token"] = "s3cr3t"
        app = create_app(config=build_config(raw))
        with TestClient(app) as client:
            yield client

    def test_mutations_rejected_without_token(self, authed_client):
        assert authed_client.post("/api/services/svc-up/check").status_code == 401
        assert authed_client.post("/api/services/svc-down/fix").status_code == 401
        assert authed_client.post("/api/alerts/1/ack").status_code == 401
        assert authed_client.post("/api/notify/test").status_code == 401

    def test_reads_stay_open(self, authed_client):
        assert authed_client.get("/api/status").status_code == 200
        assert authed_client.get("/").status_code == 200

    def test_header_token_accepted(self, authed_client):
        response = authed_client.post("/api/services/svc-up/check",
                                      headers={"x-mc-token": "s3cr3t"})
        assert response.status_code == 200

    def test_bearer_token_accepted(self, authed_client):
        response = authed_client.post("/api/services/svc-up/check",
                                      headers={"Authorization": "Bearer s3cr3t"})
        assert response.status_code == 200

    def test_wrong_token_rejected(self, authed_client):
        response = authed_client.post("/api/services/svc-up/check",
                                      headers={"x-mc-token": "nope"})
        assert response.status_code == 401
