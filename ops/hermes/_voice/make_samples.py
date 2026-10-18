"""Render the same news excerpt through every candidate narration voice.

TRO-9 asks for "a side-by-side sample against the SAPI baseline so the user can
hear the difference before we commit". This produces exactly that: one wav per
voice, same text, plus an ffprobe duration for each as evidence.

Run:  python ops/hermes/_voice/make_samples.py
Out:  ops/hermes/_voice/samples-<date>/
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]  # _voice -> hermes -> ops -> repo
OUT = REPO / "ops" / "hermes" / "_voice" / f"samples-{date.today():%Y%m%d}"

# The pipeline's own voice set (newsvideo/tts.py EDGE_NEWS_VOICES), with the
# current default first so it is easy to A/B against.
EDGE_VOICES = [
    ("edge-christopher-DEFAULT", "en-US-ChristopherNeural"),
    ("edge-guy", "en-US-GuyNeural"),
    ("edge-eric", "en-US-EricNeural"),
    ("edge-steffan", "en-US-SteffanNeural"),
    ("edge-roger", "en-US-RogerNeural"),
    ("edge-aria", "en-US-AriaNeural"),
    ("edge-michelle", "en-US-MichelleNeural"),
    # Not in the pipeline set, but Microsoft's current news-read voices.
    ("edge-andrew-NEW", "en-US-AndrewNeural"),
    ("edge-brian-NEW", "en-US-BrianNeural"),
]

# Real copy, taken from content/yesterday-news/20261009/script.txt and stripped
# of the HTML the feed leaves behind.
TEXT = (
    "Welcome to Yesterday's News Today for October 9th, 2026. "
    "Here are the top stories you might have missed. "
    "From Seattle's chapter of National Public Radio comes the remarkable story "
    "of the kindness of strangers, immortalized in an origami crane. "
    "The story begins with a seven-year-old in Japan who had just gotten a new bike."
)


def ffprobe_duration(path: Path) -> float | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, check=True,
        )
        return round(float(out.stdout.strip()), 3)
    except Exception:
        return None


async def render_edge(label: str, voice: str) -> Path | None:
    import edge_tts

    mp3 = OUT / f"{label}.mp3"
    try:
        await edge_tts.Communicate(TEXT, voice).save(str(mp3))
    except Exception as exc:  # a voice id Microsoft has retired
        print(f"  {label:26} FAILED  {type(exc).__name__}: {exc}")
        return None

    # Match the pipeline's wav format so the comparison is honest.
    wav = OUT / f"{label}.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3),
         "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", str(wav)],
        check=True,
    )
    mp3.unlink(missing_ok=True)
    return wav


def render_sapi() -> Path | None:
    """The robotic baseline the channel ships on when Edge is unreachable."""
    wav = OUT / "sapi-BASELINE.wav"
    raw = OUT / "_sapi_raw.wav"
    ps = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        f"$s.SetOutputToWaveFile('{raw}'); "
        f"$s.Speak({json.dumps(TEXT)}); "
        "$s.Dispose()"
    )
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                       capture_output=True, check=True)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
             "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", str(wav)],
            check=True,
        )
        raw.unlink(missing_ok=True)
        return wav
    except Exception as exc:
        print(f"  sapi-BASELINE              FAILED  {exc}")
        return None


async def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"text: {len(TEXT)} chars")
    print(f"out:  {OUT}\n")

    results: list[tuple[str, Path, float | None]] = []

    print("SAPI baseline:")
    if (wav := render_sapi()):
        d = ffprobe_duration(wav)
        print(f"  {'sapi-BASELINE':26} {d}s  {wav.stat().st_size:,} bytes")
        results.append(("sapi-BASELINE", wav, d))

    print("\nEdge voices:")
    for label, voice in EDGE_VOICES:
        if (wav := await render_edge(label, voice)):
            d = ffprobe_duration(wav)
            print(f"  {label:26} {d}s  {wav.stat().st_size:,} bytes")
            results.append((label, wav, d))

    manifest = {
        "generated": f"{date.today():%Y-%m-%d}",
        "text": TEXT,
        "wav_format": "mono 22050 Hz pcm_s16le (same as the pipeline)",
        "pipeline_default": "en-US-ChristopherNeural",
        "samples": [
            {"label": l, "file": w.name, "seconds": d} for l, w, d in results
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\n{len(results)} samples + manifest.json")
    return 0 if results else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
