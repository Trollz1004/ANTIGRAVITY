"""CLI: check / fix / list-services / notify-test exit codes and output."""

from __future__ import annotations

import json
import sys

import pytest

from mission_control.cli import build_parser, main

from conftest import PY_FAIL, PY_OK, make_raw, read_jsonl


@pytest.fixture
def config_path(tmp_path):
    path = tmp_path / "mc.json"
    path.write_text(json.dumps(make_raw(tmp_path)))
    return str(path)


class TestListServices:
    def test_lists_registry(self, config_path, capsys):
        assert main(["-c", config_path, "list-services"]) == 0
        out = capsys.readouterr().out
        assert "svc-up" in out and "svc-down" in out
        assert "(fix: fixer)" in out


class TestCheck:
    def test_all_healthy_exits_zero(self, tmp_path, capsys):
        raw = make_raw(tmp_path, services=[{
            "id": "only-up", "name": "Only Up", "group": "T", "kind": "command",
            "command": list(PY_OK), "interval_s": 1, "timeout_s": 15, "fail_threshold": 1,
        }])
        path = tmp_path / "ok.json"
        path.write_text(json.dumps(raw))
        assert main(["-c", str(path), "check"]) == 0
        assert "🟢" in capsys.readouterr().out

    def test_expected_down_exits_one(self, tmp_path, capsys):
        raw = make_raw(tmp_path, services=[{
            "id": "only-down", "name": "Only Down", "group": "T", "kind": "command",
            "command": list(PY_FAIL), "interval_s": 1, "timeout_s": 15, "fail_threshold": 1,
        }])
        path = tmp_path / "down.json"
        path.write_text(json.dumps(raw))
        assert main(["-c", str(path), "check"]) == 1

    def test_json_output(self, config_path, capsys):
        assert main(["-c", config_path, "check", "--json"]) == 1
        data = json.loads(capsys.readouterr().out)
        assert data["svc-up"]["ok"] is True and data["svc-down"]["ok"] is False

    def test_status_alias(self, config_path, capsys):
        assert main(["-c", config_path, "status"]) == 1


class TestFix:
    def test_fix_service(self, config_path, capsys):
        assert main(["-c", config_path, "fix", "svc-down"]) == 0
        out = capsys.readouterr().out
        assert "FIXED" in out and "service now:" in out

    def test_fix_unknown(self, config_path, capsys):
        assert main(["-c", config_path, "fix", "ghost"]) == 2

    def test_fix_no_playbook(self, config_path, capsys):
        assert main(["-c", config_path, "fix", "svc-up"]) == 2


class TestNotifyTest:
    def test_sends_and_reports(self, config_path, tmp_path, capsys):
        assert main(["-c", config_path, "notify-test"]) == 0
        out = capsys.readouterr().out
        report = json.loads(out[out.index("{"):])  # console notifier logs before the JSON
        assert report["console"] == "ok" and report["file"] == "ok"
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert rows and rows[-1]["level"] == "test"


class TestErrors:
    def test_missing_config_is_two(self, capsys):
        assert main(["-c", "/nope/mc.json", "list-services"]) == 2
        assert "config error" in capsys.readouterr().err

    def test_parser_requires_command(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args([])


class TestServeWiring:
    def test_serve_constructs_app_and_runs_uvicorn(self, config_path, monkeypatch, capsys):
        captured = {}

        class FakeUvicorn:
            @staticmethod
            def run(app, host=None, port=None, log_level=None):
                captured["app"] = app
                captured["host"] = host
                captured["port"] = port

        monkeypatch.setitem(sys.modules, "uvicorn", FakeUvicorn)
        assert main(["-c", config_path, "serve"]) == 0
        assert captured["port"] == 18999
        assert "dashboard:" in capsys.readouterr().out
