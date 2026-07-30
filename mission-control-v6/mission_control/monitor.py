"""The monitor: schedules probes, tracks state transitions, fires alerts and
runs easy-button fixes (manually or automatically).

State machine per service:
    UNKNOWN -> UP / DEGRADED / DOWN
    UP/DEGRADED -> DOWN        (after fail_threshold consecutive failures)
    DOWN -> UP                 (alert resolved, recovery notification)
    DOWN -> DOWN (repeat)      (cooldown-gated "STILL DOWN" notifications)
    * -> FIXING                (while a playbook executes; state restored after)
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import checks, remediation
from .config import Config
from .models import (
    Alert, CheckResult, FixRun, ServiceSpec, ServiceState, utcnow,
)
from .notify import (
    NotifierHub,
    build_autofix_recovery_message,
    build_down_message,
    build_recovery_message,
)
from .store import Store


@dataclass
class ServiceRuntime:
    spec: ServiceSpec
    state: ServiceState = ServiceState.UNKNOWN
    fails: int = 0
    last_result: Optional[CheckResult] = None
    checked_at: Optional[str] = None
    alert: Optional[Alert] = None
    down_since: Optional[str] = None
    first_fail_ts: Optional[str] = None
    last_notify_mono: float = 0.0
    ever_up: bool = False
    fixing: bool = False
    last_fix: Optional[FixRun] = None


class Monitor:
    """Coordinates checks, persistence, notifications and remediation."""

    def __init__(self, config: Config, store: Store, hub: NotifierHub):
        self.config = config
        self.store = store
        self.hub = hub
        self.base_url = config.server.resolved_base_url()
        self.boot_mono = time.monotonic()
        self.runtimes: Dict[str, ServiceRuntime] = {
            spec.id: ServiceRuntime(spec=spec) for spec in config.services
        }
        self._tasks: List[asyncio.Task] = []
        self._stopping = False

    # ------------------------------------------------------------------ #
    # lifecycle
    # ------------------------------------------------------------------ #

    async def start(self) -> None:
        """Spawn the per-service probe loops (no-op when monitoring disabled)."""
        if not self.config.server.monitor_enabled:
            return
        self._stopping = False
        for index, runtime in enumerate(self.runtimes.values()):
            self._tasks.append(asyncio.create_task(self._loop(runtime, index)))

    async def stop(self) -> None:
        self._stopping = True
        for task in self._tasks:
            task.cancel()
        for task in self._tasks:
            try:
                await task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
        self._tasks.clear()

    async def _loop(self, runtime: ServiceRuntime, index: int) -> None:
        await asyncio.sleep(min(index * 0.5, 5.0))  # stagger the first sweep
        while not self._stopping:
            try:
                await self.run_service_once(runtime.spec.id)
            except asyncio.CancelledError:
                raise
            except Exception:  # noqa: BLE001 — a buggy check must never kill the loop
                pass
            try:
                await asyncio.sleep(runtime.spec.interval_s)
            except asyncio.CancelledError:
                raise

    # ------------------------------------------------------------------ #
    # probing + transitions
    # ------------------------------------------------------------------ #

    def _grace_open(self, runtime: ServiceRuntime) -> bool:
        """Only page once boot grace expired — unless the service was seen UP
        already (a *regression* after healthy operation always alerts)."""
        if runtime.ever_up:
            return True
        return (time.monotonic() - self.boot_mono) >= self.config.server.startup_grace_s

    async def run_service_once(self, service_id: str) -> CheckResult:
        runtime = self.runtimes[service_id]
        spec = runtime.spec
        result = await checks.run_check(spec)
        runtime.last_result = result
        runtime.checked_at = utcnow()

        if result.skipped:  # e.g. docker absent — record but never transitions
            self.store.record_check(result, runtime.state.value)
            return result

        if result.ok:
            await self._handle_ok(runtime, result)
        else:
            await self._handle_failure(runtime, result)
        self.store.record_check(result, runtime.state.value)
        return result

    async def _handle_ok(self, runtime: ServiceRuntime, result: CheckResult) -> None:
        spec = runtime.spec
        runtime.fails = 0
        runtime.first_fail_ts = None
        was_down = runtime.state in (ServiceState.DOWN, ServiceState.FIXING)
        if runtime.spec.latency_warn_ms and result.latency_ms > runtime.spec.latency_warn_ms:
            runtime.state = ServiceState.DEGRADED
        else:
            runtime.state = ServiceState.UP
        if not was_down:
            runtime.ever_up = True
        if was_down and runtime.alert is not None:
            alert = runtime.alert
            self.store.resolve_alert(alert.id)  # type: ignore[arg-type]
            runtime.alert = None
            runtime.down_since = None
            if spec.notify and alert.notify_count > 0:
                message = build_recovery_message(
                    spec, self.base_url,
                    down_since=alert.opened_at or "unknown",
                    recovered_detail=result.detail,
                )
                await self.hub.broadcast(message)

    async def _handle_failure(self, runtime: ServiceRuntime, result: CheckResult) -> None:
        spec = runtime.spec
        runtime.fails += 1
        if runtime.fails == 1:
            runtime.first_fail_ts = utcnow()
        if runtime.state is not ServiceState.DOWN:
            if runtime.fails < spec.fail_threshold:
                return  # below threshold: keep last known state, no page yet
            runtime.state = ServiceState.DOWN
            runtime.down_since = runtime.first_fail_ts or utcnow()

        # state == DOWN here
        if not spec.expected or not spec.notify:
            return  # tracked on the board, but nothing "shouldn't be down"
        if runtime.alert is None:
            if not self._grace_open(runtime):
                return
            runtime.alert = await self._open_alert_with_optional_autofix(runtime, result)
            return
        # repeat notifications, cooldown-gated
        if time.monotonic() - runtime.last_notify_mono >= spec.notify_cooldown_s:
            pb = remediation.playbook_for_service(spec, self.config.playbooks)
            message = build_down_message(
                spec, result, pb, self.base_url,
                down_since=runtime.down_since or "unknown", repeat=True,
            )
            await self._notify(runtime, message)

    async def _open_alert_with_optional_autofix(self, runtime: ServiceRuntime,
                                                result: CheckResult) -> Optional[Alert]:
        spec = runtime.spec
        auto_note = ""
        if spec.auto_fix and spec.playbook:
            fix_run = await self._do_fix(spec.id, requested_by="auto")
            if fix_run.ok:
                recheck = await checks.run_check(spec)
                self.store.record_check(recheck, runtime.state.value)
                if recheck.ok:
                    runtime.fails = 0
                    runtime.state = (ServiceState.DEGRADED
                                     if spec.latency_warn_ms and recheck.latency_ms > spec.latency_warn_ms
                                     else ServiceState.UP)
                    runtime.ever_up = True
                    runtime.last_result = recheck
                    runtime.down_since = None
                    message = build_autofix_recovery_message(
                        spec, fix_run.output or fix_run.detail, recheck.detail, self.base_url
                    )
                    await self.hub.broadcast(message)
                    # persist a pre-resolved alert so the incident stays auditable
                    alert = self.store.open_alert(spec.id, "auto-fixed before paging: " + result.detail)
                    self.store.resolve_alert(alert.id)  # type: ignore[arg-type]
                    return None
                auto_note = f"auto-fix ran ({fix_run.playbook_id}) but the service is still down: {fix_run.detail}"
            else:
                auto_note = f"auto-fix attempted and failed: {fix_run.detail}"

        alert = self.store.open_alert(spec.id, auto_note or result.detail)
        pb = remediation.playbook_for_service(spec, self.config.playbooks)
        message = build_down_message(
            spec, result, pb, self.base_url,
            down_since=runtime.down_since or "unknown", auto_fix_note=auto_note,
        )
        await self._notify(runtime, message, alert=alert)
        return alert

    async def _notify(self, runtime: ServiceRuntime, message, alert: Optional[Alert] = None) -> None:
        active = alert or runtime.alert
        await self.hub.broadcast(message)
        runtime.last_notify_mono = time.monotonic()
        if active and active.id is not None:
            self.store.touch_alert_notify(active.id)
            # keep the in-memory copy in sync so recovery notices can key off it
            active.notify_count += 1
            active.last_notified_at = utcnow()

    # ------------------------------------------------------------------ #
    # remediation
    # ------------------------------------------------------------------ #

    async def _do_fix(self, service_id: str, requested_by: str) -> FixRun:
        runtime = self.runtimes[service_id]
        spec = runtime.spec
        pb = remediation.playbook_for_service(spec, self.config.playbooks)
        if pb is None:
            return FixRun(
                service_id=service_id, playbook_id=spec.playbook or "", ok=False,
                detail="no playbook configured for this service", requested_by=requested_by,
            )
        if runtime.fixing:
            return FixRun(
                service_id=service_id, playbook_id=pb.id, ok=False,
                detail="a fix is already running for this service", requested_by=requested_by,
            )
        recent = self.store.list_fix_runs(service_id=service_id, limit=1)
        if recent:
            from datetime import datetime, timezone
            try:
                last_dt = datetime.fromisoformat(recent[0].ts)
                if last_dt.tzinfo is None:
                    last_dt = last_dt.replace(tzinfo=timezone.utc)
                age = (datetime.now(timezone.utc) - last_dt).total_seconds()
            except (ValueError, TypeError):
                age = pb.cooldown_s + 1
            if age < pb.cooldown_s:
                return FixRun(
                    service_id=service_id, playbook_id=pb.id, ok=False,
                    detail=f"cooldown: wait {int(pb.cooldown_s - age)}s before re-running this fix",
                    requested_by=requested_by,
                )
        runtime.fixing = True
        previous = runtime.state
        runtime.state = ServiceState.FIXING
        try:
            run = await remediation.run_playbook(pb, service_id=service_id, requested_by=requested_by)
        finally:
            runtime.fixing = False
            runtime.state = previous if runtime.state is ServiceState.FIXING else runtime.state
        run.id = self.store.record_fix_run(run)
        runtime.last_fix = run
        return run

    async def fix(self, service_id: str, requested_by: str = "manual") -> Dict[str, Any]:
        """Easy button: run the playbook, then immediately re-probe the service."""
        if service_id not in self.runtimes:
            raise KeyError(service_id)
        run = await self._do_fix(service_id, requested_by)
        result = await self.run_service_once(service_id)
        runtime = self.runtimes[service_id]
        return {
            "fix": run.to_dict(),
            "result": result.to_dict(),
            "state": runtime.state.value,
        }

    # ------------------------------------------------------------------ #
    # snapshots
    # ------------------------------------------------------------------ #

    async def run_once_all(self) -> Dict[str, CheckResult]:
        results: Dict[str, CheckResult] = {}
        outcomes = await asyncio.gather(
            *(self.run_service_once(spec.id) for spec in self.config.services),
            return_exceptions=True,
        )
        for spec, outcome in zip(self.config.services, outcomes):
            if isinstance(outcome, CheckResult):
                results[spec.id] = outcome
        return results

    def snapshot(self) -> Dict[str, Any]:
        services = [self._service_snapshot(rt) for rt in self.runtimes.values()]
        counts = {"up": 0, "down": 0, "degraded": 0, "unknown": 0}
        for service in services:
            state = service["state"]
            if state == ServiceState.UP.value:
                counts["up"] += 1
            elif state == ServiceState.DOWN.value or state == ServiceState.FIXING.value:
                counts["down"] += 1
            elif state == ServiceState.DEGRADED.value:
                counts["degraded"] += 1
            else:
                counts["unknown"] += 1
        return {
            "services": services,
            "counts": counts,
            "active_alerts": self.store.count_active_alerts(),
            "now": utcnow(),
            "base_url": self.base_url,
        }

    def _service_snapshot(self, runtime: ServiceRuntime) -> Dict[str, Any]:
        spec = runtime.spec
        result = runtime.last_result
        return {
            "id": spec.id,
            "name": spec.name,
            "group": spec.group,
            "kind": spec.kind.value,
            "expected": spec.expected,
            "state": runtime.state.value,
            "detail": result.detail if result else "never checked",
            "latency_ms": result.latency_ms if result else None,
            "checked_at": runtime.checked_at,
            "down_since": runtime.down_since,
            "playbook": spec.playbook,
            "auto_fix": spec.auto_fix,
            "fixing": runtime.fixing,
            "link_url": spec.link_url,
            "interval_s": spec.interval_s,
            "alert_id": runtime.alert.id if runtime.alert else None,
            "last_fix": runtime.last_fix.to_dict() if runtime.last_fix else None,
        }
