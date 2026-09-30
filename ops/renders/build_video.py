"""Build the FluidStack 9:16 vertical short from the four cards.

Output: 2026-09-30-fluidstack.mp4 — 1080x1920, 30fps, h264 + silent aac.
Each card is held for its own beat and joined with short crossfades, which is
what the hand-built original did; this script exists so the video is
reproducible after the cards change rather than being a one-off artifact.

Usage:  python build_video.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "cards")
OUT = os.path.join(HERE, "2026-09-30-fluidstack.mp4")

FPS = 30
W, H = 1080, 1920
FADE = 0.5  # seconds of crossfade between cards

# Card order and how long each is held, in seconds.
BEATS = [
    ("01_hook.png", 4.5),
    ("02_problem.png", 4.5),
    ("03_solution.png", 4.5),
    ("04_cta.png", 5.0),
]


def ffmpeg_bin() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        sys.exit("ffmpeg not found on PATH")
    return exe


def main() -> int:
    missing = [c for c, _ in BEATS if not os.path.exists(os.path.join(CARDS, c))]
    if missing:
        sys.exit(f"missing cards (run build_cards.py first): {missing}")

    ffmpeg = ffmpeg_bin()
    inputs: list[str] = []
    filters: list[str] = []

    for i, (name, secs) in enumerate(BEATS):
        inputs += ["-loop", "1", "-t", str(secs), "-i", os.path.join(CARDS, name)]
        filters.append(
            f"[{i}:v]scale={W}:{H},setsar=1,fps={FPS},"
            f"format=yuv420p,trim=duration={secs},setpts=PTS-STARTPTS[v{i}]"
        )

    # Chain crossfades: v0 xf v1 -> c0, c0 xf v2 -> c1, ...
    prev = "v0"
    offset = BEATS[0][1] - FADE
    for i in range(1, len(BEATS)):
        label = f"c{i}" if i < len(BEATS) - 1 else "vout"
        filters.append(
            f"[{prev}][v{i}]xfade=transition=fade:duration={FADE}:offset={offset:.2f}[{label}]"
        )
        prev = label
        offset += BEATS[i][1] - FADE

    # Silent audio track, same length as the video.
    total = sum(s for _, s in BEATS) - FADE * (len(BEATS) - 1)
    inputs += ["-f", "lavfi", "-t", f"{total:.2f}", "-i", "anullsrc=r=44100:cl=stereo"]
    audio_idx = len(BEATS)
    filters.append(f"[{audio_idx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[aout]")

    cmd = [
        ffmpeg, "-y",
        *inputs,
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        "-movflags", "+faststart",
        OUT,
    ]
    print("building", os.path.basename(OUT))
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2500:])
        return r.returncode

    size = os.path.getsize(OUT)
    print(f"wrote {OUT} ({size} bytes, {total:.2f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
