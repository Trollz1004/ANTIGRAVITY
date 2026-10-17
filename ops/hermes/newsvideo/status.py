"""Morning-by-morning status reader for the Hermes daily video chain.

Replaces `python -m newsvideo.daily --status`, which misclassifies a run that
rendered and verified cleanly but had publishing turned off: it reports
`FAILED -- stages: unknown` for `exit_code 0` packets whose upload stage was
SKIPPED. TRO-7's done-condition and the task watchdog's close rule both read
this output, so a false FAILED keeps a healthy chain from ever closing out.

This module is deliberately plain source. Everything else under
`ops/hermes/newsvideo/` survives only as Python 3.13 bytecode after the
2026-09-13 wipe (see ../RECOVERY-STATE.md); anything rewritten from here on
gets committed as readable `.py`.

Usage:
    python -m newsvideo.status            # last five mornings, back from yesterday
    python -m newsvideo.status --days 10
    python -m newsvideo.status --json

Exit codes:
    0  three or more consecutive shipped mornings (TRO-7 is satisfied)
    1  the streak is short of three
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parents[3]
PACKETS = REPO / "ops" / "packets"
PACKET_PREFIX = "hermes-youtube-"

#: consecutive shipped mornings TRO-7 requires before it can be closed
REQUIRED_STREAK = 3

SHIPPED = "SHIPPED"
NOT_ARMED = "NOT ARMED"
LOCAL_ONLY = "LOCAL ONLY"
FAILED = "FAILED"
NO_RUN = "NO RUN"

#: results that mean "the render chain did its job this morning". Only SHIPPED
#: counts toward the streak, but these three all prove the chain is healthy.
CHAIN_OK = (SHIPPED, NOT_ARMED, LOCAL_ONLY)


def packet_dir(day: str) -> pathlib.Path:
    return PACKETS / f"{PACKET_PREFIX}{day}"


def _stage(run: dict, name: str) -> dict | None:
    for st in run.get("stages") or ():
        if st.get("stage") == name:
            return st
    return None


#: stage statuses that are not chain failures. BLOCKED is the upload stage
#: reporting absent YouTube credentials (TRO-3) -- the watchdog contract says
#: explicitly not to treat that as a chain failure. SKIPPED is `--upload off`
#: or an already-sourced day folder.
STAGE_OK = ("OK", "SKIPPED", "BLOCKED")


def _failed_stages(run: dict) -> list[dict]:
    return [
        st
        for st in run.get("stages") or ()
        if str(st.get("status", "")).upper() not in STAGE_OK
    ]


def _failed_gates(run: dict) -> list[dict]:
    checks = (run.get("gates") or {}).get("checks") or ()
    return [c for c in checks if not c.get("ok")]


def _video_summary(run: dict) -> str:
    vid = run.get("video") or {}
    dur, w, h = vid.get("duration_s"), vid.get("width"), vid.get("height")
    if dur is None:
        return ""
    size = f"{dur}s"
    if w and h:
        size += f" {w}x{h}"
    gates = (run.get("gates") or {}).get("passed")
    if gates is not None:
        size += f", {gates} gates passed"
    return size


def classify(run: dict | None) -> tuple[str, str]:
    """Map one packet's run.json onto a result and a human detail string.

    Returns (result, detail). The ordering matters: a genuine stage or gate
    failure outranks the publishing state, so a broken render is never dressed
    up as NOT ARMED.
    """
    if run is None:
        return NO_RUN, ""

    bad_stages = _failed_stages(run)
    bad_gates = _failed_gates(run)
    if bad_stages or bad_gates:
        parts = []
        for st in bad_stages:
            parts.append(
                f"stage {st.get('stage')}: {st.get('status')}"
                + (f" -- {st.get('detail')}" if st.get("detail") else "")
            )
        for gate in bad_gates:
            parts.append(
                f"gate {gate.get('check')} failed"
                + (f" -- {gate.get('detail')}" if gate.get("detail") else "")
            )
        return FAILED, "; ".join(parts)

    vid = _video_summary(run)

    if run.get("shipped") or run.get("published"):
        published = run.get("published") or {}
        vurl = published.get("url") or published.get("video_id") or ""
        return SHIPPED, ", ".join(p for p in (vid, vurl) if p)

    upload = _stage(run, "upload") or {}
    upload_status = str(upload.get("status", "")).upper()

    if upload_status == "BLOCKED":
        # Chain worked; only publishing is missing. Blocked on TRO-3 (Google
        # sign-in producing ops/youtube/.credentials/youtube-oauth.json).
        return NOT_ARMED, ", ".join(p for p in (vid, "rendered and verified; no upload credentials") if p)

    if upload_status == "SKIPPED":
        # Operator ran with --upload off. Not a failure, and not an arming
        # problem either -- this is the state the old reader called FAILED.
        detail = upload.get("detail") or "publishing disabled for this run"
        return LOCAL_ONLY, ", ".join(p for p in (vid, detail) if p)

    if run.get("exit_code") == 0:
        return LOCAL_ONLY, ", ".join(p for p in (vid, "exit 0; no upload stage recorded") if p)

    return FAILED, f"exit {run.get('exit_code')}; no stage or gate recorded a failure"


def read_morning(day: str) -> dict:
    path = packet_dir(day) / "run.json"
    if not path.exists():
        return {
            "day": day,
            "result": NO_RUN,
            "detail": f"no packet at {packet_dir(day)}",
            "unattended": None,
        }
    try:
        run = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return {
            "day": day,
            "result": FAILED,
            "detail": f"unreadable {path}: {exc}",
            "unattended": None,
        }
    result, detail = classify(run)
    return {
        "day": day,
        "result": result,
        "detail": detail,
        "unattended": run.get("unattended"),
        "exit_code": run.get("exit_code"),
    }


def mornings(days: int, today: _dt.date | None = None) -> list[dict]:
    """Most recent `days` mornings, newest first, counting back from yesterday."""
    today = today or _dt.date.today()
    out = []
    for back in range(1, days + 1):
        d = today - _dt.timedelta(days=back)
        out.append(read_morning(d.strftime("%Y%m%d")))
    return out


def streak(rows: list[dict]) -> int:
    """Consecutive SHIPPED mornings counting back from the most recent."""
    n = 0
    for row in rows:
        if row["result"] != SHIPPED:
            break
        n += 1
    return n


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="newsvideo.status",
        description="Report the last N mornings of the Hermes daily chain.",
    )
    ap.add_argument("--days", type=int, default=5, help="how many mornings to show (default 5)")
    ap.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = ap.parse_args(argv)

    if args.days < 1:
        ap.error("--days must be at least 1")

    rows = mornings(args.days)
    got = streak(rows)

    if args.json:
        print(
            json.dumps(
                {
                    "required_streak": REQUIRED_STREAK,
                    "streak": got,
                    "satisfied": got >= REQUIRED_STREAK,
                    "mornings": rows,
                },
                indent=2,
            )
        )
    else:
        print(f"{'morning':<13}{'result':<15}detail")
        for row in rows:
            day = row["day"]
            pretty = f"{day[:4]}-{day[4:6]}-{day[6:]}"
            tag = row["result"]
            if row["result"] in CHAIN_OK and row.get("unattended"):
                tag += "*"
            print(f"{pretty:<13}{tag:<15}{row['detail']}")
        print()
        print(f"* = fired by the scheduled task rather than by hand")
        print(f"consecutive shipped mornings, counting back from yesterday: {got}")
        print(f"TRO-7 needs {REQUIRED_STREAK}; {'satisfied' if got >= REQUIRED_STREAK else 'not yet'}")
        healthy = sum(1 for r in rows if r["result"] in CHAIN_OK)
        print(f"mornings where the render chain completed: {healthy}/{len(rows)}")

    return 0 if got >= REQUIRED_STREAK else 1


if __name__ == "__main__":
    sys.exit(main())
