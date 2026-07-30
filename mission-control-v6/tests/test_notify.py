"""Message construction + every notifier channel."""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from mission_control.models import CheckKind, CheckResult, Playbook, ServiceSpec
from mission_control.notify import (
    BaseNotifier, ConsoleNotifier, FileNotifier, NotifyMessage, NotifierHub,
    SMTPNotifier, WebhookNotifier, WindowsToastNotifier,
    build_autofix_recovery_message, build_down_message, build_hub,
    build_recovery_message,
)

from conftest import read_jsonl


def _spec(with_playbook=True):
    return ServiceSpec(
        id="hermes-dashboard", name="Hermes Dashboard", group="Agents",
        kind=CheckKind.HTTP, url="http://127.0.0.1:9119/",
        playbook="start-hermes-dashboard" if with_playbook else None,
    )


def _pb():
    return Playbook(
        id="start-hermes-dashboard", description="launch hermes dashboard",
        commands={"windows": [["cmd", "/c", "start", "", "hermes", "dashboard"]]},
        script="fix-scripts/fix-hermes-dashboard.cmd",
    )


def _result(ok=False, detail="connect failed: refused"):
    return CheckResult(service_id="hermes-dashboard", ok=ok, latency_ms=3.0, detail=detail)


class TestMessageBuilders:
    def test_down_message_has_easy_button_and_script(self):
        msg = build_down_message(_spec(), _result(), _pb(), "http://mc:8787", down_since="12:00")
        assert msg.level == "down" and "DOWN: Hermes Dashboard" in msg.subject
        # the whole fix must live inside the notification
        assert "curl -X POST http://mc:8787/api/services/hermes-dashboard/fix" in msg.text
        assert "http://mc:8787/#service-hermes-dashboard" in msg.text
        assert "fix-scripts/fix-hermes-dashboard.cmd" in msg.text
        assert "hermes dashboard" in msg.text
        assert "connect failed: refused" in msg.text
        assert msg.context["service_id"] == "hermes-dashboard"

    def test_repeat_subject(self):
        msg = build_down_message(_spec(), _result(), _pb(), "http://mc", down_since="x", repeat=True)
        assert msg.subject.startswith("STILL DOWN")

    def test_no_playbook_note(self):
        msg = build_down_message(_spec(False), _result(), None, "http://mc", down_since="x")
        assert "investigate manually" in msg.text

    def test_autofix_note_embedded(self):
        msg = build_down_message(_spec(), _result(), _pb(), "http://mc",
                                 down_since="x", auto_fix_note="auto-fix attempted and failed: exit 3")
        assert "auto-fix attempted" in msg.text

    def test_recovery_message(self):
        msg = build_recovery_message(_spec(), "http://mc", down_since="12:00",
                                     recovered_detail="HTTP 200")
        assert "RECOVERED" in msg.subject and msg.level == "recovery"
        assert "HTTP 200" in msg.text

    def test_autofix_recovery_message(self):
        msg = build_autofix_recovery_message(_spec(), "FIXED", "HTTP 200", "http://mc")
        assert "AUTO-FIXED" in msg.subject and "FIXED" in msg.text


class TestConsoleAndFile:
    def test_console_prints(self, capsys):
        asyncio.run(ConsoleNotifier().send(NotifyMessage("S", "body line", "down")))
        out = capsys.readouterr().out
        assert "S" in out and "body line" in out and "🔴" in out

    def test_file_appends_jsonl(self, tmp_path):
        path = tmp_path / "sub" / "alerts.jsonl"
        notifier = FileNotifier(path)
        asyncio.run(notifier.send(NotifyMessage("S1", "t1", "down", {"service_id": "a"})))
        asyncio.run(notifier.send(NotifyMessage("S2", "t2", "test")))
        rows = read_jsonl(path)
        assert [r["subject"] for r in rows] == ["S1", "S2"]
        assert rows[0]["service_id"] == "a" and rows[0]["level"] == "down"


class TestWebhook:
    def test_generic_payload(self):
        captured = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["payload"] = json.loads(request.content)
            return httpx.Response(200, json={"ok": True})

        notifier = WebhookNotifier("https://hooks.example/x",
                                   transport=httpx.MockTransport(handler))
        status = asyncio.run(notifier.send(NotifyMessage("S", "text", "down")))
        assert status == "ok"
        assert captured["payload"]["subject"] == "S"
        assert captured["payload"]["level"] == "down"

    def test_discord_payload_adapts(self):
        captured = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["payload"] = json.loads(request.content)
            return httpx.Response(204)

        url = "https://discord.com/api/webhooks/123/abc"
        notifier = WebhookNotifier(url, transport=httpx.MockTransport(handler))
        asyncio.run(notifier.send(NotifyMessage("S", "body", "recovery")))
        assert "content" in captured["payload"]
        assert "S" in captured["payload"]["content"] and "🟢" in captured["payload"]["content"]

    def test_http_error_reported(self):
        notifier = WebhookNotifier(
            "https://hooks.example/x",
            transport=httpx.MockTransport(lambda req: httpx.Response(500)),
        )
        assert asyncio.run(notifier.send(NotifyMessage("S", "t"))) == "HTTP 500"


class TestSMTP:
    def test_send_with_fake_transport(self):
        sent = []
        notifier = SMTPNotifier(host="smtp.example", username="u", sender="mc@x",
                                recipients=["ops@x"], send_fn=sent.append)
        status = asyncio.run(notifier.send(NotifyMessage("DOWN: svc", "details", "down")))
        assert status == "ok" and len(sent) == 1
        email = sent[0]
        assert email["To"] == "ops@x" and "[MissionControl] DOWN: svc" in email["Subject"]
        assert "details" in email.get_content()

    def test_no_recipients(self):
        notifier = SMTPNotifier(host="smtp.example", send_fn=lambda m: None)
        assert asyncio.run(notifier.send(NotifyMessage("S", "t"))) == "no recipients configured"


class TestWindowsToast:
    def test_skips_off_windows(self):
        if sys_platform() == "win32":
            pytest.skip("windows-only assertion")
        status = asyncio.run(WindowsToastNotifier().send(NotifyMessage("S", "t")))
        assert status.startswith("skipped")

    def test_ps_escape(self):
        assert "''" in WindowsToastNotifier._ps_escape("it's happening")
        assert "\n" not in WindowsToastNotifier._ps_escape("a\nb")
        assert len(WindowsToastNotifier._ps_escape("x" * 999)) <= 240


def sys_platform() -> str:
    import sys
    return sys.platform


class TestHub:
    def test_broadcast_isolates_failures(self, tmp_path):
        good = FileNotifier(tmp_path / "a.jsonl")

        class Boom(BaseNotifier):
            name = "boom"

            async def send(self, message):
                raise RuntimeError("explode")

        hub = NotifierHub([Boom(), good])
        report = asyncio.run(hub.broadcast(NotifyMessage("S", "t")))
        assert "explode" in report["boom"]
        assert report["file"] == "ok"
        assert read_jsonl(tmp_path / "a.jsonl")  # the good notifier still fired

    def test_empty_hub(self):
        assert asyncio.run(NotifierHub().broadcast(NotifyMessage("S", "t"))) == {}


class TestBuildHub:
    def test_from_specs(self, tmp_path):
        specs = [
            {"type": "console"},
            {"type": "file", "path": "logs/a.jsonl"},
            {"type": "webhook", "url": "https://hooks.example/x"},
            {"type": "smtp", "host": "h", "recipients": ["a@b"]},
            {"type": "windows-toast"},
            {"type": "webhook", "url": "", "_note": "skipped: empty url"},
            {"type": "console", "enabled": False},
            {"type": "alien-tech"},
        ]
        hub = build_hub(specs, resolve_path=lambda p: tmp_path / p)
        names = [n.name for n in hub.notifiers]
        assert names == ["console", "file", "webhook", "smtp", "windows-toast"]
