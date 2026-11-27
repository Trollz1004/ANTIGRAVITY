"""Manifest-driven environment setting name & agent drift helpers.

Strictly inspects ONLY in-memory environment variable keys (never reads any `.env` file)
and NEVER returns or logs environment variable values.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Mapping, Optional, Tuple, Union

_DEFAULT_LOGGER = logging.getLogger("env-required")


def _resolve_manifest_path(manifest_path_or_dir: Union[str, Path]) -> Path:
    candidate = Path(manifest_path_or_dir)
    if candidate.is_dir():
        return candidate / "env.required.json"
    return candidate


def load_env_required(manifest_path: Union[str, Path]) -> Dict[str, Any]:
    """Load and parse an `env.required.json` manifest (file path or parent directory)."""
    resolved = _resolve_manifest_path(manifest_path)
    raw = resolved.read_text(encoding="utf-8-sig")
    parsed = json.loads(raw)
    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object in {resolved}")
    return parsed


def _is_env_set(source: Mapping[str, Any], name: str) -> bool:
    val = source.get(name)
    if val is None:
        return False
    return bool(str(val).strip())


def _clean_names(raw: Any) -> List[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        cleaned = raw.strip()
        return [cleaned] if cleaned else []
    if not isinstance(raw, (list, tuple)):
        return []
    out: List[str] = []
    for item in raw:
        name = str(item).strip()
        if name and name not in out:
            out.append(name)
    return out


def _normalize_alternatives(raw_alternatives: Any) -> Tuple[Dict[str, List[str]], List[List[str]]]:
    by_key: Dict[str, List[str]] = {}
    groups: List[List[str]] = []

    if isinstance(raw_alternatives, Mapping):
        for k, v in raw_alternatives.items():
            key_name = str(k).strip()
            alts = _clean_names(v)
            if key_name and alts:
                by_key[key_name] = alts
        return by_key, groups

    if isinstance(raw_alternatives, (list, tuple)):
        if raw_alternatives and all(isinstance(item, str) for item in raw_alternatives):
            group = _clean_names(raw_alternatives)
            if group:
                groups.append(group)
            return by_key, groups

        for item in raw_alternatives:
            if isinstance(item, (list, tuple)):
                group = _clean_names(item)
                if group:
                    groups.append(group)
            elif isinstance(item, Mapping):
                primary = str(item.get("required") or "").strip()
                alts = _clean_names(item.get("alternatives"))
                if primary and alts:
                    by_key[primary] = alts
                    continue
                group = _clean_names(item.get("keys") or item.get("anyOf") or item.get("group"))
                if group:
                    groups.append(group)

    return by_key, groups


def check_required_env(
    manifest_path_or_dir: Union[str, Path],
    env: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    """Check `os.environ` (or `env`) for required setting names without exposing any values."""
    manifest = load_env_required(manifest_path_or_dir)
    source: Mapping[str, Any] = env if env is not None else os.environ

    service = str(manifest.get("service") or "").strip()
    env_file = str(manifest.get("envFile") or ".env").strip() or ".env"
    required = _clean_names(manifest.get("required"))
    alt_map, alt_groups = _normalize_alternatives(manifest.get("alternatives"))

    missing_env: List[str] = []
    covered_required = set(required)

    for name in required:
        candidates = [name]
        for alt in alt_map.get(name, []):
            if alt not in candidates:
                candidates.append(alt)
        for group in alt_groups:
            if name in group:
                for alt in group:
                    if alt not in candidates:
                        candidates.append(alt)

        if not any(_is_env_set(source, cand) for cand in candidates):
            missing_env.append(name)

    for key_name, alts in alt_map.items():
        if key_name in covered_required:
            continue
        candidates = [key_name, *alts] if key_name.isupper() else list(alts)
        if not any(_is_env_set(source, cand) for cand in candidates):
            label = key_name if (key_name.isupper() and len(alts) == 0) else " | ".join(alts)
            if label and label not in missing_env:
                missing_env.append(label)

    for group in alt_groups:
        if any(item in covered_required for item in group):
            continue
        if not any(_is_env_set(source, cand) for cand in group):
            label = " | ".join(group)
            if label and label not in missing_env:
                missing_env.append(label)

    return {
        "service": service,
        "envFile": env_file,
        "required": required,
        "missingEnv": missing_env,
        "ok": len(missing_env) == 0,
    }


def log_startup_env_check(
    manifest_path_or_dir: Union[str, Path],
    env: Optional[Mapping[str, Any]] = None,
    logger_fn: Optional[Callable[[str], Any]] = None,
) -> Dict[str, Any]:
    """Log a warning listing ONLY missing env setting names (never values)."""
    result = check_required_env(manifest_path_or_dir, env=env)
    missing = result["missingEnv"]
    if missing:
        emit = logger_fn if logger_fn is not None else _DEFAULT_LOGGER.warning
        service_prefix = f"{result['service']} " if result["service"] else ""
        names = ", ".join(missing)
        emit(
            f"WARNING: {service_prefix}missing required env settings: {names} "
            f"(names only; expected in {result['envFile']})."
        )
    return result


def _resolve_drift_path(
    drift_path: Optional[Union[str, Path]] = None,
    env: Optional[Mapping[str, Any]] = None,
) -> Path:
    if drift_path is not None and str(drift_path).strip():
        return Path(str(drift_path).strip())
    source: Mapping[str, Any] = env if env is not None else os.environ
    override = str(source.get("AGENT_DRIFT_PATH") or "").strip()
    if override:
        return Path(override)
    local_app_data = str(source.get("LOCALAPPDATA") or "").strip()
    if local_app_data:
        return Path(local_app_data) / "dream-boot" / "agent-drift.json"
    return Path.home() / "AppData" / "Local" / "dream-boot" / "agent-drift.json"


def read_agent_drift(
    drift_path: Optional[Union[str, Path]] = None,
    env: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    """Read `agent-drift.json` from `AGENT_DRIFT_PATH` or `%LOCALAPPDATA%\\dream-boot\\agent-drift.json`."""
    resolved = _resolve_drift_path(drift_path=drift_path, env=env)
    if not resolved.is_file():
        return {"present": False, "driftedFiles": [], "driftedCount": 0}

    try:
        raw = resolved.read_text(encoding="utf-8-sig")
        if not raw.strip():
            return {"present": True, "driftedFiles": [], "driftedCount": 0}
        parsed = json.loads(raw)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return {
            "present": True,
            "driftedFiles": [{"file": resolved.name, "reason": "unreadable"}],
            "driftedCount": 1,
        }

    items = parsed.get("driftedFiles") if isinstance(parsed, dict) else []
    drifted_files: List[Dict[str, str]] = []
    if isinstance(items, list):
        for entry in items:
            if isinstance(entry, str):
                file_name = entry.strip()
                if file_name:
                    drifted_files.append({"file": file_name, "reason": "drifted"})
            elif isinstance(entry, Mapping):
                file_name = str(entry.get("file") or entry.get("path") or "").strip()
                reason = str(entry.get("reason") or "drifted").strip() or "drifted"
                if file_name:
                    drifted_files.append({"file": file_name, "reason": reason})

    return {
        "present": True,
        "driftedFiles": drifted_files,
        "driftedCount": len(drifted_files),
    }
