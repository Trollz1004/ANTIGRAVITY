from __future__ import annotations

import base64
from pathlib import Path

from ..config import AUTHORIZED_NODES, MASTER_ENV_NAME, SABRETOOTH_VAULT
from ..secrets import VaultEnv
from ..status import Check
from .common import run_command


GRAPH_KEYS = (
    "MICROSOFT_GRAPH_TENANT_ID",
    "MICROSOFT_GRAPH_CLIENT_ID",
    "MICROSOFT_GRAPH_CLIENT_SECRET",
)


def _folder_stats(path: Path) -> dict[str, int | float | bool]:
    if not path.exists():
        return {"exists": False, "file_count": 0, "total_size": 0, "master_mtime": 0}
    files = [item for item in path.rglob("*") if item.is_file()]
    master = path / MASTER_ENV_NAME
    return {
        "exists": True,
        "file_count": len(files),
        "total_size": sum(item.stat().st_size for item in files),
        "master_mtime": master.stat().st_mtime if master.exists() else 0,
    }


def _encode_powershell(script: str) -> str:
    return base64.b64encode(script.encode("utf-16-le")).decode("ascii")


def probe_vault_sync() -> list[Check]:
    baseline = _folder_stats(SABRETOOTH_VAULT)
    checks = [
        Check(
            "Sabretooth vault",
            "green" if baseline["exists"] and baseline["master_mtime"] else "red",
            "canonical vault metadata",
            baseline,
        )
    ]
    for node in AUTHORIZED_NODES:
        if node.name == "Sabretooth" or node.kind == "manual" or not node.host or not node.user or not node.vault_path:
            continue
        command = (
            "$p='{0}'; $m=Join-Path $p '{1}'; "
            "[pscustomobject]@{{exists=(Test-Path $p); master=(Test-Path $m)}} | ConvertTo-Json -Compress"
        ).format(node.vault_path, MASTER_ENV_NAME)
        code, stdout, stderr = run_command(
            [
                "ssh",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=5",
                f"{node.user}@{node.host}",
                "powershell.exe",
                "-NoProfile",
                "-EncodedCommand",
                _encode_powershell(command),
            ],
            timeout=12,
        )
        if code != 0:
            checks.append(Check(f"{node.name} vault", "yellow", "vault sync unknown; SSH probe failed", {"stderr": stderr}))
        else:
            ok = '"exists":true' in stdout.lower() and '"master":true' in stdout.lower()
            checks.append(Check(f"{node.name} vault", "green" if ok else "red", "authorized-node vault presence", {"raw": stdout}))
    return checks


def probe_graph_device_list(vault: VaultEnv | None = None) -> Check:
    vault = vault or VaultEnv()
    state = vault.public_key_state(GRAPH_KEYS)
    if not all(state.values()):
        return Check("Microsoft Graph devices", "yellow", "missing Microsoft Graph credentials", {"credential_keys_present": state})
    return Check("Microsoft Graph devices", "yellow", "Graph device API not yet wired", {"credential_keys_present": state})


def probe_vault_feature() -> Check:
    # Windows does not expose Personal Vault lock policy through a stable local CLI.
    return Check("Personal Vault feature", "yellow", "manual Microsoft account verification required", {})
