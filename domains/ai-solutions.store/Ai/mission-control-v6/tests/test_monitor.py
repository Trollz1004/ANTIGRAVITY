"""Monitor state machine: transitions, alerts, cooldowns, auto-fix, snapshots."""

from __future__ import annotations

import asyncio
import sys

import pytest

from mission_control.config import build_config
from mission_control.models import ServiceState
from mission_control.monitor import Monitor
from mission_control.notify import build_hub
from mission_control.store import Store

from conftest import flag_command, make_raw, read_jsonl


def run(coro):
    return asyncio.run(coro)


def _mk_monitor(raw):
    cfg = build_config(raw)
    store = Store(cfg.state_db_abs())
    hub = build_hub(cfg.notifiers, resolve_path=cfg.notifier_path_abs)
    return Monitor(cfg, store, hub), cfg


class TestTransitions:
    def test_healthy_service_goes_up(self, monitor):
        result = run(monitor.run_service_once("svc-up"))
        assert result.ok is True
        rt = monitor.runtimes["svc-up"]
        assert rt.state is ServiceState.UP and rt.ever_up is True
        assert monitor.store.recent_checks(service_id="svc-up")

    def test_threshold_then_alert_then_file_notification(self, monitor, tmp_path):
        # threshold is 2: first failure tracks, second opens the episode
        run(monitor.run_service_once("svc-down"))
        rt1 = monitor.runtimes["svc-down"]
        assert rt1.state is not ServiceState.DOWN and monitor.store.count_active_alerts() == 0

        run(monitor.run_service_once("svc-down"))
        rt = monitor.runtimes["svc-down"]
        assert rt.state is ServiceState.DOWN
        assert monitor.store.count_active_alerts() == 1

        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert len(rows) == 1
        text = rows[0]["text"]
        assert "EASY BUTTON" in text
        assert "curl -X POST http://mc-test/api/services/svc-down/fix" in text
        assert rows[0]["subject"].startswith("DOWN: Svc Down")

    def test_standby_service_never_pages(self, monitor, tmp_path):
        run(monitor.run_service_once("svc-standby"))  # threshold 1, expected=false
        rt = monitor.runtimes["svc-standby"]
        assert rt.state is ServiceState.DOWN
        assert monitor.store.count_active_alerts() == 0
        assert read_jsonl(tmp_path / "alerts.jsonl") == []

    def test_recovery_closes_alert_and_notifies(self, tmp_path):
        flag = tmp_path / "up.flag"
        raw = make_raw(tmp_path, services=[{
            "id": "flaky", "name": "Flaky", "group": "T", "kind": "command",
            "command": flag_command(flag), "interval_s": 1, "timeout_s": 15,
            "fail_threshold": 1, "playbook": "fixer", "notify_cooldown_s": 0, "auto_fix": True,
        }])
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("flaky"))  # auto_fix prints FIXED but flag still absent
        rt = monitor.runtimes["flaky"]
        assert rt.state is ServiceState.DOWN
        assert monitor.store.count_active_alerts() == 1

        flag.write_text("up")  # operator fixed the root cause
        result = run(monitor.run_service_once("flaky"))
        assert result.ok is True and rt.state is ServiceState.UP
        assert monitor.store.count_active_alerts() == 0

        rows = read_jsonl(tmp_path / "alerts.jsonl")
        subjects = [r["subject"] for r in rows]
        assert any(s.startswith("DOWN: Flaky") for s in subjects)
        assert any(s.startswith("RECOVERED: Flaky") for s in subjects)

    def test_still_down_repeat_after_cooldown(self, monitor, tmp_path):
        run(monitor.run_service_once("svc-down"))
        run(monitor.run_service_once("svc-down"))  # alert opens (notify_cooldown_s = 0)
        run(monitor.run_service_once("svc-down"))  # cooldown elapsed instantly → repeat
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        subjects = [r["subject"] for r in rows]
        assert any(s.startswith("STILL DOWN") for s in subjects)
        alert = monitor.store.get_active_alert("svc-down")
        assert alert.notify_count >= 2

    def test_degraded_on_latency_budget(self, tmp_path):
        raw = make_raw(tmp_path, services=[{
            "id": "busy", "name": "Busy", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "pass"], "interval_s": 1, "timeout_s": 15,
            "fail_threshold": 1, "latency_warn_ms": 0.000001,
        }])
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("busy"))
        assert monitor.runtimes["busy"].state is ServiceState.DEGRADED

    def test_cli_time_grace_defers_first_boot_alert(self, tmp_path):
        raw = make_raw(tmp_path)
        raw["server"]["startup_grace_s"] = 99999
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("svc-down"))
        run(monitor.run_service_once("svc-down"))
        rt = monitor.runtimes["svc-down"]
        assert rt.state is ServiceState.DOWN
        assert monitor.store.count_active_alerts() == 0  # swallowed by boot grace
        # ...but a regression after being healthy must page immediately
        rt.ever_up = True
        run(monitor.run_service_once("svc-down"))
        assert monitor.store.count_active_alerts() == 1


class TestAutoFix:
    def test_autofix_success_skips_page(self, tmp_path):
        flag = tmp_path / "healed.flag"
        raw = make_raw(tmp_path,
                       services=[{
                           "id": "svc", "name": "Svc", "group": "T", "kind": "command",
                           "command": flag_command(flag), "interval_s": 1, "timeout_s": 15,
                           "fail_threshold": 1, "auto_fix": True, "playbook": "healer",
                       }],
                       playbooks={
                           "healer": {
                               "description": "creates the flag (heals the check)",
                               "cooldown_s": 0,
                               "commands": {"all": [[sys.executable, "-c",
                                                     f"import pathlib; pathlib.Path(r'{flag}').write_text('x')"]]},
                           }
                       })
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("svc"))
        rt = monitor.runtimes["svc"]
        assert rt.state is ServiceState.UP and monitor.store.count_active_alerts() == 0
        # audit: one fix run, one pre-resolved alert, one AUTO-FIXED notification
        assert len(monitor.store.list_fix_runs("svc")) == 1
        alerts = monitor.store.list_alerts(active_only=False)
        assert len(alerts) == 1 and alerts[0].status == "resolved"
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert any(r["subject"].startswith("AUTO-FIXED: Svc") for r in rows)

    def test_autofix_failure_pages_with_note(self, tmp_path):
        raw = make_raw(tmp_path, services=[{
            "id": "svc", "name": "Svc", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "import sys; sys.exit(1)"],
            "interval_s": 1, "timeout_s": 15, "fail_threshold": 1,
            "auto_fix": True, "playbook": "breaker", "notify_cooldown_s": 9999,
        }])
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("svc"))
        rt = monitor.runtimes["svc"]
        assert rt.state is ServiceState.DOWN and monitor.store.count_active_alerts() == 1
        alert = monitor.store.get_active_alert("svc")
        assert "auto-fix attempted and failed" in alert.detail
        rows = read_jsonl(tmp_path / "alerts.jsonl")
        assert "auto-fix attempted" in rows[0]["text"].lower()

    def test_autofix_ok_but_still_down(self, tmp_path):
        raw = make_raw(tmp_path, services=[{
            "id": "svc", "name": "Svc", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "import sys; sys.exit(1)"],
            "interval_s": 1, "timeout_s": 15, "fail_threshold": 1,
            "auto_fix": True, "playbook": "fixer", "notify_cooldown_s": 9999,
        }])
        monitor, _ = _mk_monitor(raw)
        run(monitor.run_service_once("svc"))
        alert = monitor.store.get_active_alert("svc")
        assert alert is not None and "auto-fix ran (fixer) but the service is still down" in alert.detail


class TestManualFix:
    def test_fix_runs_playbook_and_rechecks(self, monitor):
        run(monitor.run_service_once("svc-down"))  # fails = 1
        run(monitor.run_service_once("svc-down"))  # fails = 2 → state DOWN
        outcome = run(monitor.fix("svc-down", requested_by="api"))
        assert outcome["fix"]["ok"] is True
        assert "FIXED" in outcome["fix"]["output"]
        assert outcome["state"] == "down"  # the probe still fails afterwards
        runs = monitor.store.list_fix_runs("svc-down")
        assert runs[0].requested_by == "api" and runs[0].ok is True

    def test_fix_without_playbook(self, monitor):
        outcome = run(monitor.fix("svc-up"))
        assert outcome["fix"]["ok"] is False
        assert "no playbook configured" in outcome["fix"]["detail"]

    def test_fix_unknown_service(self, monitor):
        with pytest.raises(KeyError):
            run(monitor.fix("ghost"))

    def test_cooldown_blocks_rapid_repeats(self, tmp_path):
        raw = make_raw(tmp_path, playbooks={
            "slow-pb": {
                "description": "x", "cooldown_s": 9999,
                "commands": {"all": [[sys.executable, "-c", "pass"]]},
            }
        }, services=[{
            "id": "svc", "name": "Svc", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "import sys; sys.exit(1)"],
            "interval_s": 1, "timeout_s": 15, "fail_threshold": 1, "playbook": "slow-pb",
        }])
        monitor, _ = _mk_monitor(raw)
        first = run(monitor.fix("svc"))
        assert first["fix"]["ok"] is True
        second = run(monitor.fix("svc"))
        assert second["fix"]["ok"] is False and "cooldown" in second["fix"]["detail"]

    def test_concurrent_fix_guarded(self, tmp_path):
        raw = make_raw(tmp_path, playbooks={
            "slow-runner": {
                "description": "sleeps", "cooldown_s": 0,
                "commands": {"all": [[sys.executable, "-c", "import time; time.sleep(1.5)"]]},
            }
        }, services=[{
            "id": "svc", "name": "Svc", "group": "T", "kind": "command",
            "command": [sys.executable, "-c", "pass"],
            "interval_s": 1, "timeout_s": 15, "fail_threshold": 1, "playbook": "slow-runner",
        }])
        monitor, _ = _mk_monitor(raw)

        async def _both():
            return await asyncio.gather(
                monitor.fix("svc"), monitor.fix("svc"), return_exceptions=False)

        first, second = run(_both())
        details = sorted([first["fix"]["detail"], second["fix"]["detail"]])
        assert any("already running" in d for d in details)


class TestSnapshot:
    def test_snapshot_counts(self, monitor):
        run(monitor.run_service_once("svc-up"))
        run(monitor.run_service_once("svc-down"))
        run(monitor.run_service_once("svc-down"))
        snap = monitor.snapshot()
        assert snap["counts"]["up"] == 1
        assert snap["counts"]["down"] == 1
        assert snap["active_alerts"] == 1
        svc = next(s for s in snap["services"] if s["id"] == "svc-down")
        assert svc["state"] == "down" and svc["playbook"] == "fixer"
        assert svc["down_since"] is not None
        assert snap["base_url"] == "http://mc-test"

    def test_run_once_all(self, monitor):
        results = run(monitor.run_once_all())
        assert results["svc-up"].ok is True
        assert results["svc-down"].ok is False


class TestLoopLifecycle:
    def test_start_stop_with_monitoring_disabled_is_noop(self, monitor):
        run(monitor.start())
        assert monitor._tasks == []
        run(monitor.stop())

    def test_disabled_monitor_start_keeps_no_tasks(self, tmp_path):
        monitor, _ = _mk_monitor(make_raw(tmp_path))
        run(monitor.start())
        run(monitor.stop())

    def test_enable_monitor_spawns_and_stops_tasks(self, tmp_path):
        raw = make_raw(tmp_path)
        raw["server"]["monitor_enabled"] = True
        monitor, cfg = _mk_monitor(raw)

        async def _cycle():
            await monitor.start()
            assert len(monitor._tasks) == len(cfg.services)
            await asyncio.sleep(2.5)  # let several probe rounds land
            await monitor.stop()
            assert monitor._tasks == []

        run(_cycle())
        # probes really ran while the loop lived
        assert monitor.store.recent_checks(limit=10)
