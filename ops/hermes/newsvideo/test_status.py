"""Tests for newsvideo.status classification and streak logic.

Stdlib unittest on purpose: the 2026-09-13 wipe emptied site-packages and
pytest is not installed, so this has to run on a bare Python 3.13.

    cd C:/ANTIGRAVITY/ops/hermes && python -m unittest newsvideo.test_status -v
"""

from __future__ import annotations

import contextlib
import datetime as _dt
import io
import json
import pathlib
import tempfile
import unittest

from newsvideo import status


def run_json(**over) -> dict:
    """A packet that rendered and verified cleanly, with no upload stage."""
    run = {
        "day": "20261008",
        "exit_code": 0,
        "shipped": False,
        "published": None,
        "unattended": True,
        "stages": [
            {"stage": "preflight", "status": "OK", "detail": "ffmpeg+ffprobe on PATH"},
            {"stage": "source", "status": "SKIPPED", "detail": "already sourced"},
            {"stage": "parse", "status": "OK", "detail": "5 stories"},
            {"stage": "voice", "status": "OK", "detail": "backend=edge"},
            {"stage": "render", "status": "OK", "detail": "mp4 written"},
            {"stage": "verify", "status": "OK", "detail": "18 gates passed"},
        ],
        "gates": {"passed": 18, "checks": [{"check": "parse:stories", "ok": True, "detail": "5"}]},
        "video": {"duration_s": 83.619, "width": 1080, "height": 1920},
    }
    run.update(over)
    return run


def with_upload(run_status: str, detail: str = "") -> dict:
    run = run_json()
    run["stages"].append({"stage": "upload", "status": run_status, "detail": detail})
    return run


class TestClassify(unittest.TestCase):
    def test_missing_packet_is_no_run(self):
        result, _ = status.classify(None)
        self.assertEqual(result, status.NO_RUN)

    def test_shipped_flag_wins(self):
        run = with_upload("OK")
        run["shipped"] = True
        run["published"] = {"url": "https://youtu.be/abc123"}
        result, detail = status.classify(run)
        self.assertEqual(result, status.SHIPPED)
        self.assertIn("youtu.be/abc123", detail)

    def test_upload_blocked_is_not_armed_not_failed(self):
        """The watchdog contract: BLOCKED means publishing is missing, and that
        is explicitly not a chain failure."""
        run = with_upload("BLOCKED", "no YouTube credentials (TRO-3)")
        result, detail = status.classify(run)
        self.assertEqual(result, status.NOT_ARMED)
        self.assertIn("1080x1920", detail)

    def test_upload_skipped_is_local_only_not_failed(self):
        """The regression this module exists for: `--upload off` used to report
        FAILED / stages: unknown."""
        run = with_upload("SKIPPED", "--upload off; the mp4 stays local")
        result, detail = status.classify(run)
        self.assertEqual(result, status.LOCAL_ONLY)
        self.assertIn("stays local", detail)

    def test_exit_zero_with_no_upload_stage_is_local_only(self):
        result, _ = status.classify(run_json())
        self.assertEqual(result, status.LOCAL_ONLY)

    def test_real_stage_failure_is_failed_and_names_the_stage(self):
        run = run_json()
        run["stages"].append({"stage": "render", "status": "FAILED", "detail": "ffmpeg exited 1"})
        run["exit_code"] = 4
        result, detail = status.classify(run)
        self.assertEqual(result, status.FAILED)
        self.assertIn("render", detail)
        self.assertIn("ffmpeg exited 1", detail)

    def test_failed_gate_is_failed_even_when_stages_pass(self):
        run = with_upload("BLOCKED")
        run["gates"] = {
            "passed": 17,
            "checks": [{"check": "video:duration", "ok": False, "detail": "0.0s (need >= 30)"}],
        }
        result, detail = status.classify(run)
        self.assertEqual(result, status.FAILED)
        self.assertIn("video:duration", detail)
        self.assertIn("need >= 30", detail)

    def test_zero_byte_mp4_cannot_pass_as_not_armed(self):
        """A silent 0-byte render is the failure mode TRO-7 step 2 calls out."""
        run = with_upload("BLOCKED")
        run["video"] = {"duration_s": 0.0, "size_bytes": 0, "width": 0, "height": 0}
        run["gates"] = {
            "passed": 0,
            "checks": [{"check": "video:size", "ok": False, "detail": "0 bytes"}],
        }
        result, _ = status.classify(run)
        self.assertEqual(result, status.FAILED)

    def test_nonzero_exit_with_no_recorded_failure_is_failed(self):
        run = run_json(exit_code=9)
        result, _ = status.classify(run)
        self.assertEqual(result, status.FAILED)


class TestStreak(unittest.TestCase):
    def row(self, result):
        return {"day": "20261008", "result": result, "detail": "", "unattended": True}

    def test_streak_counts_only_leading_shipped(self):
        rows = [self.row(status.SHIPPED)] * 3 + [self.row(status.NOT_ARMED)]
        self.assertEqual(status.streak(rows), 3)

    def test_streak_breaks_on_first_non_shipped(self):
        rows = [self.row(status.SHIPPED), self.row(status.NOT_ARMED), self.row(status.SHIPPED)]
        self.assertEqual(status.streak(rows), 1)

    def test_not_armed_does_not_count_toward_streak(self):
        self.assertEqual(status.streak([self.row(status.NOT_ARMED)] * 5), 0)

    def test_local_only_does_not_count_toward_streak(self):
        self.assertEqual(status.streak([self.row(status.LOCAL_ONLY)] * 5), 0)


class TestExitCode(unittest.TestCase):
    """main() must exit 0 only on a three-morning shipped streak -- that is the
    signal the watchdog uses to close TRO-7."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self._orig = status.PACKETS
        status.PACKETS = pathlib.Path(self.tmp.name)
        self.addCleanup(lambda: setattr(status, "PACKETS", self._orig))

    def write(self, day: str, run: dict):
        d = status.PACKETS / f"{status.PACKET_PREFIX}{day}"
        d.mkdir(parents=True, exist_ok=True)
        (d / "run.json").write_text(json.dumps(run), encoding="utf-8")

    def shipped_day(self, day: str):
        run = with_upload("OK")
        run["shipped"] = True
        run["published"] = {"url": f"https://youtu.be/{day}"}
        self.write(day, run)

    @staticmethod
    def quiet_main(argv=None) -> int:
        """main() prints a report; swallow it so test output stays readable."""
        with contextlib.redirect_stdout(io.StringIO()):
            return status.main(argv or [])

    def test_exits_1_when_nothing_ran(self):
        self.assertEqual(self.quiet_main(), 1)

    def test_exits_1_on_two_shipped_mornings(self):
        today = _dt.date.today()
        for back in (1, 2):
            self.shipped_day((today - _dt.timedelta(days=back)).strftime("%Y%m%d"))
        self.assertEqual(self.quiet_main(), 1)

    def test_exits_0_on_three_consecutive_shipped_mornings(self):
        today = _dt.date.today()
        for back in (1, 2, 3):
            self.shipped_day((today - _dt.timedelta(days=back)).strftime("%Y%m%d"))
        self.assertEqual(self.quiet_main(), 0)

    def test_gap_breaks_the_streak(self):
        today = _dt.date.today()
        for back in (1, 2, 4):
            self.shipped_day((today - _dt.timedelta(days=back)).strftime("%Y%m%d"))
        self.assertEqual(self.quiet_main(), 1)

    def test_unreadable_packet_is_failed_not_a_crash(self):
        today = _dt.date.today()
        day = (today - _dt.timedelta(days=1)).strftime("%Y%m%d")
        d = status.PACKETS / f"{status.PACKET_PREFIX}{day}"
        d.mkdir(parents=True, exist_ok=True)
        (d / "run.json").write_text("{not json", encoding="utf-8")
        rows = status.mornings(1)
        self.assertEqual(rows[0]["result"], status.FAILED)
        self.assertEqual(self.quiet_main(), 1)


if __name__ == "__main__":
    unittest.main()
