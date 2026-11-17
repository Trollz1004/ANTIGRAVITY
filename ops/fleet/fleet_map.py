"""Shared Fleet Map reader for Python services and ops scripts."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DEFAULT_FLEET_MAP_PATH = Path(__file__).resolve().parent / "fleet-map.json"
_CACHED_DEFAULT_MAP: dict[str, Any] | None = None

SERVICE_ALIASES: dict[str, list[str]] = {
    "lead-gen": ["hermes-leadgen"],
    "leadgen": ["hermes-leadgen"],
    "opsis-cut-and-reach-studio": ["opsis-studio"],
    "ollama": ["alienware-ollama"],
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


def get_spine_path(fleet_map: dict[str, Any] | None = None) -> str:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    spine = str(fmap.get("spine") or "").strip()
    if not spine:
        raise KeyError('Missing "spine" path in fleet-map.json')
    return spine


def get_node_host(node_id: str, fleet_map: dict[str, Any] | None = None) -> str:
    return str(get_node(node_id, fleet_map)["host"])


def get_node_repos(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[str]:
    node = get_node(node_id, fleet_map)
    repos = node.get("repos")
    return list(repos) if isinstance(repos, list) else []


def get_node_harnesses(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[str]:
    node = get_node(node_id, fleet_map)
    harnesses = node.get("harnesses")
    return list(harnesses) if isinstance(harnesses, list) else []


def get_allowed_node_hosts(fleet_map: dict[str, Any] | None = None) -> list[str]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    raw_nodes = fmap.get("nodes")
    items: list[Any]
    if isinstance(raw_nodes, list):
        items = raw_nodes
    elif isinstance(raw_nodes, dict):
        items = list(raw_nodes.values())
    else:
        items = []
    hosts: list[str] = []
    seen: set[str] = set()
    for node in items:
        if not isinstance(node, dict):
            continue
        val = str(node.get("host") or node.get("ip") or "").strip()
        if val and val not in seen:
            seen.add(val)
            hosts.append(val)
    return hosts


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


def get_service(
    service_id: str | int,
    node_id_or_map: str | dict[str, Any] | None = None,
    fleet_map: dict[str, Any] | None = None,
) -> dict[str, Any]:
    node_id: str | None = None
    fmap: dict[str, Any]
    if isinstance(node_id_or_map, str):
        node_id = node_id_or_map
        fmap = fleet_map if fleet_map is not None else load_fleet_map()
    elif isinstance(node_id_or_map, dict):
        fmap = node_id_or_map
    else:
        fmap = fleet_map if fleet_map is not None else load_fleet_map()

    normalized_node = str(node_id).strip().lower() if node_id else None
    all_services = list_all_services(fmap)

    raw_text = str(service_id or "").strip()
    if isinstance(service_id, int) or raw_text.isdigit():
        port_num = int(raw_text)
        for svc in all_services:
            if int(svc.get("port") or 0) == port_num and (
                not normalized_node or str(svc.get("node") or "").strip().lower() == normalized_node
            ):
                return svc
        raise KeyError(f"Unknown fleet service on port: {port_num!r}")

    key = raw_text.lower()
    candidates = [key, *SERVICE_ALIASES.get(key, [])]
    for candidate in candidates:
        for svc in all_services:
            if svc["id"].lower() == candidate and (
                not normalized_node or str(svc.get("node") or "").strip().lower() == normalized_node
            ):
                return svc
    raw_services = fmap.get("services")
    if isinstance(raw_services, dict):
        for candidate in candidates:
            if candidate in raw_services and isinstance(raw_services[candidate], dict):
                direct = raw_services[candidate]
                if not normalized_node or str(direct.get("node") or "").strip().lower() == normalized_node:
                    return _normalize_service_entry(direct, candidate)
    raise KeyError(f"Unknown fleet service: {service_id!r}")


def get_service_url(
    service_id: str | int,
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


def get_service_health_url(
    service_id: str | int,
    fleet_map: dict[str, Any] | None = None,
) -> str:
    svc = get_service(service_id, fleet_map)
    health_path = str(svc.get("healthPath") or "/health")
    return get_service_url(svc["id"], health_path, fleet_map)


def get_bind_host(
    service_id: str | int,
    env_override: str | None = None,
    fleet_map: dict[str, Any] | None = None,
) -> str:
    if env_override and str(env_override).strip():
        return str(env_override).strip()
    svc = get_service(service_id, fleet_map)
    if is_machine_local_scope(svc.get("scope")):
        return "127.0.0.1"
    return str(svc["bind"])


def get_service_bind_host(
    service_id: str | int,
    env_override: str | None = None,
    fleet_map: dict[str, Any] | None = None,
) -> str:
    return get_bind_host(service_id, env_override, fleet_map)


def get_service_port(
    service_id: str | int,
    env_port_value: str | int | None = None,
    fleet_map: dict[str, Any] | None = None,
) -> int:
    if env_port_value is not None and str(env_port_value).strip().isdigit():
        val = int(str(env_port_value).strip())
        if val > 0:
            return val
    return int(get_service(service_id, fleet_map)["port"])


def list_services_by_node(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(node_id or "").strip().lower()
    get_node(key, fmap)
    return [svc for svc in list_all_services(fmap) if str(svc.get("node") or "").strip().lower() == key]


def get_services_by_node(node_id: str, fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    return list_services_by_node(node_id, fleet_map)


def get_services_by_scope(scope: str, fleet_map: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    fmap = fleet_map if fleet_map is not None else load_fleet_map()
    key = str(scope or "").strip().lower()
    return [svc for svc in list_all_services(fmap) if str(svc.get("scope") or "").strip().lower() == key]
