"""Notification channels + message building.

Every alert embeds the complete "easy button": the one-line POST the operator
can run (or click through the dashboard), the shipped fix script path, and the
exact manual commands — so the fix is inside the notification itself.
"""

from __future__ import annotations

import asyncio
import json
import smtplib
import sys
from dataclasses import dataclass, field
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import httpx

from .models import CheckResult, Playbook, ServiceSpec, describe_target, utcnow
from .remediation import render_playbook_text

_LEVEL_ICON = {"down": "🔴", "degraded": "🟡", "recovery": "🟢", "test": "🔧", "info": "ℹ️"}


@dataclass
class NotifyMessage:
    subject: str
    text: str
    level: str = "info"
    context: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {"subject": self.subject, "text": self.text, "level": self.level, **self.context}


# --------------------------------------------------------------------------- #
# Message builders
# --------------------------------------------------------------------------- #

def _fix_section(spec: ServiceSpec, playbook: Optional[Playbook], base_url: str) -> List[str]:
    if not spec.playbook:
        return ["", "FIX: no auto-fix playbook configured — investigate manually."]
    lines = [
        "",
        "──────────── EASY BUTTON ────────────",
        f"One click : curl -X POST {base_url}/api/services/{spec.id}/fix",
        f"Dashboard : {base_url}/#service-{spec.id}  (press the FIX button)",
    ]
    if playbook and playbook.script:
        lines.append(f"Script    : {playbook.script}")
    lines.append("Manual    :")
    lines.append(render_playbook_text(playbook))
    return lines


def build_down_message(spec: ServiceSpec, result: CheckResult, playbook: Optional[Playbook],
                       base_url: str, *, down_since: str, repeat: bool = False,
                       auto_fix_note: str = "") -> NotifyMessage:
    subject = ("STILL DOWN" if repeat else "DOWN") + f": {spec.name} [{spec.group}]"
    lines = [
        f"Mission Control alert — {spec.name} is DOWN and it is expected to be UP.",
        "",
        f"Service : {spec.name} ({spec.id})",
        f"Group   : {spec.group}",
        f"Target  : {describe_target(spec)}",
        f"Down at : {down_since}",
        f"Check   : {result.detail}",
    ]
    if auto_fix_note:
        lines.append(f"Auto-fix: {auto_fix_note}")
    lines.extend(_fix_section(spec, playbook, base_url))
    return NotifyMessage(
        subject=subject, text="\n".join(lines), level="down",
        context={"service_id": spec.id, "group": spec.group},
    )


def build_recovery_message(spec: ServiceSpec, base_url: str, *, down_since: str,
                           recovered_detail: str) -> NotifyMessage:
    lines = [
        f"{spec.name} recovered and is healthy again.",
        "",
        f"Service : {spec.name} ({spec.id})",
        f"Was down: {down_since}",
        f"Now     : {recovered_detail}",
        f"Status  : {base_url}/api/status",
    ]
    return NotifyMessage(
        subject=f"RECOVERED: {spec.name} [{spec.group}]",
        text="\n".join(lines), level="recovery",
        context={"service_id": spec.id, "group": spec.group},
    )


def build_autofix_recovery_message(spec: ServiceSpec, fix_ok_detail: str,
                                   recheck_detail: str, base_url: str) -> NotifyMessage:
    lines = [
        f"{spec.name} went DOWN; the easy-button playbook ran automatically and fixed it.",
        "",
        f"Service  : {spec.name} ({spec.id})",
        f"Auto-fix : {fix_ok_detail}",
        f"Re-check : {recheck_detail}",
        f"Dashboard: {base_url}/api/status",
    ]
    return NotifyMessage(
        subject=f"AUTO-FIXED: {spec.name} [{spec.group}]",
        text="\n".join(lines), level="recovery",
        context={"service_id": spec.id, "group": spec.group},
    )


# --------------------------------------------------------------------------- #
# Notifiers
# --------------------------------------------------------------------------- #

class BaseNotifier:
    name = "base"

    async def send(self, message: NotifyMessage) -> str:  # pragma: no cover - interface
        raise NotImplementedError


class ConsoleNotifier(BaseNotifier):
    name = "console"

    async def send(self, message: NotifyMessage) -> str:
        icon = _LEVEL_ICON.get(message.level, "•")
        first = message.text.splitlines()[0] if message.text else ""
        print(f"[mission-control {utcnow()}] {icon} {message.subject} — {first}", flush=True)
        return "ok"


class FileNotifier(BaseNotifier):
    """Append-only JSONL alert log — always available, survives restarts."""

    name = "file"

    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    async def send(self, message: NotifyMessage) -> str:
        record = {"ts": utcnow(), **message.to_dict()}
        await asyncio.to_thread(self._append, record)
        return "ok"

    def _append(self, record: Dict[str, Any]) -> None:
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")


class WebhookNotifier(BaseNotifier):
    """Generic JSON webhook; auto-adapts the payload for Discord webhooks."""

    name = "webhook"

    def __init__(self, url: str, headers: Optional[Dict[str, str]] = None,
                 timeout_s: float = 10.0, transport: Optional[httpx.AsyncBaseTransport] = None):
        self.url = url
        self.headers = headers or {}
        self.timeout_s = timeout_s
        self._transport = transport

    def _payload(self, message: NotifyMessage) -> Dict[str, Any]:
        if "discord.com/api/webhooks" in self.url:
            icon = _LEVEL_ICON.get(message.level, "•")
            body = message.text[:1800]
            return {"content": f"{icon} **{message.subject}**\n```\n{body}\n```"}
        color = {"down": "danger", "recovery": "good", "test": "#439FE0"}.get(message.level, "warning")
        return {"text": f"{message.subject}\n{message.text}", "subject": message.subject,
                "level": message.level, "attachments": [{"color": color, "text": message.text}]}

    async def send(self, message: NotifyMessage) -> str:
        kwargs: Dict[str, Any] = {"timeout": self.timeout_s}
        if self._transport is not None:
            kwargs["transport"] = self._transport
        async with httpx.AsyncClient(**kwargs) as client:
            response = await client.post(self.url, json=self._payload(message), headers=self.headers)
        if response.status_code >= 300:
            return f"HTTP {response.status_code}"
        return "ok"


class SMTPNotifier(BaseNotifier):
    name = "smtp"

    def __init__(self, host: str, port: int = 587, username: str = "", password: str = "",
                 sender: str = "", recipients: Optional[List[str]] = None, starttls: bool = True,
                 send_fn: Optional[Callable[[EmailMessage], None]] = None):
        self.host = host
        self.port = int(port)
        self.username = username
        self.password = password
        self.sender = sender or username or "mission-control@localhost"
        self.recipients = recipients or []
        self.starttls = starttls
        self._send_fn = send_fn

    def _deliver(self, email: EmailMessage) -> None:
        if self._send_fn is not None:
            self._send_fn(email)
            return
        with smtplib.SMTP(self.host, self.port, timeout=15) as smtp:
            if self.starttls:
                smtp.starttls()
            if self.username:
                smtp.login(self.username, self.password)
            smtp.send_message(email)

    async def send(self, message: NotifyMessage) -> str:
        if not self.recipients:
            return "no recipients configured"
        email = EmailMessage()
        email["From"] = self.sender
        email["To"] = ", ".join(self.recipients)
        email["Subject"] = f"[MissionControl] {message.subject}"
        email.set_content(message.text)
        await asyncio.to_thread(self._deliver, email)
        return "ok"


class WindowsToastNotifier(BaseNotifier):
    """Best-effort Windows desktop toast (BurntToast or msg.exe fallback)."""

    name = "windows-toast"

    @staticmethod
    def _ps_escape(text: str) -> str:
        return text.replace("'", "''").replace("\r", " ").replace("\n", " ")[:240]

    async def send(self, message: NotifyMessage) -> str:
        if sys.platform != "win32":
            return "skipped (not on Windows)"
        title = self._ps_escape(message.subject)
        body = self._ps_escape(message.text.splitlines()[0] if message.text else "")
        script = (
            "if (Get-Module -ListAvailable -Name BurntToast) {"
            f" Import-Module BurntToast; New-BurntToastNotification -Text '{title}', '{body}'"
            " } else {"
            f" & msg.exe $env:USERNAME /TIME:20 '{title} — {body}'"
            " }"
        )
        try:
            proc = await asyncio.create_subprocess_exec(
                "powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", script,
                stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
            )
            await asyncio.wait_for(proc.wait(), timeout=15)
        except (FileNotFoundError, asyncio.TimeoutError) as exc:
            return f"toast failed: {exc}"
        return "ok"


class NotifierHub:
    """Fan-out with per-notifier isolation — one broken channel never hides an alert."""

    def __init__(self, notifiers: Optional[List[BaseNotifier]] = None):
        self.notifiers: List[BaseNotifier] = notifiers or []

    async def broadcast(self, message: NotifyMessage) -> Dict[str, str]:
        report: Dict[str, str] = {}
        for notifier in self.notifiers:
            try:
                report[notifier.name] = await notifier.send(message)
            except Exception as exc:  # noqa: BLE001
                report[notifier.name] = f"{type(exc).__name__}: {exc}"
        return report


def build_hub(notifier_specs: List[Dict[str, Any]], resolve_path: Optional[Callable[[str], Path]] = None) -> NotifierHub:
    """Instantiate enabled notifiers from config dicts."""
    notifiers: List[BaseNotifier] = []
    for raw in notifier_specs:
        if not raw or raw.get("enabled", True) in (False, "false"):
            continue
        kind = str(raw.get("type", "")).lower()
        if kind == "console":
            notifiers.append(ConsoleNotifier())
        elif kind == "file":
            path = raw.get("path", "logs/mission-control-alerts.jsonl")
            if resolve_path is not None:
                path = resolve_path(path)
            notifiers.append(FileNotifier(path))
        elif kind == "webhook" and raw.get("url"):
            notifiers.append(WebhookNotifier(
                url=str(raw["url"]),
                headers=dict(raw.get("headers") or {}),
                timeout_s=float(raw.get("timeout_s", 10.0)),
            ))
        elif kind == "smtp":
            notifiers.append(SMTPNotifier(
                host=str(raw.get("host", "localhost")),
                port=int(raw.get("port", 587)),
                username=str(raw.get("username", "")),
                password=str(raw.get("password", "")),
                sender=str(raw.get("sender", "")),
                recipients=list(raw.get("recipients") or []),
                starttls=bool(raw.get("starttls", True)),
            ))
        elif kind in ("windows-toast", "toast", "windows_toast"):
            notifiers.append(WindowsToastNotifier())
    return NotifierHub(notifiers)
