from fastapi.testclient import TestClient
from fastapi import FastAPI

from mission_control_api.routes import memory

app = FastAPI()
app.include_router(memory.router)
client = TestClient(app)


def test_memory_status_excludes_paperclip():
    resp = client.get("/memory/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["paperclip_excluded"] is True
    assert any(lane["id"] == "codex" for lane in data["lanes"])
    assert any(node["id"] == "t5500" for node in data["nodes"])


def test_memory_bootstrap_returns_agent_context():
    resp = client.get("/memory/bootstrap")
    assert resp.status_code == 200
    data = resp.json()
    assert "AGENTS.md" in data["source_files"]
    assert "Mission Control" in data["text"]
    assert data["entries"]


def test_memory_entry_write_uses_jsonl(tmp_path, monkeypatch):
    log_path = tmp_path / "agent-memory.jsonl"
    boot_path = tmp_path / "boot.md"
    boot_path.write_text("# Test Boot\n", encoding="utf-8")
    monkeypatch.setattr(memory, "MEMORY_LOG", log_path)
    monkeypatch.setattr(memory, "BOOTSTRAP_FILE", boot_path)

    resp = client.post(
        "/memory/entries",
        json={
            "title": "Test memory entry",
            "body": "Agents should be able to read this shared memory entry.",
            "scope": "global",
            "source_agent": "codex",
            "tags": ["test", "memory"],
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["stored"] is True
    assert log_path.exists()
    assert "Test memory entry" in log_path.read_text(encoding="utf-8")
