"""Shared Fleet Map reader for Python services and ops scripts."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DEFAULT_FLEET_MAP_PATH = Path(__file__).resolve().parent / "fleet-map.json"
_CACHED_DEFAULT_MAP: dict[str, Any] | None = None


def load_fleet_map(map_path: str | Path | None = None) -> dict[str, Any]:
    global _CACHED_DEFAULT_MAP
    target = Path(map_path).resolve() if map_path is not None else DEFAULT_FLEET_MAP_PATH
    if target == DEFAULT_FLEET_MAP_PATH and _CACHED_DEFAULT_MAP is not None:
        return _CACHED_DEFAULT_MAP
    raw = target.read_text(encoding="utf-8-sig")
    parsed = json.loads(raw)
    if not isinstance(parsed, dict) or "nodes" not in parsed or "services" not in parsed:
        raise ValueError(f"Invalid fleet map structure in {target}")
    if target == DEFAULT_FLEET_MAP_PATH:
        _CACHED_DEFAULT_MAP = parsed
    return parsed


def get_node(node_id: str, fleet_map: dict[str, Any] | None = None) -> dict[str, Any]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(node_id or "").strip().lower()
    node = fmap.get("nodes", {}).get(key)
    if not node:
        raise KeyError(f"Unknown fleet node: {node_id!r}")
    return node


def get_node_ip(node_id: str, fleet_map: dict[str, Any] | None = None) -> str:
    return str(get_node(node_id, fleet_map)["ip"])


def get_service(service_id: str, fleet_map: dict[str, Any] | None = None) -> dict[str, Any]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(service_id or "").strip().lower()
    svc = fmap.get("services", {}).get(key)
    if not svc:
        raise KeyError(f"Unknown fleet service: {service_id!r}")
    return svc


def get_service_url(
    service_id: str,
    path_suffix: str = "",
    fleet_map: dict[str, Any] | None = None,
) -> str:
    svc = get_service(service_id, fleet_map)
    protocol = svc.get("protocol", "http")
    scheme = protocol if protocol in ("http", "https", "ws", "wss") else "http"
    base = str(svc.get("url") or f"{scheme}://{svc['host']}:{svc['port']}").rstrip("/")
    if not path_suffix:
        return base
    suffix = str(path_suffix) if str(path_suffix).startswith("/") else f"/{path_suffix}"
    return f"{base}{suffix}"


def get_bind_host(
    service_id: str,
    env_override: str | None = None,
    fleet_map: dict[str, Any] | None = None,
) -> str:
    if env_override and str(env_override).strip():
        return str(env_override).strip()
    return str(get_service(service_id, fleet_map)["bind"])


def list_services_by_node(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(node_id or "").strip().lower()
    get_node(key, fmap)
    return [svc for svc in fmap.get("services", {}).values() if svc.get("node") == key]
