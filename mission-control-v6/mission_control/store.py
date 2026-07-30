"""SQLite persistence for checks, alerts and fix runs.

No ORM, stdlib ``sqlite3`` only. A single connection guarded by a lock keeps
the threaded FastAPI handlers and the asyncio monitor loop consistent.
"""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import ALERT_ACTIVE, ALERT_RESOLVED, Alert, CheckResult, FixRun, utcnow

_SCHEMA = """
CREATE TABLE IF NOT EXISTS check_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    service_id TEXT NOT NULL,
    state TEXT NOT NULL,
    ok INTEGER NOT NULL,
    latency_ms REAL NOT NULL,
    detail TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checks_service ON check_results(service_id, id);
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,
    status TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    resolved_at TEXT,
    detail TEXT NOT NULL DEFAULT '',
    notify_count INTEGER NOT NULL DEFAULT 0,
    last_notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_service ON alerts(service_id, status);
CREATE TABLE IF NOT EXISTS fix_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    service_id TEXT NOT NULL,
    playbook_id TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    ok INTEGER NOT NULL,
    exit_code INTEGER NOT NULL,
    duration_s REAL NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    output TEXT NOT NULL DEFAULT ''
);
"""


class Store:
    """Small synchronous store; safe to share between threads and one loop."""

    def __init__(self, db_path: Path | str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        with self._lock:
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.executescript(_SCHEMA)
            self._conn.commit()

    # -- checks ------------------------------------------------------------
    def record_check(self, result: CheckResult, state: str) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT INTO check_results(ts, service_id, state, ok, latency_ms, detail)"
                " VALUES (?,?,?,?,?,?)",
                (result.ts, result.service_id, state, int(result.ok), result.latency_ms, result.detail),
            )
            self._conn.commit()

    def recent_checks(self, limit: int = 100, service_id: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = "SELECT * FROM check_results {where} ORDER BY id DESC LIMIT ?".format(
            where="WHERE service_id = ?" if service_id else ""
        )
        params = (service_id, limit) if service_id else (limit,)
        with self._lock:
            rows = self._conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

    def prune_checks(self, keep: int = 10000) -> int:
        with self._lock:
            cur = self._conn.execute(
                "DELETE FROM check_results WHERE id NOT IN"
                " (SELECT id FROM check_results ORDER BY id DESC LIMIT ?)",
                (keep,),
            )
            self._conn.commit()
            return cur.rowcount

    # -- alerts --------------------------------------------------------------
    def open_alert(self, service_id: str, detail: str) -> Alert:
        now = utcnow()
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO alerts(service_id, status, opened_at, detail) VALUES (?,?,?,?)",
                (service_id, ALERT_ACTIVE, now, detail),
            )
            self._conn.commit()
            alert_id = int(cur.lastrowid)
        return Alert(service_id=service_id, id=alert_id, opened_at=now, detail=detail)

    def get_active_alert(self, service_id: str) -> Optional[Alert]:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM alerts WHERE service_id = ? AND status != ?"
                " ORDER BY id DESC LIMIT 1",
                (service_id, ALERT_RESOLVED),
            ).fetchone()
        return _row_to_alert(row) if row else None

    def get_alert(self, alert_id: int) -> Optional[Alert]:
        with self._lock:
            row = self._conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        return _row_to_alert(row) if row else None

    def list_alerts(self, active_only: bool = False, limit: int = 100) -> List[Alert]:
        sql = "SELECT * FROM alerts {where} ORDER BY id DESC LIMIT ?".format(
            where=f"WHERE status != '{ALERT_RESOLVED}'" if active_only else ""
        )
        with self._lock:
            rows = self._conn.execute(sql, (limit,)).fetchall()
        return [_row_to_alert(r) for r in rows]

    def acknowledge_alert(self, alert_id: int) -> bool:
        with self._lock:
            cur = self._conn.execute(
                "UPDATE alerts SET status = 'acknowledged' WHERE id = ? AND status = ?",
                (alert_id, ALERT_ACTIVE),
            )
            self._conn.commit()
            return cur.rowcount == 1

    def resolve_alert(self, alert_id: int) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE alerts SET status = ?, resolved_at = ? WHERE id = ?",
                (ALERT_RESOLVED, utcnow(), alert_id),
            )
            self._conn.commit()

    def touch_alert_notify(self, alert_id: int) -> None:
        with self._lock:
            self._conn.execute(
                "UPDATE alerts SET notify_count = notify_count + 1, last_notified_at = ? WHERE id = ?",
                (utcnow(), alert_id),
            )
            self._conn.commit()

    def count_active_alerts(self) -> int:
        with self._lock:
            row = self._conn.execute(
                "SELECT COUNT(*) AS n FROM alerts WHERE status != ?", (ALERT_RESOLVED,)
            ).fetchone()
        return int(row["n"])

    # -- fix runs --------------------------------------------------------------
    def record_fix_run(self, run: FixRun) -> int:
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO fix_runs(ts, service_id, playbook_id, requested_by, ok,"
                " exit_code, duration_s, detail, output) VALUES (?,?,?,?,?,?,?,?,?)",
                (
                    run.ts, run.service_id, run.playbook_id, run.requested_by,
                    int(run.ok), run.exit_code, run.duration_s, run.detail, run.output,
                ),
            )
            self._conn.commit()
            return int(cur.lastrowid)

    def list_fix_runs(self, service_id: Optional[str] = None, limit: int = 50) -> List[FixRun]:
        sql = "SELECT * FROM fix_runs {where} ORDER BY id DESC LIMIT ?".format(
            where="WHERE service_id = ?" if service_id else ""
        )
        params = (service_id, limit) if service_id else (limit,)
        with self._lock:
            rows = self._conn.execute(sql, params).fetchall()
        return [
            FixRun(
                id=r["id"], ts=r["ts"], service_id=r["service_id"],
                playbook_id=r["playbook_id"], requested_by=r["requested_by"],
                ok=bool(r["ok"]), exit_code=int(r["exit_code"]),
                duration_s=float(r["duration_s"]), detail=r["detail"], output=r["output"],
            )
            for r in rows
        ]

    def close(self) -> None:
        with self._lock:
            self._conn.close()


def _row_to_alert(row: sqlite3.Row) -> Alert:
    return Alert(
        id=int(row["id"]),
        service_id=row["service_id"],
        status=row["status"],
        opened_at=row["opened_at"],
        resolved_at=row["resolved_at"],
        detail=row["detail"],
        notify_count=int(row["notify_count"]),
        last_notified_at=row["last_notified_at"],
    )
