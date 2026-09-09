"""Configuration loading & validation for Mission Control v6.

Config source order:
    1. ``MC_CONFIG`` env var / ``--config`` flag (explicit JSON file)
    2. ``config/mission-control.config.json`` next to this package (defaults = the
       real ANTIGRAVITY stack)

The JSON supports ``${VAR}`` / ``${VAR:-default}`` env expansion, plus the
``{repo_root}`` and ``{mc_home}`` placeholders inside strings (useful for the
fix playbooks which live in the repository).
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import CheckKind, Link, Playbook, ServiceSpec

MC_HOME = Path(__file__).resolve().parent.parent          # mission-control-v6/
REPO_ROOT = MC_HOME.parent                                # ANTIGRAVITY/
DEFAULT_CONFIG_PATH = MC_HOME / "config" / "mission-control.config.json"

_ENV_EXPR = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}")


class ConfigError(ValueError):
    """Raised when the mission-control configuration is invalid."""


def _expand_env(text: str, env: Optional[Dict[str, str]] = None) -> str:
    """Expand ${VAR} and ${VAR:-default} occurrences using *env* (default os.environ)."""
    env = os.environ if env is None else env

    def _sub(match: "re.Match[str]") -> str:
        name, default = match.group(1), match.group(2)
        value = env.get(name)
        if value is None or value == "":
            if default is None:
                raise ConfigError(f"environment variable {name} is required by the config but not set")
            return default
        return value

    return _ENV_EXPR.sub(_sub, text)


def _expand_placeholders(value: Any, repo_root: Path, mc_home: Path) -> Any:
    """Recursively substitute {repo_root}/{mc_home} placeholders in strings."""
    if isinstance(value, str):
        return value.replace("{repo_root}", str(repo_root)).replace("{mc_home}", str(mc_home))
    if isinstance(value, list):
        return [_expand_placeholders(v, repo_root, mc_home) for v in value]
    if isinstance(value, dict):
        return {k: _expand_placeholders(v, repo_root, mc_home) for k, v in value.items()}
    return value


@dataclass
class ServerConfig:
    host: str = "127.0.0.1"
    port: int = 8787
    api_token: str = ""                 # empty = no auth (loopback only!)
    state_db: str = "state/mission-control.db"
    base_url: str = ""                  # public URL used inside notifications
    monitor_enabled: bool = True
    startup_grace_s: float = 45.0       # boot grace before DOWN pages fire

    def resolved_base_url(self) -> str:
        if self.base_url:
            return self.base_url.rstrip("/")
        host = "127.0.0.1" if self.host in ("0.0.0.0", "::") else self.host
        return f"http://{host}:{self.port}"


@dataclass
class Config:
    server: ServerConfig
    services: List[ServiceSpec] = field(default_factory=list)
    playbooks: Dict[str, Playbook] = field(default_factory=dict)
    links: List[Link] = field(default_factory=list)
    notifiers: List[Dict[str, Any]] = field(default_factory=list)
    source_path: Optional[str] = None

    def service(self, service_id: str) -> Optional[ServiceSpec]:
        return next((s for s in self.services if s.id == service_id), None)

    def state_db_abs(self) -> Path:
        path = Path(self.server.state_db)
        return path if path.is_absolute() else (MC_HOME / path)

    def notifier_path_abs(self, raw: str) -> Path:
        path = Path(raw)
        return path if path.is_absolute() else (MC_HOME / path)


def _build_service(raw: Dict[str, Any]) -> ServiceSpec:
    try:
        kind = CheckKind(str(raw.get("kind", "")).lower())
    except ValueError as exc:
        raise ConfigError(f"service {raw.get('id')!r}: unknown check kind {raw.get('kind')!r}") from exc

    spec = ServiceSpec(
        id=str(raw["id"]),
        name=str(raw.get("name", raw["id"])),
        group=str(raw.get("group", "General")),
        kind=kind,
        expected=bool(raw.get("expected", True)),
        url=raw.get("url"),
        host=raw.get("host"),
        port=(int(raw["port"]) if raw.get("port") is not None else None),
        process=raw.get("process"),
        container=raw.get("container"),
        command=(list(raw["command"]) if raw.get("command") else None),
        interval_s=float(raw.get("interval_s", 30.0)),
        timeout_s=float(raw.get("timeout_s", 2.5)),
        fail_threshold=int(raw.get("fail_threshold", 2)),
        latency_warn_ms=(float(raw["latency_warn_ms"]) if raw.get("latency_warn_ms") is not None else None),
        expected_status=raw.get("expected_status"),
        playbook=raw.get("playbook"),
        auto_fix=bool(raw.get("auto_fix", False)),
        notify=bool(raw.get("notify", True)),
        notify_cooldown_s=float(raw.get("notify_cooldown_s", 900.0)),
        link_url=raw.get("link_url"),
    )
    _validate_service(spec)
    return spec


def _validate_service(spec: ServiceSpec) -> None:
    if spec.interval_s <= 0:
        raise ConfigError(f"service {spec.id!r}: interval_s must be > 0")
    if spec.fail_threshold < 1:
        raise ConfigError(f"service {spec.id!r}: fail_threshold must be >= 1")
    if spec.kind is CheckKind.HTTP and not spec.url:
        raise ConfigError(f"service {spec.id!r}: http check requires 'url'")
    if spec.kind is CheckKind.TCP and (not spec.host or spec.port is None):
        raise ConfigError(f"service {spec.id!r}: tcp check requires 'host' and 'port'")
    if spec.kind is CheckKind.PROCESS and not spec.process:
        raise ConfigError(f"service {spec.id!r}: process check requires 'process'")
    if spec.kind is CheckKind.DOCKER and not spec.container:
        raise ConfigError(f"service {spec.id!r}: docker check requires 'container'")
    if spec.kind is CheckKind.COMMAND and not spec.command:
        raise ConfigError(f"service {spec.id!r}: command check requires 'command'")
    allowed = spec.expected_status
    if allowed is not None:
        if isinstance(allowed, str):
            if allowed != "any":
                raise ConfigError(f"service {spec.id!r}: expected_status string must be 'any'")
        elif not (isinstance(allowed, list) and all(isinstance(c, int) for c in allowed)):
            raise ConfigError(f"service {spec.id!r}: expected_status must be a list of int codes or 'any'")


def _build_playbooks(raw_map: Dict[str, Any], repo_root: Path, mc_home: Path) -> Dict[str, Playbook]:
    playbooks: Dict[str, Playbook] = {}
    for pb_id, raw in raw_map.items():
        commands_raw = raw.get("commands", {})
        commands: Dict[str, List[List[str]]] = {}
        for platform, cmd_list in commands_raw.items():
            expanded: List[List[str]] = []
            for argv in cmd_list:
                if not isinstance(argv, list) or not argv:
                    raise ConfigError(f"playbook {pb_id!r}: every command must be a non-empty argv list")
                expanded.append([
                    str(_expand_placeholders(part, repo_root, mc_home)) for part in argv
                ])
            commands[str(platform)] = expanded
        playbooks[pb_id] = Playbook(
            id=pb_id,
            description=str(raw.get("description", pb_id)),
            commands=commands,
            timeout_s=float(raw.get("timeout_s", 60.0)),
            cooldown_s=float(raw.get("cooldown_s", 60.0)),
            script=(str(raw["script"]) if raw.get("script") else None),
        )
    return playbooks


def build_config(raw: Dict[str, Any], *, source_path: Optional[str] = None) -> Config:
    """Validate a raw config dict and turn it into a ``Config`` object."""
    server_raw = dict(raw.get("server") or {})
    server = ServerConfig(
        host=str(server_raw.get("host", "127.0.0.1")),
        port=int(server_raw.get("port", 8787)),
        api_token=str(server_raw.get("api_token", "") or ""),
        state_db=str(server_raw.get("state_db", "state/mission-control.db")),
        base_url=str(server_raw.get("base_url", "") or ""),
        monitor_enabled=bool(server_raw.get("monitor_enabled", True)),
        startup_grace_s=float(server_raw.get("startup_grace_s", 45.0)),
    )

    services = [_build_service(s) for s in raw.get("services", [])]
    ids = [s.id for s in services]
    if len(ids) != len(set(ids)):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        raise ConfigError(f"duplicate service ids: {', '.join(dupes)}")

    playbooks = _build_playbooks(raw.get("playbooks", {}), REPO_ROOT, MC_HOME)
    for spec in services:
        if spec.playbook and spec.playbook not in playbooks:
            raise ConfigError(f"service {spec.id!r}: unknown playbook {spec.playbook!r}")
        if spec.auto_fix and not spec.playbook:
            raise ConfigError(f"service {spec.id!r}: auto_fix requires a playbook")

    links = [
        Link(
            id=str(l["id"]),
            label=str(l.get("label", l["id"])),
            url=str(_expand_placeholders(l["url"], REPO_ROOT, MC_HOME)),
            group=str(l.get("group", "nav")),
        )
        for l in raw.get("links", [])
    ]

    notifiers = list(raw.get("notifiers", []) or [])
    return Config(
        server=server,
        services=services,
        playbooks=playbooks,
        links=links,
        notifiers=notifiers,
        source_path=source_path,
    )


def load_config(path: Optional[str] = None, *, env: Optional[Dict[str, str]] = None) -> Config:
    """Load config from *path* (JSON) with env expansion, falling back to defaults."""
    candidate = Path(path) if path else Path(os.environ.get("MC_CONFIG", "")).expanduser() if os.environ.get("MC_CONFIG") else DEFAULT_CONFIG_PATH
    if not candidate.exists():
        raise ConfigError(f"config file not found: {candidate}")
    text = _expand_env(candidate.read_text(encoding="utf-8"), env)
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ConfigError(f"config {candidate} is not valid JSON: {exc}") from exc
    return build_config(raw, source_path=str(candidate))
