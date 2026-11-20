"""In-memory Stage E4 env-name and agent-drift helpers for dateapp-backend."""

import importlib.util
import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable, Dict, List, Mapping, Optional

BACKEND_DIR = Path(__file__).resolve().parents[1]
_LOGGER = logging.getLogger(__name__)


def _find_ops_env_required_path() -> Optional[Path]:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "ops" / "agents" / "env_required.py"
        if candidate.is_file():
            return candidate
    return None


@lru_cache(maxsize=1)
def _load_ops_env_required() -> Any:
    path = _find_ops_env_required_path()
    if path is None:
        return None
    spec = importlib.util.spec_from_file_location("_ops_agents_env_required", str(path))
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _fallback_check_required_env(
    manifest_dir: Path,
    env: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    manifest_file = manifest_dir / "env.required.json"
    if not manifest_file.is_file():
        return {"service": "dateapp-backend", "missingEnv": [], "ok": True}
    manifest = json.loads(manifest_file.read_text(encoding="utf-8-sig"))
    source: Mapping[str, Any] = env if env is not None else os.environ
    alts = manifest.get("alternatives") or {}
    missing: List[str] = []
    for key in manifest.get("required") or []:
        candidates = [key, *(alts.get(key) or [])]
        if not any(str(source.get(c) or "").strip() for c in candidates):
            missing.append(key)
    return {
        "service": str(manifest.get("service") or "dateapp-backend"),
        "envFile": str(manifest.get("envFile") or ".env"),
        "missingEnv": missing,
        "ok": len(missing) == 0,
    }


def _fallback_read_agent_drift(
    env: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    source: Mapping[str, Any] = env if env is not None else os.environ
    override = str(source.get("AGENT_DRIFT_PATH") or "").strip()
    if override:
        drift_path = Path(override)
    else:
        local_app_data = str(source.get("LOCALAPPDATA") or "").strip()
        if local_app_data:
            base_dir = Path(local_app_data)
        else:
            base_dir = Path.home() / "AppData" / "Local"
        drift_path = base_dir / "dream-boot" / "agent-drift.json"
    if not drift_path.is_file():
        return {"present": False, "driftedFiles": [], "driftedCount": 0}
    try:
        parsed = json.loads(drift_path.read_text(encoding="utf-8-sig"))
        items = parsed.get("driftedFiles") if isinstance(parsed, dict) else []
        drifted = items if isinstance(items, list) else []
        return {"present": True, "driftedFiles": drifted, "driftedCount": len(drifted)}
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return {
            "present": True,
            "driftedFiles": [{"file": drift_path.name, "reason": "unreadable"}],
            "driftedCount": 1,
        }


def get_backend_env_light(
    env: Optional[Mapping[str, Any]] = None,
    drift_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Return missingEnv names and nodeLight without reading any .env file."""
    ops_mod = _load_ops_env_required()
    if ops_mod is not None:
        env_result = ops_mod.check_required_env(BACKEND_DIR, env=env)
        drift_result = ops_mod.read_agent_drift(drift_path=drift_path, env=env)
    else:
        env_result = _fallback_check_required_env(BACKEND_DIR, env=env)
        drift_result = _fallback_read_agent_drift(env=env)
    missing_env = list(env_result.get("missingEnv") or [])
    drifted_count = int(drift_result.get("driftedCount") or 0)
    node_light = "amber" if (missing_env or drifted_count > 0) else "green"
    return {
        "missingEnv": missing_env,
        "nodeLight": node_light,
    }


def warn_backend_missing_env(
    env: Optional[Mapping[str, Any]] = None,
    logger_fn: Optional[Callable[[str], Any]] = None,
) -> Dict[str, Any]:
    """Log missing required setting names (never values) at startup."""
    ops_mod = _load_ops_env_required()
    emit = logger_fn if logger_fn is not None else _LOGGER.warning
    if ops_mod is not None:
        return ops_mod.log_startup_env_check(BACKEND_DIR, env=env, logger_fn=emit)
    result = _fallback_check_required_env(BACKEND_DIR, env=env)
    missing = result.get("missingEnv") or []
    if missing:
        names = ", ".join(missing)
        emit(
            f"WARNING: {result['service']} missing required env settings: "
            f"{names} (names only; expected in {result['envFile']})."
        )
    return result
