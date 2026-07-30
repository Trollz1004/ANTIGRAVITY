"""Allow-listed remediation ("the easy button").

Playbooks come exclusively from the config file — the API can never receive or
execute an arbitrary command. Each command is an argv list run with
``create_subprocess_exec`` (no shell interpolation of anything external).
"""

from __future__ import annotations

import asyncio
import shlex
import sys
import time
from typing import List, Optional

from .models import FixRun, Playbook, ServiceSpec

_MAX_OUTPUT = 4000


def platform_key() -> str:
    """'windows' on win32, 'linux' everywhere else."""
    return "windows" if sys.platform == "win32" else "linux"


def playbook_for_service(spec: ServiceSpec, playbooks: dict) -> Optional[Playbook]:
    if not spec.playbook:
        return None
    return playbooks.get(spec.playbook)


def commands_for_platform(pb: Playbook, platform: Optional[str] = None) -> List[List[str]]:
    platform = platform or platform_key()
    return pb.commands.get(platform) or pb.commands.get("all") or []


def _display(argv: List[str]) -> str:
    return " ".join(shlex.quote(part) for part in argv)


def render_playbook_text(pb: Optional[Playbook], platform: Optional[str] = None) -> str:
    """Human-readable numbered steps embedded in notifications and the UI."""
    if pb is None:
        return "No automatic fix is configured for this service — investigate manually."
    lines = [f"Playbook: {pb.id} — {pb.description}"]
    if pb.script:
        lines.append(f"Script  : {pb.script}")
    commands = commands_for_platform(pb, platform)
    if not commands:
        lines.append(f"(no commands registered for platform '{platform or platform_key()}')")
    for idx, argv in enumerate(commands, start=1):
        lines.append(f"  {idx}. {_display(argv)}")
    return "\n".join(lines)


async def run_playbook(pb: Playbook, *, service_id: str = "", requested_by: str = "manual",
                       platform: Optional[str] = None) -> FixRun:
    """Run every command of the playbook sequentially; stop at the first failure."""
    started = time.perf_counter()
    commands = commands_for_platform(pb, platform)
    if not commands:
        return FixRun(
            service_id=service_id, playbook_id=pb.id, ok=False, exit_code=127,
            duration_s=round(time.perf_counter() - started, 3),
            detail=f"playbook has no commands for platform '{platform or platform_key()}'",
            requested_by=requested_by,
        )

    chunks: List[str] = []
    exit_code = 0
    ok = True
    for argv in commands:
        chunks.append(f"$ {_display(argv)}")
        try:
            proc = await asyncio.create_subprocess_exec(
                *argv,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            out, _ = await asyncio.wait_for(proc.communicate(), timeout=pb.timeout_s)
        except FileNotFoundError as exc:
            ok = False
            exit_code = 127
            chunks.append(f"command not found: {exc}")
            break
        except asyncio.TimeoutError:
            ok = False
            exit_code = 124
            chunks.append(f"timed out after {pb.timeout_s}s")
            break
        text = out.decode(errors="replace").strip()
        if text:
            chunks.append(text)
        if proc.returncode != 0:
            ok = False
            exit_code = int(proc.returncode or 1)
            break

    output = "\n".join(chunks)[-_MAX_OUTPUT:]
    detail = "ok" if ok else f"failed with exit {exit_code}"
    return FixRun(
        service_id=service_id,
        playbook_id=pb.id,
        ok=ok,
        exit_code=exit_code,
        duration_s=round(time.perf_counter() - started, 3),
        output=output,
        detail=detail,
        requested_by=requested_by,
    )
