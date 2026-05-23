from pathlib import Path

import httpx

from app.probes import common, events, github_ci, graphify, hermes, mission_mcp, nodes, pages, revenue, t5500_services, vault
from app.secrets import VaultEnv


def test_common_tcp_open_false() -> None:
    assert common.tcp_open("127.0.0.1", 1, timeout=0.01) is False


def test_run_command_timeout() -> None:
    code, _, stderr = common.run_command(["python", "-c", "import time; time.sleep(2)"], timeout=1)
    assert code == 124
    assert "timed out" in stderr


def test_revenue_missing_credentials(tmp_path: Path) -> None:
    env = tmp_path / "empty.env"
    env.write_text("", encoding="utf-8")
    checks = revenue.probe_revenue(VaultEnv(env))
    assert [check.status for check in checks] == ["red", "red", "yellow"]


def test_graph_missing_credentials(tmp_path: Path) -> None:
    env = tmp_path / "empty.env"
    env.write_text("", encoding="utf-8")
    check = vault.probe_graph_device_list(VaultEnv(env))
    assert check.status == "yellow"
    assert "missing" in check.summary


def test_vault_feature_manual() -> None:
    assert vault.probe_vault_feature().status == "yellow"


def test_events_tail_missing(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(events, "REPO_ROOT", tmp_path)
    assert events.read_events_tail() == []


def test_events_tail_reads_last_lines(monkeypatch, tmp_path: Path) -> None:
    task_dir = tmp_path / "tasks"
    task_dir.mkdir()
    (task_dir / "events.jsonl").write_text("1\n2\n3\n", encoding="utf-8")
    monkeypatch.setattr(events, "REPO_ROOT", tmp_path)
    assert events.read_events_tail(2) == ["2", "3"]


def test_graphify_missing_branch(monkeypatch, tmp_path: Path) -> None:
    (tmp_path / ".graphify").mkdir()
    monkeypatch.setattr(graphify, "REPO_ROOT", tmp_path)
    checks = graphify.probe_graphify()
    assert checks[0].status == "green"
    assert checks[1].status == "yellow"


def test_mission_mcp_counts(monkeypatch, tmp_path: Path) -> None:
    tasks = tmp_path / "tasks"
    tasks.mkdir()
    (tasks / "queue.json").write_text("[{}, {}]", encoding="utf-8")
    (tasks / "failed.json").write_text("[]", encoding="utf-8")
    monkeypatch.setattr(mission_mcp, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(mission_mcp, "tcp_open", lambda *_: True)
    checks = mission_mcp.probe_mission_mcp()
    assert checks[0].status == "green"
    assert checks[1].data["count"] == 2


def test_t5500_services_tcp_and_http_fail(monkeypatch) -> None:
    monkeypatch.setattr(t5500_services, "tcp_open", lambda *_: False)

    class FailingHttp:
        HTTPError = httpx.HTTPError

        @staticmethod
        def get(*_, **__):
            raise httpx.ConnectError("down")

    monkeypatch.setattr(t5500_services, "httpx", FailingHttp)
    checks = t5500_services.probe_t5500_services()
    assert checks[-1].status == "red"


def test_pages_http_fail(monkeypatch) -> None:
    class FailingHttp:
        HTTPError = httpx.HTTPError

        @staticmethod
        def get(*_, **__):
            raise httpx.ConnectError("down")

    monkeypatch.setattr(pages, "httpx", FailingHttp)
    checks = pages.probe_pages()
    assert checks[0].status == "red"


def test_nodes_manual_and_ssh_down(monkeypatch) -> None:
    monkeypatch.setattr(nodes, "AUTHORIZED_NODES", (nodes.AUTHORIZED_NODES[3], nodes.AUTHORIZED_NODES[4]))
    monkeypatch.setattr(nodes, "tcp_open", lambda *_: False)
    checks = nodes.probe_nodes()
    assert checks[0].status == "red"
    assert checks[1].status == "yellow"


def test_github_api_unavailable(monkeypatch) -> None:
    class FailingHttp:
        HTTPError = httpx.HTTPError

        @staticmethod
        def get(*_, **__):
            raise httpx.ConnectError("down")

    monkeypatch.setattr(github_ci, "httpx", FailingHttp)
    checks = github_ci.probe_github()
    assert all(check.status == "yellow" for check in checks)


def test_hermes_missing_script(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(hermes, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(hermes, "tcp_open", lambda *_: False)
    checks = hermes.probe_hermes()
    assert checks[0].status == "red"
    assert checks[-1].status == "yellow"


def test_t5500_services_success(monkeypatch) -> None:
    monkeypatch.setattr(t5500_services, "tcp_open", lambda *_: True)

    class Response:
        status_code = 200

    class GoodHttp:
        HTTPError = httpx.HTTPError

        @staticmethod
        def get(*_, **__):
            return Response()

    monkeypatch.setattr(t5500_services, "httpx", GoodHttp)
    assert all(check.status == "green" for check in t5500_services.probe_t5500_services())


def test_github_success(monkeypatch) -> None:
    class Response:
        status_code = 200

        def __init__(self, payload):
            self._payload = payload

        def json(self):
            return self._payload

    class GoodHttp:
        HTTPError = httpx.HTTPError

        @staticmethod
        def get(url, **__):
            if "pulls" in url:
                return Response([{}, {}])
            return Response({"workflow_runs": [{"conclusion": "success", "html_url": "https://example.test/run"}]})

    monkeypatch.setattr(github_ci, "httpx", GoodHttp)
    checks = github_ci.probe_github()
    assert checks[0].status == "green"
    assert checks[1].data["count"] == 2


def test_graphify_stale(monkeypatch, tmp_path: Path) -> None:
    graph = tmp_path / ".graphify"
    graph.mkdir()
    (graph / "needs_update").write_text("", encoding="utf-8")
    (graph / "branch.json").write_text('{"stale": true}', encoding="utf-8")
    monkeypatch.setattr(graphify, "REPO_ROOT", tmp_path)
    checks = graphify.probe_graphify()
    assert [check.status for check in checks] == ["red", "red"]


def test_vault_local_stats(tmp_path: Path) -> None:
    master = tmp_path / "MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
    master.write_text("A=1", encoding="utf-8")
    stats = vault._folder_stats(tmp_path)
    assert stats["exists"] is True
    assert stats["file_count"] == 1
    assert stats["master_mtime"] > 0
