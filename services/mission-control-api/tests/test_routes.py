import pytest
from fastapi.testclient import TestClient
from mission_control_api.main import app

client = TestClient(app)

def test_self_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"

def test_health_all():
    resp = client.get("/health/all")
    assert resp.status_code == 200
    data = resp.json()
    # ensure summary exists
    assert "_summary" in data
    assert isinstance(data["_summary"], dict)
