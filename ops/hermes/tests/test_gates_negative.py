#!/usr/bin/env python3
"""Negative tests for newsvideo.gates -- prove a broken artifact is rejected.

TRO-7's stated kill condition is "a silent failure that produces a 0-byte mp4".
The gates are what stop that, and `newsvideo` now survives only as bytecode
(ops/hermes/RECOVERY-STATE.md), so this file is the only executable check that
they still behave. The pre-wipe evidence for these cases was destroyed with the
artifacts it referenced.

Each case builds a genuinely broken file with ffmpeg and asserts the matching
gate raises GateError. The last case is a control: a real rendered mp4 must
pass, so a gate that rejects everything cannot score as a pass.

Plain script, no pytest -- site-packages was emptied in the same wipe and the
test has to run on a bare interpreter.

Usage:
    cd ops/hermes && python tests/test_gates_negative.py
    exit 0 = every gate behaved, exit 1 = at least one did not
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from newsvideo.gates import (  # noqa: E402
    GateError,
    GateLog,
    audio_not_silent,
    file_present,
    frames_not_blank,
    json_file_ok,
    text_file_ok,
    video_playable,
)

W, H = 1080, 1920
RENDERED = Path(__file__).resolve().parents[1] / "out"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" -- {detail}" if detail else ""))


def expect_gate_error(name: str, fn) -> None:
    """The gate must raise GateError. Passing or raising anything else is a fail."""
    try:
        fn()
    except GateError as exc:
        check(name, True, f"rejected: {str(exc)[:90]}")
    except Exception as exc:  # noqa: BLE001
        check(name, False, f"raised {type(exc).__name__} instead of GateError: {exc}")
    else:
        check(name, False, "gate PASSED a broken artifact")


def expect_ok(name: str, fn) -> None:
    try:
        fn()
    except Exception as exc:  # noqa: BLE001
        check(name, False, f"{type(exc).__name__}: {exc}")
    else:
        check(name, True)


def ffmpeg(*args: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *args],
        check=True,
        capture_output=True,
    )


def newest_rendered_mp4() -> Path | None:
    if not RENDERED.exists():
        return None
    mp4s = sorted(RENDERED.glob("*/*.mp4"), key=lambda p: p.stat().st_mtime)
    return mp4s[-1] if mp4s else None


def main() -> int:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("ffmpeg/ffprobe not on PATH -- cannot build the broken fixtures")
        return 1

    with tempfile.TemporaryDirectory(prefix="hermes-gates-") as tmpdir:
        tmp = Path(tmpdir)

        # 1. the headline failure mode: a 0-byte mp4
        zero = tmp / "zero.mp4"
        zero.touch()
        expect_gate_error(
            "0-byte mp4 rejected by file_present",
            lambda: file_present(GateLog(), zero, 100_000, "video"),
        )

        # 2. a file with real bytes that is not a playable video
        truncated = tmp / "truncated.mp4"
        good = newest_rendered_mp4()
        if good is not None:
            truncated.write_bytes(good.read_bytes()[:2048])
        else:
            truncated.write_bytes(b"\x00" * 2048)
        expect_gate_error(
            "truncated mp4 rejected by video_playable",
            lambda: video_playable(
                GateLog(), truncated, min_seconds=1, max_seconds=600, width=W, height=H
            ),
        )

        # 3. picture is fine, audio is digital silence
        silent = tmp / "silent.mp4"
        ffmpeg(
            "-f", "lavfi", "-i", f"color=c=blue:s={W}x{H}:d=3",
            "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
            "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
            str(silent),
        )
        expect_gate_error(
            "silent audio rejected by audio_not_silent",
            lambda: audio_not_silent(GateLog(), silent),
        )

        # 4. audio is fine, every frame is flat black
        black = tmp / "black.mp4"
        ffmpeg(
            "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d=3",
            "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100",
            "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
            str(black),
        )
        expect_gate_error(
            "blank frames rejected by frames_not_blank",
            lambda: frames_not_blank(GateLog(), black),
        )

        # 5. an empty script and malformed metadata must not pass either
        empty_script = tmp / "script.txt"
        empty_script.write_text("", encoding="utf-8")
        expect_gate_error(
            "empty script.txt rejected by text_file_ok",
            lambda: text_file_ok(GateLog(), empty_script, min_bytes=400),
        )

        bad_json = tmp / "metadata.json"
        bad_json.write_text("{not json", encoding="utf-8")
        expect_gate_error(
            "malformed metadata.json rejected by json_file_ok",
            lambda: json_file_ok(GateLog(), bad_json, required_keys=("title",)),
        )

        # 6. control -- the real rendered video must still pass every gate,
        #    otherwise the five results above prove nothing.
        if good is None:
            check("control: real mp4 passes", False, "no rendered mp4 under ops/hermes/out")
        else:
            log = GateLog()
            expect_ok(
                f"control: real mp4 passes all gates ({good.name})",
                lambda: (
                    file_present(log, good, 100_000, "video"),
                    video_playable(
                        log, good, min_seconds=30, max_seconds=600, width=W, height=H
                    ),
                    audio_not_silent(log, good),
                    frames_not_blank(log, good),
                ),
            )

    failed = [n for n, ok, _ in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} gate checks behaved as specified")
    if failed:
        print("NOT BEHAVING: " + ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
