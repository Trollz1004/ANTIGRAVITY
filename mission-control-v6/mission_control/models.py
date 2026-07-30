"""Core data model for Mission Control v6.

Plain dataclasses on purpose: the monitor stays dependency-light and every
object serialises to JSON with ``dataclasses.asdict``.
"""

from __future__ import annotations

import enum
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def utcnow() -> str:
    """ISO-8601 UTC timestamp used everywhere (second precision)."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ServiceState(str, enum.Enum):
    """Runtime state of a monitored service."""

    UNKNOWN = "unknown"    # never checked yet
    UP = "up"              # healthy
    DEGRADED = "degraded"  # answering but slower than its latency budget
    DOWN = "down"          # failing past its failure threshold
    FIXING = "fixing"      # an easy-button run is in flight


class CheckKind(str, enum.Enum):
    """Supported probe types."""

    HTTP = "http"          # GET a URL, status code decides health
    TCP = "tcp"            # raw connect to host:port
    PROCESS = "process"    # pgrep -f / tasklist match
    DOCKER = "docker"      # docker container is running
    COMMAND = "command"    # exit code of an allow-listed probe command


ALERT_ACTIVE = "active"
ALERT_ACKNOWLEDGED = "acknowledged"
ALERT_RESOLVED = "resolved"


@dataclass
class Playbook:
    """An allow-listed remediation recipe (the thing the FIX button runs).

    ``commands`` maps a platform key (``windows``/``linux``/``all``) to a list
    of argv lists run sequentially with ``subprocess.exec`` — never a shell
    string built from user input, so nothing unvetted can be executed.
    """

    id: str
    description: str
    commands: Dict[str, List[List[str]]] = field(default_factory=dict)
    timeout_s: float = 60.0
    cooldown_s: float = 60.0
    script: Optional[str] = None  # human script (fix-scripts/*.cmd) shipped for the notification

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ServiceSpec:
    """Static description of one monitored service."""

    id: str
    name: str
    group: str
    kind: CheckKind
    expected: bool = True  # only services that "shouldn't be down" page the operator
    url: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    process: Optional[str] = None
    container: Optional[str] = None
    command: Optional[List[str]] = None
    interval_s: float = 30.0
    timeout_s: float = 2.5
    fail_threshold: int = 2          # consecutive failures before DOWN + alert
    latency_warn_ms: Optional[float] = None  # over budget => DEGRADED (yellow)
    expected_status: Any = None      # None (200-399) | list[int] | "any"
    playbook: Optional[str] = None   # playbook id powering the fix button
    auto_fix: bool = False           # try the playbook automatically when DOWN
    notify: bool = True
    notify_cooldown_s: float = 900.0  # re-notify at most this often while DOWN
    link_url: Optional[str] = None   # browser link rendered on the dashboard

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["kind"] = self.kind.value
        return data


@dataclass
class CheckResult:
    """Outcome of one probe."""

    service_id: str
    ok: bool
    latency_ms: float
    detail: str
    ts: str = field(default_factory=utcnow)
    skipped: bool = False  # e.g. docker CLI absent — never counts as a failure

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Alert:
    """One DOWN episode. ``status`` walks active -> acknowledged -> resolved."""

    service_id: str
    status: str = ALERT_ACTIVE
    id: Optional[int] = None
    opened_at: Optional[str] = None
    resolved_at: Optional[str] = None
    detail: str = ""
    notify_count: int = 0
    last_notified_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class FixRun:
    """Audit record for one easy-button execution."""

    service_id: str
    playbook_id: str
    ok: bool
    id: Optional[int] = None
    ts: str = field(default_factory=utcnow)
    exit_code: int = 0
    duration_s: float = 0.0
    output: str = ""
    detail: str = ""
    requested_by: str = "manual"  # manual | auto | api

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Link:
    """A navigation chip on the dashboard (the "omni route" bar)."""

    id: str
    label: str
    url: str
    group: str = "nav"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def describe_target(spec: ServiceSpec) -> str:
    """Human one-liner describing what is being probed."""
    if spec.kind is CheckKind.HTTP:
        return spec.url or ""
    if spec.kind is CheckKind.TCP:
        return f"{spec.host}:{spec.port}"
    if spec.kind is CheckKind.PROCESS:
        return f"process '{spec.process}'"
    if spec.kind is CheckKind.DOCKER:
        return f"docker container '{spec.container}'"
    if spec.kind is CheckKind.COMMAND and spec.command:
        return " ".join(spec.command)
    return spec.id
