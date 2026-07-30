"""SQLite persistence: checks, alert lifecycle, fix runs, pruning."""

from __future__ import annotations

from mission_control.models import (
    ALERT_ACTIVE, ALERT_ACKNOWLEDGED, ALERT_RESOLVED, CheckResult, FixRun, utcnow,
)


def _result(service="svc", ok=True, latency=5.0, detail="fine"):
    return CheckResult(service_id=service, ok=ok, latency_ms=latency, detail=detail)


class TestChecks:
    def test_record_and_read_latest_first(self, store):
        store.record_check(_result("a", detail="one"), "up")
        store.record_check(_result("a", detail="two"), "up")
        rows = store.recent_checks(limit=10)
        assert rows[0]["detail"] == "two"
        assert rows[0]["state"] == "up"
        assert rows[0]["ok"] == 1

    def test_filter_by_service(self, store):
        store.record_check(_result("a"), "up")
        store.record_check(_result("b"), "up")
        rows = store.recent_checks(service_id="b")
        assert len(rows) == 1 and rows[0]["service_id"] == "b"

    def test_prune(self, store):
        for _ in range(25):
            store.record_check(_result("a"), "up")
        deleted = store.prune_checks(keep=5)
        assert deleted == 20
        assert len(store.recent_checks(limit=100)) == 5


class TestAlerts:
    def test_open_and_fetch_active(self, store):
        alert = store.open_alert("svc", "boom")
        assert alert.id is not None and alert.status == ALERT_ACTIVE
        fetched = store.get_active_alert("svc")
        assert fetched.id == alert.id and fetched.detail == "boom"
        assert store.count_active_alerts() == 1

    def test_acknowledge(self, store):
        alert = store.open_alert("svc", "boom")
        assert store.acknowledge_alert(alert.id) is True
        assert store.get_alert(alert.id).status == ALERT_ACKNOWLEDGED
        # second ack is a no-op
        assert store.acknowledge_alert(alert.id) is False
        # acknowledged is still "active-ish" for the active-only filter
        assert store.count_active_alerts() == 1

    def test_resolve_clears_active(self, store):
        alert = store.open_alert("svc", "boom")
        store.resolve_alert(alert.id)
        assert store.get_active_alert("svc") is None
        resolved = store.get_alert(alert.id)
        assert resolved.status == ALERT_RESOLVED and resolved.resolved_at is not None
        assert store.count_active_alerts() == 0

    def test_touch_notify(self, store):
        alert = store.open_alert("svc", "boom")
        store.touch_alert_notify(alert.id)
        store.touch_alert_notify(alert.id)
        updated = store.get_alert(alert.id)
        assert updated.notify_count == 2 and updated.last_notified_at is not None

    def test_list_alerts_active_only(self, store):
        a = store.open_alert("s1", "x")
        store.open_alert("s2", "y")
        store.resolve_alert(a.id)
        active = store.list_alerts(active_only=True)
        assert [al.service_id for al in active] == ["s2"]
        assert len(store.list_alerts(active_only=False)) == 2


class TestFixRuns:
    def test_record_and_list(self, store):
        run = FixRun(service_id="svc", playbook_id="fixer", ok=True, exit_code=0,
                     duration_s=0.42, output="FIXED", requested_by="manual")
        run_id = store.record_fix_run(run)
        assert run_id >= 1
        rows = store.list_fix_runs(service_id="svc")
        assert len(rows) == 1
        assert rows[0].ok is True and rows[0].playbook_id == "fixer"
        assert rows[0].output == "FIXED"

    def test_list_all_services(self, store):
        store.record_fix_run(FixRun(service_id="a", playbook_id="p", ok=True))
        store.record_fix_run(FixRun(service_id="b", playbook_id="p", ok=False))
        assert len(store.list_fix_runs()) == 2

    def test_ts_survives_round_trip(self, store):
        before = utcnow()
        store.record_fix_run(FixRun(service_id="a", playbook_id="p", ok=True))
        ts = store.list_fix_runs()[0].ts
        assert ts >= before
