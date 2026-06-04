from __future__ import annotations

import platform
import shutil

import psutil

from ..config import AUTHORIZED_NODES
from ..status import Check
from .common import run_command, tcp_open


def _local_node() -> Check:
    disk = psutil.disk_usage("C:\\")
    data = {
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": disk.percent,
        "hostname": platform.node(),
    }
    return Check("Sabretooth", "green", "local node responsive", data)


def _ssh_node(name: str, user: str, host: str) -> Check:
    if not tcp_open(host, 22):
        return Check(name, "red", f"SSH port closed on {host}", {"host": host})
    ssh = shutil.which("ssh")
    if not ssh:
        return Check(name, "red", "ssh client missing on Sabretooth", {"host": host})
    code, stdout, stderr = run_command(
        [ssh, "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", f"{user}@{host}", "hostname"],
        timeout=10,
    )
    if code != 0:
        return Check(name, "red", "SSH command failed", {"host": host, "stderr": stderr})
    return Check(name, "green", "SSH responsive", {"host": host, "hostname": stdout})


def probe_nodes() -> list[Check]:
    checks: list[Check] = []
    for node in AUTHORIZED_NODES:
        if node.name == "Sabretooth":
            checks.append(_local_node())
        elif node.kind == "manual":
            checks.append(Check(node.name, "yellow", "manual check-in required", {"notes": node.notes}))
        elif node.host and node.user:
            checks.append(_ssh_node(node.name, node.user, node.host))
    return checks
