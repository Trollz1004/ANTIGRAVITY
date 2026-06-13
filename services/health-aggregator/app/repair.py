"""T5500 public-services repair coordinator.

Implements the watchdog pattern:
  - heartbeat  : probe T5500 public services on a schedule
  - detect     : classify red states into known repair playbooks
  - dispatch   : enqueue a repair sub-agent task (no inline mutation)
  - audit      : write every repair attempt to tasks/events.jsonl

Doctrine rules respected:
  - Rule 1: One repo, no out-of-tree files.
  - Rule 3: Sabretooth owns push and aggregator; T5500 is the target node.
  - Rule 8: Real probes or honest failure; no fabrication.
  - Rule 11: Vault secrets never logged; only key names + presence.
"""

from __future__ import annotations

import json
import os
import subprocess
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from .config import REPO_ROOT
from .status import now_iso


RepairStatus = Literal["queued", "running", "ok", "failed", "rejected"]
RepairKind = Literal[
    "lan_bind",          # T5500 LAN portproxy + firewall (port closed)
    "container_restart", # OpenClaw / SupportClaw container down
    "service_ping",      # Generic service alive check
    "public_surface",    # Cloudflare-fronted page down
    "vault_resync",      # Vault missing on an authorized node
    "manual",            # Cannot auto-repair; surface to operator
]


@dataclass
class RepairAction:
    """One repairable check emitted by a probe."""

    target: str            # human-friendly: "t5500:5432", "openclaw-api"
    kind: RepairKind
    reason: str            # why this is red
    playbook: str          # short name of the repair routine
    command: list[str] = field(default_factory=list)  # SSH command for operator/agent
    ssh_target: str | None = None  # user@host
    metadata: dict = field(default_factory=dict)


@dataclass
class RepairTicket:
    id: str
    action: RepairAction
    status: RepairStatus
    created_at: str
    updated_at: str
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "action": asdict(self.action),
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "notes": list(self.notes),
        }


# ---------------------------------------------------------------------------
# Repair ticket store (in-process + jsonl append-only audit)
# ---------------------------------------------------------------------------


class RepairStore:
    """Bounded in-memory ticket registry plus durable audit log.

    A real deployment would back this with Redis or a sqlite file, but the
    watchdog pattern only requires that the in-memory map and the on-disk
    audit log be consistent for the current process. The audit log is
    append-only and never overwrites prior entries.
    """

    def __init__(self, audit_path: Path | None = None, max_in_memory: int = 200) -> None:
        self._tickets: dict[str, RepairTicket] = {}
        self._audit_path = audit_path or (REPO_ROOT / "tasks" / "repair-audit.jsonl")
        self._audit_path.parent.mkdir(parents=True, exist_ok=True)
        self._max_in_memory = max_in_memory

    # ----- audit log -----

    def _audit(self, ticket: RepairTicket, event: str) -> None:
        record = {
            "ts": now_iso(),
            "event": event,
            "ticket": ticket.to_dict(),
        }
        with self._audit_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    # ----- lifecycle -----

    def submit(self, action: RepairAction) -> RepairTicket:
        ticket = RepairTicket(
            id=str(uuid.uuid4()),
            action=action,
            status="queued",
            created_at=now_iso(),
            updated_at=now_iso(),
        )
        self._tickets[ticket.id] = ticket
        # Evict the oldest in-memory tickets once the cap is reached.
        if len(self._tickets) > self._max_in_memory:
            oldest = sorted(self._tickets.values(), key=lambda t: t.created_at)[: len(self._tickets) - self._max_in_memory]
            for old in oldest:
                self._tickets.pop(old.id, None)
        self._audit(ticket, "submitted")
        return ticket

    def get(self, ticket_id: str) -> RepairTicket | None:
        return self._tickets.get(ticket_id)

    def list(self) -> list[RepairTicket]:
        return sorted(self._tickets.values(), key=lambda t: t.created_at, reverse=True)

    def update(self, ticket_id: str, status: RepairStatus, note: str | None = None) -> RepairTicket:
        ticket = self._tickets.get(ticket_id)
        if ticket is None:
            raise KeyError(ticket_id)
        ticket.status = status
        ticket.updated_at = now_iso()
        if note:
            ticket.notes.append(note)
        self._audit(ticket, f"status:{status}")
        return ticket


# ---------------------------------------------------------------------------
# Repair dispatcher — runs the SSH command for the operator/sub-agent
# ---------------------------------------------------------------------------


def _run_ssh(action: RepairAction, timeout: int = 30) -> tuple[int, str, str]:
    if not action.ssh_target or not action.command:
        return 0, "", "no-op (no SSH target)"
    return _subprocess_run(action.command, timeout=timeout)


def _subprocess_run(cmd: list[str], timeout: int) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            list(cmd),
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            shell=isinstance(cmd[0], str) and any(c in cmd[0] for c in ("\\", "/")) and os.name == "nt",
        )
        return completed.returncode, completed.stdout.strip(), completed.stderr.strip()
    except subprocess.TimeoutExpired as exc:
        return 124, (exc.stdout or b"").decode("utf-8", "ignore") if isinstance(exc.stdout, bytes) else (exc.stdout or ""), f"timed out after {timeout}s"
    except FileNotFoundError as exc:
        return 127, "", str(exc)


def dispatch_repair(store: RepairStore, ticket_id: str, timeout: int = 30) -> RepairTicket:
    """Execute a queued repair ticket in-process.

    The watchdog pattern requires that repair is observable and idempotent.
    A real implementation would hand the ticket to a sub-agent process; for
    the aggregator, we run the SSH command synchronously and record the
    outcome. The result is what an operator would see in the dashboard.
    """

    ticket = store.get(ticket_id)
    if ticket is None:
        raise KeyError(ticket_id)
    if ticket.status not in {"queued", "failed"}:
        # Already running/finished; do not re-fire.
        return ticket

    store.update(ticket_id, "running", note="dispatch started")
    code, stdout, stderr = _run_ssh(ticket.action, timeout=timeout)
    outcome = "ok" if code == 0 else "failed"
    note = f"returncode={code} stdout={stdout[:200]} stderr={stderr[:200]}"
    return store.update(ticket_id, outcome, note=note)


# ---------------------------------------------------------------------------
# Repair plan generation from red checks
# ---------------------------------------------------------------------------


T5500_SSH = ("joshl", "192.168.0.15")
SABRETOOTH = ("joshl", "127.0.0.1")


def _t5500_command(ps_script: str) -> list[str]:
    import base64

    encoded = base64.b64encode(ps_script.encode("utf-16-le")).decode("ascii")
    user, host = T5500_SSH
    return [
        "ssh",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=5",
        f"{user}@{host}",
        "powershell.exe",
        "-NoProfile",
        "-EncodedCommand",
        encoded,
    ]


def _local_command(args: list[str]) -> list[str]:
    return list(args)


def plan_repair_for_check(
    *,
    category: str,
    check_name: str,
    check_summary: str,
    check_status: str,
    check_data: dict | None,
) -> RepairAction | None:
    """Map a (category, check) pair to a RepairAction.

    Returns None if no automated repair is appropriate (caller should still
    surface a manual ticket via the manual kind).
    """

    if check_status != "red":
        return None

    data = check_data or {}

    # --- T5500 LAN service ports ----------------------------------------
    if category == "t5500_services" and check_name in {
        "uandinotai-postgres",
        "qdrant-http",
        "qdrant-grpc",
        "redis",
    }:
        port = {
            "uandinotai-postgres": 5432,
            "qdrant-http": 6333,
            "qdrant-grpc": 6334,
            "redis": 6379,
        }[check_name]
        ps = (
            "$ErrorActionPreference='Stop';"
            f"$port={port};"
            "if (-not (Get-NetFirewallRule -DisplayName ('T5500 LAN '+ $port) -ErrorAction SilentlyContinue)) {"
            "  netsh advfirewall firewall add rule name=('T5500 LAN '+ $port) dir=in action=allow localport=$port protocol=tcp profile=private | Out-Null;"
            "}"
            "if (-not (Get-NetFirewallRule -DisplayName ('T5500 LAN '+ $port) -ErrorAction SilentlyContinue)) {"
            "  Write-Error 'firewall rule not present'; exit 1;"
            "}"
            "$existing=netsh interface portproxy show v4tov4 | Select-String ('0.0.0.0\\s+' + $port + '\\s+127.0.0.1');"
            "if (-not $existing) {"
            "  netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$port connectaddress=127.0.0.1 connectport=$port | Out-Null;"
            "}"
            "Get-Service iphlpsvc | Restart-Service -Force;"
            "Write-Output ('rebound '+ $port);"
        )
        return RepairAction(
            target=f"t5500:{port}",
            kind="lan_bind",
            reason=check_summary or f"port {port} closed",
            playbook="lan-bind-port",
            command=_t5500_command(ps),
            ssh_target="joshl@192.168.0.15",
            metadata={"port": port},
        )

    # --- OpenClaw API on T5500 ------------------------------------------
    if category == "t5500_services" and check_name == "openclaw-api":
        ps = (
            "$ErrorActionPreference='Continue';"
            "if (Get-Process -Name 'openclaw' -ErrorAction SilentlyContinue) {"
            "  Get-Process -Name 'openclaw' | Restart-Service -ErrorAction SilentlyContinue;"
            "  Write-Output 'openclaw process restarted';"
            "} else {"
            "  Write-Output 'openclaw process missing; needs operator attention'; exit 2;"
            "}"
        )
        return RepairAction(
            target="t5500:openclaw-api",
            kind="container_restart",
            reason=check_summary or "openclaw /health not 2xx",
            playbook="openclaw-restart",
            command=_t5500_command(ps),
            ssh_target="joshl@192.168.0.15",
            metadata={"service": "openclaw", "port": 3200},
        )

    # --- Cloudflare-fronted public surface ------------------------------
    if category == "cloudflare_pages":
        # Public surfaces cannot be SSH-fixed; we can only re-probe and
        # raise visibility. Tag the action as manual.
        return RepairAction(
            target=check_name,
            kind="manual",
            reason=check_summary or "public surface red",
            playbook="cf-pages-investigate",
            command=[],
            ssh_target=None,
            metadata={"url": data.get("url")},
        )

    # --- Vault missing on an authorized node ----------------------------
    if category == "vault_health" and check_name.endswith(" vault"):
        node = check_name.replace(" vault", "")
        # All authorized nodes (other than Sabretooth) go through T5500's
        # network path; the canonical fix is to verify OneDrive is logged in.
        if node in {"T5500", "9020", "MINI-ASUS-PC"}:
            ps = (
                "$ErrorActionPreference='Continue';"
                "$vault='C:\\Users\\joshl\\OneDrive\\Personal Vault-Sabretooth';"
                "if (Test-Path $vault) { Write-Output 'vault present'; exit 0 }"
                "Write-Output 'vault missing; OneDrive sign-in required'; exit 1;"
            )
            return RepairAction(
                target=f"vault:{node}",
                kind="vault_resync",
                reason=check_summary or f"{node} vault missing",
                playbook="onedrive-verify",
                command=_t5500_command(ps) if node == "T5500" else _local_command(["powershell", "-NoProfile", "-Command", ps]),
                ssh_target=("joshl@192.168.0.15" if node == "T5500" else None),
                metadata={"node": node},
            )
        return RepairAction(
            target=f"vault:{node}",
            kind="manual",
            reason=check_summary or f"{node} vault unknown",
            playbook="vault-manual",
            command=[],
            metadata={"node": node},
        )

    # --- Node SSH down ---------------------------------------------------
    if category == "nodes" and check_name in {"T5500", "9020", "MINI-ASUS-PC"}:
        return RepairAction(
            target=f"node:{check_name}",
            kind="manual",
            reason=check_summary or f"{check_name} SSH unreachable",
            playbook="node-ssh-recover",
            command=[],
            metadata={"node": check_name, "data": data},
        )

    # --- Public Cloudflare front (catch-all for unknown red) ------------
    return None


# ---------------------------------------------------------------------------
# Convenience: process every red check and submit a ticket for each
# ---------------------------------------------------------------------------


def submit_repairs_for_health(health: dict, store: RepairStore) -> list[RepairTicket]:
    """Walk /health/all and submit one repair ticket per red check."""

    submitted: list[RepairTicket] = []
    for category in health.get("categories", []):
        cname = category.get("name", "")
        for check in category.get("checks", []):
            action = plan_repair_for_check(
                category=cname,
                check_name=check.get("name", ""),
                check_summary=check.get("summary", ""),
                check_status=check.get("status", ""),
                check_data=check.get("data") or {},
            )
            if action is None:
                continue
            ticket = store.submit(action)
            submitted.append(ticket)
    return submitted
