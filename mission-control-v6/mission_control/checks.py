"""Health probes for Mission Control v6.

Every check is a real probe against a real target — an HTTP GET, a TCP
connect, a process/table lookup, a docker query or an allow-listed probe
command. No simulated data anywhere.
"""

from __future__ import annotations

import asyncio
import shutil
import sys
import time
from typing import Optional

import httpx

from .models import CheckKind, CheckResult, ServiceSpec

_MAX_OUTPUT = 500


async def run_check(spec: ServiceSpec) -> CheckResult:
    """Execute the probe described by *spec*, honouring its timeout."""
    started = time.perf_counter()
    try:
        result = await asyncio.wait_for(_dispatch(spec, started), timeout=spec.timeout_s)
    except asyncio.TimeoutError:
        return CheckResult(
            service_id=spec.id,
            ok=False,
            latency_ms=_elapsed_ms(started),
            detail=f"timeout after {spec.timeout_s}s",
        )
    except Exception as exc:  # noqa: BLE001 — any probe failure means "down"
        return CheckResult(
            service_id=spec.id,
            ok=False,
            latency_ms=_elapsed_ms(started),
            detail=f"{type(exc).__name__}: {exc}",
        )
    return result


async def _dispatch(spec: ServiceSpec, started: float) -> CheckResult:
    if spec.kind is CheckKind.HTTP:
        return await _check_http(spec, started)
    if spec.kind is CheckKind.TCP:
        return await _check_tcp(spec, started)
    if spec.kind is CheckKind.PROCESS:
        return await _check_process(spec, started)
    if spec.kind is CheckKind.DOCKER:
        return await _check_docker(spec, started)
    if spec.kind is CheckKind.COMMAND:
        return await _check_command(spec, started)
    raise ValueError(f"unsupported check kind: {spec.kind}")


def _elapsed_ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000.0, 1)


# -- HTTP -----------------------------------------------------------------

def _status_ok(spec: ServiceSpec, status_code: int) -> bool:
    allowed = spec.expected_status
    if allowed == "any":
        return True
    if isinstance(allowed, list):
        return status_code in allowed
    return 200 <= status_code < 400


async def _check_http(spec: ServiceSpec, started: float) -> CheckResult:
    async with httpx.AsyncClient(follow_redirects=False) as client:
        response = await client.get(spec.url, timeout=spec.timeout_s)  # type: ignore[arg-type]
    ok = _status_ok(spec, response.status_code)
    return CheckResult(
        service_id=spec.id,
        ok=ok,
        latency_ms=_elapsed_ms(started),
        detail=f"HTTP {response.status_code}" + ("" if ok else f" (unexpected for {spec.url})"),
    )


# -- TCP -------------------------------------------------------------------

async def _check_tcp(spec: ServiceSpec, started: float) -> CheckResult:
    reader = None
    try:
        reader, writer = await asyncio.open_connection(spec.host, spec.port)
        writer.close()
        try:
            await writer.wait_closed()
        except (AttributeError, OSError):
            pass
        return CheckResult(spec.id, True, _elapsed_ms(started), f"{spec.host}:{spec.port} is accepting connections")
    except (ConnectionRefusedError, OSError) as exc:
        return CheckResult(spec.id, False, _elapsed_ms(started), f"connect failed: {exc}")


# -- Process -----------------------------------------------------------------

async def _check_process(spec: ServiceSpec, started: float) -> CheckResult:
    if sys.platform == "win32":
        argv = ["tasklist", "/FO", "CSV", "/NH"]
        proc = await asyncio.create_subprocess_exec(
            *argv, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
        )
        out, _ = await proc.communicate()
        haystack = out.decode(errors="replace").lower()
        ok = (spec.process or "").lower() in haystack
        detail = f"process '{spec.process}' " + ("found" if ok else "not found")
    else:
        argv = ["pgrep", "-f", spec.process or ""]
        proc = await asyncio.create_subprocess_exec(
            *argv, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
        )
        out, _ = await proc.communicate()
        pids = [p for p in out.decode(errors="replace").split() if p.strip()]
        ok = proc.returncode == 0 and bool(pids)
        detail = f"process '{spec.process}' " + (f"running (pid {pids[0]})" if ok else "not found")
    return CheckResult(spec.id, ok, _elapsed_ms(started), detail)


# -- Docker --------------------------------------------------------------------

async def _check_docker(spec: ServiceSpec, started: float) -> CheckResult:
    docker = shutil.which("docker")
    if not docker:
        return CheckResult(
            spec.id, ok=True, latency_ms=_elapsed_ms(started),
            detail="docker CLI not installed; container check skipped", skipped=True,
        )
    argv = [docker, "ps", "--filter", f"name=^/{spec.container}$", "--format", "{{.Names}}"]
    proc = await asyncio.create_subprocess_exec(
        *argv, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        message = err.decode(errors="replace").strip() or f"docker ps exited {proc.returncode}"
        return CheckResult(spec.id, False, _elapsed_ms(started), f"docker query failed: {message[:_MAX_OUTPUT]}")
    names = [line.strip() for line in out.decode(errors="replace").splitlines() if line.strip()]
    ok = spec.container in names
    detail = f"container '{spec.container}' " + ("running" if ok else "not running")
    return CheckResult(spec.id, ok, _elapsed_ms(started), detail)


# -- Command ---------------------------------------------------------------------

async def _check_command(spec: ServiceSpec, started: float) -> CheckResult:
    argv = spec.command or []
    proc = await asyncio.create_subprocess_exec(
        *argv, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
    )
    out, _ = await proc.communicate()
    tail = out.decode(errors="replace").strip()[-_MAX_OUTPUT:]
    ok = proc.returncode == 0
    detail = f"exit {proc.returncode}" + (f" — {tail}" if tail and not ok else "")
    return CheckResult(spec.id, ok, _elapsed_ms(started), detail)
