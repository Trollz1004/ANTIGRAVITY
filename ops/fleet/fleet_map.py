"""Shared Fleet Map reader for Python services and ops scripts."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DEFAULT_FLEET_MAP_PATH = Path(__file__).resolve().parent / "fleet-map.json"
_CACHED_DEFAULT_MAP: dict[str, Any] | None = None

SERVICE_ALIASES: dict[str, list[str]] = {
    "postgres": ["t5500-postgres"],
    "t5500-postgres": ["postgres"],
    "redis": ["t5500-redis"],
    "t5500-redis": ["redis"],
    "dateapp-frontend": ["date-app-web"],
    "date-app-web": ["dateapp-frontend"],
    "dateapp-api": ["date-app-api"],
    "date-app-api": ["dateapp-api"],
    "hermes-gateway": ["hermes-api"],
    "hermes-api": ["hermes-gateway"],
    "hermes-dashboard": ["t5500-hermes-dashboard"],
    "t5500-hermes-dashboard": ["hermes-dashboard"],
    "ollama-t5500": ["t5500-ollama"],
    "t5500-ollama": ["ollama-t5500"],
    "obsidian-t5500": ["t5500-obsidian-rest"],
    "t5500-obsidian-rest": ["obsidian-t5500"],
    "leadgen-desk": ["hermes-leadgen"],
    "hermes-leadgen": ["leadgen-desk"],
    "npc-lab": ["live-npc-lab"],
    "live-npc-lab": ["npc-lab"],
    "ollama-alienware": ["alienware-ollama"],
    "alienware-ollama": ["ollama-alienware"],
    "obsidian-alienware": ["alienware-obsidian-rest", "obsidian-rest"],
    "alienware-obsidian-rest": ["obsidian-alienware", "obsidian-rest"],
    "obsidian-rest": ["obsidian-alienware", "alienware-obsidian-rest"],
}


def is_machine_local_scope(scope: Any) -> bool:
    normalized = str(scope or "").strip().lower()
    return normalized in ("this machine only", "local-only")


def get_service_token_env(svc: dict[str, Any]) -> str | None:
    if not isinstance(svc, dict):
        return None
    tok = svc.get("tokenEnv")
    if tok is not None and str(tok).strip():
        return str(tok).strip()
    auth_tok = svc.get("authTokenEnv")
    if auth_tok is not None and str(auth_tok).strip():
        return str(auth_tok).strip()
    return None


def _normalize_node_entry(node: dict[str, Any], fallback_id: str = "") -> dict[str, Any]:
    nid = str(node.get("id") or fallback_id or "").strip()
    ip = str(node.get("ip") or node.get("host") or "").strip()
    host = str(node.get("host") or node.get("ip") or "").strip()
    return {**node, "id": nid, "ip": ip, "host": host}


def _normalize_service_entry(svc: dict[str, Any], fallback_id: str = "") -> dict[str, Any]:
    sid = str(svc.get("id") or fallback_id or "").strip()
    token_env = get_service_token_env(svc)
    raw_auth_tok = svc.get("authTokenEnv")
    auth_token_env = str(raw_auth_tok) if raw_auth_tok is not None else (token_env or "")
    local_only = is_machine_local_scope(svc.get("scope"))
    host = str(svc.get("host") or ("127.0.0.1" if local_only else "")).strip()
    bind = "127.0.0.1" if local_only else str(svc.get("bind") or "0.0.0.0").strip()
    return {
        **svc,
        "id": sid,
        "host": host,
        "bind": bind,
        "tokenEnv": token_env,
        "authTokenEnv": auth_token_env,
    }


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
    raw_nodes = fmap.get("nodes")
    found: dict[str, Any] | None = None
    if isinstance(raw_nodes, list):
        for n in raw_nodes:
            if isinstance(n, dict) and str(n.get("id") or "").strip().lower() == key:
                found = _normalize_node_entry(n, key)
                break
    elif isinstance(raw_nodes, dict):
        if key in raw_nodes and isinstance(raw_nodes[key], dict):
            found = _normalize_node_entry(raw_nodes[key], key)
        else:
            for k, v in raw_nodes.items():
                if isinstance(v, dict) and (
                    str(k).lower() == key or str(v.get("id") or "").strip().lower() == key
                ):
                    found = _normalize_node_entry(v, str(k))
                    break
    if not found:
        raise KeyError(f"Unknown fleet node: {node_id!r}")
    return found


def get_node_ip(node_id: str, fleet_map: dict[str, Any] | None = None) -> str:
    return str(get_node(node_id, fleet_map)["ip"])


def list_all_services(fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    raw_services = fmap.get("services")
    if isinstance(raw_services, list):
        return [
            _normalize_service_entry(svc, f"service-{idx}")
            for idx, svc in enumerate(raw_services)
            if isinstance(svc, dict)
        ]
    if isinstance(raw_services, dict):
        return [
            _normalize_service_entry(svc, str(svc_id))
            for svc_id, svc in raw_services.items()
            if isinstance(svc, dict)
        ]
    return []


def get_service(service_id: str, fleet_map: dict[str, Any] | None = None) -> dict[str, Any]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(service_id or "").strip().lower()
    all_services = list_all_services(fmap)
    candidates = [key, *SERVICE_ALIASES.get(key, [])]
    for candidate in candidates:
        for svc in all_services:
            if svc["id"].lower() == candidate:
                return svc
    raw_services = fmap.get("services")
    if isinstance(raw_services, dict):
        for candidate in candidates:
            if candidate in raw_services and isinstance(raw_services[candidate], dict):
                return _normalize_service_entry(raw_services[candidate], candidate)
    raise KeyError(f"Unknown fleet service: {service_id!r}")


def get_service_url(
    service_id: str,
    path_suffix: str = "",
    fleet_map: dict[str, Any] | None = None,
) -> str:
    svc = get_service(service_id, fleet_map)
    protocol = svc.get("protocol", "http")
    scheme = protocol if protocol in ("http", "https", "ws", "wss") else "http"
    host = "127.0.0.1" if is_machine_local_scope(svc.get("scope")) else svc["host"]
    base = str(svc.get("url") or f"{scheme}://{host}:{svc['port']}").rstrip("/")
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
    svc = get_service(service_id, fleet_map)
    if is_machine_local_scope(svc.get("scope")):
        return "127.0.0.1"
    return str(svc["bind"])


def list_services_by_node(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(node_id or "").strip().lower()
    get_node(key, fmap)
    return [svc for svc in list_all_services(fmap) if str(svc.get("node") or "").strip().lower() == key]
