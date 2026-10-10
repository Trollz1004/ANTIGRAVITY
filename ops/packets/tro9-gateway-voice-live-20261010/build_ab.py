"""Build the TRO-9 gateway-vs-edge A/B evidence for 2026-10-10.

Left half  = edge-tts en-US-ChristopherNeural +12%  (today's shipping default)
Right half = OmniRoute google/gemini-2.5-flash-preview-tts  (now returns 200)

Same text both halves, 0.8s of silence between, so the user can hear the swap.
"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

HERMES = Path(r"C:\ANTIGRAVITY\ops\hermes")
PACKET = Path(__file__).resolve().parent
sys.path.insert(0, str(HERMES))

from newsvideo import tts  # noqa: E402

TEXT = (
    "Yesterday's News Today, October ninth, twenty twenty-six. "
    "Your daily recap of the day's stories in about ninety seconds. "
    "First up. An N.P.R. inspired homework assignment led a teenager to find a hidden message, "
    "a decade after a stranger's act of kindness."
)

GATEWAY_MODEL = "google/gemini-2.5-flash-preview-tts"
GATEWAY_VOICES = ["kore", "charon", "sulafat", "orus"]
EDGE_VOICE = "en-US-ChristopherNeural"
EDGE_RATE = "+12%"

RAW = PACKET / "raw"
RAW.mkdir(parents=True, exist_ok=True)


def probe(path: Path) -> dict:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "stream=codec_name,sample_rate,channels",
            "-show_entries", "format=duration,size",
            "-of", "json", str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    d = json.loads(out.stdout)
    s = d["streams"][0]
    return {
        "codec": s["codec_name"],
        "sample_rate": int(s["sample_rate"]),
        "channels": int(s["channels"]),
        "duration_s": float(d["format"]["duration"]),
        "bytes": int(d["format"]["size"]),
    }


rows = []

# --- shipping default: edge neural -------------------------------------------
edge_wav = RAW / "edge-christopher.wav"
clips = tts.synth_edge_batch([(TEXT, edge_wav)], voice=EDGE_VOICE, rate=EDGE_RATE)
rows.append(("edge", f"{EDGE_VOICE} {EDGE_RATE}", edge_wav, probe(edge_wav)))

# --- the gateway, through the pipeline's own function ------------------------
for voice in GATEWAY_VOICES:
    out = RAW / f"gateway-{voice}.wav"
    tts.synth_omniroute(TEXT, out, GATEWAY_MODEL, voice)
    rows.append(("omniroute", f"{GATEWAY_MODEL}/{voice}", out, probe(out)))

# --- A/B pairs: edge, gap, gateway ------------------------------------------
SR = 24000  # gateway native; edge gets resampled up so concat is lossless-ish
gap = RAW / "gap.wav"
subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
     f"anullsrc=r={SR}:cl=mono", "-t", "0.8", "-c:a", "pcm_s16le", str(gap)],
    check=True,
)

for voice in GATEWAY_VOICES:
    ab = PACKET / f"AB-edge-vs-google-{voice}.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error",
         "-i", str(edge_wav), "-i", str(gap), "-i", str(RAW / f"gateway-{voice}.wav"),
         "-filter_complex",
         f"[0:a]aresample={SR}[a];[a][1:a][2:a]concat=n=3:v=0:a=1[out]",
         "-map", "[out]", "-c:a", "pcm_s16le", str(ab)],
        check=True,
    )
    rows.append(("A/B", f"edge -> google/{voice}", ab, probe(ab)))

print(f"{'backend':<10} {'voice':<48} {'sr':>6} {'dur':>8} {'bytes':>10}")
for backend, voice, path, m in rows:
    print(f"{backend:<10} {voice:<48} {m['sample_rate']:>6} {m['duration_s']:>8.3f} {m['bytes']:>10}")

(PACKET / "measurements.json").write_text(
    json.dumps(
        [
            {"backend": b, "voice": v, "file": p.name, **m}
            for b, v, p, m in rows
        ],
        indent=2,
    ),
    encoding="utf-8",
)
print("\nwrote", PACKET / "measurements.json")
